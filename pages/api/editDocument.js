// pages/api/editDocument.js

import { db } from '../../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res
      .status(405)
      .json({ success: false, error: 'Method not allowed' });
  }

  const { documentId, prompt } = req.body;
  if (!documentId || !prompt) {
    return res
      .status(400)
      .json({ success: false, error: 'Missing documentId or prompt' });
  }

  try {
    // 1) Load the existing letter
    const docRef = doc(db, 'documents', documentId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return res
        .status(404)
        .json({ success: false, error: 'Document not found' });
    }
    const data = snap.data();
    const existing = data.generatedLetter;
    if (!existing) {
      return res
        .status(400)
        .json({ success: false, error: 'No letter to edit yet' });
    }

    // 2) Ask OpenAI to revise it
    const messages = [
      {
        role: 'system',
        content: `You are a senior attorney's assistant.  You will revise the client's conditional acceptance letter according to the user's instructions.  Maintain a respectful, firm legal tone.`
      },
      {
        role: 'user',
        content: `Here is the current letter:\n\n${existing}\n\nPlease revise it as follows:\n${prompt}`
      }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages
    });
    const edited = completion.choices[0].message.content.trim();

    // 3) Persist the edited letter back into Firestore
    await updateDoc(docRef, {
      generatedLetter: edited,
      updatedAt: new Date().toISOString()
    });

    // 4) Return it to the client
    return res.status(200).json({
      success: true,
      editedLetter: edited
    });
  } catch (err) {
    console.error('[editDocument] error:', err);
    return res
      .status(500)
      .json({ success: false, error: 'Internal server error' });
  }
}

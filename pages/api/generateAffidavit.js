import OpenAI from 'openai';
import { db } from '../../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { documentId } = req.body;
    
    if (!documentId) {
      return res.status(400).json({ error: 'Document ID is required' });
    }

    // Fetch document from Firestore
    const docRef = doc(db, 'documents', documentId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const docData = docSnap.data();
    const formData = docData.fullFormData || {};
    
    // Extract relevant information
    const { personalInfo } = formData;
    const { fullName, email, phoneNumber, address } = personalInfo || {};
    
    // Build system prompt for affidavit generation
    const systemPrompt = `
You are a legal professional drafting a sworn affidavit based on client information.

Create a factual, sworn-style affidavit that follows these guidelines:
- Begin with "I, [fullName], attest under penalty of perjury that..."
- State the facts in a clear, concise, first-person manner
- Include only factual information that the person has direct knowledge of
- Organize facts chronologically
- Include specific dates and interactions where available
- Reference relevant documents, communications, and events
- Include a statement about the truthfulness of all assertions
- End with appropriate language indicating this is sworn under penalty of perjury
- Format as a formal legal document

Focus on the facts of the case regarding the client's interactions with ${formData.platformInfo?.platformName || 'the platform'}, their account issues, and attempts to resolve the situation.
`.trim();

    const userPrompt = `Client Data:\n${JSON.stringify(formData, null, 2)}

Create a detailed affidavit covering all the relevant facts about this situation. The client has provided the above information - transform it into a proper sworn affidavit format.`;

    // Call OpenAI
    let affidavitText = '';
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      });
      affidavitText = completion.choices[0].message.content.trim();
    } catch (openaiError) {
      console.error('[OpenAI generation error]', openaiError);
      affidavitText =
        '⚠️ Automated affidavit generation failed due to API limits. ' +
        'Please edit this template manually or try again later.';
    }

    // Save to Firestore
    await updateDoc(docRef, {
      affidavitText,
      updatedAt: new Date().toISOString()
    });

    // Return success
    return res.status(200).json({
      success: true,
      affidavitText
    });

  } catch (error) {
    console.error('[API] Error generating affidavit:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to generate affidavit document' 
    });
  }
} 
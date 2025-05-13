// pages/api/createDocument.js
import { readFileSync } from 'fs';
import { join }         from 'path';
import OpenAI           from 'openai';
import { db }           from '../../config/firebase';
import { collection, addDoc } from 'firebase/firestore';

// 1) Load your plain‑text examples once at startup:
const letterExamples = readFileSync(
  join(process.cwd(), 'data', 'letterExamples.txt'),
  'utf8'
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 2) Unpack & validate form data
    const formData = req.body;
    const { personalInfo, platformInfo } = formData;
    const { fullName, email }            = personalInfo || {};
    const { platformName }               = platformInfo  || {};

    if (!fullName || !email || !platformName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 3) Build a richer system prompt using your real examples
    const systemPrompt = `
You are a **senior attorney** at a top‑tier law firm specializing in recovering client funds via conditional acceptance notices.

Below are **real examples** of prior letters (for tone, structure & legal framing). Do **not** quote them verbatim—model your new draft on their style:

${letterExamples}

**Your assignment**:
- Draft a **conditional acceptance** letter based on the client’s form data.
- **Assert** conditional acceptance of the platform’s policies, under proof of claim.
- **Demand** specific actions or clarifications (e.g. “Please identify your security concerns…”).
- **Outline** legal, procedural, and financial timelines.
- **Reference** the relevant platform’s own terms & policies based on real world online published information and include all accessed links at the end of the letter (e.g. “Per Binance’s Terms §9.3…”).
- **Emphasize** the financial and reputational impact on the client.
- Maintain a respectful but firm legal tone.
- **Include** a clear deadline for response.

If the client’s answers are incomplete or vague, infer reasonable details from typical platform behavior.
`.trim();

    const userPrompt = `Client Data:\n${JSON.stringify(formData, null, 2)}`;

    // 4) Call OpenAI
    let generatedLetter = '';
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt }
        ]
      });
      generatedLetter = completion.choices[0].message.content.trim();
    } catch (openaiError) {
      console.error('[OpenAI generation error]', openaiError);
      generatedLetter =
        '⚠️ Automated document generation failed due to API limits. ' +
        'Our team will draft this manually and upload shortly.';
    }

    // 5) Save everything to Firestore
    const payload = {
      fullName,
      email,
      platformName,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      fullFormData: formData,
      generatedLetter,
      generatedAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, 'documents'), payload);
    console.log('[API] Document created with ID:', docRef.id);

    // 6) Return success + letter
    return res.status(200).json({
      success: true,
      documentId: docRef.id,
      generatedLetter
    });

  } catch (error) {
    console.error('[API] Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create document' });
  }
}

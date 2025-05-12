import { db } from '../../config/firebase';
import { collection, addDoc } from 'firebase/firestore';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const formData = req.body;
    const { personalInfo, platformInfo } = formData;
    const { fullName, email } = personalInfo || {};
    const { platformName } = platformInfo || {};

    // Minimal validation
    if (!fullName || !email || !platformName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

       // Step 1: Generate the letter using OpenAI
       const systemPrompt = `
       You are a legal assistant at a law firm that specializes in recovering client accounts and withheld funds through conditional acceptance notices.
       
       Your task is to draft a well-structured conditional acceptance letter using the client's form data. These letters:
       - Assert conditional acceptance of platform policies under proof of claim
       - Demand specific action or clarification
       - Outline legal, procedural, and financial timelines
       - Reference any regulations, laws, or platform violations
       - Emphasize financial and business impact on the client
       - Maintain a respectful but firm legal tone
       - Include a deadline and demand for response
       
       If the client's answers are vague or missing, intelligently infer details based on common platform behavior (e.g., crypto exchanges freezing funds without cause, payment platforms rejecting ID documents, etc.).
       
       The tone should be persuasive, logical, and structured like prior examples.
       `;
       
           const userPrompt = `Client Data:\n${JSON.stringify(formData, null, 2)}`;
       
           let generatedLetter = '';
           try {
             const completion = await openai.chat.completions.create({
               model: 'gpt-4o-mini',
               messages: [
                 { role: 'system', content: systemPrompt },
                 { role: 'user', content: userPrompt }
               ]
             });
             generatedLetter = completion.choices[0].message.content.trim();
           } catch (openaiError) {
             console.error('[OpenAI generation error]', openaiError);
             // fallback text if API fails or you hit quota
             generatedLetter =
               '⚠️ Automated document generation failed due to API limits. ' +
               'Our team will draft this manually and upload shortly.';
           }
       
           // Step 2: Save everything to Firestore
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
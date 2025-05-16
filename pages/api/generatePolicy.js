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
    
    // Extract platform information
    const { platformInfo, accountInfo } = formData;
    const { platformName } = platformInfo || {};
    
    // Use our policy search API to get live policy information
    let policyText = '';
    try {
      // First try to fetch live policy information from the web
      const searchResponse = await fetch(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : ''}/api/searchPolicies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ platformName })
      });
      
      const searchResult = await searchResponse.json();
      
      if (searchResult.success) {
        policyText = searchResult.policyData;
        console.log('[API] Successfully retrieved live policy data');
      } else {
        // If live search fails, fall back to OpenAI generation without web data
        console.log('[API] Live policy search failed, falling back to OpenAI generation');
        
        // Build system prompt for policy generation
        const systemPrompt = `
You are a legal expert on platform terms of service and policies. Your task is to analyze a case and provide relevant policy information.

Based on the client's information, create a comprehensive policy reference document that:
1. Identifies the relevant ${platformName || 'platform'} policies that apply to this case
2. Extracts and quotes the exact terms that are relevant (include section numbers)
3. ALWAYS includes the full arbitration clause(s) from the platform's terms
4. Formats these as a professional reference section with proper citations
5. Where available, includes links to the official policy pages
6. Organizes the information in a logical sequence
7. Focuses especially on policies regarding:
  - Account freezing/suspension
  - ID verification
  - Fund withdrawal restrictions
  - User rights and responsibilities
  - Dispute resolution procedures
  - Any other policies relevant to the specific case

This document will be used as a reference for legal action, so accuracy and completeness are essential.
`.trim();

        const userPrompt = `Client Data:\n${JSON.stringify(formData, null, 2)}

Create a detailed policy reference document for ${platformName || 'the platform'} based on this case. Focus on the most relevant policies that apply to the client's situation and ensure you include the complete arbitration clause.`;

        // Call OpenAI
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        });
        policyText = searchResult.fallbackText || completion.choices[0].message.content.trim();
      }
    } catch (error) {
      console.error('[Policy generation error]', error);
      policyText =
        '⚠️ Automated policy document generation failed. ' +
        'Please edit this template manually or try again later.';
    }

    // Save to Firestore
    await updateDoc(docRef, {
      policyText,
      updatedAt: new Date().toISOString()
    });

    // Return success
    return res.status(200).json({
      success: true,
      policyText
    });

  } catch (error) {
    console.error('[API] Error generating policy document:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to generate policy document' 
    });
  }
} 
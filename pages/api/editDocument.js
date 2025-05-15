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

  const { content, instruction, docType, targetMode } = req.body;
  if (!content || !instruction) {
    return res
      .status(400)
      .json({ success: false, error: 'Missing content or instruction' });
  }

  try {
    // Improved detection of targeted edits
    const targetedKeywords = [
      'line', 'sentence', 'paragraph', 'section', 'specific', 
      'change this', 'modify this', 'fix this', 'correct this',
      'replace', 'update this part', 'edit this part', 'rewrite this',
      'first', 'second', 'third', 'fourth', 'last'
    ];
    
    // Tone/style change keywords
    const toneKeywords = [
      'tone', 'style', 'formal', 'informal', 'professional', 
      'friendly', 'assertive', 'concise', 'detailed', 'make it more',
      'sound more', 'change the overall', 'rewrite the entire'
    ];
    
    // Check if instruction contains any of the targeted keywords
    const instructionLower = instruction.toLowerCase();
    const isTargetedEditByKeyword = targetedKeywords.some(keyword => 
      instructionLower.includes(keyword)
    );
    
    // Check if instruction is about tone/style changes
    const isToneChange = toneKeywords.some(keyword => 
      instructionLower.includes(keyword)
    );
    
    // Final determination of whether this is a targeted edit
    // If not explicitly a tone change and either explicitly a targeted edit or contains targeted keywords
    const isTargetedEdit = !isToneChange && (targetMode === 'targeted' || isTargetedEditByKeyword);

    // If it's a targeted edit, provide just one targeted edit option
    if (isTargetedEdit) {
      const messages = [
        {
          role: 'system',
          content: `You are a senior legal editor specializing in precise document edits.
IMPORTANT: You are being asked to make a SPECIFIC, TARGETED edit to a portion of this document, NOT rewrite the entire document.
- Focus ONLY on the specific part mentioned in the user's instruction
- Do NOT rewrite sections that weren't mentioned
- Do NOT change the overall tone or style unless specifically requested
- Do NOT add new content beyond what was requested
- Maintain the original document structure
- When in doubt, make minimal changes that fulfill the exact request`
        },
        {
          role: 'user',
          content: `Here is the current document:\n\n${content}\n\nI need you to make this specific edit:\n${instruction}\n\nRemember, ONLY change the specific part I mentioned, leave everything else exactly as is.`
        }
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages
      });
      const edited = completion.choices[0].message.content.trim();

      return res.status(200).json({
        success: true,
        explanation: `I've made the specific edit you requested.`,
        options: [
          {
            id: 'targeted',
            title: 'Targeted Edit',
            editedText: edited
          }
        ]
      });
    }
    // For general style/tone changes, provide multiple style options ONLY if explicitly requested
    else if (isToneChange) {
      // 1) Ask OpenAI to revise the content
      const messages = [
        {
          role: 'system',
          content: `You are a senior attorney's assistant. You are being asked to revise the ENTIRE document according to general instructions about tone or content. Apply the requested changes throughout the document consistently. Maintain a professional legal tone appropriate for the document type.`
        },
        {
          role: 'user',
          content: `Here is the current document:\n\n${content}\n\nPlease revise the entire document as follows:\n${instruction}`
        }
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages
      });
      const edited = completion.choices[0].message.content.trim();

      // Generate different style options
      const formalStyle = edited;
      
      // Create a more concise version 
      const conciseMessages = [
        {
          role: 'system',
          content: `You are a senior legal assistant. Create a more concise version of this document.`
        },
        {
          role: 'user',
          content: `Make this document more concise while preserving all key points:\n\n${edited}`
        }
      ];
      
      const conciseCompletion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: conciseMessages
      });
      
      const conciseStyle = conciseCompletion.choices[0].message.content.trim();
      
      // Create a more assertive version
      const firmMessages = [
        {
          role: 'system',
          content: `You are a senior legal assistant. Create a more firm and assertive version of this document.`
        },
        {
          role: 'user',
          content: `Make this document more firm and assertive while preserving all key points:\n\n${edited}`
        }
      ];
      
      const firmCompletion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: firmMessages
      });
      
      const firmStyle = firmCompletion.choices[0].message.content.trim();

      // Return the options to the client
      return res.status(200).json({
        success: true,
        explanation: `I've edited the document with different tone/style options. Please choose the one that best fits your needs.`,
        options: [
          {
            id: 'formal',
            title: 'Formal Style',
            editedText: formalStyle
          },
          {
            id: 'firm',
            title: 'Firm Style',
            editedText: firmStyle
          },
          {
            id: 'concise',
            title: 'Concise Style',
            editedText: conciseStyle
          }
        ]
      });
    }
    // For general edits that are not specifically tone changes or targeted edits
    else {
      const messages = [
        {
          role: 'system',
          content: `You are a senior attorney's assistant. You are being asked to make changes to the document based on the user's instructions. Apply the requested changes while maintaining the document's existing style and structure as much as possible.`
        },
        {
          role: 'user',
          content: `Here is the current document:\n\n${content}\n\nPlease make the following changes:\n${instruction}`
        }
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages
      });
      const edited = completion.choices[0].message.content.trim();

      return res.status(200).json({
        success: true,
        explanation: `I've made the changes you requested.`,
        options: [
          {
            id: 'edit',
            title: 'Suggested Edit',
            editedText: edited
          }
        ]
      });
    }
  } catch (err) {
    console.error('[editDocument] error:', err);
    return res
      .status(500)
      .json({ success: false, error: 'Internal server error' });
  }
}

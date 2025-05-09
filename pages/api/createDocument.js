import { db } from '../../config/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[API] Received submission request');

    const formData = req.body;

    // Validate essential fields
    const { fullName, email, documentType } = formData;
    if (!fullName || !email || !documentType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Log what's about to be submitted
    console.log('[API] Submitting to Firestore with:', {
      fullName, email, documentType
    });

    const docRef = await addDoc(collection(db, 'documents'), {
      fullName,
      email,
      documentType,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      fullFormData: formData
    });

    console.log('[API] Document successfully created with ID:', docRef.id);

    return res.status(200).json({ 
      success: true, 
      documentId: docRef.id 
    });
  } catch (error) {
    console.error('[API] Error creating document:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to create document' 
    });
  }
}

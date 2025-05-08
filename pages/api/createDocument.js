import { db } from '../../config/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, documentType, description, file } = req.body;

    const docRef = await addDoc(collection(db, 'documents'), {
      name,
      email,
      documentType,
      description,
      file,
      status: 'Pending',
      createdAt: new Date().toISOString()
    });

    return res.status(200).json({ 
      success: true, 
      documentId: docRef.id 
    });
  } catch (error) {
    console.error('Error creating document:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to create document' 
    });
  }
} 
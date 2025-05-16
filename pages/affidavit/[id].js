import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Button
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import DocumentEditor from '../../components/DocumentEditor';
import Navbar from '../../components/Navbar';

export default function AffidavitEditor() {
  const router = useRouter();
  const { id } = router.query;
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDocument() {
      if (!id) return;
      try {
        setLoading(true);
        const docRef = doc(db, 'documents', id);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          setError('Document not found');
          return;
        }
        
        const docData = docSnap.data();
        
        // Generate affidavitText if it doesn't exist
        if (!docData.affidavitText) {
          try {
            // Call API to generate affidavit
            const response = await fetch('/api/generateAffidavit', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ documentId: id }),
            });
            
            if (!response.ok) {
              throw new Error('Failed to generate affidavit');
            }
            
            const result = await response.json();
            docData.affidavitText = result.affidavitText;
          } catch (genErr) {
            console.error('Error generating affidavit:', genErr);
            // Fallback to standard template
            await updateDoc(docRef, {
              affidavitText: 'Standard affidavit template. Edit this template with the specific details for this case.',
              updatedAt: new Date().toISOString()
            });
            docData.affidavitText = 'Standard affidavit template. Edit this template with the specific details for this case.';
          }
        }
        
        setDocument({
          id: docSnap.id,
          ...docData,
          // Set generatedLetter to affidavitText so DocumentEditor works with this field
          generatedLetter: docData.affidavitText
        });
      } catch (err) {
        console.error('Error fetching document:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDocument();
  }, [id]);

  // Save custom handler to override DocumentEditor's save function
  const handleSave = async (newContent, chatHistory) => {
    try {
      const docRef = doc(db, 'documents', id);
      await updateDoc(docRef, {
        affidavitText: newContent,
        chatHistory: chatHistory || document.chatHistory || [],
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (err) {
      console.error('Error saving affidavit:', err);
      return false;
    }
  };

  const handleBack = () => {
    router.push('/admin');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Navbar />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
            Back to Admin
          </Button>
          <Typography variant="h4" color="error" align="center" sx={{ mt: 4 }}>
            Error: {error}
          </Typography>
        </Container>
      </Box>
    );
  }

  return (
    <Box>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
          Back to Admin
        </Button>
        <Typography variant="h4" component="h1" gutterBottom>
          Affidavit Editor
        </Typography>
        {document && (
          <DocumentEditor 
            document={document} 
            onSaveOverride={handleSave}
            fieldLabel="Affidavit Text"
          />
        )}
      </Container>
    </Box>
  );
} 
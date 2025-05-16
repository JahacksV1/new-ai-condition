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

export default function PolicyEditor() {
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
        
        // Generate policyText if it doesn't exist
        if (!docData.policyText) {
          try {
            // Call API to generate policy
            const response = await fetch('/api/generatePolicy', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ documentId: id }),
            });
            
            if (!response.ok) {
              throw new Error('Failed to generate policy document');
            }
            
            const result = await response.json();
            docData.policyText = result.policyText;
          } catch (genErr) {
            console.error('Error generating policy document:', genErr);
            // Fallback to standard template
            await updateDoc(docRef, {
              policyText: 'Standard policy template. Edit this template with the specific policy details for this case.',
              updatedAt: new Date().toISOString()
            });
            docData.policyText = 'Standard policy template. Edit this template with the specific policy details for this case.';
          }
        }
        
        setDocument({
          id: docSnap.id,
          ...docData,
          // Set generatedLetter to policyText so DocumentEditor works with this field
          generatedLetter: docData.policyText
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
        policyText: newContent,
        chatHistory: chatHistory || document.chatHistory || [],
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (err) {
      console.error('Error saving policy:', err);
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
          Policy Editor
        </Typography>
        {document && (
          <DocumentEditor 
            document={document} 
            onSaveOverride={handleSave}
            fieldLabel="Policy Text"
          />
        )}
      </Container>
    </Box>
  );
} 
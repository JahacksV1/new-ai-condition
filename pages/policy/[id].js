import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Refresh as RefreshIcon } from '@mui/icons-material';
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
  const [regenerating, setRegenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showPromptDialog, setShowPromptDialog] = useState(false);

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

  const handleRegeneratePolicy = async () => {
    try {
      setShowPromptDialog(true);
    } catch (err) {
      console.error('Error regenerating policy:', err);
    }
  };

  const handleRegenerateConfirm = async () => {
    setShowPromptDialog(false);
    setRegenerating(true);
    
    try {
      const response = await fetch('/api/generatePolicy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          documentId: id,
          customPrompt 
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to regenerate policy document');
      }
      
      const result = await response.json();
      
      // Update document
      if (result.policyText) {
        setDocument({
          ...document,
          generatedLetter: result.policyText,
          policyText: result.policyText
        });
      }
    } catch (err) {
      console.error('Error regenerating policy:', err);
    } finally {
      setRegenerating(false);
      setCustomPrompt('');
    }
  };

  const handlePromptDialogClose = () => {
    setShowPromptDialog(false);
    setCustomPrompt('');
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
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
            Back to Admin
          </Button>
          <Button 
            startIcon={<RefreshIcon />} 
            onClick={handleRegeneratePolicy}
            variant="outlined"
            color="primary"
            disabled={regenerating}
          >
            {regenerating ? 'Regenerating...' : 'Regenerate Policy'}
          </Button>
        </Box>
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

      {/* Custom Prompt Dialog */}
      <Dialog open={showPromptDialog} onClose={handlePromptDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>Customize Policy Analysis</DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph sx={{ mb: 2 }}>
            Enter any specific instructions for the policy analysis. You can request the analysis to focus on specific areas,
            such as account security, user rights, fund access, or dispute resolution.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            label="Custom Instructions (Optional)"
            placeholder="Example: Focus on sections related to account freezing and the arbitration process. Include information about user rights during disputes."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePromptDialogClose}>Cancel</Button>
          <Button 
            onClick={handleRegenerateConfirm} 
            variant="contained" 
            color="primary"
          >
            Regenerate Policy
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 
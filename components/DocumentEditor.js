// components/DocumentEditor.js

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  CircularProgress
} from '@mui/material';
import { doc as firestoreDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export default function DocumentEditor({ document: propDoc }) {
  const router = useRouter();
  // if we're rendered in a modal, propDoc.id; otherwise a URL param
  const { id: routeId } = router.query;
  const documentId = propDoc?.id || routeId;

  const [docData, setDocData] = useState(propDoc || null);
  const [isLoading, setIsLoading] = useState(!propDoc);
  const [aiResponse, setAiResponse] = useState(propDoc?.generatedLetter || '');
  const [isProcessing, setIsProcessing] = useState(false);

  // fetch or generate on mount
  useEffect(() => {
    const fetchOrGenerate = async () => {
      if (!documentId) return;
      // if we already got propDoc, skip fetching
      if (propDoc) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);

      try {
        // 1. Load from Firestore
        const ref = firestoreDoc(db, 'documents', documentId);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          console.error('No such document!');
          setAiResponse('Document not found.');
          return;
        }
        const data = snap.data();

        // 2. If missing generatedLetter, call our API
        if (!data.generatedLetter) {
          const res = await fetch('/api/generateDocument', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documentId })
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || 'Generation failed');
          data.generatedLetter = json.generatedLetter;
        }

        setDocData(data);
        setAiResponse(data.generatedLetter || '');
      } catch (err) {
        console.error('Error loading or generating document:', err);
        setAiResponse(`Error: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrGenerate();
  }, [documentId, propDoc]);

  // Handler to re‑generate on demand
  const handleRegenerate = async () => {
    if (!documentId) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/generateDocument', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Regeneration failed');
      setAiResponse(json.generatedLetter);
    } catch (err) {
      console.error('Regeneration error:', err);
      setAiResponse(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Grid container spacing={3} p={3}>
      {/* Document Viewer */}
      <Grid item xs={12} md={6}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Document Content
          </Typography>
          <Box
            sx={{
              p: 2,
              bgcolor: 'background.default',
              borderRadius: 1,
              minHeight: 300,
              whiteSpace: 'pre-wrap'
            }}
          >
            {isLoading ? (
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>Loading…</Typography>
              </Box>
            ) : aiResponse ? (
              <Typography color="text.primary">{aiResponse}</Typography>
            ) : (
              <Typography color="text.secondary">
                No document has been generated.
              </Typography>
            )}
          </Box>
        </Paper>
      </Grid>

      {/* AI Assistant / Regeneration */}
      <Grid item xs={12} md={6}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            AI Assistant
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleRegenerate}
              disabled={isProcessing || isLoading}
              fullWidth
            >
              {isProcessing ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1 }} />
                  Regenerating…
                </>
              ) : (
                'Regenerate Document'
              )}
            </Button>

            <Paper
              variant="outlined"
              sx={{
                p: 2,
                minHeight: 200,
                bgcolor: 'background.default'
              }}
            >
              <Typography color="text.secondary">
                This letter was auto‑generated from your submission data. Use “Regenerate Document” above if you need to refresh it.
              </Typography>
            </Paper>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
}

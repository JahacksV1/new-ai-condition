// components/DocumentEditor.js

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  CircularProgress,
  TextField
} from '@mui/material';
import { doc as firestoreDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export default function DocumentEditor({ document: propDoc }) {
  const router = useRouter();
  const { id: routeId } = router.query;
  const documentId = propDoc?.id || routeId;

  const [docData, setDocData] = useState(propDoc || null);
  const [isLoading, setIsLoading] = useState(!propDoc);
  const [content, setContent] = useState(propDoc?.generatedLetter || '');
  const [isSaving, setIsSaving] = useState(false);

  const [chatPrompt, setChatPrompt] = useState('');
  const [isChatting, setIsChatting] = useState(false);

  // 1) Fetch / generate on mount
  useEffect(() => {
    const fetchOrGenerate = async () => {
      if (!documentId) return;
      if (propDoc) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const ref = firestoreDoc(db, 'documents', documentId);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          setContent('⚠️ Document not found');
          return;
        }
        const data = snap.data();

        // if no generatedLetter, call your generate API
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
        setContent(data.generatedLetter || '');
      } catch (err) {
        console.error(err);
        setContent(`Error: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrGenerate();
  }, [documentId, propDoc]);

  // 2) Save manual edits
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const ref = firestoreDoc(db, 'documents', documentId);
      await updateDoc(ref, {
        generatedLetter: content,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // 3) AI Chat to re‑edit
  const handleChat = async () => {
    if (!chatPrompt.trim()) return;
    setIsChatting(true);
    try {
      const res = await fetch('/api/editDocument', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, prompt: chatPrompt })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Edit failed');
      setContent(json.editedLetter);
    } catch (err) {
      console.error('Chat edit error:', err);
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <Grid container spacing={3} p={3}>
      {/* Editable Draft */}
      <Grid item xs={12} md={6}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Document Content
          </Typography>

          {isLoading ? (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <CircularProgress />
              <Typography sx={{ mt: 2 }}>Loading…</Typography>
            </Box>
          ) : (
            <>
              <TextField
                multiline
                fullWidth
                minRows={15}
                variant="outlined"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={isSaving}
                fullWidth
              >
                {isSaving ? 'Saving…' : 'Save Changes'}
              </Button>
            </>
          )}
        </Paper>
      </Grid>

      {/* AI Chat Panel */}
      <Grid item xs={12} md={6}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            AI Assistant
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              label="Enter instructions for AI (e.g. tone, structure)"
              value={chatPrompt}
              onChange={(e) => setChatPrompt(e.target.value)}
            />
            <Button
              variant="contained"
              onClick={handleChat}
              disabled={isChatting || isLoading}
              fullWidth
            >
              {isChatting ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1 }} />
                  Processing…
                </>
              ) : (
                'Apply AI Edit'
              )}
            </Button>

            <Paper
              variant="outlined"
              sx={{ p: 2, minHeight: 200, bgcolor: 'background.default' }}
            >
              <Typography color="text.secondary">
                Type any instruction above and click “Apply AI Edit” to have the AI
                re‑draft your letter in real time.
              </Typography>
            </Paper>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
}

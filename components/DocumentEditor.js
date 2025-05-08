import { useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  CircularProgress
} from '@mui/material';

export default function DocumentEditor({ document }) {
  const [aiResponse, setAiResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAiAssist = async () => {
    setIsProcessing(true);
    // TODO: Implement AI assistance logic
    setTimeout(() => {
      setAiResponse('AI analysis and suggestions will appear here...');
      setIsProcessing(false);
    }, 1000);
  };

  return (
    <Grid container spacing={3}>
      {/* Document View */}
      <Grid item xs={12} md={6}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Document Content
          </Typography>
          <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography color="text.secondary">
              Document content will be displayed here. This is a placeholder for the actual document viewer.
            </Typography>
          </Box>
        </Paper>
      </Grid>

      {/* AI Assistant */}
      <Grid item xs={12} md={6}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            AI Assistant
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleAiAssist}
              disabled={isProcessing}
              fullWidth
            >
              {isProcessing ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1 }} />
                  Processing...
                </>
              ) : (
                'Get AI Assistance'
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
              {aiResponse ? (
                <Typography color="text.secondary">
                  {aiResponse}
                </Typography>
              ) : (
                <Typography color="text.secondary" fontStyle="italic">
                  Click the button above to get AI assistance with this document.
                </Typography>
              )}
            </Paper>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
} 
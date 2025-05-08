import { useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Modal,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Navbar from '../components/Navbar';
import DocumentEditor from '../components/DocumentEditor';

export default function Admin() {
  const [selectedDocument, setSelectedDocument] = useState(null);
  
  // Mock data for demonstration
  const documents = [
    { id: 1, title: 'Document 1', status: 'Pending', date: '2024-03-20' },
    { id: 2, title: 'Document 2', status: 'Completed', date: '2024-03-19' },
    { id: 3, title: 'Document 3', status: 'In Progress', date: '2024-03-18' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'success.main';
      case 'In Progress':
        return 'warning.main';
      default:
        return 'grey.500';
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {/* Overview Section */}
          <Grid item xs={12} md={4}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Overview
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Paper sx={{ p: 2, bgcolor: 'primary.light' }}>
                  <Typography color="primary.contrastText" variant="subtitle2">
                    Total Documents
                  </Typography>
                  <Typography variant="h4" color="primary.contrastText">
                    {documents.length}
                  </Typography>
                </Paper>
                <Paper sx={{ p: 2, bgcolor: 'success.light' }}>
                  <Typography color="success.contrastText" variant="subtitle2">
                    Completed
                  </Typography>
                  <Typography variant="h4" color="success.contrastText">
                    {documents.filter(d => d.status === 'Completed').length}
                  </Typography>
                </Paper>
                <Paper sx={{ p: 2, bgcolor: 'warning.light' }}>
                  <Typography color="warning.contrastText" variant="subtitle2">
                    In Progress
                  </Typography>
                  <Typography variant="h4" color="warning.contrastText">
                    {documents.filter(d => d.status === 'In Progress').length}
                  </Typography>
                </Paper>
              </Box>
            </Paper>
          </Grid>

          {/* Documents Section */}
          <Grid item xs={12} md={8}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Documents
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {documents.map(doc => (
                  <Paper
                    key={doc.id}
                    variant="outlined"
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    onClick={() => setSelectedDocument(doc)}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle1">{doc.title}</Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          bgcolor: `${getStatusColor(doc.status)}20`,
                          color: getStatusColor(doc.status)
                        }}
                      >
                        {doc.status}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {doc.date}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Document Editor Modal */}
        <Modal
          open={!!selectedDocument}
          onClose={() => setSelectedDocument(null)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2
          }}
        >
          <Paper
            sx={{
              width: '100%',
              maxWidth: 1000,
              maxHeight: '90vh',
              overflow: 'auto'
            }}
          >
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">{selectedDocument?.title}</Typography>
              <IconButton onClick={() => setSelectedDocument(null)}>
                <CloseIcon />
              </IconButton>
            </Box>
            <Box sx={{ p: 2 }}>
              <DocumentEditor document={selectedDocument} />
            </Box>
          </Paper>
        </Modal>
      </Container>
    </Box>
  );
} 
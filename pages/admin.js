import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Chip,
  Button,
  Dialog
} from '@mui/material';
import Navbar from '../components/Navbar';
import DocumentEditor from '../components/DocumentEditor';
import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function Admin() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'documents'));
        const docs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setDocuments(docs);
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'warning';
      case 'Approved':
        return 'success';
      case 'Rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleOpenEditor = (doc) => {
    setSelectedDoc(doc);
  };

  const handleCloseEditor = () => {
    setSelectedDoc(null);
  };

  const handleDownload = (doc) => {
    // Placeholder logic – replace this with real file generation
    const text = doc.generatedText || 'No generated text available.';
    const blob = new Blob([text], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${doc.name}_Document.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>

        <TableContainer component={Paper} sx={{ mt: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Document Type</TableCell>
                <TableCell>Actions</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Submitted</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Loading documents...
                  </TableCell>
                </TableRow>
              ) : documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No documents found
                  </TableCell>
                </TableRow>
              ) : (
                documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>{doc.name}</TableCell>
                    <TableCell>{doc.email}</TableCell>
                    <TableCell>{doc.documentType}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleOpenEditor(doc)}
                        sx={{ mr: 1 }}
                      >
                        View/Edit
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="secondary"
                        onClick={() => handleDownload(doc)}
                      >
                        Download
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={doc.status}
                        color={getStatusColor(doc.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {doc.createdAt
                        ? new Date(doc.createdAt).toLocaleDateString()
                        : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>

      {/* Document Viewer Modal */}
      <Dialog
        open={Boolean(selectedDoc)}
        onClose={handleCloseEditor}
        maxWidth="lg"
        fullWidth
      >
        {selectedDoc && <DocumentEditor document={selectedDoc} />}
      </Dialog>
    </Box>
  );
}

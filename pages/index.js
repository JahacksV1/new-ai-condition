import { useState } from 'react';
import { Container, Typography, Button, Box } from '@mui/material';
import Navbar from '../components/Navbar';
import RecoveryForm from '../components/RecoveryForm';

export default function Home() {
  const [showForm, setShowForm] = useState(false);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {!showForm ? (
          <Box
            sx={{
              maxWidth: 800,
              mx: 'auto',
              textAlign: 'center',
              mt: 4
            }}
          >
            <Typography variant="h3" component="h1" gutterBottom>
              Welcome to Document Recovery Platform
            </Typography>
            <Typography variant="h6" color="text.secondary" paragraph>
              Our AI-powered platform helps you recover and manage your important documents efficiently.
              Get started by clicking the button below.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => setShowForm(true)}
              sx={{ mt: 2 }}
            >
              Start Recovery
            </Button>
          </Box>
        ) : (
          <RecoveryForm />
        )}
      </Container>
    </Box>
  );
} 
import { Container, Typography, Box, Paper } from '@mui/material';
import Navbar from '../components/Navbar';

export default function Success() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar />
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper elevation={3} sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom color="primary">
            Thank You for Your Submission!
          </Typography>
          
          <Typography variant="h6" color="text.secondary" paragraph sx={{ mt: 3 }}>
            Your document recovery request has been successfully submitted.
          </Typography>
          
          <Typography variant="body1" paragraph sx={{ mt: 2 }}>
            Our team will review your request and get back to you within 3-5 business days with your conditional acceptance letter.
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
            We appreciate your patience during this process.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
} 
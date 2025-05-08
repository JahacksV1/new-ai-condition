import { useRouter } from 'next/router';
import Link from 'next/link';
import { AppBar, Toolbar, Typography, Button, Container } from '@mui/material';

export default function Navbar() {
  const router = useRouter();
  const isAdmin = router.pathname === '/admin';

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Container maxWidth="lg">
        <Toolbar>
          <Typography
            variant="h6"
            component={Link}
            href="/"
            sx={{
              textDecoration: 'none',
              color: 'inherit',
              flexGrow: 1
            }}
          >
            Document Recovery
          </Typography>
          
          <Button
            component={Link}
            href={isAdmin ? '/' : '/admin'}
            variant="contained"
            color="primary"
          >
            {isAdmin ? 'Switch to User View' : 'Switch to Admin View'}
          </Button>
        </Toolbar>
      </Container>
    </AppBar>
  );
} 
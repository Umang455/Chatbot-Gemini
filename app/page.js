'use client';

import { useSession, signOut } from 'next-auth/react';
import { Button, Container, Typography, Box, Paper } from '@mui/material';
import { useRouter } from 'next/navigation';
import ChatIcon from '@mui/icons-material/Chat';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LoginIcon from '@mui/icons-material/Login';
import HistoryIcon from '@mui/icons-material/History';
import useAuthStore from '@/store/authStore';
import { useEffect } from 'react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { setUser } = useAuthStore();

  useEffect(() => {
    if (session?.user) {
      setUser(session.user);
    }
  }, [session, setUser]);

  if (status === 'loading') {
    return (
      <Container>
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography>Loading...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <Box sx={{ mt: 4 }}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {session ? (
            <>
              <Typography variant="h4" gutterBottom>
                Welcome, {session.user?.name}!
              </Typography>
              <Typography variant="body1" gutterBottom>
                You are signed in as {session.user?.email}
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<ChatIcon />}
                  onClick={() => router.push('/chat')}
                  sx={{
                    px: 4,
                    py: 1.5,
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                  }}
                >
                  New Chat
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<HistoryIcon />}
                  onClick={() => router.push('/chats')}
                  sx={{
                    px: 4,
                    py: 1.5,
                  }}
                >
                  Saved Chats
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => signOut()}
                  sx={{
                    px: 4,
                    py: 1.5,
                  }}
                >
                  Sign Out
                </Button>
              </Box>
            </>
          ) : (
            <>
              <Typography variant="h4" gutterBottom>
                Welcome to Our Chat Application
              </Typography>
              <Typography variant="body1" gutterBottom sx={{ mb: 3 }}>
                Please register or login to start chatting
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PersonAddIcon />}
                  onClick={() => router.push('/register')}
                  sx={{
                    px: 4,
                    py: 1.5,
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                  }}
                >
                  Register
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<LoginIcon />}
                  onClick={() => router.push('/login')}
                  sx={{
                    px: 4,
                    py: 1.5,
                  }}
                >
                  Login
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
}

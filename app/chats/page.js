'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    Container,
    Box,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    CircularProgress,
    Button,
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import DeleteIcon from '@mui/icons-material/Delete';
import useChatStore from '@/store/chatStore';

export default function SavedChatsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [chats, setChats] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { setMessages } = useChatStore();

    useEffect(() => {
        if (session?.user) {
            fetchChats();
        }
    }, [session]);

    const fetchChats = async () => {
        try {
            const response = await fetch('/api/chats');
            if (!response.ok) {
                throw new Error('Failed to fetch chats');
            }
            const data = await response.json();
            setChats(data);
        } catch (error) {
            console.error('Error fetching chats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoadChat = (chat) => {
        setMessages(chat.messages);
        router.push('/chat');
    };

    const handleDeleteChat = async (chatId) => {
        try {
            const response = await fetch(`/api/chats/${chatId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete chat');
            }

            setChats(chats.filter(chat => chat.id !== chatId));
        } catch (error) {
            console.error('Error deleting chat:', error);
        }
    };

    if (status === 'loading' || isLoading) {
        return (
            <Container>
                <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (!session) {
        router.push('/login');
        return null;
    }

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper
                elevation={3}
                sx={{
                    p: 4,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4">Saved Chats</Typography>
                    <Button
                        variant="contained"
                        startIcon={<ChatIcon />}
                        onClick={() => router.push('/chat')}
                    >
                        New Chat
                    </Button>
                </Box>

                {chats.length === 0 ? (
                    <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
                        No saved chats yet. Start a new chat to save it here!
                    </Typography>
                ) : (
                    <List>
                        {chats.map((chat) => (
                            <ListItem
                                key={chat.id}
                                sx={{
                                    border: 1,
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                    mb: 1,
                                    '&:hover': {
                                        backgroundColor: 'action.hover',
                                    },
                                }}
                            >
                                <ListItemText
                                    primary={chat.title}
                                    secondary={new Date(chat.createdAt).toLocaleString()}
                                />
                                <ListItemSecondaryAction>
                                    <IconButton
                                        edge="end"
                                        color="primary"
                                        onClick={() => handleLoadChat(chat)}
                                        sx={{ mr: 1 }}
                                    >
                                        <ChatIcon />
                                    </IconButton>
                                    <IconButton
                                        edge="end"
                                        color="error"
                                        onClick={() => handleDeleteChat(chat.id)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                )}
            </Paper>
        </Container>
    );
} 
'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    Container,
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    CircularProgress,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tooltip,
    Alert,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import useAuthStore from '@/store/authStore';
import useChatStore from '@/store/chatStore';

export default function ChatPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isPdfProcessing, setIsPdfProcessing] = useState(false);
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [chatTitle, setChatTitle] = useState('');
    const [uploadedPdf, setUploadedPdf] = useState(null);
    const [pdfText, setPdfText] = useState('');
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);

    const { user, setUser } = useAuthStore();
    const { messages, setMessages, addMessage, clearMessages, saveChat } = useChatStore();

    useEffect(() => {
        if (session?.user) {
            setUser(session.user);
        }
    }, [session, setUser]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setError('');
        setUploadedPdf(file);
        setIsPdfProcessing(true);

        try {
            const formData = new FormData();
            formData.append('pdf', file);

            const response = await fetch('/api/chat/process-pdf', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to process PDF');
            }

            if (!data.text) {
                throw new Error('No text could be extracted from the PDF');
            }

            setPdfText(data.text);
            addMessage({
                role: 'assistant',
                content: `PDF &quot;${data.filename}&quot; (${data.pages} pages) processed successfully. You can now ask questions about it.`
            });
        } catch (error) {
            console.error('PDF processing error:', error);
            setError('Error processing PDF: ' + error.message);
            setUploadedPdf(null);
            setPdfText('');
        } finally {
            setIsPdfProcessing(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = input.trim();
        setInput('');
        addMessage({ role: 'user', content: userMessage });
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage,
                    pdfText: pdfText,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to get response');
            }

            addMessage({ role: 'assistant', content: data.response });
        } catch (error) {
            addMessage({
                role: 'assistant',
                content: "Sorry, I encountered an error. Please try again."
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveChat = async () => {
        if (!chatTitle.trim()) return;

        try {
            const response = await fetch('/api/chats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: chatTitle,
                    messages: messages,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to save chat');
            }

            const savedChat = await response.json();
            saveChat(savedChat);
            setSaveDialogOpen(false);
            setChatTitle('');

            // Clear the chat messages
            clearMessages();

            // Show success message
            alert("Chat saved successfully!");

            // Redirect to home page
            router.push('/');
        } catch (error) {
            console.error('Error saving chat:', error);
            alert("Failed to save chat: " + error.message);
        }
    };

    const clearChat = () => {
        clearMessages();
    };

    if (status === 'loading') {
        return (
            <Container>
                <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (!session) {
        return (
            <Container maxWidth="md" sx={{ height: '100vh', py: 4 }}>
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
                    <Typography variant="h4" gutterBottom>
                        Authentication Required
                    </Typography>
                    <Typography variant="body1" gutterBottom sx={{ mb: 3 }}>
                        Please login or register to access the chat
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
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ height: '100vh', py: 4 }}>
            <Paper
                elevation={3}
                sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                }}
            >
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">
                        {uploadedPdf ? `Chat with Gemini - ${uploadedPdf.name}` : 'Chat with Gemini'}
                    </Typography>
                    <Box>
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileUpload}
                            style={{ display: 'none' }}
                            ref={fileInputRef}
                        />
                        <Tooltip title={uploadedPdf ? "Upload different PDF" : "Upload PDF"}>
                            <IconButton
                                onClick={() => fileInputRef.current?.click()}
                                color="primary"
                                disabled={isPdfProcessing}
                            >
                                <UploadFileIcon />
                            </IconButton>
                        </Tooltip>
                        {messages.length > 0 && (
                            <>
                                <IconButton
                                    onClick={() => setSaveDialogOpen(true)}
                                    color="primary"
                                    title="Save chat"
                                >
                                    <SaveIcon />
                                </IconButton>
                                <IconButton
                                    onClick={clearChat}
                                    color="error"
                                    title="Clear chat"
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </>
                        )}
                    </Box>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ m: 2 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                {isPdfProcessing && (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                        <CircularProgress size={24} sx={{ mr: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                            Processing PDF... Please wait
                        </Typography>
                    </Box>
                )}

                <List
                    sx={{
                        flex: 1,
                        overflow: 'auto',
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                    }}
                >
                    {messages.map((message, index) => (
                        <ListItem
                            key={index}
                            sx={{
                                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                            }}
                        >
                            <Paper
                                elevation={1}
                                sx={{
                                    p: 2,
                                    maxWidth: '70%',
                                    backgroundColor: message.role === 'user' ? 'primary.light' : 'grey.100',
                                    color: message.role === 'user' ? 'white' : 'text.primary',
                                }}
                            >
                                <ListItemText
                                    primary={message.content}
                                    sx={{
                                        '& .MuiListItemText-primary': {
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                        },
                                    }}
                                />
                            </Paper>
                        </ListItem>
                    ))}
                    {isLoading && (
                        <ListItem sx={{ justifyContent: 'flex-start' }}>
                            <CircularProgress size={20} />
                        </ListItem>
                    )}
                    <div ref={messagesEndRef} />
                </List>

                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{
                        p: 2,
                        borderTop: 1,
                        borderColor: 'divider',
                        display: 'flex',
                        gap: 1,
                    }}
                >
                    <TextField
                        fullWidth
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={uploadedPdf ? "Ask a question about the PDF..." : "Type your message..."}
                        variant="outlined"
                        size="small"
                        disabled={isLoading || isPdfProcessing}
                        multiline
                        maxRows={4}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        endIcon={<SendIcon />}
                        disabled={isLoading || !input.trim() || isPdfProcessing}
                    >
                        Send
                    </Button>
                </Box>
            </Paper>

            <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
                <DialogTitle>Save Chat</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Chat Title"
                        fullWidth
                        value={chatTitle}
                        onChange={(e) => setChatTitle(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleSaveChat}
                        disabled={!chatTitle.trim()}
                        variant="contained"
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
} 
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Badge,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Paper,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Search,
  FilterList,
  MoreVert,
  Chat,
  WhatsApp,
  Telegram,
  Facebook,
  Instagram,
  Email,
  Assignment,
  Person,
  Schedule,
} from '@mui/icons-material';
import { Conversation, Message as MessageType, User, ConversationStatus, Priority } from '../types';
import apiClient from '../services/api';
import { useSocket } from '../services/socket';

const MessagesPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string>('');

  const socket = useSocket();

  useEffect(() => {
    fetchConversations();
    
    // Setup socket listeners
    socket.onNewMessage((data) => {
      if (selectedConversation && data.message.conversationId === selectedConversation.id) {
        setMessages(prev => [...prev, data.message]);
      }
      // Update conversation list
      fetchConversations();
    });

    socket.onConversationUpdated((data) => {
      if (data.conversationId === selectedConversation?.id) {
        setSelectedConversation(prev => prev ? { ...prev, ...data } : null);
      }
      fetchConversations();
    });

    return () => {
      socket.removeAllListeners();
    };
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getConversations({
        search: searchTerm,
        platform: platformFilter,
        status: statusFilter,
        limit: 50
      });
      setConversations(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await apiClient.getMessages(conversationId, { limit: 100 });
      setMessages(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load messages');
    }
  };

  const handleConversationSelect = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    await fetchMessages(conversation.id);
    
    // Join conversation room
    socket.joinConversation(conversation.id);
    
    // Mark as read
    if (conversation.unreadCount > 0) {
      await apiClient.markConversationAsRead(conversation.id);
      fetchConversations(); // Refresh to update unread count
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'whatsapp': return <WhatsApp />;
      case 'telegram': return <Telegram />;
      case 'facebook': return <Facebook />;
      case 'instagram': return <Instagram />;
      case 'email': return <Email />;
      default: return <Chat />;
    }
  };

  const getStatusColor = (status: ConversationStatus) => {
    switch (status) {
      case 'new': return 'error';
      case 'in_progress': return 'warning';
      case 'resolved': return 'success';
      case 'closed': return 'default';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const formatLastMessageTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, conversationId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedConversationId(conversationId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedConversationId('');
  };

  const handleAssignConversation = async () => {
    // TODO: Implement assignment dialog
    handleMenuClose();
  };

  const handleUpdateStatus = async () => {
    // TODO: Implement status update dialog
    handleMenuClose();
  };

  if (loading && conversations.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Messages
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Conversations List */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6">Conversations</Typography>
                <IconButton>
                  <FilterList />
                </IconButton>
              </Box>

              <TextField
                fullWidth
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              <Box display="flex" gap={1} mb={2}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Platform</InputLabel>
                  <Select
                    value={platformFilter}
                    onChange={(e) => setPlatformFilter(e.target.value)}
                    label="Platform"
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="whatsapp">WhatsApp</MenuItem>
                    <MenuItem value="telegram">Telegram</MenuItem>
                    <MenuItem value="facebook">Facebook</MenuItem>
                    <MenuItem value="instagram">Instagram</MenuItem>
                    <MenuItem value="email">Email</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="new">New</MenuItem>
                    <MenuItem value="in_progress">In Progress</MenuItem>
                    <MenuItem value="resolved">Resolved</MenuItem>
                    <MenuItem value="closed">Closed</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Button
                fullWidth
                variant="outlined"
                onClick={fetchConversations}
                sx={{ mb: 2 }}
              >
                Apply Filters
              </Button>

              <List>
                {conversations.map((conversation) => (
                  <ListItemButton
                    key={conversation.id}
                    selected={selectedConversation?.id === conversation.id}
                    onClick={() => handleConversationSelect(conversation)}
                    sx={{
                      borderRadius: 1,
                      mb: 1,
                      '&.Mui-selected': {
                        backgroundColor: 'primary.light',
                        '&:hover': {
                          backgroundColor: 'primary.light',
                        },
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        badgeContent={conversation.unreadCount}
                        color="error"
                        invisible={conversation.unreadCount === 0}
                      >
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {getPlatformIcon(conversation.platform)}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>

                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Typography variant="subtitle1" noWrap>
                            {conversation.customer?.firstName} {conversation.customer?.lastName}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, conversation.id)}
                          >
                            <MoreVert />
                          </IconButton>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {conversation.messages?.[0]?.content || 'No messages yet'}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                            <Chip
                              label={conversation.status}
                              size="small"
                              color={getStatusColor(conversation.status) as any}
                            />
                            <Chip
                              label={conversation.priority}
                              size="small"
                              color={getPriorityColor(conversation.priority) as any}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {formatLastMessageTime(conversation.lastMessageAt)}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItemButton>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Messages Area */}
        <Grid size={{ xs: 12, md: 8 }}>
          {selectedConversation ? (
            <Card sx={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Conversation Header */}
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {getPlatformIcon(selectedConversation.platform)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        {selectedConversation.customer?.firstName} {selectedConversation.customer?.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedConversation.platform} • {selectedConversation.platformId}
                      </Typography>
                    </Box>
                  </Box>
                  <Box display="flex" gap={1}>
                    <Chip
                      label={selectedConversation.status}
                      color={getStatusColor(selectedConversation.status) as any}
                    />
                    <Chip
                      label={selectedConversation.priority}
                      color={getPriorityColor(selectedConversation.priority) as any}
                    />
                  </Box>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Messages */}
                <Box
                  sx={{
                    flexGrow: 1,
                    overflow: 'auto',
                    maxHeight: '400px',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 2,
                    mb: 2,
                  }}
                >
                  {messages.map((message) => (
                    <Box
                      key={message.id}
                      sx={{
                        display: 'flex',
                        justifyContent: message.senderType === 'agent' ? 'flex-end' : 'flex-start',
                        mb: 2,
                      }}
                    >
                      <Paper
                        sx={{
                          p: 2,
                          maxWidth: '70%',
                          bgcolor: message.senderType === 'agent' ? 'primary.main' : 'grey.100',
                          color: message.senderType === 'agent' ? 'white' : 'text.primary',
                        }}
                      >
                        <Typography variant="body1">{message.content}</Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            opacity: 0.7,
                            display: 'block',
                            mt: 1,
                          }}
                        >
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </Typography>
                      </Paper>
                    </Box>
                  ))}
                </Box>

                {/* Message Input */}
                <Box display="flex" gap={1}>
                  <TextField
                    fullWidth
                    placeholder="Type a message..."
                    multiline
                    maxRows={3}
                  />
                  <Button variant="contained" size="large">
                    Send
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Card sx={{ height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box textAlign="center">
                <Chat sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Select a conversation to start messaging
                </Typography>
              </Box>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleAssignConversation}>
          <Assignment sx={{ mr: 1 }} />
          Assign to User
        </MenuItem>
        <MenuItem onClick={handleUpdateStatus}>
          <Person sx={{ mr: 1 }} />
          Update Status
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default MessagesPage;

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  QrCode,
  WhatsApp,
  Telegram,
  Facebook,
  Instagram,
  Send,
} from '@mui/icons-material';
import apiClient from '../services/api';

interface QRCodeData {
  sessionId: string;
  qrCode: string;
  messengerType: string;
  status: string;
  expiresAt: string;
}

interface SessionStatus {
  sessionId: string;
  status: string;
  createdAt: string;
  connectedAt?: string;
  isConnected?: boolean;
}

const MessengerQRPage: React.FC = () => {
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [messengerType, setMessengerType] = useState<string>('whatsapp');
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendData, setSendData] = useState({ contact: '', message: '' });

  const messengerTypes = [
    { value: 'whatsapp', label: 'WhatsApp Web', icon: <WhatsApp />, color: '#25D366' },
    { value: 'telegram', label: 'Telegram Desktop', icon: <Telegram />, color: '#0088CC' },
    { value: 'facebook', label: 'Facebook Messenger', icon: <Facebook />, color: '#1877F2' },
    { value: 'instagram', label: 'Instagram Direct', icon: <Instagram />, color: '#E4405F' },
  ];

  const generateQR = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await apiClient.post('/messengers/qr/generate', {
        messengerType,
        options: {}
      });
      
      setQrData(response.data);
      setSuccess('QR-код сгенерирован успешно!');
      
      // Если это WhatsApp, сразу инициализируем сессию
      if (messengerType === 'whatsapp') {
        await connectWhatsApp(response.data.sessionId);
      }
      
    } catch (err: any) {
      setError(err.message || 'Ошибка генерации QR-кода');
    } finally {
      setLoading(false);
    }
  };

  const connectWhatsApp = async (sessionId: string) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/messengers/whatsapp/connect', {
        sessionId
      });
      
      setSuccess('WhatsApp Web сессия инициализирована! Сканируйте QR-код в браузере.');
      
      // Начинаем проверку статуса подключения
      checkConnectionStatus(sessionId);
      
    } catch (err: any) {
      setError(err.message || 'Ошибка подключения к WhatsApp Web');
    } finally {
      setLoading(false);
    }
  };

  const checkConnectionStatus = async (sessionId: string) => {
    try {
      const response = await apiClient.get(`/messengers/whatsapp/${sessionId}/status`);
      setSessionStatus(response.data);
      
      if (response.data.status === 'waiting_for_scan') {
        // Продолжаем проверку каждые 2 секунды
        setTimeout(() => checkConnectionStatus(sessionId), 2000);
      } else if (response.data.status === 'connected') {
        setSuccess('WhatsApp Web подключен успешно!');
      }
    } catch (err: any) {
      console.error('Error checking connection status:', err);
    }
  };

  const sendMessage = async () => {
    if (!qrData || !sendData.contact || !sendData.message) {
      setError('Заполните все поля');
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.post('/messengers/whatsapp/send', {
        sessionId: qrData.sessionId,
        contact: sendData.contact,
        message: sendData.message
      });
      
      setSuccess('Сообщение отправлено успешно!');
      setSendDialogOpen(false);
      setSendData({ contact: '', message: '' });
      
    } catch (err: any) {
      setError(err.message || 'Ошибка отправки сообщения');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'success';
      case 'waiting_for_scan': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Подключен';
      case 'waiting_for_scan': return 'Ожидание сканирования';
      case 'failed': return 'Ошибка';
      default: return status;
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Подключение мессенджеров
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Подключите мессенджеры через QR-коды для работы с сообщениями
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Выбор мессенджера */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Выберите мессенджер
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Мессенджер</InputLabel>
                <Select
                  value={messengerType}
                  onChange={(e) => setMessengerType(e.target.value)}
                  label="Мессенджер"
                >
                  {messengerTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{ color: type.color }}>{type.icon}</Box>
                        {type.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="contained"
                startIcon={<QrCode />}
                onClick={generateQR}
                disabled={loading}
                fullWidth
                sx={{ mb: 2 }}
              >
                {loading ? 'Генерация...' : 'Сгенерировать QR-код'}
              </Button>

              {sessionStatus && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Статус сессии:
                  </Typography>
                  <Chip
                    label={getStatusText(sessionStatus.status)}
                    color={getStatusColor(sessionStatus.status) as any}
                    size="small"
                  />
                  {sessionStatus.isConnected && (
                    <Button
                      variant="outlined"
                      startIcon={<Send />}
                      onClick={() => setSendDialogOpen(true)}
                      sx={{ ml: 2 }}
                    >
                      Отправить сообщение
                    </Button>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* QR-код */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                QR-код для подключения
              </Typography>
              
              {loading && (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                  <CircularProgress />
                </Box>
              )}

              {qrData && !loading && (
                <Box textAlign="center">
                  <img
                    src={qrData.qrCode}
                    alt="QR Code"
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Сканируйте QR-код в {messengerTypes.find(t => t.value === messengerType)?.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Сессия истекает: {new Date(qrData.expiresAt).toLocaleString()}
                  </Typography>
                </Box>
              )}

              {!qrData && !loading && (
                <Box 
                  display="flex" 
                  justifyContent="center" 
                  alignItems="center" 
                  minHeight="300px"
                  border="2px dashed #ccc"
                  borderRadius={2}
                >
                  <Typography color="text.secondary">
                    QR-код будет отображен здесь
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Диалог отправки сообщения */}
      <Dialog open={sendDialogOpen} onClose={() => setSendDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Отправить сообщение</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Контакт или номер"
            fullWidth
            variant="outlined"
            value={sendData.contact}
            onChange={(e) => setSendData({ ...sendData, contact: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Сообщение"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={sendData.message}
            onChange={(e) => setSendData({ ...sendData, message: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSendDialogOpen(false)}>Отмена</Button>
          <Button onClick={sendMessage} variant="contained" disabled={loading}>
            {loading ? 'Отправка...' : 'Отправить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MessengerQRPage;

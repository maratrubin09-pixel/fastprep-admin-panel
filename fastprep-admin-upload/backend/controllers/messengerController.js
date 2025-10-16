const QRCodeService = require('../services/QRCodeService');
const WhatsAppWebService = require('../services/WhatsAppWebService');

class MessengerController {
  /**
   * Генерирует QR-код для подключения мессенджера
   * POST /api/messengers/qr/generate
   */
  async generateQR(req, res) {
    try {
      const { messengerType, options = {} } = req.body;

      if (!messengerType) {
        return res.status(400).json({
          message: 'Messenger type is required',
          error: 'MISSING_MESSENGER_TYPE'
        });
      }

      const supportedTypes = ['whatsapp', 'telegram', 'facebook', 'instagram'];
      if (!supportedTypes.includes(messengerType)) {
        return res.status(400).json({
          message: 'Unsupported messenger type',
          error: 'UNSUPPORTED_MESSENGER_TYPE',
          supportedTypes
        });
      }

      // Генерируем QR-код
      const qrData = await QRCodeService.generateQR(messengerType, options);

      res.status(200).json({
        message: 'QR code generated successfully',
        data: qrData
      });

    } catch (error) {
      console.error('Error generating QR code:', error);
      res.status(500).json({
        message: 'Failed to generate QR code',
        error: error.message
      });
    }
  }

  /**
   * Получает статус QR-кода
   * GET /api/messengers/qr/:sessionId/status
   */
  async getQRStatus(req, res) {
    try {
      const { sessionId } = req.params;

      const status = QRCodeService.getQRStatus(sessionId);
      if (!status) {
        return res.status(404).json({
          message: 'QR code not found or expired',
          error: 'QR_NOT_FOUND'
        });
      }

      res.status(200).json({
        message: 'QR status retrieved successfully',
        data: status
      });

    } catch (error) {
      console.error('Error getting QR status:', error);
      res.status(500).json({
        message: 'Failed to get QR status',
        error: error.message
      });
    }
  }

  /**
   * Инициализирует WhatsApp Web сессию
   * POST /api/messengers/whatsapp/connect
   */
  async connectWhatsApp(req, res) {
    try {
      const { sessionId } = req.body;

      if (!sessionId) {
        return res.status(400).json({
          message: 'Session ID is required',
          error: 'MISSING_SESSION_ID'
        });
      }

      // Проверяем, что QR-код существует
      const qrStatus = QRCodeService.getQRStatus(sessionId);
      if (!qrStatus) {
        return res.status(404).json({
          message: 'QR code not found or expired',
          error: 'QR_NOT_FOUND'
        });
      }

      // Инициализируем WhatsApp Web сессию
      const whatsappData = await WhatsAppWebService.initializeSession(sessionId);

      res.status(200).json({
        message: 'WhatsApp Web session initialized successfully',
        data: whatsappData
      });

    } catch (error) {
      console.error('Error connecting WhatsApp:', error);
      res.status(500).json({
        message: 'Failed to connect WhatsApp',
        error: error.message
      });
    }
  }

  /**
   * Ожидает подключения WhatsApp Web
   * POST /api/messengers/whatsapp/wait
   */
  async waitForWhatsAppConnection(req, res) {
    try {
      const { sessionId } = req.body;

      if (!sessionId) {
        return res.status(400).json({
          message: 'Session ID is required',
          error: 'MISSING_SESSION_ID'
        });
      }

      // Ожидаем подключения (это может занять время)
      const isConnected = await WhatsAppWebService.waitForConnection(sessionId);

      res.status(200).json({
        message: 'WhatsApp Web connection status',
        data: {
          sessionId,
          isConnected,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error waiting for WhatsApp connection:', error);
      res.status(500).json({
        message: 'Failed to wait for WhatsApp connection',
        error: error.message
      });
    }
  }

  /**
   * Отправляет сообщение через WhatsApp Web
   * POST /api/messengers/whatsapp/send
   */
  async sendWhatsAppMessage(req, res) {
    try {
      const { sessionId, contact, message } = req.body;

      if (!sessionId || !contact || !message) {
        return res.status(400).json({
          message: 'Session ID, contact, and message are required',
          error: 'MISSING_REQUIRED_FIELDS'
        });
      }

      const success = await WhatsAppWebService.sendMessage(sessionId, contact, message);

      res.status(200).json({
        message: 'Message sent successfully',
        data: {
          sessionId,
          contact,
          message,
          sentAt: new Date().toISOString(),
          success
        }
      });

    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      res.status(500).json({
        message: 'Failed to send WhatsApp message',
        error: error.message
      });
    }
  }

  /**
   * Получает статус WhatsApp Web сессии
   * GET /api/messengers/whatsapp/:sessionId/status
   */
  async getWhatsAppStatus(req, res) {
    try {
      const { sessionId } = req.params;

      const status = WhatsAppWebService.getSessionStatus(sessionId);
      if (!status) {
        return res.status(404).json({
          message: 'WhatsApp session not found',
          error: 'SESSION_NOT_FOUND'
        });
      }

      res.status(200).json({
        message: 'WhatsApp status retrieved successfully',
        data: status
      });

    } catch (error) {
      console.error('Error getting WhatsApp status:', error);
      res.status(500).json({
        message: 'Failed to get WhatsApp status',
        error: error.message
      });
    }
  }

  /**
   * Закрывает WhatsApp Web сессию
   * DELETE /api/messengers/whatsapp/:sessionId
   */
  async closeWhatsAppSession(req, res) {
    try {
      const { sessionId } = req.params;

      await WhatsAppWebService.closeSession(sessionId);

      res.status(200).json({
        message: 'WhatsApp session closed successfully',
        data: {
          sessionId,
          closedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error closing WhatsApp session:', error);
      res.status(500).json({
        message: 'Failed to close WhatsApp session',
        error: error.message
      });
    }
  }

  /**
   * Получает все активные сессии
   * GET /api/messengers/sessions
   */
  async getActiveSessions(req, res) {
    try {
      const whatsappSessions = WhatsAppWebService.getActiveSessions();
      const activeQRs = QRCodeService.getActiveQRs();

      res.status(200).json({
        message: 'Active sessions retrieved successfully',
        data: {
          whatsapp: whatsappSessions,
          qrCodes: activeQRs,
          totalSessions: whatsappSessions.length + activeQRs.length
        }
      });

    } catch (error) {
      console.error('Error getting active sessions:', error);
      res.status(500).json({
        message: 'Failed to get active sessions',
        error: error.message
      });
    }
  }

  /**
   * Очищает истекшие QR-коды
   * POST /api/messengers/cleanup
   */
  async cleanupExpiredQRs(req, res) {
    try {
      QRCodeService.cleanupExpiredQRs();

      res.status(200).json({
        message: 'Expired QR codes cleaned up successfully',
        data: {
          cleanedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error cleaning up QR codes:', error);
      res.status(500).json({
        message: 'Failed to cleanup QR codes',
        error: error.message
      });
    }
  }
}

module.exports = new MessengerController();

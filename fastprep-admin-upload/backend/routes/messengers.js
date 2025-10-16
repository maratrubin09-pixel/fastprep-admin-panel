const express = require('express');
const router = express.Router();
const messengerController = require('../controllers/messengerController');

// QR Code routes
router.post('/qr/generate', messengerController.generateQR);
router.get('/qr/:sessionId/status', messengerController.getQRStatus);

// WhatsApp Web routes
router.post('/whatsapp/connect', messengerController.connectWhatsApp);
router.post('/whatsapp/wait', messengerController.waitForWhatsAppConnection);
router.post('/whatsapp/send', messengerController.sendWhatsAppMessage);
router.get('/whatsapp/:sessionId/status', messengerController.getWhatsAppStatus);
router.delete('/whatsapp/:sessionId', messengerController.closeWhatsAppSession);

// General messenger routes
router.get('/sessions', messengerController.getActiveSessions);
router.post('/cleanup', messengerController.cleanupExpiredQRs);

module.exports = router;

const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

class QRCodeService {
  constructor() {
    this.activeQRs = new Map(); // Хранилище активных QR-кодов
  }

  /**
   * Генерирует QR-код для подключения мессенджера
   * @param {string} messengerType - Тип мессенджера (whatsapp, telegram, facebook, instagram)
   * @param {object} options - Дополнительные опции
   * @returns {Promise<object>} - Объект с QR-кодом и ID сессии
   */
  async generateQR(messengerType, options = {}) {
    try {
      const sessionId = uuidv4();
      const qrData = {
        sessionId,
        messengerType,
        timestamp: new Date().toISOString(),
        status: 'pending',
        ...options
      };

      // Генерируем QR-код как base64 изображение
      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Сохраняем QR-код в активных
      this.activeQRs.set(sessionId, {
        ...qrData,
        qrCode: qrCodeDataURL,
        createdAt: new Date()
      });

      return {
        sessionId,
        qrCode: qrCodeDataURL,
        messengerType,
        status: 'pending',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 минут
      };
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Проверяет статус QR-кода
   * @param {string} sessionId - ID сессии
   * @returns {object|null} - Статус QR-кода или null если не найден
   */
  getQRStatus(sessionId) {
    const qrData = this.activeQRs.get(sessionId);
    if (!qrData) {
      return null;
    }

    // Проверяем, не истек ли QR-код
    if (new Date() > qrData.expiresAt) {
      this.activeQRs.delete(sessionId);
      return { status: 'expired' };
    }

    return {
      sessionId: qrData.sessionId,
      messengerType: qrData.messengerType,
      status: qrData.status,
      createdAt: qrData.createdAt,
      expiresAt: qrData.expiresAt
    };
  }

  /**
   * Обновляет статус QR-кода
   * @param {string} sessionId - ID сессии
   * @param {string} status - Новый статус (scanned, connected, failed)
   * @param {object} data - Дополнительные данные
   */
  updateQRStatus(sessionId, status, data = {}) {
    const qrData = this.activeQRs.get(sessionId);
    if (qrData) {
      qrData.status = status;
      qrData.updatedAt = new Date();
      qrData.data = { ...qrData.data, ...data };
      this.activeQRs.set(sessionId, qrData);
    }
  }

  /**
   * Удаляет QR-код
   * @param {string} sessionId - ID сессии
   */
  removeQR(sessionId) {
    this.activeQRs.delete(sessionId);
  }

  /**
   * Получает все активные QR-коды
   * @returns {Array} - Массив активных QR-кодов
   */
  getActiveQRs() {
    return Array.from(this.activeQRs.values()).map(qr => ({
      sessionId: qr.sessionId,
      messengerType: qr.messengerType,
      status: qr.status,
      createdAt: qr.createdAt,
      expiresAt: qr.expiresAt
    }));
  }

  /**
   * Очищает истекшие QR-коды
   */
  cleanupExpiredQRs() {
    const now = new Date();
    for (const [sessionId, qrData] of this.activeQRs.entries()) {
      if (now > qrData.expiresAt) {
        this.activeQRs.delete(sessionId);
      }
    }
  }
}

module.exports = new QRCodeService();

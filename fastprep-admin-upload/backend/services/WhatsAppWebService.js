const puppeteer = require('puppeteer');
const QRCodeService = require('./QRCodeService');
const { v4: uuidv4 } = require('uuid');

class WhatsAppWebService {
  constructor() {
    this.browser = null;
    this.page = null;
    this.isConnected = false;
    this.activeSessions = new Map();
    this.messageHandlers = [];
  }

  /**
   * Инициализирует WhatsApp Web сессию
   * @param {string} sessionId - ID сессии
   * @returns {Promise<object>} - QR-код для подключения
   */
  async initializeSession(sessionId) {
    try {
      console.log('Initializing WhatsApp Web session:', sessionId);

      // Запускаем браузер
      this.browser = await puppeteer.launch({
        headless: false, // Показываем браузер для отладки
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });

      // Создаем новую страницу
      this.page = await this.browser.newPage();
      
      // Устанавливаем user agent
      await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      // Переходим на WhatsApp Web
      await this.page.goto('https://web.whatsapp.com', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Ждем загрузки QR-кода
      await this.page.waitForSelector('canvas', { timeout: 10000 });

      // Получаем QR-код
      const qrCodeDataURL = await this.page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        if (canvas) {
          return canvas.toDataURL();
        }
        return null;
      });

      if (!qrCodeDataURL) {
        throw new Error('Failed to get QR code from WhatsApp Web');
      }

      // Сохраняем сессию
      this.activeSessions.set(sessionId, {
        browser: this.browser,
        page: this.page,
        status: 'waiting_for_scan',
        createdAt: new Date()
      });

      // Обновляем статус QR-кода
      QRCodeService.updateQRStatus(sessionId, 'generated', {
        qrCode: qrCodeDataURL
      });

      return {
        sessionId,
        qrCode: qrCodeDataURL,
        status: 'waiting_for_scan'
      };

    } catch (error) {
      console.error('Error initializing WhatsApp Web session:', error);
      throw new Error(`Failed to initialize WhatsApp Web: ${error.message}`);
    }
  }

  /**
   * Ожидает сканирования QR-кода и подключения
   * @param {string} sessionId - ID сессии
   * @returns {Promise<boolean>} - true если подключение успешно
   */
  async waitForConnection(sessionId) {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      console.log('Waiting for WhatsApp Web connection...');

      // Ждем исчезновения QR-кода (означает успешное подключение)
      await session.page.waitForFunction(() => {
        const canvas = document.querySelector('canvas');
        return !canvas || canvas.style.display === 'none';
      }, { timeout: 120000 }); // 2 минуты на сканирование

      // Проверяем, что мы подключены
      const isConnected = await session.page.evaluate(() => {
        // Проверяем наличие элементов интерфейса WhatsApp
        const chatList = document.querySelector('[data-testid="chat-list"]');
        const searchBox = document.querySelector('[data-testid="search"]');
        return !!(chatList || searchBox);
      });

      if (isConnected) {
        this.isConnected = true;
        session.status = 'connected';
        session.connectedAt = new Date();
        
        QRCodeService.updateQRStatus(sessionId, 'connected');
        
        console.log('WhatsApp Web connected successfully!');
        
        // Запускаем мониторинг сообщений
        this.startMessageMonitoring(sessionId);
        
        return true;
      } else {
        throw new Error('Connection verification failed');
      }

    } catch (error) {
      console.error('Error waiting for WhatsApp Web connection:', error);
      QRCodeService.updateQRStatus(sessionId, 'failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Запускает мониторинг новых сообщений
   * @param {string} sessionId - ID сессии
   */
  async startMessageMonitoring(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    console.log('Starting message monitoring for session:', sessionId);

    // Мониторим новые сообщения
    await session.page.evaluateOnNewDocument(() => {
      // Функция для отслеживания новых сообщений
      window.whatsappMessageHandler = (messageElement) => {
        try {
          const messageData = {
            timestamp: new Date().toISOString(),
            text: messageElement.querySelector('[data-testid="msg-text"]')?.textContent || '',
            sender: messageElement.querySelector('[data-testid="msg-meta"]')?.textContent || '',
            isFromMe: messageElement.classList.contains('message-out'),
            messageId: messageElement.getAttribute('data-id') || Date.now().toString()
          };
          
          // Отправляем событие
          window.dispatchEvent(new CustomEvent('whatsapp-message', { 
            detail: messageData 
          }));
        } catch (error) {
          console.error('Error processing message:', error);
        }
      };

      // Наблюдаем за изменениями в DOM
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === 1 && node.querySelector('[data-testid="msg-text"]')) {
                window.whatsappMessageHandler(node);
              }
            });
          }
        });
      });

      // Запускаем наблюдение
      setTimeout(() => {
        const messageContainer = document.querySelector('[data-testid="conversation-panel-messages"]');
        if (messageContainer) {
          observer.observe(messageContainer, {
            childList: true,
            subtree: true
          });
        }
      }, 5000);
    });

    // Слушаем события сообщений
    session.page.on('console', msg => {
      if (msg.text().includes('whatsapp-message')) {
        console.log('New WhatsApp message detected');
      }
    });
  }

  /**
   * Отправляет сообщение
   * @param {string} sessionId - ID сессии
   * @param {string} contact - Имя контакта или номер телефона
   * @param {string} message - Текст сообщения
   * @returns {Promise<boolean>} - true если сообщение отправлено
   */
  async sendMessage(sessionId, contact, message) {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session || session.status !== 'connected') {
        throw new Error('Session not connected');
      }

      console.log(`Sending message to ${contact}: ${message}`);

      // Ищем контакт
      await session.page.evaluate((contactName) => {
        const searchBox = document.querySelector('[data-testid="search"]');
        if (searchBox) {
          searchBox.click();
          searchBox.value = contactName;
          searchBox.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, contact);

      // Ждем появления результатов поиска
      await session.page.waitForTimeout(2000);

      // Кликаем на первый результат
      await session.page.evaluate(() => {
        const firstResult = document.querySelector('[data-testid="cell-frame-container"]');
        if (firstResult) {
          firstResult.click();
        }
      });

      // Ждем открытия чата
      await session.page.waitForTimeout(1000);

      // Вводим сообщение
      await session.page.evaluate((messageText) => {
        const messageInput = document.querySelector('[data-testid="conversation-compose-box-input"]');
        if (messageInput) {
          messageInput.value = messageText;
          messageInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, message);

      // Отправляем сообщение
      await session.page.evaluate(() => {
        const sendButton = document.querySelector('[data-testid="send"]');
        if (sendButton) {
          sendButton.click();
        }
      });

      console.log('Message sent successfully');
      return true;

    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Получает статус сессии
   * @param {string} sessionId - ID сессии
   * @returns {object|null} - Статус сессии
   */
  getSessionStatus(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;

    return {
      sessionId,
      status: session.status,
      createdAt: session.createdAt,
      connectedAt: session.connectedAt,
      isConnected: this.isConnected
    };
  }

  /**
   * Закрывает сессию
   * @param {string} sessionId - ID сессии
   */
  async closeSession(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      if (session.browser) {
        await session.browser.close();
      }
      this.activeSessions.delete(sessionId);
      console.log('WhatsApp Web session closed:', sessionId);
    }
  }

  /**
   * Получает все активные сессии
   * @returns {Array} - Массив активных сессий
   */
  getActiveSessions() {
    return Array.from(this.activeSessions.entries()).map(([sessionId, session]) => ({
      sessionId,
      status: session.status,
      createdAt: session.createdAt,
      connectedAt: session.connectedAt
    }));
  }
}

module.exports = new WhatsAppWebService();

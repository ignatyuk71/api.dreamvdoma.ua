// Імпортуємо необхідні бібліотеки
require('dotenv').config(); // Завантажує .env змінні

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 8080;

// Додаємо middleware для автоматичного парсингу JSON-запитів
app.use(express.json());

// 🔐 Facebook Conversions API: токен доступу та ID пікселя
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const PIXEL_ID = process.env.PIXEL_ID;

// Конфігурація CORS — дозволяємо запити тільки з вашого сайту
const corsOptions = {
  origin: 'https://dream-v-doma.com.ua', // Ваш домен
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// 🔧 Тестовий маршрут для перевірки роботи сервера
app.post('/test-post', (req, res) => {
  console.log("📥 /test-post отримано:", req.body);
  res.json({
    success: true,
    message: 'Дані отримано успішно',
    received: req.body
  });
});

// 🎯 Основний маршрут — надсилання події PageView у Facebook
app.post('/api/pageView', async (req, res) => {
  const data = req.body;
  const event = data?.data?.[0] || {};
  const user = event.user_data || {};

  // Визначаємо IP користувача
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.socket?.remoteAddress ||
    null;
const cleanUrl = (url) => {
        try {
          const u = new URL(url);
          u.searchParams.delete('fbclid');
          return u.toString();
        } catch (e) {
          return url;
        }
      };
  // Формуємо payload згідно з вимогами Facebook CAPI
  const payload = {
    data: [
      {
        event_name: event.event_name || "PageView",
        event_time: event.event_time || Math.floor(Date.now() / 1000),
        action_source: event.action_source || "website",
        event_id: event.event_id || "event_" + Date.now(),
        event_source_url: cleanUrl(event.event_source_url || req.headers.referer || ""),
        user_data: {
          client_user_agent: user.client_user_agent || req.headers['user-agent'],
          fbp: user.fbp,
          fbc: user.fbc,
          external_id: user.external_id || "anonymous_user",
          client_ip_address: ip
        }
      }
    ]
  };

  // Логуємо, що саме відправляємо на Facebook
  console.log('📦 PageView payload для Facebook:\n', JSON.stringify(payload, null, 2));

  try {
    // Відправляємо запит до Facebook Conversions API
    const fbRes = await axios.post(
      `https://graph.facebook.com/v18.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    );

    // Виводимо відповідь від Facebook
    console.log('✅ Facebook відповів PageView->:');

    // Надсилаємо відповідь клієнту
    res.json({
      success: true,
      message: 'PageView успішно надіслано до Facebook',
      fb: fbRes.data
    });
  } catch (err) {
    // Якщо сталася помилка — виводимо та надсилаємо клієнту
    console.error('❌ Facebook error:', err.response?.data || err.message);
    res.status(500).json({
      success: false,
      message: 'Помилка надсилання PageView до Facebook',
      error: err.response?.data || err.message
    });
  }
});

// 🚀 Запуск сервера
app.listen(port, () => {
  console.log(`🚀 Сервер працює на порту ${port}`);
});

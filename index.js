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
  
    // Завжди генеруємо правильний event_time і event_id
    const currentUnixTime = Math.floor(Date.now() / 1000);
    const generatedEventId = "event_" + Date.now();
  
    // Формуємо user_data правильно
    const userData = {
      client_user_agent: user.client_user_agent || req.headers['user-agent'],
      client_ip_address: ip,
      external_id: user.external_id || "anonymous_user",
      fbc: user.fbc || null // fbc завжди лишаємо
    };
  
    if (user.fbp) {
      userData.fbp = user.fbp; // Додаємо fbp тільки якщо є
    }
  
    // Формуємо payload згідно з вимогами Facebook CAPI
    const payload = {
      data: [
        {
          event_name: event.event_name || "PageView",
          event_time: currentUnixTime,
          action_source: event.action_source || "website",
          event_id: generatedEventId,
          event_source_url: event.event_source_url || req.headers.referer || "",
          user_data: userData
        }
      ]
    };
  
    console.log('📦 PageView payload для Facebook:\n', JSON.stringify(payload, null, 2));
  
    try {
      const fbRes = await axios.post(
        `https://graph.facebook.com/v18.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );
  
      console.log('✅ Facebook відповів PageView -> fbtrace_id:', fbRes.data.fbtrace_id || 'немає');
      res.json({
        success: true,
        message: 'PageView успішно надіслано до Facebook',
        fb: fbRes.data
      });
    } catch (err) {
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

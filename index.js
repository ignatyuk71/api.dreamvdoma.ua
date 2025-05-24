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

  // Формуємо user_data
  const userData = {
    client_user_agent: user.client_user_agent || req.headers['user-agent'],
    fbc: user.fbc || null,
    external_id: user.external_id || "anonymous_user",
    client_ip_address: ip
  };

  if (user.fbp) {
    userData.fbp = user.fbp;
  }

  // Обробляємо event_source_url та чистимо крапку з комою, якщо є
  const rawEventUrl = event.event_source_url || req.headers.referer || '';
  const cleanEventUrl = rawEventUrl.replace(/;$/, '');

  // Виводимо в консоль перевірений URL
  console.log("🌐 event_source_url:", cleanEventUrl);

  // Формуємо payload згідно з вимогами Facebook CAPI
  const payload = {
    data: [
      {
        event_name: event.event_name || "PageView",
        event_time: event.event_time || Math.floor(Date.now() / 1000),
        action_source: event.action_source || "website",
        event_id: event.event_id || "event_" + Date.now(),
        event_source_url: cleanEventUrl,
        user_data: userData
      }
    ]
  };
  console.log('📦 паке payload для Facebook:\n', JSON.stringify(payload, null, 2));
  
  try {
    const fbRes = await axios.post(
      `https://graph.facebook.com/v18.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    );

    console.log('✅ Facebook відповів PageView ->');
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

  

// 🛒 ViewContent маршрут
app.post('/api/viewContent', async (req, res) => {
    //console.log("📥 Incoming POST request: ViewContent");
  
    const data = req.body;
    const event = req.body?.data?.[0] || {};
    const user = event.user_data || {};
    const custom = event.custom_data || {};
  
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.socket?.remoteAddress ||
      null;
  
    const userData = {
      client_user_agent: user.client_user_agent || req.headers['user-agent'],
      fbc: user.fbc || null,
      external_id: user.external_id || "anonymous_user",
      client_ip_address: ip
    };

    if (user.fbp) {
        userData.fbp = user.fbp; // Додаємо fbp тільки якщо є
      }
      
      console.log('📦 паке payload для Facebook:\n', JSON.stringify(payload, null, 2));
  
    const payload = {
      data: [
        {
          event_name: event.event_name || "ViewContent",
          event_time: event.event_time || Math.floor(Date.now() / 1000),
          action_source: event.action_source || "website",
          event_id: event.event_id || "event_" + Date.now(),
          event_source_url: event.event_source_url || req.headers.referer || "",
          user_data: userData,
          custom_data: {
            content_ids: custom.content_ids || [],
            content_name: custom.content_name || "",
            content_type: custom.content_type || "product",
            content_category: custom.content_category || "",
            contents: custom.contents || [],
            value: custom.value || 0,
            currency: custom.currency || "UAH"
          }
        }
      ]
    };

    //console.log("🔍 custom.content_ids =", custom.content_ids);
    //console.log("🧪 typeof =", typeof custom.content_ids);
    console.log('📦 ViewContent payload для Facebook:\n', JSON.stringify(payload, null, 2));
  
    try {
      const fbRes = await axios.post(
        `https://graph.facebook.com/v18.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );
      console.log("✅ Facebook відповів ViewContent →");
      res.json({ success: true, fb: fbRes.data });
    } catch (err) {
      console.error("❌ Facebook error (ViewContent):", err.response?.data || err.message);
      res.status(500).json({
        success: false,
        message: "Помилка надсилання ViewContent до Facebook",
        error: err.response?.data || err.message
      });
    }
  });
  

// ✅ AddToCart маршрут на сервері
app.post('/api/addToCart', async (req, res) => {
    const data = req.body;
    const event = data?.data?.[0] || {};
    const user = event.user_data || {};
    const custom = event.custom_data || {};
  
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.socket?.remoteAddress ||
      null;
  
    // ✅ Формуємо user_data
    const userData = {
      fbc: user.fbc,
      external_id: user.external_id || "anonymous_user",
      client_user_agent: user.client_user_agent || req.headers['user-agent'],
      client_ip_address: ip
    };
  
    if (user.fbp) {
      userData.fbp = user.fbp; // ✅ тільки якщо є
    }
  
    const payload = {
      data: [
        {
          event_name: event.event_name || "AddToCart",
          event_time: event.event_time || Math.floor(Date.now() / 1000),
          event_id: event.event_id || "event_" + Date.now(),
          action_source: event.action_source || "website",
          event_source_url: event.event_source_url || req.headers.referer || "",
          user_data: userData,
          custom_data: {
            content_ids: custom.content_ids || [],
            content_name: custom.content_name || "",
            content_type: custom.content_type || "product",
            content_category: custom.content_category || "",
            contents: custom.contents || [],
            value: custom.value || 0,
            currency: custom.currency || "UAH"
          }
        }
      ]
    };
    //console.log('📦 addtocar payload для Facebook:\n', JSON.stringify(payload, null, 2));
    try {
      const fbRes = await axios.post(
        `https://graph.facebook.com/v18.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );
  
      console.log("✅ Facebook відповів (AddToCart)->");
      res.json({ success: true, fb: fbRes.data });
    } catch (err) {
      console.error("❌ Facebook error (AddToCart):", err.response?.data || err.message);
      res.status(500).json({
        success: false,
        message: "Failed to send AddToCart to Facebook",
        error: err.response?.data || err.message
      });
    }
  });
  


  // 🔥 Purchase подія — відправка на Facebook після оформлення замовлення
  app.post('/api/purchase', async (req, res) => {
    const data = req.body;
    const event = data?.data?.[0] || {};
    const user = event.user_data || {};
    const custom = event.custom_data || {};
  
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.socket?.remoteAddress ||
      null;
  
    const userData = {
      client_user_agent: user.client_user_agent || req.headers['user-agent'],
      client_ip_address: ip,
      fbc: user.fbc,
      external_id: user.external_id || "anonymous_user",
      ph: user.ph,
      fn: user.fn,
      ln: user.ln
    };
  
    // Додаємо fbp, якщо є
    if (user.fbp) {
      userData.fbp = user.fbp;
    }
  
    // Додаємо email, якщо є
    if (user.em) {
      userData.em = user.em;
    }
  
    const payload = {
      data: [
        {
          event_name: event.event_name || "Purchase",
          event_time: event.event_time || Math.floor(Date.now() / 1000),
          event_id: event.event_id || "event_" + Date.now(),
          action_source: event.action_source || "website",
          event_source_url: event.event_source_url || req.headers.referer || "",
          user_data: userData,
          custom_data: {
            content_ids: custom.content_ids || [],
            content_type: custom.content_type || "product",
            contents: custom.contents || [],
            value: custom.value || 0,
            currency: "UAH"
          }
        }
      ]
    };
    //console.log('📦 PageView payload для Facebook:\n', JSON.stringify(payload, null, 2));
  
    try {
      const fbRes = await axios.post(
        `https://graph.facebook.com/v18.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );
  
      console.log("✅ Facebook відповів (Purchase):->");
      res.json({ success: true, fb: fbRes.data });
    } catch (err) {
      console.error("❌ Facebook error (Purchase):", err.response?.data || err.message);
      res.status(500).json({
        success: false,
        message: "Failed to send Purchase to Facebook",
        error: err.response?.data || err.message
      });
    }
  });
  
  
  

// 🚀 Запуск сервера
app.listen(port, () => {
  console.log(`🚀 Сервер працює на порту ${port}`);
});
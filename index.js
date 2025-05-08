// index.js
require('dotenv').config(); // Завантажує .env змінні

const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// 🔧 Тестовий маршрут для перевірки
app.post('/test-post', (req, res) => {
  console.log("📥 /test-post отримано:", req.body);
  res.json({
    success: true,
    message: 'Дані отримано успішно',
    received: req.body
  });
});

// Запуск сервера
app.listen(port, () => {
  console.log(`🚀 Сервер працює на порту ${port}`);
});

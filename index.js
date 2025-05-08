require('dotenv').config(); // Якщо використовуєш .env
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ✅ Тестовий маршрут GET
app.get('/test', (req, res) => {
  res.send('✅ Сервер працює успішно!');
});

// ✅ Тестовий маршрут POST
app.post('/test-post', (req, res) => {
  console.log("📨 POST отримано:", req.body);
  res.json({ success: true, received: req.body });
});

app.listen(port, () => {
  console.log(`🚀 Сервер запущено на порту ${port}`);
});

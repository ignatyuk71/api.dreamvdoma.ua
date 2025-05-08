app.post('/test-post', (req, res) => {
    console.log("📨 Отримано POST:", req.body);
    res.json({ success: true, received: req.body });
  });
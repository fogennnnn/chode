const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/hello', (_req, res) => {
  res.json({ message: 'Hello, world!' });
});

app.post('/echo', (req, res) => {
  res.json({ received: req.body });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;

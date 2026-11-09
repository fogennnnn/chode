const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/hello', (req, res) => {
  res.json({ message: 'Hello, World!' });
});

app.post('/echo', (req, res) => {
  res.json(req.body);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const express = require('express');

const app = express();
const PORT = 3000;

app.get('/api/items', (req, res) => {
  res.json([
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
    { id: 3, name: 'Item 3' }
  ]);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

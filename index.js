const express = require('express');
const app = express();
const port = 3000;

// Setează o rută principală
app.get('/', (req, res) => {
  res.send('Bun venit pe serverul meu Node.js!');
});

// Rularea serverului
app.listen(port, () => {
  console.log(`Serverul rulează la http://localhost:${port}`);
});

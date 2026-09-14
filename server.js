require('dotenv').config();
const express = require('express');
const conectarBD = require('./config/db.js');

const app = express();

conectarBD();

app.use(express.json());

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
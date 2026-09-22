import dotenv from 'dotenv';
import express, { json } from 'express';
import conectarBD from './config/db.js';
import path from 'path';
import rutas from './routes/routes.js';

const app = express();
dotenv.config();

//Obtiene el puerto desde las variables de entorno
const PORT = process.env.PORT;
conectarBD();

// Middleware para interpretar JSON
app.use(json());

// Rutas
app.use(express.static(path.join(process.cwd(), 'views')));
app.use(rutas);

// Levanta el servidor en el puerto especificado
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
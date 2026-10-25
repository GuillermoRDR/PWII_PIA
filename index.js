import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import path from 'node:path';
import conectarBD from './config/db.js';
import rutas from './routes/index.js';

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.SESSION_SECRET) {
  throw new Error('Falta SESSION_SECRET en el archivo .env');
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  name: 'session',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}))
app.use(express.static(path.join(process.cwd(), 'views')));
app.use('/', rutas);

async function iniciarServidor() {
  try {
    await conectarBD();
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('Error al iniciar servidor:', error);
    process.exit(1);
  }
}

iniciarServidor();
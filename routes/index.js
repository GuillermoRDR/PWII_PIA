import { Router } from 'express';
import path from 'node:path';
import usuariosRouter from './rUsuario.js';

const rutas = Router();
const viewsPath = path.join(process.cwd(), 'views');

rutas.get('/', (req, res) => {
  res.sendFile(path.join(viewsPath, 'principal.html'));
});

rutas.get('/inicioSesion', (req, res) => {
  res.sendFile(path.join(viewsPath, 'login.html'));
});

rutas.get('/registro', (req, res) => {
  res.sendFile(path.join(viewsPath, 'registro.html'));
});

rutas.use('/api/usuario', usuariosRouter);

export default rutas;
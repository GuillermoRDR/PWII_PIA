import { Router } from 'express';
import path from 'node:path';
import usuariosRouter from './rUsuario.js';
import comerciosRouter from './rComercio.js';
import puestosRouter from './rPuesto.js';
import suscripcionesRouter from './rSuscripcion.js';

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
rutas.use('/api/comercios', comerciosRouter);
rutas.use('/api/puestos', puestosRouter);

export default rutas;
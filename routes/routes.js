import { Router } from 'express';
import path from 'path';

const rutas = Router();

rutas.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(),'views', 'principal.html'));
});

export default rutas;

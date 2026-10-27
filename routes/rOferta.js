import { Router } from 'express';
import multer from 'multer';
import { registrarOferta, obtenerOferta } from '../controllers/cOferta.js';
import { protegerRuta } from '../controllers/middleware.js';

const rutas = Router();

const upload = multer({
  storage: multer.memoryStorage(), 
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, callback) {
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];

    if (!tiposPermitidos.includes(file.mimetype)) {
      return callback(
        new Error('Solo se permiten imágenes JPG, PNG o WebP.')
      );
    }

    callback(null, true);
  }
});

rutas.post('/registro', protegerRuta,  upload.single('fotoOferta'), registrarOferta);

rutas.get('/:id', protegerRuta, obtenerOferta);


export default rutas;
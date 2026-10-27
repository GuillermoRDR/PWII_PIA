import { Router } from 'express';
import { registrarSuscripcion, obtenerSuscripciones, obtenerMisSuscripciones, obtenerSuscripcionPorId, actualizarSuscripcion, desactivarSuscripcion, reactivarSuscripcion } from '../controllers/cSuscripcion.js';
import { protegerRuta, autorizarRoles } from '../controllers/middleware.js';
import multer from 'multer';

const rutas = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter(req, file, callback) {
    const permitidos = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (!permitidos.includes(file.mimetype)) {
      return callback(new Error('Solo se permiten imágenes JPG, PNG o WebP.'));
    }

    callback(null, true);
  }
});

rutas.get('/', obtenerSuscripciones);
rutas.get('/mis-suscripciones', protegerRuta, autorizarRoles('comerciante', 'administrador'), obtenerMisSuscripciones);
rutas.get('/:id', obtenerSuscripcionPorId);

rutas.post('/', protegerRuta, autorizarRoles('comerciante', 'administrador'), upload.single('imagenSuscripcion'), registrarSuscripcion);

rutas.patch('/:id', protegerRuta, autorizarRoles('comerciante', 'administrador'), actualizarSuscripcion);
rutas.patch('/:id/desactivar', protegerRuta, autorizarRoles('comerciante', 'administrador'), desactivarSuscripcion);
rutas.patch('/:id/reactivar', protegerRuta, autorizarRoles('comerciante', 'administrador'), reactivarSuscripcion);

export default rutas;
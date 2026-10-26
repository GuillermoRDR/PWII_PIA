import { Router } from 'express';
import { registrarComercio, obtenerComercios, obtenerComercioPorCodigo, obtenerMisComercios, obtenerComercioPorId, actualizarComercio, desactivarComercio, reactivarComercio } from '../controllers/cComercio.js';
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

rutas.get('/', obtenerComercios);
rutas.get('/codigo/:codigo', obtenerComercioPorCodigo);
rutas.get('/mis-comercios', protegerRuta, autorizarRoles('comerciante', 'administrador'), obtenerMisComercios);
rutas.get('/:id', obtenerComercioPorId);

rutas.post('/', protegerRuta, autorizarRoles('comerciante', 'administrador'), upload.single('imagenComercio'), registrarComercio);

rutas.patch('/:id', protegerRuta, autorizarRoles('comerciante', 'administrador'), actualizarComercio);
rutas.patch('/:id/desactivar', protegerRuta, autorizarRoles('comerciante', 'administrador'), desactivarComercio);
rutas.patch('/:id/reactivar', protegerRuta, autorizarRoles('comerciante', 'administrador'), reactivarComercio);

export default rutas;
import { Router } from 'express';
import multer from 'multer';
import { registrarPuesto, obtenerPuestos, obtenerMisPuestos, obtenerPuestoPorId, actualizarPuesto, desactivarPuesto, reactivarPuesto } from '../controllers/cPuesto.js';
import { protegerRuta, autorizarRoles } from '../controllers/middleware.js';

const rutas = Router();

const upload = multer({storage: multer.memoryStorage(), limits: {fileSize: 5 * 1024 * 1024}, fileFilter(req, file, callback) {
    if (![
      'image/jpeg',
      'image/png',
      'image/webp'
    ].includes(file.mimetype)) {
      return callback(new Error(
        'Solo se permiten imágenes JPG, PNG o WebP.'
      ));
    }
    callback(null, true);
  }
});

rutas.get('/', obtenerPuestos);
rutas.get('/mis-puestos', protegerRuta, autorizarRoles('comerciante', 'administrador'), obtenerMisPuestos);
rutas.get('/:id', obtenerPuestoPorId);

rutas.post( '/', protegerRuta, autorizarRoles('comerciante', 'administrador'), upload.single('imagenPuesto'), registrarPuesto);

rutas.patch('/:id', protegerRuta, autorizarRoles('comerciante', 'administrador'), actualizarPuesto);
rutas.patch('/:id/desactivar', protegerRuta, autorizarRoles('comerciante', 'administrador'), desactivarPuesto);
rutas.patch('/:id/reactivar', protegerRuta, autorizarRoles('comerciante', 'administrador'), reactivarPuesto);

export default rutas;
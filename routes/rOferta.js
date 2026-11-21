import { Router } from 'express';
import multer from 'multer';
import { obtenerOfertas, obtenerOfertaPorId, registrarOferta, desactivarOferta, reactivarOferta, actualizarOferta } from '../controllers/cOferta.js';
import { protegerRuta, autorizarRoles } from '../controllers/middleware.js';

const rutas = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

rutas.get('/', obtenerOfertas);
rutas.get('/:id', obtenerOfertaPorId);
rutas.patch('/:id/desactivar', protegerRuta, autorizarRoles('comerciante', 'administrador'), desactivarOferta);
rutas.patch('/:id/reactivar', protegerRuta, autorizarRoles('comerciante', 'administrador'), reactivarOferta);
rutas.patch('/:id', protegerRuta, autorizarRoles('comerciante', 'administrador'), upload.single('fotoOferta'), actualizarOferta);

rutas.post('/', protegerRuta, autorizarRoles('comerciante', 'administrador'), upload.single('fotoOferta'), registrarOferta);

export default rutas;
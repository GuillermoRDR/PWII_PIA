import { Router } from 'express';
import multer from 'multer';
import { obtenerSuscripciones, registrarSuscripcion, obtenerSuscripcionPorId, desactivarSuscripcion, actualizarSuscripcion, comprarSuscripcion } from '../controllers/cSuscripcion.js';
import { protegerRuta, autorizarRoles } from '../controllers/middleware.js'

const rutas = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: {fileSize: 5 * 1024 * 1024} });

rutas.get('/', obtenerSuscripciones);
rutas.get('/:id', obtenerSuscripcionPorId);
rutas.patch('/:id/desactivar', protegerRuta, autorizarRoles('administrador'), desactivarSuscripcion);
rutas.patch('/:id', protegerRuta, autorizarRoles('administrador'), upload.single('imagenSuscripcion'), actualizarSuscripcion);

rutas.post('/', protegerRuta, autorizarRoles('administrador'), upload.single('imagenSuscripcion'), registrarSuscripcion);
rutas.post('/:id/comprar', protegerRuta, comprarSuscripcion);

export default rutas;
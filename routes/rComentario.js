import { Router } from 'express';
import {
  obtenerComentarios,
  crearComentario,
  actualizarComentario,
  eliminarComentario
} from '../controllers/cComentario.js';
import { protegerRuta, autorizarRoles } from '../controllers/middleware.js';

const router = Router();
const todosLosRoles = autorizarRoles('cliente', 'comerciante', 'administrador');

router.get('/puesto/:idPuesto', obtenerComentarios);

router.post('/', protegerRuta, todosLosRoles, crearComentario);
router.patch('/:id', protegerRuta, todosLosRoles, actualizarComentario);
router.delete('/:id', protegerRuta, todosLosRoles, eliminarComentario);

export default router;
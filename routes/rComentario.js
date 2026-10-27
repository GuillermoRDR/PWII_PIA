import { Router } from 'express';
import multer from 'multer';
import { registrarComentario, obtenerComentario } from '../controllers/cComentario.js';

const rutas = Router();



rutas.post('/registro', registrarComentario);

rutas.get('/Comentario/:id', protegerRuta, obtenerComentario);


export default rutas;
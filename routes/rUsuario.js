import { Router } from 'express';
import multer from 'multer';
import { registrarUsuario, inicioSesionUsuario, obtenerPerfilUsuario, cerrarSesionUsuario } from '../controllers/cUsuario.js';
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

rutas.post('/registro', upload.single('fotoPerfil'), registrarUsuario);

rutas.post('/inicioSesion', inicioSesionUsuario);

rutas.get('/perfil', protegerRuta, obtenerPerfilUsuario);

rutas.post('/cerrarSesion', protegerRuta, cerrarSesionUsuario);

export default rutas;
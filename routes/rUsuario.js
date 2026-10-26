import { Router } from 'express';
import multer from 'multer';
import { registrarUsuario, inicioSesionUsuario, obtenerPerfilUsuario, cerrarSesionUsuario, actualizarPerfilUsuario } from '../controllers/cUsuario.js';
import { protegerRuta } from '../controllers/middleware.js';

const rutas = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter(req, file, callback) {
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];

    if (!tiposPermitidos.includes(file.mimetype)) {
      return callback(
        new Error('Solo se permiten imágenes JPG, PNG o WebP.')
      );
    }

    callback(null, true);
  }
});

rutas.get('/perfil', obtenerPerfilUsuario);

rutas.post('/registro', upload.single('fotoPerfil'), registrarUsuario);
rutas.post('/inicioSesion', inicioSesionUsuario);
rutas.post('/cerrarSesion', protegerRuta, cerrarSesionUsuario);

rutas.patch('/perfil', protegerRuta, upload.single('fotoPerfil'), actualizarPerfilUsuario);

export default rutas;
import Usuario from '../models/Usuario.js';

export function protegerRuta(req, res, next) {
  if (!req.session?.usuarioId) {
    return res.status(401).json({
      error: 'No autorizado. Por favor inicia sesión.'
    });
  }

  return next();
}

export function autorizarRoles(...rolesPermitidos) {
  return async (req, res, next) => {
    try {
      if (!req.session?.usuarioId) {
        return res.status(401).json({
          error: 'Debes iniciar sesión.'
        });
      }

      const usuario = await Usuario.findById(req.session.usuarioId);

      if (!usuario) {
        return res.status(401).json({
          error: 'Usuario no encontrado.'
        });
      }

      if (!rolesPermitidos.includes(usuario.tipoUsuario)) {
        return res.status(403).json({
          error: 'No tienes permisos para realizar esta operación.'
        });
      }

      req.usuario = usuario;
      next();

    } catch (error) {
      next(error);
    }
  };
}
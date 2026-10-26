import bcrypt from 'bcrypt';
import Usuario from '../models/Usuario.js';
import bucket from '../config/firebase.js';
import { randomUUID } from 'node:crypto';

export async function registrarUsuario(req, res) {
  try {
    const {
      nombreUsuario,
      correo,
      password,
      verificarContra,
      localidad,
      tipoUsuario,
      genero,
      edad,
      descripcionPerfil
    } = req.body;

    if (
      !nombreUsuario?.trim() ||
      !correo?.trim() ||
      !password ||
      !verificarContra
    ) {
      return res.status(400).json({
        error: 'Completa los campos obligatorios.'
      });
    }

    if (password !== verificarContra) {
      return res.status(400).json({
        error: 'Las contraseñas no coinciden.'
      });
    }

    const rolesPermitidos = ['cliente', 'comerciante'];

    if (!rolesPermitidos.includes(tipoUsuario)) {
      return res.status(400).json({
        error: 'Tipo de usuario no permitido.'
      });
    }

    const edadNumero = edad === undefined || edad === ''
      ? undefined
      : Number(edad);

    if (
      edadNumero !== undefined &&
      (!Number.isInteger(edadNumero) || edadNumero < 0)
    ) {
      return res.status(400).json({
        error: 'La edad debe ser un número entero no negativo.'
      });
    }

    const correoNormalizado = correo.trim().toLowerCase();

    const usuarioExistente = await Usuario.findOne({
      correo: correoNormalizado
    });

    if (usuarioExistente) {
      return res.status(409).json({
        error: 'El correo electrónico ya está registrado.'
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let fotoPerfil = '';

    if (req.file) {
      const extensiones = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp'
      };

      const extension = extensiones[req.file.mimetype];

      if (!extension) {
        return res.status(400).json({
          error: 'Formato de imagen no permitido.'
        });
      }

      const nombreArchivo = `perfiles/${randomUUID()}.${extension}`;

      const archivo = bucket.file(nombreArchivo);

      await archivo.save(req.file.buffer, {
        metadata: {
          contentType: req.file.mimetype
        }
      });

      fotoPerfil = nombreArchivo;
    }

    const usuario = await Usuario.create({
      nombreUsuario: nombreUsuario.trim(),
      correo: correoNormalizado,
      password: passwordHash,
      localidad: localidad?.trim() || '',
      tipoUsuario,
      genero: genero || '',
      edad: edadNumero,
      descripcionPerfil: descripcionPerfil?.trim() || '',
      fotoPerfil
    });

    return res.status(201).json({
      mensaje: 'Usuario registrado correctamente.',
      usuario: {
        id: usuario._id,
        nombreUsuario: usuario.nombreUsuario,
        correo: usuario.correo,
        tipoUsuario: usuario.tipoUsuario
      }
    });

  } catch (error) {
    console.error('Error al registrar usuario:', error);

    if (error.code === 11000) {
      return res.status(409).json({
        error: 'El correo electrónico ya está registrado.'
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Los datos proporcionados no son válidos.'
      });
    }

    return res.status(500).json({
      error: 'Error interno del servidor.'
    });
  }
}
export async function inicioSesionUsuario(req, res) {
  try {
    const { correo, password } = req.body;

    if (
      typeof correo !== 'string' ||
      typeof password !== 'string' ||
      !correo.trim() ||
      !password
    ) {
      return res.status(400).json({
        error: 'Correo y contraseña son obligatorios.'
      });
    }

    const correoNormalizado = correo.trim().toLowerCase();

    if (!correo || !password) {
      return res.status(400).json({
        error: 'Correo y contraseña son obligatorios.'
      });
    }

    const usuario = await Usuario.findOne({
      correo: correoNormalizado
    }).select('+password');

    if (!usuario) {
      return res.status(401).json({
        error: 'Correo o contraseña incorrectos.'
      });
    }

    const coincide = await bcrypt.compare(
      password,
      usuario.password
    );

    if (!coincide) {
      return res.status(401).json({
        error: 'Correo o contraseña incorrectos.'
      });
    }

    req.session.regenerate((error) => {
      if (error) {
        return res.status(500).json({
          error: 'No se pudo iniciar la sesión.'
        });
      }

      req.session.usuarioId = usuario._id.toString();

      req.session.save((error) => {
        if (error) {
          return res.status(500).json({
            error: 'No se pudo guardar la sesión.'
          });
        }

        return res.status(200).json({
          mensaje: 'Inicio de sesión exitoso.',
          usuario: {
            id: usuario._id,
            nombreUsuario: usuario.nombreUsuario,
            correo: usuario.correo,
            tipoUsuario: usuario.tipoUsuario
          }
        });
      });
    });

  } catch (error) {
    console.error('Error al iniciar sesión:', error);

    return res.status(500).json({
      error: 'Error interno del servidor.'
    });
  }
}

export async function obtenerPerfilUsuario(req, res) {
  try {
    const usuario = await Usuario.findById(
      req.session.usuarioId
    );

    if (!usuario) {
      return res.status(404).json({
        error: 'Usuario no encontrado.'
      });
    }

    return res.status(200).json(await prepararUsuario(usuario));

  } catch (error) {
    console.error('Error al obtener perfil:', error);

    return res.status(500).json({
      error: 'No se pudo obtener el perfil.'
    });
  }
}

export function cerrarSesionUsuario(req, res) {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({
        error: 'No se pudo cerrar la sesión.'
      });
    }

    res.clearCookie('connect.sid');

    return res.status(200).json({
      mensaje: 'Sesión cerrada correctamente.'
    });
  });
}

export async function actualizarPerfilUsuario(req, res) {
  try {
    const camposPermitidos = [
      'nombreUsuario',
      'localidad',
      'descripcionPerfil',
      'genero',
      'edad'
    ];

    const cambios = {};

    for (const campo of camposPermitidos) {
      if (req.body[campo] !== undefined) {
        cambios[campo] = req.body[campo];
      }
    }

    if (cambios.nombreUsuario !== undefined) {
      if (
        typeof cambios.nombreUsuario !== 'string' ||
        !cambios.nombreUsuario.trim()
      ) {
        return res.status(400).json({
          error: 'El nombre de usuario no puede estar vacío.'
        });
      }

      cambios.nombreUsuario = cambios.nombreUsuario.trim();
    }

    for (const campo of ['localidad', 'descripcionPerfil', 'genero']) {
      if (cambios[campo] !== undefined) {
        if (typeof cambios[campo] !== 'string') {
          return res.status(400).json({
            error: `El campo ${campo} debe ser texto.`
          });
        }

        cambios[campo] = cambios[campo].trim();
      }
    }

    if (cambios.edad !== undefined) {
      if (cambios.edad === '') {
        cambios.edad = null;
      } else {
        const edad = Number(cambios.edad);

        if (!Number.isInteger(edad) || edad < 0) {
          return res.status(400).json({
            error: 'La edad debe ser un entero no negativo.'
          });
        }

        cambios.edad = edad;
      }
    }

    if (req.file) {
      const extensiones = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp'
      };

      const extension = extensiones[req.file.mimetype];

      if (!extension) {
        return res.status(400).json({
          error: 'Formato de imagen no permitido.'
        });
      }

      const nombreArchivo = `perfiles/${randomUUID()}.${extension}`;

      await bucket.file(nombreArchivo).save(req.file.buffer, {
        metadata: {
          contentType: req.file.mimetype
        }
      });

      cambios.fotoPerfil = nombreArchivo;
    }

    const usuario = await Usuario.findByIdAndUpdate(
      req.session.usuarioId,
      { $set: cambios },
      {
        new: true,
        runValidators: true
      }
    );

    if (!usuario) {
      return res.status(404).json({
        error: 'Usuario no encontrado.'
      });
    }

    return res.status(200).json({
      mensaje: 'Perfil actualizado correctamente.',
      usuario: await prepararUsuario(usuario)
    });

  } catch (error) {
    console.error('Error al actualizar perfil:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Los datos proporcionados no son válidos.'
      });
    }

    return res.status(500).json({
      error: 'No se pudo actualizar el perfil.'
    });
  }
}

async function prepararUsuario(usuario) {
  const datos = usuario.toObject();

  delete datos.password;

  datos.fotoPerfilUrl = null;

  if (datos.fotoPerfil) {
    const [url] = await bucket.file(datos.fotoPerfil).getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000
    });

    datos.fotoPerfilUrl = url;
  }

  return datos;
}
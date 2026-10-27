import Suscripcion from '../models/Suscripcion.js';
import mongoose from 'mongoose';
import bucket from '../config/firebase.js';
import { randomUUID } from 'node:crypto';

export async function registrarSuscripcion(req, res) {
  let archivoSubido = null;

  try {
    const {
      titulo,
      descripcion,
      precio
    } = req.body;

    if (
      typeof titulo !== 'string' ||
      !titulo.trim() ||
      typeof descripcion !== 'string' ||
      !descripcion.trim() || 
      !precio
    ) {
      return res.status(400).json({
        error: 'El título, la descripción y el precio son obligatorios.'
      });
    }

  


    let imagenSuscripcion = '';

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

      imagenSuscripcion = `suscripciones/${randomUUID()}.${extension}`;

      archivoSubido = bucket.file(imagenSuscripcion);

      await archivoSubido.save(req.file.buffer, {
        resumable: false,
        metadata: {
          contentType: req.file.mimetype
        }
      });
    }

    const datosSuscripcion = {
  usuario: req.session.usuarioId,
  titulo: titulo.trim(),
  descripcion: descripcion.trim(),
  precio: parseFloat(precio),
  imagenSuscripcion
};

const suscripcion = await Suscripcion.create(datosSuscripcion);

return res.status(201).json({
  mensaje: 'Suscripción registrada correctamente.',
  suscripcion
});
         
      } catch (error) {
    if (archivoSubido) {
      try {
        await archivoSubido.delete({ ignoreNotFound: true });
      } catch (errorLimpieza) {
        console.error('No se pudo limpiar la imagen:', errorLimpieza);
      }
    }

    if (error.name === 'ValidationError' ||
      error.name === 'CastError') {
      return res.status(400).json({
        error: 'Los datos de la suscripción no son válidos.'
      });
    }

    console.error('Error al registrar suscripción:', error);

    return res.status(500).json({
      error: 'No se pudo registrar la suscripción.'
    });
  }
}

export async function obtenerSuscripciones(req, res) {
  try {
    const suscripciones = await Suscripcion.find({
      activa: { $ne: false }
    }).sort({ createdAt: -1 });

    const resultado = await Promise.all(
      suscripciones.map(prepararSuscripcion)
    );

    return res.status(200).json(resultado);

  } catch (error) {
    console.error('Error al consultar suscripciones:', error);

    return res.status(500).json({
      error: 'No se pudieron consultar las suscripciones.'
    });
  }
}

export async function obtenerMisSuscripciones(req, res) {
  try {
    const suscripciones = await Suscripcion.find({
      usuario: req.session.usuarioId
    }).sort({ createdAt: -1 });

    const resultado = await Promise.all(
      suscripciones.map(prepararSuscripcion)
    );

    return res.status(200).json(resultado);

  } catch (error) {
    console.error('Error al consultar mis suscripciones:', error);

    return res.status(500).json({
      error: 'No se pudieron consultar tus suscripciones.'
    });
  }
}

export async function obtenerSuscripcionPorId(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: 'Identificador de suscripción no válido.'
      });
    }

    const suscripcion = await Suscripcion.findById(id);

    if (!suscripcion) {
      return res.status(404).json({
        error: 'Suscripción no encontrada.'
      });
    }

    if (suscripcion && suscripcion.activa === false) {
      return res.status(404).json({
        error: 'Suscripción no encontrada.'
      });
    }

    return res.status(200).json(await prepararSuscripcion(suscripcion));

  } catch (error) {
    console.error('Error al consultar suscripción:', error);

    return res.status(500).json({
      error: 'No se pudo consultar la suscripción.'
    });
  }
}

export async function actualizarSuscripcion(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: 'Identificador de suscripción no válido.'
      });
    }

    const suscripcion = await Suscripcion.findById(id);

    if (suscripcion.usuario.toString() !== req.session.usuarioId) {
  return res.status(403).json({
    error: 'No tienes permiso para modificar esta suscripción.'
  });
}
    
    if (!suscripcion) {
      return res.status(404).json({
        error: 'Suscripción no encontrada.'
      });
    }

    const camposPermitidos = [
      'titulo',
      'descripcion',
      'precio',
      'fecha inicio',
      'fecha fin',
    ];

    const cambios = {};

    for (const campo of camposPermitidos) {
      if (req.body[campo] !== undefined) {
        cambios[campo] = req.body[campo];
      }
    }

    if (Object.keys(cambios).length === 0) {
      return res.status(400).json({
        error: 'No se proporcionaron campos para actualizar.'
      });
    }

    for (const campo of ['titulo', 'descripcion']) {
      if (cambios[campo] !== undefined) {
        if (
          typeof cambios[campo] !== 'string' ||
          !cambios[campo].trim()
        ) {
          return res.status(400).json({
            error: `El campo ${campo} no puede estar vacío.`
          });
        }

        cambios[campo] = cambios[campo].trim();
      }
    }

   

   

   

    suscripcion.set(cambios);
    await suscripcion.save();

    return res.status(200).json({
      mensaje: 'Suscripción actualizada correctamente.',
      suscripcion
    });

  } catch (error) {
    if (
      error.name === 'ValidationError' ||
      error.name === 'CastError'
    ) {
      return res.status(400).json({
        error: 'Los datos proporcionados no son válidos.'
      });
    }

    console.error('Error al actualizar suscripción:', error);

    return res.status(500).json({
      error: 'No se pudo actualizar la suscripción.'
    });
  }
}

async function cambiarEstadoSuscripcion(req, res, activar) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: 'Identificador de suscripción no válido.'
      });
    }

    const suscripcion = await Suscripcion.findById(id);

    if (!suscripcion) {
      return res.status(404).json({
        error: 'Suscripción no encontrada.'
      });
    }


    const activoActual = suscripcion.activa !== false;

    if (activoActual === activar) {
      return res.status(409).json({
        error: activar
          ? 'La suscripción ya está activa.'
          : 'La suscripción ya está desactivada.'
      });
    }

    if (suscripcion.usuario.toString() !== req.session.usuarioId) {
  return res.status(403).json({
    error: 'No tienes permiso para modificar esta suscripción.'
  });
}

  } catch (error) {
    console.error('Error al cambiar estado de la suscripción:', error);

    return res.status(500).json({
      error: 'No se pudo cambiar el estado de la suscripción.'
    });
  }
}

export function desactivarSuscripcion(req, res) {
  return cambiarEstadoSuscripcion(req, res, false);
}

export function reactivarSuscripcion(req, res) {
  return cambiarEstadoSuscripcion(req, res, true);
}

async function prepararSuscripcion(suscripcion) {
  const datos = suscripcion.toObject();

  datos.imagenSuscripcionUrl = null;

  if (datos.imagenSuscripcion) {
    try {
      const [url] = await bucket
        .file(datos.imagenSuscripcion)
        .getSignedUrl({
          version: 'v4',
          action: 'read',
          expires: Date.now() + 15 * 60 * 1000
        });

      datos.imagenSuscripcionUrl = url;
    } catch (error) {
      console.error('Error al obtener imagen de la suscripción:', error);
    }
  }

  return datos;
}

export async function obtenerSuscripcionPorCodigo(req, res) {
  try {
    const codigo = String(req.params.codigo || '').trim().toUpperCase();
    const suscripcion = await Suscripcion.findOne({ codigoSuscripcion: codigo, activa: { $ne: false } }).select('_id nombreSuscripcion direccion codigoSuscripcion');
    if (!suscripcion) return res.status(404).json({ error: 'No existe una suscripción activa con ese código.' });
    return res.json(await prepararSuscripcion(suscripcion));
  } catch (error) {
    console.error('Error al validar código:', error);
    return res.status(500).json({ error: 'No se pudo validar el código.' });
  }
}

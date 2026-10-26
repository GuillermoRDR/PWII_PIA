import Comercio from '../models/Comercio.js';
import mongoose from 'mongoose';
import { randomBytes, randomUUID } from 'node:crypto';
import bucket from '../config/firebase.js';

function generarCodigoComercio() {
  return `COM-${randomBytes(8).toString('hex').toUpperCase()}`;
}

export async function registrarComercio(req, res) {
  let archivoSubido = null;

  try {
    const {
      nombreComercio,
      direccion,
      descripcionComercio
    } = req.body;

    if (
      typeof nombreComercio !== 'string' ||
      !nombreComercio.trim() ||
      typeof direccion !== 'string' ||
      !direccion.trim()
    ) {
      return res.status(400).json({
        error: 'El nombre y la dirección son obligatorios.'
      });
    }

    let categorias = [];
    let horario = [];

    try {
      categorias = JSON.parse(req.body.categorias || '[]');
      horario = JSON.parse(req.body.horario || '[]');
    } catch {
      return res.status(400).json({
        error: 'Las categorías o los horarios tienen un formato incorrecto.'
      });
    }

    if (
      !Array.isArray(categorias) ||
      !categorias.every(c => typeof c === 'string' && c.trim())
    ) {
      return res.status(400).json({
        error: 'Las categorías deben ser una lista de textos válidos.'
      });
    }

    if (!Array.isArray(horario) || horario.length === 0) {
      return res.status(400).json({
        error: 'Selecciona al menos un día de funcionamiento.'
      });
    }

    const diasValidos = [
      'Lunes', 'Martes', 'Miércoles', 'Jueves',
      'Viernes', 'Sábado', 'Domingo'
    ];

    const diasRegistrados = new Set();

    for (const item of horario) {
      if (
        !item ||
        typeof item !== 'object' ||
        !diasValidos.includes(item.dia) ||
        typeof item.apertura !== 'string' ||
        typeof item.cierre !== 'string' ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(item.apertura) ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(item.cierre) ||
        item.apertura >= item.cierre ||
        diasRegistrados.has(item.dia)
      ) {
        return res.status(400).json({
          error: 'Los horarios contienen datos inválidos o días repetidos.'
        });
      }

      diasRegistrados.add(item.dia);
    }

    let imagenComercio = '';

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

      imagenComercio = `comercios/${randomUUID()}.${extension}`;

      archivoSubido = bucket.file(imagenComercio);

      await archivoSubido.save(req.file.buffer, {
        resumable: false,
        metadata: {
          contentType: req.file.mimetype
        }
      });
    }

    const datosComercio = {
      nombreComercio: nombreComercio.trim(),
      direccion: direccion.trim(),
      descripcionComercio:
        typeof descripcionComercio === 'string'
          ? descripcionComercio.trim()
          : '',
      categorias: categorias.map(c => c.trim()),
      horario,
      imagenComercio,
      propietario: req.session.usuarioId
    };

    for (let intento = 0; intento < 3; intento++) {
      try {
        const comercio = await Comercio.create({
          ...datosComercio,
          codigoComercio: generarCodigoComercio()
        });

        return res.status(201).json({
          mensaje: 'Comercio registrado correctamente.',
          comercio
        });

      } catch (error) {
        const colisionCodigo =
          error.code === 11000 &&
          Object.keys(error.keyPattern ?? {})
            .includes('codigoComercio');

        if (!colisionCodigo) throw error;
      }
    }

    throw new Error('No se pudo generar un código único.');

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
        error: 'Los datos del comercio no son válidos.'
      });
    }

    console.error('Error al registrar comercio:', error);

    return res.status(500).json({
      error: 'No se pudo registrar el comercio.'
    });
  }
}

export async function obtenerComercios(req, res) {
  try {
    const comercios = await Comercio.find({
      activo: { $ne: false }
    }).sort({ createdAt: -1 });

    const resultado = await Promise.all(
      comercios.map(prepararComercio)
    );

    return res.status(200).json(resultado);

  } catch (error) {
    console.error('Error al consultar comercios:', error);

    return res.status(500).json({
      error: 'No se pudieron consultar los comercios.'
    });
  }
}

export async function obtenerMisComercios(req, res) {
  try {
    const comercios = await Comercio.find({
      propietario: req.session.usuarioId
    }).sort({ createdAt: -1 });

    const resultado = await Promise.all(
      comercios.map(prepararComercio)
    );

    return res.status(200).json(resultado);

  } catch (error) {
    console.error('Error al consultar mis comercios:', error);

    return res.status(500).json({
      error: 'No se pudieron consultar tus comercios.'
    });
  }
}

export async function obtenerComercioPorId(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: 'Identificador de comercio no válido.'
      });
    }

    const comercio = await Comercio.findById(id);

    if (!comercio) {
      return res.status(404).json({
        error: 'Comercio no encontrado.'
      });
    }

    if (comercio && comercio.activo === false) {
      return res.status(404).json({
        error: 'Comercio no encontrado.'
      });
    }

    return res.status(200).json(await prepararComercio(comercio));

  } catch (error) {
    console.error('Error al consultar comercio:', error);

    return res.status(500).json({
      error: 'No se pudo consultar el comercio.'
    });
  }
}

export async function actualizarComercio(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: 'Identificador de comercio no válido.'
      });
    }

    const comercio = await Comercio.findById(id);

    if (!comercio) {
      return res.status(404).json({
        error: 'Comercio no encontrado.'
      });
    }

    const esPropietario =
      comercio.propietario.toString() === req.session.usuarioId;

    const esAdministrador =
      req.usuario.tipoUsuario === 'administrador';

    if (!esPropietario && !esAdministrador) {
      return res.status(403).json({
        error: 'No tienes permiso para modificar este comercio.'
      });
    }

    const camposPermitidos = [
      'nombreComercio',
      'direccion',
      'descripcionComercio',
      'categorias',
      'horario'
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

    for (const campo of ['nombreComercio', 'direccion']) {
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

    if (cambios.descripcionComercio !== undefined) {
      if (typeof cambios.descripcionComercio !== 'string') {
        return res.status(400).json({
          error: 'La descripción debe ser texto.'
        });
      }

      cambios.descripcionComercio =
        cambios.descripcionComercio.trim();
    }

    if (cambios.categorias !== undefined) {
      if (
        !Array.isArray(cambios.categorias) ||
        !cambios.categorias.every(
          categoria => typeof categoria === 'string'
        )
      ) {
        return res.status(400).json({
          error: 'Las categorías deben ser un arreglo de textos.'
        });
      }

      cambios.categorias = cambios.categorias.map(
        categoria => categoria.trim()
      );
    }

    if (cambios.horario !== undefined &&
      !Array.isArray(cambios.horario)) {
      return res.status(400).json({
        error: 'El horario debe ser un arreglo.'
      });
    }

    comercio.set(cambios);
    await comercio.save();

    return res.status(200).json({
      mensaje: 'Comercio actualizado correctamente.',
      comercio
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

    console.error('Error al actualizar comercio:', error);

    return res.status(500).json({
      error: 'No se pudo actualizar el comercio.'
    });
  }
}

async function cambiarEstadoComercio(req, res, activar) {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        error: 'Identificador de comercio no válido.'
      });
    }

    const comercio = await Comercio.findById(id);

    if (!comercio) {
      return res.status(404).json({
        error: 'Comercio no encontrado.'
      });
    }

    const esPropietario =
      comercio.propietario.toString() === req.session.usuarioId;

    const esAdministrador =
      req.usuario.tipoUsuario === 'administrador';

    if (!esPropietario && !esAdministrador) {
      return res.status(403).json({
        error: 'No tienes permiso para administrar este comercio.'
      });
    }

    const activoActual = comercio.activo !== false;

    if (activoActual === activar) {
      return res.status(409).json({
        error: activar
          ? 'El comercio ya está activo.'
          : 'El comercio ya está desactivado.'
      });
    }

    const comercioActualizado = await Comercio.findOneAndUpdate(
      {
        _id: id,
        activo: activar ? false : { $ne: false }
      },
      {
        $set: {
          activo: activar,
          fechaBaja: activar ? null : new Date(),
          desactivadoPor: activar ? null : req.session.usuarioId
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!comercioActualizado) {
      return res.status(409).json({
        error: 'El estado del comercio cambió. Actualiza la información.'
      });
    }

    return res.status(200).json({
      mensaje: activar
        ? 'Comercio reactivado correctamente.'
        : 'Comercio desactivado correctamente.',
      comercio: comercioActualizado
    });

  } catch (error) {
    console.error('Error al cambiar estado del comercio:', error);

    return res.status(500).json({
      error: 'No se pudo cambiar el estado del comercio.'
    });
  }
}

export function desactivarComercio(req, res) {
  return cambiarEstadoComercio(req, res, false);
}

export function reactivarComercio(req, res) {
  return cambiarEstadoComercio(req, res, true);
}

async function prepararComercio(comercio) {
  const datos = comercio.toObject();

  datos.imagenComercioUrl = null;

  if (datos.imagenComercio) {
    try {
      const [url] = await bucket
        .file(datos.imagenComercio)
        .getSignedUrl({
          version: 'v4',
          action: 'read',
          expires: Date.now() + 15 * 60 * 1000
        });

      datos.imagenComercioUrl = url;
    } catch (error) {
      console.error('Error al obtener imagen del comercio:', error);
    }
  }

  return datos;
}

export async function obtenerComercioPorCodigo(req, res) {
  try {
    const codigo = String(req.params.codigo || '').trim().toUpperCase();
    const comercio = await Comercio.findOne({ codigoComercio: codigo, activo: { $ne: false } }).select('_id nombreComercio direccion codigoComercio');
    if (!comercio) return res.status(404).json({ error: 'No existe un mercado activo con ese código.' });
    return res.json(comercio);
  } catch (error) {
    console.error('Error al validar código:', error);
    return res.status(500).json({ error: 'No se pudo validar el código.' });
  }
}

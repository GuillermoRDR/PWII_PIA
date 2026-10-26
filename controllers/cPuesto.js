import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import Puesto from '../models/Puesto.js';
import Comercio from '../models/Comercio.js';
import bucket from '../config/firebase.js';

const esIdValido = id => mongoose.isValidObjectId(id);

function validarCampos(datos, parcial = false) {
  const cambios = {};
  const camposTexto = [
    'nombrePuesto',
    'categoria',
    'descripcionPuesto'
  ];
  const dias = [
    'Lunes', 'Martes', 'Miércoles', 'Jueves',
    'Viernes', 'Sábado', 'Domingo'
  ];

  for (const campo of camposTexto) {
    if (datos[campo] === undefined) continue;

    if (typeof datos[campo] !== 'string') {
      throw new Error(`${campo} debe ser texto.`);
    }

    const valor = datos[campo].trim();

    if (campo !== 'descripcionPuesto' && !valor) {
      throw new Error(`${campo} es obligatorio.`);
    }

    cambios[campo] = valor;
  }

  if (!parcial &&
    (!cambios.nombrePuesto || !cambios.categoria)) {
    throw new Error('Nombre y categoría son obligatorios.');
  }

  for (const campo of ['palabrasClave', 'horario']) {
    if (datos[campo] === undefined) continue;

    let valor = datos[campo];

    if (typeof valor === 'string') {
      try {
        valor = JSON.parse(valor);
      } catch {
        throw new Error(`${campo} debe ser un arreglo JSON válido.`);
      }
    }

    if (!Array.isArray(valor)) {
      throw new Error(`${campo} debe ser un arreglo.`);
    }

    if (campo === 'palabrasClave') {
      if (!valor.every(v => typeof v === 'string')) {
        throw new Error('Las palabras clave deben ser textos.');
      }

      cambios.palabrasClave = [
        ...new Set(valor.map(v => v.trim()).filter(Boolean))
      ];
    } else {
      const diasRegistrados = new Set();

      for (const item of valor) {
        if (!item || typeof item !== 'object' ||
          !dias.includes(item.dia) ||
          typeof item.apertura !== 'string' ||
          typeof item.cierre !== 'string' ||
          !/^([01]\d|2[0-3]):[0-5]\d$/.test(item.apertura) ||
          !/^([01]\d|2[0-3]):[0-5]\d$/.test(item.cierre) ||
          item.apertura >= item.cierre ||
          diasRegistrados.has(item.dia)) {
          throw new Error('El horario contiene datos inválidos.');
        }

        diasRegistrados.add(item.dia);
      }

      cambios.horario = valor;
    }
  }

  return cambios;
}

async function prepararPuesto(puesto) {
  const datos = puesto.toObject();
  datos.imagenPuestoUrl = null;

  if (datos.imagenPuesto) {
    try {
      const [url] = await bucket.file(datos.imagenPuesto)
        .getSignedUrl({
          version: 'v4',
          action: 'read',
          expires: Date.now() + 15 * 60 * 1000
        });

      datos.imagenPuestoUrl = url;
    } catch (error) {
      console.error('Error al obtener fotografía:', error);
    }
  }

  return datos;
}

function puedeAdministrar(req, puesto) {
  return String(puesto.propietario) ===
    String(req.session.usuarioId) ||
    req.usuario.tipoUsuario === 'administrador';
}

function responderError(res, error) {
  if (error.name === 'ValidationError' ||
    error.name === 'CastError') {
    return res.status(400).json({
      error: 'Los datos del puesto no son válidos.'
    });
  }

  if (error.message?.includes('obligatorio') ||
    error.message?.includes('debe') ||
    error.message?.includes('inválido')) {
    return res.status(400).json({ error: error.message });
  }

  console.error('Error en módulo de puestos:', error);
  return res.status(500).json({
    error: 'No se pudo completar la operación.'
  });
}

export async function registrarPuesto(req, res) {
  let archivoSubido = null;
  const extensiones = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp'
  };

  try {
    const datos = validarCampos(req.body);

    const codigoComercio = String(req.body.codigoComercio || '').trim().toUpperCase();
    if (!codigoComercio) return res.status(400).json({ error: 'Debes proporcionar el código del mercado.' });
    const comercio = await Comercio.findOne({ codigoComercio, activo: { $ne: false } });
    if (!comercio) return res.status(404).json({ error: 'El código no corresponde a un mercado activo.' });

    if (req.file) {
      const extension = extensiones[req.file.mimetype];

      if (!extension) {
        return res.status(400).json({
          error: 'Formato de imagen no permitido.'
        });
      }

      datos.imagenPuesto = `puestos/${randomUUID()}.${extension}`;
      archivoSubido = bucket.file(datos.imagenPuesto);

      await archivoSubido.save(req.file.buffer, {
        resumable: false,
        metadata: { contentType: req.file.mimetype }
      });
    }

    const puesto = await Puesto.create({
      ...datos,
      propietario: req.session.usuarioId,
      comercio: comercio._id
    });

    return res.status(201).json({
      mensaje: 'Puesto registrado correctamente.',
      puesto
    });

  } catch (error) {
    if (archivoSubido) {
      try {
        await archivoSubido.delete({ ignoreNotFound: true });
      } catch (limpiezaError) {
        console.error('Error limpiando imagen:', limpiezaError);
      }
    }

    return responderError(res, error);
  }
}

export async function obtenerPuestos(req, res) {
  try {
    const filtro = { activo: { $ne: false } };

    if (req.query.comercio !== undefined) {
      if (!esIdValido(req.query.comercio)) {
        return res.status(400).json({
          error: 'Identificador de mercado no válido.'
        });
      }

      const comercio = await Comercio.findOne({
        _id: req.query.comercio,
        activo: { $ne: false }
      });

      if (!comercio) {
        return res.status(404).json({
          error: 'Mercado no encontrado.'
        });
      }

      filtro.comercio = comercio._id;
    }

    const puestos = await Puesto.find(filtro)
      .populate('comercio', 'nombreComercio codigoComercio direccion')
      .sort({ createdAt: -1 });

    return res.json(await Promise.all(
      puestos.map(prepararPuesto)
    ));

  } catch (error) {
    return responderError(res, error);
  }
}

export async function obtenerMisPuestos(req, res) {
  try {
    const puestos = await Puesto.find({
      propietario: req.session.usuarioId
    }).populate('comercio', 'nombreComercio codigoComercio direccion').sort({ createdAt: -1 });

    return res.json(await Promise.all(
      puestos.map(prepararPuesto)
    ));

  } catch (error) {
    return responderError(res, error);
  }
}

export async function obtenerPuestoPorId(req, res) {
  try {
    if (!esIdValido(req.params.id)) {
      return res.status(400).json({
        error: 'Identificador de puesto no válido.'
      });
    }

    const puesto = await Puesto.findOne({
      _id: req.params.id,
      activo: { $ne: false }
    });

    if (!puesto) {
      return res.status(404).json({
        error: 'Puesto no encontrado.'
      });
    }

    await puesto.populate('comercio', 'nombreComercio codigoComercio direccion');
    return res.json(await prepararPuesto(puesto));

  } catch (error) {
    return responderError(res, error);
  }
}

export async function actualizarPuesto(req, res) {
  try {
    if (!esIdValido(req.params.id)) {
      return res.status(400).json({
        error: 'Identificador de puesto no válido.'
      });
    }

    const puesto = await Puesto.findById(req.params.id);

    if (!puesto) {
      return res.status(404).json({
        error: 'Puesto no encontrado.'
      });
    }

    if (!puedeAdministrar(req, puesto)) {
      return res.status(403).json({
        error: 'No tienes permiso para modificar este puesto.'
      });
    }

    const cambios = validarCampos(req.body, true);

    if (!Object.keys(cambios).length) {
      return res.status(400).json({
        error: 'No proporcionaste campos para actualizar.'
      });
    }

    // No se permite modificar propietario ni mercados desde el CRUD.
    puesto.set(cambios);
    await puesto.save();

    return res.json({
      mensaje: 'Puesto actualizado correctamente.',
      puesto: await prepararPuesto(puesto)
    });

  } catch (error) {
    return responderError(res, error);
  }
}

async function cambiarEstado(req, res, activar) {
  try {
    if (!esIdValido(req.params.id)) {
      return res.status(400).json({
        error: 'Identificador de puesto no válido.'
      });
    }

    const puesto = await Puesto.findById(req.params.id);

    if (!puesto) {
      return res.status(404).json({
        error: 'Puesto no encontrado.'
      });
    }

    if (!puedeAdministrar(req, puesto)) {
      return res.status(403).json({
        error: 'No tienes permiso para administrar este puesto.'
      });
    }

    if ((puesto.activo !== false) === activar) {
      return res.status(409).json({
        error: activar
          ? 'El puesto ya está activo.'
          : 'El puesto ya está desactivado.'
      });
    }

    const actualizado = await Puesto.findOneAndUpdate(
      {
        _id: puesto._id,
        activo: activar ? false : { $ne: false }
      },
      {
        $set: {
          activo: activar,
          fechaBaja: activar ? null : new Date(),
          desactivadoPor: activar ? null : req.session.usuarioId
        }
      },
      { new: true, runValidators: true }
    );

    if (!actualizado) {
      return res.status(409).json({
        error: 'El estado del puesto cambió. Actualiza la página.'
      });
    }

    return res.json({
      mensaje: activar
        ? 'Puesto reactivado correctamente.'
        : 'Puesto desactivado correctamente.',
      puesto: actualizado
    });

  } catch (error) {
    return responderError(res, error);
  }
}

export const desactivarPuesto = (req, res) => cambiarEstado(req, res, false);

export const reactivarPuesto = (req, res) => cambiarEstado(req, res, true);
import mongoose from 'mongoose';
import Comentario from '../models/Comentario.js';
import Puesto from '../models/Puesto.js';
import bucket from '../config/firebase.js';

const esIdValido = id => mongoose.isValidObjectId(id);
const POPULATE_USUARIO = 'nombreUsuario fotoPerfil';
const MAX_CONTENIDO = 200;

function validarContenido(contenido) {
  if (typeof contenido !== 'string' || !contenido.trim()) {
    return 'El contenido del comentario es obligatorio.';
  }
  if (contenido.trim().length > MAX_CONTENIDO) {
    return `El comentario no puede superar los ${MAX_CONTENIDO} caracteres.`;
  }
  return null;
}

// Convierte la ruta de Firebase de la foto en una URL firmada
async function prepararComentario(comentario) {
  const datos = comentario.toObject();

  if (datos.usuario) {
    datos.usuario.fotoPerfilUrl = null;

    if (datos.usuario.fotoPerfil) {
      try {
        const [url] = await bucket.file(datos.usuario.fotoPerfil).getSignedUrl({
          version: 'v4',
          action: 'read',
          expires: Date.now() + 15 * 60 * 1000
        });
        datos.usuario.fotoPerfilUrl = url;
      } catch (error) {
        console.error('Error al firmar foto de perfil:', error);
      }
    }
  }

  return datos;
}

function responderError(res, error) {
  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return res.status(400).json({ error: 'Los datos de la crítica no son válidos.' });
  }
  console.error('Error en módulo de comentarios:', error);
  return res.status(500).json({ error: 'No se pudo completar la operación.' });
}

// GET /api/comentarios/puesto/:idPuesto
export async function obtenerComentarios(req, res) {
  try {
    const { idPuesto } = req.params;

    if (!esIdValido(idPuesto)) {
      return res.status(400).json({ error: 'Identificador de puesto no válido.' });
    }

    const puesto = await Puesto.findOne({ _id: idPuesto, activo: { $ne: false } });
    if (!puesto) {
      return res.status(404).json({ error: 'Puesto no encontrado.' });
    }

    const comentarios = await Comentario.find({ puesto: idPuesto, activo: { $ne: false } })
      .populate('usuario', POPULATE_USUARIO)
      .sort({ createdAt: -1 });

    return res.json(await Promise.all(comentarios.map(prepararComentario)));
  } catch (error) {
    return responderError(res, error);
  }
}

// POST /api/comentarios
export async function crearComentario(req, res) {
  try {
    const { contenido, puesto: idPuesto } = req.body ?? {};

    const errorContenido = validarContenido(contenido);
    if (errorContenido) return res.status(400).json({ error: errorContenido });

    if (!esIdValido(idPuesto)) {
      return res.status(400).json({ error: 'Identificador de puesto no válido.' });
    }

    const puesto = await Puesto.findOne({ _id: idPuesto, activo: { $ne: false } });
    if (!puesto) {
      return res.status(404).json({ error: 'El puesto no existe o está inactivo.' });
    }

    const comentario = await Comentario.create({
      contenido: contenido.trim(),
      usuario: req.usuario._id,
      puesto: puesto._id
    });

    await comentario.populate('usuario', POPULATE_USUARIO);

    return res.status(201).json({
      mensaje: 'Crítica publicada correctamente.',
      comentario: await prepararComentario(comentario)
    });
  } catch (error) {
    return responderError(res, error);
  }
}

// PATCH /api/comentarios/:id  (solo el autor)
export async function actualizarComentario(req, res) {
  try {
    if (!esIdValido(req.params.id)) {
      return res.status(400).json({ error: 'Identificador de crítica no válido.' });
    }

    const { contenido } = req.body ?? {};

    const errorContenido = validarContenido(contenido);

    if (errorContenido) return res.status(400).json({ error: errorContenido });


    const comentario = await Comentario.findOneAndUpdate(
      { _id: req.params.id, usuario: req.usuario._id, activo: { $ne: false } },
      { contenido: contenido.trim(), editado: true },
      { new: true, runValidators: true }
    ).populate('usuario', POPULATE_USUARIO);

    if (!comentario) {
      return res.status(404).json({
        error: 'Crítica no encontrada o no tienes permiso para modificarla.'
      });
    }

    return res.json({
      mensaje: 'Crítica actualizada correctamente.',
      comentario: await prepararComentario(comentario)
    });
  } catch (error) {
    return responderError(res, error);
  }
}

// DELETE /api/comentarios/:id  (autor o administrador, borrado lógico)
export async function eliminarComentario(req, res) {
  try {
    if (!esIdValido(req.params.id)) {
      return res.status(400).json({ error: 'Identificador de crítica no válido.' });
    }

  const comentario = await Comentario.findOneAndUpdate(
  { _id: req.params.id, usuario: req.usuario._id, activo: { $ne: false } },
  { activo: false }
  );

    if (!comentario) {
      return res.status(404).json({
        error: 'Crítica no encontrada o no tienes permiso para eliminarla.'
      });
    }

    return res.json({ mensaje: 'Crítica eliminada correctamente.' });
  } catch (error) {
    return responderError(res, error);
  }
}
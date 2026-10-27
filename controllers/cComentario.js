import bcrypt from 'bcrypt';
import Usuario from '../models/Comentario.js';
import bucket from '../config/firebase.js';
import { randomUUID } from 'node:crypto';

export async function registrarComentario(req, res) {
  try {
    const {
      contenido,
      cantidadEstrellas
    } = req.body;

    if (
      !contenido?.trim()
    ) {
      return res.status(400).json({
        error: 'Completa los campos obligatorios.'
      });
    }

    const comentario = await Comentario.create({
      contenido: contenido.trim(),
      cantidadEstrellas: cantidadEstrellas || 0
    });

    return res.status(201).json({
      mensaje: 'Comentario registrado correctamente.',
      comentario: {
        id: comentario._id,
        contenido: comentario.contenido,
        cantidadEstrellas: comentario.cantidadEstrellas
      }
    });

  } catch (error) {
    console.error('Error al registrar comentario:', error);

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

export async function obtenerComentario(req, res) {
  try {
    const comentario = await Comentario.findById(req.params.id);

    if (!comentario) {
      return res.status(404).json({
        error: 'Comentario no encontrado.'
      });
    }

    return res.status(200).json(comentario);
  } catch (error) {
    console.error('Error al obtener comentario:', error);
    return res.status(500).json({
      error: 'Error interno del servidor.'
    });
  }
}


//import Oferta from '../models/Oferta.js';
//import Puesto from '../models/Puesto.js';
import bucket from '../config/firebase.js';
import { randomUUID } from 'node:crypto';

export async function registrarOferta(req, res) {
  try {
    const {
      titulo,
      descripcion,
      puesto,
      activa,
      codigoOferta
    } = req.body;

    if (
      !titulo?.trim() || !descripcion?.trim() || !puesto
    ) {
      return res.status(400).json({
        error: 'Completa los campos obligatorios.'
      });
    }

    const puestoExiste = await Puesto.findById(puesto);

    if (
      !puestoExiste
    ) {
      return res.status(404).json({
        error: 'Puesto no encontrado.'
      });
    }

    let fotoOferta = '';

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

      const nombreArchivo = `ofertas/${randomUUID()}.${extension}`;

      const archivo = bucket.file(nombreArchivo);

      await archivo.save(req.file.buffer, {
        metadata: {
          contentType: req.file.mimetype
        }
      });

      fotoOferta = nombreArchivo;
    }

    const oferta = await Oferta.create({
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || '',
      puesto,
      activa: activa || false,
      codigoOferta: codigoOferta?.trim() || '',
      fotoOferta
    });

    return res.status(201).json({
      mensaje: 'Oferta registrada correctamente.',
      oferta: {
        id: oferta._id,
        titulo: oferta.titulo
      }
    });

  } catch (error) {
    console.error('Error al registrar oferta:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Los datos proporcionados no son válidos.'
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'El id no es válido.'
      });
    }

    return res.status(500).json({
      error: 'Error interno del servidor.'
    });
  }
}

export async function obtenerOferta(req, res) {
  try {
    const oferta = await Oferta.findById(req.params.id);

    if (!oferta) {
      return res.status(404).json({
        error: 'Oferta no encontrada.'
      });
    }

    return res.status(200).json(oferta);
  } catch (error) {
    console.error('Error al obtener oferta:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'El id no es válido.'
       });
      }

    return res.status(500).json({
      error: 'Error interno del servidor.'
    });
  }
}


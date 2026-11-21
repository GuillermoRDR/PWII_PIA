import Suscripcion from '../models/Suscripcion.js';
import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import bucket from '../config/firebase.js';
import SuscripcionUsuario from '../models/SuscripcionUsuario.js';

const tipoImagen = {
  'image/jpeg' : 'jpg',
  'image/png' : 'png',
  'image/webp' : 'webp'
};

export async function obtenerSuscripciones(req, res) {
  try {
    const suscripciones = await Suscripcion.find({
      activa: { $ne: false }});

    return res.json(await Promise.all(suscripciones.map(UrlImagen)));

  } catch (error) {
    console.error('Error al consultar suscripciones:', error);

    return res.status(500).json({
      error: 'No se pudieron consultar las suscripciones.'
    });
  }
}


export async function registrarSuscripcion(req, res) {
  let rutaImagen = '';
  try {
    const { titulo, descripcion } = req.body;
    const precio = Number(req.body.precio);
    const duracion = Number(req.body.duracion);

    if (!titulo?.trim() || !descripcion?.trim()) {
      return res.status(400).json({ error: 'El título y la descripción son obligatorios'});
    }

    if(!String(req.body.precio ?? '').trim() || !Number.isFinite(precio) || precio < 0) {
      return res.status(400).json({ error: 'El precio ingresado no es válido, por favor ingrese un precio correcto.'});
    }

    if (!Number.isInteger(duracion) || duracion < 1) {
      return res.status(400).json({ error: 'La duración ingresada no es válida, por favor ingrese una duración correcta.'});
    }

    if (req.file) {
      if (!tipoImagen[req.file.mimetype]) {
        return res.status(400).json({ error: 'El tipo de archivo de la imagen no es válido, por favor suba una imagen válida.'});
      }
      rutaImagen = await subirImagen(req.file);
    }

    const suscripcion = await Suscripcion.create({
      titulo,
      descripcion,
      precio,
      duracion,
      imagenSuscripcion: rutaImagen,
      creador: req.session.usuarioId
    });

    return res.status(201).json({
      mensaje: 'La suscripción fue registrada exitosamente',
      suscripcion: await UrlImagen(suscripcion)
    });
  } catch (error) {
    if (rutaImagen) {
      await bucket.file(rutaImagen).delete({ ignoreNotFound: true }).catch(() => {});
    }
    console.error('Ha habido un error al querer registrar la suscripcion:', error);
    return res.status(500).json({ error: 'No se ha podido registrar la suscripcion, favor de intentarlo otra vez.'});
  }
}

export async function obtenerSuscripcionPorId(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'El ID es inválido, por favor ingrese un ID válido.'});
    }

    const suscripcion = await Suscripcion.findOne({
      _id: req.params.id,
      activa: { $ne: false }
    });

    if (!suscripcion) {
      return res.status(404).json({ error: 'La suscripción no ha sido encontrada.'});
    }

    return res.json(await UrlImagen(suscripcion));
  } catch (error) {
    console.error('Ha habido error al querer consultar la suscripción:', error);
    return res.status(500).json({ error: 'No se ha podido consultar la suscripción, favor de volverlo a intentar.'});
  }
}

export async function desactivarSuscripcion(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'El ID es inválido, por favor ingrese un ID válido.'});
    }

    const suscripcion = await Suscripcion.findById(req.params.id);

    if (!suscripcion) {
      return res.status(404).json({ error: 'La suscripción no ha sido encontrada.'});
    }

    suscripcion.activa = false;
    await suscripcion.save();

    return res.json({ mensaje: 'La suscripción ha sido desactivada exitosamente.' });
  } catch (error) {
    console.error('Ha habido error al querer desactivar la suscripción:', error);
    return res.status(500).json({ error: 'No se ha podido desactivar la suscripción, favor de volverlo a intentar.'});
  }
}

export async function actualizarSuscripcion (req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status (400).json({ error: 'El ID es inválido, por favor ingrese un ID válido.'});
    }

    const suscripcion = await Suscripcion.findById(req.params.id);

    if (!suscripcion) {
      return res.status(404).json({ error: 'La suscripción no ha sido encontrada.'});
    }

    const cambios = {};

    if (req.body.titulo !== undefined) {
      if (!req.body.titulo.trim()) {
        return res.status(400).json({ error: 'El título no puede estar vacío.'});
      }
      cambios.titulo = req.body.titulo.trim();
    }

    if (req.body.descripcion !== undefined) {
      if (!req.body.descripcion.trim()) {
        return res.status(400).json({ error: 'La descripción no puede estar vacía.'});
      }
      cambios.descripcion = req.body.descripcion.trim();
    }

    if (req.body.precio !== undefined) {
      const precio = Number(req.body.precio);
      if (!String(req.body.precio).trim() || !Number.isFinite(precio) || precio < 0) {
        return res.status(400).json({ error: 'El precio ingresado no es válido, por favor ingrese un precio correcto.'});
      }
      cambios.precio = precio;
    }

    if (req.body.duracion !== undefined) {
      const duracion = Number(req.body.duracion);
      if (!Number.isInteger(duracion) || duracion < 1) {
        return res.status(400).json({ error: 'La duración ingresada no es válida, por favor ingrese una duración correcta.'});
      }
      cambios.duracion = duracion;
    }

    if (!Object.keys(cambios).length) {
      return res.status(400).json({ error: 'No hay ningún cambio para actualizar.'});
    }

    suscripcion.set(cambios);
    await suscripcion.save();

    return res.json({ mensaje: 'La suscripción ha sido actualizada exitosamente.', suscripcion });
  } catch (error) {
    console.error('Ha habido error al querer actualizar la suscripción:', error);
    return res.status(500).json({ error: 'No se ha podido actualizar la suscripción, favor de volverlo a intentar.'});
  }
}

async function subirImagen(archivo) {
  const ruta = `suscripciones/${randomUUID()}.${tipoImagen[archivo.mimetype]}`;

  await bucket.file(ruta).save(archivo.buffer, {
    resumable: false,
    metadata: { contentType: archivo.mimetype}
  });

  return ruta;
}

async function UrlImagen(suscripcion) {
  const datos = suscripcion.toObject();
  datos.imagenSuscripcionUrl = null;

  if (datos.imagenSuscripcion) {
    const [url] = await bucket.file(datos.imagenSuscripcion).getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000
    });

    datos.imagenSuscripcionUrl = url;
  }

  return datos;
}

export async function comprarSuscripcion(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'El ID es inválido, por favor ingrese un ID válido.'});
    }

    const plan = await Suscripcion.findOne({
      _id: req.params.id,
      activa: { $ne:false}
    });
  
  if (!plan) {
    return res.status(404).json({ error: 'La suscripción no ha sido encontrada.'});
  }

  const ahora = new Date();

    const vigente = await SuscripcionUsuario.exists({
    usuario: req.session.usuarioId,
    fechaFin: { $gt: ahora }
  });

  if (vigente) {
    return res.status(409).json({ error: 'Ya cuentas con una suscripción activa, podrás comprar otra cuando termine.'});
  }

  const fechaFin = new Date(ahora.getTime() + plan.duracion * 24 * 60 * 60 * 1000);

  const compra = await SuscripcionUsuario.create({
    usuario: req.session.usuarioId,
    suscripcion: plan._id,
    fechaInicio: ahora,
    fechaFin,
    precioPagado: plan.precio
  });

  return res.status(201).json({
    mensaje: 'La suscripción ha sido comprada exitosamente.',
    fechaFin: compra.fechaFin
  });
  } catch (error) {
    console.error('Ha habido error al querer comprar la suscripción:', error);
    return res.status(500).json({ error: 'No se ha podido comprar la suscripción, favor de volverlo a intentar.'});
}
}
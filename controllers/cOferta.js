import Oferta from '../models/Oferta.js';
import Puesto from '../models/Puesto.js';
import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import bucket from '../config/firebase.js';
import Usuario from '../models/Usuario.js';
import SuscripcionUsuario from '../models/SuscripcionUsuario.js';

const tipoImagen = {
  'image/jpeg' : 'jpg',
  'image/png' : 'png',
  'image/webp' : 'webp'
};

export async function obtenerOfertas(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.query.puesto)) {
      return res.status(400).json({ error: 'Por favor indica el puesto al que quieres acceder a sus ofertas.'});
    }

    const puesto = await Puesto.findOne({
      _id: req.query.puesto,
      activo: { $ne: false }
    });

    if (!puesto) {
      return res.status(404).json({ error: 'No se ha podido encontrar el puesto, por favor vuelva a intentarlo.'});
    }

    const contexto = await obtenerContexto(req, puesto);
    const filtro = { idPuesto: puesto._id };

    if (!contexto.puedeAdministrar) {
      filtro.activa = { $ne: false };
      filtro.$or = [
        { fechaFin: null },
        { fechaFin: { $gte: new Date() } }
      ];
    }

    const ofertas = await Oferta.find(filtro).sort({ createdAt: -1 });

    return res.json({
      puedeAdministrar: contexto.puedeAdministrar,
      tienePlus: contexto.tienePlus,
      ofertas: await Promise.all(ofertas.map(oferta => UrlImagen(oferta, contexto)))
    });
  } catch (error) {
    console.error('Ha habido un error al consultar las ofertas:', error);
    return res.status(500).json({ error: 'No se ha podido encontrar las ofertas, favor de volverlo a intentar despues.'});
  }
}

function validarCampos(body, parcial) {
  const cambios = {};

  if (body.titulo !== undefined) {
    if (typeof body.titulo !== 'string' || !body.titulo.trim()) {
      return { error: 'El título de la oferta no puede estar vacía, por favor ingrese un título.'};
    }
    cambios.titulo = body.titulo.trim();
  }

  if (body.descripcion !== undefined) {
    if (typeof body.descripcion !== 'string' || !body.descripcion.trim()) {
      return { error: 'La descripción de la oferta no puede estar vacía, por favor ingrese una descripción.'};
    }
    cambios.descripcion = body.descripcion.trim();
  }

  if (body.descuento !== undefined) {
    const texto = String(body.descuento).trim();
    const descuento = texto === '' ? 0 : Number(texto);

    if (!Number.isFinite(descuento) || descuento < 0 || descuento > 100) {
      return { error: 'Un descuento solo puede tener un valor entre 0 y 100, por favor ingrese un descuento valido.'};
    }
    cambios.descuento = descuento;
  }

  if (body.fechaFin !== undefined) {
    const texto = String(body.fechaFin ?? '').trim();

    if (!texto) {
      cambios.fechaFin = null;
    } else {
      const fecha = /^\d{4}-\d{2}-\d{2}$/.test(texto)
        ? new Date(`${texto}T23:59:59`)
        : new Date(texto);

      if (Number.isNaN(fecha.getTime()) || fecha <= new Date()) {
        return { error: 'La fecha de vencimiento de la oferta no es válida o es una fecha pasada a la actual, por favor ingrese una fecha posterior a la fecha de hoy.'};
      }
      cambios.fechaFin = fecha;
    }
  }

  if (body.codigoOferta !== undefined) {
    cambios.codigoOferta = String(body.codigoOferta).trim();
  }

  if (body.exclusivoPlus !== undefined) {
    cambios.exclusivoPlus = body.exclusivoPlus === 'true' || body.exclusivoPlus === true;
  }

  if (!parcial && (!cambios.titulo || !cambios.descripcion)) {
    return { error: 'El título y la descripción de la oferta son obligatorios, por favor ingreselos para continuar.'};
  }

  return { cambios };
}

function puedeAdministrar(req, puesto) {
  return String(puesto.propietario) === String(req.session.usuarioId) || req.usuario.tipoUsuario === 'administrador';
}

export async function registrarOferta(req, res) {
  let rutaImagen = '';
  try {
    const { error, cambios } = validarCampos(req.body, false);

    if (error) {
      return res.status(400).json({ error });
    }

    if (!mongoose.isValidObjectId(req.body.puesto)) {
      return res.status(400).json({ error: 'El puesto seleccionado no es válido, por favor seleccione un puesto válido.'});
    }

    const puesto = await Puesto.findOne({
      _id: req.body.puesto,
      activo: { $ne: false }
    });

    if (!puesto) {
      return res.status(404).json({ error: 'No se ha podido encontrar el puesto, por favor vuelva a intentarlo o ingrese otro puesto.'});
    }

    if (!puedeAdministrar(req, puesto)) {
      return res.status(403).json({ error: 'No tienes permiso para crear ofertas en este puesto, por favor ingresa un puesto válido.'});
    }

    if (req.file) {
      if (!tipoImagen[req.file.mimetype]) {
        return res.status(400).json({ error: 'El tipo de archivo de la imagen no es válido, por favor suba una imagen válida.'});
      }
      rutaImagen = await subirImagen(req.file);
    }

    const oferta = await Oferta.create({
      ...cambios,
      imagenOferta: rutaImagen,
      idPuesto: puesto._id
    });

    return res.status(201).json({
      mensaje: 'La oferta ha sido registrada exitosamente.',
      oferta: await UrlImagen(oferta, { tienePlus: true })
    });
  } catch (error) {
    if (rutaImagen) {
      await bucket.file(rutaImagen).delete({ ignoreNotFound: true }).catch(() => {});
    }
    console.error('Ha habido un error al querer registrar la oferta:', error);
    return res.status(500).json({ error: 'No se ha podido registrar la oferta, favor de intentarlo otra vez'});
  }
}

export async function obtenerOfertaPorId(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'El ID es inválido, por favor ingrese un ID válido.'});
    }

    const oferta = await Oferta.findById(req.params.id);

    if (!oferta) {
      return res.status(404).json({ error: 'La oferta no ha sido encontrada, favor de volver a intentarlo.'});
    }

    const puesto = await Puesto.findOne({
      _id: oferta.idPuesto,
      activo: { $ne: false }
    });

    if (!puesto) {
      return res.status(404).json({ error: 'La oferta no ha sido encontrada, favor de volver a intentarlo.'});
    }

    const contexto = await obtenerContexto(req, puesto);
    const vencida = oferta.fechaFin && oferta.fechaFin < new Date();

    if ((oferta.activa === false || vencida) && !contexto.puedeAdministrar) {
      return res.status(404).json({ error: 'La oferta no ha sido encontrada, favor de volver a intentarlo.'});
    }

    return res.json(await UrlImagen(oferta, contexto));
  } catch (error) {
    console.error('Ha habido error al querer consultar la oferta:', error);
    return res.status(500).json({ error: 'No se ha podido consultar la oferta, favor de volverlo a intentarlo.'});
  }
}

async function cambiarEstado(req, res, activar) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'El ID es inválido, por favor ingrese un ID válido.'});
    }

    const oferta = await Oferta.findById(req.params.id);

    if (!oferta) {
      return res.status(404).json({ error: 'La oferta no ha sido encontrada, favor de volverlo a intentarlo.'});
    }

    const puesto = await Puesto.findById(oferta.idPuesto);

    if (!puesto || !puedeAdministrar(req, puesto)) {
      return res.status(403).json({ error: 'No tienes permiso para administrar esta oferta, por favor ingrese una oferta valida.'});
    }

    if ((oferta.activa !== false) === activar) {
      return res.status(409).json({
        error: activar ? 'La oferta ya se encuentra activa actualmente.' : 'La oferta ya se encuentra desactiva actualmente.'
      });
    }

    oferta.activa = activar;
    await oferta.save();

    return res.json({
      mensaje: activar
        ? 'La oferta ha sido reactivada exitosamente.'
        : 'La oferta ha sido desactivada exitosamente.'
    });
  } catch (error) {
    console.error('Ha habido error al querer cambiar el estado de la oferta:', error);
    return res.status(500).json({ error: 'No se ha podido cambiar el estado de la oferta, favor de volverlo a intentar.'});
  }
}

export const desactivarOferta = (req, res) => cambiarEstado(req, res, false);

export const reactivarOferta = (req, res) => cambiarEstado(req, res, true);

export async function actualizarOferta(req, res) {
  let rutaNueva = '';
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'El ID es inválido, por favor ingrese un ID válido.'});
    }

    const oferta = await Oferta.findById(req.params.id);

    if (!oferta) {
      return res.status(404).json({ error: 'La oferta no ha sido encontrada, favor de volverlo a intentarlo.'});
    }

    const puesto = await Puesto.findById(oferta.idPuesto);

    if (!puesto || !puedeAdministrar(req, puesto)) {
      return res.status(403).json({ error: 'No tienes permiso para modificar esta oferta, por favor ingrese una oferta válida.'});
    }

    const { error, cambios } = validarCampos(req.body, true);

    if (error) {
      return res.status(400).json({ error });
    }

    if (!Object.keys(cambios).length && !req.file) {
      return res.status(400).json({ error: 'No se detecto ningún cambio para actualizar la oferta.'});
    }

    if (req.file) {
      if (!tipoImagen[req.file.mimetype]) {
        return res.status(400).json({ error: 'El tipo de archivo de la imagen no es válido, por favor suba una imagen válida.'});
      }
      rutaNueva = await subirImagen(req.file);
      cambios.imagenOferta = rutaNueva;
    }

    const rutaAnterior = oferta.imagenOferta;

    oferta.set(cambios);
    await oferta.save();

    if (rutaNueva && rutaAnterior) {
      await bucket.file(rutaAnterior).delete({ ignoreNotFound: true }).catch(() => {});
    }

    return res.json({
      mensaje: 'La oferta ha sido actualizada exitosamente.',
      oferta: await UrlImagen(oferta, { tienePlus: true })
    });
  } catch (error) {
    if (rutaNueva) {
      await bucket.file(rutaNueva).delete({ ignoreNotFound: true }).catch(() => {});
    }
    console.error('Ha habido error al querer actualizar la oferta:', error);
    return res.status(500).json({ error: 'No se ha podido actualizar la oferta, favor de volverlo a intentar.'});
  }
}

async function subirImagen(archivo) {
  const ruta = `ofertas/${randomUUID()}.${tipoImagen[archivo.mimetype]}`;

  await bucket.file(ruta).save(archivo.buffer, {
    resumable: false,
    metadata: { contentType: archivo.mimetype }
  });

  return ruta;
}

async function UrlImagen(oferta, contexto) {
  const datos = oferta.toObject();
  datos.imagenOfertaUrl = null;

  if (datos.imagenOferta) {
    const [url] = await bucket.file(datos.imagenOferta).getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000
    });

    datos.imagenOfertaUrl = url;
  }

  datos.bloqueada = Boolean(datos.exclusivoPlus) && !contexto.tienePlus;

  if (datos.bloqueada) {
    delete datos.codigoOferta;
  }

  return datos;
}

async function obtenerContexto(req, puesto) {
  const usuarioId = req.session?.usuarioId;

  if (!usuarioId) {
    return { puedeAdministrar: false, tienePlus: false };
  }

  const usuario = await Usuario.findById(usuarioId).select('tipoUsuario');

  if (!usuario) {
    return { puedeAdministrar: false, tienePlus: false };
  }

  const administra = String(puesto.propietario) === String(usuarioId) || usuario.tipoUsuario === 'administrador';

  const suscrito = await SuscripcionUsuario.exists({
    usuario: usuarioId,
    fechaFin: { $gt: new Date() }
  });

  return {
    puedeAdministrar: administra,
    tienePlus: administra || Boolean(suscrito)
  };
}
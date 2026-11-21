const idPuesto = new URLSearchParams(location.search).get('id');

let puestoActual = null;
let usuarioActual = null;

const elemento = id => document.getElementById(id);

async function consultar(url, opciones = {}) {
  const respuesta = await fetch(url, {
    credentials: 'same-origin',
    ...opciones
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(datos.error || 'Error al consultar el servidor.');
  }

  return datos;
}

function mostrarDatosPuesto(puesto) {
  elemento('titulo-puesto').textContent = puesto.nombrePuesto;
  elemento('tdp').textContent = puesto.nombrePuesto;

  document.title = `${puesto.nombrePuesto} | MercaRed`;

  elemento('valor-categoria').textContent =
    puesto.categoria || 'Sin categoría';

  elemento('descripcion-puesto').textContent =
    puesto.descripcionPuesto || 'Sin descripción.';

  elemento('palabras-clave-puesto').textContent =
    (puesto.palabrasClave || []).length
      ? `Palabras clave: ${puesto.palabrasClave.join(', ')}`
      : 'Sin palabras clave.';

  elemento('dias-puesto').textContent =
    (puesto.horario || []).length
      ? puesto.horario
        .map(h => `${h.dia}: ${h.apertura} - ${h.cierre}`)
        .join(' · ')
      : 'Horario no disponible.';

  elemento('mercado-puesto').textContent =
    puesto.comercio
      ? `Mercado: ${puesto.comercio.nombreComercio}`
      : 'Mercado no disponible.';

  const foto = elemento('foto-puesto');

  foto.src = puesto.imagenPuestoUrl || '/media/images/default.png';
  foto.alt = `Fotografía de ${puesto.nombrePuesto}`;

}

function verificarPermisos() {
  const puedeEditar =
    usuarioActual &&
    (
      String(puestoActual.propietario) === String(usuarioActual._id) ||
      usuarioActual.tipoUsuario === 'administrador'
    );

  document.querySelector('.acciones-puesto').hidden = !puedeEditar;
}

async function cargarPuesto() {
  if (!idPuesto) {
    elemento('estado-puesto').textContent =
      'No se indicó el identificador del puesto.';
    return;
  }

  try {
    puestoActual = await consultar(
      `/api/puestos/${encodeURIComponent(idPuesto)}`
    );

    mostrarDatosPuesto(puestoActual);

    try {
      usuarioActual = await consultar('/api/usuario/perfil');
    } catch {
      usuarioActual = null;
    }

    verificarPermisos();

    await cargarOfertas();

  } catch (error) {
    console.error('Error al cargar puesto:', error);
    elemento('estado-puesto').textContent = error.message;
    elemento('titulo-puesto').textContent = 'Puesto no disponible';
  }
}

function volverAlMercado() {
  const idMercado = puestoActual?.comercio?._id;

  window.location.href = idMercado
    ? `/coma.html?id=${encodeURIComponent(idMercado)}`
    : '/principal.html';
}

document.addEventListener('DOMContentLoaded', cargarPuesto);


let ofertaActual = null;
let urlImagenOferta = null;

function abrirModalOferta(id) {
  elemento(id).classList.add('mostrar');
}

function cerrarModalOferta(id) {
  elemento(id).classList.remove('mostrar');
}

function crearElementoOferta(etiqueta, clase, texto) {
  const nodo = document.createElement(etiqueta);

  if (clase) nodo.className = clase;
  if (texto !== undefined) nodo.textContent = texto;

  return nodo;
}

function crearBotonOferta(texto, icono, clase, accion) {
  const boton = crearElementoOferta('button', clase);
  boton.type = 'button';
  boton.append(
    crearElementoOferta('i', icono),
    document.createTextNode(` ${texto}`)
  );
  boton.addEventListener('click', accion);

  return boton;
}

function crearBloqueCodigo(codigo) {
  const caja = crearElementoOferta('div', 'oferta-codigo');

  const revelar = crearElementoOferta('button', 'boton-revelar');
  revelar.type = 'button';
  revelar.setAttribute('aria-expanded', 'false');

  const texto = crearElementoOferta('span', '', 'Revelar código');

  revelar.append(
    crearElementoOferta('i', 'fa-solid fa-eye icono-ver'),
    crearElementoOferta('i', 'fa-solid fa-eye-slash icono-ocultar'),
    texto
  );

  const valor = crearElementoOferta('span', 'codigo-valor', codigo);

  revelar.addEventListener('click', () => {
    const visible = valor.classList.toggle('visible');

    revelar.setAttribute('aria-expanded', String(visible));
    texto.textContent = visible ? 'Ocultar código' : 'Revelar código';
  });

  caja.append(revelar, valor);

  return caja;
}

function crearTarjetaOferta(oferta, puedeAdministrar) {
  const tarjeta = crearElementoOferta('article', 'oferta');

  const imagen = crearElementoOferta('img', 'oferta-img');
  imagen.src = oferta.imagenOfertaUrl || '/media/images/default.png';
  imagen.alt = oferta.titulo;
  imagen.loading = 'lazy';

  const cuerpo = crearElementoOferta('div', 'oferta-cuerpo');

  const titulo = oferta.descuento > 0
    ? `${oferta.titulo} · ${oferta.descuento}% de descuento`
    : oferta.titulo;

  cuerpo.append(
    crearElementoOferta('h3', 'oferta-nombre', titulo),
    crearElementoOferta('p', 'oferta-desc', oferta.descripcion)
  );

  if (oferta.exclusivoPlus) {
    const etiqueta = crearElementoOferta('span', 'etiqueta-suscripcion');
    etiqueta.append(
      crearElementoOferta('i', 'fa-solid fa-crown'),
      document.createTextNode(' Solo suscriptores')
    );
    cuerpo.append(etiqueta);
  }

  if (oferta.fechaFin) {
    cuerpo.append(crearElementoOferta(
      'p',
      'oferta-desc',
      `Válida hasta el ${new Date(oferta.fechaFin).toLocaleDateString('es-MX')}.`
    ));
  }

  if (oferta.activa === false) {
    cuerpo.append(crearElementoOferta(
      'p',
      'oferta-desc',
      'Oferta desactivada: los clientes no la ven.'
    ));
  }

  if (oferta.bloqueada) {
    const enlace = crearElementoOferta('a', 'boton-revelar');
    enlace.href = '/suscripcion.html';
    enlace.style.textDecoration = 'none';
    enlace.append(
      crearElementoOferta('i', 'fa-solid fa-lock'),
      document.createTextNode(' Suscríbete para desbloquear')
    );
    cuerpo.append(enlace);

  } else if (oferta.codigoOferta) {
    cuerpo.append(crearBloqueCodigo(oferta.codigoOferta));
  }

  if (puedeAdministrar) {
    const acciones = crearElementoOferta('div', 'oferta-acciones');

    acciones.append(
      crearBotonOferta('Editar', 'fa-solid fa-pen', 'oferta-btn', () => editarOferta(oferta))
    );

    if (oferta.activa === false) {
      acciones.append(
        crearBotonOferta('Reactivar', 'fa-solid fa-rotate-left', 'oferta-btn', () => reactivarOferta(oferta))
      );
    } else {
      acciones.append(
        crearBotonOferta('Desactivar', 'fa-solid fa-ban', 'oferta-btn oferta-btn-eliminar', () => {
          ofertaActual = oferta;
          abrirModalOferta('blur-oferta-eliminar');
        })
      );
    }

    cuerpo.append(acciones);
  }

  tarjeta.append(imagen, cuerpo);

  return tarjeta;
}

async function cargarOfertas() {
  const lista = elemento('lista-ofertas');
  const vacio = elemento('sin-ofertas');

  lista.querySelectorAll('.oferta').forEach(oferta => oferta.remove());

  try {
    const datos = await consultar(
      `/api/ofertas?puesto=${encodeURIComponent(idPuesto)}`
    );

    vacio.textContent = 'Este puesto todavía no tiene ofertas publicadas.';
    vacio.hidden = datos.ofertas.length > 0;

    for (const oferta of datos.ofertas) {
      lista.appendChild(crearTarjetaOferta(oferta, datos.puedeAdministrar));
    }

    const nueva = elemento('nueva-oferta');

    nueva.style.display = datos.puedeAdministrar ? '' : 'none';
    nueva.href = `/regof.html?puesto=${encodeURIComponent(idPuesto)}`;

  } catch (error) {
    vacio.textContent = error.message;
    vacio.hidden = false;
  }
}

function editarOferta(oferta) {
  ofertaActual = oferta;

  elemento('input-oferta-nombre').value = oferta.titulo;
  elemento('input-oferta-descripcion').value = oferta.descripcion || '';
  elemento('input-oferta-codigo').value = oferta.codigoOferta || '';
  elemento('input-oferta-descuento').value = oferta.descuento || '';
  elemento('input-oferta-fecha').value = oferta.fechaFin ? oferta.fechaFin.slice(0, 10) : '';
  elemento('input-oferta-exclusiva').checked = Boolean(oferta.exclusivoPlus);
  elemento('input-imagen-oferta').value = '';

  const vista = elemento('vista-imagen-oferta');

  if (oferta.imagenOfertaUrl) {
    vista.style.backgroundImage = `url("${oferta.imagenOfertaUrl}")`;
    vista.classList.add('tiene-imagen');
    elemento('texto-imagen-oferta').textContent = 'Cambiar imagen';
  } else {
    vista.style.backgroundImage = 'none';
    vista.classList.remove('tiene-imagen');
    elemento('texto-imagen-oferta').textContent = 'Subir imagen';
  }

  elemento('mensaje-oferta').textContent = '';

  abrirModalOferta('blur-oferta');
}

async function reactivarOferta(oferta) {
  if (!window.confirm(`¿Deseas reactivar "${oferta.titulo}"?`)) return;

  try {
    await consultar(`/api/ofertas/${oferta._id}/reactivar`, { method: 'PATCH' });
    await cargarOfertas();
  } catch (error) {
    elemento('estado-puesto').textContent = error.message;
  }
}

elemento('input-imagen-oferta').addEventListener('change', () => {
  const archivo = elemento('input-imagen-oferta').files[0];

  if (!archivo) return;

  const permitidos = ['image/jpeg', 'image/png', 'image/webp'];

  if (!permitidos.includes(archivo.type) || archivo.size > 5 * 1024 * 1024) {
    elemento('mensaje-oferta').textContent =
      'La imagen debe ser JPG, PNG o WebP y pesar máximo 5 MB.';
    elemento('input-imagen-oferta').value = '';
    return;
  }

  if (urlImagenOferta) URL.revokeObjectURL(urlImagenOferta);
  urlImagenOferta = URL.createObjectURL(archivo);

  const vista = elemento('vista-imagen-oferta');
  vista.style.backgroundImage = `url("${urlImagenOferta}")`;
  vista.classList.add('tiene-imagen');
  elemento('texto-imagen-oferta').textContent = 'Cambiar imagen';
  elemento('mensaje-oferta').textContent = '';
});

elemento('cerrar-oferta').addEventListener('click', () => cerrarModalOferta('blur-oferta'));

elemento('formEditarOferta').addEventListener('submit', async event => {
  event.preventDefault();

  const descuento = elemento('input-oferta-descuento').value.trim();

  if (descuento !== '' && (!(Number(descuento) >= 0) || Number(descuento) > 100)) {
    elemento('mensaje-oferta').textContent = 'El descuento debe estar entre 0 y 100.';
    return;
  }

  const datos = new FormData();

  datos.append('titulo', elemento('input-oferta-nombre').value.trim());
  datos.append('descripcion', elemento('input-oferta-descripcion').value.trim());
  datos.append('codigoOferta', elemento('input-oferta-codigo').value.trim());
  datos.append('descuento', descuento);
  datos.append('fechaFin', elemento('input-oferta-fecha').value);
  datos.append('exclusivoPlus', String(elemento('input-oferta-exclusiva').checked));

  const imagen = elemento('input-imagen-oferta').files[0];

  if (imagen) {
    datos.append('fotoOferta', imagen);
  }

  const boton = elemento('guardar-oferta');
  boton.disabled = true;
  elemento('mensaje-oferta').textContent = 'Guardando...';

  try {
    await consultar(`/api/ofertas/${ofertaActual._id}`, {
      method: 'PATCH',
      body: datos
    });

    cerrarModalOferta('blur-oferta');
    await cargarOfertas();

  } catch (error) {
    elemento('mensaje-oferta').textContent = error.message;
  } finally {
    boton.disabled = false;
  }
});

elemento('cancelar-baja-oferta').addEventListener('click', () => {
  cerrarModalOferta('blur-oferta-eliminar');
});

elemento('confirmar-baja-oferta').addEventListener('click', async () => {
  const boton = elemento('confirmar-baja-oferta');
  boton.disabled = true;

  try {
    await consultar(`/api/ofertas/${ofertaActual._id}/desactivar`, {
      method: 'PATCH'
    });

    cerrarModalOferta('blur-oferta-eliminar');
    await cargarOfertas();

  } catch (error) {
    elemento('estado-puesto').textContent = error.message;
    cerrarModalOferta('blur-oferta-eliminar');
  } finally {
    boton.disabled = false;
  }
});

for (const id of ['blur-oferta', 'blur-oferta-eliminar']) {
  elemento(id).addEventListener('click', event => {
    if (event.target === elemento(id)) cerrarModalOferta(id);
  });
}

document.addEventListener('DOMContentLoaded', cargarPuesto);
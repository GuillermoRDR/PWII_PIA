const $ = id => document.getElementById(id);

const idSuscripcion = new URLSearchParams(location.search).get('id');

let suscripcionActual = null;
let usuarioActual = null;
let urlTemporal = null;

async function solicitar(url, opciones = {}) {
  const respuesta = await fetch(url, {
    credentials: 'same-origin',
    ...opciones
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(datos.error || 'Error en la solicitud.');
  }

  return datos;
}

function abrirModal(id) {
  $(id).classList.add('mostrar');
}

function cerrarModal(id) {
  $(id).classList.remove('mostrar');
}

function mostrarSuscripcion(suscripcion) {
  $('titulo-suscripcion').textContent = suscripcion.titulo;
  $('tdp').textContent = suscripcion.titulo;

  $('costo-suscripcion').textContent = `Costo: $${suscripcion.precio} MXN`;

  $('duracion-suscripcion').textContent =
    `Duración: ${suscripcion.duracion} ${suscripcion.duracion === 1 ? 'día' : 'días'}`;

  $('descripcion-suscripcion').textContent =
    suscripcion.descripcion || 'Sin descripción.';

  const foto = $('foto-suscripcion');
  foto.src = suscripcion.imagenSuscripcionUrl || '/media/images/MRP.png';
  foto.alt = `Imagen de ${suscripcion.titulo}`;

  $('ragbot').textContent = ` Suscribirse $${suscripcion.precio} MXN`;
  $('ragbot').disabled = false;

  document.title = `${suscripcion.titulo} | MercaRed`;
}

function verificarPermisos() {
  const administrador = usuarioActual?.tipoUsuario === 'administrador';

  $('acciones-suscripcion').style.display = administrador ? '' : 'none';
}

async function cargarSuscripcion() {
  if (!idSuscripcion) {
    $('estado-suscripcion').textContent = 'No se indicó una suscripción.';
    $('tdp').textContent = 'Suscripción no disponible';
    return;
  }

  try {
    suscripcionActual = await solicitar(
      `/api/suscripciones/${encodeURIComponent(idSuscripcion)}`
    );

    mostrarSuscripcion(suscripcionActual);

    try {
      usuarioActual = await solicitar('/api/usuario/perfil');
      verificarPermisos();
    } catch {
      usuarioActual = null;
    }

  } catch (error) {
    $('estado-suscripcion').textContent = error.message;
    $('titulo-suscripcion').textContent = 'Suscripción no disponible';
    $('tdp').textContent = 'Suscripción no disponible';
  }
}

$('ragbot').addEventListener('click', () => {
  window.location.href = `/tarjeta.html?id=${encodeURIComponent(idSuscripcion)}`;
});

$('editar-suscripcion').addEventListener('click', () => {
  const s = suscripcionActual;

  $('input-nombre').value = s.titulo;
  $('input-costo').value = s.precio;
  $('input-duracion').value = s.duracion;
  $('input-descripcion').value = s.descripcion || '';
  $('input-imagen').value = '';

  const vista = $('vista-imagen');

  if (s.imagenSuscripcionUrl) {
    vista.style.backgroundImage = `url("${s.imagenSuscripcionUrl}")`;
    vista.classList.add('tiene-imagen');
    $('texto-imagen').textContent = 'Cambiar imagen';
  } else {
    vista.style.backgroundImage = 'none';
    vista.classList.remove('tiene-imagen');
    $('texto-imagen').textContent = 'Subir imagen';
  }

  $('mensaje-editar').textContent = '';

  abrirModal('blur-editar');
});

$('input-imagen').addEventListener('change', () => {
  const archivo = $('input-imagen').files[0];

  if (!archivo) return;

  const permitidos = ['image/jpeg', 'image/png', 'image/webp'];

  if (!permitidos.includes(archivo.type) || archivo.size > 5 * 1024 * 1024) {
    $('mensaje-editar').textContent =
      'La imagen debe ser JPG, PNG o WebP y pesar máximo 5 MB.';
    $('input-imagen').value = '';
    return;
  }

  if (urlTemporal) URL.revokeObjectURL(urlTemporal);
  urlTemporal = URL.createObjectURL(archivo);

  const vista = $('vista-imagen');
  vista.style.backgroundImage = `url("${urlTemporal}")`;
  vista.classList.add('tiene-imagen');
  $('texto-imagen').textContent = 'Cambiar imagen';
  $('mensaje-editar').textContent = '';
});

$('cerrar-editar').addEventListener('click', () => cerrarModal('blur-editar'));

$('formEditarSuscripcion').addEventListener('submit', async event => {
  event.preventDefault();

  const precio = Number($('input-costo').value);
  const duracion = Number($('input-duracion').value);

  if (!Number.isFinite(precio) || precio < 0) {
    $('mensaje-editar').textContent = 'Ingresa un costo válido.';
    return;
  }

  if (!Number.isInteger(duracion) || duracion < 1) {
    $('mensaje-editar').textContent = 'La duración debe ser un número entero de días.';
    return;
  }

  const datos = new FormData();

  datos.append('titulo', $('input-nombre').value.trim());
  datos.append('precio', precio);
  datos.append('duracion', duracion);
  datos.append('descripcion', $('input-descripcion').value.trim());

  const imagen = $('input-imagen').files[0];

  if (imagen) {
    datos.append('imagenSuscripcion', imagen);
  }

  const boton = $('guardar-suscripcion');
  boton.disabled = true;
  $('mensaje-editar').textContent = 'Guardando...';

  try {
    await solicitar(`/api/suscripciones/${idSuscripcion}`, {
      method: 'PATCH',
      body: datos
    });

    suscripcionActual = await solicitar(`/api/suscripciones/${idSuscripcion}`);
    mostrarSuscripcion(suscripcionActual);

    cerrarModal('blur-editar');

  } catch (error) {
    $('mensaje-editar').textContent = error.message;
  } finally {
    boton.disabled = false;
  }
});

$('eliminar-suscripcion').addEventListener('click', () => {
  abrirModal('blur-eliminar');
});

$('cancelar-baja').addEventListener('click', () => {
  cerrarModal('blur-eliminar');
});

$('confirmar-baja').addEventListener('click', async () => {
  const boton = $('confirmar-baja');
  boton.disabled = true;

  try {
    await solicitar(`/api/suscripciones/${idSuscripcion}/desactivar`, {
      method: 'PATCH'
    });

    window.location.href = '/suscripcion.html';

  } catch (error) {
    $('estado-suscripcion').textContent = error.message;
    cerrarModal('blur-eliminar');
  } finally {
    boton.disabled = false;
  }
});

for (const id of ['blur-editar', 'blur-eliminar']) {
  $(id).addEventListener('click', event => {
    if (event.target === $(id)) cerrarModal(id);
  });
}

cargarSuscripcion();
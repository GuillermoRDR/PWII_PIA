const idPuesto = new URLSearchParams(location.search).get('id');

let puestoActual = null;
let usuarioActual = null;

const elemento = id => document.getElementById(id);

async function consultar(url) {
  const respuesta = await fetch(url, {
    credentials: 'same-origin'
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
const $ = id => document.getElementById(id);

async function solicitar(url, opciones = {}) {
  const respuesta = await fetch(url, {
    credentials: 'same-origin',
    ...opciones
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(datos.error || 'Error al consultar las suscripciones.');
  }

  return datos;
}

function crearTarjeta({ id, nombre, imagen, destino }) {
  const tarjeta = document.createElement('button');
  tarjeta.type = 'button';
  tarjeta.className = 'comercio';

  const foto = document.createElement('img');
  foto.src = imagen || '/media/images/MRP.png';
  foto.alt = nombre;
  foto.loading = 'lazy';

  const titulo = document.createElement('h3');
  titulo.textContent = nombre;

  tarjeta.append(foto, titulo);

  tarjeta.addEventListener('click', () => {
    window.location.href = `${destino}?id=${encodeURIComponent(id)}`;
  });

  return tarjeta;
}

function mostrarSuscripciones(suscripciones) {
  const contenedor = $('lista-suscripciones');
  const estado = $('estado-suscripciones');

  contenedor.replaceChildren();

  if (!suscripciones.length) {
    estado.textContent = 'Por ahora no hay suscripciones disponibles.';
    return;
  }

  estado.textContent = '';

  suscripciones.forEach(suscripcion => {
    contenedor.appendChild(crearTarjeta({
      id: suscripcion._id,
      nombre: suscripcion.titulo,
      imagen: suscripcion.imagenSuscripcionUrl,
      destino: '/susa.html'
    }));
  });
}

async function cargarSuscripciones() {
  try {
    mostrarSuscripciones(await solicitar('/api/suscripciones'));
  } catch (error) {
    $('estado-suscripciones').textContent = error.message;
  }
}

document.addEventListener('DOMContentLoaded', cargarSuscripciones);
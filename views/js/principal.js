const $ = id => document.getElementById(id);

async function solicitar(url) {
  const respuesta = await fetch(url, {
    credentials: 'same-origin'
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    const error = new Error(datos.error || 'Error al consultar los datos.');
    error.status = respuesta.status;
    throw error;
  }

  return datos;
}

function crearTarjeta({ id, nombre, imagen, descripcion, destino }) {
  const tarjeta = document.createElement('button');
  tarjeta.type = 'button';
  tarjeta.className = 'comercio';

  const foto = document.createElement('img');
  foto.src = imagen || '/media/images/default.png';
  foto.alt = nombre;
  foto.loading = 'lazy';

  const titulo = document.createElement('h3');
  titulo.textContent = nombre;

  tarjeta.append(foto, titulo);

  if (descripcion) {
    const texto = document.createElement('p');
    texto.className = 'descripcion-tarjeta';
    texto.textContent = descripcion;
    tarjeta.appendChild(texto);
  }

  tarjeta.addEventListener('click', () => {
    window.location.href =
      `${destino}?id=${encodeURIComponent(id)}`;
  });

  return tarjeta;
}

function mostrarComercios(comercios, contenedorId, estadoId) {
  const contenedor = $(contenedorId);
  const estado = $(estadoId);

  contenedor.replaceChildren();

  if (!comercios.length) {
    estado.textContent = 'No hay mercados para mostrar.';
    return;
  }

  estado.textContent = '';

  comercios.forEach(comercio => {
    contenedor.appendChild(crearTarjeta({
      id: comercio._id,
      nombre: comercio.nombreComercio,
      imagen: comercio.imagenComercioUrl,
      descripcion: comercio.direccion,
      destino: '/coma.html'
    }));
  });
}

function mostrarPuestos(puestos) {
  const contenedor = $('puestos-recientes');
  const estado = $('estado-puestos');

  contenedor.replaceChildren();

  if (!puestos.length) {
    estado.textContent = 'Todavía no hay puestos disponibles.';
    return;
  }

  estado.textContent = '';

  puestos.forEach(puesto => {
    contenedor.appendChild(crearTarjeta({
      id: puesto._id,
      nombre: puesto.nombrePuesto,
      imagen: puesto.imagenPuestoUrl,
      descripcion: puesto.categoria,
      destino: '/com.html'
    }));
  });
}

async function cargarPerfilInicio() {
  try {
    const usuario = await solicitar('/api/usuario/perfil');

    $('nombre-usuario').textContent =
      usuario.nombreUsuario || 'Mi perfil';

    $('foto-usuario').src =
      usuario.fotoPerfilUrl || '/media/images/default.png';

    return usuario;

  } catch (error) {
    console.error('No se pudo cargar el perfil:', error);

    if (error.status === 401) {
      $('nombre-usuario').textContent = 'Iniciar sesión';
      $('prof').onclick = () => {
        window.location.href = '/inicioSesion';
      };
    }

    return null;
  }
}

async function cargarMisComercios(usuario) {
  if (!usuario) {
    $('estado-mis-comercios').textContent =
      'Inicia sesión para consultar tus mercados.';
    return;
  }

  if (!['comerciante', 'administrador'].includes(usuario.tipoUsuario)) {
    $('estado-mis-comercios').textContent =
      'Esta cuenta no administra mercados.';
    return;
  }

  try {
    const comercios = await solicitar('/api/comercios/mis-comercios');

    mostrarComercios(
      comercios.filter(c => c.activo !== false).slice(0, 4),
      'mis-comercios',
      'estado-mis-comercios'
    );

  } catch (error) {
    $('estado-mis-comercios').textContent = error.message;
  }
}

async function cargarComerciosPublicos() {
  try {
    const comercios = await solicitar('/api/comercios');

    mostrarComercios(
      comercios.slice(0, 6),
      'explorar-comercios',
      'estado-comercios'
    );

  } catch (error) {
    $('estado-comercios').textContent = error.message;
  }
}

async function cargarPuestosRecientes() {
  try {
    const puestos = await solicitar('/api/puestos');

    mostrarPuestos(puestos.slice(0, 6));

  } catch (error) {
    $('estado-puestos').textContent = error.message;
  }
}

async function iniciarPrincipal() {
  const usuario = await cargarPerfilInicio();

  await Promise.all([
    cargarMisComercios(usuario),
    cargarComerciosPublicos(),
    cargarPuestosRecientes()
  ]);
}

document.addEventListener('DOMContentLoaded', iniciarPrincipal);
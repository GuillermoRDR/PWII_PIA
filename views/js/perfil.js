const $ = (id) => document.getElementById(id);

const formEditar = $('formEditarPerfil');
const mensajeEditar = $('mensaje-editar');
const botonGuardar = $('guardar-perfil');

let usuarioActual = null;
let urlTemporal = null;

const avatarDefault = '/media/images/default.png';

async function solicitarJSON(url, opciones = {}) {
  const respuesta = await fetch(url, {
    credentials: 'same-origin',
    ...opciones
  });

  const resultado = await respuesta.json();

  if (!respuesta.ok) {
    const error = new Error(resultado.error || 'Ocurrió un error.');
    error.status = respuesta.status;
    throw error;
  }

  return resultado;
}

async function cargarPerfil() {
  try {
    usuarioActual = await solicitarJSON('/api/usuario/perfil');
    mostrarPerfil(usuarioActual);
  } catch (error) {
    if (error.status === 401) {
      window.location.replace('/inicioSesion');
      return;
    }

    console.error('No se pudo cargar el perfil:', error);
    $('tdp').textContent = 'Error al cargar el perfil';
  }
}

function mostrarPerfil(usuario) {
  $('tdp').textContent = usuario.nombreUsuario;
  document.title = `${usuario.nombreUsuario} | MercaRed`;

  const genero = {
    femenino: 'Femenino',
    masculino: 'Masculino',
    'no-binario': 'No binario'
  }[usuario.genero] || 'No especificado';

  const edad = usuario.edad != null
    ? `, ${usuario.edad} años`
    : '';

  $('genero-edad').textContent = genero + edad;

  $('tipo-usuario').textContent =
    `Usuario: ${usuario.tipoUsuario}`;

  $('localidad-perfil').textContent =
    `Localidad: ${usuario.localidad || 'No especificada'}`;

  $('descripcion-perfil').textContent =
    usuario.descripcionPerfil || 'Sin descripción.';

  if (usuario.createdAt) {
    $('fecha-registro').textContent =
      `Se unió el ${new Date(usuario.createdAt).toLocaleDateString('es-MX')}`;
  }

  // fotoPerfilUrl debe ser una URL de lectura generada por el backend.
  $('foto-perfil').src = usuario.fotoPerfilUrl || avatarDefault;
}

function abrirEditar() {
  if (!usuarioActual) return;

  $('input-nombre').value = usuarioActual.nombreUsuario || '';
  $('input-localidad').value = usuarioActual.localidad || '';
  $('select-genero').value = usuarioActual.genero || '';
  $('input-edad').value = usuarioActual.edad ?? '';
  $('input-descripcion').value = usuarioActual.descripcionPerfil || '';

  $('input-foto').value = '';
  $('vista-foto').src = $('foto-perfil').src;
  mensajeEditar.textContent = '';

  liberarVistaPrevia();
  $('blur-editar').classList.add('mostrar');
}

function liberarVistaPrevia() {
  if (urlTemporal) {
    URL.revokeObjectURL(urlTemporal);
    urlTemporal = null;
  }
}

function cerrarModal(id) {
  $(id).classList.remove('mostrar');
  liberarVistaPrevia();
}

$('editar-perfil').addEventListener('click', abrirEditar);

$('cerrar-editar').addEventListener('click', () => {
  cerrarModal('blur-editar');
});

$('eliminar-perfil').addEventListener('click', () => {
  $('blur-eliminar').classList.add('mostrar');
});

$('cerrar-eliminar').addEventListener('click', () => {
  cerrarModal('blur-eliminar');
});

for (const id of ['blur-editar', 'blur-eliminar']) {
  $(id).addEventListener('click', (event) => {
    if (event.target === $(id)) {
      cerrarModal(id);
    }
  });
}

$('input-foto').addEventListener('change', (event) => {
  liberarVistaPrevia();

  const archivo = event.target.files[0];
  if (!archivo) return;

  const tipos = ['image/jpeg', 'image/png', 'image/webp'];

  if (!tipos.includes(archivo.type) || archivo.size > 5 * 1024 * 1024) {
    mensajeEditar.textContent = 'Selecciona una imagen JPG, PNG o WebP de hasta 5 MB.';
    event.target.value = '';
    return;
  }

  urlTemporal = URL.createObjectURL(archivo);
  $('vista-foto').src = urlTemporal;
});

formEditar.addEventListener('submit', async (event) => {
  event.preventDefault();

  botonGuardar.disabled = true;
  mensajeEditar.textContent = 'Guardando cambios...';

  try {
    const datos = new FormData(formEditar);

    const resultado = await solicitarJSON('/api/usuario/perfil', {
      method: 'PATCH',
      body: datos
    });

    usuarioActual = resultado.usuario;
    mostrarPerfil(usuarioActual);
    cerrarModal('blur-editar');

  } catch (error) {
    mensajeEditar.textContent = error.message;
  } finally {
    botonGuardar.disabled = false;
  }
});

$('cerrar-sesion').addEventListener('click', async () => {
  try {
    await solicitarJSON('/api/usuario/cerrarSesion', {
      method: 'POST'
    });

    window.location.replace('/inicioSesion');
  } catch (error) {
    alert(error.message);
  }
});

cargarPerfil();
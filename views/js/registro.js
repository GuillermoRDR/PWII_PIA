const formRegistro = document.getElementById('formRegistro');
const mensajeRegistro = document.getElementById('mensajeRegistro');
const botonRegistro = document.getElementById('ragbot');
const avatarUpload = document.getElementById('avatar-upload');
const inputFoto = document.getElementById('foto');
const previewAvatar = document.getElementById('preview-avatar');
const placeholderAvatar = document.getElementById('placeholder-avatar');

formRegistro.addEventListener('submit', registrarUsuario);

async function registrarUsuario(event) {
  event.preventDefault();

  const nombreUsuario = document.getElementById('usuario').value.trim();
  const correo = document.getElementById('correo').value.trim();
  const password = document.getElementById('contrasena').value;
  const verificarContra = document.getElementById('verificarContra').value;
  const localidad = document.getElementById('localidad').value.trim();
  const tipoUsuario = document.getElementById('tipo-usuario').value;
  const genero = document.getElementById('genero').value;
  const edad = document.getElementById('edad').value;
  const descripcionPerfil = document.getElementById('descripcion').value.trim();
  const fotoPerfil = document.getElementById('foto').files[0];

  if (password !== verificarContra) {
    mensajeRegistro.textContent = 'Las contraseñas no coinciden.';
    return;
  }

  const datos = new FormData();

  datos.append('nombreUsuario', nombreUsuario);
  datos.append('correo', correo);
  datos.append('password', password);
  datos.append('verificarContra', verificarContra);
  datos.append('localidad', localidad);
  datos.append('tipoUsuario', tipoUsuario);
  datos.append('genero', genero);
  datos.append('descripcionPerfil', descripcionPerfil);

  if (edad !== '') {
    datos.append('edad', edad);
  }

  if (fotoPerfil) {
    datos.append('fotoPerfil', fotoPerfil);
  }

  botonRegistro.disabled = true;
  mensajeRegistro.textContent = 'Registrando usuario...';

  try {
    const respuesta = await fetch('/api/usuario/registro', {
      method: 'POST',
      body: datos
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.error || 'Error al registrar usuario.');
    }

    mensajeRegistro.textContent = resultado.mensaje;
    window.location.href = '/inicioSesion';

  } catch (error) {
    mensajeRegistro.textContent = error.message;
  } finally {
    botonRegistro.disabled = false;
  }
}

avatarUpload.addEventListener('click', () => {
  inputFoto.click();
});

inputFoto.addEventListener('change', previsualizarAvatar);

function previsualizarAvatar(event) {
  const file = event.target.files[0];

  if (!file) return;

  const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];

  if (!tiposPermitidos.includes(file.type)) {
    alert('Selecciona una imagen JPG, PNG o WebP.');
    inputFoto.value = '';
    return;
  }

  const reader = new FileReader();

  reader.onload = (event) => {
    previewAvatar.src = event.target.result;
    previewAvatar.style.display = 'block';
    placeholderAvatar.style.display = 'none';
  };

  reader.readAsDataURL(file);
}
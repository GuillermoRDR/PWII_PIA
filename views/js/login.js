const formLogin = document.getElementById('formLogin');
const mensajeLogin = document.getElementById('mensajeLogin');
const botonLogin = document.getElementById('ragbot');

formLogin.addEventListener('submit', iniciarSesion);

async function iniciarSesion(event) {
  event.preventDefault();

  const correo = document.getElementById('correo').value.trim();
  const password = document.getElementById('contrasena').value;

  botonLogin.disabled = true;
  mensajeLogin.textContent = 'Iniciando sesión...';

  try {
    const respuesta = await fetch('/api/usuario/inicioSesion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin',
      body: JSON.stringify({
        correo,
        password
      })
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
        resultado.error || 'No se pudo iniciar sesión.'
      );
    }

    mensajeLogin.textContent = 'Inicio de sesión exitoso.';

    window.location.href = '/';

  } catch (error) {
    mensajeLogin.textContent = error.message;
  } finally {
    botonLogin.disabled = false;
  }
}
const botonCerrarSesion = document.getElementById('cerrarSesion');

botonCerrarSesion.addEventListener('click', async () => {
  try {
    const respuesta = await fetch('/api/usuario/cerrarSesion', {
      method: 'POST',
      credentials: 'same-origin'
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.error || 'No se pudo cerrar la sesión.');
    }

    window.location.href = '/inicioSesion';

  } catch (error) {
    console.error('Error al cerrar sesión:', error);
  }
});
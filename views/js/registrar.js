const $ = id => document.getElementById(id);

const elementosPorTipo = {
  cliente: ['mensaje-cliente'],
  comerciante: ['opcion1', 'opcion2', 'opcion3', 'acceso-comercios', 'acceso-puestos'],
  administrador: ['opcion1', 'opcion2', 'opcion3', 'opcion4', 'acceso-comercios', 'acceso-puestos']
};

async function mostrarOpciones() {
  try {
    const respuesta = await fetch('/api/usuario/perfil', {
      credentials: 'same-origin'
    });

    const usuario = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(usuario.error || 'No se pudo consultar el perfil.');
    }

    const ids = elementosPorTipo[usuario.tipoUsuario];

    if (!ids) {
      throw new Error(`Tipo de usuario no reconocido: ${usuario.tipoUsuario}`);
    }

    for (const id of ids) {
      $(id).style.display = '';
    }

  } catch (error) {
    console.error('No se pudo consultar el tipo de usuario:', error);
    $('mensaje-sesion').style.display = '';
  }
}

mostrarOpciones();
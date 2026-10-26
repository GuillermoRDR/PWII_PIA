const $ = (id) => document.getElementById(id);

let misMercados = [];

async function solicitar(url, opciones = {}) {
  const respuesta = await fetch(url, {
    credentials: 'same-origin',
    ...opciones
  });

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new Error(datos.error || 'Ocurrió un error.');
  }

  return datos;
}

function crearElemento(etiqueta, clase, texto) {
  const elemento = document.createElement(etiqueta);

  if (clase) elemento.className = clase;
  if (texto !== undefined) elemento.textContent = texto;

  return elemento;
}

function crearBoton(texto, icono, clase, accion) {
  const boton = crearElemento('button', clase);
  boton.type = 'button';

  const iconoElemento = crearElemento('i', icono);
  boton.append(iconoElemento, document.createTextNode(` ${texto}`));

  boton.addEventListener('click', accion);

  return boton;
}

async function cambiarEstado(mercado, activar, boton) {
  const accion = activar ? 'reactivar' : 'desactivar';

  const confirmado = window.confirm(
    `¿Deseas ${accion} "${mercado.nombreComercio}"?`
  );

  if (!confirmado) return;

  boton.disabled = true;

  try {
    const resultado = await solicitar(
      `/api/comercios/${mercado._id}/${accion}`,
      { method: 'PATCH' }
    );

    mercado.activo = resultado.comercio.activo;
    mercado.fechaBaja = resultado.comercio.fechaBaja;

    $('estado-mercados').textContent = resultado.mensaje;

    mostrarMercados();

  } catch (error) {
    $('estado-mercados').textContent = error.message;
    boton.disabled = false;
  }
}

function crearTarjeta(mercado) {
  const activo = mercado.activo !== false;

  const tarjeta = crearElemento('article', 'tarjeta-gestion');

  const imagen = crearElemento('div', 'imagen-mercado');

  if (mercado.imagenComercioUrl) {
    const foto = document.createElement('img');
    foto.src = mercado.imagenComercioUrl;
    foto.alt = `Fotografía de ${mercado.nombreComercio}`;
    foto.loading = 'lazy';
    imagen.appendChild(foto);
  } else {
    imagen.appendChild(
      crearElemento('i', 'fa-solid fa-store')
    );
  }

  const contenido = crearElemento('div', 'contenido-mercado');

  const titulo = crearElemento(
    'h3',
    '',
    mercado.nombreComercio
  );

  const codigo = crearElemento(
    'p',
    'codigo-mercado',
    `Código: ${mercado.codigoComercio}`
  );

  const direccion = crearElemento(
    'p',
    'direccion-mercado',
    mercado.direccion
  );

  const estado = crearElemento(
    'span',
    `estado-etiqueta ${activo ? 'activo' : 'inactivo'}`,
    activo ? 'Activo' : 'Desactivado'
  );

  const acciones = crearElemento('div', 'acciones-gestion');

  if (activo) {
    const ver = crearBoton(
      'Ver mercado',
      'fa-solid fa-eye',
      'boton-gestion boton-ver',
      () => {
        window.location.href = `/coma.html?id=${mercado._id}`;
      }
    );

    const desactivar = crearBoton(
      'Desactivar',
      'fa-solid fa-ban',
      'boton-gestion boton-desactivar',
      () => cambiarEstado(mercado, false, desactivar)
    );

    acciones.append(ver, desactivar);

  } else {
    const reactivar = crearBoton(
      'Reactivar',
      'fa-solid fa-rotate-left',
      'boton-gestion boton-reactivar',
      () => cambiarEstado(mercado, true, reactivar)
    );

    acciones.appendChild(reactivar);
  }

  contenido.append(titulo, codigo, direccion, estado, acciones);
  tarjeta.append(imagen, contenido);

  return tarjeta;
}

function mostrarMercados() {
  const filtro = $('filtro-mercados').value;
  const contenedor = $('lista-mis-mercados');

  contenedor.replaceChildren();

  const mercadosFiltrados = misMercados.filter(mercado => {
    if (filtro === 'activos') return mercado.activo !== false;
    if (filtro === 'inactivos') return mercado.activo === false;
    return true;
  });

  if (mercadosFiltrados.length === 0) {
    contenedor.appendChild(
      crearElemento(
        'p',
        'sin-mercados',
        misMercados.length === 0
          ? 'Todavía no has registrado ningún mercado.'
          : 'No tienes mercados en esta categoría.'
      )
    );
    return;
  }

  mercadosFiltrados.forEach(mercado => {
    contenedor.appendChild(crearTarjeta(mercado));
  });
}

async function cargarMisMercados() {
  try {
    misMercados = await solicitar('/api/comercios/mis-comercios');

    $('estado-mercados').textContent = '';

    mostrarMercados();

  } catch (error) {
    $('estado-mercados').textContent = error.message;

    if (/sesión|autentic|iniciar sesión/i.test(error.message)) {
      $('estado-mercados').textContent +=
        ' Inicia sesión para administrar tus mercados.';
    }
  }
}

$('filtro-mercados').addEventListener('change', mostrarMercados);

cargarMisMercados();
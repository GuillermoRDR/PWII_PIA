const listaComercios = document.getElementById('lista-comercios');
const buscarComercio = document.getElementById('buscar-comercio');
const estadoComercios = document.getElementById('estado-comercios');

const imagenDefault = '/media/images/mercadito.jpg';

let comercios = [];

async function cargarComercios() {
  estadoComercios.textContent = 'Cargando comercios...';

  try {
    const respuesta = await fetch('/api/comercios');

    if (!respuesta.ok) {
      throw new Error('No se pudieron consultar los comercios.');
    }

    const resultado = await respuesta.json();

    if (!Array.isArray(resultado)) {
      throw new Error('La respuesta del servidor no es válida.');
    }

    comercios = resultado;
    mostrarComercios(comercios);

  } catch (error) {
    console.error('Error al cargar comercios:', error);
    estadoComercios.textContent = error.message;
  }
}

function mostrarComercios(resultados) {
  listaComercios.replaceChildren();

  if (resultados.length === 0) {
    estadoComercios.textContent = comercios.length === 0
      ? 'Todavía no hay mercados registrados.'
      : 'No se encontraron mercados con esos criterios.';
    return;
  }

  estadoComercios.textContent =
    `${resultados.length} mercado(s) encontrado(s).`;

  const fragmento = document.createDocumentFragment();

  for (const comercio of resultados) {
    const tarjeta = document.createElement('button');
    tarjeta.type = 'button';
    tarjeta.className = 'comercio';

    const imagen = document.createElement('img');
    imagen.src = comercio.imagenComercioUrl || imagenDefault;
    imagen.alt = comercio.nombreComercio;
    imagen.loading = 'lazy';

    imagen.addEventListener('error', () => {
      if (imagen.src !== new URL(imagenDefault, location.href).href) {
        imagen.src = imagenDefault;
      }
    });

    const titulo = document.createElement('h3');
    titulo.textContent = comercio.nombreComercio;

    const direccion = document.createElement('p');
    direccion.className = 'comercio-direccion';
    direccion.textContent = comercio.direccion;

    const categorias = document.createElement('p');
    categorias.className = 'comercio-categorias';
    categorias.textContent = Array.isArray(comercio.categorias)
      ? comercio.categorias.join(' · ')
      : '';

    tarjeta.append(imagen, titulo, direccion, categorias);

    tarjeta.addEventListener('click', () => {
      window.location.href =
        `/coma.html?id=${encodeURIComponent(comercio._id)}`;
    });

    fragmento.appendChild(tarjeta);
  }

  listaComercios.appendChild(fragmento);
}

function normalizarTexto(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

buscarComercio.addEventListener('input', () => {
  const busqueda = normalizarTexto(buscarComercio.value);

  const resultados = comercios.filter(comercio => {
    const contenido = [
      comercio.nombreComercio,
      comercio.direccion,
      ...(Array.isArray(comercio.categorias)
        ? comercio.categorias
        : [])
    ].join(' ');

    return normalizarTexto(contenido).includes(busqueda);
  });

  mostrarComercios(resultados);
});

cargarComercios();
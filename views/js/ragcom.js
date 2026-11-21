const $ = id => document.getElementById(id);

const parametros = new URLSearchParams(location.search);
const idMercado = parametros.get('id');
const codigoMercado = parametros.get('codigo');

let puestosDelMercado = [];

async function solicitar(url) {
  const respuesta = await fetch(url, { credentials: 'same-origin' });
  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new Error(datos.error || 'Error en la solicitud.');
  }

  return datos;
}

function crearElementoPuesto(etiqueta, clase, texto) {
  const elemento = document.createElement(etiqueta);

  if (clase) elemento.className = clase;
  if (texto !== undefined) elemento.textContent = texto;

  return elemento;
}

function formatearHorarioPuesto(horario) {
  if (!Array.isArray(horario) || !horario.length) {
    return 'Horario no disponible';
  }

  return horario
    .map(item => `${item.dia}: ${item.apertura} - ${item.cierre}`)
    .join(' · ');
}

function resumirDias(horario) {
  if (!Array.isArray(horario) || !horario.length) {
    return '';
  }

  const dias = horario.map(item => item.dia);

  if (dias.length === 1) return dias[0];

  return `${dias.slice(0, -1).join(', ')} y ${dias[dias.length - 1]}`;
}

function mostrarComercio(comercio) {
  $('nombre-comercio').textContent = comercio.nombreComercio;
  $('horario-comercio').textContent = resumirDias(comercio.horario);

  $('header').style.backgroundImage = comercio.imagenComercioUrl
    ? `url("${comercio.imagenComercioUrl}")`
    : 'none';

  document.title = `${comercio.nombreComercio} | MercaRed`;
}

function crearTarjetaPuesto(puesto) {
  const tarjeta = crearElementoPuesto('article', 'tarjeta-puesto');

  const imagen = crearElementoPuesto('div', 'tarjeta-puesto-imagen');

  if (puesto.imagenPuestoUrl) {
    const foto = document.createElement('img');
    foto.src = puesto.imagenPuestoUrl;
    foto.alt = `Fotografía de ${puesto.nombrePuesto}`;
    foto.loading = 'lazy';
    imagen.appendChild(foto);
  } else {
    imagen.appendChild(crearElementoPuesto('i', 'fa-solid fa-store'));
  }

  const contenido = crearElementoPuesto('div', 'tarjeta-puesto-contenido');

  contenido.append(
    crearElementoPuesto('h3', '', puesto.nombrePuesto),
    crearElementoPuesto('span', 'tarjeta-puesto-categoria', puesto.categoria),
    crearElementoPuesto('p', 'tarjeta-puesto-descripcion', puesto.descripcionPuesto || 'Sin descripción.'),
    crearElementoPuesto('p', 'tarjeta-puesto-horario', formatearHorarioPuesto(puesto.horario))
  );

  tarjeta.append(imagen, contenido);

  tarjeta.tabIndex = 0;
  tarjeta.setAttribute('role', 'link');
  tarjeta.setAttribute('aria-label', `Ver información del puesto ${puesto.nombrePuesto}`);

  function abrirFicha() {
    window.location.href = `/com.html?id=${encodeURIComponent(puesto._id)}`;
  }

  tarjeta.addEventListener('click', abrirFicha);

  tarjeta.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      abrirFicha();
    }
  });

  return tarjeta;
}

function mostrarPuestosMercado() {
  const contenedor = $('lista-puestos');
  const busqueda = $('combu').value.trim().toLocaleLowerCase('es');
  const categoriaSeleccionada = $('categoria').value;

  contenedor.replaceChildren();

  const filtrados = puestosDelMercado.filter(puesto => {
    const texto = [
      puesto.nombrePuesto,
      puesto.categoria,
      puesto.descripcionPuesto,
      ...(puesto.palabrasClave || [])
    ]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase('es');

    const coincideBusqueda = texto.includes(busqueda);
    const coincideCategoria = !categoriaSeleccionada || puesto.categoria === categoriaSeleccionada;

    return coincideBusqueda && coincideCategoria;
  });

  if (!filtrados.length) {
    contenedor.appendChild(
      crearElementoPuesto(
        'p',
        'sin-puestos',
        puestosDelMercado.length
          ? 'No se encontraron puestos con esa búsqueda.'
          : 'Este mercado todavía no tiene puestos registrados.'
      )
    );
    return;
  }

  filtrados.forEach(puesto => {
    contenedor.appendChild(crearTarjetaPuesto(puesto));
  });
}

async function cargarPuestosMercado(comercioId) {
  const estado = $('estado-puestos');

  estado.textContent = 'Cargando puestos...';

  try {
    const datos = await solicitar(`/api/puestos?comercio=${encodeURIComponent(comercioId)}`);

    if (!Array.isArray(datos)) {
      throw new Error('El servidor no devolvió una lista válida.');
    }

    puestosDelMercado = datos;

    const selector = $('categoria');

    selector.replaceChildren(new Option('Todas las categorías', ''));

    const categorias = [...new Set(
      puestosDelMercado.map(puesto => puesto.categoria).filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, 'es'));

    categorias.forEach(categoria => {
      selector.add(new Option(categoria, categoria));
    });

    estado.textContent = '';

    mostrarPuestosMercado();

  } catch (error) {
    console.error('Error al cargar puestos:', error);
    estado.textContent = error.message;
  }
}

async function resolverIdMercado() {
  if (idMercado) return idMercado;

  if (codigoMercado) {
    const mercado = await solicitar(`/api/comercios/codigo/${encodeURIComponent(codigoMercado.trim())}`);
    return mercado._id;
  }

  throw new Error('No se indicó un mercado.');
}

async function cargarMercado() {
  try {
    const id = await resolverIdMercado();
    const comercio = await solicitar(`/api/comercios/${encodeURIComponent(id)}`);

    mostrarComercio(comercio);
    await cargarPuestosMercado(id);

  } catch (error) {
    $('estado-comercio').textContent = error.message;
    $('nombre-comercio').textContent = 'Mercado no disponible';
  }
}

$('combu').addEventListener('input', mostrarPuestosMercado);
$('categoria').addEventListener('change', mostrarPuestosMercado);

cargarMercado();
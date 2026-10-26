const $ = id => document.getElementById(id);

const idComercio = new URLSearchParams(location.search).get('id');

let comercioActual = null;
let usuarioActual = null;
let puestosDelMercado = [];

async function solicitar(url, opciones = {}) {
  const respuesta = await fetch(url, {
    credentials: 'same-origin',
    ...opciones
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(datos.error || 'Error en la solicitud.');
  }

  return datos;
}

function mostrarComercio(comercio) {
  $('nombre-comercio').textContent = comercio.nombreComercio;

  $('descripcion-comercio').textContent = comercio.descripcionComercio || 'Sin descripción.';

  $('ubicacion-comercio').textContent = comercio.direccion || 'Ubicación no especificada.';

  const contenedorHorarios = $('dias-comercio');
  contenedorHorarios.replaceChildren();

  for (const horario of comercio.horario || []) {
    const fila = document.createElement('div');
    fila.className = 'horario-fila';

    const dia = document.createElement('span');
    dia.textContent = horario.dia;

    const horas = document.createElement('span');
    horas.textContent = `${horario.apertura} – ${horario.cierre}`;

    fila.append(dia, horas);
    contenedorHorarios.appendChild(fila);
  }

  if (!contenedorHorarios.children.length) {
    contenedorHorarios.textContent = 'Sin horarios registrados.';
  }

  const contenedorCategorias = $('categorias-comercio');
  contenedorCategorias.replaceChildren();

  for (const categoria of comercio.categorias || []) {
    const etiqueta = document.createElement('span');
    etiqueta.className = 'categoria-etiqueta';
    etiqueta.textContent = categoria;

    contenedorCategorias.appendChild(etiqueta);
  }

  if (!contenedorCategorias.children.length) {
    contenedorCategorias.textContent = 'Sin categorías.';
  }

  $('header').dataset.imagenUrl = comercio.imagenComercioUrl || '';

  $('header').style.backgroundImage = comercio.imagenComercioUrl ? `url("${comercio.imagenComercioUrl}")` : 'none';

  document.title = `${comercio.nombreComercio} | MercaRed`;
}

function verificarPermisos() {
  if (!comercioActual || !usuarioActual) return;

  const propietario =
    String(comercioActual.propietario) ===
    String(usuarioActual._id);

  const administrador =
    usuarioActual.tipoUsuario === 'administrador';

  $('acciones-comercio').hidden = !(propietario || administrador);
}

async function cargarComercio() {
  if (!idComercio) {
    $('estado-comercio').textContent = 'No se indicó un mercado.';
    return;
  }

  try {
    comercioActual = await solicitar(`/api/comercios/${encodeURIComponent(idComercio)}`);
    mostrarComercio(comercioActual);
    await cargarPuestosMercado(idComercio);

    try {
      usuarioActual = await solicitar('/api/usuario/perfil');
      verificarPermisos();
    } catch {
      usuarioActual = null;
    }

  } catch (error) {
    $('estado-comercio').textContent = error.message;
    $('nombre-comercio').textContent = 'Mercado no disponible';
  }
}

function abrirModal(id) {
  $(id).classList.add('mostrar');
}

function cerrarModal(id) {
  $(id).classList.remove('mostrar');
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
    imagen.appendChild(
      crearElementoPuesto('i', 'fa-solid fa-store')
    );
  }

  const contenido = crearElementoPuesto(
    'div',
    'tarjeta-puesto-contenido'
  );

  const nombre = crearElementoPuesto(
    'h3',
    '',
    puesto.nombrePuesto
  );

  const categoria = crearElementoPuesto(
    'span',
    'tarjeta-puesto-categoria',
    puesto.categoria
  );

  const descripcion = crearElementoPuesto(
    'p',
    'tarjeta-puesto-descripcion',
    puesto.descripcionPuesto || 'Sin descripción.'
  );

  const horario = crearElementoPuesto(
    'p',
    'tarjeta-puesto-horario',
    formatearHorarioPuesto(puesto.horario)
  );

  contenido.append(nombre, categoria, descripcion, horario);
  tarjeta.append(imagen, contenido);

  tarjeta.tabIndex = 0;
  tarjeta.setAttribute('role', 'link');
  tarjeta.setAttribute(
    'aria-label',
    `Ver información del puesto ${puesto.nombrePuesto}`
  );

  function abrirFicha() {
    window.location.href =
      `/com.html?id=${encodeURIComponent(puesto._id)}`;
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
  const contenedor = document.getElementById('lista-puestos');
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

    const coincideCategoria =
      !categoriaSeleccionada ||
      puesto.categoria === categoriaSeleccionada;

    return coincideBusqueda && coincideCategoria;
  });
  if (!filtrados.length) {
    const mensaje = crearElementoPuesto(
      'p',
      'sin-puestos',
      puestosDelMercado.length
        ? 'No se encontraron puestos con esa búsqueda.'
        : 'Este mercado todavía no tiene puestos registrados.'
    );

    contenedor.appendChild(mensaje);
    return;
  }

  filtrados.forEach(puesto => {
    contenedor.appendChild(crearTarjetaPuesto(puesto));
  });
}

async function cargarPuestosMercado(comercioId) {
  const estado = document.getElementById('estado-puestos');

  if (estado) estado.textContent = 'Cargando puestos...';

  try {
    const respuesta = await fetch(
      `/api/puestos?comercio=${encodeURIComponent(comercioId)}`
    );

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
        datos.error || 'No se pudieron consultar los puestos.'
      );
    }

    if (!Array.isArray(datos)) {
      throw new Error('El servidor no devolvió una lista válida.');
    }

    puestosDelMercado = datos;

    const selector = $('categoria');

    selector.replaceChildren(new Option('Todas las categorías', ''));

    const categorias = [...new Set(
      puestosDelMercado
        .map(puesto => puesto.categoria)
        .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, 'es'));

    categorias.forEach(categoria => {
      selector.add(new Option(categoria, categoria));
    });

    if (estado) estado.textContent = '';

    mostrarPuestosMercado();

  } catch (error) {
    console.error('Error al cargar puestos:', error);

    if (estado) estado.textContent = error.message;
  }
}

$('editar-comercio').addEventListener('click', () => {
  const c = comercioActual;

  $('input-nombre').value = c.nombreComercio;
  $('input-descripcion').value = c.descripcionComercio || '';
  $('input-ubicacion').value = c.direccion;
  $('input-categorias').value = (c.categorias || []).join(', ');

  const horarios = c.horario || [];
  const dias = horarios.map(h => h.dia);

  for (const checkbox of $('dias-editar').querySelectorAll('input')) {
    checkbox.checked = dias.includes(checkbox.value);
  }

  $('input-apertura').value = horarios[0]?.apertura || '09:00';
  $('input-cierre').value = horarios[0]?.cierre || '18:00';

  $('mensaje-editar').textContent = '';

  abrirModal('blur-editar');
});

$('cerrar-editar').addEventListener('click', () => cerrarModal('blur-editar'));

$('formEditarComercio').addEventListener('submit', async event => {
  event.preventDefault();

  const dias = [...$('dias-editar').querySelectorAll('input:checked')]
    .map(input => input.value);

  const apertura = $('input-apertura').value;
  const cierre = $('input-cierre').value;

  if (!dias.length || !apertura || !cierre || apertura >= cierre) {
    $('mensaje-editar').textContent = 'Selecciona días y un horario válido.';
    return;
  }

  const cambios = {
    nombreComercio: $('input-nombre').value.trim(),
    descripcionComercio: $('input-descripcion').value.trim(),
    direccion: $('input-ubicacion').value.trim(),
    categorias: $('input-categorias').value
      .split(',')
      .map(c => c.trim())
      .filter(Boolean),
    horario: dias.map(dia => ({ dia, apertura, cierre }))
  };

  const boton = $('guardar-comercio');
  boton.disabled = true;
  $('mensaje-editar').textContent = 'Guardando...';

  try {
    const resultado = await solicitar(`/api/comercios/${idComercio}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cambios)
    });

    comercioActual = resultado.comercio;

    // El PATCH no devuelve una nueva URL firmada.
    // Conservamos la que ya tenía el comercio.
    comercioActual.imagenComercioUrl =
      comercioActual.imagenComercioUrl ||
      $('header').dataset.imagenUrl ||
      null;

    mostrarComercio(comercioActual);
    cerrarModal('blur-editar');

  } catch (error) {
    $('mensaje-editar').textContent = error.message;
  } finally {
    boton.disabled = false;
  }
});

$('eliminar-comercio').addEventListener('click', () => {
  abrirModal('blur-eliminar');
});

$('cancelar-baja').addEventListener('click', () => {
  cerrarModal('blur-eliminar');
});

$('confirmar-baja').addEventListener('click', async () => {
  const boton = $('confirmar-baja');
  boton.disabled = true;

  try {
    await solicitar(`/api/comercios/${idComercio}/desactivar`, {
      method: 'PATCH'
    });

    window.location.href = '/buscara.html';

  } catch (error) {
    $('estado-comercio').textContent = error.message;
    cerrarModal('blur-eliminar');
  } finally {
    boton.disabled = false;
  }
});

for (const id of ['blur-editar', 'blur-eliminar']) {
  $(id).addEventListener('click', event => {
    if (event.target === $(id)) cerrarModal(id);
  });
}

$('combu').addEventListener('input', mostrarPuestosMercado);
$('categoria').addEventListener('change', mostrarPuestosMercado);

cargarComercio();
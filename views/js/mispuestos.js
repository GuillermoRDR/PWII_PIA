const $ = id => document.getElementById(id);

let puestos = [],
  actual = null;

const api = async (url, opt = {}) => {
  const r = await fetch(url, { credentials: 'same-origin', ...opt });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || `Error ${r.status}`);
  return d;
};

const el = (tag, txt, cls) => {
  const n = document.createElement(tag);
  if (txt !== undefined) n.textContent = txt;
  if (cls) n.className = cls;
  return n;
};

const btn = (txt, fn) => {
  const b = el('button', txt, 'boton-gestion boton-ver');
  b.type = 'button';
  b.addEventListener('click', fn);
  return b;
};

function mostrar() {
  const c = $('lista-mis-puestos');
  c.replaceChildren();
  const f = $('filtro-puestos').value;
  const lista = puestos.filter(
    p => f === 'todos' || (p.activo !== false) === (f === 'activos')
  );

  if (!lista.length) {
    c.append(el('p', 'No tienes puestos en esta categoría.', 'sin-mercados'));
    return;
  }

  for (const p of lista) {
    const card = el('article', undefined, 'tarjeta-gestion'),
      img = el('div', undefined, 'imagen-mercado'),
      body = el('div', undefined, 'contenido-mercado'),
      acc = el('div', undefined, 'acciones-gestion');

    if (p.imagenPuestoUrl) {
      const foto = el('img');
      foto.src = p.imagenPuestoUrl;
      foto.alt = p.nombrePuesto;
      foto.loading = 'lazy';
      img.append(foto);
    } else {
      img.append(el('span', 'Sin fotografía'));
    }

    body.append(
      el('h3', p.nombrePuesto),
      el(
        'p',
        'Mercado: ' + (p.comercio?.nombreComercio || 'No disponible'),
        'codigo-mercado'
      ),
      el(
        'p',
        p.categoria + ' · ' + (p.descripcionPuesto || 'Sin descripción'),
        'direccion-mercado'
      ),
      el(
        'span',
        p.activo === false ? 'Desactivado' : 'Activo',
        'estado-etiqueta ' + (p.activo === false ? 'inactivo' : 'activo')
      )
    );

    acc.append(
      btn('Editar', () => editar(p)),
      btn(p.activo === false ? 'Reactivar' : 'Desactivar', () => estado(p))
    );

    body.append(acc);
    card.append(img, body);
    c.append(card);
  }
}

async function cargar() {
  const estado = $('estado-puestos');
  const contenedor = $('lista-mis-puestos');

  estado.textContent = 'Cargando tus puestos...';
  contenedor.replaceChildren();

  try {
    const resultado = await api('/api/puestos/mis-puestos');

    console.log('Puestos obtenidos:', resultado);

    if (!Array.isArray(resultado)) {
      throw new Error(
        'El servidor no devolvió una lista válida de puestos.'
      );
    }

    puestos = resultado;

    estado.textContent = puestos.length
      ? ''
      : 'Todavía no tienes puestos registrados en esta cuenta.';

    mostrar();

  } catch (error) {
    console.error('Error al cargar mis puestos:', error);

    estado.textContent = `No se pudieron cargar los puestos: ${error.message}`;

    contenedor.replaceChildren();
  }
}

function editar(p) {
  actual = p;
  $('editar-nombre').value = p.nombrePuesto;
  $('editar-categoria').value = p.categoria;
  $('editar-descripcion').value = p.descripcionPuesto || '';
  $('estado-edicion').textContent = '';
  $('dialogo-edicion').showModal();
}

async function estado(p) {
  const a = p.activo === false ? 'reactivar' : 'desactivar';
  if (!confirm(`¿Deseas ${a} ${p.nombrePuesto}?`)) return;
  try {
    await api(`/api/puestos/${p._id}/${a}`, { method: 'PATCH' });
    await cargar();
  } catch (e) {
    $('estado-puestos').textContent = e.message;
  }
}

$('form-edicion').addEventListener('submit', async e => {
  e.preventDefault();
  const b = e.submitter;
  b.disabled = true;
  try {
    await api('/api/puestos/' + actual._id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombrePuesto: $('editar-nombre').value,
        categoria: $('editar-categoria').value,
        descripcionPuesto: $('editar-descripcion').value
      })
    });
    $('dialogo-edicion').close();
    await cargar();
  } catch (err) {
    $('estado-edicion').textContent = err.message;
  } finally {
    b.disabled = false;
  }
});

$('cerrar-edicion').addEventListener('click', () =>
  $('dialogo-edicion').close()
);
$('filtro-puestos').addEventListener('change', mostrar);

cargar();
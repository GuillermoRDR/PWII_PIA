const idPuesto = new URLSearchParams(location.search).get('id');

let puestoActual = null;
let usuarioActual = null;

const elemento = id => document.getElementById(id);

async function consultar(url) {
  const respuesta = await fetch(url, {
    credentials: 'same-origin'
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(datos.error || 'Error al consultar el servidor.');
  }

  return datos;
}

function mostrarDatosPuesto(puesto) {
  elemento('titulo-puesto').textContent = puesto.nombrePuesto;
  elemento('tdp').textContent = puesto.nombrePuesto;

  document.title = `${puesto.nombrePuesto} | MercaRed`;

  elemento('valor-categoria').textContent =
    puesto.categoria || 'Sin categoría';

  elemento('descripcion-puesto').textContent =
    puesto.descripcionPuesto || 'Sin descripción.';

  elemento('palabras-clave-puesto').textContent =
    (puesto.palabrasClave || []).length
      ? `Palabras clave: ${puesto.palabrasClave.join(', ')}`
      : 'Sin palabras clave.';

  elemento('dias-puesto').textContent =
    (puesto.horario || []).length
      ? puesto.horario
        .map(h => `${h.dia}: ${h.apertura} - ${h.cierre}`)
        .join(' · ')
      : 'Horario no disponible.';

  elemento('mercado-puesto').textContent =
    puesto.comercio
      ? `Mercado: ${puesto.comercio.nombreComercio}`
      : 'Mercado no disponible.';

  const foto = elemento('foto-puesto');

  foto.src = puesto.imagenPuestoUrl || '/media/images/default.png';
  foto.alt = `Fotografía de ${puesto.nombrePuesto}`;

}

function verificarPermisos() {
  const puedeEditar =
    usuarioActual &&
    (
      String(puestoActual.propietario) === String(usuarioActual._id) ||
      usuarioActual.tipoUsuario === 'administrador'
    );

  document.querySelector('.acciones-puesto').hidden = !puedeEditar;
}

async function cargarPuesto() {
  if (!idPuesto) {
    elemento('estado-puesto').textContent =
      'No se indicó el identificador del puesto.';
    return;
  }

  try {
    puestoActual = await consultar(
      `/api/puestos/${encodeURIComponent(idPuesto)}`
    );

    mostrarDatosPuesto(puestoActual);

    try {
      usuarioActual = await consultar('/api/usuario/perfil');
    } catch {
      usuarioActual = null;
    }

    verificarPermisos();
    await cargarComentarios();

  } catch (error) {
    console.error('Error al cargar puesto:', error);
    elemento('estado-puesto').textContent = error.message;
    elemento('titulo-puesto').textContent = 'Puesto no disponible';
  }
}

function volverAlMercado() {
  const idMercado = puestoActual?.comercio?._id;

  window.location.href = idMercado
    ? `/coma.html?id=${encodeURIComponent(idMercado)}`
    : '/principal.html';
}

// ===== COMENTARIOS =====
const MAX_COMENTARIO = 200;
let comentarios = [];
let idComentarioPorEliminar = null;

async function enviarJSON(url, metodo, body) {
  const respuesta = await fetch(url, {
    method: metodo,
    credentials: 'same-origin',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    const error = new Error(datos.error || 'Error al comunicarse con el servidor.');
    error.status = respuesta.status;
    throw error;
  }

  return datos;
}

function crearElemento(etiqueta, clase, texto) {
  const el = document.createElement(etiqueta);
  if (clase) el.className = clase;
  if (texto !== undefined) el.textContent = texto;
  return el;
}

function tiempoRelativo(fecha) {
  const segundos = Math.floor((Date.now() - new Date(fecha).getTime()) / 1000);
  if (segundos < 60) return 'hace un momento';

  const unidades = [
    ['año', 'años', 31536000],
    ['mes', 'meses', 2592000],
    ['semana', 'semanas', 604800],
    ['día', 'días', 86400],
    ['hora', 'horas', 3600],
    ['minuto', 'minutos', 60]
  ];

  for (const [singular, plural, valor] of unidades) {
    const n = Math.floor(segundos / valor);
    if (n >= 1) return `hace ${n} ${n === 1 ? singular : plural}`;
  }
}

function mostrarEstado(mensaje) {
  elemento('estado-comentario').textContent = mensaje;
}

function actualizarContador() {
  elemento('contador-crit').textContent =
    `${elemento('crit').value.length}/${MAX_COMENTARIO}`;
}

function esAutor(comentario) {
  return Boolean(usuarioActual) &&
    String(comentario.usuario?._id) === String(usuarioActual._id);
}

function crearTarjetaComentario(c) {
  const articulo = crearElemento('article', 'critica');

  // Foto del autor (o icono si no tiene)
  const avatar = crearElemento('div', 'critica-avatar');
  if (c.usuario?.fotoPerfilUrl) {
    const img = document.createElement('img');
    img.src = c.usuario.fotoPerfilUrl;
    img.alt = c.usuario.nombreUsuario || 'Usuario';
    avatar.appendChild(img);
  } else {
    avatar.classList.add('sin-foto');
    avatar.appendChild(crearElemento('i', 'fa-solid fa-user'));
  }

  const cuerpo = crearElemento('div', 'critica-cuerpo');

  // Nombre y fecha
  const cabecera = crearElemento('div', 'critica-cabecera');
  cabecera.appendChild(
    crearElemento('span', 'critica-nombre', c.usuario?.nombreUsuario || 'Usuario')
  );
  const tiempo = crearElemento(
    'span',
    'critica-tiempo',
    tiempoRelativo(c.createdAt) + (c.editado ? ' (editado)' : '')
  );
  tiempo.title = new Date(c.createdAt).toLocaleString('es-MX');
  cabecera.appendChild(tiempo);

  // Texto (textContent evita inyección de HTML)
  const texto = crearElemento('p', 'critica-texto', c.contenido);

  cuerpo.append(cabecera, texto);

  // Editar / Eliminar solo para el autor
  if (esAutor(c)) {
    const acciones = crearElemento('div', 'critica-acciones');

    const btnEditar = crearElemento('button', 'critica-btn');
    btnEditar.type = 'button';
    btnEditar.innerHTML = '<i class="fa-solid fa-pen"></i> Editar';
    btnEditar.addEventListener('click', () => editarComentario(c, articulo));

    const btnEliminar = crearElemento('button', 'critica-btn critica-btn-eliminar');
    btnEliminar.type = 'button';
    btnEliminar.innerHTML = '<i class="fa-solid fa-trash"></i> Eliminar';
    btnEliminar.addEventListener('click', () => pedirEliminarComentario(c._id));

    acciones.append(btnEditar, btnEliminar);
    cuerpo.appendChild(acciones);
  }

  articulo.append(avatar, cuerpo);
  return articulo;
}

function renderizarComentarios() {
  const lista = elemento('lista-criticas');
  const vacio = elemento('sin-criticas');

  lista.querySelectorAll('.critica').forEach(n => n.remove());
  vacio.hidden = comentarios.length > 0;

  comentarios.forEach(c => lista.insertBefore(crearTarjetaComentario(c), vacio));
}

async function cargarComentarios() {
  try {
    comentarios = await consultar(
      `/api/comentarios/puesto/${encodeURIComponent(idPuesto)}`
    );
  } catch (error) {
    comentarios = [];
    mostrarEstado(error.message);
  }
  renderizarComentarios();
}

async function enviarComentario() {
  const campo = elemento('crit');
  const boton = elemento('send');
  const contenido = campo.value.trim();

  if (!usuarioActual) return mostrarEstado('Inicia sesión para comentar.');
  if (!contenido) return mostrarEstado('Escribe un comentario.');
  if (contenido.length > MAX_COMENTARIO) {
    return mostrarEstado(`Máximo ${MAX_COMENTARIO} caracteres.`);
  }

  boton.disabled = true;

  try {
    const { comentario } = await enviarJSON('/api/comentarios', 'POST', {
      contenido,
      puesto: idPuesto
    });

    comentarios.unshift(comentario);
    campo.value = '';
    actualizarContador();
    mostrarEstado('');
    renderizarComentarios();
  } catch (error) {
    mostrarEstado(error.message);
  } finally {
    boton.disabled = false;
  }
}

function editarComentario(c, articulo) {
  const texto = articulo.querySelector('.critica-texto');

  const edicion = crearElemento('div', 'critica-edicion');
  const campo = document.createElement('textarea');
  campo.rows = 3;
  campo.maxLength = MAX_COMENTARIO;
  campo.value = c.contenido;

  const barra = crearElemento('div', 'critica-acciones');
  const guardar = crearElemento('button', 'critica-btn critica-btn-guardar', 'Guardar');
  const cancelar = crearElemento('button', 'critica-btn', 'Cancelar');
  guardar.type = 'button';
  cancelar.type = 'button';

  cancelar.addEventListener('click', () => renderizarComentarios());

  guardar.addEventListener('click', async () => {
    const contenido = campo.value.trim();
    if (!contenido) return mostrarEstado('El comentario no puede estar vacío.');

    guardar.disabled = true;

    try {
      const { comentario } = await enviarJSON(`/api/comentarios/${c._id}`, 'PATCH', {
        contenido
      });
      comentarios = comentarios.map(x => (x._id === c._id ? comentario : x));
      mostrarEstado('');
      renderizarComentarios();
    } catch (error) {
      mostrarEstado(error.message);
      guardar.disabled = false;
    }
  });

  barra.append(guardar, cancelar);
  edicion.append(campo, barra);
  texto.after(edicion);
  articulo.classList.add('editando');
  campo.focus();
}

function pedirEliminarComentario(id) {
  idComentarioPorEliminar = id;
  elemento('blur-critica').classList.add('mostrar');
}

// Se llama desde el botón "Sí" del modal (onclick en com.html)
async function confirmarEliminarCritica() {
  const id = idComentarioPorEliminar;
  idComentarioPorEliminar = null;
  elemento('blur-critica').classList.remove('mostrar');

  if (!id) return;

  try {
    await enviarJSON(`/api/comentarios/${id}`, 'DELETE');
    comentarios = comentarios.filter(x => x._id !== id);
    mostrarEstado('');
    renderizarComentarios();
  } catch (error) {
    mostrarEstado(error.message);
  }
}

function iniciar() {
  const campo = elemento('crit');
  campo.maxLength = MAX_COMENTARIO;
  campo.addEventListener('input', actualizarContador);
  campo.addEventListener('keydown', evento => {
    if (evento.key === 'Enter') enviarComentario();
  });
  elemento('send').addEventListener('click', enviarComentario);
  actualizarContador();
  cargarPuesto();
}

document.addEventListener('DOMContentLoaded', iniciar);
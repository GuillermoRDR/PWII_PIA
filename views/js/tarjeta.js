const $ = id => document.getElementById(id);

const idSuscripcion = new URLSearchParams(location.search).get('id');

let suscripcionActual = null;

async function solicitar(url, opciones = {}) {
  const respuesta = await fetch(url, {
    credentials: 'same-origin',
    ...opciones
  });

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    const error = new Error(datos.error || 'Error en la solicitud.');
    error.status = respuesta.status;
    throw error;
  }

  return datos;
}

async function cargarResumen() {
  if (!idSuscripcion) {
    location.replace('/suscripcion.html');
    return;
  }

  try {
    suscripcionActual = await solicitar(
      `/api/suscripciones/${encodeURIComponent(idSuscripcion)}`
    );

    $('resumen-pago').textContent =
      `${suscripcionActual.titulo} · ${suscripcionActual.duracion} días · $${suscripcionActual.precio} MXN`;

    $('ragbot').textContent = `Comprar $${suscripcionActual.precio} MXN`;
    $('ragbot').disabled = false;

  } catch (error) {
    $('resumen-pago').textContent = error.message;
    $('mensaje-pago').textContent = 'Regresa y elige otra suscripción.';
  }
}

$('numero-tarjeta').addEventListener('input', () => {
  const digitos = $('numero-tarjeta').value.replace(/\D/g, '').slice(0, 16);
  $('numero-tarjeta').value = digitos.replace(/(.{4})/g, '$1 ').trim();
});

$('vencimiento').addEventListener('input', () => {
  const digitos = $('vencimiento').value.replace(/\D/g, '').slice(0, 4);
  $('vencimiento').value = digitos.length > 2
    ? `${digitos.slice(0, 2)}/${digitos.slice(2)}`
    : digitos;
});

$('cvv').addEventListener('input', () => {
  $('cvv').value = $('cvv').value.replace(/\D/g, '').slice(0, 3);
});

function validarTarjeta() {
  const nombre = $('nombre-tarjeta').value.trim();
  const numero = $('numero-tarjeta').value.replace(/\s/g, '');
  const vencimiento = $('vencimiento').value;
  const cvv = $('cvv').value;

  if (!nombre) return 'Escribe el nombre que aparece en la tarjeta.';

  if (!/^\d{16}$/.test(numero)) return 'El número de tarjeta debe tener 16 dígitos.';

  const coincidencia = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(vencimiento);

  if (!coincidencia) return 'El vencimiento debe tener el formato MM/AA.';

  const finDeMes = new Date(2000 + Number(coincidencia[2]), Number(coincidencia[1]), 0, 23, 59, 59);

  if (finDeMes < new Date()) return 'La tarjeta está vencida.';

  if (!/^\d{3}$/.test(cvv)) return 'El CVV debe tener 3 dígitos.';

  return '';
}

$('ragbot').addEventListener('click', async () => {
  if (!suscripcionActual) return;

  const boton = $('ragbot');
  const mensaje = $('mensaje-pago');

  mensaje.textContent = '';

  const problema = validarTarjeta();

  if (problema) {
    mensaje.textContent = problema;
    return;
  }

  boton.disabled = true;
  mensaje.textContent = 'Procesando compra...';

  try {
    const resultado = await solicitar(
      `/api/suscripciones/${encodeURIComponent(idSuscripcion)}/comprar`,
      { method: 'POST' }
    );

    const fin = new Date(resultado.fechaFin).toLocaleDateString('es-MX');

    mensaje.textContent = `${resultado.mensaje} Vigente hasta el ${fin}.`;

    $('nombre-tarjeta').value = '';
    $('numero-tarjeta').value = '';
    $('vencimiento').value = '';
    $('cvv').value = '';

    setTimeout(() => {
      window.location.href = '/principal.html';
    }, 1800);

  } catch (error) {
    if (error.status === 401) {
      window.location.href = '/inicioSesion';
      return;
    }

    mensaje.textContent = error.message;
    boton.disabled = false;
  }
});

cargarResumen();
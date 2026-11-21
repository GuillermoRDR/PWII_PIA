const $ = id => document.getElementById(id);

const puestoInicial = new URLSearchParams(location.search).get('puesto');

async function cargarMisPuestos() {
  try {
    const respuesta = await fetch('/api/puestos/mis-puestos', {
      credentials: 'same-origin'
    });

    const puestos = await respuesta.json();

    if (respuesta.status === 401) {
      location.replace('/inicioSesion');
      return;
    }

    if (!respuesta.ok) {
      throw new Error(puestos.error || 'No se pudieron cargar tus puestos.');
    }

    const activos = puestos.filter(p => p.activo !== false);

    if (!activos.length) {
      $('mensaje-registro').textContent =
        'Necesitas un puesto activo para registrar ofertas.';
      return;
    }

    for (const puesto of activos) {
      const opcion = document.createElement('option');
      opcion.value = puesto._id;
      opcion.textContent = puesto.nombrePuesto;
      $('puesto').appendChild(opcion);
    }

    if (puestoInicial && activos.some(p => p._id === puestoInicial)) {
      $('puesto').value = puestoInicial;
    }

    $('ragbot').disabled = false;

  } catch (error) {
    $('mensaje-registro').textContent = error.message;
  }
}

cargarMisPuestos();

$('ragbot').addEventListener('click', async () => {
  const boton = $('ragbot');
  const mensaje = $('mensaje-registro');

  const titulo = $('nombre').value.trim();
  const descripcion = $('descripcion').value.trim();
  const codigoOferta = $('codigo').value.trim();
  const puesto = $('puesto').value;
  const descuento = $('descuento').value.trim();
  const fechaFin = $('vence').value;
  const exclusivoPlus = $('exclusiva').checked;
  const imagen = $('imagen').files[0];

  mensaje.textContent = '';

  if (!titulo || !descripcion) {
    mensaje.textContent = 'Completa el nombre y la descripción.';
    return;
  }

  if (!puesto) {
    mensaje.textContent = 'Selecciona el puesto de la oferta.';
    return;
  }

  if (descuento !== '' && (!(Number(descuento) >= 0) || Number(descuento) > 100)) {
    mensaje.textContent = 'El descuento debe estar entre 0 y 100.';
    return;
  }

  if (fechaFin && new Date(`${fechaFin}T23:59:59`) <= new Date()) {
    mensaje.textContent = 'La fecha de vencimiento debe ser posterior a hoy.';
    return;
  }

  if (imagen) {
    const permitidos = ['image/jpeg', 'image/png', 'image/webp'];

    if (!permitidos.includes(imagen.type) || imagen.size > 5 * 1024 * 1024) {
      mensaje.textContent = 'La imagen debe ser JPG, PNG o WebP y pesar máximo 5 MB.';
      return;
    }
  }

  const datos = new FormData();

  datos.append('puesto', puesto);
  datos.append('titulo', titulo);
  datos.append('descripcion', descripcion);
  datos.append('codigoOferta', codigoOferta);
  datos.append('descuento', descuento);
  datos.append('fechaFin', fechaFin);
  datos.append('exclusivoPlus', String(exclusivoPlus));

  if (imagen) {
    datos.append('fotoOferta', imagen);
  }

  boton.disabled = true;
  mensaje.textContent = 'Registrando oferta...';

  try {
    const respuesta = await fetch('/api/ofertas', {
      method: 'POST',
      credentials: 'same-origin',
      body: datos
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.error || 'No se pudo registrar la oferta.');
    }

    mensaje.textContent = 'Oferta registrada correctamente.';

    window.location.href = `/com.html?id=${encodeURIComponent(puesto)}`;

  } catch (error) {
    mensaje.textContent = error.message;
    boton.disabled = false;
  }
});
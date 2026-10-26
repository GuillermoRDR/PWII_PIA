const form = document.getElementById('formRegistroComercio');
const mensaje = document.getElementById('mensajeRegistroComercio');
const boton = document.getElementById('ragbot');

const inputImagen = document.getElementById('imagen');
const previewImagen = document.getElementById('preview-imagen');
const placeholder = document.getElementById('placeholder-imagen');

let urlTemporal = null;

inputImagen.addEventListener('change', () => {
  const archivo = inputImagen.files[0];

  if (urlTemporal) {
    URL.revokeObjectURL(urlTemporal);
    urlTemporal = null;
  }

  if (!archivo) {
    previewImagen.hidden = true;
    placeholder.hidden = false;
    return;
  }

  const permitidos = ['image/jpeg', 'image/png', 'image/webp'];

  if (!permitidos.includes(archivo.type) || archivo.size > 5 * 1024 * 1024) {
    mensaje.textContent = 'La imagen debe ser JPG, PNG o WebP y pesar máximo 5 MB.';
    inputImagen.value = '';
    previewImagen.hidden = true;
    placeholder.hidden = false;
    return;
  }

  urlTemporal = URL.createObjectURL(archivo);
  previewImagen.src = urlTemporal;
  previewImagen.hidden = false;
  placeholder.hidden = true;
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const dias = [
    ...document.querySelectorAll('.dias input[type="checkbox"]:checked')
  ].map(input => input.value);

  if (dias.length === 0) {
    mensaje.textContent = 'Selecciona al menos un día de funcionamiento.';
    return;
  }

  const apertura = document.getElementById('apertura').value;
  const cierre = document.getElementById('cierre').value;

  if (!apertura || !cierre || apertura >= cierre) {
    mensaje.textContent = 'El horario de cierre debe ser posterior al de apertura.';
    return;
  }

  const horario = dias.map(dia => ({
    dia,
    apertura,
    cierre
  }));

  const categorias = document.getElementById('categorias')
    .value
    .split(',')
    .map(categoria => categoria.trim())
    .filter(Boolean);

  const datos = new FormData(form);

  datos.set('categorias', JSON.stringify(categorias));
  datos.set('horario', JSON.stringify(horario));

  if (!inputImagen.files.length) {
    datos.delete('imagenComercio');
  }

  boton.disabled = true;
  mensaje.textContent = 'Registrando comercio...';

  try {
    const respuesta = await fetch('/api/comercios', {
      method: 'POST',
      credentials: 'same-origin',
      body: datos
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.error || 'No se pudo registrar el comercio.');
    }

    mensaje.textContent =
      `Comercio registrado correctamente. Código: ${resultado.comercio.codigoComercio}`;

    form.reset();

    if (urlTemporal) {
      URL.revokeObjectURL(urlTemporal);
      urlTemporal = null;
    }

    previewImagen.hidden = true;
    placeholder.hidden = false;

  } catch (error) {
    mensaje.textContent = error.message;
  } finally {
    boton.disabled = false;
  }
});
const form = document.getElementById('formRegistroSuscripcion');
const mensaje = document.getElementById('mensajeRegistroSuscripcion');
const boton = document.getElementById('regsus');

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


  const datos = new FormData(form);


  if (!inputImagen.files.length) {
    datos.delete('imagenSuscripcion');
  }

  boton.disabled = true;
  mensaje.textContent = 'Registrando suscripción...';

  try {
    const respuesta = await fetch('/api/suscripciones', {
      method: 'POST',
      credentials: 'same-origin',
      body: datos
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.error || 'No se pudo registrar la suscripción.');
    }

    mensaje.textContent =
      `Suscripción registrada correctamente.`;

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
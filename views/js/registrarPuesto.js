const $ = id => document.getElementById(id);

const dias = [
  ['lu', 'Lunes'],
  ['ma', 'Martes'],
  ['mi', 'Miércoles'],
  ['ju', 'Jueves'],
  ['vi', 'Viernes'],
  ['sa', 'Sábado'],
  ['do', 'Domingo']
];

let codigoValidado = null;
async function validarCodigoInicial() {
  const codigo = new URLSearchParams(location.search).get('codigo');
  if (!codigo) { location.replace('/validarcomercio.html'); return; }
  try {
    const respuesta = await fetch('/api/comercios/codigo/' + encodeURIComponent(codigo));
    const mercado = await respuesta.json();
    if (!respuesta.ok) throw new Error(mercado.error || 'Código inválido');
    codigoValidado = mercado.codigoComercio;
    $('mercado-asociado').textContent = 'Mercado: ' + mercado.nombreComercio;
    $('direccion-asociada').textContent = mercado.direccion;
    $('ragbot').disabled = false;
  } catch (error) {
    $('mercado-asociado').textContent = error.message;
    $('mensaje-registro').textContent = 'Regresa y valida otro código de mercado.';
  }
}
validarCodigoInicial();
$('ragbot').addEventListener('click', async () => {
  if (!codigoValidado) return;
  const boton = $('ragbot');
  const mensaje = $('mensaje-registro');

  const nombrePuesto = $('nombre').value.trim();
  const categoria = $('categorias').value;
  const descripcionPuesto = $('descripcion').value.trim();
  const apertura = $('apertura').value;
  const cierre = $('cierre').value;
  const imagen = $('imagen').files[0];

  const diasSeleccionados = dias
    .filter(([id]) => $(id).checked)
    .map(([, dia]) => dia);

  mensaje.textContent = '';

  if (!nombrePuesto || !categoria) {
    mensaje.textContent = 'Completa el nombre y la categoría.';
    return;
  }

  if (!diasSeleccionados.length) {
    mensaje.textContent = 'Selecciona al menos un día.';
    return;
  }

  if (!apertura || !cierre || apertura >= cierre) {
    mensaje.textContent = 'Selecciona un horario válido.';
    return;
  }

  const horario = diasSeleccionados.map(dia => ({
    dia,
    apertura,
    cierre
  }));

  const datos = new FormData();

  datos.append('codigoComercio', codigoValidado);
  datos.append('nombrePuesto', nombrePuesto);
  datos.append('categoria', categoria);
  datos.append('descripcionPuesto', descripcionPuesto);
  datos.append('horario', JSON.stringify(horario));
  datos.append('palabrasClave', JSON.stringify([]));

  if (imagen) {
    datos.append('imagenPuesto', imagen);
  }

  boton.disabled = true;
  mensaje.textContent = 'Registrando puesto...';

  try {
    const respuesta = await fetch('/api/puestos', {
      method: 'POST',
      credentials: 'same-origin',
      body: datos
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
        resultado.error || 'No se pudo registrar el puesto.'
      );
    }

    mensaje.textContent = 'Puesto registrado correctamente.';

    window.location.href = '/mispuestos.html';

  } catch (error) {
    mensaje.textContent = error.message;
  } finally {
    boton.disabled = false;
  }
});
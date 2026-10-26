const $ = id => document.getElementById(id);
let mercado = null;
$('form-codigo').addEventListener('submit', async e => { 
  e.preventDefault(); 
  mercado = null; 
  $('resultado').hidden = true; 
  $('mensaje').textContent = 'Validando...'; 
  const codigo = $('codigo').value.trim().toUpperCase(); 

  try { const r = await fetch('/api/comercios/codigo/' + encodeURIComponent(codigo)); 
    const d = await r.json(); 
    if (!r.ok) throw new Error(d.error || 'No se pudo validar el código.'); 
    mercado = d; $('nombre-mercado').textContent = d.nombreComercio; 
    $('direccion-mercado').textContent = d.direccion; 
    $('resultado').hidden = false; 
    $('mensaje').textContent = 'Mercado encontrado.'; 
  } catch (err) { 
    $('mensaje').textContent = err.message; 
  } 
}); 
$('continuar').addEventListener('click', () => { 
  if (mercado) location.href = '/regpues.html?codigo=' + encodeURIComponent(mercado.codigoComercio); 
});
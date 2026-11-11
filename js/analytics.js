/* Google Tag Manager de Estudio CAVLA (la medición de Google Analytics se configura adentro de Tag Manager).
   Además de las visitas, avisa cada clic en botones y el envío del formulario como eventos del dataLayer. */
(function () {
  var GTM_ID = 'GTM-TMKMT2W4';

  window.dataLayer = window.dataLayer || [];
  window.cavlaTrack = function (nombre, datos) {
    try { var o = { event: nombre }; for (var k in (datos || {})) o[k] = datos[k]; window.dataLayer.push(o); } catch (e) {}
  };
  if (!GTM_ID) return;

  window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
  var s = document.createElement('script');
  s.async = true; s.src = 'https://www.googletagmanager.com/gtm.js?id=' + GTM_ID;
  document.head.appendChild(s);

  // Clics en botones que llevan a contactar o a avanzar en el proceso
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var esBoton = a.matches('.btn-cta-servicio, .btn-cta-pagina, .cavla-nav__cta, .btn-whatsapp, .btn-guia, .btn-derivacion');
    var tipo = /^mailto:/.test(href) ? 'mail' : /wa\.me|whatsapp/.test(href) ? 'whatsapp' : /instagram|youtube|facebook/.test(href) ? 'red_social' : esBoton ? 'boton' : '';
    if (!tipo) return;
    window.cavlaTrack('clic_' + tipo, { texto: (a.textContent || '').trim().slice(0, 60), destino: href.slice(0, 100), pagina: location.pathname });
  }, true);
})();

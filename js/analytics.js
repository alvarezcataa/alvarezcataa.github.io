/* Google Analytics 4 de Estudio CAVLA.
   Para activarlo, pegá entre las comillas el ID de medición (empieza con G-). Mientras esté vacío no se carga nada. */
(function () {
  var GA_ID = '';

  window.cavlaTrack = function (nombre, datos) { try { if (window.gtag) window.gtag('event', nombre, datos || {}); } catch (e) {} };
  if (!GA_ID) return;

  var s = document.createElement('script');
  s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { anonymize_ip: true });

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

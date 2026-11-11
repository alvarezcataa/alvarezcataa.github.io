/* Google Analytics 4 de Estudio CAVLA (ID de medición G-1960BDVZC4).
   Además de las visitas, registra los clics en botones y el envío del formulario. */
(function () {
  var GA_ID = 'G-1960BDVZC4';

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.cavlaTrack = function (nombre, datos) { try { window.gtag('event', nombre, datos || {}); } catch (e) {} };

  var s = document.createElement('script');
  s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { anonymize_ip: true });

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

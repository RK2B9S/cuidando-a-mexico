/* Cuidando a México, A.C. — comportamiento de la página.
   Todo el contenido está en el HTML; este archivo solo añade estados (clases) y el carrusel.
   Sin dependencias. Respeta prefers-reduced-motion (las transiciones las apaga el CSS; aquí se evita el scroll suave). */
(function () {
  'use strict';
  var reducir = window.matchMedia('(prefers-reduced-motion: reduce)');
  var conducta = function () { return reducir.matches ? 'auto' : 'smooth'; };
  var tieneIO = 'IntersectionObserver' in window;

  /* A3. Mapa: relleno escalonado de los estados al entrar en pantalla */
  var mapa = document.querySelector('.mapa');
  if (mapa) {
    if (tieneIO) {
      new IntersectionObserver(function (entradas, obs) {
        entradas.forEach(function (e) {
          if (e.isIntersecting) { mapa.classList.add('visto'); obs.disconnect(); }
        });
      }, { threshold: 0.4 }).observe(mapa);
    } else {
      mapa.classList.add('visto');
    }
  }

  /* A5. E → P una sola vez al entrar la sección */
  var cambio = document.querySelector('.cambio');
  if (cambio) {
    if (tieneIO) {
      new IntersectionObserver(function (entradas, obs) {
        entradas.forEach(function (e) {
          if (e.isIntersecting) { cambio.classList.add('visto'); obs.disconnect(); }
        });
      }, { threshold: 0.5 }).observe(cambio);
    } else {
      cambio.classList.add('visto');
    }
  }

  /* A4. Línea de tiempo: el año fijo cambia cuando un hecho cruza el centro de la ventana */
  var anio = document.querySelector('.tiempo-anio');
  var hechos = document.querySelectorAll('.hecho');
  if (anio && hechos.length) {
    var capaA = anio.querySelector('.tiempo-anio-a');
    var capaB = anio.querySelector('.tiempo-anio-b');
    var mostrando = capaA;
    var actual = capaA.textContent;
    var fijar = function (texto) {
      if (texto === actual) { return; }
      var oculta = (mostrando === capaA) ? capaB : capaA;
      oculta.textContent = texto;
      anio.classList.toggle('cambia', oculta === capaB);
      mostrando = oculta;
      actual = texto;
    };
    var pedido = false;
    var revisar = function () {
      pedido = false;
      var centro = window.innerHeight / 2;
      var elegido = null;
      var menor = Infinity;
      for (var i = 0; i < hechos.length; i++) {
        var r = hechos[i].getBoundingClientRect();
        var d = (r.top <= centro && r.bottom >= centro) ? 0 : Math.min(Math.abs(r.top - centro), Math.abs(r.bottom - centro));
        if (d < menor) { menor = d; elegido = hechos[i]; }
      }
      if (!elegido) { return; }
      for (var j = 0; j < hechos.length; j++) { hechos[j].classList.toggle('activo', hechos[j] === elegido); }
      fijar(elegido.getAttribute('data-anio'));
    };
    var alDesplazar = function () {
      if (pedido) { return; }
      pedido = true;
      window.requestAnimationFrame(revisar);
    };
    window.addEventListener('scroll', alDesplazar, { passive: true });
    window.addEventListener('resize', alDesplazar);
    revisar();
  }

  /* A6 y A7. Carrusel "Mito y dato": botón "Ver el dato" y botones anterior/siguiente */
  var carrusel = document.querySelector('.carrusel');
  if (carrusel) {
    var pista = carrusel.querySelector('.pista');
    var piezas = Array.prototype.slice.call(carrusel.querySelectorAll('.pieza'));
    var controles = carrusel.querySelector('.carrusel-controles');
    var btnAnt = carrusel.querySelector('.carrusel-ant');
    var btnSig = carrusel.querySelector('.carrusel-sig');
    var indicador = carrusel.querySelector('.carrusel-indicador');

    /* Ver el dato: al cargar con JavaScript, el dato se oculta y el botón aparece */
    piezas.forEach(function (pieza) {
      var boton = pieza.querySelector('.ver-dato');
      var dato = pieza.querySelector('.dato');
      if (!boton || !dato) { return; }
      dato.hidden = true;
      boton.hidden = false;
      boton.setAttribute('aria-expanded', 'false');
      boton.addEventListener('click', function () {
        var abierto = boton.getAttribute('aria-expanded') === 'true';
        if (abierto) {
          dato.hidden = true;
          boton.setAttribute('aria-expanded', 'false');
          boton.textContent = 'Ver el dato';
        } else {
          dato.hidden = false;
          dato.style.opacity = '0';
          requestAnimationFrame(function () { dato.style.opacity = '1'; });
          boton.setAttribute('aria-expanded', 'true');
          boton.textContent = 'Ocultar el dato';
        }
      });
    });

    /* Anterior / siguiente e indicador */
    var indice = 0;
    var pintar = function () {
      indicador.textContent = 'Pieza ' + (indice + 1) + ' de ' + piezas.length;
      btnAnt.disabled = indice === 0;
      btnSig.disabled = indice === piezas.length - 1;
    };
    var irA = function (n) {
      indice = Math.max(0, Math.min(piezas.length - 1, n));
      var izquierda = piezas[indice].offsetLeft - piezas[0].offsetLeft;
      if (pista.scrollTo) { pista.scrollTo({ left: izquierda, behavior: conducta() }); }
      else { pista.scrollLeft = izquierda; }
      pintar();
    };
    var actualizar = function () {
      var izq = pista.getBoundingClientRect().left;
      var mejor = 0, dist = Infinity;
      piezas.forEach(function (p, i) {
        var d = Math.abs(p.getBoundingClientRect().left - izq);
        if (d < dist) { dist = d; mejor = i; }
      });
      indice = mejor;
      pintar();
    };
    if (pista && controles && btnAnt && btnSig && indicador) {
      controles.hidden = false;
      btnAnt.addEventListener('click', function () { irA(indice - 1); });
      btnSig.addEventListener('click', function () { irA(indice + 1); });
      var espera;
      pista.addEventListener('scroll', function () {
        clearTimeout(espera);
        espera = setTimeout(actualizar, 80);
      }, { passive: true });
      pista.addEventListener('keydown', function (ev) {
        if (ev.key === 'ArrowRight') { ev.preventDefault(); irA(indice + 1); }
        if (ev.key === 'ArrowLeft') { ev.preventDefault(); irA(indice - 1); }
      });
      pista.setAttribute('tabindex', '0');
      actualizar();
    }
  }

  /* Botón de tema: claro (hueso) u oscuro. Guarda la elección; sin elección, manda el sistema. */
  var botonTema = document.querySelector('.tema');
  if (botonTema) {
    var raiz = document.documentElement;
    var sistemaOscuro = window.matchMedia('(prefers-color-scheme: dark)');
    var etiqueta = botonTema.querySelector('.tema-etiqueta');
    var icono = botonTema.querySelector('.tema-icono');
    var esOscuro = function () {
      var fijado = raiz.getAttribute('data-theme');
      if (fijado === 'dark') { return true; }
      if (fijado === 'light') { return false; }
      return sistemaOscuro.matches;
    };
    var pintarBoton = function () {
      var oscuro = esOscuro();
      etiqueta.textContent = oscuro ? 'Modo claro' : 'Modo oscuro';
      icono.textContent = oscuro ? '○' : '●';
      botonTema.setAttribute('aria-label', oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    };
    botonTema.hidden = false;
    pintarBoton();
    botonTema.addEventListener('click', function () {
      var aOscuro = !esOscuro();
      raiz.setAttribute('data-theme', aOscuro ? 'dark' : 'light');
      try { localStorage.setItem('tema', aOscuro ? 'oscuro' : 'claro'); } catch (e) {}
      pintarBoton();
    });
    if (sistemaOscuro.addEventListener) {
      sistemaOscuro.addEventListener('change', function () {
        if (!raiz.getAttribute('data-theme')) { pintarBoton(); }
      });
    }
  }

  /* A9. Anclas del índice: cerrar el índice desplegable en móvil al elegir */
  var indiceDet = document.querySelector('.indice');
  if (indiceDet) {
    indiceDet.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { indiceDet.removeAttribute('open'); });
    });
  }
})();

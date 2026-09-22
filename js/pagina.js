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

  /* En pantallas grandes, "Quién la atiende" se muestra abierto; en móvil se abre con un toque. */
  var anchas = window.matchMedia('(min-width: 900px) and (min-height: 800px)');
  var abrirQuien = function () {
    var bloques = document.querySelectorAll('.razon-quien');
    for (var i = 0; i < bloques.length; i++) {
      if (anchas.matches) { bloques[i].setAttribute('open', ''); }
      else { bloques[i].removeAttribute('open'); }
    }
  };
  abrirQuien();
  if (anchas.addEventListener) { anchas.addEventListener('change', abrirQuien); }

  /* Tres razones: la cabecera se queda fija y las razones pasan de una en una.
     No se toca la posición del scroll: el lector manda; solo se marca cuál está en turno. */
  var escena = document.querySelector('.razones-escena');
  if (escena) {
    var cabeza = escena.querySelector('.razones-cabeza');
    var razones = Array.prototype.slice.call(escena.querySelectorAll('.razon'));
    var paso = escena.querySelector('.razones-paso');
    var medirCabeza = function () {
      document.documentElement.style.setProperty('--cabeza-alto', Math.round(cabeza.getBoundingClientRect().height) + 'px');
    };
    razones.forEach(function (r) { r.classList.add('espera'); });
    var enTurno = -1;
    var compacta = false;
    var marcarRazon = function () {
      var primera = razones[0].getBoundingClientRect();
      var debeCompactar = primera.top <= cabeza.getBoundingClientRect().bottom + 120;
      if (debeCompactar !== compacta) {
        compacta = debeCompactar;
        cabeza.classList.toggle('compacta', compacta);
        medirCabeza();
      }
      var corte = cabeza.getBoundingClientRect().bottom + 40;
      var cual = -1;
      for (var i = 0; i < razones.length; i++) {
        if (razones[i].getBoundingClientRect().top <= corte) { cual = i; }
      }
      for (var k = 0; k <= cual; k++) { razones[k].classList.remove('espera'); }
      for (var m = cual + 1; m < razones.length; m++) { razones[m].classList.add('espera'); }
      if (cual !== enTurno) {
        enTurno = cual;
        if (paso) {
          if (cual >= 0) { paso.hidden = false; paso.textContent = '· ' + (cual + 1) + ' de ' + razones.length; }
          else { paso.hidden = true; }
        }
      }
    };
    var esperaEscena = false;
    var alMover = function () {
      if (esperaEscena) { return; }
      esperaEscena = true;
      window.requestAnimationFrame(function () { esperaEscena = false; marcarRazon(); });
    };
    window.addEventListener('scroll', alMover, { passive: true });
    window.addEventListener('resize', function () { medirCabeza(); alMover(); });
    /* Red de seguridad: ninguna razón puede quedarse invisible si algo falla con el scroll. */
    if (tieneIO) {
      var obsRazones = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) { if (e.isIntersecting) { e.target.classList.remove('espera'); } });
      }, { threshold: 0.12 });
      razones.forEach(function (r) { obsRazones.observe(r); });
    } else {
      razones.forEach(function (r) { r.classList.remove('espera'); });
    }
    /* El ajuste por pasos se enciende al entrar la sección y se apaga al salir: fuera de aquí el scroll es libre. */
    if (tieneIO && !reducir.matches) {
      new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
          document.documentElement.classList.toggle('escena-activa', e.isIntersecting);
        });
      }, { rootMargin: '0px 0px -45% 0px', threshold: 0 }).observe(escena);
      if (reducir.addEventListener) {
        reducir.addEventListener('change', function () {
          if (reducir.matches) { document.documentElement.classList.remove('escena-activa'); }
        });
      }
    }
    medirCabeza();
    marcarRazon();
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

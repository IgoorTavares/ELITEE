/* =========================================================
   Elite Sênior Home Care — interações do site
   Sem dependências externas.
   ========================================================= */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, ctx) { return (ctx || document).querySelector(s); };
  var $$ = function (s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); };

  /* ---------- ano no rodapé ---------- */
  var year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  /* =========================================================
     Pré-carregamento
     ========================================================= */
  var preloader = $("#preloader");
  if (preloader) {
    var hidePreloader = function () {
      preloader.classList.add("is-hidden");
    };
    var minTimer = setTimeout(hidePreloader, 900);
    window.addEventListener("load", function () {
      clearTimeout(minTimer);
      setTimeout(hidePreloader, 250);
    });
  }

  /* =========================================================
     Barra de ferramentas: encolher, progresso e menu mobile
     ========================================================= */
  var topbar = $("#topbar");
  var progress = $("#progress");
  var burger = $("#burger");
  var nav = $("#nav");
  var navClose = $("#navClose");

  var heroEl = $(".hero");
  var heroSlideEls = $$(".hero__slide");

  function onScroll() {
    var y = window.scrollY;
    topbar.classList.toggle("is-stuck", y > 40);

    var max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";

    if (!reduced && heroEl && heroSlideEls.length) {
      var heroH = heroEl.offsetHeight;
      if (y < heroH) {
        var shift = Math.min(70, Math.round(y * 0.12));
        for (var i = 0; i < heroSlideEls.length; i++) {
          heroSlideEls[i].style.transform = "translateY(" + shift + "px) scale(1.18)";
        }
      }
    }

    drawCareLine(y);
  }

  var closeNav = function () {
    nav.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Abrir menu");
  };

  burger.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  });

  if (navClose) {
    navClose.addEventListener("click", function () {
      closeNav();
      burger.focus();
    });
  }

  // fecha o menu ao escolher um destino
  $$("#nav a").forEach(function (a) {
    a.addEventListener("click", closeNav);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("is-open")) {
      closeNav();
      burger.focus();
    }
  });

  /* =========================================================
     Linha do cuidado — o fio dourado se desenha conforme o scroll
     ========================================================= */
  var careSvg = $(".care-line");
  var carePath = $("#careLinePath");
  var careLen = 0;

  function sizeCareLine() {
    if (!careSvg) return;
    var footer = document.querySelector(".footer");
    var end;
    if (footer) {
      end = footer.getBoundingClientRect().top + window.scrollY;
    } else {
      var vh = window.innerHeight || document.documentElement.clientHeight || 0;
      if (!vh) return;
      end = document.body.getBoundingClientRect().height;
    }
    var start = careSvg.getBoundingClientRect().top + window.scrollY;
    var h = end - start;
    careSvg.style.height = Math.max(0, h) + "px";
  }
  sizeCareLine();
  window.addEventListener("resize", sizeCareLine);
  window.addEventListener("load", sizeCareLine);

  if (carePath) {
    careLen = carePath.getTotalLength();
    carePath.style.setProperty("--len", careLen);
    carePath.style.strokeDasharray = careLen;
    carePath.style.strokeDashoffset = reduced ? 0 : careLen;
  }

  function drawCareLine(y) {
    if (!carePath || reduced || !careSvg) return;
    var rect = careSvg.getBoundingClientRect();
    if (rect.height === 0) return;
    var start = y + rect.top - window.innerHeight * 0.85;
    var span = rect.height;
    var p = Math.min(1, Math.max(0, (y - start + window.innerHeight * 0.1) / span));
    carePath.style.strokeDashoffset = careLen * (1 - p);
  }

  /* =========================================================
     Revelação de blocos ao entrar na tela
     ========================================================= */
  var revealables = $$(".reveal");
  if (reduced || !("IntersectionObserver" in window)) {
    revealables.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var group = en.target.parentElement ? $$(".reveal", en.target.parentElement) : [];
        var i = Math.max(0, group.indexOf(en.target));
        en.target.style.transitionDelay = Math.min(i * 70, 280) + "ms";
        en.target.classList.add("is-in");
        io.unobserve(en.target);
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
    revealables.forEach(function (el) { io.observe(el); });
  }

  /* =========================================================
     Números do herói
     ========================================================= */
  var counters = $$("[data-count]");
  function runCounter(el) {
    var target = parseInt(el.dataset.count, 10);
    var suffix = el.dataset.suffix || "";
    if (reduced) { el.textContent = target + suffix; return; }
    var t0 = performance.now(), dur = 1400;
    (function step(t) {
      var p = Math.min(1, (t - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
  if ("IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { runCounter(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { cio.observe(c); });
  } else {
    counters.forEach(runCounter);
  }

  /* =========================================================
     Link ativo na navegação
     ========================================================= */
  var sections = $$("main section[id]");
  var navLinks = {};
  $$("#nav a[href^='#'], #topbarLinks a[href^='#']").forEach(function (a) {
    var key = a.getAttribute("href").slice(1);
    (navLinks[key] = navLinks[key] || []).push(a);
  });

  if ("IntersectionObserver" in window) {
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var links = navLinks[en.target.id];
        if (!links) return;
        if (en.isIntersecting) {
          Object.keys(navLinks).forEach(function (k) {
            navLinks[k].forEach(function (l) { l.classList.remove("is-current"); });
          });
          links.forEach(function (l) { l.classList.add("is-current"); });
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { sio.observe(s); });
  }

  /* =========================================================
     Depoimentos
     ========================================================= */
  var quotes = $$("#quotes .quote");
  if (quotes.length) {
    var dotsBox = $("#qDots");
    var idx = 0, timer = null;

    quotes.forEach(function (_, i) {
      var d = document.createElement("button");
      d.type = "button";
      d.setAttribute("aria-label", "Depoimento " + (i + 1));
      if (i === 0) d.classList.add("is-active");
      d.addEventListener("click", function () { show(i); restart(); });
      dotsBox.appendChild(d);
    });
    var dots = $$("button", dotsBox);

    var show = function (n) {
      idx = (n + quotes.length) % quotes.length;
      quotes.forEach(function (q, i) { q.classList.toggle("is-active", i === idx); });
      dots.forEach(function (d, i) { d.classList.toggle("is-active", i === idx); });
    };
    var restart = function () {
      if (reduced) return;
      clearInterval(timer);
      timer = setInterval(function () { show(idx + 1); }, 7000);
    };

    $("#qNext").addEventListener("click", function () { show(idx + 1); restart(); });
    $("#qPrev").addEventListener("click", function () { show(idx - 1); restart(); });

    var box = $("#quotes");
    box.addEventListener("mouseenter", function () { clearInterval(timer); });
    box.addEventListener("mouseleave", restart);
    restart();
  }

  /* =========================================================
     FAQ — acordeão
     ========================================================= */
  $$(".acc__q").forEach(function (q) {
    var panel = q.nextElementSibling;
    q.addEventListener("click", function () {
      var open = q.getAttribute("aria-expanded") === "true";

      $$(".acc__q").forEach(function (other) {
        if (other === q) return;
        other.setAttribute("aria-expanded", "false");
        other.nextElementSibling.style.height = "0px";
      });

      q.setAttribute("aria-expanded", String(!open));
      panel.style.height = open ? "0px" : panel.scrollHeight + "px";
    });
  });

  window.addEventListener("resize", function () {
    $$(".acc__q[aria-expanded='true']").forEach(function (q) {
      q.nextElementSibling.style.height = q.nextElementSibling.scrollHeight + "px";
    });
  });

  /* =========================================================
     Dicas de saúde — artigos expansíveis
     ========================================================= */
  $$(".post__toggle").forEach(function (btn) {
    var body = btn.closest(".post__body");
    var panel = body ? body.querySelector(".post__full") : null;
    if (!panel) return;

    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      btn.textContent = open ? "Ler artigo completo" : "Fechar artigo";
      panel.style.height = open ? "0px" : panel.scrollHeight + "px";
      if (open) {
        btn.closest(".post").scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
      }
    });
  });

  window.addEventListener("resize", function () {
    $$(".post__toggle[aria-expanded='true']").forEach(function (btn) {
      var body = btn.closest(".post__body");
      var panel = body ? body.querySelector(".post__full") : null;
      if (panel) panel.style.height = panel.scrollHeight + "px";
    });
  });

  /* =========================================================
     Formulário
     ========================================================= */
  var form = $("#form");
  if (form) {
    var tel = $("#tel");

    tel.addEventListener("input", function () {
      var v = tel.value.replace(/\D/g, "").slice(0, 11);
      if (v.length > 6) v = "(" + v.slice(0, 2) + ") " + v.slice(2, v.length - 4) + "-" + v.slice(-4);
      else if (v.length > 2) v = "(" + v.slice(0, 2) + ") " + v.slice(2);
      else if (v.length) v = "(" + v;
      tel.value = v;
    });

    var setError = function (id, message) {
      var field = $("#" + id);
      var slot = $(".err[data-for='" + id + "']");
      if (slot) slot.textContent = message || "";
      if (field) field.classList.toggle("is-invalid", Boolean(message));
      return !message;
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;

      ok = setError("nome", $("#nome").value.trim().length < 3 ? "Escreva seu nome completo." : "") && ok;
      ok = setError("tel", $("#tel").value.replace(/\D/g, "").length < 10 ? "Informe um telefone com DDD." : "") && ok;
      ok = setError("email", /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test($("#email").value) ? "" : "Confira o e-mail digitado.") && ok;
      ok = setError("servico", $("#servico").value ? "" : "Escolha o tipo de atendimento.") && ok;
      ok = setError("lgpd", $("#lgpd").checked ? "" : "Precisamos da sua autorização para entrar em contato.") && ok;

      if (!ok) {
        var first = $(".is-invalid") || $("#lgpd");
        if (first) first.focus();
        return;
      }

      // Monta a solicitação e abre o WhatsApp com os dados preenchidos.
      // Assim a família não depende de um servidor de e-mail configurado à parte:
      // a mensagem chega direto no WhatsApp da Elite Sênior.
      var nome = $("#nome").value.trim();
      var telValue = $("#tel").value.trim();
      var emailValue = $("#email").value.trim();
      var servicoValue = $("#servico").value;
      var msgValue = $("#msg").value.trim();

      var lines = [
        "Olá! Gostaria de solicitar uma avaliação gratuita.",
        "",
        "Nome: " + nome,
        "Telefone: " + telValue,
        "E-mail: " + emailValue,
        "Tipo de atendimento: " + servicoValue
      ];
      if (msgValue) lines.push("Situação: " + msgValue);

      var waText = encodeURIComponent(lines.join("\n"));
      var waUrl = "https://wa.me/5511965127141?text=" + waText;

      $("#formOk").hidden = false;
      var waLink = $("#formOkLink");
      if (waLink) waLink.href = waUrl;
      form.reset();
      $("#formOk").scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });

      window.open(waUrl, "_blank", "noopener");
    });
  }

  /* =========================================================
     Carrossel do herói
     ========================================================= */
  var heroSlides = $$("#heroCarousel .hero__slide");
  if (heroSlides.length) {
    var heroDotsBox = $("#heroDots");
    var heroIdx = 0;

    heroSlides.forEach(function (_, i) {
      var d = document.createElement("button");
      d.type = "button";
      d.setAttribute("aria-label", "Imagem " + (i + 1));
      if (i === 0) d.classList.add("is-active");
      d.addEventListener("click", function () { showHero(i); restartHero(); });
      heroDotsBox.appendChild(d);
    });
    var heroDots = $$("button", heroDotsBox);

    var showHero = function (n) {
      heroIdx = (n + heroSlides.length) % heroSlides.length;
      heroSlides.forEach(function (s, i) { s.classList.toggle("is-active", i === heroIdx); });
      heroDots.forEach(function (d, i) { d.classList.toggle("is-active", i === heroIdx); });
    };
    var heroTimer = null;
    var restartHero = function () {
      if (reduced) return;
      clearInterval(heroTimer);
      heroTimer = setInterval(function () { showHero(heroIdx + 1); }, 5500);
    };
    restartHero();
  }

  /* ---------- listeners de scroll ---------- */
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { onScroll(); ticking = false; });
  }, { passive: true });

  onScroll();
})();

/* Villa Bond — interactions & analytics events */
(function () {
  "use strict";

  /* ---------- Analytics helper (Meta Pixel + GA4, no-op если не подключены) ---------- */
  function track(name, params) {
    try {
      if (typeof fbq === "function") fbq("trackCustom", name, params || {});
      if (typeof gtag === "function") gtag("event", name, params || {});
    } catch (e) { /* noop */ }
  }
  window.vbTrack = track;

  /* Стандартное событие Contact для Meta при клике в WhatsApp */
  function trackWa(placement) {
    try { if (typeof fbq === "function") fbq("track", "Contact"); } catch (e) {}
    track("wa_click", { placement: placement });
  }

  document.querySelectorAll("[data-wa]").forEach(function (el) {
    el.addEventListener("click", function () { trackWa(el.getAttribute("data-wa")); });
  });
  document.querySelectorAll("[data-tg]").forEach(function (el) {
    el.addEventListener("click", function () {
      try { if (typeof fbq === "function") fbq("track", "Contact"); } catch (e) {}
      track("tg_click", { placement: el.getAttribute("data-tg") });
    });
  });

  /* ---------- Header on scroll + progress bar ---------- */
  var header = document.querySelector(".header");
  var stickyWa = document.querySelector(".sticky-wa");
  var hero = document.querySelector(".hero");
  var progress = document.querySelector(".scroll-progress");
  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle("scrolled", y > 40);
    if (stickyWa && hero) stickyWa.classList.toggle("visible", y > hero.offsetHeight * 0.7);
    if (progress) {
      var docH = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (docH > 0 ? (y / docH) * 100 : 0) + "%";
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var navToggle = document.querySelector(".nav-toggle");
  var mobileMenu = document.querySelector(".mobile-menu");
  if (navToggle && mobileMenu) {
    var menuIsEn = (document.documentElement.lang || "ru").slice(0, 2) === "en";
    var lblOpen = menuIsEn ? "Close menu" : "Закрыть меню";
    var lblClosed = menuIsEn ? "Menu" : "Меню";
    function closeMenu(returnFocus) {
      document.body.classList.remove("menu-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", lblClosed);
      if (returnFocus) navToggle.focus();
    }
    navToggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("menu-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute("aria-label", open ? lblOpen : lblClosed);
      if (open) { var first = mobileMenu.querySelector("a"); if (first) first.focus(); }
    });
    mobileMenu.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { closeMenu(false); }); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("menu-open")) closeMenu(true);
    });
  }

  /* ---------- Active section in nav ---------- */
  var navLinkEls = Array.prototype.slice.call(document.querySelectorAll(".nav-links a[href^='#']"));
  if (navLinkEls.length) {
    var navMap = {};
    navLinkEls.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      if (id) navMap[id] = a;
    });
    var secObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          navLinkEls.forEach(function (a) { a.classList.remove("active"); });
          var link = navMap[en.target.id];
          if (link) link.classList.add("active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(navMap).forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) secObserver.observe(sec);
    });
  }

  /* ---------- Count-up numbers (facts grid) ---------- */
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isEnPage = (document.documentElement.lang || "ru").slice(0, 2) === "en";
  function fmtNum(n, dec) {
    var s = n.toFixed(dec);
    return isEnPage ? s : s.replace(".", ",");
  }
  var countEls = Array.prototype.slice.call(document.querySelectorAll(".cv[data-count]"));
  if (countEls.length) {
    if (reducedMotion) {
      countEls.forEach(function (el) { el.textContent = fmtNum(parseFloat(el.getAttribute("data-count")), +(el.getAttribute("data-dec") || 0)); });
    } else {
      var cObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var el = en.target;
          cObserver.unobserve(el);
          var target = parseFloat(el.getAttribute("data-count"));
          var dec = +(el.getAttribute("data-dec") || 0);
          var dur = 1100, t0 = null;
          function step(ts) {
            if (t0 === null) t0 = ts;
            var p = Math.min((ts - t0) / dur, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = fmtNum(target * eased, dec);
            if (p < 1) requestAnimationFrame(step);
            else el.textContent = fmtNum(target, dec);
          }
          requestAnimationFrame(step);
        });
      }, { threshold: 0.5 });
      countEls.forEach(function (el) { cObserver.observe(el); });
    }
  }

  /* ---------- Hero video: постер = LCP, видео тянем только когда можно ----------
     В разметке video без autoplay и с preload="none": постер закрывает кадр,
     трафик не тратится до решения ниже. На быстром соединении включаем загрузку и play. */
  var heroVideo = document.querySelector(".hero-media video");
  if (heroVideo) {
    var conn = navigator.connection || {};
    var slow = conn.saveData || /(^|-)2g$/.test(conn.effectiveType || "");
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!slow && !reduced) {
      heroVideo.preload = "auto";
      heroVideo.play().catch(function () {});
    }
  }

  /* ---------- Reveal on scroll ----------
     Элементы, уже видимые при загрузке (в т.ч. переход по якорю),
     показываем сразу без анимации; остальные — по мере скролла. */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach(function (el) {
    var r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) {
      el.style.transition = "none";
      el.classList.add("in");
    } else {
      io.observe(el);
    }
  });

  /* ---------- Scroll depth 75% ---------- */
  var depth75 = false;
  window.addEventListener("scroll", function () {
    if (depth75) return;
    var h = document.documentElement;
    if ((window.scrollY + window.innerHeight) / h.scrollHeight > 0.75) {
      depth75 = true;
      track("scroll_75");
    }
  }, { passive: true });

  /* ---------- Video tour: click-to-play (+ клавиатура) ---------- */
  var tour = document.querySelector(".tour-frame");
  if (tour) {
    tour.addEventListener("click", function () {
      if (tour.dataset.playing) return;
      tour.dataset.playing = "1";
      var src = tour.getAttribute("data-src");
      var v = document.createElement("video");
      v.src = src;
      v.controls = true;
      v.autoplay = true;
      v.playsInline = true;
      v.style.aspectRatio = "16 / 9";
      tour.innerHTML = "";
      tour.appendChild(v);
      tour.style.cursor = "default";
      tour.removeAttribute("role");
      tour.removeAttribute("tabindex");
      track("video_play", { video: "tour" });
    });
    tour.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tour.click(); }
    });
  }

  /* ---------- Investment calculator (аренда → окупаемость) ----------
     Модель: net = 54% от валового (расходы+управление ≈46%, из реального P&L).
     Окупаемость и доходность считаем на цену продажи (то, что платит покупатель). */
  var calc = document.querySelector(".calc");
  if (calc) {
    var PRICE = parseFloat(calc.getAttribute("data-price")) || 17000000; // THB
    var NET_RATIO = 0.54;
    var THB_USD = 33.3;
    var isEN = (document.documentElement.lang || "ru").slice(0, 2) === "en";

    var rRate = document.getElementById("calc-rate");
    var rOcc = document.getElementById("calc-occ");
    var outRate = document.getElementById("calc-rate-val");
    var outOcc = document.getElementById("calc-occ-val");
    var outGross = document.getElementById("calc-gross");
    var outNet = document.getElementById("calc-net");
    var outYield = document.getElementById("calc-yield");
    var outPayback = document.getElementById("calc-payback");

    function grp(n) {
      /* группировка тысяч тонкой шпацией */
      return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, isEN ? "," : " ");
    }
    function yearsWord(n) {
      if (isEN) return n === 1 ? "year" : "years";
      /* payback всегда дробное (toFixed(1)) → всегда родительный ед. ч. «года» */
      return "года";
    }
    function render() {
      var rate = +rRate.value;          // THB / ночь
      var occ = +rOcc.value;            // %
      var gross = rate * 365 * (occ / 100);
      var net = gross * NET_RATIO;
      var yld = (net / PRICE) * 100;
      var payback = net > 0 ? PRICE / net : 0;

      outRate.textContent = "฿" + grp(rate);
      outOcc.textContent = occ + "%";
      rRate.setAttribute("aria-valuetext", outRate.textContent);
      rOcc.setAttribute("aria-valuetext", outOcc.textContent);
      outGross.innerHTML = "฿" + grp(gross) + ' <span class="u">≈ $' + grp(gross / THB_USD) + "</span>";
      outNet.innerHTML = "฿" + grp(net) + ' <span class="u">≈ $' + grp(net / THB_USD) + "</span>";
      outYield.innerHTML = yld.toFixed(1).replace(".", isEN ? "." : ",") + '<span class="u">%</span>';
      var pb = payback.toFixed(1).replace(".", isEN ? "." : ",");
      outPayback.innerHTML = pb + ' <span class="u">' + yearsWord(payback) + "</span>";
    }
    rRate.addEventListener("input", render);
    rOcc.addEventListener("input", render);
    var calcTracked = false;
    function trackCalcOnce() { if (!calcTracked) { calcTracked = true; track("calc_used"); } }
    rRate.addEventListener("change", trackCalcOnce);
    rOcc.addEventListener("change", trackCalcOnce);
    render();
  }

  /* ---------- Story photo slider ---------- */
  document.querySelectorAll(".story-slider").forEach(function (sl) {
    var track = sl.querySelector(".slides");
    var imgs = sl.querySelectorAll(".slides img");
    var dots = sl.querySelectorAll(".s-dot");
    var prev = sl.querySelector(".s-arrow.prev");
    var next = sl.querySelector(".s-arrow.next");
    if (!track || imgs.length < 2) return;
    var i = 0;
    function go(n) {
      i = (n + imgs.length) % imgs.length;
      track.style.transform = "translateX(-" + i * 100 + "%)";
      dots.forEach(function (d, k) { d.classList.toggle("active", k === i); d.setAttribute("aria-current", k === i ? "true" : "false"); });
    }
    if (prev) prev.addEventListener("click", function () { go(i - 1); });
    if (next) next.addEventListener("click", function () { go(i + 1); });
    dots.forEach(function (d, k) { d.addEventListener("click", function () { go(k); }); });
    var tx = null;
    sl.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; }, { passive: true });
    sl.addEventListener("touchend", function (e) {
      if (tx === null) return;
      var dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 44) go(i + (dx < 0 ? 1 : -1));
      tx = null;
    }, { passive: true });
    go(0);
  });

  /* ---------- Gallery lightbox ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll(".gallery-grid a"));
  var lb = document.querySelector(".lightbox");
  if (lb && links.length) {
    var lbImg = lb.querySelector("img");
    var lbCount = lb.querySelector(".lb-count");
    var idx = 0;
    var opened = false;

    function show(i) {
      idx = (i + links.length) % links.length;
      lbImg.src = links[idx].getAttribute("href");
      lbImg.alt = links[idx].querySelector("img").alt;
      lbCount.textContent = (idx + 1) + " / " + links.length;
    }
    function open(i) {
      show(i);
      lb.classList.add("open");
      document.body.style.overflow = "hidden";
      if (!opened) { opened = true; track("gallery_open"); }
    }
    function close() {
      lb.classList.remove("open");
      document.body.style.overflow = "";
    }

    links.forEach(function (a, i) {
      a.addEventListener("click", function (e) { e.preventDefault(); open(i); });
    });
    lb.querySelector(".lb-close").addEventListener("click", close);
    lb.querySelector(".lb-prev").addEventListener("click", function () { show(idx - 1); });
    lb.querySelector(".lb-next").addEventListener("click", function () { show(idx + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "ArrowRight") show(idx + 1);
    });

    /* swipe на мобиле */
    var tx = null;
    lb.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      if (tx === null) return;
      var dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 48) show(idx + (dx < 0 ? 1 : -1));
      tx = null;
    }, { passive: true });
  }

  /* ---------- Форма: успех после редиректа ?sent=1 ----------
     Lead/form_submit трекаем ЗДЕСЬ (страница уже загружена — пиксель точно доедет),
     а не на submit (там POST-навигация обрывает запрос). Защита от повторов:
     флаг в sessionStorage + чистка URL, чтобы F5/закладка не накручивали конверсии. */
  if (/[?&]sent=1/.test(location.search)) {
    var ok = document.querySelector(".form-ok");
    if (ok) {
      ok.classList.add("show");
      document.getElementById("contact") &&
        document.getElementById("contact").scrollIntoView();
    }
    var alreadyCounted = false;
    try { alreadyCounted = sessionStorage.getItem("vb_sent") === "1"; } catch (e) {}
    if (!alreadyCounted) {
      try { sessionStorage.setItem("vb_sent", "1"); } catch (e) {}
      try { if (typeof fbq === "function") fbq("track", "Lead"); } catch (e) {}
      track("form_submit");
    }
    /* убрать ?sent=1 из адресной строки, оставив якорь #contact */
    try { history.replaceState(null, "", location.pathname + "#contact"); } catch (e) {}
  }
  var form = document.querySelector(".form form");
  if (form) {
    /* _next для formsubmit: возврат на эту же страницу с ?sent=1 */
    var next = form.querySelector('input[name="_next"]');
    if (next) next.value = location.origin + location.pathname + "?sent=1#contact";
  }
})();

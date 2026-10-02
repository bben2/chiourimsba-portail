/* Chat Torah — widget des sites ChiourimsBA.
   Injection : <script src="https://chiourimsba.vercel.app/chat.js" defer></script> */
(function () {
  if (window.__chatTorah) return;
  window.__chatTorah = 1;
  var API = "https://chiourimsba.vercel.app/api/chat";
  var hist = [];

  var SUGGESTIONS = [
    "Quelle est la paracha de la semaine ?",
    "Que dit Berakhot 2a sur le Chema du soir ?",
    "Horaires de Chabbat à Paris",
    "Que dit le Kitsour sur la netilat yadaïm du matin ?",
  ];

  // ---------- styles ----------
  var css = document.createElement("style");
  css.textContent = [
    "@keyframes ct-in{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}",
    "@keyframes ct-dot{0%,80%,100%{opacity:.25}40%{opacity:1}}",

    "#ct-btn{position:fixed;right:20px;bottom:20px;z-index:9998;display:flex;align-items:center;gap:8px;",
    "background:#1e3a5f;color:#fffdf8;border:none;border-radius:999px;padding:12px 20px 12px 16px;",
    "font:500 .92rem/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;cursor:pointer;",
    "box-shadow:0 3px 14px rgba(30,58,95,.28);transition:transform .15s,box-shadow .15s,background .15s}",
    "#ct-btn:hover{background:#152b47;transform:translateY(-2px);box-shadow:0 6px 20px rgba(30,58,95,.34)}",
    "#ct-btn svg{width:17px;height:17px;flex:none}",

    "#ct-p{position:fixed;right:20px;bottom:20px;z-index:9999;width:min(440px,calc(100vw - 32px));",
    "height:min(640px,calc(100vh - 40px));background:#faf8f3;border:1px solid #e2ddd2;border-radius:16px;",
    "box-shadow:0 10px 44px rgba(28,25,23,.24);display:none;flex-direction:column;overflow:hidden;",
    "font:400 .93rem/1.65 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1c1917}",
    "#ct-p.on{display:flex;animation:ct-in .22s cubic-bezier(.2,.9,.3,1)}",

    "#ct-h{display:flex;align-items:center;gap:10px;padding:13px 15px;background:#fffdf8;",
    "border-bottom:1px solid #e7e2d8;flex:none}",
    "#ct-h .ct-pt{width:30px;height:30px;border-radius:9px;background:#1e3a5f;color:#fffdf8;display:flex;",
    "align-items:center;justify-content:center;font:600 .95rem/1 serif;flex:none}",
    "#ct-h b{font-weight:600;color:#1e3a5f;font-size:.95rem;display:block}",
    "#ct-h small{color:#9a938a;font-size:.76rem}",
    "#ct-h .sp{flex:1}",
    "#ct-h button{background:none;border:none;cursor:pointer;color:#9a938a;padding:5px;border-radius:7px;",
    "display:flex;line-height:0}",
    "#ct-h button:hover{background:#f1efe8;color:#57534e}",
    "#ct-h button svg{width:16px;height:16px}",

    "#ct-m{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;",
    "scroll-behavior:smooth;overscroll-behavior:contain}",
    "#ct-m::-webkit-scrollbar{width:8px}#ct-m::-webkit-scrollbar-thumb{background:#ddd7cb;border-radius:4px}",

    ".ct-q,.ct-r{padding:10px 14px;border-radius:13px;max-width:93%;word-wrap:break-word}",
    ".ct-q{align-self:flex-end;background:#1e3a5f;color:#fffdf8;border-bottom-right-radius:5px;white-space:pre-wrap}",
    ".ct-r{align-self:flex-start;background:#fffdf8;border:1px solid #e7e2d8;border-bottom-left-radius:5px}",
    ".ct-r p{margin:.45em 0}.ct-r p:first-child{margin-top:0}.ct-r p:last-child{margin-bottom:0}",
    ".ct-r a{color:#1e3a5f;text-underline-offset:2px}",
    ".ct-r h2,.ct-r h3{font-size:.93rem;font-weight:600;margin:.85em 0 .3em;color:#1e3a5f}",
    ".ct-r ul,.ct-r ol{margin:.45em 0;padding-inline-start:1.25em}.ct-r li{margin:.2em 0}",
    ".ct-r code{background:#f1efe8;padding:1px 5px;border-radius:4px;font-size:.87em}",
    ".ct-r b{font-weight:600}",
    ".ct-he{font-family:'Frank Ruhl Libre','Times New Roman',serif;direction:rtl;unicode-bidi:isolate;",
    "font-size:1.08em;color:#43301a;line-height:1.9}",

    ".ct-s{margin-top:9px;padding-top:8px;border-top:1px solid #ece7dd;display:flex;flex-wrap:wrap;gap:5px;",
    "align-items:center}",
    ".ct-s em{color:#9a938a;font-size:.76rem;font-style:normal;margin-inline-end:2px}",
    ".ct-s a{font-size:.79rem;background:#f6f3ec;border:1px solid #e7e2d8;border-radius:999px;",
    "padding:2px 9px;text-decoration:none;color:#57534e}",
    ".ct-s a:hover{border-color:#b8860b;color:#1e3a5f}",
    ".ct-cp{margin-top:7px;background:none;border:none;color:#b0a89c;font-size:.75rem;cursor:pointer;padding:0}",
    ".ct-cp:hover{color:#57534e}",

    ".ct-err{align-self:center;color:#8a2b2b;background:#fdf3f3;border:1px solid #f0d5d5;",
    "border-radius:11px;padding:9px 14px;font-size:.86rem;text-align:center;max-width:94%}",
    ".ct-load{align-self:flex-start;color:#9a938a;font-size:.86rem;display:flex;gap:7px;align-items:center;",
    "padding:2px 4px}",
    ".ct-load i{width:5px;height:5px;border-radius:50%;background:#b8860b;display:inline-block;",
    "animation:ct-dot 1.3s infinite}",
    ".ct-load i:nth-child(2){animation-delay:.18s}.ct-load i:nth-child(3){animation-delay:.36s}",

    "#ct-sg{display:flex;flex-direction:column;gap:6px;margin-top:2px}",
    "#ct-sg button{text-align:start;background:#fffdf8;border:1px solid #e7e2d8;border-radius:10px;",
    "padding:8px 12px;font:inherit;font-size:.86rem;color:#57534e;cursor:pointer;line-height:1.45}",
    "#ct-sg button:hover{border-color:#b8860b;color:#1c1917;background:#fff}",

    "#ct-f{display:flex;gap:8px;padding:12px;border-top:1px solid #e7e2d8;background:#fffdf8;flex:none;",
    "align-items:flex-end}",
    "#ct-i{flex:1;border:1px solid #e2ddd2;border-radius:11px;padding:9px 12px;font:inherit;resize:none;",
    "max-height:104px;background:#faf8f3;color:inherit}",
    "#ct-i:focus{outline:none;border-color:#b8860b;background:#fff}",
    // Sous 16 px, iOS zoome sur le champ et la page reste décalée après l'envoi.
    "@media (pointer:coarse){#ct-i{font-size:16px}}",
    "#ct-go{background:#b8860b;color:#fffdf8;border:none;border-radius:11px;width:38px;height:38px;",
    "cursor:pointer;display:flex;align-items:center;justify-content:center;flex:none;transition:background .15s}",
    "#ct-go:hover:not(:disabled){background:#9c7209}",
    "#ct-go:disabled{opacity:.4;cursor:default}#ct-go svg{width:16px;height:16px}",
    "#ct-lg{padding:0 12px 9px;background:#fffdf8;color:#b0a89c;font-size:.71rem;text-align:center;flex:none}",

    "@media(max-width:520px){#ct-p{top:0;right:0;bottom:0;width:100vw;height:auto;border-radius:0;border:none}",
    "#ct-btn{right:14px;bottom:14px;padding:11px 17px 11px 14px}}",
  ].join("");
  document.head.appendChild(css);

  var ICO = {
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.1A8.4 8.4 0 0 1 4 11.5a8.4 8.4 0 0 1 8.5-8.4 8.4 8.4 0 0 1 8.5 8.4z"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    raz: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>',
    bulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6M10 22h4"/></svg>',
    mark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>',
    pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    go: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M12 5l7 7-7 7"/></svg>',
  };

  var btn = document.createElement("button");
  btn.id = "ct-btn"; btn.type = "button";
  btn.setAttribute("aria-label", "Ouvrir le chat d’étude");
  btn.innerHTML = ICO.chat + "<span>Poser une question</span>";

  var p = document.createElement("div");
  p.id = "ct-p"; p.setAttribute("role", "dialog"); p.setAttribute("aria-label", "Chat d’étude");
  p.innerHTML =
    '<div id="ct-h"><div class="ct-pt">ב</div><div><b>Une question sur un texte ?</b>' +
    "<small>Version bêta · réponses fondées sur les sources</small></div><div class=sp></div>" +
    '<button id="ct-raz" title="Effacer la conversation" aria-label="Effacer">' + ICO.raz + "</button>" +
    '<button id="ct-x" title="Fermer" aria-label="Fermer">' + ICO.x + "</button></div>" +
    '<div id="ct-m"></div>' +
    '<div id="ct-f"><textarea id="ct-i" rows="1" aria-label="Votre question" ' +
    'placeholder="Un verset, une guemara, une halakha, un horaire…"></textarea>' +
    '<button id="ct-go" aria-label="Envoyer">' + ICO.go + "</button></div>" +
    '<div id="ct-lg">Textes : Sefaria et les traductions de ChiourimsBA</div>';

  document.body.appendChild(btn); document.body.appendChild(p);
  var M = p.querySelector("#ct-m"), I = p.querySelector("#ct-i"), GO = p.querySelector("#ct-go");

  // ---------- rendu ----------
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  // isole les passages hebreux pour un rendu RTL correct
  function heb(h) {
    return h.replace(/([֐-׿][֐-׿\s'׳״.,;:!?()\[\]־–-]*)/g,
      function (m) { return m.trim().length > 1 ? '<span class="ct-he">' + m + "</span>" : m; });
  }
  function md(t) {
    var h = esc(t);
    h = h.replace(/^### (.+)$/gm, "<h3>$1</h3>").replace(/^## (.+)$/gm, "<h2>$1</h2>");
    h = h.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/`([^`]+?)`/g, "<code>$1</code>");
    h = h.replace(/\[([^\]]+?)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    h = h.replace(/(^|[\s(])(https?:\/\/[^\s)<]+)/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>');
    // listes
    h = h.replace(/(?:^[*\-] .+(?:\n|$))+/gm, function (bloc) {
      return "<ul>" + bloc.trim().split("\n").map(function (l) {
        return "<li>" + l.replace(/^[*\-] /, "") + "</li>";
      }).join("") + "</ul>";
    });
    h = h.replace(/(?:^\d+\. .+(?:\n|$))+/gm, function (bloc) {
      return "<ol>" + bloc.trim().split("\n").map(function (l) {
        return "<li>" + l.replace(/^\d+\. /, "") + "</li>";
      }).join("") + "</ol>";
    });
    h = h.split(/\n{2,}/).map(function (b) {
      return /^<(ul|ol|h2|h3)/.test(b.trim()) ? b : "<p>" + b.replace(/\n/g, "<br>") + "</p>";
    }).join("");
    return heb(h);
  }
  function bulle(cls, html) {
    var d = document.createElement("div");
    d.className = cls; d.innerHTML = html;
    M.appendChild(d); M.scrollTop = M.scrollHeight;
    return d;
  }

  function accueil() {
    M.innerHTML = "";
    var d = bulle("ct-r", "<p>Posez une question sur un verset, une guemara, une halakha, une paracha ou un horaire. " +
      "Chaque réponse s’appuie sur les textes, avec leurs références.</p>" +
      "<p><b>Version bêta.</b> Les réponses sont rédigées par une intelligence artificielle et peuvent contenir des erreurs : " +
      "vérifiez toujours les sources indiquées. Pour une question de halakha pratique, adressez-vous à un Rav.</p>");
    var sg = document.createElement("div"); sg.id = "ct-sg";
    SUGGESTIONS.forEach(function (s) {
      var b = document.createElement("button");
      b.type = "button"; b.textContent = s;
      b.onclick = function () { I.value = s; envoyer(); };
      sg.appendChild(b);
    });
    d.appendChild(sg);
  }

  function ouvrir(o) {
    p.classList.toggle("on", o);
    btn.style.display = o ? "none" : "";
    if (o) { if (!M.children.length) accueil(); setTimeout(function () { I.focus(); }, 60); }
    else btn.focus();
  }
  btn.onclick = function () { ouvrir(true); };
  p.querySelector("#ct-x").onclick = function () { ouvrir(false); };
  p.querySelector("#ct-raz").onclick = function () { hist = []; accueil(); I.focus(); };
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && p.classList.contains("on")) ouvrir(false);
  });
  I.oninput = function () { I.style.height = "auto"; I.style.height = Math.min(I.scrollHeight, 104) + "px"; };
  I.onkeydown = function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); envoyer(); } };
  GO.onclick = envoyer;

  function envoyer() {
    var q = I.value.trim();
    if (!q || GO.disabled) return;
    var sg = M.querySelector("#ct-sg"); if (sg) sg.remove();
    I.value = ""; I.style.height = "auto";
    bulle("ct-q", esc(q));
    var att = bulle("ct-load", "<i></i><i></i><i></i><span>Lecture des sources…</span>");
    GO.disabled = true;

    fetch(API, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q, historique: hist.slice(-4) }),
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (x) {
        att.remove();
        if (!x.ok || x.d.erreur) { bulle("ct-err", esc(x.d.erreur || "Service indisponible.")); return; }
        var h = md(x.d.reponse);
        if (x.d.sources && x.d.sources.length) {
          h += '<div class="ct-s"><em>Sources</em>' + x.d.sources.slice(0, 8).map(function (s) {
            return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.ref) + "</a>";
          }).join("") + "</div>";
        }
        var b = bulle("ct-r", h);
        var cp = document.createElement("button");
        cp.className = "ct-cp"; cp.type = "button"; cp.textContent = "Copier";
        cp.onclick = function () {
          navigator.clipboard.writeText(x.d.reponse).then(function () {
            cp.textContent = "Copié"; setTimeout(function () { cp.textContent = "Copier"; }, 1600);
          });
        };
        b.appendChild(cp);
        hist.push({ role: "user", texte: q }, { role: "assistant", texte: x.d.reponse });
      })
      .catch(function () { att.remove(); bulle("ct-err", "Connexion impossible. Réessayez."); })
      .finally(function () { GO.disabled = false; I.focus(); });
  }

  // ---------- API partagée avec les applis : window.ChiourimsChat ----------
  function ouvrirIdem() { if (p.classList.contains("on")) I.focus(); else ouvrir(true); }
  function poser(texte) {
    ouvrirIdem();
    I.value = String(texte == null ? "" : texte);
    I.oninput();
    I.focus();
    try { I.setSelectionRange(I.value.length, I.value.length); } catch (e) {}
    I.scrollTop = I.scrollHeight;
  }
  window.ChiourimsChat = { ouvrir: ouvrirIdem, poser: poser };
  try {
    var q0 = new URLSearchParams(location.search).get("question");
    if (q0 && q0.trim()) poser(q0);
  } catch (e) {}

  // ---------- favoris, notes et ampoules (pages de Guemara et de Hassidout) ----------
  // Tout reste dans le localStorage de ce navigateur, séparément pour chaque site (une origine = un stockage).
  var KEY = "chiourimsba.espace.v1";
  var PAGE = location.pathname.replace(/\.html$/, "");
  var h1 = document.querySelector("h1");
  // La référence suffit (« Sukkah 33a ») : le sous-titre après « — » alourdirait la question.
  var TITRE = ((h1 && h1.textContent) || document.title || "").replace(/\s+/g, " ").trim().split(/\s+[—–]\s+/)[0];
  var rafraichir = []; // fonctions qui resynchronisent l'affichage de la page avec le stockage

  function lire() {
    try {
      var d = JSON.parse(localStorage.getItem(KEY) || "null");
      if (d && typeof d === "object") return { fav: d.fav || {}, notes: d.notes || {} };
    } catch (e) {}
    return { fav: {}, notes: {} };
  }
  function ecrire(d) {
    try { localStorage.setItem(KEY, JSON.stringify(d)); return true; } catch (e) { return false; }
  }
  function effacerTout() {
    try { localStorage.removeItem(KEY); return true; } catch (e) { return false; }
  }
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function bouton(icone, libelle, cls, visible) {
    var b = el("button", "ct-ib" + (cls ? " " + cls : ""));
    b.type = "button"; b.title = libelle; b.setAttribute("aria-label", libelle);
    b.innerHTML = ICO[icone];
    if (visible) b.appendChild(el("span", "", visible));
    return b;
  }
  function majLibelle(b, libelle, visible) {
    b.title = libelle; b.setAttribute("aria-label", libelle);
    var s = b.querySelector("span"); if (s && visible) s.textContent = visible;
  }
  function texteFr(fr) {
    var c = fr.cloneNode(true);
    Array.prototype.forEach.call(c.querySelectorAll(".ct-act"), function (n) { n.remove(); });
    Array.prototype.forEach.call(c.querySelectorAll("p,br,li"), function (n) { n.insertAdjacentText("afterend", " "); });
    return c.textContent.replace(/\s+/g, " ").trim();
  }
  function couper(t, max) {
    if (t.length <= max) return t;
    var s = t.slice(0, max), i = s.lastIndexOf(" ");
    return (i > max * 0.6 ? s.slice(0, i) : s).replace(/[\s,;:.\-–—(]+$/, "") + "…";
  }
  function dateFr(ts) {
    try { return new Date(ts).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }); }
    catch (e) { return ""; }
  }

  var css2 = document.createElement("style");
  css2.textContent = [
    ".ct-act{margin-top:9px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}",
    ".ct-row{display:flex;flex-wrap:wrap;align-items:center;gap:4px}",
    ".ct-ib{display:inline-flex;align-items:center;gap:6px;border:1px solid transparent;background:none;",
    "color:var(--muted,#78716c);font:inherit;font-size:.8rem;font-weight:500;line-height:1;padding:8px 10px;min-height:32px;",
    "border-radius:999px;cursor:pointer;opacity:.85;text-decoration:none;transition:color .15s,border-color .15s,background .15s}",
    ".ct-ib:hover{color:var(--navy,#1e3a5f);border-color:var(--line,#e7e2d8);background:var(--paper,#fffdf8);opacity:1}",
    ".ct-ib:focus-visible{outline:2px solid var(--gold,#b8860b);outline-offset:1px;opacity:1}",
    ".ct-ib svg{width:16px;height:16px;flex:none}",
    ".ct-ib.ct-has{color:var(--gold,#b8860b)}",
    ".ct-ib.ct-has svg{fill:currentColor;fill-opacity:.22}",
    ".ct-nw{margin-top:6px}",
    ".ct-nw[hidden]{display:none}",
    ".ct-nw textarea{display:block;width:100%;min-height:68px;resize:vertical;border:1px solid var(--line,#e7e2d8);",
    "border-radius:10px;padding:8px 11px;background:#fff;color:var(--ink,#1c1917);font:inherit;font-size:.9rem;line-height:1.5}",
    ".ct-nw textarea:focus{outline:none;border-color:var(--gold,#b8860b)}",
    ".ct-st{min-height:1.1em;margin-top:3px;color:var(--muted,#78716c);font-size:.74rem}",
    ".ct-hb{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:12px}",
    ".ct-hb .ct-ib{border-color:var(--line,#e7e2d8);background:var(--paper,#fffdf8);padding:7px 14px}",
    ".ct-hb .ct-ib:hover{border-color:var(--gold,#b8860b)}",
    "@media(max-width:520px){.ct-hb{gap:6px}.ct-hb .ct-ib{padding:6px 11px;font-size:.76rem}}",
    "@media (pointer:coarse){.ct-ib{min-height:40px}.ct-nw textarea{font-size:16px}}",
    "@media print{.ct-act,.ct-hb,#ct-esp{display:none!important}}",

    "#ct-esp{position:fixed;top:0;right:0;bottom:0;left:0;z-index:10000;background:rgba(28,25,23,.45);display:none;align-items:center;",
    "justify-content:center;padding:16px}#ct-esp.on{display:flex}",
    ".ct-ec{width:min(640px,100%);max-height:calc(100vh - 32px);overflow:auto;",
    "background:var(--bg,#faf8f3);color:var(--ink,#1c1917);border:1px solid var(--line,#e7e2d8);border-radius:16px;",
    "padding:18px 20px 20px;box-shadow:0 10px 44px rgba(28,25,23,.28);",
    "font:400 .93rem/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}",
    ".ct-eh{display:flex;align-items:center;gap:10px;margin-bottom:6px}",
    ".ct-eh h2{flex:1;margin:0;font-size:1.15rem;font-weight:600;color:var(--navy,#1e3a5f)}",
    ".ct-eh button{background:none;border:none;cursor:pointer;color:var(--muted,#78716c);padding:6px;border-radius:8px;line-height:0}",
    ".ct-eh button:hover{background:var(--line,#e7e2d8)}.ct-eh svg{width:18px;height:18px}",
    ".ct-es h3,#ct-espace h3{margin:16px 0 6px;font-size:.95rem;font-weight:600;color:var(--navy,#1e3a5f)}",
    "p.ct-vide{margin:.3em 0;color:var(--muted,#78716c);font-size:.88rem}",
    ".ct-it{display:flex;gap:10px;align-items:flex-start;background:var(--paper,#fffdf8);border:1px solid var(--line,#e7e2d8);",
    "border-left:4px solid var(--gold,#b8860b);border-radius:10px;padding:10px 12px;margin:0 0 8px}",
    ".ct-it>div{flex:1;min-width:0}",
    ".ct-it a{color:var(--navy,#1e3a5f);font-weight:600;text-decoration:none;overflow-wrap:anywhere}",
    ".ct-it a:hover{text-decoration:underline}",
    ".ct-it q{display:block;margin-top:2px;color:var(--muted,#78716c);font-size:.82rem;quotes:none}",
    ".ct-it .ct-nt{margin-top:4px;white-space:pre-wrap;overflow-wrap:anywhere}",
    ".ct-it small{display:block;margin-top:3px;color:var(--muted,#78716c);font-size:.74rem}",
    ".ct-it button{flex:none;background:none;border:1px solid var(--line,#e7e2d8);border-radius:999px;color:var(--muted,#78716c);",
    "font:inherit;font-size:.76rem;padding:3px 10px;cursor:pointer}.ct-it button:hover{border-color:#8a2b2b;color:#8a2b2b}",
    ".ct-pied{margin-top:20px;padding-top:12px;border-top:1px solid var(--line,#e7e2d8);color:var(--muted,#78716c);font-size:.84rem}",
    ".ct-pied button{margin:8px 8px 0 0;background:var(--paper,#fffdf8);border:1px solid var(--line,#e7e2d8);border-radius:999px;",
    "color:#8a2b2b;font:inherit;font-size:.82rem;padding:6px 14px;cursor:pointer}.ct-pied button:hover{border-color:#8a2b2b}",
    ".ct-pied button.ct-sec{color:var(--muted,#78716c)}",
    "@media(max-width:520px){#ct-esp{padding:0}.ct-ec{width:100%;max-height:100vh;border-radius:0;border:none}}",
  ].join("");
  document.head.appendChild(css2);

  // ----- Mon espace : liste des favoris et des notes de ce site -----
  function cheminSur(c) { return typeof c === "string" && c.charAt(0) === "/" && c.charAt(1) !== "/"; }
  function carte(href, titre, extra, onRetirer, verbe) {
    var c = el("div", "ct-it"), g = el("div");
    if (cheminSur(href)) { var a = el("a", "", titre || href); a.href = href; g.appendChild(a); }
    else g.appendChild(el("span", "", titre || ""));
    if (extra) extra(g);
    c.appendChild(g);
    var r = el("button", "", verbe); r.type = "button";
    r.setAttribute("aria-label", verbe + " : " + (titre || "")); r.onclick = onRetirer;
    c.appendChild(r);
    return c;
  }
  function renderEspace(box, court) {
    var d = lire();
    function tri(o) {
      return Object.keys(o).map(function (k) { var v = o[k]; v.k = k; return v; })
        .sort(function (a, b) { return (b.d || 0) - (a.d || 0); });
    }
    function retirer(famille, k) {
      return function () {
        var x = lire(); delete x[famille][k]; ecrire(x);
        renderEspace(box, court); rafraichir.forEach(function (fn) { fn(); });
      };
    }
    var favs = tri(d.fav), notes = tri(d.notes), vide = !favs.length && !notes.length;
    box.textContent = "";
    if (court && vide) {
      box.appendChild(el("p", "ct-vide", "Rien d’enregistré sur le portail pour l’instant."));
    } else {
      box.appendChild(el("h3", "", "Favoris (" + favs.length + ")"));
      if (!favs.length) box.appendChild(el("p", "ct-vide",
        "Aucun favori. Sur une page de Guemara ou de Hassidout, touchez « Ajouter aux favoris » en haut de la page."));
      favs.forEach(function (f) {
        box.appendChild(carte(f.p, f.t, function (g) { g.appendChild(el("small", "", "Ajouté le " + dateFr(f.d))); },
          retirer("fav", f.k), "Retirer"));
      });
      box.appendChild(el("h3", "", "Mes notes (" + notes.length + ")"));
      if (!notes.length) box.appendChild(el("p", "ct-vide",
        "Aucune note. Sous chaque passage, « Ma note » ouvre un champ : il s’enregistre tout seul."));
      notes.forEach(function (n) {
        box.appendChild(carte(cheminSur(n.p) ? n.p + (n.h ? "#" + n.h : "") : "", n.t, function (g) {
          if (n.s) g.appendChild(el("q", "", "« " + n.s + " »"));
          g.appendChild(el("div", "ct-nt", n.n));
          g.appendChild(el("small", "", "Note du " + dateFr(n.d)));
        }, retirer("notes", n.k), "Supprimer"));
      });
    }
    var pied = el("div", "ct-pied");
    pied.appendChild(el("div", "", "Vos favoris et vos notes restent dans ce navigateur, sur cet appareil : ils ne sont envoyés nulle part. " +
      "Chaque site (portail, Guemara, Hassidout, Halakha) garde sa propre liste."));
    var raz = el("button", "", "Tout effacer"); raz.type = "button";
    var non = el("button", "ct-sec", "Annuler"); non.type = "button"; non.hidden = true;
    raz.onclick = function () {
      if (non.hidden) { raz.textContent = "Confirmer : tout effacer sur ce site"; non.hidden = false; return; }
      effacerTout(); renderEspace(box, court); rafraichir.forEach(function (fn) { fn(); });
    };
    non.onclick = function () { raz.textContent = "Tout effacer"; non.hidden = true; };
    if (!vide || court) { pied.appendChild(raz); pied.appendChild(non); }
    box.appendChild(pied);
  }

  var esp = null, espOrigine = null;
  function fermerEspace() {
    if (!esp || !esp.classList.contains("on")) return;
    esp.classList.remove("on");
    if (espOrigine && espOrigine.focus) espOrigine.focus();
  }
  function ouvrirEspace() {
    if (!esp) {
      esp = el("div"); esp.id = "ct-esp";
      esp.innerHTML = '<div class="ct-ec" role="dialog" aria-modal="true" aria-label="Mon espace"><div class="ct-eh">' +
        "<h2>Mon espace</h2>" +
        '<button type="button" class="ct-ex" aria-label="Fermer" title="Fermer">' + ICO.x + "</button></div>" +
        '<div class="ct-es"></div></div>';
      esp.onclick = function (e) { if (e.target === esp) fermerEspace(); };
      esp.querySelector(".ct-ex").onclick = fermerEspace;
      esp.addEventListener("keydown", function (e) { // le focus reste dans la fenêtre
        if (e.key !== "Tab") return;
        var f = esp.querySelectorAll("a[href],button:not([hidden])");
        if (!f.length) return;
        var a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      });
      document.body.appendChild(esp);
    }
    espOrigine = document.activeElement;
    if (p.classList.contains("on")) ouvrir(false);
    renderEspace(esp.querySelector(".ct-es"));
    esp.classList.add("on");
    esp.querySelector(".ct-ex").focus();
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") fermerEspace(); });

  // ----- pages de textes : ampoule + note par passage, favori + ampoule en tête -----
  function passages() {
    var segs = Array.prototype.slice.call(document.querySelectorAll("section.seg, div.seg")), vus = [];
    segs.forEach(function (seg, i) {
      if (seg.classList.contains("h")) return; // intertitre
      var fr = seg.querySelector(".fr");
      if (!fr) return;
      var creeId = !seg.id;
      if (creeId) seg.id = "seg" + i;
      var cle = PAGE + "#" + seg.id;

      var act = el("div", "ct-act"), row = el("div", "ct-row");
      var amp = bouton("bulb", "Approfondir avec l'IA");
      amp.onclick = function () {
        poser("Explique-moi ce passage de " + TITRE + " : « " + couper(texteFr(fr), 600) + " »");
      };
      var nb = bouton("pen", "Ma note", "", "Ma note");
      nb.setAttribute("aria-expanded", "false");
      var nw = el("div", "ct-nw"), ta = el("textarea"), st = el("div", "ct-st");
      nw.hidden = true;
      ta.rows = 3; ta.setAttribute("aria-label", "Ma note sur ce passage");
      ta.placeholder = "Ma note, enregistrée dans ce navigateur uniquement.";
      nw.appendChild(ta); nw.appendChild(st);
      row.appendChild(amp); row.appendChild(nb);
      act.appendChild(row); act.appendChild(nw);
      fr.appendChild(act);

      var enreg = ""; // dernière valeur connue du stockage
      function montre() {
        var n = lire().notes[cle]; enreg = n ? n.n : "";
        if (document.activeElement !== ta) ta.value = enreg;
        nb.classList.toggle("ct-has", !!enreg);
        if (enreg) { nw.hidden = false; nb.setAttribute("aria-expanded", "true"); }
      }
      function sauver() {
        var v = ta.value.trim();
        if (v === enreg) return;
        var d = lire();
        if (v) d.notes[cle] = { p: location.pathname, h: seg.id, t: TITRE, s: couper(texteFr(fr), 90), n: v, d: Date.now() };
        else delete d.notes[cle];
        if (ecrire(d)) { enreg = v; st.textContent = v ? "Note enregistrée dans ce navigateur." : "Note supprimée."; }
        else st.textContent = "Enregistrement impossible : ce navigateur refuse le stockage local.";
        nb.classList.toggle("ct-has", !!enreg);
      }
      nb.onclick = function () {
        nw.hidden = !nw.hidden;
        nb.setAttribute("aria-expanded", String(!nw.hidden));
        if (!nw.hidden) ta.focus();
      };
      ta.onblur = sauver;
      rafraichir.push(montre); vus.push(sauver);
      montre();
      if (creeId && location.hash === "#" + seg.id) seg.scrollIntoView();
    });
    window.addEventListener("pagehide", function () { vus.forEach(function (f) { f(); }); });
    return segs.length;
  }

  function enTete() {
    var hd = document.querySelector("header.top") || (h1 && h1.parentNode);
    if (!hd) return;
    var bar = el("div", "ct-hb");
    var fav = bouton("mark", "Ajouter aux favoris", "", "Ajouter aux favoris");
    function majFav() {
      var on = !!lire().fav[PAGE];
      fav.classList.toggle("ct-has", on);
      var l = on ? "Retirer des favoris" : "Ajouter aux favoris";
      majLibelle(fav, l, l);
    }
    fav.onclick = function () {
      var d = lire();
      if (d.fav[PAGE]) delete d.fav[PAGE];
      else d.fav[PAGE] = { p: location.pathname, t: TITRE, d: Date.now() };
      ecrire(d); majFav();
    };
    var amp = bouton("bulb", "Demander à l'IA sur cette page", "", "Demander à l'IA sur cette page");
    amp.onclick = function () { poser("Sur " + TITRE + " : "); };
    var esB = bouton("user", "Mon espace", "", "Mon espace");
    esB.onclick = ouvrirEspace;
    bar.appendChild(fav); bar.appendChild(esB); bar.appendChild(amp);
    hd.appendChild(bar);
    rafraichir.push(majFav); majFav();
  }

  if (passages()) enTete();
  var mont = document.getElementById("ct-espace"); // page « Mon espace » du portail
  if (mont) { renderEspace(mont, true); rafraichir.push(function () { renderEspace(mont, true); }); }
  if (location.hash === "#mon-espace") ouvrirEspace();
})();

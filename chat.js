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
    "Horaires de Chabbat a Paris",
    "Que dit le Kitsour sur la netilat yadaim du matin ?",
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
    "#ct-go{background:#b8860b;color:#fffdf8;border:none;border-radius:11px;width:38px;height:38px;",
    "cursor:pointer;display:flex;align-items:center;justify-content:center;flex:none;transition:background .15s}",
    "#ct-go:hover:not(:disabled){background:#9c7209}",
    "#ct-go:disabled{opacity:.4;cursor:default}#ct-go svg{width:16px;height:16px}",
    "#ct-lg{padding:0 12px 9px;background:#fffdf8;color:#b0a89c;font-size:.71rem;text-align:center;flex:none}",

    "@media(max-width:520px){#ct-p{right:0;bottom:0;width:100vw;height:100dvh;border-radius:0;border:none}",
    "#ct-btn{right:14px;bottom:14px;padding:11px 17px 11px 14px}}",
  ].join("");
  document.head.appendChild(css);

  var ICO = {
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.1A8.4 8.4 0 0 1 4 11.5a8.4 8.4 0 0 1 8.5-8.4 8.4 8.4 0 0 1 8.5 8.4z"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    raz: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>',
    go: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M12 5l7 7-7 7"/></svg>',
  };

  var btn = document.createElement("button");
  btn.id = "ct-btn"; btn.type = "button";
  btn.setAttribute("aria-label", "Ouvrir le chat d etude");
  btn.innerHTML = ICO.chat + "<span>Poser une question</span>";

  var p = document.createElement("div");
  p.id = "ct-p"; p.setAttribute("role", "dialog"); p.setAttribute("aria-label", "Chat d etude");
  p.innerHTML =
    '<div id="ct-h"><div class="ct-pt">ב</div><div><b>Une question sur un texte ?</b>' +
    "<small>Reponses fondees sur les sources</small></div><div class=sp></div>" +
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
      "Chaque reponse s appuie sur les textes, avec leurs references.</p>");
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
            cp.textContent = "Copie"; setTimeout(function () { cp.textContent = "Copier"; }, 1600);
          });
        };
        b.appendChild(cp);
        hist.push({ role: "user", texte: q }, { role: "assistant", texte: x.d.reponse });
      })
      .catch(function () { att.remove(); bulle("ct-err", "Connexion impossible. Reessayez."); })
      .finally(function () { GO.disabled = false; I.focus(); });
  }
})();

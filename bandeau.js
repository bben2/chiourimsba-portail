/* Bandeau « Télécharger l'application » — en haut de toutes les pages des sites ChiourimsBA (VBA, 05/10/2026).
   Chargé par chat.js ; sur les pages sans chat.js : <script src="https://chiourimsba.vercel.app/bandeau.js" defer></script> */
(function () {
  if (window.__bandeauAppli) return;
  window.__bandeauAppli = 1;
  var IOS = "https://apps.apple.com/fr/app/chiourims-torah/id6816099984";
  var ANDROID = null; // lien Google Play quand l'appli y sera publique
  var CLE = "bandeau-appli-ferme", DUREE = 14 * 864e5;

  var ua = navigator.userAgent;
  // Pas dans l'appli elle-même : vue web iOS/Mac (WebKit sans « Safari/ ») ou Android (« ; wv) »),
  // sauf navigateurs intégrés des réseaux sociaux, où le bandeau est utile.
  var vueWeb = (/AppleWebKit/.test(ua) && !/Safari\//.test(ua)) || /; wv\)/.test(ua);
  if (vueWeb && !/Instagram|FBAN|FBAV|FB_IAB|LinkedIn|Twitter/.test(ua)) return;
  var android = /Android/.test(ua);
  var lien = android ? ANDROID : IOS;
  if (!lien) return;
  try { if (Date.now() - (+localStorage.getItem(CLE) || 0) < DUREE) return; } catch (e) {}

  var css = document.createElement("style");
  css.textContent =
    "#ba-b{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;padding:9px 44px 9px 16px;" +
    "background:#1e3a5f;color:#fffdf8;font:400 .9rem/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;" +
    "position:relative;z-index:9997;text-align:center}" +
    "#ba-b a{background:#fffdf8;color:#1e3a5f;border-radius:999px;padding:6px 14px;font-weight:600;text-decoration:none;white-space:nowrap}" +
    "#ba-b a:hover{background:#e9e4d8}" +
    "#ba-b button{position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:0;color:#fffdf8;" +
    "font-size:1.3rem;line-height:1;padding:6px 8px;cursor:pointer;opacity:.75}" +
    "#ba-b button:hover{opacity:1}" +
    "@media print{#ba-b{display:none}}";
  document.head.appendChild(css);

  var b = document.createElement("div");
  b.id = "ba-b";
  b.setAttribute("role", "region");
  b.setAttribute("aria-label", "Application Chiourims Torah");
  var t = document.createElement("span");
  t.textContent = android ? "L'application gratuite Chiourims Torah est disponible sur Android."
                          : "L'application gratuite Chiourims Torah est disponible sur iPhone et iPad.";
  var a = document.createElement("a");
  a.href = lien; a.target = "_blank"; a.rel = "noopener";
  a.textContent = "Télécharger l'application";
  var x = document.createElement("button");
  x.type = "button"; x.setAttribute("aria-label", "Fermer"); x.textContent = "×";
  x.onclick = function () {
    b.remove();
    try { localStorage.setItem(CLE, String(Date.now())); } catch (e) {}
  };
  b.appendChild(t); b.appendChild(a); b.appendChild(x);
  document.body.insertBefore(b, document.body.firstChild);
})();

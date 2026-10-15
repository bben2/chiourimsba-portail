// Mesure d'audience SANS cookie (VBA 15/10/2026 : « combien de clics ») : une ligne par page vue, envoyée par chat.js
// (navigator.sendBeacon). Rien n'est déposé sur l'appareil, aucune adresse IP : page, source (?src=), site d'où l'on
// vient, pays (fourni par Vercel) et type d'appareil.
const noter = require("./_stats");
const court = (v, n) => String(v || "").slice(0, n);

module.exports = async (req, res) => {
  if (req.method === "POST") {
    let c = req.body;
    if (typeof c === "string") { try { c = JSON.parse(c); } catch { c = {}; } }
    const site = court((req.headers.origin || req.headers.referer || "").replace(/^https?:\/\//, "").split("/")[0], 60);
    await noter("visites", { genre: "vue", site, page: court(c?.page, 200), src: court(c?.src, 40), ref: court(c?.ref, 100),
      pays: court(req.headers["x-vercel-ip-country"], 2), appareil: /Mobi|Android|iPhone/i.test(req.headers["user-agent"] || "") ? "mobile" : "ordinateur" });
  }
  res.status(204).end();
};

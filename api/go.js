// Lien suivi : /l/<chemin>?src=whatsapp → compte le clic (sans cookie ni IP), puis redirige vers la page ou le fichier
// du portail. Seuls les chemins internes sont acceptés (pas de redirection vers un autre site).
const noter = require("./_stats");

module.exports = async (req, res) => {
  const d = String(req.query.d || "");
  const ok = /^[\w\-./]{1,150}$/.test(d) && !d.includes("..") && !d.startsWith("/");
  const cible = ok ? "/" + d : "/";
  if (req.method === "GET") {
    await noter("visites", { genre: "clic", site: "chiourimsba.vercel.app", page: cible.slice(0, 200), src: String(req.query.src || "").slice(0, 40),
      ref: "", pays: String(req.headers["x-vercel-ip-country"] || "").slice(0, 2),
      appareil: /Mobi|Android|iPhone/i.test(req.headers["user-agent"] || "") ? "mobile" : "ordinateur" });
  }
  res.setHeader("Cache-Control", "no-store");
  res.redirect(302, cible);
};

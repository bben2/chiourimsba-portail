// Signalements d'erreurs — sites ChiourimsBA et appli iPhone.
// Chaque signalement devient une « issue » GitHub dans bben2/chiourimsba-signalements (dépôt privé),
// traitée plus tard par un agent IA sur ordre de Benjamin (voir TRAITEMENT.md dans ce dépôt).
// Le jeton GitHub reste ici, côté serveur (variable Vercel GITHUB_TOKEN_SIGNALEMENTS) : jamais dans l'appli ni les pages.

const DEPOT = process.env.SIGNALEMENTS_DEPOT || "bben2/chiourimsba-signalements";
const SITES = ["portail", "guemara", "hassidout", "halakha"];
const ORIGINES = [
  "https://chiourimsba.vercel.app", "https://guemara.vercel.app",
  "https://hassidout.vercel.app", "https://halakha.vercel.app",
];
const recents = new Map();            // anti-rafale simple par adresse (mémoire de l'instance)

function texte(v, max) {
  return typeof v === "string" ? v.replace(/\u0000/g, "").trim().slice(0, max) : "";
}

module.exports = async (req, res) => {
  const origine = req.headers.origin || "";
  res.setHeader("Access-Control-Allow-Origin", ORIGINES.includes(origine) ? origine : ORIGINES[0]);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ erreur: "POST attendu" });

  const jeton = process.env.GITHUB_TOKEN_SIGNALEMENTS;
  if (!jeton) return res.status(503).json({ erreur: "Signalements pas encore activés" });

  const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  if (b.site_web) return res.status(200).json({ ok: true });          // champ piège : robots
  const site = SITES.includes(b.site) ? b.site : "";
  const page = texte(b.page, 300);
  const passage = texte(b.passage, 1500);
  const correction = texte(b.correction, 3000);
  const source = b.source === "appli" ? "appli" : "site";
  if (!site || !page || (!passage && !correction)) return res.status(400).json({ erreur: "site, page et passage ou correction requis" });

  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "?";
  const maintenant = Date.now();
  const liste = (recents.get(ip) || []).filter((t) => maintenant - t < 3600e3);
  if (liste.length >= 10) return res.status(429).json({ erreur: "Trop de signalements, réessayez plus tard" });
  recents.set(ip, [...liste, maintenant]);

  const url = `https://${site === "portail" ? "chiourimsba" : site}.vercel.app/${page.replace(/^\//, "")}`;
  const titre = `[${site}] ${page}${passage ? " — « " + passage.slice(0, 60) + (passage.length > 60 ? "… »" : " »") : ""}`;
  const corps = [
    `**Page** : ${url}`,
    `**Source** : ${source}`,
    "",
    "**Passage signalé**",
    "```text", passage || "(non précisé)", "```",
    "",
    "**Correction proposée**",
    "```text", correction || "(non précisée)", "```",
  ].join("\n");

  const r = await fetch(`https://api.github.com/repos/${DEPOT}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jeton}`, Accept: "application/vnd.github+json",
      "User-Agent": "chiourimsba-signalements", "Content-Type": "application/json",
    },
    body: JSON.stringify({ title: titre.slice(0, 250), body: corps, labels: [site, "à traiter"] }),
  });
  if (!r.ok) return res.status(502).json({ erreur: "Enregistrement impossible pour l'instant" });
  const issue = await r.json();
  return res.status(201).json({ ok: true, numero: issue.number });
};

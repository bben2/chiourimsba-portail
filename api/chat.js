// Chat Torah — API des sites ChiourimsBA.
// Gemini (palier gratuit) + outils : Sefaria, Hebcal, corpus francais ChiourimsBA.
// Plafond = le quota gratuit lui-meme : si Gemini refuse (429), on le dit, rien n'est facture.

const MODELE = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const SEF = "https://www.sefaria.org/api";
const UA = { "User-Agent": "chiourimsba/1.0 (+https://chiourimsba.vercel.app)" };

const ORIGINES = [
  "https://chiourimsba.vercel.app", "https://guemara.vercel.app",
  "https://otsrot.vercel.app", "https://hassidout.vercel.app",
  "https://halakha.vercel.app",
];

// ---- garde-fou par visiteur (best effort, memoire de l'instance) ----
const vus = new Map();
const PAR_IP_MIN = 5, PAR_IP_JOUR = 30;
function quotaIp(ip) {
  const t = Date.now(), j = new Date().toISOString().slice(0, 10);
  const e = vus.get(ip) || { min: [], jour: j, n: 0 };
  if (e.jour !== j) { e.jour = j; e.n = 0; }
  e.min = e.min.filter((x) => t - x < 60000);
  if (e.min.length >= PAR_IP_MIN) return "Trop de questions d'affilee. Reessayez dans une minute.";
  if (e.n >= PAR_IP_JOUR) return "Vous avez atteint la limite de questions pour aujourd'hui.";
  e.min.push(t); e.n++; vus.set(ip, e);
  return null;
}

const nett = (t) => Array.isArray(t) ? t.map(nett) : String(t || "").replace(/<[^>]+>/g, "").trim();

// ---- corpus francais ChiourimsBA ----
let CORPUS = null;
function corpus() {
  if (!CORPUS) {
    try { CORPUS = require("./_data/corpus.json"); } catch { CORPUS = []; }
  }
  return CORPUS;
}
const sansAccents = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function corpusChercher({ requete, limite }) {
  const mots = sansAccents(requete).split(/\s+/).filter((m) => m.length > 2);
  if (!mots.length) return { total: 0, resultats: [] };
  const res = [];
  for (const e of corpus()) {
    let score = 0;
    for (const m of mots) if (e.k.includes(m)) score++;
    if (score) res.push({ score, e });
  }
  res.sort((a, b) => b.score - a.score);
  const n = Math.min(Math.max(Number(limite) || 6, 1), 12);
  return {
    total: res.length,
    resultats: res.slice(0, n).map(({ e }) => ({
      reference: e.r, ouvrage: e.o, auteur: e.a || null,
      titre: e.ti, extrait: e.s, url: e.u,
      type: e.t === "g" ? "guemara" : "livre",
    })),
  };
}

// ---- sources externes ----
async function jget(url, opts = {}) {
  const r = await fetch(url, { headers: { ...UA, ...(opts.headers || {}) }, ...opts });
  if (!r.ok) throw new Error(`${r.status} sur ${url.slice(0, 80)}`);
  return r.json();
}

const OUTILS = {
  async sefaria_text({ ref, langue }) {
    const v = langue === "en" ? "&version=translation" : "&version=french&version=translation";
    const d = await jget(`${SEF}/v3/texts/${encodeURIComponent(ref)}?version=primary${v}`);
    return {
      ref: d.ref, heRef: d.heRef, lien: `https://www.sefaria.org/${(d.ref || "").replace(/ /g, "_")}`,
      versions: (d.versions || []).slice(0, 3).map((x) => ({
        langue: x.language, titre: x.versionTitle, licence: x.license,
        texte: nett(x.text).slice(0, 40),
      })),
    };
  },
  async sefaria_search({ requete, limite }) {
    const d = await jget(`${SEF}/search-wrapper`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: requete, type: "text", size: Math.min(Number(limite) || 6, 15) }),
    });
    const hits = d?.hits?.hits || d?.hits || [];
    return {
      total: d?.hits?.total ?? hits.length,
      resultats: hits.map((h) => ({
        ref: (h._id || "").split(" (")[0] || h._source?.ref,
        ouvrage: h._source?.index_title,
        extrait: nett((h.highlight?.exact || []).join(" ")).slice(0, 300),
      })),
    };
  },
  async sefaria_links({ ref, categorie }) {
    const d = await jget(`${SEF}/links/${encodeURIComponent(ref)}?with_text=0`);
    const vus2 = new Set(), out = [];
    for (const l of Array.isArray(d) ? d : []) {
      if (!l.ref || vus2.has(l.ref)) continue;
      if (categorie && l.category !== categorie) continue;
      vus2.add(l.ref);
      out.push({ ref: l.ref, categorie: l.category, ouvrage: l.index_title });
      if (out.length >= 40) break;
    }
    return { total: out.length, liens: out };
  },
  async sefaria_calendar({ date }) {
    let u = `${SEF}/calendars`;
    if (date) { const [y, m, j] = date.split("-"); u += `?year=${y}&month=${+m}&day=${+j}`; }
    const d = await jget(u);
    return {
      date: d.date,
      items: (d.calendar_items || []).map((i) => ({
        titre: i.title?.en, hebreu: i.title?.he, ref: i.ref, valeur: i.displayValue?.en,
      })),
    };
  },
  async zmanim({ ville, chabbat }) {
    const V = { paris: 2988507, marseille: 2995469, lyon: 2996944, strasbourg: 2973783,
      nice: 2990440, toulouse: 2972315, jerusalem: 281184, telaviv: 293397, bneibrak: 295514,
      londres: 2643743, newyork: 5128581, montreal: 6077243, bruxelles: 2800866, geneve: 2660646 };
    const gid = V[(ville || "paris").toLowerCase().replace(/\s/g, "")] || 2988507;
    const d = await jget(`https://www.hebcal.com/${chabbat ? "shabbat" : "zmanim"}?cfg=json&geonameid=${gid}${chabbat ? "&M=on" : ""}`);
    return chabbat
      ? { lieu: d.location?.title, evenements: (d.items || []).map((i) => ({ titre: i.title, hebreu: i.hebrew, categorie: i.category, date: i.date })) }
      : { lieu: d.location?.title, date: d.date, zmanim: d.times };
  },
  corpus_chercher: async (a) => corpusChercher(a),
};

const DECLARATIONS = [
  { name: "corpus_chercher", description: "Cherche dans les traductions francaises de ChiourimsBA (Guemara, Kabbale, Hassidout, Halakha). A PRIVILEGIER quand le texte demande y figure : c'est une traduction validee, avec un lien vers la page du site.",
    parameters: { type: "object", properties: { requete: { type: "string", description: "mots-cles en francais" }, limite: { type: "integer" } }, required: ["requete"] } },
  { name: "sefaria_text", description: "Charge le texte d'une reference precise depuis Sefaria (hebreu + traduction).",
    parameters: { type: "object", properties: { ref: { type: "string", description: "ex: Berakhot 2a, Genesis 1:1" }, langue: { type: "string", enum: ["fr", "en"] } }, required: ["ref"] } },
  { name: "sefaria_search", description: "Recherche plein texte dans tout Sefaria.",
    parameters: { type: "object", properties: { requete: { type: "string" }, limite: { type: "integer" } }, required: ["requete"] } },
  { name: "sefaria_links", description: "Commentaires lies a une reference : Rachi, Tossefot, midrash, halakha.",
    parameters: { type: "object", properties: { ref: { type: "string" }, categorie: { type: "string", description: "Commentary, Midrash, Halakhah..." } }, required: ["ref"] } },
  { name: "sefaria_calendar", description: "Calendrier d'etude : paracha, haftara, daf yomi, michna du jour.",
    parameters: { type: "object", properties: { date: { type: "string", description: "AAAA-MM-JJ" } } } },
  { name: "zmanim", description: "Horaires du jour, ou allumage et sortie de Chabbat.",
    parameters: { type: "object", properties: { ville: { type: "string" }, chabbat: { type: "boolean" } } } },
];

const SYSTEME = `Tu reponds aux lecteurs des sites ChiourimsBA, qui publient des traductions francaises de textes juifs classiques.

METHODE — non negociable
Tu ne reponds JAMAIS de memoire sur un texte. Tu charges le texte par un outil, tu le lis, puis tu reponds.
Commence par corpus_chercher : si le texte demande est deja traduit sur les sites, c'est cette traduction qui fait foi, et tu donnes le lien de la page.
Si le corpus ne l'a pas, passe a Sefaria. Pour trancher une question, va voir les commentaires avec sefaria_links.
Ne donne jamais un horaire ni une date de memoire : utilise zmanim et sefaria_calendar.
Si tu n'as pas trouve le texte, dis-le. Ne cite pas approximativement.

ECRITURE
Nom divin : ecris ה', jamais le Tetragramme en toutes lettres. Elokim s'ecrit avec un tiret : אֱ-לֹהִים.
Translitteration francaise et sefarade : Chabbat, halakha, mitsva, Choulhan Aroukh, Michna Beroura, techouva, tsadik, berakha, guemara, paracha. Jamais sh-, tz-, -os.
Ton d'enseignement sobre. Pas de lyrisme, pas de metaphores filees, pas de tournures "ce n'est pas X, c'est Y".
Glose un terme a sa premiere occurrence seulement. Ne glose jamais : il est ecrit, verset, Torah, Talmud, Guemara, Michna, Midrash, Zohar, Rachi, Tossefot, Israel, Chabbat, mitsva, berakha, tefila, halakha, paracha.

FORME
Reponse courte et dense. Termine par une section "Sources" listant chaque reference lue avec son lien.
Adapte le registre : question en francais courant sans terme hebreu, tu expliques chaque mot ; vocabulaire du beit midrash, tu vas droit au fond.`;

module.exports = async (req, res) => {
  const origine = req.headers.origin || "";
  res.setHeader("Access-Control-Allow-Origin", ORIGINES.includes(origine) ? origine : ORIGINES[0]);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ erreur: "POST attendu" });

  const cle = process.env.GEMINI_API_KEY;
  if (!cle) return res.status(500).json({ erreur: "Chat non configure." });

  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "?";
  const stop = quotaIp(ip);
  if (stop) return res.status(429).json({ erreur: stop });

  let corps = req.body;
  if (typeof corps === "string") { try { corps = JSON.parse(corps); } catch { corps = {}; } }
  const question = String(corps?.question || "").slice(0, 600).trim();
  if (!question) return res.status(400).json({ erreur: "Question vide." });

  const messages = [];
  for (const t of (corps?.historique || []).slice(-4)) {
    if (t?.role && t?.texte) messages.push({ role: t.role === "assistant" ? "model" : "user", parts: [{ text: String(t.texte).slice(0, 1500) }] });
  }
  messages.push({ role: "user", parts: [{ text: question }] });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODELE}:generateContent?key=${cle}`;
  const sources = [];
  let tours = 0;

  try {
    while (tours < 6) {
      tours++;
      const r = await fetch(url, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEME }] },
          contents: messages,
          tools: [{ functionDeclarations: DECLARATIONS }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 2400 },
        }),
      });

      if (r.status === 429) {
        return res.status(429).json({
          erreur: "Le nombre de questions offertes pour aujourd'hui est atteint. Le service reprend demain.",
        });
      }
      const d = await r.json();
      if (d.error) return res.status(502).json({ erreur: "Source indisponible.", detail: String(d.error.message).slice(0, 160) });

      const parts = d?.candidates?.[0]?.content?.parts || [];
      const appels = parts.filter((p) => p.functionCall);

      if (!appels.length) {
        const texte = parts.map((p) => p.text || "").join("").trim();
        return res.status(200).json({ reponse: texte || "Je n'ai pas trouve de reponse fondee sur un texte.", sources, tours, modele: MODELE });
      }

      messages.push({ role: "model", parts });
      const reponses = [];
      for (const { functionCall: fc } of appels) {
        let out;
        try {
          const fn = OUTILS[fc.name];
          out = fn ? await fn(fc.args || {}) : { erreur: "outil inconnu" };
          for (const x of (out.resultats || out.liens || [])) {
            const ref = x.reference || x.ref;
            if (ref && !sources.some((s) => s.ref === ref))
              sources.push({ ref, url: x.url || `https://www.sefaria.org/${String(ref).replace(/ /g, "_")}` });
          }
          if (out.ref && !sources.some((s) => s.ref === out.ref)) sources.push({ ref: out.ref, url: out.lien });
        } catch (e) {
          out = { erreur: String(e.message).slice(0, 140) };
        }
        const j = JSON.stringify(out);
        reponses.push({ functionResponse: { name: fc.name, response: { resultat: j.length > 7000 ? j.slice(0, 7000) + "…" : j } } });
      }
      messages.push({ role: "user", parts: reponses });
    }
    return res.status(200).json({ reponse: "Recherche trop longue. Reformulez plus precisement.", sources, tours, modele: MODELE });
  } catch (e) {
    return res.status(500).json({ erreur: "Erreur interne.", detail: String(e.message).slice(0, 160) });
  }
};

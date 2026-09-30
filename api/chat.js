// Chat Torah — API des sites ChiourimsBA.
// Gemini (palier gratuit) + outils : Sefaria, Hebcal, corpus francais ChiourimsBA.
// Plafond = le quota gratuit lui-meme : si Gemini refuse (429), on le dit, rien n'est facture.

// Chaque modele a son propre quota gratuit : quand l'un est a bout (429), on passe au suivant (30/09/2026).
// Liste relevee le 30/09/2026 (essai "modeles") ; un modele sans quota gratuit ou retire est simplement saute.
const MODELES = [process.env.GEMINI_MODEL || "gemini-2.5-flash", "gemini-3.5-flash", "gemini-3.8-flash",
  "gemini-2.5-flash-lite", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"];
// Dernier recours : Gemma, gratuit avec un quota bien plus large, mais sans outils (le serveur cherche lui-meme).
const GEMMAS = ["gemma-4-31b-it", "gemma-4-26b-a4b-it"];
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
  if (e.min.length >= PAR_IP_MIN) return "Trop de questions d'affilée. Réessayez dans une minute.";
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

// Index Supabase de toutes les traductions (sans Kabbale) ; l'ancien corpus reste en secours.
const SUPABASE = "https://ghcfoxbfijrdqyuhiiwe.supabase.co";
async function traductionsChercher({ requete, limite }) {
  const cle = process.env.SUPABASE_CLE;
  if (!cle) return corpusChercher({ requete, limite });
  try {
    const r = await fetch(`${SUPABASE}/rest/v1/rpc/chercher_passages`, {
      method: "POST", headers: { apikey: cle, "Content-Type": "application/json" },
      body: JSON.stringify({ question: requete, n: Math.min(Math.max(Number(limite) || 6, 1), 12) }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) throw new Error(`supabase ${r.status} ${(await r.text()).slice(0, 200)}`);
    const lignes = await r.json();
    return {
      total: lignes.length,
      resultats: lignes.map((x) => ({
        reference: x.collection === "guemara" ? x.ref : x.titre || `${x.oeuvre_titre}, ${x.ref}`,
        ouvrage: x.oeuvre_titre, titre: x.titre, extrait: (x.texte || "").slice(0, 900), url: x.url,
        type: x.collection === "guemara" ? "guemara" : "livre",
      })),
    };
  } catch (e) {
    console.error("supabase", String(e));
    return corpusChercher({ requete, limite });
  }
}

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

// ---- MCP officiel de Sefaria (heberge par Sefaria, gratuit, sans session) ----
async function mcpSefaria(nom, args) {
  const r = await fetch("https://mcp.sefaria.org/mcp", {
    method: "POST",
    headers: { ...UA, "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: nom, arguments: args } }),
  });
  const t = await r.text();
  const ligne = t.split("\n").find((l) => l.startsWith("data: "));
  const d = JSON.parse(ligne ? ligne.slice(6) : t);
  if (d.error) throw new Error(d.error.message);
  const texte = (d.result?.content || []).map((c) => c.text || "").join("\n");
  try { return JSON.parse(texte); } catch { return texte; }
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
    const hits = await mcpSefaria("text_search", { query: requete, size: Math.min(Number(limite) || 6, 15) });
    const liste = Array.isArray(hits) ? hits : [];
    return {
      total: liste.length,
      resultats: liste.map((h) => ({ ref: h.ref, ouvrage: (h.categories || []).join(" / "), extrait: nett(h.text_snippet).slice(0, 300) })),
    };
  },
  async sefaria_chercher_livre({ requete, livre }) {
    const hits = await mcpSefaria("search_in_book", { query: requete, book_name: livre, size: 8 });
    const liste = Array.isArray(hits) ? hits : [];
    return { resultats: liste.map((h) => ({ ref: h.ref, extrait: nett(h.text_snippet).slice(0, 300) })) };
  },
  async sefaria_sujet({ nom }) {
    const noms = await mcpSefaria("clarify_name_argument", { name: nom, limit: 3 });
    const cle = (noms?.completion_objects || []).find((o) => /Topic$/.test(o.type))?.key;
    if (!cle) return { erreur: "sujet introuvable", suggestions: noms?.completions || [] };
    const d = await mcpSefaria("get_topic_details", { topic_slug: cle, with_refs: true });
    return { sujet: cle, fiche: JSON.stringify(d).slice(0, 5000) };
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
  corpus_chercher: traductionsChercher,
};

const DECLARATIONS = [
  { name: "corpus_chercher", description: "Cherche dans les traductions francaises de ChiourimsBA (Guemara, Hassidout, Halakha). A PRIVILEGIER quand le texte demande y figure : c'est une traduction validee, avec un lien vers la page du site.",
    parameters: { type: "object", properties: { requete: { type: "string", description: "mots-cles en francais" }, limite: { type: "integer" } }, required: ["requete"] } },
  { name: "sefaria_text", description: "Charge le texte d'une reference precise depuis Sefaria (hebreu + traduction).",
    parameters: { type: "object", properties: { ref: { type: "string", description: "ex: Berakhot 2a, Genesis 1:1" }, langue: { type: "string", enum: ["fr", "en"] } }, required: ["ref"] } },
  { name: "sefaria_search", description: "Recherche plein texte dans tout Sefaria (MCP officiel). Les requetes en HEBREU ou ARAMEEN sont bien plus fiables qu'en francais ou en anglais : traduis les mots-cles.",
    parameters: { type: "object", properties: { requete: { type: "string" }, limite: { type: "integer" } }, required: ["requete"] } },
  { name: "sefaria_chercher_livre", description: "Recherche dans un seul livre de Sefaria (ex: livre 'Shulchan Arukh, Orach Chayim', 'Berakhot', 'Mishneh Torah'). Mots-cles en hebreu de preference.",
    parameters: { type: "object", properties: { requete: { type: "string" }, livre: { type: "string", description: "titre anglais Sefaria du livre" } }, required: ["requete", "livre"] } },
  { name: "sefaria_sujet", description: "Fiche Sefaria d'un auteur, d'un personnage ou d'un sujet (biographie, textes principaux). Ex: 'Tzadok HaKohen', 'Sukkot', 'Rashi'.",
    parameters: { type: "object", properties: { nom: { type: "string", description: "nom en anglais translittere" } }, required: ["nom"] } },
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
Reponds toujours en francais, meme quand les textes lus sont en anglais ou en hebreu.
Nom divin : ecris ה', jamais le Tetragramme en toutes lettres. Elokim s'ecrit avec un tiret : אֱ-לֹהִים.
Translitteration francaise et sefarade : Chabbat, halakha, mitsva, Choulhan Aroukh, Michna Beroura, techouva, tsadik, berakha, guemara, paracha. Jamais sh-, tz-, -os.
Ton d'enseignement sobre. Pas de lyrisme, pas de metaphores filees, pas de tournures "ce n'est pas X, c'est Y".
Glose un terme a sa premiere occurrence seulement. Ne glose jamais : il est ecrit, verset, Torah, Talmud, Guemara, Michna, Midrash, Zohar, Rachi, Tossefot, Israel, Chabbat, mitsva, berakha, tefila, halakha, paracha.

FORME
Reponse courte et dense. Termine par une section "Sources" listant chaque reference lue avec son lien.
Adapte le registre : question en francais courant sans terme hebreu, tu expliques chaque mot ; vocabulaire du beit midrash, tu vas droit au fond.`;

async function repondreGemma(question, cle) {
  const [corp, sef] = await Promise.all([
    traductionsChercher({ requete: question, limite: 6 }),
    OUTILS.sefaria_search({ requete: question, limite: 5 }).catch(() => ({ resultats: [] })),
  ]);
  const sources = [], extraits = [];
  for (const x of corp.resultats) {
    extraits.push(`[${x.reference}] (${x.url}) ${x.extrait}`);
    if (!sources.some((s) => s.url === x.url)) sources.push({ ref: x.reference, url: x.url });
  }
  for (const x of sef.resultats) {
    if (!x.ref) continue;
    extraits.push(`[${x.ref}] ${x.extrait}`);
    sources.push({ ref: x.ref, url: `https://www.sefaria.org/${x.ref.replace(/ /g, "_")}` });
  }
  const consigne = `${SYSTEME}\n\nIci tu n'as pas d'outils : reponds UNIQUEMENT d'apres les extraits ci-dessous, avec leurs references. ` +
    `S'ils ne suffisent pas, dis-le simplement et invite a reformuler.\n\nEXTRAITS\n${extraits.join("\n").slice(0, 12000) || "(aucun)"}\n\nQUESTION\n${question}`;
  // Gemma 4 renvoie parfois « Internal error » (500) sans raison : une seconde tentative par modele.
  for (const modele of [...GEMMAS, ...GEMMAS]) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modele}:generateContent?key=${cle}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: consigne }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 1500 } }),
    });
    if (!r.ok) { console.error("gemma", modele, r.status, (await r.text()).replace(/\s+/g, " ").slice(0, 600)); continue; }
    const d = await r.json();
    // Gemma 4 renvoie aussi son brouillon de reflexion (parts marquees thought) : on ne garde que la reponse.
    const texte = (d?.candidates?.[0]?.content?.parts || []).filter((p) => !p.thought).map((p) => p.text || "").join("").trim();
    if (texte) return { reponse: texte, sources, tours: 1, modele };
  }
  return null;
}

module.exports = async (req, res) => {
  const origine = req.headers.origin || "";
  res.setHeader("Access-Control-Allow-Origin", ORIGINES.includes(origine) ? origine : ORIGINES[0]);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ erreur: "POST attendu" });

  const cle = process.env.GEMINI_API_KEY;
  if (!cle) return res.status(500).json({ erreur: "Chat non configuré." });

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
  messages.push({ role: "user", parts: [{ text: `${question}\n\n(Reponse en francais.)` }] });

  if (corps?.essai === "modeles") {
    const d = await (await fetch(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=${cle}`)).json();
    return res.status(200).json({ modeles: (d.models || []).filter((x) => (x.supportedGenerationMethods || []).includes("generateContent")).map((x) => x.name) });
  }
  if (corps?.essai === "gemma") {
    const g = await repondreGemma(question, cle);
    return g ? res.status(200).json(g) : res.status(502).json({ erreur: "Gemma indisponible." });
  }

  const url = (m) => `https://generativelanguage.googleapis.com/v1beta/models/${MODELES[m]}:generateContent?key=${cle}`;
  const sources = [];
  let tours = 0, m = 0;

  try {
    while (tours < 6) {
      tours++;
      const r = await fetch(url(m), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEME }] },
          contents: messages,
          tools: [{ functionDeclarations: DECLARATIONS }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 2400 },
        }),
      });

      if (!r.ok) {
        console.error("gemini", r.status, MODELES[m], (await r.text()).replace(/\s+/g, " ").slice(0, 900));
        if (++m < MODELES.length) { tours--; continue; }
        const g = await repondreGemma(question, cle);
        if (g) return res.status(200).json(g);
        return res.status(429).json({
          erreur: "Le nombre de questions offertes pour aujourd'hui est atteint. Le service reprend demain.",
        });
      }
      const d = await r.json();
      if (d.error) return res.status(502).json({ erreur: "Source indisponible.", detail: String(d.error.message).slice(0, 160) });

      const parts = d?.candidates?.[0]?.content?.parts || [];
      const appels = parts.filter((p) => p.functionCall);

      if (!appels.length) {
        const texte = parts.filter((p) => !p.thought).map((p) => p.text || "").join("").trim();
        if (!texte) {   // réponse vide (modèle lite) : Gemma répond avec sa propre recherche
          console.error("gemini", MODELES[m], "reponse vide", d?.candidates?.[0]?.finishReason);
          const g = await repondreGemma(question, cle);
          if (g) return res.status(200).json(g);
        }
        return res.status(200).json({ reponse: texte || "Je n'ai pas trouvé de réponse fondée sur un texte.", sources, tours, modele: MODELES[m] });
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
    // Recherches epuisees : un dernier appel sans outils pour repondre avec ce qui a deja ete lu.
    messages.push({ role: "user", parts: [{ text: "Reponds maintenant EN FRANCAIS a la question avec les textes deja lus, sans nouvelle recherche. Termine par les sources." }] });
    const fin = await fetch(url(m), {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEME }] }, contents: messages,
        tools: [{ functionDeclarations: DECLARATIONS }], toolConfig: { functionCallingConfig: { mode: "NONE" } },
        generationConfig: { temperature: 0.3, maxOutputTokens: 2400 },
      }),
    });
    const df = fin.ok ? await fin.json() : {};
    const texteFin = (df?.candidates?.[0]?.content?.parts || []).filter((p) => !p.thought).map((p) => p.text || "").join("").trim();
    if (!texteFin) {   // quota épuisé au dernier appel : Gemma répond avec sa propre recherche
      console.error("gemini", fin.status, MODELES[m], "synthese vide");
      const g = await repondreGemma(question, cle);
      if (g) return res.status(200).json(g);
    }
    return res.status(200).json({ reponse: texteFin || "Recherche trop longue. Reformulez plus précisément.", sources, tours, modele: MODELES[m] });
  } catch (e) {
    return res.status(500).json({ erreur: "Erreur interne.", detail: String(e.message).slice(0, 160) });
  }
};

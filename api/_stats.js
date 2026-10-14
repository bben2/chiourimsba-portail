// Statistiques d'usage (VBA 14/10/2026 : « il me faut chaque jour le nombre de téléchargements et les questions à l'IA »).
// Une ligne par question ou par téléchargement de l'APK dans Supabase (tables questions, telechargements : anon peut
// écrire, pas lire). Aucune adresse IP. Un échec est loggé et ne bloque jamais la réponse.
const SUPABASE = "https://ghcfoxbfijrdqyuhiiwe.supabase.co";

module.exports = async function noter(table, ligne) {
  const cle = process.env.SUPABASE_CLE;
  if (!cle) return;
  try {
    const r = await fetch(`${SUPABASE}/rest/v1/${table}`, {
      method: "POST", headers: { apikey: cle, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(ligne), signal: AbortSignal.timeout(1500),
    });
    if (!r.ok) console.error("stats", table, r.status, (await r.text()).slice(0, 200));
  } catch (e) {
    console.error("stats", table, String(e));
  }
};

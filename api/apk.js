// Téléchargement de l'appli Android : compté (api/_stats.js) puis redirigé vers le fichier.
const noter = require("./_stats");

module.exports = async (req, res) => {
  if (req.method === "GET") await noter("telechargements", { quoi: "android" });   // HEAD des robots non compté
  res.setHeader("Cache-Control", "no-store");
  res.redirect(302, "/android/chiourims-torah.apk");
};

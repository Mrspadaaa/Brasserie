// Lecture seule : extrait nom, couleur EBC (min-max), extrait (substance sèche) et humidité de chaque malt
// du catalogue Weyermann « Brewery » (texte tiré du PDF par pdftotext -layout). Usage : node extraire-weyermann.mjs <texte.txt>
import fs from "node:fs";

const txt = fs.readFileSync(process.argv[2], "utf8").replace(/\r/g, "");
const nb = (s) => (s === undefined ? null : Number(s.replace(",", ".")));
const pages = txt.split(/WEYERMANN. SPECIALTY MALTS \| BREWERY\s+/).slice(1);
const rows = [];
for (const p of pages) {
  const titre = (p.split("\n")[0] ?? "").replace(/WEYERMANN. /i, "").trim();
  const nom = /Weyermann. ([A-Za-zÀ-ÿ0-9 .'®-]+?(?:Malt|Wheat|Barley)[A-Za-z0-9 ®-]*)\s*$/m.exec(p)?.[1]?.trim() ?? null;
  const couleur = /Color \(EBC\)\s+([\d.,]+)\s+([\d.,]+)\s+EBC/.exec(p);
  const couleurLigne = /Farbe:\s*([\d.,]+)\s*-\s*([\d.,]+)\s*EBC/.exec(p) ?? /Color:\s*([\d.,]+)\s*-\s*([\d.,]+)\s*EBC/.exec(p);
  const extrait = /Extract \(dry substance\)\s+([\d.,]+)/.exec(p);
  const humidite = /Moisture content\s+([\d.,]+)/.exec(p);
  rows.push({ titre: titre.slice(0, 60), nom, ebcMin: nb((couleurLigne ?? couleur)?.[1]), ebcMax: nb((couleurLigne ?? couleur)?.[2]), extraitSec: nb(extrait?.[1]), humidite: nb(humidite?.[1]) });
}
console.log(JSON.stringify(rows, null, 0).replace(/\},\{/g, "},\n{"));

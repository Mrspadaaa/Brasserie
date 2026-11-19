// Contrôle des verdicts d'une voie : node verdicts.mjs <voie> [--tests]
// RESULTAT.md : une ligne par défaut, « - <id> | corrigé | <sha> | <note> », « - <id> | écarté | — | <raison> »,
// « - <id> | ouvert | — | accord requis : … » ou « hors voie : … ».
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const dir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const [voie, opt] = process.argv.slice(2);
const v = path.join(dir, "voies", voie);
if (opt === "--tests") {
  const t = fs.existsSync(path.join(v, "tests.txt")) ? fs.readFileSync(path.join(v, "tests.txt"), "utf8") : "";
  const failed = /(\d+)\s+failed/i.exec(t);
  if (!/passed/i.test(t) || (failed && Number(failed[1]) > 0)) { console.log("TESTS KO"); process.exit(1); }
  console.log("TESTS OK"); process.exit(0);
}
const ids = fs.readFileSync(path.join(v, "BUGS-VOIE.md"), "utf8").split("\n").slice(2)
  .filter((l) => l.startsWith("|")).map((l) => l.split("|")[1].trim());
const res = fs.existsSync(path.join(v, "RESULTAT.md")) ? fs.readFileSync(path.join(v, "RESULTAT.md"), "utf8") : "";
const errs = [];
for (const id of ids) {
  const re = new RegExp(`^- ${id.replace(/[-]/g, "\\-")} \\| (corrigé|écarté|ouvert) \\| ([^|]+) \\| (.+)$`, "m");
  const m = re.exec(res);
  if (!m) { errs.push(`${id} : pas de verdict`); continue; }
  const [, etat, sha, note] = m;
  if (etat === "corrigé") {
    const s = sha.trim();
    try { execFileSync("git", ["cat-file", "-e", `${s}^{commit}`], { stdio: "ignore" }); }
    catch { errs.push(`${id} : commit ${s} introuvable`); }
  }
  if (etat !== "corrigé" && note.trim().length < 15) errs.push(`${id} : raison trop courte`);
  if (etat === "ouvert" && !/accord requis|hors voie/.test(note)) errs.push(`${id} : ouvert sans « accord requis » ni « hors voie »`);
}
if (errs.length) { console.log(errs.join("\n")); console.log("VERDICTS KO"); process.exit(1); }
console.log(`VERDICTS OK (${ids.length})`);

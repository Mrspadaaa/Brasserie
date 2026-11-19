// Outil de la voie k1 (corrections B, points 6 et 7) : réécrit NoloRecipeSimulator.tsx.
import fs from 'node:fs';
const f = 'src/ui/NoloRecipeSimulator.tsx';
let s = fs.readFileSync(f, 'utf8');
const crlf = s.includes('\r\n');
if (crlf) s = s.split('\r\n').join('\n');
const rep = (a, b) => { if (!s.includes(a)) throw new Error('absent: ' + a.slice(0, 60)); s = s.split(a).join(b); };
// point 6
rep("      : `à compléter${manque ? ` — ${manque.charAt(0).toLowerCase()}${manque.slice(1)}` : ' (données de la recette manquantes)'}`}</p>",
"      : manqueDuMoteur(manque) ? 'projection indisponible pour cette souche et ce procédé.'\n      : `à compléter${manque ? ` — ${manque.charAt(0).toLowerCase()}${manque.slice(1)}` : ' (données de la recette manquantes)'}`}</p>");
rep("/** A bounded interval on an honest shared scale;",
"/** k1 point 6 : un manque qui tient au moteur (souche ou procédé sans relation) n'est pas une donnée que le brasseur peut saisir ; on ne le renvoie pas à « compléter ». */\nconst manqueDuMoteur = (manque?: string) => !!manque && /absente? pour cette souche|absent de cette édition/i.test(manque);\n\n/** A bounded interval on an honest shared scale;");
// point 7 : déplacer le bloc Plage + Eau dans le pli des hypothèses
const iPlage = s.indexOf('      <p className="nolo-solver-confidence">');
const finEau = '      </div>}\n';
const iFinEau = s.indexOf(finEau, s.indexOf('aria-label="Eau proposée pour le scénario NOLO"')) + finEau.length;
if (iPlage < 0 || iFinEau < finEau.length) throw new Error('bloc introuvable');
const bloc = s.slice(iPlage, iFinEau);
s = s.slice(0, iPlage) + s.slice(iFinEau);
rep('      </div>\n      </details>\n', '      </div>\n' + bloc + '      </details>\n');
rep('open={invalidFields.length > 0 || undefined}>', 'open={invalidFields.length > 0 || waterBlocked || undefined}>');
fs.writeFileSync(f, crlf ? s.split('\n').join('\r\n') : s);

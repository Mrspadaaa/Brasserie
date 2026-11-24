// Continuer sans s'arrêter (brasseur, 24.11 : « créé un mécanisme qui ne te fais pas arrêté »).
// Stop de la session principale : tant que work/missions/FILE-CONTINUE.md a « actif: oui » et une ligne « - [ ] … »,
// le tour ne se termine pas (code 2) : le hook rend la tâche suivante. Le pilote coche « - [x] » une tâche prouvée,
// ou « - [attente] » ce qui attend l'utilisateur (geste irréversible ou externe), et enchaîne.
// Laisse s'arrêter : un agent (agent_id), une autre session que celle de « session: », une « pause: <ISO> » future,
// une file vide, ou trois arrêts d'affilée sans que la file change (garde-fou contre la boucle stérile).
// « session: libre » : la première session principale qui s'arrête l'adopte ; « libre-apres <id> » : toute autre que <id>
// (passage de main par hand_off_to_session).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

let e = {};
try { e = JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch { process.exit(0); }
if (e.agent_id) process.exit(0);
const racine = process.env.CLAUDE_PROJECT_DIR || e.cwd || process.cwd();
const fichier = path.join(racine, 'work/missions/FILE-CONTINUE.md');
let t; try { t = fs.readFileSync(fichier, 'utf8'); } catch { process.exit(0); }
const champ = (n) => (t.match(new RegExp(`^${n}:\\s*(.*)$`, 'm')) ?? [])[1]?.trim() ?? '';
if (champ('actif') !== 'oui') process.exit(0);

const id = e.session_id ?? '';
const sess = champ('session');
if (sess === 'libre' || (sess.startsWith('libre-apres ') && sess.slice(12).trim() !== id)) {
  t = t.replace(/^session:.*$/m, `session: ${id}`); fs.writeFileSync(fichier, t);
} else if (sess && sess !== id) process.exit(0);

const pause = Date.parse(champ('pause'));
// Une pause couvre UN seul arrêt (l'attente d'un agent) : consommée ici, elle ne laisse pas s'arrêter le tour suivant (24.11 : « Tu es arrêté ? »).
if (Number.isFinite(pause) && pause > Date.now()) { fs.writeFileSync(fichier, t.replace(/^pause:.*$/m, 'pause:')); process.exit(0); }

const ouvertes = t.split('\n').filter((l) => /^\s*- \[ \]/.test(l)).map((l) => l.replace(/^\s*- \[ \]\s*/, ''));
if (!ouvertes.length) process.exit(0);

const etat = path.join(os.tmpdir(), `continuer-${id || 'x'}.json`);
let s = {}; try { s = JSON.parse(fs.readFileSync(etat, 'utf8')); } catch { /* neuf */ }
const empreinte = crypto.createHash('sha1').update(t).digest('hex');
s.stériles = s.empreinte === empreinte ? (s.stériles ?? 0) + 1 : 0;
s.empreinte = empreinte;
fs.writeFileSync(etat, JSON.stringify(s));
if (s.stériles >= 2) process.exit(0);

process.stderr.write(
  `CONTINUER (hook, file work/missions/FILE-CONTINUE.md) : ${ouvertes.length} tâche(s) ouverte(s). Suivante : « ${ouvertes[0]} ». ` +
  `Ne t'arrête pas et ne pose pas de question : décide selon autonomie-decisions (prudent, réversible). ` +
  `Agents au premier plan (sans run_in_background). Tâche prouvée → « - [x] » ; geste irréversible ou externe → « - [attente] <ce qu'il faut> » et passe à la suivante. ` +
  `Attente d'un travail en arrière-plan : écris « pause: <ISO, ≤ 30 min> ». Contexte > 450 k : état de reprise, « session: libre-apres ${id} », puis hand_off_to_session.` +
  (s.stériles ? ` (Arrêt ${s.stériles + 1}/3 sans changement de la file : au 3e, l'arrêt passe.)` : ''));
process.exit(2);

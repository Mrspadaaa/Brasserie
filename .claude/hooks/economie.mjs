// Économie de jetons, appliquée par hook et non par mémoire (brasseur, 09.11 : « pour l'éconmoie et maximisé la qualité »).
//  PreToolUse        : refuse (code 2) un appel identique à un appel qui vient d'échouer → corriger la cause, pas relancer.
//  PostToolUseFailure: retient la clé de l'appel en échec.  PostToolUse : l'oublie ; sortie > 20 000 car. → rappel de filtrer.
//  Stop              : contexte > 450 k (lu dans le dernier usage du transcript) → une fois par palier de 100 k, code 2 :
//                      écrire l'état de reprise et passer la main (hand_off_to_session) ou compacter.
// La qualité n'est jamais rabotée : le hook ne coupe aucun contrôle, il retire seulement les répétitions et le poids mort.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let e = {};
try { e = JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch { process.exit(0); }
const f = path.join(os.tmpdir(), `economie-${e.session_id ?? 'x'}.json`);
let s = {}; try { s = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { /* neuf */ }
const garder = () => fs.writeFileSync(f, JSON.stringify(s));
const cle = () => `${e.tool_name}:${JSON.stringify(e.tool_input ?? {})}`;
const dire = (ev, t) => console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: ev, additionalContext: t } }));
const SEUIL_SORTIE = 20000, SEUIL_CONTEXTE = 450000;

switch (e.hook_event_name) {
  case 'PreToolUse':
    if (s.echec && s.echec === cle()) {
      process.stderr.write('ÉCONOMIE (hook) : cet appel est identique à celui qui vient d\'échouer. Lis l\'erreur, corrige la cause (chemin, argument, sélecteur), puis lance un appel différent.');
      process.exit(2);
    }
    break;
  case 'PostToolUseFailure':
    s.echec = cle(); garder();
    break;
  case 'PostToolUse': {
    if (s.echec) { delete s.echec; garder(); }
    const r = e.tool_response;
    const n = typeof r === 'string' ? r.length : JSON.stringify(r ?? '').length;
    if (n > SEUIL_SORTIE && !/^(Read|Write|Edit)$/.test(e.tool_name ?? ''))
      dire('PostToolUse', `ÉCONOMIE : sortie de ${Math.round(n / 1000)} k car., relue à chaque appel suivant. Prochain appel : filtre (head, grep, champs ciblés).`);
    break;
  }
  case 'Stop': {
    if (e.stop_hook_active || !e.transcript_path) break;
    let ctx = 0;
    try {
      const fd = fs.openSync(e.transcript_path, 'r'); const taille = fs.fstatSync(fd).size; const n = Math.min(taille, 2e6);
      const b = Buffer.alloc(n); fs.readSync(fd, b, 0, n, taille - n); fs.closeSync(fd);
      for (const l of b.toString('utf8').split('\n').reverse()) {
        const u = /"usage":\{[^}]*\}/.exec(l); if (!u) continue;
        const g = (k) => Number((new RegExp(`"${k}":(\\d+)`).exec(u[0]) ?? [0, 0])[1]);
        ctx = g('input_tokens') + g('cache_read_input_tokens') + g('cache_creation_input_tokens'); break;
      }
    } catch { break; }
    const palier = Math.floor(ctx / 100000);
    if (ctx > SEUIL_CONTEXTE && palier > (s.palier ?? 0)) {
      s.palier = palier; garder();
      process.stderr.write(`ÉCONOMIE (hook) : contexte ${Math.round(ctx / 1000)} k, relu à chaque appel. À un point propre : écris l'état de reprise dans le registre de la mission, puis hand_off_to_session (contexte fresh) ; sinon demande /compact au brasseur.`);
      process.exit(2);
    }
    break;
  }
}
process.exit(0);

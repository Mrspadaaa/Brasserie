// Économie de jetons, appliquée par hook et non par mémoire (brasseur, 09.11 : « pour l'éconmoie et maximisé la qualité »).
//  PreToolUse        : refuse (code 2) un appel identique à un appel qui vient d'échouer → corriger la cause, pas relancer.
//  PostToolUseFailure: retient la clé de l'appel en échec.  PostToolUse : l'oublie ; sortie > 20 000 car. → rappel de filtrer.
//  Allers-retours    : PostToolUse compte les appels du tour (remis à zéro par UserPromptSubmit) ; à 8, 16, 24… ou à 4 appels
//                      d'affilée du même outil → rappel : préparer un script ou un appel groupé qui fait tout le reste.
//  Messages          : SessionStart injecte la règle de parole ; PreToolUse refuse un SendMessage de plus de 700 caractères.
//  Stop              : contexte > 450 k (lu dans le dernier usage du transcript) → une fois par palier de 100 k, code 2 :
//                      écrire l'état de reprise et passer la main (hand_off_to_session) ou compacter.
//  Agents            : (10.11, 3,8 Md de jetons relus en 24 h par les agents, 82 % au-delà de 250 k) le contexte d'un agent est lu
//                      dans son transcript ; > 150 k → rappel de conclure ; > 200 k → tout outil refusé sauf Write/Edit : l'agent écrit
//                      son état de reprise, rend sa ligne, et le pilote relance un agent neuf sur ce fichier.
// La qualité n'est jamais rabotée : le hook ne coupe aucun contrôle, il retire seulement les répétitions et le poids mort.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let e = {};
try { e = JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch { process.exit(0); }
const f = path.join(os.tmpdir(), `economie-${e.session_id ?? 'x'}${e.agent_id ? '-' + e.agent_id : ''}.json`);
let s = {}; try { s = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { /* neuf */ }
const garder = () => fs.writeFileSync(f, JSON.stringify(s));
const cle = () => `${e.tool_name}:${JSON.stringify(e.tool_input ?? {})}`;
const dire = (ev, t) => console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: ev, additionalContext: t } }));
const SEUIL_SORTIE = 20000, SEUIL_CONTEXTE = 450000, AGENT_AVERTIR = 150000, AGENT_BLOQUER = 200000;
// Contexte du dernier appel au modèle, lu à la fin d'un transcript (2 derniers Mo).
const contexte = (fichier) => {
  try {
    const fd = fs.openSync(fichier, 'r'); const taille = fs.fstatSync(fd).size; const n = Math.min(taille, 2e6);
    const b = Buffer.alloc(n); fs.readSync(fd, b, 0, n, taille - n); fs.closeSync(fd);
    for (const l of b.toString('utf8').split('\n').reverse()) {
      const u = /"usage":\{[^}]*\}/.exec(l); if (!u) continue;
      const g = (k) => Number((new RegExp(`"${k}":(\\d+)`).exec(u[0]) ?? [0, 0])[1]);
      return g('input_tokens') + g('cache_read_input_tokens') + g('cache_creation_input_tokens');
    }
  } catch { /* illisible */ }
  return 0;
};
const transcriptAgent = () => e.agent_transcript_path
  ?? (e.transcript_path ? path.join(path.dirname(e.transcript_path), e.session_id ?? '', 'subagents', `agent-${e.agent_id}.jsonl`) : '');
const ctxAgent = e.agent_id ? contexte(transcriptAgent()) : 0;

switch (e.hook_event_name) {
  case 'SessionStart':
    dire('SessionStart', "PAROLE (brasseur, 09.11 : « pas besoin de retour juste un recap à la fin quand la tache est terminé, c'est TOUT ») : aucun rapport de progrès, ni à l'utilisateur ni à la session parente. Une fin de tour en attente (agents, tests) tient en un mot. Un seul récapitulatif quand la tâche est terminée : ce qui est fait, preuve, commit, en 400 caractères au plus. Une note intermédiaire d'une sous-session ne se relaie pas à l'utilisateur. SendMessage seulement pour une question bloquante, 700 caractères au plus.");
    break;
  case 'PreToolUse':
    if (ctxAgent > AGENT_BLOQUER && !/^(Write|Edit)$/.test(e.tool_name ?? '')) {
      process.stderr.write(`ÉCONOMIE (hook) : contexte de l'agent ${Math.round(ctxAgent / 1000)} k > 200 k, relu à chaque appel. Plus d'outil sauf Write/Edit : écris ton état de reprise (fait, preuves, fichiers, reste à faire) dans le fichier de ta voie, puis rends ta ligne en commençant par « REPRISE : <fichier> ». Le pilote relance un agent neuf.`);
      process.exit(2);
    }
    if (e.tool_name === 'SendMessage' && String(e.tool_input?.message ?? '').length > 700) {
      process.stderr.write('ÉCONOMIE (hook) : message de plus de 700 caractères refusé. Pas de rapport intermédiaire ; une question bloquante ou un récapitulatif final, courts.');
      process.exit(2);
    }
    if (s.echec && s.echec === cle()) {
      process.stderr.write('ÉCONOMIE (hook) : cet appel est identique à celui qui vient d\'échouer. Lis l\'erreur, corrige la cause (chemin, argument, sélecteur), puis lance un appel différent.');
      process.exit(2);
    }
    break;
  case 'PostToolUseFailure':
    s.echec = cle(); garder();
    break;
  case 'UserPromptSubmit':
    s.tour = 0; s.suite = 0; s.dernier = ''; garder();
    dire('UserPromptSubmit', 'PAROLE : réponse la plus courte possible. Aucun rapport de progrès, aucune note intermédiaire relayée ; une fin de tour en attente tient en un mot ; un seul récapitulatif (≤ 400 car.) quand la tâche est finie.');
    break;
  case 'PostToolUse': {
    if (s.echec) delete s.echec;
    s.tour = (s.tour ?? 0) + 1;
    s.suite = e.tool_name === s.dernier ? (s.suite ?? 0) + 1 : 1; s.dernier = e.tool_name;
    garder();
    if (s.tour % 8 === 0 || s.suite === 4)
      dire('PostToolUse', `ÉCONOMIE : ${s.tour} appels dans ce tour${s.suite >= 4 ? `, dont ${s.suite} ${e.tool_name} d'affilée` : ''}. Chaque appel relit tout le contexte : écris le reste en un seul script ou un seul appel groupé (browser_batch, javascript unique, node -e), sans perdre un contrôle.`);
    if (ctxAgent > AGENT_AVERTIR && !s.averti) { s.averti = 1; garder();
      dire('PostToolUse', `ÉCONOMIE : contexte de l'agent ${Math.round(ctxAgent / 1000)} k. À 200 k, tout outil sera refusé sauf Write/Edit. Conclus maintenant ; sinon écris ton état de reprise et rends « REPRISE : <fichier> ».`); }
    // Session principale, tour long : le Stop n'arrive qu'en fin de tour ; tous les 25 appels, relire le contexte.
    if (!e.agent_id && s.tour % 25 === 0) {
      const c = contexte(e.transcript_path); const palierTour = Math.floor(c / 100000);
      if (c > SEUIL_CONTEXTE && palierTour > (s.palierTour ?? 0)) { s.palierTour = palierTour; garder();
        dire('PostToolUse', `ÉCONOMIE : contexte ${Math.round(c / 1000)} k > 450 k, relu à chaque appel. Au prochain point propre : état de reprise dans le registre, puis hand_off_to_session (fresh).`); }
    }
    const r = e.tool_response;
    const n = typeof r === 'string' ? r.length : JSON.stringify(r ?? '').length;
    if (n > SEUIL_SORTIE && !/^(Read|Write|Edit)$/.test(e.tool_name ?? ''))
      dire('PostToolUse', `ÉCONOMIE : sortie de ${Math.round(n / 1000)} k car., relue à chaque appel suivant. Prochain appel : filtre (head, grep, champs ciblés).`);
    break;
  }
  case 'Stop': {
    if (e.stop_hook_active || !e.transcript_path) break;
    const ctx = contexte(e.transcript_path);
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

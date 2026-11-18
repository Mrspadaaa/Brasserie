// Garde « toujours lancer les sessions en /rc on » (brasseur, 09.11) : pas une consigne, un verrou.
//  PostToolUse start_session / hand_off_to_session → l'id de la session lancée entre dans une liste d'attente ;
//  PostToolUse set_remote_control dont le résultat dit « on » → l'id sort de la liste ;
//  Stop → code 2 (le tour ne se clôt pas) tant que la liste n'est pas vide. Si l'app refuse encore (« Send a message first »),
//  le second arrêt passe (stop_hook_active), la liste reste, et le verrou revient au prochain tour.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let e = {};
try { e = JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch { process.exit(0); }
const f = path.join(os.tmpdir(), `rc-attente-${e.session_id ?? 'x'}.json`);
const lire = () => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return []; } };
const ecrire = (l) => (l.length ? fs.writeFileSync(f, JSON.stringify(l)) : fs.rmSync(f, { force: true }));
const texte = (r) => (typeof r === 'string' ? r : JSON.stringify(r ?? ''));
const ids = (s) => [...new Set(s.match(/local_[0-9a-f]{8}-[0-9a-f-]{27}/g) ?? [])];

const outil = e.tool_name ?? '';
if (e.hook_event_name === 'PostToolUse') {
  const r = texte(e.tool_response);
  if (/start_session$|hand_off_to_session$/.test(outil) && /Started session|session_id/i.test(r)) {
    const neufs = ids(r).filter((id) => !/initiation.*own_initiative/.test(JSON.stringify(e.tool_input)));
    if (neufs.length) {
      ecrire([...new Set([...lire(), ...neufs])]);
      console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: `Règle du brasseur : appelle tout de suite set_remote_control {session_id: "${neufs[0]}", enabled: true}. Le tour ne pourra pas se clore avant.` } }));
    }
  } else if (/set_remote_control$/.test(outil) && /"remoteControlState"\s*:\s*"on"|remoteControlState.{0,6}on/.test(r)) {
    const id = e.tool_input?.session_id;
    ecrire(lire().filter((x) => x !== id));
  }
  process.exit(0);
}
if (e.hook_event_name === 'Stop') {
  const l = lire();
  if (!l.length || e.stop_hook_active) process.exit(0);
  process.stderr.write(`REMOTE CONTROL (hook rc-sessions) : session(s) lancée(s) sans /rc on : ${l.join(', ')}. Appelle set_remote_control {session_id, enabled: true} pour chacune ; si l'app répond « Send a message first », réessaie à sa première note.`);
  process.exit(2);
}

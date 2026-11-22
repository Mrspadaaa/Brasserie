// Journal de ses paroles (brasseur, 16.11 : « Met en place des choses pour plus perdre autant de temps ni pour plus perdre mes retours... »).
// UserPromptSubmit → chaque message de l'utilisateur, mot pour mot, horodaté, avec le titre de la session, ajouté à
// ~/.claude/paroles/AAAA-MM-JJ.md (hors Git). Les notifications système et le contexte ajouté par les hooks sont ignorés ;
// une image jointe est notée « [image jointe] ». Ne bloque jamais l'envoi : toute erreur est avalée, code 0, rien sur stdout.
// Contrôle : node scripts/agents/systeme.mjs paroles [AAAA-MM-JJ] (messages du jour absents de SPEC-BRASSEUR.md).
// Source : .claude/hooks/paroles.mjs ; copie installée : ~/.claude/hooks/paroles.mjs ; déclaration : ~/.claude/settings.json.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Messages produits par le système ou par un autre agent, pas par l'utilisateur.
const AUTOMATIQUES = [
  /^<task-notification>/, /^<cross-session-message/, /^Another Claude session sent a message/, /^This session is being continued/,
  /^Base directory for this skill/, /^\[Request interrupted/, /^<command-(name|message|args)>/, /^<local-command-(stdout|stderr)>/,
  /^Caveat: The messages below were generated/, /^<user-prompt-submit-hook>/, /^<bash-(input|stdout|stderr)>/,
];
// Blocs ajoutés par le système ou les hooks à l'intérieur d'un message.
const BLOCS = /<(system-reminder|user-prompt-submit-hook|hook-[a-z-]+|additional-context)>[\s\S]*?<\/\1>/g;
const IMAGE = /\[Image(?: #\d+)?(?::[^\]]*)?\]/g;

export function nettoyer(brut) {
  let t = String(brut ?? '').replace(BLOCS, '').trim();
  if (AUTOMATIQUES.some((r) => r.test(t))) return null;
  const image = /\[Image(?: #\d+)?(?::[^\]]*)?\]/.test(t);
  t = t.replace(IMAGE, '').trim();
  // Une commande seule (« /rc on », « /compact ») n'est pas un retour.
  if (/^\/[a-z][\w:-]*(\s+\S+)?$/i.test(t) && t.length <= 40) return null;
  return { texte: t, image };
}

export function titreSession(transcript) {
  try {
    const taille = fs.statSync(transcript).size;
    const fd = fs.openSync(transcript, 'r');
    const n = Math.min(taille, 4 * 1024 * 1024);
    const tampon = Buffer.alloc(n);
    fs.readSync(fd, tampon, 0, n, taille - n);
    fs.closeSync(fd);
    const lignes = tampon.toString('utf8').split('\n').reverse();
    for (const cle of ['customTitle', 'agentName']) {
      for (const l of lignes) {
        if (!l.includes(`"${cle}"`)) continue;
        try { const o = JSON.parse(l); if (o[cle]) return String(o[cle]); } catch { /* ligne tronquée */ }
      }
    }
  } catch { /* pas de transcript */ }
  return null;
}

const deux = (n) => String(n).padStart(2, '0');

export function consigner(e, dossier = process.env.PAROLES_DIR || path.join(os.homedir(), '.claude', 'paroles'), maintenant = new Date()) {
  if (e.hook_event_name && e.hook_event_name !== 'UserPromptSubmit') return null;
  const m = nettoyer(e.prompt);
  if (!m) return null;
  // Un message vide après nettoyage ne part que s'il portait une pièce jointe : on le note comme image.
  const image = m.image || !m.texte || (Array.isArray(e.images) && e.images.length > 0) || (Array.isArray(e.attachments) && e.attachments.some((a) => /image/i.test(JSON.stringify(a))));
  const jour = `${maintenant.getFullYear()}-${deux(maintenant.getMonth() + 1)}-${deux(maintenant.getDate())}`;
  const heure = `${deux(maintenant.getHours())}:${deux(maintenant.getMinutes())}:${deux(maintenant.getSeconds())}`;
  const titre = (titreSession(e.transcript_path ?? '') || path.basename(e.cwd ?? '') || 'session sans titre').replace(/\s+/g, ' ');
  const id = String(e.session_id ?? '').slice(0, 8);
  const corps = [m.texte, image ? '[image jointe]' : ''].filter(Boolean).join('\n');
  const barrieres = Math.max(3, ...(corps.match(/`+/g) ?? []).map((b) => b.length + 1));
  const clot = '`'.repeat(barrieres);
  const entree = `\n### ${jour} ${heure} · ${titre} · ${id}\n\n${clot}text\n${corps}\n${clot}\n`;
  fs.mkdirSync(dossier, { recursive: true });
  const fichier = path.join(dossier, `${jour}.md`);
  if (!fs.existsSync(fichier)) fs.writeFileSync(fichier, `# Ses paroles du ${jour}\n\nMot pour mot, une entrée par message (hook paroles.mjs). Hors Git.\n`);
  fs.appendFileSync(fichier, entree);
  return fichier;
}

// Lecture d'un journal : [{ jour, heure, titre, session, texte }].
export function lireJournal(contenu) {
  const res = [];
  const re = /^### (\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) · (.*) · (\w*)\n\n(`{3,})text\n([\s\S]*?)\n\5\n/gm;
  for (const m of contenu.matchAll(re)) res.push({ jour: m[1], heure: m[2], titre: m[3], session: m[4], texte: m[6] });
  return res;
}

const direct = process.argv[1] && path.resolve(process.argv[1]).endsWith(`${path.sep}paroles.mjs`) && path.basename(path.dirname(path.resolve(process.argv[1]))) === 'hooks';
if (direct) {
  try {
    const e = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
    consigner(e);
  } catch { /* jamais bloquer l'envoi */ }
  process.exit(0);
}

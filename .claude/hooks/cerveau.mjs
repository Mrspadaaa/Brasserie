#!/usr/bin/env node
// Hook du second cerveau (docs/agents/systeme.md, boucle de retour).
// UserPromptSubmit : une phrase de correction ou de plainte rappelle d'en tirer un contrôle ou une leçon.
// PostToolUse (Edit|Write) : une écriture dans cerveau/ est contrôlée ; ses erreurs reviennent à l'agent (code 2).
// Une écriture dans DEFAUTS-RECURRENTS.md régénère sa vue courte, DEFAUTS-COURT.md.
// Une écriture dans un script de contrôle que des GATES appellent rappelle de les rejouer (23.10 : verifier-page).
// Ne bloque jamais une demande ; n'écrit rien d'autre.
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const { estCorrection, verifierCerveau, ecrireDefautsCourt, appelsDansGates } = await import(pathToFileURL(path.join(RACINE, 'scripts', 'agents', 'systeme.mjs')).href);

const RAPPEL = [
  'Rappel du système (hook cerveau) : ce message ressemble à une correction ou à une plainte.',
  'Avant de clore le tour : (1) défaut du produit → ligne dans work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md avec ses mots,',
  'et contrôle qui échoue sur la version rejetée (leçon L13) ; (2) erreur de méthode des agents → leçon dans cerveau/LECONS.md',
  '(format Lnn, pilote seul) ; (3) savoir durable → note du cerveau. Ignorer si ce n\'est pas une correction.',
].join(' ');

let brut = '';
for await (const morceau of process.stdin) brut += morceau;
let entree = {};
try { entree = JSON.parse(brut || '{}'); } catch { process.exit(0); }

if (entree.hook_event_name === 'UserPromptSubmit') {
  if (estCorrection(entree.prompt)) {
    process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: RAPPEL } }));
  }
  process.exit(0);
}

if (entree.hook_event_name === 'PostToolUse') {
  const fichier = entree.tool_input?.file_path;
  const dir = path.resolve(process.env.CERVEAU_DIR || path.join(RACINE, 'cerveau'));
  if (!fichier) process.exit(0);
  const cible = path.resolve(fichier);
  // La vue courte des défauts suit sa source à chaque écriture (élagage du 22.10).
  if (path.basename(cible) === 'DEFAUTS-RECURRENTS.md') { ecrireDefautsCourt(); process.exit(0); }
  // La portée des défauts est lue par systeme.mjs mission : un défaut « garde » ajouté rend son contrôle obligatoire
  // pour les voies d'écran (23.10 : D106 ajouté, trois témoins positifs cassés sans que rien ne le dise).
  if (path.basename(cible) === 'portee-defauts.json') {
    const rappel = 'Rappel du système (hook cerveau) : portee-defauts.json est lu par systeme.mjs mission. Avant de commiter, '
      + 'node scripts/agents/systeme.mjs temoins, puis systeme.mjs mission sur les missions en cours.';
    process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: rappel } }));
    process.exit(0);
  }
  if (/\.mjs$/i.test(cible) && /[\\/](scripts[\\/]agents|tournoi[\\/]outils)[\\/]/i.test(cible)) {
    const n = appelsDansGates(cible).length;
    const nom = path.basename(cible);
    const rappel = `Rappel du système (hook cerveau) : ${nom} est appelé par ${n} critères de GATES. Avant de commiter, `
      + `node scripts/agents/systeme.mjs appels ${nom} --rejouer (23.10 : verifier-page durci a fait échouer 23 voies).`;
    if (n) process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: rappel } }));
    process.exit(0);
  }
  if (!cible.toLowerCase().startsWith(dir.toLowerCase() + path.sep)) process.exit(0);
  // Seules les erreurs du fichier écrit reviennent : une écriture en plusieurs temps n'est pas punie pour le reste.
  // Le budget du savoir chargé partout revient aussi quand on écrit INDEX.md ou LECONS.md, qui en font partie.
  const memeFichier = (f) => path.resolve(f).toLowerCase() === cible.toLowerCase();
  const charge = (e) => /^savoir chargé partout/.test(e.msg) && /^(INDEX|LECONS)\.md$/i.test(path.basename(cible));
  const erreurs = verifierCerveau({ dir, voie: true, minNotes: 0, minLecons: 0 }).erreurs.filter((e) => memeFichier(e.fichier) || charge(e));
  if (erreurs.length) {
    process.stderr.write(`CERVEAU ECHEC (${path.basename(cible)}) :\n${erreurs.map((e) => `- ${e.msg}`).join('\n')}\nFormat : cerveau/INDEX.md ; leçons : en-tête de cerveau/LECONS.md.\n`);
    process.exit(2);
  }
}
process.exit(0);

#!/usr/bin/env node
// Contrôles du système d'agents (docs/agents/systeme.md).
// Usage : node scripts/agents/systeme.mjs <commande> [options]
//   cerveau [--voie] [--min-notes N] [--min-lecons N] [--fichiers p1,p2] [--dir D]  second cerveau et leçons
//   chercher <mots…>                                              retrouver une note ou une leçon
//   note <fichier> --exiger "A,B" [--contient "x,y"]               une note de voie a ses parties
//   existent <fichier…>                                            les livrables d'une voie existent
//   fidelite <source> <note…>                                      condenser sans perdre citations ni nombres
//   exporter [--vers fichier] [--avec-spec]                         un fichier consolidé pour NotebookLM
//   agents [--dir D]                                               agents des voies et du conseil
//   conseil <transcription>|--dernier [--dir D]                    transcription complète du conseil
//   voies <mission> [--modeles haiku,sonnet] [--approuver]         rejoue les critères de chaque voie
//   mission <MISSION.md> [--min-voies N]                           plan de mission routé
//   hooks                                                          hooks branchés et réactifs
//   cablage                                                        CLAUDE.md, skills, doc, git
//   temoins                                                        chaque contrôle échoue sur son témoin
//   echoue <JETON> -- <commande> <args…>                           témoin négatif d'un GATES (leçon L13)
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const GATE_CHECK = path.join(RACINE, '.claude', 'skills', 'unlazy', 'scripts', 'gate-check.mjs');
const TYPES = ['brasseur', 'metier', 'produit', 'agents', 'sources', 'decisions'];
const MODELES = ['haiku', 'sonnet', 'opus', 'fable', 'inherit'];
const REGARDS = ['Brasseur', 'Contradicteur', 'Audacieux', 'Premiers principes', 'Bâtisseur', 'Regard neuf'];
const VERDICT = ["Où le conseil s'accorde", 'Où il se divise', 'Angles morts', 'Recommandation', 'Premier geste'];
const DECIDEURS = ['voie', 'pilote', 'conseil', 'brasseur', 'utilisateur'];
const NIVEAUX = ['mécanique', 'jugement', 'conception'];

const lire = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const existe = (f) => fs.existsSync(f);
const sansAccents = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’`]/g, "'");
const rel = (f) => path.relative(RACINE, f).split(path.sep).join('/');

export function enTete(texte) {
  if (!texte.startsWith('---\n')) return null;
  const fin = texte.indexOf('\n---', 4);
  if (fin < 0) return null;
  const champs = {};
  for (const ligne of texte.slice(4, fin).split('\n')) {
    const m = ligne.match(/^([\w-]+):\s*(.*)$/);
    if (m) champs[m[1]] = m[2].trim();
  }
  return { champs, corps: texte.slice(texte.indexOf('\n', fin + 1) + 1) };
}

const liens = (texte) => [...texte.matchAll(/\[\[([^\]|#]+)\]\]/g)].map((m) => m[1].trim());

function notesDu(dir) {
  const notes = [];
  for (const type of TYPES) {
    const d = path.join(dir, type);
    if (!existe(d)) continue;
    for (const nom of fs.readdirSync(d)) if (nom.endsWith('.md')) notes.push({ type, fichier: path.join(d, nom) });
  }
  return notes;
}

export function verifierLecons(fichier, { min = 12 } = {}) {
  const erreurs = [];
  if (!existe(fichier)) return [{ fichier, msg: 'LECONS.md absent' }];
  const texte = lire(fichier);
  const lignes = texte.split('\n');
  if (lignes.length > 170) erreurs.push({ fichier, msg: `${lignes.length} lignes (170 au plus) : fusionner ou mécaniser` });
  const blocs = texte.split(/\n(?=#{2,3} )/);
  const ids = new Set();
  let actives = 0;
  let section = '';
  for (const bloc of blocs) {
    if (bloc.startsWith('## ')) { section = bloc.split('\n')[0]; continue; }
    const m = bloc.match(/^### (L\d{2,3}) — (.+)/);
    if (!m) continue;
    if (/Mécanisées/.test(section)) continue;
    actives += 1;
    if (ids.has(m[1])) erreurs.push({ fichier, msg: `${m[1]} en double` });
    ids.add(m[1]);
    for (const champ of ['Erreur', 'Cause', 'Faire', 'Rôles', 'Contrôle']) {
      if (!new RegExp(`^- ${champ} : \\S`, 'm').test(bloc)) erreurs.push({ fichier, msg: `${m[1]} sans « - ${champ} : »` });
    }
  }
  if (actives > 30) erreurs.push({ fichier, msg: `${actives} leçons actives (30 au plus)` });
  if (actives < min) erreurs.push({ fichier, msg: `${actives} leçons (${min} au moins)` });
  return erreurs.length ? erreurs : { actives };
}

export function verifierCerveau({ dir = path.join(RACINE, 'cerveau'), voie = false, minNotes = 15, minLecons = 12 } = {}) {
  const erreurs = [];
  const avert = [];
  const index = path.join(dir, 'INDEX.md');
  if (!existe(index)) return { erreurs: [{ fichier: index, msg: 'INDEX.md absent' }], avert, notes: 0, lecons: 0 };
  const texteIndex = lire(index);
  if (texteIndex.split('\n').length > 80) erreurs.push({ fichier: index, msg: 'INDEX.md dépasse 80 lignes' });
  const resLecons = verifierLecons(path.join(dir, 'LECONS.md'), { min: minLecons });
  if (Array.isArray(resLecons)) erreurs.push(...resLecons);
  const notes = notesDu(dir);
  const noms = new Set();
  for (const { type, fichier } of notes) {
    const nom = path.basename(fichier, '.md');
    const e = enTete(lire(fichier));
    if (!e) { erreurs.push({ fichier, msg: 'en-tête --- absent' }); continue; }
    const c = e.champs;
    if (c.name !== nom) erreurs.push({ fichier, msg: `name « ${c.name ?? ''} » ≠ nom du fichier « ${nom} »` });
    if (!c.description) erreurs.push({ fichier, msg: 'description vide' });
    if (c.type !== type) erreurs.push({ fichier, msg: `type « ${c.type ?? ''} » ≠ dossier « ${type} »` });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(c.maj ?? '')) erreurs.push({ fichier, msg: 'maj absente (AAAA-MM-JJ)' });
    if (!c.sources) erreurs.push({ fichier, msg: 'sources absentes' });
    if (type !== 'decisions' && e.corps.trim().split('\n').length > 50) erreurs.push({ fichier, msg: 'corps de plus de 50 lignes : scinder ou pointer' });
    if (noms.has(nom)) erreurs.push({ fichier, msg: `nom « ${nom} » déjà pris dans un autre dossier` });
    noms.add(nom);
    if (!texteIndex.includes(`[[${nom}]]`)) (voie ? avert : erreurs).push({ fichier, msg: `note absente de la carte d'INDEX.md` });
  }
  for (const fichier of [index, path.join(dir, 'LECONS.md'), ...notes.map((n) => n.fichier)]) {
    if (!existe(fichier)) continue;
    for (const cible of liens(lire(fichier))) if (!noms.has(cible)) erreurs.push({ fichier, msg: `lien [[${cible}]] sans note` });
  }
  if (notes.length < minNotes) erreurs.push({ fichier: dir, msg: `${notes.length} notes (${minNotes} au moins)` });
  return { erreurs, avert, notes: notes.length, lecons: Array.isArray(resLecons) ? 0 : resLecons.actives };
}

export function chercher(mots, dir = path.join(RACINE, 'cerveau')) {
  const termes = mots.map(sansAccents).filter((t) => t.length > 1);
  const res = [];
  const compter = (texte, t) => Math.min(5, sansAccents(texte).split(t).length - 1);
  for (const { fichier } of notesDu(dir)) {
    const e = enTete(lire(fichier));
    const desc = e?.champs.description ?? '';
    let score = 0;
    for (const t of termes) score += 3 * compter(path.basename(fichier), t) + 2 * compter(desc, t) + compter(e?.corps ?? '', t);
    if (score) res.push({ score, ou: rel(fichier), quoi: desc });
  }
  const lecons = path.join(dir, 'LECONS.md');
  if (existe(lecons)) for (const bloc of lire(lecons).split(/\n(?=### )/)) {
    const m = bloc.match(/^### (L\d+) — (.+)/);
    if (!m) continue;
    let score = 0;
    for (const t of termes) score += 2 * compter(m[2], t) + compter(bloc, t);
    if (score) res.push({ score, ou: `${rel(lecons)} ${m[1]}`, quoi: m[2] });
  }
  return res.sort((a, b) => b.score - a.score).slice(0, 8);
}

export function verifierNote(fichier, exiger = []) {
  const erreurs = [];
  if (!existe(fichier)) return [`${fichier} absent`];
  const texte = lire(fichier);
  const dansCerveau = rel(path.resolve(fichier)).startsWith('cerveau/');
  if (dansCerveau && !enTete(texte)) erreurs.push('en-tête --- absent');
  for (const partie of exiger) {
    const re = new RegExp(`^(#{1,4} ${partie}|\\*\\*${partie}\\*\\*|${partie} :)`, 'mi');
    if (!re.test(texte)) erreurs.push(`partie « ${partie} » absente`);
  }
  return erreurs;
}

export function exporterCerveau(dir, { avecSpec = false } = {}) {
  const titres = { brasseur: 'Le brasseur', metier: 'Métier', produit: 'Produit', agents: 'Façon de travailler', sources: 'Sources', decisions: 'Décisions du conseil' };
  const commit = spawnSync('git', ['log', '-1', '--format=%h %cs'], { cwd: RACINE, encoding: 'utf8' }).stdout.trim();
  const sansLiens = (t) => t.replace(/\[\[([^\]]+)\]\]/g, '« $1 »');
  const morceaux = [
    `# Second cerveau de L'Affinée — export pour NotebookLM`,
    `Exporté le ${new Date().toISOString().slice(0, 10)} depuis le dépôt (commit ${commit}). Copie en lecture : la source de vérité est le dossier cerveau/ du dépôt. Une note dit ce qui était vrai à sa date ; les paroles exactes du brasseur sont dans SPEC-BRASSEUR.`,
    `## Leçons des agents\n\n${sansLiens(lire(path.join(dir, 'LECONS.md')).replace(/^# .*\n/, '').replace(/^(#{2,3}) /gm, (_, h) => `${h}# `))}`,
  ];
  const notes = notesDu(dir);
  for (const type of TYPES) {
    const duType = notes.filter((n) => n.type === type);
    if (!duType.length) continue;
    morceaux.push(`## ${titres[type]}`);
    for (const { fichier } of duType) {
      const e = enTete(lire(fichier));
      const c = e?.champs ?? {};
      // Les titres internes descendent de deux crans pour rester sous la note.
      const corps = (e?.corps ?? lire(fichier)).replace(/^(#{1,4}) /gm, (_, h) => `${'#'.repeat(Math.min(h.length + 2, 6))} `);
      morceaux.push(`### ${c.name ?? path.basename(fichier, '.md')}\n\n*${c.description ?? ''}* (mise à jour : ${c.maj ?? '?'} ; sources : ${c.sources ?? '?'})\n\n${sansLiens(corps.trim())}`);
    }
  }
  if (avecSpec) morceaux.push(`## Paroles du brasseur (SPEC-BRASSEUR)\n\n${lire(path.join(RACINE, 'work', 'refonte-frontend', 'v4', 'SPEC-BRASSEUR.md')).replace(/^(#{1,4}) /gm, '### ')}`);
  const texte = `${morceaux.join('\n\n')}\n`;
  return { texte, notes: notes.length, mots: texte.split(/\s+/).filter(Boolean).length };
}

export function verifierFidelite(srcBrute, cibleBrute) {
  // L'en-tête technique de la source (identifiants, horodatages) n'est pas du contenu à garder.
  const src = enTete(srcBrute)?.corps ?? srcBrute;
  // Une citation coupée en fin de ligne dans la source reste la même citation dans la note.
  const plat = (s) => s.replace(/\s+/g, ' ');
  const cible = plat(cibleBrute);
  const citations = [...new Set([...src.matchAll(/«\s*([^»]+?)\s*»/g)].map((m) => plat(m[1])))];
  const nombres = [...new Set(src.match(/\d+(?:[.,]\d+)?/g) ?? [])];
  const perdus = [...citations.filter((c) => !cible.includes(c)).map((c) => `citation perdue : « ${c.slice(0, 70)} »`),
    ...nombres.filter((n) => !cible.includes(n)).map((n) => `nombre perdu : ${n}`)];
  return { perdus, citations: citations.length, nombres: nombres.length };
}

export function verifierAgents(dir = path.join(RACINE, '.claude', 'agents')) {
  const attendus = { executant: 'haiku', auteur: 'sonnet', relecteur: 'sonnet', concepteur: 'opus', critique: 'fable', conseiller: null };
  const erreurs = [];
  for (const [nom, modele] of Object.entries(attendus)) {
    const fichier = path.join(dir, `${nom}.md`);
    if (!existe(fichier)) { erreurs.push(`${nom}.md absent`); continue; }
    const e = enTete(lire(fichier));
    if (!e) { erreurs.push(`${nom} : en-tête absent`); continue; }
    const c = e.champs;
    if (c.name !== nom) erreurs.push(`${nom} : name ≠ ${nom}`);
    if (!c.description) erreurs.push(`${nom} : description vide`);
    if (!c.tools) erreurs.push(`${nom} : tools absent`);
    if (!MODELES.includes(c.model)) erreurs.push(`${nom} : model « ${c.model ?? ''} » inconnu`);
    if (modele && c.model !== modele) erreurs.push(`${nom} : model ${c.model} au lieu de ${modele}`);
    const tours = Number(c.maxTurns);
    if (!Number.isInteger(tours) || tours < 5 || tours > 200) erreurs.push(`${nom} : maxTurns absent ou hors 5..200 (plafond de dépense)`);
    if (!e.corps.includes('LEÇON PROPOSÉE')) erreurs.push(`${nom} : ne demande pas « LEÇON PROPOSÉE »`);
    if (nom !== 'conseiller' && !(e.corps.includes('RESULTAT.md') && /une ligne/i.test(e.corps))) erreurs.push(`${nom} : contrat RESULTAT.md + retour en une ligne absent`);
  }
  return erreurs;
}

export function verifierConseil(fichier) {
  const erreurs = [];
  if (!existe(fichier)) return [`${fichier} absent`];
  const texte = lire(fichier);
  const e = enTete(texte);
  if (!e || e.champs.type !== 'decisions') erreurs.push('en-tête de note (type: decisions) absent');
  const section = (titre) => {
    const i = texte.search(new RegExp(`^## ${titre}`, 'm'));
    if (i < 0) return null;
    const suite = texte.slice(i + 3);
    const j = suite.search(/^## /m);
    return j < 0 ? suite : suite.slice(0, j);
  };
  for (const s of ['Question cadrée', 'Type de décision', 'Regards', 'Revues', 'Correspondance', 'Verdict']) if (section(s) === null) erreurs.push(`section « ## ${s} » absente`);
  const type = section('Type de décision') ?? '';
  if (!/(déléguée|brasseur|utilisateur)/i.test(type)) erreurs.push('type de décision non routé (déléguée, brasseur ou utilisateur)');
  const regards = section('Regards') ?? '';
  for (const r of REGARDS) {
    const m = regards.match(new RegExp(`^### ${r}[^\\n]*\\n([\\s\\S]*?)(?=^### |$(?![\\s\\S]))`, 'm'));
    if (!m) erreurs.push(`regard « ${r} » absent`);
    else if (m[1].trim().split(/\s+/).length < 60) erreurs.push(`regard « ${r} » trop court (< 60 mots)`);
  }
  // Mode rapide (déclaré dans le type de décision) : six avis et le président, sans revue anonyme.
  if (!/\brapide\b/i.test(type)) {
    const revues = (section('Revues') ?? '').match(/^### Revue/gm) ?? [];
    if (revues.length < 3) erreurs.push(`${revues.length} revues anonymes (3 au moins)`);
    const corr = section('Correspondance') ?? '';
    const lettres = corr.match(/^- Réponse [A-F] = /gm) ?? [];
    if (lettres.length < 6) erreurs.push(`correspondance incomplète (${lettres.length}/6 lettres)`);
  }
  const verdict = section('Verdict') ?? '';
  for (const v of VERDICT) if (!new RegExp(`^### ${v}`, 'm').test(verdict)) erreurs.push(`verdict sans « ### ${v} »`);
  return erreurs;
}

function dernierConseil(dir) {
  const d = path.join(dir, 'decisions');
  if (!existe(d)) return null;
  const f = fs.readdirSync(d).filter((n) => /^\d{4}-\d{2}-\d{2}-.+\.md$/.test(n)).sort().pop();
  return f ? path.join(d, f) : null;
}

// Un critère se rejoue depuis un clone neuf : un script appelé par un CHECK ne doit pas être ignoré par
// git (22.10 : un contrôle posé dans work/missions/ l'était, seuls les .md et .json y sont suivis).
export function criteresNonVersionnes(gates) {
  const scripts = new Set();
  for (const l of lire(gates).split('\n')) {
    const m = l.match(/^\s*CHECK:\s*(.*)$/);
    if (!m) continue;
    for (const t of m[1].split(/[\s"'`()]+/)) if (t.includes('/') && /^[\w.\-/]+\.(mjs|cjs|js|ts)$/.test(t)) scripts.add(t);
  }
  return [...scripts].filter((s) => spawnSync('git', ['check-ignore', '-q', s], { cwd: RACINE }).status === 0);
}

function gateCheck(args, cwd) {
  const r = spawnSync(process.execPath, [GATE_CHECK, ...args], { cwd, encoding: 'utf8', timeout: 900_000 });
  return { code: r.status, sortie: `${r.stdout ?? ''}${r.stderr ?? ''}` };
}

export function verifierVoies(mission, { modeles = [], approuver = false, racine = RACINE } = {}) {
  const lignes = [];
  const dirVoies = path.join(mission, 'voies');
  if (!existe(dirVoies)) return { ok: false, lignes: [`${dirVoies} absent`] };
  const voies = fs.readdirSync(dirVoies).filter((n) => fs.statSync(path.join(dirVoies, n)).isDirectory()).sort();
  if (voies.length < 2) lignes.push(`ECHEC mission — ${voies.length} voie (2 au moins)`);
  const vus = new Set();
  let bonnes = 0;
  for (const v of voies) {
    const d = path.join(dirVoies, v);
    const manque = ['VOIE.md', 'GATES.md', 'RESULTAT.md'].filter((f) => !existe(path.join(d, f)));
    if (manque.length) { lignes.push(`ECHEC ${v} — manque ${manque.join(', ')}`); continue; }
    const modele = (lire(path.join(d, 'VOIE.md')).match(/^- Modèle : (\w+)/m) ?? [])[1];
    if (modele) vus.add(modele);
    const premiere = lire(path.join(d, 'RESULTAT.md')).split('\n').find((l) => l.trim()) ?? '';
    if (!/^OK\b/.test(premiere)) { lignes.push(`ECHEC ${v} — RESULTAT : ${premiere.slice(0, 90)}`); continue; }
    const ignores = criteresNonVersionnes(path.join(d, 'GATES.md'));
    if (ignores.length) { lignes.push(`ECHEC ${v} — critère non versionné (ignoré par git) : ${ignores.join(', ')}`); continue; }
    if (approuver) gateCheck(['--approve', '--cwd', racine, path.join(d, 'GATES.md')], racine);
    const g = gateCheck(['--reverify', '--cwd', racine, path.join(d, 'GATES.md')], racine);
    if (g.code !== 0) {
      const raison = (g.sortie.match(/^.*(unmet|not approved|pending|FAIL|failed).*$/im) ?? ['critères non tenus'])[0];
      lignes.push(`ECHEC ${v} — rapport OK mais critères rejoués en échec : ${raison.trim().slice(0, 90)}`);
      continue;
    }
    bonnes += 1;
    lignes.push(`OK ${v} (${modele ?? '?'}) — ${premiere.replace(/^OK\s*[—-]?\s*/, '').slice(0, 90)}`);
  }
  for (const m of modeles) if (!vus.has(m)) lignes.push(`ECHEC mission — aucune voie ${m}`);
  const ok = voies.length >= 2 && bonnes === voies.length && modeles.every((m) => vus.has(m));
  lignes.push(ok ? `VOIES OK ${bonnes}/${voies.length}` : `VOIES ECHEC ${bonnes}/${voies.length}`);
  return { ok, lignes };
}

export function verifierMission(fichier, { minVoies = 2 } = {}) {
  const erreurs = [];
  if (!existe(fichier)) return [`${fichier} absent`];
  const texte = lire(fichier);
  for (const s of ['Objectif', 'Décisions', 'Voies', 'Boucle de retour', 'Sources']) if (!new RegExp(`^## ${s}`, 'm').test(texte)) erreurs.push(`section « ## ${s} » absente`);
  const table = (titre) => {
    const i = texte.search(new RegExp(`^## ${titre}`, 'm'));
    if (i < 0) return [];
    const bloc = texte.slice(i).split(/\n## /)[0];
    const rangs = bloc.split('\n').filter((l) => l.startsWith('|')).map((l) => l.split('|').slice(1, -1).map((c) => c.trim()));
    if (rangs.length < 3) return [];
    const tete = rangs[0].map(sansAccents);
    return rangs.slice(2).map((r) => Object.fromEntries(tete.map((h, i) => [h, r[i] ?? ''])));
  };
  const voies = table('Voies');
  if (voies.length < minVoies) erreurs.push(`${voies.length} voies (${minVoies} au moins)`);
  for (const v of voies) {
    const id = v.voie || '?';
    if (!NIVEAUX.includes(v.niveau)) erreurs.push(`${id} : niveau « ${v.niveau} » (mécanique, jugement, conception)`);
    if (!MODELES.includes(v.modele)) erreurs.push(`${id} : modèle « ${v.modele} » inconnu`);
    if (!/^\d+$/.test(v.plafond ?? '')) erreurs.push(`${id} : plafond de tours absent`);
    if (!DECIDEURS.includes(v.decideur)) erreurs.push(`${id} : décideur « ${v.decideur} » (${DECIDEURS.join(', ')})`);
    if (!v.controles) erreurs.push(`${id} : contrôles absents`);
    if (!v.possede) erreurs.push(`${id} : périmètre d'écriture absent`);
    // Leçon L24 : ce qu'on montre au brasseur porte ses choix ouverts en variantes ; ça n'attend pas sa réponse.
    if (v.decideur === 'brasseur' && /brasseur/i.test(v['depend de'] ?? '')) erreurs.push(`${id} : voie montrée au brasseur qui attend son choix ; montrer les options en variantes (L24)`);
  }
  // Leçon L25 : ce que le brasseur verra (maquettes sous ecran-1/) se conçoit avec Opus et se relit par
  // le critique calibré (Fable), pas par un relecteur générique (22.10 : planche « épicé » Sonnet acceptée à tort).
  // Une extraction de données (dossier donnees/) n'est pas une interface.
  const estInterface = (possede) => (possede ?? '').split(/,\s*/).some((p) => /ecran-1\//.test(p) && !/\/donnees\//.test(p));
  const interface_ = new Set(voies.filter((v) => estInterface(v.possede)).map((v) => v.voie));
  for (const v of voies) {
    const id = v.voie || '?';
    if (interface_.has(v.voie) && !['opus', 'fable'].includes(v.modele)) erreurs.push(`${id} : voie d'interface confiée à ${v.agent}/${v.modele} ; concepteur Opus attendu (L25)`);
    const relit = (v['depend de'] ?? '').split(/[,;]\s*/).map((s) => s.trim()).some((d) => interface_.has(d));
    if (relit && ['relecteur', 'auteur'].includes(v.agent) && /relect|relu|critique/i.test(`${v.voie} ${v.objectif}`)) erreurs.push(`${id} : relecture d'interface confiée à ${v.agent} ; critique calibré attendu (L25)`);
  }
  for (const d of table('Décisions')) if (!DECIDEURS.includes(d.decideur)) erreurs.push(`décision « ${d.decision ?? '?'} » : décideur « ${d.decideur} »`);
  const sources = (texte.split(/^## Sources/m)[1] ?? '').split(/\n## /)[0];
  for (const m of sources.matchAll(/`([^`\s]+\/[^`\s]+)`/g)) if (!existe(path.join(RACINE, m[1]))) erreurs.push(`source introuvable : ${m[1]} (leçon L09)`);
  return erreurs;
}

const MARQUES_CORRECTION = [
  /pas ce que (j'ai|j'avais|je t'ai|je voulais) /, /\btoujours pas\b/, /\b(je t'avais|j'avais|j'ai) (dit|dis|demande)/, /\bdeja (dit|demande)/,
  /\b(tu as|t'as) (oublie|pas compris|mal compris)/, /\boublie\b/, /\bc'est (faux|pas bon|mauvais|tres mauvais|pas ca)\b/, /\bpas bon\b/,
  /\bpourquoi (tu|t'as|il y a pas|y a pas|y'a pas)/, /\b(encore|toujours) (le meme|les memes|une fois)/, /\bmemes? problemes?\b/,
  /\b(trompe|erreur|horrible|bordelique)\b/, /\barrete de\b/, /^\s*non\b/, /\bil manque\b|\bmanque\b/, /\?\?\?/,
];

// Les notifications de l'app (fin d'agent, autre session, CI) passent aussi par UserPromptSubmit :
// ce ne sont pas des paroles de l'utilisateur (faux positif vu le 22.10 sur le rapport d'un conseiller).
const NOTIFICATIONS = /<(task-notification|side-sessions-event|ci-monitor-event)>|^\s*\[SYSTEM NOTIFICATION/;

export function estCorrection(prompt) {
  if (NOTIFICATIONS.test(prompt ?? '')) return false;
  const t = sansAccents(prompt ?? '');
  return MARQUES_CORRECTION.some((re) => re.test(t));
}

function verifierHooks() {
  const erreurs = [];
  const settings = path.join(RACINE, '.claude', 'settings.json');
  let conf;
  try { conf = JSON.parse(lire(settings)); } catch (e) { return [`settings.json illisible : ${e.message}`]; }
  const commandes = (ev) => (conf.hooks?.[ev] ?? []).flatMap((g) => (g.hooks ?? []).map((h) => ({ matcher: g.matcher ?? '', cmd: h.command ?? '' })));
  if (!commandes('UserPromptSubmit').some((h) => h.cmd.includes('.claude/hooks/cerveau.mjs'))) erreurs.push('UserPromptSubmit sans cerveau.mjs');
  if (!commandes('PostToolUse').some((h) => h.cmd.includes('.claude/hooks/cerveau.mjs') && /Edit/.test(h.matcher) && /Write/.test(h.matcher))) erreurs.push('PostToolUse (Edit|Write) sans cerveau.mjs');
  const hook = path.join(RACINE, '.claude', 'hooks', 'cerveau.mjs');
  if (!existe(hook)) return [...erreurs, 'cerveau.mjs absent'];
  const jouer = (payload, env = {}) => spawnSync(process.execPath, [hook], { input: JSON.stringify(payload), encoding: 'utf8', env: { ...process.env, ...env }, timeout: 30_000 });
  const corr = jouer({ hook_event_name: 'UserPromptSubmit', prompt: "Non, c'est pas ce que j'ai demandé, le radar a encore disparu ???" });
  let ctx = '';
  try { ctx = JSON.parse(corr.stdout).hookSpecificOutput?.additionalContext ?? ''; } catch { /* sortie non JSON */ }
  if (corr.status !== 0 || !ctx.includes('cerveau/LECONS.md') || !ctx.includes('DEFAUTS-RECURRENTS')) erreurs.push('une correction n\'injecte pas le rappel (LECONS + DEFAUTS)');
  const neutre = jouer({ hook_event_name: 'UserPromptSubmit', prompt: 'Lance le lot 22 sur la carte des outils.' });
  if (neutre.status !== 0 || neutre.stdout.trim()) erreurs.push('une phrase neutre injecte quelque chose');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cerveau-hook-'));
  const casse = construireCerveau(tmp, { noteSansEnTete: true });
  const post = jouer({ hook_event_name: 'PostToolUse', tool_name: 'Write', tool_input: { file_path: path.join(casse, 'produit', 'note-a.md') } }, { CERVEAU_DIR: casse });
  if (post.status !== 2 || !post.stderr.includes('CERVEAU ECHEC')) erreurs.push(`une écriture qui casse le cerveau n'est pas renvoyée (code ${post.status})`);
  const dehors = jouer({ hook_event_name: 'PostToolUse', tool_name: 'Write', tool_input: { file_path: path.join(RACINE, 'src', 'x.ts') } }, { CERVEAU_DIR: casse });
  if (dehors.status !== 0 || dehors.stderr.trim()) erreurs.push('une écriture hors cerveau déclenche le contrôle');
  fs.rmSync(tmp, { recursive: true, force: true });
  return erreurs;
}

// Un échappement écrit par un outil d'édition peut devenir un caractère de contrôle (22.10 : les deux
// « b » échappés de D98 étaient des 0x08, sa table NOMME morte). Aucun script de contrôle n'en porte.
// La classe est construite par codes : écrite en clair, elle subirait le même sort.
const CONTROLE = new RegExp('[' + String.fromCharCode(0) + '-' + String.fromCharCode(8, 11, 12, 14) + '-' + String.fromCharCode(31) + ']');
export function caracteresDeControle(fichiers) {
  return fichiers.filter((f) => existe(f) && CONTROLE.test(lire(f))).map(rel);
}
const scriptsDeControle = () => [
  ...['work/refonte-frontend/v4/tournoi/outils', 'scripts/agents', '.claude/hooks'].flatMap((d) => {
    const dir = path.join(RACINE, d);
    return existe(dir) ? fs.readdirSync(dir).filter((n) => n.endsWith('.mjs')).map((n) => path.join(dir, n)) : [];
  }),
];

function verifierCablage() {
  const erreurs = [];
  for (const f of caracteresDeControle(scriptsDeControle())) erreurs.push(`caractère de contrôle dans ${f} (un échappement mal écrit)`);
  const claude = lire(path.join(RACINE, 'CLAUDE.md'));
  for (const imp of ['@cerveau/INDEX.md', '@cerveau/LECONS.md']) if (!claude.includes(imp)) erreurs.push(`CLAUDE.md n'importe pas ${imp}`);
  if (!claude.includes('docs/agents/systeme.md')) erreurs.push('CLAUDE.md ne pointe pas docs/agents/systeme.md');
  for (const s of ['conseil', 'voies']) {
    const f = path.join(RACINE, '.claude', 'skills', s, 'SKILL.md');
    const e = existe(f) ? enTete(lire(f)) : null;
    if (!e || e.champs.name !== s || !e.champs.description) erreurs.push(`skill ${s} absent ou sans en-tête`);
  }
  if (!existe(path.join(RACINE, 'docs', 'agents', 'systeme.md'))) erreurs.push('docs/agents/systeme.md absent');
  const ignore = (p) => spawnSync('git', ['check-ignore', '-q', p], { cwd: RACINE }).status === 0;
  if (ignore('work/missions/m/voies/v/RESULTAT.md')) erreurs.push('git ignore les textes des missions');
  if (!ignore('work/missions/m/voies/v/captures/a.png')) erreurs.push('git suit les captures des missions');
  return erreurs;
}

// Témoin négatif dans un GATES : le critère tient si le contrôle échoue (code non nul) ET imprime son
// jeton d'échec. Un plantage (jeton absent) ou un contrôle qui passe ne prouvent rien (leçon L13).
export function echoueAvec(commande, args, jeton) {
  const exe = commande === 'node' ? process.execPath : commande;
  const r = spawnSync(exe, args, { cwd: RACINE, encoding: 'utf8', timeout: 300000 });
  const sortie = `${r.stdout ?? ''}${r.stderr ?? ''}`;
  if (r.error) return { ok: false, raison: `lancement impossible : ${r.error.message}` };
  if (r.status === 0) return { ok: false, raison: 'la commande passe (code 0) : le témoin négatif ne tient pas' };
  if (!sortie.includes(jeton)) return { ok: false, raison: `code ${r.status} sans « ${jeton} » : plantage, pas un échec du contrôle` };
  return { ok: true, raison: `code ${r.status}` };
}

// Témoins : petits dossiers jetables, un défaut à la fois.
function construireCerveau(dir, d = {}) {
  const c = path.join(dir, 'cerveau');
  fs.mkdirSync(path.join(c, 'produit'), { recursive: true });
  const lecon = (id) => `### ${id} — Faire une chose\n- Erreur : un fait daté.\n${d.leconSansCause ? '' : '- Cause : une cause.\n'}- Faire : une règle.\n- Rôles : pilote\n- Contrôle : aucun\n`;
  fs.writeFileSync(path.join(c, 'LECONS.md'), `# Leçons\n\n## Section\n\n${lecon('L01')}\n${lecon('L02')}`);
  fs.writeFileSync(path.join(c, 'INDEX.md'), '# Index\n\n- [[note-a]] — a\n- [[note-b]] — b\n');
  const note = (nom, corps) => `---\nname: ${nom}\ndescription: une note\ntype: produit\nmaj: 2026-10-22\nsources: témoin\n---\n${corps}\n`;
  fs.writeFileSync(path.join(c, 'produit', 'note-a.md'), d.noteSansEnTete ? 'Pas d\'en-tête.\n' : note('note-a', 'Voir [[note-b]].'));
  fs.writeFileSync(path.join(c, 'produit', 'note-b.md'), note('note-b', d.lienCasse ? 'Voir [[note-z]].' : 'Voir [[note-a]].'));
  return c;
}

function construireAgents(dir, { sansPlafond = false } = {}) {
  const a = path.join(dir, 'agents');
  fs.mkdirSync(a, { recursive: true });
  for (const [nom, modele] of [['executant', 'haiku'], ['auteur', 'sonnet'], ['relecteur', 'sonnet'], ['concepteur', 'opus'], ['critique', 'fable'], ['conseiller', 'sonnet']]) {
    const plafond = sansPlafond && nom === 'auteur' ? '' : 'maxTurns: 20\n';
    fs.writeFileSync(path.join(a, `${nom}.md`), `---\nname: ${nom}\ndescription: témoin\ntools: Read\nmodel: ${modele}\n${plafond}---\nÉcris RESULTAT.md, rends une ligne. LEÇON PROPOSÉE : aucune.\n`);
  }
  return a;
}

function construireConseil(dir, { sansPremierGeste = false } = {}) {
  const mots = Array(70).fill('argument').join(' ');
  const verdict = VERDICT.filter((v) => !(sansPremierGeste && v === 'Premier geste')).map((v) => `### ${v}\ntexte\n`).join('\n');
  const f = path.join(dir, '2026-10-22-temoin.md');
  fs.writeFileSync(f, `---\nname: 2026-10-22-temoin\ndescription: témoin\ntype: decisions\nmaj: 2026-10-22\nsources: témoin\n---\n## Question cadrée\nq\n\n## Type de décision\nDéléguée, réversible.\n\n## Regards\n${REGARDS.map((r) => `### ${r}\n${mots}\n`).join('\n')}\n## Revues\n### Revue 1\nr\n### Revue 2\nr\n### Revue 3\nr\n\n## Correspondance\n${'ABCDEF'.split('').map((l, i) => `- Réponse ${l} = ${REGARDS[i]}`).join('\n')}\n\n## Verdict\n${verdict}`);
  return f;
}

function construireMission(dir, { critereFaux = false, critereIgnore = false } = {}) {
  const m = path.join(dir, 'mission');
  for (const [v, modele, ok] of [['v1', 'haiku', true], ['v2', 'sonnet', !critereFaux]]) {
    const d = path.join(m, 'voies', v);
    fs.mkdirSync(d, { recursive: true });
    fs.writeFileSync(path.join(d, 'VOIE.md'), `# Voie ${v}\n- Modèle : ${modele}\n`);
    fs.writeFileSync(path.join(d, 'RESULTAT.md'), `OK — la voie ${v} se dit finie\n`);
    // Témoin « critère ignoré » : un script de critère rangé dans work/missions/, que git ne suit pas.
    const cmd = critereIgnore && v === 'v2' ? 'node work/missions/m/voies/v2/critere.mjs'
      : ok ? 'node -e "console.log(\'TEMOIN TENU\')"' : 'node -e "console.log(\'TEMOIN RATE\'); process.exit(1)"';
    fs.writeFileSync(path.join(d, 'GATES.md'), `# Gates: témoin ${v}\n\nOWNS: rien\n\nScope: témoin.\n\n- [ ] G1: le témoin passe\n  CHECK: ${cmd}\n  EXPECT: TEMOIN TENU\n  EVIDENCE: pending\n`);
  }
  return m;
}

function construireMissionPlan(dir, { sansDecideur = false, attendBrasseur = false, interfaceSonnet = false, relectureGenerique = false } = {}) {
  const f = path.join(dir, 'MISSION.md');
  const dec = sansDecideur ? '' : 'pilote';
  const v2 = attendBrasseur ? '| v2 | lot | jugement | auteur | sonnet | 60 | y/** | v1, brasseur (radar) | c | brasseur |' : '| v2 | o | jugement | auteur | sonnet | 60 | y/** | v1 | c | brasseur |';
  const v3 = interfaceSonnet ? '| v3 | maquette | jugement | auteur | sonnet | 60 | ecran-1/lot/** | — | c | brasseur |' : '| v3 | maquette | conception | concepteur | opus | 80 | ecran-1/lot/** | — | c | brasseur |';
  const v4 = relectureGenerique ? '| v4 | relecture de v3 | jugement | relecteur | sonnet | 30 | r/RESULTAT.md | v3 | c | pilote |' : '| v4 | relecture de v3 | jugement | critique | fable | 30 | r/RESULTAT.md | v3 | c | pilote |';
  fs.writeFileSync(f, `# Mission\n\n## Objectif\no\n\n## Décisions\n| Décision | Décideur |\n|---|---|\n| d | pilote |\n\n## Voies\n| Voie | Objectif | Niveau | Agent | Modèle | Plafond | Possède | Dépend de | Contrôles | Décideur |\n|---|---|---|---|---|---|---|---|---|---|\n| v1 | o | mécanique | executant | haiku | 30 | x/** | — | c | ${dec} |\n${v2}\n${v3}\n${v4}\n\n## Boucle de retour\nb\n\n## Sources\n- \`package.json\`\n`);
  return f;
}

function temoins() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'systeme-temoins-'));
  const cas = [];
  const attendu = (nom, ok, voulu) => cas.push({ nom, ok: ok === voulu, voulu });
  const sous = (n) => { const d = path.join(tmp, n); fs.mkdirSync(d); return d; };
  const cerveauOk = (o) => verifierCerveau({ dir: construireCerveau(sous(o.n), o), minNotes: 2, minLecons: 2 }).erreurs.length === 0;
  attendu('cerveau sain', cerveauOk({ n: 'c1' }), true);
  attendu('note sans en-tête', cerveauOk({ n: 'c2', noteSansEnTete: true }), false);
  attendu('lien cassé', cerveauOk({ n: 'c3', lienCasse: true }), false);
  attendu('leçon sans cause', cerveauOk({ n: 'c4', leconSansCause: true }), false);
  attendu('agents complets', verifierAgents(construireAgents(sous('a1'))).length === 0, true);
  attendu('agent sans plafond', verifierAgents(construireAgents(sous('a2'), { sansPlafond: true })).length === 0, false);
  attendu('conseil complet', verifierConseil(construireConseil(sous('k1'))).length === 0, true);
  attendu('conseil sans premier geste', verifierConseil(construireConseil(sous('k2'), { sansPremierGeste: true })).length === 0, false);
  attendu('plan routé', verifierMission(construireMissionPlan(sous('p1'))).length === 0, true);
  attendu('plan sans décideur', verifierMission(construireMissionPlan(sous('p2'), { sansDecideur: true })).length === 0, false);
  attendu('lot montré qui attend le brasseur', verifierMission(construireMissionPlan(sous('p3'), { attendBrasseur: true })).length === 0, false);
  attendu('maquette confiée à Sonnet', verifierMission(construireMissionPlan(sous('p4'), { interfaceSonnet: true })).length === 0, false);
  attendu('maquette relue par un relecteur générique', verifierMission(construireMissionPlan(sous('p5'), { relectureGenerique: true })).length === 0, false);
  const m1 = sous('m1');
  attendu('voies tenues', verifierVoies(construireMission(m1), { approuver: true, racine: m1 }).ok, true);
  const m2 = sous('m2');
  attendu('voie qui se dit OK mais rate', verifierVoies(construireMission(m2, { critereFaux: true }), { approuver: true, racine: m2 }).ok, false);
  const m3 = sous('m3');
  attendu('critère ignoré par git', verifierVoies(construireMission(m3, { critereIgnore: true }), { approuver: true, racine: m3 }).ok, false);
  const propre = path.join(tmp, 'propre.mjs'), sale = path.join(tmp, 'sale.mjs');
  fs.writeFileSync(propre, "const r = /^moment/i;\n");
  fs.writeFileSync(sale, 'const r = /^moment' + String.fromCharCode(8) + '/i;\n');
  attendu('contrôle sans caractère de contrôle', caracteresDeControle([propre]).length === 0, true);
  attendu('échappement devenu caractère de contrôle', caracteresDeControle([sale]).length === 0, false);
  attendu('correction reconnue', estCorrection("c'est toujours pas bon, j'avais dit de garder le radar"), true);
  attendu('phrase neutre', estCorrection('Lance le lot 22 sur la carte des outils.'), false);
  const source = 'Il a dit « trop centré\n  sur le ibu » le 18.10, pour 126 g.';
  attendu('condensé fidèle', verifierFidelite(source, '« trop centré sur le ibu » (18.10), 126 g').perdus.length === 0, true);
  attendu('condensé qui perd un nombre', verifierFidelite(source, '« trop centré sur le ibu » (18.10)').perdus.length === 0, false);
  attendu('notification d\'agent', estCorrection('<task-notification>\n<summary>Agent fini</summary><result>Défaut fatal ??? toujours pas</result></task-notification>'), false);
  attendu('contrôle qui échoue avec son jeton', echoueAvec('node', ['-e', "console.log('X ECHEC'); process.exit(1)"], 'X ECHEC').ok, true);
  attendu('contrôle qui passe', echoueAvec('node', ['-e', "console.log('X OK')"], 'X ECHEC').ok, false);
  attendu('contrôle qui plante', echoueAvec('node', ['-e', "throw new Error('boum')"], 'X ECHEC').ok, false);
  fs.rmSync(tmp, { recursive: true, force: true });
  for (const c of cas) console.log(`${c.ok ? 'tenu ' : 'RATÉ '} ${c.nom} (attendu : ${c.voulu ? 'OK' : 'ECHEC'})`);
  return cas.every((c) => c.ok);
}

function option(args, nom, defaut) {
  const i = args.indexOf(nom);
  return i >= 0 ? args[i + 1] : defaut;
}

function main(argv) {
  const [commande, ...args] = argv;
  const dirCerveau = path.resolve(option(args, '--dir', path.join(RACINE, 'cerveau')));
  const finir = (ok, oui, non, details = []) => { for (const d of details) console.log(`  - ${d}`); console.log(ok ? oui : non); return ok ? 0 : 1; };
  switch (commande) {
    case 'cerveau': {
      const r = verifierCerveau({ dir: dirCerveau, voie: args.includes('--voie'), minNotes: Number(option(args, '--min-notes', 15)), minLecons: Number(option(args, '--min-lecons', 12)) });
      // Une voie ne répond que de ses fichiers : les notes d'une voie voisine en cours ne la font pas échouer.
      const miens = (option(args, '--fichiers', '') || '').split(',').map((s) => s.trim()).filter(Boolean);
      if (miens.length) r.erreurs = r.erreurs.filter((e) => rel(e.fichier) === 'cerveau' || miens.some((p) => rel(e.fichier).startsWith(p)));
      for (const a of r.avert) console.log(`  (avertissement) ${rel(a.fichier)} : ${a.msg}`);
      return finir(!r.erreurs.length, `CERVEAU OK (${r.notes} notes, ${r.lecons} leçons)`, 'CERVEAU ECHEC', r.erreurs.map((e) => `${rel(e.fichier)} : ${e.msg}`));
    }
    case 'chercher': {
      const res = chercher(args.filter((a) => !a.startsWith('--')), dirCerveau);
      for (const r of res) console.log(`${String(r.score).padStart(3)}  ${r.ou} — ${r.quoi}`);
      if (!res.length) console.log('Rien dans le cerveau. Chercher aussi dans les documents canoniques (cerveau/INDEX.md).');
      return 0;
    }
    case 'note': {
      const f = path.resolve(args[0] ?? '');
      const e = verifierNote(f, (option(args, '--exiger', '') || '').split(',').map((s) => s.trim()).filter(Boolean));
      for (const mot of (option(args, '--contient', '') || '').split(',').map((s) => s.trim()).filter(Boolean)) {
        if (existe(f) && !lire(f).includes(mot)) e.push(`« ${mot} » absent`);
      }
      return finir(!e.length, 'NOTE OK', 'NOTE ECHEC', e);
    }
    case 'fidelite': {
      // Condenser sans perdre (leçon L22) : chaque citation « … » et chaque nombre de la source
      // doit se retrouver dans au moins une des notes qui la condensent. Présence de chaîne seulement.
      const [source, ...notes] = args.map((a) => path.resolve(a));
      if (!source || !notes.length || ![source, ...notes].every(existe)) return finir(false, '', 'FIDELITE ECHEC', ['usage : fidelite <source> <note…> (fichiers existants)']);
      const r = verifierFidelite(lire(source), notes.map(lire).join('\n'));
      return finir(!r.perdus.length, `FIDELITE OK (${r.citations} citations, ${r.nombres} nombres)`, 'FIDELITE ECHEC', r.perdus.slice(0, 40));
    }
    case 'exporter': {
      // Miroir à sens unique pour NotebookLM (lecture du brasseur) : un seul fichier consolidé.
      // Le cerveau du dépôt reste la source de vérité ; rien n'est envoyé d'ici.
      const vers = path.resolve(option(args, '--vers', path.join(RACINE, 'work', 'export-notebook', 'cerveau-affinee.md')));
      const r = exporterCerveau(dirCerveau, { avecSpec: args.includes('--avec-spec') });
      fs.mkdirSync(path.dirname(vers), { recursive: true });
      fs.writeFileSync(vers, r.texte);
      return finir(true, `EXPORT OK ${rel(vers)} (${r.notes} notes, ${r.mots} mots)`, '');
    }
    case 'existent': {
      const manque = args.filter((a) => !existe(path.resolve(a)));
      return finir(args.length > 0 && !manque.length, `EXISTENT OK ${args.length}`, 'EXISTENT ECHEC', manque.map((m) => `absent : ${m}`));
    }
    case 'agents': {
      const e = verifierAgents(path.resolve(option(args, '--dir', path.join(RACINE, '.claude', 'agents'))));
      return finir(!e.length, 'AGENTS OK', 'AGENTS ECHEC', e);
    }
    case 'conseil': {
      const f = args.includes('--dernier') ? dernierConseil(dirCerveau) : path.resolve(args[0] ?? '');
      if (!f) return finir(false, '', 'CONSEIL ECHEC', ['aucune transcription dans cerveau/decisions/']);
      const e = verifierConseil(f);
      return finir(!e.length, `CONSEIL OK (${rel(f)})`, 'CONSEIL ECHEC', e);
    }
    case 'voies': {
      const r = verifierVoies(path.resolve(args[0] ?? ''), { modeles: (option(args, '--modeles', '') || '').split(',').filter(Boolean), approuver: args.includes('--approuver') });
      for (const l of r.lignes) console.log(l);
      return r.ok ? 0 : 1;
    }
    case 'mission': {
      const e = verifierMission(path.resolve(args[0] ?? ''), { minVoies: Number(option(args, '--min-voies', 2)) });
      return finir(!e.length, 'MISSION OK', 'MISSION ECHEC', e);
    }
    case 'hooks': { const e = verifierHooks(); return finir(!e.length, 'HOOKS OK', 'HOOKS ECHEC', e); }
    case 'cablage': { const e = verifierCablage(); return finir(!e.length, 'CABLAGE OK', 'CABLAGE ECHEC', e); }
    case 'temoins': return finir(temoins(), 'TEMOINS OK', 'TEMOINS ECHEC');
    case 'echoue': {
      const sep = args.indexOf('--');
      const [jeton] = args;
      if (!jeton || sep !== 1 || args.length < 3) return finir(false, '', 'ECHOUE ECHEC', ['usage : echoue <JETON> -- <commande> <args…>']);
      const r = echoueAvec(args[2], args.slice(3), jeton);
      return finir(r.ok, `ECHOUE OK (${jeton}, ${r.raison})`, 'ECHOUE ECHEC', r.ok ? [] : [r.raison]);
    }
    default:
      console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 17).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
      return commande ? 2 : 0;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) process.exitCode = main(process.argv.slice(2));

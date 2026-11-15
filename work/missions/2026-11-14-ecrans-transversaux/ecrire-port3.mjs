// Écrit VOIE.md et GATES.md des ports de b1r et m3r-a (pilote, 15.11).
import fs from 'node:fs';
const M = 'work/missions/2026-11-14-ecrans-transversaux';
const W = 'C:/Users/mrspa/AppData/Local/Temp/transversaux-port';
const V = JSON.parse(fs.readFileSync(new URL('./port-r3.json', import.meta.url), 'utf8'));
for (const [id, v] of Object.entries(V)) {
  const d = `${M}/voies/${id}`;
  fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(`${d}/VOIE.md`, `# Voie ${id} — port 1:1 : ${v.titre} (mission 2026-11-14-ecrans-transversaux)

- Agent : auteur · Modèle : sonnet · Plafond : 120 tours · Décideur : pilote (son choix du 15.11)
- **Dossier de travail : \`${W}\`** (worktree partagé avec les autres voies de port, branche \`claude/ecrans-transversaux\`, basée sur le tag
  déployé \`en-ligne/2026-11-14-atelier-uv4\` ; node_modules et functions/node_modules installés ; \`.env\` et \`seedData.ts\` copiés).
  Tout le code s'écrit là. Une autre voie peut coder en même temps : ne touche que tes fichiers ; avant \`npm run build\`, crée \`build.lock\`
  à la racine du worktree (attends s'il existe), supprime-le après ; ne commite que tes chemins (jamais npm-ci*.log ni build.lock).
- Lis : \`CLAUDE.md\`, \`.claude/rules/affinee-frontend.md\` ; \`DESIGN.md\` lignes 101-200 et 401-606 ; dans le dépôt principal (lecture seule,
  \`C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/${M}/\`) : ${v.base}. Skills : \`senior-frontend\`, \`a11y-audit\`, \`boosters-ux\`.

## Règle n° 1 (ses choix)
« C'est critique que mes choix soient respectés. SI non, rien n'a de valeur. » Sa maquette est reprise telle quelle (L03) : inventaire de
chaque élément, état et geste ; un port retire ce qu'elle n'a pas. Ses mots : ${v.mots}.
Exigences transversales (L05) : densité utile et chrome compact ; même en-tête et même place du + sur tous les écrans (D119, D129, BX-4) ;
aucun menu déroulant au téléphone (D350) ; 390 tactile et 1280 ; clair et cave ; rien de perdu (chaque action d'aujourd'hui garde sa
fonction, hors ligne compris) ; la caisse v3a (+ › Vendre) et la Dépense ne changent pas ; Bord et Clients : seuls leur onglet et leur +.

## Objectif
Porter ${v.obj}. Les données viennent de l'app, jamais des exemples de la maquette. Ce que la maquette montre et que l'app ne sait pas :
« manque : … » dans RESULTAT.md, sans couche parallèle.

## Contrôles (tous écrits dans des fichiers)
- \`npx tsc --noEmit -p . > ${d}/tsc.txt 2>&1\` → aucune erreur.
- \`npx vitest run ${v.test} --reporter=dot > ${d}/tests.txt 2>&1\` → verts ; \`npx vitest run tests/unit --reporter=dot > ${d}/tests-tout.txt 2>&1\` sans nouvel échec.
- \`npm run build > ${d}/build.txt 2>&1\` → vert.
- Captures par la vraie entrée, serveur \`npx vite --port ${v.port} --strictPort\` dans le worktree, \`?dev-local\` : chaque état, 390 tactile
  (DPR 2) et 1280, clair et cave, dans \`${d}/captures/\`, et des planches côte à côte avec la maquette (\`${d}/captures/cote-a-cote-*.png\`).
  Si ton contexte dépasse 140 k avant les captures, écris une section \`DEMANDE EXECUTANT :\` (liste exacte des captures et planches) dans
  RESULTAT.md et rends la main. puppeteer-core : \`createRequire('C:/Users/mrspa/AppData/Local/Temp/deploy-bc70/package.json')\`, Chrome
  \`C:/Program Files/Google/Chrome/Application/chrome.exe\`.
- RESULTAT.md tenu au fil (une ligne par étape ; une limite de tours ne doit rien perdre). Arrête ton serveur à la fin.

## Possède
Dans le worktree : ${v.possede}. Dans le dépôt principal : \`${d}/**\`. Commit dans le worktree par chemins, en français, fin
« Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com> ». Aucun déploiement, aucun push, aucune donnée réelle, ni stash ni checkout.

## Rendre
Une ligne : « ${id} : OK, tsc/tests/build verts, commit <sha> » ou « ${id} ECHEC : <raison> » ou « REPRISE : <RESULTAT.md> ».
`);
  fs.writeFileSync(`${d}/GATES.md`, `# Gates: voie ${id} — port 1:1

OWNS: ${d}/

Scope: ${v.titre}, porté dans le worktree, typé, testé, construit, capturé côte à côte avec sa maquette.

- [ ] G1: les tests de ses règles passent
  CHECK: node -e "const t=require('fs').readFileSync('${d}/tests.txt','utf8');console.log(/failed/i.test(t)||!/passed/i.test(t)?'TESTS ECHEC':'TESTS OK')"
  EXPECT: TESTS OK
  EVIDENCE: pending

- [ ] G2: les captures côte à côte existent
  CHECK: node -e "const fs=require('fs');const d='${d}/captures';const n=fs.existsSync(d)?fs.readdirSync(d).filter(f=>/^cote-a-cote-.*\\.png$/.test(f)).length:0;console.log(n>0?'CAPTURES OK':'CAPTURES ECHEC')"
  EXPECT: CAPTURES OK
  EVIDENCE: pending
`);
}
console.log('PORT R3 ECRIT');

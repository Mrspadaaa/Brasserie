// Écrit VOIE.md et GATES.md des ports de b1r et m3r-a (pilote, 15.11).
import fs from 'node:fs';
const M = 'work/missions/2026-11-14-ecrans-transversaux';
const W = 'C:/Users/mrspa/AppData/Local/Temp/transversaux-port';
const V = {
  'port-b1': {
    titre: 'la barre du bas et le + selon l\'écran (b1r)', port: 3033, test: 'tests/unit/plus-ecran',
    base: '`voies/voie-r-b1/b1r.html`, `NOTE.md` (menu de chaque écran, pour le port), toutes ses captures dont `b1r-ecrans-390.png` ; sa base `voies/voie-barre/b1*.png` ; `voies/voie-critique/REPRISES.md` section b1r (corrections 2 à 5 à faire au port : même action et même libellé aux deux largeurs ; Impôt bière et Prix et marges ont aussi leur menu)',
    mots: '« Le + à ordre figé / b1 -> le + doit être dynamique en fonction de l\'écran ou on est » ; BX-4 (09.11) : « sur plein d\'écran il est pas au bon endroit. Différents, donne pas les bonnes actions »',
    obj: 'la feuille du + de b1 (zone « Sur cet écran » à la couleur de la rubrique, puis ce qui sert depuis cet écran), un menu propre à chaque écran et sous-écran (`src/domain/fabActions.ts` étendu, une table par écran, testée), un seul + à l\'écran (l\'Atelier perd son + interne au profit du flottant), au 1280 le rail latéral de b1 avec les lettres de raccourci N, E, F, V, le toast rangé au-dessus de la barre sans couvrir l\'en-tête, « Hors connexion » dans l\'entrée Compagnon (plus de pastille flottante). Contrôle ET-PLUS : étends `work/missions/2026-11-09-bouton-plus/audit-plus.mjs` (copie dans ta voie) pour exiger que le menu diffère d\'un écran à l\'autre au-delà de la première ligne ; il doit échouer sur le tag de départ et passer sur ton port',
    possede: '`src/components/BottomNav.tsx`, `src/domain/fabActions.ts`, le menu du + (trouve son composant par grep « Actions rapides » ; la Dépense et la caisse v3a ne changent pas), le + interne de l\'Atelier, de petites éditions ciblées de `src/App.tsx` (rail et place du toast ; Edit seulement, relire avant chaque édition : la voie port-m3 peut y écrire aussi), un dossier neuf `src/components/navigation/**`, `tests/unit/plus-ecran*.test.ts`',
  },
  'port-m3': {
    titre: 'l\'en-tête et la page « Plus » (m3) avec la période m3r-a', port: 3034, test: 'tests/unit/periode',
    base: '`voies/voie-menu/m3.html` et ses captures (sa maquette choisie, telle quelle), `voies/voie-r-m3/m3r-a.html` et ses captures (la période : provisoire tant qu\'il n\'a pas choisi entre m3r-a, b et c — https://claude.ai/artifact/H9K7tsC6CKoQHQNZW9pL6P ; garde le code de la période isolé pour en changer sans perte), `voies/voie-critique/REPRISES.md` section m3r-a (corrections 1 à 4 : flèches et mois à 44 px, chiffres, Bord actif au 1280) et la section m3 de `voies/voie-critique/RESULTAT.md`',
    mots: '« Page « Plus » / m3 -> attention pour l\'interval de temps ça doit être mieux fait. Et on peut le réglés à plusieurs endroits, attention à ce détails très important !! / Duo d\'avatars, page plein écran. »',
    obj: 'l\'en-tête de m3 (duo d\'avatars G/A à la place du ⋮ ; la loupe garde sa place ; le thème va dans la page Plus comme m3), la page « Plus » plein écran à sections de m3 (qui saisit avec la bascule, Thème, outils Assistant de brassage et Atelier R&D, administration Journal, Connexions cloud et IA, Réglages — ils ouvrent les feuilles déjà portées par les voies port-reglages et port-feuilles —, Se déconnecter), et la période m3r-a : **une seule période**, la même pastille « ‹ Nov. › » dans l\'en-tête de chaque écran, réglable partout, qui change partout (une seule source dans l\'app : les filtres locaux de Finances, Brassins (CatalogToolbar), Bord lisent la même ; grep TimeFilterPeriod). Contrôle ET-PER : un test Vitest qui échoue sur le tag de départ (deux sources indépendantes) et passe sur ton port, plus un parcours Chrome qui change la période dans l\'en-tête puis lit Finances et Brassins',
    possede: '`src/components/Header.tsx` (le dialogue « Saisir au nom de » vient d\'être extrait par port-feuilles : réutilise son composant), un dossier neuf `src/components/plus/**` et `src/components/periode/**`, les lecteurs de la période (`src/components/tabs/FinancesTab.tsx`, `ProductionTab.tsx`, `DashboardTab.tsx`, `src/ui/production/CatalogToolbar.tsx`, `ProductionCatalog.tsx` : seulement la source de la période), de petites éditions ciblées de `src/App.tsx` (Edit seulement, relire avant chaque édition : la voie port-b1 peut y écrire aussi), `tests/unit/periode*.test.ts`',
  },
};
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
console.log('PORT 2 ECRIT');

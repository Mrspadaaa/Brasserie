OK — HORIZON vert sur l'arbre, rouge sur tour7 ; Quand branché, date enregistrée (lundi)

# Reprise F-HORIZON (21.11, worktree port-carnet, branche claude/port-carnet-1711)

## Fait, commité par chemins
- `9bb263b29` : `src/domain/horizons.ts`, `src/ui/saisie/Horizons.tsx`, `tests/unit/horizons.test.ts`.
  - `lundiDHorizon(h, aujourdhui)` : les mois s'ajoutent en mois civils, bornés à la fin de mois (`ajouterMois`).
  - Le lundi retenu est celui de la semaine dont le jeudi tombe dans le mois visé (règle ISO 8601). Ainsi « vers mai » et la semaine
    posée sur la frise disent le même mois.
  - Jamais une semaine passée ; « plus tard » vaut `null`.
  - `texteIntention` rend « cette semaine », « vers févr. », « vers nov. 2027 » (année dite à 12 mois et plus) ou « passé · S41 ».
  - `horizonDe` retrouve la puce choisie.
  - D2 : `prixSemblable({nom, ref?, categorie?}, achats)` cherche d'abord la même référence, puis un mot porteur proche (fuse.js, seuil
    0,2 de `doublons.ts`, non réglé sur ses achats, estimé), et retient le plus récent. Source dite « ZZ TEST Pompe 2025 ».
    Rien de semblable : `null`, et l'écran passe à `ORDRES_DE_GRANDEUR` (D1). Jamais 0.
  - `Horizons.tsx` : rangée partagée (Aujourd'hui · 1 mois · 3 mois · 6 mois · 1 an · Plus tard) ; elle passe à la ligne et prend la
    classe de puce de l'écran hôte.
- `3e2cb5793` : `CarnetOuvert.tsx` gagne la rubrique « Quand », dans le même vocabulaire que les autres rubriques (picto, mot gras, état
  gris, puces `cn-puce`). Elle se place après Notes : le premier écran choisi (g5:v04-4, h05-3) ne bouge pas.
  - Props optionnelles : `onDater(lundi|null)`, `onAuCalendrier`, `prix {centimes, semblable}`, `onPrix`, `aujourdhui`.
  - Sans `onDater`, rien ne s'affiche : aucun changement visible aujourd'hui.
- Preuves : vitest `horizons` 28/28 ; `carnetsEcrans` vert (82 au total) ; `tsc` sans erreur sur ces fichiers.
- `npm run build` : compilation verte. La fin affiche « DRAPEAUX ECHEC — VITE_CARNET_IA absent… dans dist ». La cause n'a pas été
  vérifiée : probablement l'environnement du worktree, pas ce changement.
- `principes.mjs --seul HORIZON` sur l'arbre : rouge avant toute modification (capture `horizon-projet-ouvert.png`, carnet neuf
  « Évier pour les fûts »). Il reste rouge tant que CarnetsVue ne passe pas `onDater`.

## DÉCISION À PRENDRE (pilote)
1. Donner `src/ui/carnets/CarnetsVue.tsx` à F-HORIZON. C'est le seul conteneur qui tient le magasin, et aucune voie ne le possède.
   Le patch fait environ 15 lignes, au montage de `<CarnetOuvert>` (vers la l. 1296) :
   ```tsx
   onDater={lundi => { const { date: _d, ...reste } = c; const doc = lundi ? { ...reste, date: lundi } : reste;
     appliquer({ ok: true, ecritures: [{ op: 'put', doc }], inverse: [{ op: 'put', doc: c }], avis: lundi ? 'Daté' : 'Sans date' }); }}
   prix={{ centimes: typeof c.estimatedCost === 'number' && c.estimatedCost > 0 ? Math.round(c.estimatedCost * 100) : undefined,
     semblable: prixSemblable({ nom: c.title }, achatsPasses) }}
   onPrix={x => appliquer({ ok: true, ecritures: [{ op: 'put', doc: { ...c, estimatedCost: x / 100 } }], inverse: [{ op: 'put', doc: c }], avis: 'Prix estimé' })}
   aujourdhui={iso local de maintenant()}
   ```
   - `achatsPasses` : `AchatPasse[]` tirés de `finances.transactions`, une ligne de facture = libellé, centimes, date.
     Les noms de champs restent à lire dans `src/domain/finance/types.ts`.
   - Le lundi du carnet est lu par `iconesIdees` (`calendrier.ts:895`) : il devient l'icône de sa semaine au Calendrier, sans toucher
     au Calendrier.
2. « Au calendrier › » (K2, bascule) : `App.tsx` écoute déjà `affinee:ouvrir-calendrier`, mais seulement avec une `section`.
   - Il faut qu'un `detail.date` sans section appelle `ouvrirChoseCalendrier(date)`, environ 3 lignes dans App.tsx.
   - Ce changement va à V-CAL (arrivée centrée), ou à F-HORIZON si le pilote donne App.tsx.
   - D'ici là, `onAuCalendrier` n'est pas passé : aucun bouton mort.
3. La précision (`semaine` ou `mois`) n'est pas stockée : CreativeItem n'a pas ce champ, et `types/index.ts` est hors périmètre.
   - Une date de carnet se dit donc toujours « vers <mois du jeudi> ».
   - V-CAL ajoutera `datePrecision` quand le glisser posera une semaine.

## Prochaine action
- Après accord : appliquer le patch 1, puis lancer
  `node scripts/parcours/principes.mjs <scratch> --seul HORIZON` (attendu : vert, 1 geste, « vers févr. »).
- Puis la même commande avec `--ref en-ligne/2026-11-21-tour7` (attendu : rouge).
- Puis `carnet.mjs`, `controle-choix.mjs`, les captures à 390 et à 1280 dans les deux thèmes, et un commit par chemin.
- Les libellés du contrôle (« 3 mois », « vers févr. ») sont déjà alignés sur la réalisation : `principes.mjs` reste inchangé.

CONNAISSANCE : une date de carnet (`CreativeItem.date`, lundi) devient d'elle-même l'icône de sa semaine au Calendrier (`iconesIdees`).
LEÇON PROPOSÉE : la colonne « Possède » d'une voie UI doit inclure le conteneur qui tient le magasin (ici CarnetsVue), pas seulement la vue pure.

## Mise à jour 2 (décision du pilote appliquée, rien de commité)
- Patch appliqué, non commité : `src/ui/carnets/CarnetsVue.tsx` (`dater`, `auCalendrier`, `achatsPasses`, props) et `src/App.tsx`.
  - App.tsx : `ouvrirDateRef`, et un `detail.date` sans section appelle `ouvrirChoseCalendrier`.
  - `tsc` est propre.
- HORIZON sur tour7 : rouge (« aucun choix 3 mois »), comme attendu.
- HORIZON sur l'arbre : encore rouge. Le contrôle compte 1 geste, mais la rubrique reste « pas encore daté ».
  - Capture : `scratchpad/hz1/horizon-projet-3-mois.png`.
  - Cause probable : la rubrique est en fin de page, et ses puces sont coupées sous le champ du bas (`.cn-defile`, défilement
    intérieur). Le toucher tombe sur le champ, pas sur la puce.
  - Correctif à essayer : monter la rubrique Quand juste avant « Ce qui compte », ou faire défiler `.cn-defile` jusqu'à elle.
  - Si le toucher atteint bien la puce, vérifier que `magasin.appliquer` accepte le document mis à jour.
- `deploy-tour4.sh` est introuvable dans les worktrees (find sur Brasserie/work, port-carnet/work, port-carnet/scripts). DRAPEAUX n'est
  donc pas vérifié.
- Restent à faire : `carnet.mjs`, `controle-choix.mjs`, captures 390 et 1280 dans les deux thèmes, puis les commits
  (CarnetsVue+App = K2/C1 branché).

## Mise à jour 3 (21.11, fin de voie)
- Commits par chemins sur claude/port-carnet-1711 : `a093dfe3b` (CarnetsVue + App, patch du pilote ; regex de date corrigée :
  `/^d{4}…/` avait perdu ses barres inverses), `ca88ca335` (CarnetOuvert : « Prix estimé ? » en gris devant les montants, qui ne
  disaient pas ce qu'ils sont), `d0e535701` (scripts/parcours/chaines-outils.mjs, voir cause).
- Cause mesurée : le champ n'est pas fixe et ne recouvre rien. `.cn-defile` défile à l'intérieur (390×844 : 147–722, sh 814, ch 575) ;
  le champ est son frère, de 722 à 792 ; 0 bouton sous le champ (liste, ouvert, 390×844, 390×660, 1280, deux thèmes). La rubrique est
  atteignable en défilant. La puce « 3 mois » (721–765) est rognée par le défilement, mais `trouver()` ne testait que la fenêtre (bas < 780) : il
  touchait le champ (`cn-ico`). Correctif dans le banc : un centre couvert par un autre élément fait défiler (scrollIntoView), comme
  le doigt qui glisse puis touche. L'ordre des rubriques est inchangé.
- Preuves :
  - HORIZON arbre : « 1 geste · lu vers févr. : oui », PRINCIPES OK.
  - Sur tour7 : « aucun choix 3 mois », ECHEC (1).
  - Enregistré : `"date":"2027-02-15"` (lundi), sur le carnet « Évier pour les fûts » du cache du banc.
  - `carnet.mjs` : PARCOURS CARNET OK.
  - principes complet : mêmes verdicts qu'avec l'ancien `trouver`, sauf HORIZON. RENOMMER-materiel a sauté une fois ; 4/4 ok ensuite,
    avec l'ancienne et la nouvelle version : intermittent. Les KO VUE-SAUTE appartiennent à d'autres voies.
  - `controle-choix --registre` : code 0. Le Carnet n'est pas dans ecrans.json : ses choix sont dans maquettes.json (g5:v04-4, h05-3).
  - vitest horizons + carnets* : 54 fichiers, 773 tests verts.
  - tsc propre.
  - `VITE_HOP_V4=on VITE_CARNET_IA=production npm run build` : vert, DRAPEAUX OK.
- Captures ouvertes : `C:/Users/mrspa/AppData/Local/Temp/claude/2574149e6fd34767/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad/hz6/{Clair,Cave}-390-quand-3-mois.png`, `C:/Users/mrspa/AppData/Local/Temp/claude/2574149e6fd34767/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad/hz4/Clair-1280-ouvert.png`,
  `C:/Users/mrspa/AppData/Local/Temp/claude/2574149e6fd34767/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad/hz4/{Clair,Cave}-1280-quand.png`, `C:/Users/mrspa/AppData/Local/Temp/claude/2574149e6fd34767/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad/hz3/horizon-projet-3-mois.png`.
- deploy-tour4.sh : copie le `.env` de Brasserie, puis `VITE_HOP_V4=on VITE_CARNET_IA=production npm run build` (drapeaux en variables
  d'environnement de la commande). Un `npm run build` nu donne donc DRAPEAUX ECHEC : ce n'est pas un défaut du code.
- Hors voie, signalé :
  - à 390, le body défile aussi, de 116 px (sh 960/844), et la barre du haut part en défilant : double défilement préexistant ;
  - à 1280, une capture faite pendant la sonde porte « SecurityError localStorage » dans la console.
- DÉCISION À PRENDRE : `chaines-outils.mjs` est un outil partagé, hors « Possède ». Le changement ne fait qu'ajouter un défilement quand le
  toucher aurait manqué. À garder, ou à revoir par le pilote.
- CONNAISSANCE : dans le Carnet, le défilement est `.cn-defile` à 390 ; le champ est un frère, pas une surcouche. À 1280, le body
  défile et le champ est sticky.
- LEÇON PROPOSÉE : avant de corriger « caché sous le champ », mesurer `elementFromPoint` et les zones de défilement. Ici, la cause était
  le banc, pas la mise en page.

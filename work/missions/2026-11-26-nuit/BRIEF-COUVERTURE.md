# Brief commun — couverture de tous les écrans (nuit du 26 au 27.11)

Parole du brasseur (27.11, 01:58, par la session pilote) : « l'eau et palier sont des exemples, il faut regarder toute le reste de l'app dans cette même attention ».
Règle : chaque écran de ta tranche passe au même examen fin, joué comme le brasseur au téléphone (390 × 844 tactile) : chaque champ, chaque édition au
doigt, chaque bouton flottant ou collant, chaque valeur affichée (unité, cohérence avec les autres chiffres), chaque geste et son effet.

## Classes de défaut
- (a) un élément fixe ou collant (bouton +, pied, bandeau, rangée d'onglets) qui recouvre un contenu ou un bouton, au repos ou défilé au bout.
- (b) une édition au doigt mal faite : champ coupé, valeur « ? », NaN, vide après une saisie valide, durée ou total incohérent, clavier inutile
  (un choix qui ouvre le clavier), clavier non décimal (type=number interdit), geste sans effet, Échap / Annuler qui perd ou garde à tort.
- (c) une valeur fausse ou incohérente : unité absente ou fausse, total qui ne fait pas la somme, date impossible, texte coupé qui change le sens.

## Bancs (dans work/missions/2026-11-26-nuit/outils, Chrome de debug 9222)
- `lib.mjs` : `ouvrir({ largeur, bloquerExterne })` → `{ page, fermer }` dans TON onglet ; `cliquer`, `pause`, `capture`, `defiler`,
  `chevauchements(page, 'repos'|'milieu'|'fin')` (classe a, mesurée), `editions(page)` (classe b, champs coupés, type=number, valeurs « ? »).
  `scan.mjs <url> <dossier> [cave] --ecrans=<json>` fait repos/milieu/fin et captures sur une liste d'écrans (voir `ecrans-tous.json`).
- Local, données fictives : http://localhost:3131/?dev-local (serveur déjà lancé ; ne le lance ni ne l'arrête). L'app s'ouvre vide : pose tes
  fixtures « ZZ TEST — … » dans le cache mémoire (`const { FirestoreRepo } = await import('/src/services/firestoreRepo.ts'); FirestoreRepo.put(<collection>, id, {...})`,
  types dans src/types.ts) avec `ouvrir({ bloquerExterne: true })`. Bancs existants : `?dev-local&etape=levure` (assistant, recette de démo),
  `?dev-local&etape=houblons`, `?preview=brew&view=brassage` (jour de brassage, sans authentification).
- En ligne, VRAIES données du brasseur : https://brasserie-l-affinee.web.app/ (le Chrome est connecté). LECTURE SEULE : ouvrir, défiler, toucher pour
  ouvrir une feuille, mesurer, capturer ; JAMAIS Enregistrer, Supprimer, valider, ni modifier un champ d'un vrai enregistrement. Une saisie en ligne
  seulement dans un brouillon local d'une recette neuve nommée « ZZ TEST — … », puis retirer ce brouillon du localStorage à la fin.
- Règles Chrome : seulement via lib.mjs ; `fermer()` à la fin ; JAMAIS `browser.close()`, aucun autre navigateur, ne touche pas aux autres onglets.
- Interdits : modifier src/ ou tests/ (tu rends des constats), toute écriture sur ses données, le Carnet (refonte suspendue) sauf défaut bloquant,
  Gemini réel, aucune donnée personnelle (nom de client, téléphone, e-mail, IBAN) dans tes fichiers ou ta réponse.

## Preuve et rendu
- Un constat n'existe que prouvé : capture OUVERTE et regardée (Read sur le PNG), mesure à l'appui. Un doute se range dans « doutes ».
- Écris dans ton dossier `<scratchpad>/couverture-<tranche>/` (scratchpad = C:\Users\mrspa\AppData\Local\Temp\claude\b544ff255d45c8a5\b8d55cb5-6273-4076-b363-d67bfb7c3518\scratchpad) :
  `COUVERTURE.md` = 1) tableau « | écran (id de l'inventaire) | banc (local/en ligne) | gestes joués | constats (n°) | statut (fait / partiel : pourquoi) | »,
  une rangée par écran de ta tranche ; 2) constats numérotés « écran · geste · observé · attendu · capture · fichier source probable » ;
  3) doutes et non joué.
- Inventaire : work/refonte-frontend/inventaire-ecrans.json (85 écrans, champs id, nom, acces, fichiers).
- Plafond : 45 tours. Dernière ligne de ta réponse : « Tranche <x> : N écrans couverts sur M, K constats prouvés : <les 3 plus graves en 20 mots> ».

## Passe 2 (03:35) : les gestes qui écrivent
La passe 1 a laissé « partiel » tout geste qui écrit (enregistrer, valider, clôturer, créer, supprimer). La passe 2 les joue AU BANC LOCAL SEULEMENT,
sur fixtures « ZZ TEST — … » posées en mémoire, avec `ouvrir({ bloquerExterne: true })` : aucune requête ne sort, rien n'atteint ses données.
Pour chaque geste : avant / après (valeur, total, liste, message), cohérence des unités et des sommes, focus et clavier, flottants. Rapports de la
passe 1 à relire d'abord (ce qui est fait ne se refait pas) : work/missions/2026-11-26-nuit/couverture/{A,B,C,fiches}.md.

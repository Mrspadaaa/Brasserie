# Voie p3 — Nouvelle dépense, passe 3 : toute la place, le maximum de lignes, groupées, le récap qui renvoie

Agents : deux concepteurs (Opus), séries p3a et p3b, 3 variantes chacun. Plafond : 60 tours par agent. Pilote : Opus. Date : 01.11.
Décisions : D235 (ses mots, lectures du pilote), D233 (une seule date ; « y aller » va toujours quelque part), D227 (r2b portée).

## Ses mots (01.11, matin, mot pour mot ; sa capture `brasseur/01-11-recap-r2b-1280.jpg`, bandeau et preuve de r2b à 1280 entourés)
« Plusieurs points sur la vue et logistique. rang 7 · r1 · série r Nom d'approche : feuille J'aime beaucoup les pastilles sur les items, ça
rend la chose très clair. Aussi un récap en haut comme sur le screen est top, avec la possibilité de clicker et avoir des revois Maintenant
pour la lisibilité. Je veux que en un écran je vois le maximum d'items ajouter. Je veux que cette écran d'ajouter de facture prenne vraiment
toute la place de l'app. Je veux aussi que ça soit trié par catégorie avec sous total de quantité. Par exemple je sais très bien combien
d'houblon j'ai commandé. Mais pas forcément combien items au Total. Aussi bien utilisé les UX UI booster. Finalement, pour la logistique
d'envoi sur le drive, c'est invisible, c'est à la fin en arrière plan. Et si ça fail. Grosse notification, renvoie sur la facture pour
upload le justificatif ou/et réparé le lien drive »
Avant (01.11, sur son téléphone) : « Y aller je fait rien… comme un cintillement, c'est horrible » ; « C'est pas utile den avoir plusieurs »
(une seule date visible). Les deux sont corrigés dans l'app (254f20f5) : ne les réintroduis pas.

## La base (règle n° 1 : reprise telle quelle, plancher à enrichir, L07)
- **L'écran tel qu'il est dans l'app** (r2b portée, avec b1) : captures `voies/e-port/captures/souris390-01-repos.png` à `-06`,
  `pc1280-01-repos.png` à `-09-*`, et `voies/b1-bande/captures/tactile390-1` à `-5`. Code : `src/ui/finance/ExpenseSheet.tsx`,
  `src/ui/depense/Verdict.tsx` (lecture seule).
- **La maquette r2b** : `v1/r2b/etat.html` et `v1/r2b/NOTE.md` (le bandeau, la preuve, les chips numérotées par risque, le règlement sur
  la ligne). **Le récap qu'il a entouré** = le bandeau (fournisseur, date, 86,50, « ✓ 23 lignes », la barre colorée des lignes) + la
  preuve (somme = imprimé, quantité × prix 23/23, lectures 2/2, page 2 coupée, et le compte des liens en pictos : 13 reliés · 2 nouveaux ·
  2 bis · 1 unité ? · 5 moutures). Garde-le en haut, ouvert d'office.
- **Les pastilles de r1 (feuille)** : `v0/r1/etat.html`, captures `v0/r1/r1-articles.png` et `r1-repos.png`. Sur chaque ligne : le picto
  du lien au stock (relié, nouveau, bis, unité ?, mouture), la pastille d'équivalence « = 2 sachets », la pastille de doute (« unité ? »,
  « supposée ») ; la rangée « Articles et stock 23 » et ses comptes en pastilles. Lis tout ce qui relève des pastilles dans r1 avant de
  reprendre (L03) et coche-le dans ta NOTE.
- La facture : `diagnostic/d1/verite-facture-372765.json` (23 lignes, 86,50 CHF, six points). Aucune donnée personnelle (ni nom ni adresse).

## Ce qui change (lectures du pilote, D235 ; réversibles)
1. **Toute la place de l'app** : plein écran à 390 × 844 et à 1280 (aucune marge de feuille, rien de l'app derrière, ni en-tête ni
   navigation de l'app) ; l'en-tête de la dépense (titre, justificatif, ×) en une ligne de 40 px au plus ; le pied « Confirmer » reste.
2. **Le maximum de lignes par écran** : à 390 × 844, compte les lignes de facture entièrement visibles (a) au premier écran et (b) quand
   la liste est défilée jusqu'à ses lignes. La base dans l'app : mesure-la avec le même script (au plus 7 à 8 en (b) aujourd'hui).
   Plancher : (b) ≥ 16 lignes, et plus que la base en (a). Texte ≥ 12 px, cibles ≥ 24 px sans chevauchement (DESIGN.md). Le compte va
   dans ta NOTE et dans RESULTAT.md.
3. **Groupées par catégorie, avec sous-totaux** : Malts, Houblons, Levures, Services (moutures)… ; l'en-tête de chaque groupe porte le
   nombre de lignes, la **quantité par unité** (« 17 kg », « 220 g », « 5 sachets » ; deux unités = deux sous-totaux, jamais additionnées
   en silence) et le montant. **Le total des lignes** (« 23 lignes ») se voit au récap. La mouture : sous son malt, ou dans son groupe
   Services, c'est un axe. Rien n'est réordonné en silence : l'ordre du papier reste atteignable (axe : bascule « papier / par catégorie »
   ou non).
4. **Le récap renvoie** : chaque compte du récap est un bouton qui mène à ses lignes (« 2 bis » → les deux lignes bis, surlignées ;
   « 5 moutures » → les moutures ; « 23/23 » → la liste ; « 1 unité ? » → la ligne Sabro). Le renvoi : défilement plus éclair, filtre
   temporaire, ou pliage des autres groupes (axe). Un renvoi visé reste visible sous ce qui colle en haut (pas de cible cachée, D233).
5. **Drive invisible** : rien sur Drive avant « Confirmer » (ni « Drive prêt », ni la phrase « Le justificatif sera rangé… »). Après
   « Confirmer », l'écran se ferme tout de suite ; l'envoi se fait en arrière-plan. **Échec** : une grosse notification, sur l'écran où il
   se trouve, qui ne part pas seule, avec deux gestes : « Renvoyer le justificatif » (rouvre la dépense sur le justificatif) et
   « Reconnecter Drive » ; la dépense reste enregistrée (rien n'est perdu). Montre l'échec dans l'annexe : la notification sur l'écran
   Finances et la dépense rouverte. Le réussi : rien, ou un reçu discret qui s'efface (axe).
6. **Boosters** : charge `boosters-ux`, `impeccable` et `ui-design-system` avant de dessiner ; marque chaque booster `data-booster`, coche
   B1 à B13 dans ta NOTE (B8 les états et B11 l'honnêteté obligatoires).

## Les axes (chaque série en couvre au moins deux, sans se répéter)
- en-tête de groupe : ligne de sous-total collante ; bande pleine teintée par catégorie ; en-tête repliable avec ses chiffres ;
- densité de ligne : une rangée (nom · quantité · pastilles · montant) ; deux rangées compactes à la r1 ; colonnes alignées en tableau ;
- renvoi du récap : défilement + éclair ; filtre temporaire ; pliage des autres groupes ;
- notification d'échec Drive : bandeau plein en haut de l'app ; carte flottante au-dessus de la navigation ; pastille rouge persistante sur
  la dépense dans le journal, plus un toast.
- **p3a** : chaleur froide et tiède (affine r2b de l'app au plus près). **p3b** : une tiède et deux chaudes (forme plus libre, même base).

## Exigences transversales (recopiées de COMMUN.md et des acquis)
L'honnêteté du BRIEF-ECRAN (vide si non imprimé, « supposée » / « déduite », valeurs lues côte à côte, calcul d'un contrôle en échec,
unité imprimée gardée, CHF à deux décimales et virgule) ; une seule date visible (D233) ; « y aller » et chaque chip mènent quelque part ;
les six points de sa facture se règlent sur leur ligne (r2b) ; le pied « Confirmer » jamais bloqué ; chaque fonction de la baseline reste
atteignable (liste du BRIEF-ECRAN § Obligatoire 1, à cocher) ; 100 mots au plus au premier écran, aucune phrase d'aide au repos ; aucun
`type="number"` ; pas de cockpit ; texte ≥ 12 px.

## Ce que rend chaque variante (`v3/p3a-1/`, `v3/p3a-2/`, `v3/p3a-3/` ; `v3/p3b-1/`, `v3/p3b-2/`, `v3/p3b-3/`)
- `etat.html` jouable à 390 × 844, qui tient à 1280 ; classes et globales préfixées par son id (`p3a1-…`, L26), script dans une fonction
  immédiate, assemblage sans remplacement de chaîne ; `?etat=` pour : repos (sa facture, six points), lignes défilées, un renvoi du
  récap joué, un point réglé, tous réglés, l'ordre du papier, envoi en cours (fermé), **échec Drive** (notification, puis dépense rouverte),
  lecture en cours, hors ligne.
- `NOTE.md` : chaleur, axes, idée en une phrase, la base et les pastilles de r1 cochées, B1 à B13, **les deux comptes de lignes**.
- `compter-lignes.mjs` (puppeteer-core, 390 × 844, `isMobile`, `hasTouch`) : sort `LIGNES a=<n> b=<n>` pour la variante et pour la base.
- Captures : `node scripts/agents/verifier-page.mjs <etat.html> --captures <dossier>/<id>` puis une à 1280 et une par état ; **ouvre-les**
  et juge-les comme lui (L12), zone par zone en plein format.
- Contrôles, depuis la racine :
  `node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/missions/2026-10-31-ecran-depense/v3 <id> --page=etat.html --profil=sans-houblons` → COMMUN OK ;
  `node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/missions/2026-10-31-ecran-depense/v3 <id> --page=etat.html --max=100` → MOTS OK ;
  `node work/refonte-frontend/v4/tournoi/outils/controle-contraste.mjs work/missions/2026-10-31-ecran-depense/v3 <id> --page=etat.html` → CONTRASTE OK ;
  `node scripts/agents/verifier-page.mjs work/missions/2026-10-31-ecran-depense/v3/<id>/etat.html --min-images 0` → PAGE OK ;
  `node work/missions/2026-10-31-ecran-depense/v3/<id>/compter-lignes.mjs` → `LIGNES a=… b=…` avec b ≥ 16.
  (Si un outil prend ses arguments autrement, lis son en-tête et adapte ; dis-le.)

## Possède
p3a : `work/missions/2026-10-31-ecran-depense/v3/p3a-*/**`. p3b : `work/missions/2026-10-31-ecran-depense/v3/p3b-*/**`. Rien d'autre (ni
`src/`, ni l'app). Aucun serveur dans `C:/Users/mrspa/Documents/Brasserie` ; aucun code écrit par heredoc ni `node -e` ; pas de
`git stash`, aucun commit. Ne touche jamais `.codex/hooks.json`, `source4-portable-bundle-manifest-01.json`, `functions/.env`.

## Retour
`v3/<série>-RESULTAT.md` : par variante, l'idée, les sorties des contrôles, `LIGNES a= b=`, les captures ouvertes, ce qui tient et ce qui
casse. Puis une ligne : `P3A OK — …` / `P3B OK — …` ou `… ECHEC — <raison>`. `LEÇON PROPOSÉE : …` au besoin.

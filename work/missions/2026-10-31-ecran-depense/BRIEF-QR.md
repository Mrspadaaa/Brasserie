# Brief v0 — le contrôle QR dans « Nouvelle dépense » (01.11)

Séries : qr-r (Opus, la langue de l'écran en ligne), qr-z (Fable, créative à fond), qr-u (Opus, **§ Brief minimal seul**). Quatre mini
maquettes par série : 1 froide, 1 tiède, 2 chaudes (M13). Décisions : D240 (zxing-wasm), D243 (pdf.js ; les mini maquettes d'abord).

## Ses mots (01.11, mot pour mot)
À « Je propose ensuite de brancher le QR dans l'app : lu dans le téléphone avant Gemini, il contrôle le montant, la devise, le n° et la
date. Comme ça change un peu ce que tu vois, je te montrerai d'abord des mini maquettes » : « Okok ». Avant : « zxing-wasm ok ».
Sur l'écran : « J'aime beaucoup les pastilles sur les items, ça rend la chose très clair. Aussi un récap en haut comme sur le screen est
top, avec la possibilité de clicker et avoir des revois » (D235) ; « doublon ok parfait » (l'état « Déjà enregistré », en ligne).

## Une question (L10)
**« Que dit le QR de cette facture ? »** Le seul facteur libre : la façon dont le contrôle du QR se montre. Tout le reste est l'écran tel
qu'il est en ligne, repris tel quel (règle n° 1, plancher à enrichir L07).

## La base
- L'écran en ligne (r2b portée, b1, doublon) : captures `voies/e-port/captures/souris390-01-repos.png` à `-06`, `pc1280-01-repos.png` à
  `-06`, `voies/b1-bande/captures/tactile390-1` à `-3`, `voies/dp-doublon/captures/390-*.png`. Code en lecture seule :
  `src/ui/finance/ExpenseSheet.tsx`, `src/ui/depense/Verdict.tsx`, `Ticket.tsx`, `Pictos.tsx`. Le choix de la passe 3 est **ouvert** :
  rien n'en vient (D123).
- Une mini maquette montre la partie de la feuille où vit le QR (en-tête, bandeau du total, preuve « Vérification », règlement, et
  quelques lignes) à 390 × 844 ; le reste peut être une bande figée. Elle tient à 1280.

## Ce que le QR sait (mesuré le 01.11 sur ses pièces, D240)
- Le QR-facture suisse (SPC 0200) porte : IBAN, créancier (nom, lieu), **montant** (parfois vide sur un bulletin ouvert), **devise** (CHF
  ou EUR), une référence (QRR, SCOR ou aucune), un message ; souvent le bloc **Swico S1** : **n° de facture**, **date de facture**, n° TVA,
  taux de TVA, conditions de paiement.
- Ses PDF B&R : un QR en dernière page, S1 complet ; montant, devise, n° et date justes, lus en moins de 0,6 s. Ses bulletins photographiés :
  montant, devise, créancier justes. Sa facture de 3 pages en une image : QR présent mais **illisible** (barré par un tampon). Ses captures
  de commande en ligne : **aucun QR**.
- C'est un fait imprimé par le système du fournisseur, lu sans IA : plus sûr que la lecture, mais jamais substitué en silence.

## Les états à montrer (`?etat=`, tous jouables)
1. `confirme` : le QR dit la même chose que la lecture (montant, devise, n°, date). Le plus fréquent (B&R).
2. `contredit` : le montant du QR diffère du total lu (110,40 contre 110,04). Les deux valeurs se voient côte à côte, la source dite ; le
   geste qui garde l'une ou l'autre. Le champ n'est jamais changé sans lui (honnêteté).
3. `partiel` : bulletin sans montant : seuls devise, créancier et référence se contrôlent ; le reste n'est pas dit « confirmé ».
4. `illisible` : un QR est vu mais ne se lit pas ; la lecture seule fait foi, dit en peu de mots.
5. `sans` : pas de QR (capture d'un site) : rien, ou une mention discrète (axe).
6. `lecture` : le QR se lit pendant la lecture (≈ 0,5 s pour un PDF).
Données fictives seulement (aucune valeur de ses pièces) : « Malterie Fictive SA », facture F-1001, 110,40 CHF, 12.10.2026.

## Les axes (chaque série en couvre au moins deux, sans se répéter)
- **où** : sur le bandeau, à côté du total ; une ligne de la preuve « Vérification » ; une pastille sur chaque champ confirmé (total, date,
  n°) ; un sceau ou un tampon ;
- **le désaccord** : côte à côte avec un geste ; la valeur du QR proposée, la lue barrée ; un point numéroté comme les autres points ;
- **le signe** : un picto de QR dessiné à 12-16 px ; le mot « QR » ; une coche avec sa source ;
- **enrichir** (plancher à enrichir) : IBAN et référence prêts pour payer (copier), conditions de paiement de S1, échéance.

## Exigences transversales (COMMUN.md, BRIEF-ECRAN, acquis)
Honnêteté : vide si non imprimé, « confirmé » seulement pour ce que le QR porte, deux valeurs côte à côte, la source dite ; CHF à deux
décimales et virgule ; une seule date visible (D233) ; chaque chip mène quelque part ; « Confirmer » jamais bloqué ; 100 mots au plus au
premier écran, aucune phrase d'aide au repos ; pas de cockpit ; texte ≥ 12 px ; cibles ≥ 24 px sans chevauchement ; aucun
`type="number"`. Charge `boosters-ux`, `impeccable` et `ui-design-system` avant de dessiner ; marque chaque booster `data-booster`.

## Ce que rend chaque variante (`qr/v0/<id>/`, ids `r1`…`r4`, `z1`…`z4`, `u1`…`u4`)
- `etat.html` jouable à 390 × 844 et à 1280 ; classes et globales préfixées par son id (`qrr1-…`, L26), script dans une fonction
  immédiate, assemblage sans remplacement de chaîne ; les six états par `?etat=`.
- `NOTE.md` : chaleur, axes, l'idée en une phrase, ce qui vient de la base, les boosters cochés.
- Captures : `node scripts/agents/verifier-page.mjs <etat.html> --captures <dossier>/<id>`, puis une par état à 390 et une à 1280 ;
  **ouvre-les** et juge-les comme lui, zone par zone en plein format (L12).
- Contrôles, depuis la racine (`<dir>` = `work/missions/2026-10-31-ecran-depense/qr/v0`) :
  `node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs <dir>/<id> --ecran=depense` (l'écran dépense n'a pas d'entrée dans
  `ecrans.json` : note sa sortie telle quelle, ce n'est pas un échec de ta variante) ;
  `node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs <dir> <id> --page=etat.html --profil=sans-houblons --sans-lignes` → COMMUN OK ;
  `node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs <dir> <id> --page=etat.html --max=100 --sans-lignes` → MOTS OK
  (D238 : les lignes de facture, marquées `data-mots="lignes"`, ne comptent pas ; tout le reste, 100 mots au plus ; ne coupe aucune ligne) ;
  `node work/refonte-frontend/v4/tournoi/outils/controle-contraste.mjs <dir> <id> --page=etat.html` → CONTRASTE OK ;
  `node scripts/agents/verifier-page.mjs <dir>/<id>/etat.html --min-images 0` → PAGE OK.
  (Si un outil prend ses arguments autrement, lis son en-tête et adapte ; dis-le.)

## Possède
Ta série seulement : `work/missions/2026-10-31-ecran-depense/qr/v0/<lettre>*/**` et `qr/v0/<lettre>-RESULTAT.md`. Ni `src/`, ni l'app.
Aucun serveur dans `C:/Users/mrspa/Documents/Brasserie` ; aucun code écrit par heredoc ni `node -e` (un `\d` y devient `d`) ; pas de
`git stash`, aucun commit, aucune installation. Ne touche jamais `.codex/hooks.json`, `source4-portable-bundle-manifest-01.json`,
`functions/.env`. Chemins absolus dans Bash.

## Retour
`qr/v0/<lettre>-RESULTAT.md` : par variante, l'idée, les sorties des contrôles, les captures ouvertes, ce qui tient et ce qui casse. Puis
une ligne : `QR-R OK — …` (ou Z, U) ou `… ECHEC — <raison>`. `LEÇON PROPOSÉE : …` au besoin.

## Brief minimal (série u : lis cette section, la base et « Possède », « Ce que rend », « Retour » ; rien d'autre)
L'app lit maintenant le QR-facture suisse d'une facture (montant, devise, n° de facture, date ; parfois rien, parfois illisible). Montre au
brasseur, dans l'écran « Nouvelle dépense » tel qu'il est en ligne, ce que le QR confirme ou contredit de la lecture. Quatre idées, de la
plus sage à la plus libre. Les six états par `?etat=` : confirme, contredit, partiel, illisible, sans, lecture.

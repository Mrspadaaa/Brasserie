# Brief v0 — l'outil de la rénovation (01.11, nuit, D259)

Trois séries, quatre mini maquettes chacune : 1 froide, 1 tiède, 2 chaudes (M13, D204).
- **reno-r** (Opus) : dans la langue de l'app en ligne.
- **reno-z** (Fable) : créative à fond.
- **reno-u** (Opus) : lis seulement le **§ Brief minimal**.

Cadrage : `jury-renovation/fiche.md`. Lis-le en entier, sauf la série u.

## Ses mots (mot pour mot, `work/refonte-frontend/v4/SPEC-BRASSEUR.md`, § « La vue TVA, et la rénovation d'abord »)
- « Mais j'ai plus besoin d'outil de prédictions, vu d'ensemble, panification et autres car la brasserie est en grande rénovation, et
  il me manque encore beaucoup de choses et j'ai pas beaucoup de temps à consacrer à ça et pas non plus un gros budget. Genre
  installation de hotte. Installation du 2eme évier. Armoire extérieur, seconde passe sur les sols ectt création du site web
  vitrine.... »
- Lecture du pilote : « plus besoin » veut dire « davantage besoin » ; « panification » veut dire « planification ».
- Sur une autre vue (u3, une bouteille) : « un peu enfantin j'aime assez bien, après pas convaincu vraiment du design. Mais avoir une
  vrai vu comme ça c'est top […] et la partie maron ? ». La partie marron ne représentait rien : défaut D259.
- Sur la Nouvelle dépense (01.11, SPEC l. 897-898) : « J'aime beaucoup les pastilles sur les items, ça rend la chose très clair. Aussi
  un récap en haut comme sur le screen est top, avec la possibilité de clicker et avoir des revois ». C'est un goût, pas une forme
  choisie pour cet écran.

## Une question (L10)
**« Qu'est-ce qui me manque, et qu'est-ce que je fais ensuite ? »**

Le seul facteur libre est **la place d'un manque dans la suite**. L'argent et les heures vont sur une ligne de contexte, et
seulement quand ils sont connus. « Quand pourrai-je payer » et « quand aurai-je fini » ne se disent jamais au repos sur des entrées
inconnues.

Le premier geste est **noter un manque, en un titre**. Ses cinq chantiers doivent se poser en moins d'une minute.

## La base (l'app telle qu'elle est ; règle n° 1 ; plancher à enrichir, L07)
- **Captures de l'app en ligne**, sur fixtures :
  - le Bord : `work/missions/2026-10-31-systeme-ecrans/voies/e2-inventaire/captures/onglet-bord-390.png` ;
  - Finances › Prévisions : `work/missions/2026-10-31-ecran-depense/inventaire/captures/fin-previsions-390.png` et `-1280.png`. On y
    voit la sous-navigation « Échéances · Projets de matériel ».
  - Ne recopie pas les titres d'événements visibles sur ces captures.
- **Ce qui est repris tel quel** : l'en-tête de l'app, la barre du bas (Bord, Finances, Brassins, Stocks, Clients, +) et les cartes
  teintées du Bord.
- **Code en lecture seule** :
  - `src/components/tabs/DashboardTab.tsx` (le Bord, l'Agenda) ;
  - `src/ui/finance/UpgradeWorkspace.tsx` et `UpgradeSheet.tsx` (les Projets de matériel : Bientôt, Ensuite, Plus tard ; Idée, À
    étudier, Devis en cours, Prêt à acheter ; achat + livraison + installation ; « Noter l'achat » ; « Inclure dans les
    prévisions ») ;
  - `src/domain/finance/upgrades.ts`.
- **Format** : une mini maquette montre l'outil à sa place, à 390 × 844 ; le reste de l'écran peut être une bande figée. Elle tient
  aussi à 1280.

## Ce que l'app sait (faits, `DEPART.md` et fiche § Tranché)
- Un projet de matériel est un achat ponctuel. La catégorie « Local et travaux » existe déjà ; le formulaire, lui, fige « Matériel ».
- Il n'y a ni heures, ni ordre, ni cause de blocage, ni chantier sans achat.
- La caisse de départ est inconnue, et la prévision ne connaît pas ses apports. « Pas avant mars » n'existe donc que si une caisse ou
  une enveloppe est saisie **et** que les prix sont connus.
- Toute valeur inconnue s'écrit « à estimer » ou « à régler » : jamais 0, jamais une date inventée (PRODUCT.md).

## Les états à montrer (`?etat=`, tous jouables)
1. `jour1` : ses cinq titres seuls, rien d'autre. C'est son état réel. La vue y est utile et juste, sans zone vide décorative.
2. `encours` : un mois plus tard.
   - La hotte est payée mais pas posée.
   - Le 2ᵉ évier est chiffré sur devis.
   - L'armoire extérieure attend les sols.
   - La seconde passe sur les sols est en cours, payée en partie.
   - Le site vitrine n'a pas d'achat ; il se compte en heures.
3. `ajout` : le geste d'ajouter un manque, ouvert, titre seul.
4. `ouvert` : un manque ouvert, avec ses prix, ses heures, ses étapes (selon ton axe), son blocage et « Noter l'achat ».
5. `depasse` : un budget dépassé par les factures liées.
6. `caisse` : la caisse ou l'enveloppe, inconnue puis connue, selon ton axe « argent ».
7. `fini` : des manques faits, dont un fini hors de l'app.
8. `horsligne` : la vue hors ligne.

**Données fictives seulement.** Les cinq titres sont ses mots :
- « Installation de la hotte » ;
- « 2ᵉ évier » ;
- « Armoire extérieure » ;
- « Seconde passe sur les sols » ;
- « Site web vitrine ».

Tout le reste est inventé : montants en CHF à deux décimales et virgule, artisans fictifs (« Ventil'Demo Sàrl », « Sanitaire Fictif
SA »), heures fictives. Aucun nom de fournisseur réel, aucune donnée de ses pièces. Pas de conseil de saison ni de métier : seulement
ses données.

## Les axes (`jury-renovation/fiche.md` § Axes)
Chaque série en couvre au moins deux, sans répéter une autre série.
- **place** :
  - le Bord, une ligne « Ensuite » et la liste à un toucher ;
  - Finances › Prévisions, les Projets de matériel élargis ;
  - un écran à lui, ouvert depuis le Bord.
- **forme** :
  - une liste par état avec pastilles ;
  - une file ordonnée (glisser ou flèches) ;
  - une frise des mois (seulement pour ce qui a une date) ;
  - une vraie vue figurée : la brasserie en plan ou en coupe, chaque manque à sa place, **aucune zone muette** (D259).
- **mot** : « Rénovation » ; « Ce qui me manque » ; « Local et travaux » (le mot de l'app).
- **argent** :
  - rien tant qu'aucun prix n'est connu ;
  - le reste à payer seul ;
  - une enveloppe qu'il fixe ;
  - la caisse des Prévisions, avec « caisse à renseigner » tant qu'elle est inconnue.
- **temps** :
  - aucun ;
  - les heures par manque, sans date de fin ;
  - une fin estimée, seulement si heures et rythme sont connus.
- **étapes** :
  - aucune ;
  - des cases à cocher dans le manque ouvert, sans doubler l'Agenda du Bord ;
  - « Noter l'achat » seul.

## Exigences transversales
- **Honnêteté** : l'inconnu n'est jamais à zéro ; aucune date ni aucun total inventés ; chaque zone d'une figure dit ce qu'elle
  représente (D259).
- **Premier écran** : 60 mots au plus ; aucune phrase d'aide au repos ; pas de cockpit ; chaque chip mène quelque part.
- **Lisibilité et geste** : texte ≥ 12 px ; cibles ≥ 24 px, sans chevauchement ; aucun `type="number"`.
- **Ajout** : noter un manque tient d'une main.
- **Avant de dessiner** : charge `boosters-ux`, `impeccable` et `ui-design-system`. Marque chaque booster `data-booster`.

## Ce que rend chaque variante (`v0/<id>/`, ids `r1`…`r4`, `z1`…`z4`, `u1`…`u4`)
- `etat.html`, jouable à 390 × 844 et à 1280, avec les huit états par `?etat=`.
  - Classes et globales préfixées par son id (`renor1-…`, L26).
  - Script dans une fonction immédiate ; assemblage sans remplacement de chaîne.
- `NOTE.md` : la chaleur, les axes, l'idée en une phrase, ce qui vient de la base, les boosters cochés.
- Captures, prises avec `node scripts/agents/verifier-page.mjs <etat.html> --captures <dossier>/<id>` : une par état à 390, et une à
  1280. **Ouvre-les** et juge-les comme lui, zone par zone, en plein format (L12).
- Contrôles, lancés depuis la racine, avec `<dir>` = `work/missions/2026-11-01-renovation/v0` :
  - `node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs <dir>/<id> --ecran=renovation` : l'écran n'a pas d'entrée dans
    `ecrans.json`. Note sa sortie telle quelle ; ce n'est pas un échec de ta variante.
  - `node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs <dir> <id> --page=etat.html --profil=sans-houblons --sans-lignes`
    → COMMUN OK ;
  - `node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs <dir> <id> --page=etat.html --max=60 --sans-lignes` → MOTS OK.
    Les titres des manques, marqués `data-mots="lignes"`, ne comptent pas.
  - `node work/refonte-frontend/v4/tournoi/outils/controle-contraste.mjs <dir> <id> --page=etat.html` → CONTRASTE OK ;
  - `node scripts/agents/verifier-page.mjs <dir>/<id>/etat.html --min-images 0` → PAGE OK.
  - Si un outil prend ses arguments autrement, lis son en-tête et adapte ; dis-le.

## Possède
- Ta série seulement : `work/missions/2026-11-01-renovation/v0/<lettre>*/**` et `v0/<lettre>-RESULTAT.md`. Ni `src/`, ni l'app.
- Aucun serveur dans `C:/Users/mrspa/Documents/Brasserie`.
- **Aucun fichier écrit par heredoc ni par `node -e`** : utilise l'outil Write. Le 01.11, une série l'a fait quand même.
- Pas de `git stash`, aucun commit, aucune installation.
- Ne touche jamais `.codex/hooks.json`, `source4-portable-bundle-manifest-01.json`, `functions/.env`.
- Chemins absolus dans Bash.

## Retour
- `v0/<lettre>-RESULTAT.md`, écrit variante par variante : l'idée, les sorties des contrôles, les captures ouvertes, ce qui tient et ce
  qui casse.
- Puis une ligne : `RENO-R OK — …` (ou Z, U), ou `… ECHEC — <raison>`.
- `LEÇON PROPOSÉE : …` au besoin.

## Brief minimal (série u : lis cette section, la base, « Possède », « Ce que rend » et « Retour » ; rien d'autre)
Le brasseur, seul dans sa micro-brasserie, est en pleine rénovation : hotte, 2ᵉ évier, armoire extérieure, seconde passe sur les sols,
site web vitrine. Il a peu de temps et peu de budget. Il demande « prédictions, vu d'ensemble, planification ». Rien n'est encore
saisi dans l'app.

Montre-lui, dans l'app telle qu'elle est, une vue d'ensemble de ce qui lui manque et de ce qu'il fait ensuite. L'outil sert d'abord à
noter vite et à savoir quoi faire. L'app ne montre jamais un chiffre ni une date qu'elle ne connaît pas.

Quatre idées, de la plus sage à la plus libre. Les huit états par `?etat=` : jour1, encours, ajout, ouvert, depasse, caisse, fini,
horsligne.

**Données fictives seulement.** Ses cinq titres, puis des montants, des artisans et des heures inventés. Aucun nom de fournisseur réel.

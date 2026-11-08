# Registre unique des bugs — L'Affinée

Créé le 08.11.2026 (brasseur : « Et qui va fixer tout ça ? Il faut pas perdre les bug finding. J'ai l'impression que c'est en partie ce qui c'est passé.... »). Règle : un constat n'existe que s'il est ici ; un rapport n'est fini qu'une fois versé. Contrôle : `node scripts/agents/controle-bugs.mjs` (« BUGS OK »), rejoué par le hook Stop. Chaque rapport source porte l'empreinte de son contenu au moment du versement (colonne 5) : un constat ajouté ensuite fait échouer le contrôle jusqu'à ce qu'il soit versé et l'empreinte reposée (le contrôle donne la nouvelle) ; « en cours » pour un rapport qu'un agent écrit encore (toléré 2 h sans mouvement). Fermer un bug : état « corrigé » + commit, « déployé » quand le commit est en ligne, « vérifié » une fois rejoué sur l'app déployée.

**315 lignes, 262 bugs distincts** (53 lignes sont des doublons) au 08.11 07:50, 19 sources ; **30 constats perdus retrouvés** (section « Perdus »).

| état | lignes |
|---|---|
| ouvert | 161 |
| en cours (corrigé en partie, reste ouvert) | 16 |
| corrigé (commit après `65d3c645`, pas en ligne) | 4 |
| déployé (commit ancêtre de `65d3c645`) | 65 |
| vérifié en ligne | 0 |
| écarté | 16 |
| doublon | 53 |

Ouverts au sens large (ouvert + en cours) : 177. Parmi eux, 58 sont des notes (doutes, « non joué ») et 106 viennent des rapports AM, TE et BT du 08.11, pas encore pris en charge.

Lire :
- **déployé** = le commit est ancêtre de `65d3c645`, la version en ligne (vérifié par `git merge-base --is-ancestor`). Tout commit après lui est « corrigé » (aujourd'hui : `92de7371` seul). « vérifié » (en ligne, à l'image) : aucun bug ne l'est encore ; le rapport TE du 08.11 a été fait sur `65d3c645` mais ne rejoue pas les anciens correctifs sauf TE-13, TE-18 et TL-19, qui montrent des restes.
- **en cours** = corrigé en partie : la colonne note dit le commit déjà en ligne et ce qui reste ouvert. Rien de ce qui reste n'est perdu.
- **ouvert** avec « correctif non retrouvé » : un rapport dit « corrigé » mais aucun commit ni diff ne le porte.
- **doublon de X** : même défaut vu deux fois ; le suivi se fait sous X. Les rapports RB (copie du rapport B1), N, TL, TE, SU et DR se recoupent : leurs lignes en doublon gardent la trace de chaque rapport.
- Gravité : B = bloquant (nombre faux, donnée perdue, geste impossible, impossible métier accepté), G = gênant, D = détail, « — » = note.
- « Notes » = les lignes `NOTE` : doutes, « non compté », « à suivre », « à vérifier », « gênant produit », « hors écran » des rapports.
- Dépense : `src/ui/finance/ExpenseSheet.tsx` et quatre tests Dépense sont modifiés dans l'arbre, non commités (08.11 07:28) : travail en cours d'un correcteur, non attribué à un bug précis.

## Sources

| chemin | préfixe | constats | notes | empreinte |
|---|---|---|---|---|
| work/missions/2026-10-31-ecran-fermentescibles/banc-critique/RAPPORT.md | B1 | 15 | 4 | c816dfc0a63a |
| C:\Users\mrspa\AppData\Local\Temp\affinee-test-ferm\RAPPORT.md | B1 | 15 | 4 | c816dfc0a63a |
| work/missions/2026-10-31-ecran-fermentescibles/banc-critique/RESULTAT.md | B1 | 0 | 3 |  |
| work/missions/2026-11-07-banc-actionneurs/reprise-b1/RAPPORT.md | RB | 15 | 4 | c816dfc0a63a |
| work/missions/2026-10-31-ecran-depense/banc-b2/RAPPORT.md | B2 | 20 | 6 | 9c4e9fd87693 |
| C:\Users\mrspa\AppData\Local\Temp\affinee-test-b2\RAPPORT.md | B2 | 20 | 6 | 9c4e9fd87693 |
| work/missions/2026-10-31-ecran-depense/banc-b2/RESULTAT.md | B2 | 0 | 6 |  |
| work/missions/2026-11-07-banc-actionneurs/RAPPORT.md | N | 7 | 6 | 2aa7fc92a693 |
| work/missions/2026-11-07-banc-actionneurs/RESULTAT.md | BA | 0 | 2 |  |
| work/missions/2026-11-07-test-en-ligne/RAPPORT.md | TL | 51 | 6 | 4736ffb4e599 |
| work/missions/2026-11-07-test-en-ligne/RESULTAT.md | TR | 0 | 5 |  |
| work/missions/2026-11-07-test-en-ligne/genants/RESULTAT.md | GE | 0 | 6 |  |
| work/missions/2026-11-08-test-en-ligne-ecrans/RAPPORT.md | TE | 27 | 7 | en cours |
| work/missions/2026-11-03-lecture-longue/PLAN.md | LL | 8 | 5 |  |
| work/missions/SUIVI.md | SU | 9 | 8 |  |
| work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md | DR | 7 | 0 |  |
| C:\Users\mrspa\.claude\uploads\cf141d92-b572-411b-bd05-1f71ad016601\8bd9218f-image.jpg | M | 4 | 1 |  |
| work/missions/2026-11-08-audit-metier/RAPPORT.md | AM | 73 | 3 | 271af0e1d1bb |
| work/missions/2026-11-08-banc-tous-ecrans/RAPPORT.md | BT | 2 | 5 | en cours |
| C:\Users\mrspa\AppData\Local\Temp\affinee-metier-vision\RAPPORT.md | MV | 34 | 0 | en cours |

Rapport annoncé mais sans fichier au 08.11 : `%TEMP%/affinee-metier-vision/RAPPORT.md` (MV : seulement 45 captures et des JSON bruts) ; à verser dès qu'il existe. Les rapports TE (27 constats à cette heure) et BT (en cours, « tableau écran × actionneurs » encore vide) s'écrivent encore : relancer le contrôle pour les suivants. Le rapport AM (audit de code seul, aucun Chrome) numérote A1 à A11, B1 à B22, C1 à C18, D1 à D22 : ici AM-1 à AM-11, AM-12 à AM-33, AM-34 à AM-51, AM-52 à AM-73, dans cet ordre, la colonne « source » redonne le numéro du rapport.

## Bugs

| id | source | écran | constat | gravité | état | commit | note |
|---|---|---|---|---|---|---|---|
| M-1 | brasseur 08.11, capture | Fermentescibles (app en ligne, téléphone) | Pilsner Malz 1,8 kg accepté à « fermentation » J+4 et Caramünch Typ 2 32,5 kg à J+3 : un malt n'entre pas en fermentation, et il reste compté comme empâté | B | ouvert | | correctif non retrouvé : SUIVI dit « J+ retiré des malts, moment par famille » en cours chez la pilote, mais ni commit ni diff au 08.11 07:30 ; même pastille et même curseur pour toute famille (`Ligne.tsx`, `Plateau.tsx`) |
| M-2 | brasseur 08.11, capture | Fermentescibles | Bandeau « Grain 34,3 kg · OG 1,290 » sans blocage : seule l'alerte « À 1,290, le moût sature : compte plutôt 40 % de rendement » ; 32,5 kg de Caramünch = 95 % du grain | B | ouvert | | un résultat impossible doit se dire (règle : combinaison impossible acceptée = bloquant) |
| M-3 | brasseur 08.11, capture | Fermentescibles | IBU 160 au bandeau avec des grains à « J+ » (TE-16 : IBU 40 → 82 quand un grain passe à J+3, le moteur croit l'ébullition à 1,000) | B | ouvert | | à corriger avec M-1 |
| M-4 | brasseur 08.11, capture | Fermentescibles | EBC 267,2 affiché sans alerte de plausibilité (couleur noire, part de Caramünch 95 %) | G | ouvert | | audit métier AM attendu |
| M-NOTE-1 | SUIVI, journal 08.11 | Fermentescibles | Défaut vu trois fois et mal lu (monitoring L1, B1-1, correctif bc9e084c qui renforce le cycle) : personne n'a demandé « un malt en ébullition, ça existe ? » | — | écarté | | méthode : LEÇON PROPOSÉE dans SUIVI (juger le sens métier) ; le défaut lui-même est M-1 |
| B1-1 | B1 07.11 | Fermentescibles | Pastille « empâtage ⌄ » : chevron de menu, mais le toucher écrit (Weizenmalz passe en « ébullition » sans menu) | B | déployé | bc9e084c | forme seule (chevron remplacé par ⇄, « Toucher : … ») ; le fond métier est M-1 |
| B1-2 | B1 07.11 | Fermentescibles | « Malt essai 10 » : le nombre de fin de nom devient la masse (« Crystal 60 » → 60 kg) | B | déployé | 5d3b118a | |
| B1-3 | B1 07.11 | Fermentescibles | « 0,2 » Entrée crée un ingrédient nommé « 0,2 » | B | déployé | 5d3b118a | le doute de la pilote (« 0,2 » = sa masse ?) : SU-NOTE-2 |
| B1-4 | B1 07.11 | Fermentescibles | « dext » en Grain propose Carapils, pas Dextrose du rayon Sucre | G | déployé | bf35d73a | |
| B1-5 | B1 07.11 | Fermentescibles | Couleur 2000 (hors 1–1500) : la valeur disparaît en silence | G | déployé | bf35d73a | |
| B1-6 | B1 07.11 | Fermentescibles | Deux retraits de suite : le premier est perdu sans « Annuler » | G | déployé | bf35d73a | complété par N-1 (69239d86) ; TE-18 voit un « Annuler » sans effet en ligne |
| B1-7 | B1 07.11 | Fermentescibles | Le « + » flottant couvre le plateau, « kg », la piste et l'alerte lactose | G | déployé | b2577be6 | bas de page seulement ; haut de page : TL-31 |
| B1-8 | B1 07.11 | Fermentescibles | Cave : « empâtage » gris sur le voile olive de la ligne choisie, contraste faible | G | déployé | bf35d73a | |
| B1-9 | B1 07.11 | Fermentescibles | Curseur J+ à 14 : le cadre de focus barre « J0 J7 J14 » | G | déployé | bf35d73a | |
| B1-10 | B1 07.11 | Fermentescibles | Un écran, trois noms (« Fermentescibles 2/7 », « Malts/sucres », « Grain 8 kg ») ; à 1280 « Nouvelle recette » | D | déployé | bc9e084c | |
| B1-11 | B1 07.11 | Fermentescibles | La famille s'appelle « Lactose » (un produit) ; ligne « Lactose · Lactose » | D | déployé | bc9e084c | famille « Sucre de lait » |
| B1-12 | B1 07.11 | Fermentescibles | 99999 ramené à 10 000 en silence, 0,004 accepté, piste noire de graduations | D | déployé | bf35d73a | |
| B1-13 | B1 07.11 | Fermentescibles | Bascule « Grain ⇄ » : cinq familles parcourues à l'aveugle | D | déployé | bc9e084c | |
| B1-14 | B1 07.11 | Fermentescibles | Rechargement : retour au tableau de bord, la recette en cours n'est pas rouverte | D | déployé | b2577be6 | limite : B1-NOTE-5 |
| B1-15 | B1 07.11 | Fermentescibles | Le pied « Retour / Suivant » sort de l'écran à 1280 (911 sur 800) | D | déployé | bc9e084c | |
| B1-NOTE-1 | B1 07.11, doutes | Fermentescibles | « IBU 0 » au bandeau sans houblon, là où OG et EBC disent « — » | — | ouvert | | un inconnu n'est jamais 0 ; jamais suivi |
| B1-NOTE-2 | B1 07.11, doutes | Fermentescibles | « Grain 8 kg » au bandeau, « 8,0 kg » dans sa maquette | — | écarté | | écart déclaré par le port ; formats de masse mêlés : TL-17 |
| B1-NOTE-3 | B1 07.11, doutes | Fermentescibles | « Abandonner » n'apparaît dans l'en-tête qu'après un premier geste | — | ouvert | | jamais suivi |
| B1-NOTE-4 | B1 07.11, doutes | Fermentescibles | L'appui long sur un nom fait ce que fait un toucher | — | écarté | | rien de cassé (capture 98-appui-long) |
| B1-NOTE-5 | B1 RESULTAT 07.11 | Fermentescibles | Une recette enregistrée rechargée rouvre son brouillon sans sa fiche (seed perdu) : « Enregistrer » agit comme une reprise sans base serveur | — | ouvert | | à valider sur une vraie recette |
| B1-NOTE-6 | B1 RESULTAT 07.11 | Fermentescibles | Pastilles de malts sans couleur : l'app n'a aucune table de couleurs de malts | — | doublon de TL-10 | | |
| B1-NOTE-7 | B1 RESULTAT 07.11 | Fermentescibles | Quand « Annuler » est là, « du grain » disparaît de la ligne | — | écarté | | forme de sa maquette (règle n° 1) |
| RB-1 | RB (copie B1) | Fermentescibles | Pastille « empâtage ⌄ » écrit au premier toucher | B | doublon de B1-1 | | |
| RB-2 | RB (copie B1) | Fermentescibles | « Crystal 60 » → 60 kg | B | doublon de B1-2 | | |
| RB-3 | RB (copie B1) | Fermentescibles | « 0,2 » crée un ingrédient | B | doublon de B1-3 | | |
| RB-4 | RB (copie B1) | Fermentescibles | « dext » propose Carapils | G | doublon de B1-4 | | |
| RB-5 | RB (copie B1) | Fermentescibles | Couleur 2000 avalée | G | doublon de B1-5 | | |
| RB-6 | RB (copie B1) | Fermentescibles | Deux retraits, le premier perdu | G | doublon de B1-6 | | |
| RB-7 | RB (copie B1) | Fermentescibles | « + » flottant sur le plateau | G | doublon de B1-7 | | |
| RB-8 | RB (copie B1) | Fermentescibles | Contraste « empâtage » en cave | G | doublon de B1-8 | | |
| RB-9 | RB (copie B1) | Fermentescibles | Curseur J+ barre J0 J7 J14 | G | doublon de B1-9 | | |
| RB-10 | RB (copie B1) | Fermentescibles | Trois noms d'écran | D | doublon de B1-10 | | |
| RB-11 | RB (copie B1) | Fermentescibles | Famille « Lactose » | D | doublon de B1-11 | | |
| RB-12 | RB (copie B1) | Fermentescibles | 99999, 0,004, piste noire | D | doublon de B1-12 | | |
| RB-13 | RB (copie B1) | Fermentescibles | Bascule Grain ⇄ à l'aveugle | D | doublon de B1-13 | | |
| RB-14 | RB (copie B1) | Fermentescibles | Rechargement perd la recette | D | doublon de B1-14 | | |
| RB-15 | RB (copie B1) | Fermentescibles | Pied hors écran à 1280 | D | doublon de B1-15 | | |
| RB-NOTE-1 | RB (copie B1) | Fermentescibles | « IBU 0 » sans houblon | — | doublon de B1-NOTE-1 | | |
| RB-NOTE-2 | RB (copie B1) | Fermentescibles | « Grain 8 kg » contre « 8,0 kg » | — | doublon de B1-NOTE-2 | | |
| RB-NOTE-3 | RB (copie B1) | Fermentescibles | « Abandonner » après un premier geste | — | doublon de B1-NOTE-3 | | |
| RB-NOTE-4 | RB (copie B1) | Fermentescibles | Appui long = toucher | — | doublon de B1-NOTE-4 | | |
| N-1 | N 07.11 | Fermentescibles | Double toucher sur la corbeille du plateau : deux articles retirés, « Annuler » ne rend que le dernier | B | déployé | 69239d86 | |
| N-2 | N 07.11 | Fermentescibles | Double toucher sur une proposition : l'article est ajouté deux fois | G | déployé | 69239d86 | |
| N-3 | N 07.11 | Fermentescibles | Nom de 90 caractères : passe sous « 0 kg » et sort de l'écran | G | déployé | bc9e084c | |
| N-4 | N 07.11 | Fermentescibles | « -1 » tapé dans une masse devient « 1,0 kg » sans message | G | déployé | 69239d86 | refus visible fait ; « le reste » (comportement comme sa maquette) non tranché |
| N-5 | N 07.11 | Fermentescibles | Fiche sans bornes : PPG « 0 » et « 0,004 » acceptés, couleur et PPG « -1 » acceptés | G | déployé | 69239d86 | |
| N-6 | N 07.11 | Fermentescibles | Cible « J+ » 20 × 28 px en partie couverte | D | déployé | 69239d86 | recouvrement levé ; « Annuler » qui cache « du grain » = forme de sa maquette (B1-NOTE-7) |
| N-7 | N 07.11 | Enregistrer une vente | Message jaune de connexion Google : contraste 1,32:1 | G | déployé | 69239d86 | 5,65:1 en clair |
| N-NOTE-1 | N 07.11, non compté | Fermentescibles | Contraste en cave sur les autres éléments des lignes teintées (« % du grain » 4,32:1, « kg » et moment 2,22:1, nom choisi 4,3:1) | — | ouvert | | moment, « kg » et part : bf35d73a (B1-8) ; nom choisi 4,3:1 non couvert par `controle-8` : à rejouer |
| N-NOTE-2 | N 07.11, non compté | Fermentescibles | « -1 » et « 0 » en couleur acceptés | — | doublon de N-5 | | |
| N-NOTE-3 | N 07.11, non compté | Fermentescibles | 121 graduations à 2,7 px après un glisser au bout | — | doublon de B1-12 | | |
| N-NOTE-4 | N 07.11, non compté faute de preuve | Fermentescibles | Couleur « 2,5 » affichée « 6,3 » après un double toucher à 1280 (8 fois) | — | ouvert | | jamais rejoué ni compté : perdu |
| N-NOTE-5 | N 07.11, non compté faute de preuve | Fermentescibles | Ligne touchée sans effet à 1280 (6 fois ; « Haferflocken … empâtage 19 % du grain ») | — | ouvert | | jamais rejoué : perdu |
| N-NOTE-6 | N 07.11 | Dépense | La passe du banc sur Dépense n'a pas fini ; aucun défaut compté | — | ouvert | | couverture : banc BT 08.11 en cours |
| BA-NOTE-1 | BA 07.11 | Fermentescibles | 12 essais sur 2 970 en échec : un double toucher sur « Fermer » ou « Abandonner » quitte le document | — | ouvert | | jamais examiné comme un bug de l'app : perdu |
| BA-NOTE-2 | BA 07.11 | banc | Mutants M4 à M6 survivent par masquage (4 tués sur 7) : règles clavier, écriture invisible, texte couvert, entrée absurde, réseau absent, proposition de liste | — | ouvert | | trou du banc, pas de l'app |
| B2-1 | B2 07.11 | Dépense | Badge « 7 +5 ↳ » sur trois lignes à 390 : recouvre la première rangée | B | déployé | c4c36583 | |
| B2-2 | B2 07.11 | Dépense | Unité g puis Kg : le prix lu est effacé, D373 non appliquée | B | déployé | c4c36583 | |
| B2-3 | B2 07.11 | Dépense | Case g : « 2 Kg » devient « 2 g » (pas de conversion), stock « 1 → 1,002 Kg » | B | déployé | 5cf2f99d | conversion exacte ; garde-fou c4c36583 |
| B2-4 | B2 07.11 | Dépense | Montant de la bande coupé au bord droit (403 px pour 390) | G | déployé | c4c36583 | |
| B2-5 | B2 07.11 | Dépense | Toucher sur « Kg » actif : « kg » minuscule, deux formats | D | déployé | c4c36583 | |
| B2-6 | B2 07.11 | Dépense | Prix calculé « 3,3333 » (4 décimales), la rangée passe à la ligne | D | déployé | 5cf2f99d | |
| B2-7 | B2 07.11 | Dépense | Quantité 2 → 3 : la mouture rattachée quitte la rangée en silence | G | déployé | 5cf2f99d | |
| B2-8 | B2 07.11 | Dépense | « Garder » ne referme pas la ligne (D374) | G | déployé | c4c36583 | |
| B2-9 | B2 07.11 | Dépense | Bande d'une ligne : ni chevron ni pli (D378) | G | déployé | c4c36583 | |
| B2-10 | B2 07.11 | Dépense | `renovation` : « Plié » allumé à l'arrivée, 13 lignes sur 16 cachées | D | déployé | 5cf2f99d | |
| B2-11 | B2 07.11 | Dépense | « supprimer » sans « Annuler » | G | déployé | 5cf2f99d | |
| B2-12 | B2 07.11 | Dépense | Libellé de plus de 30 caractères tronqué en silence | G | écarté | | faux positif : `controle-b2-12` vert avant et après, la coupe venait du `slice(0, 30)` du journal du critique |
| B2-13 | B2 07.11 | Dépense | « -1 » → 0, « abc » → vide, prix 99999999 accepté | D | déployé | 5cf2f99d | plafonds : B2-NOTE-10 |
| B2-14 | B2 07.11 | Dépense | Prix « 0,04 » au champ, « 0,040 » à la rangée | D | déployé | c4c36583 | |
| B2-15 | B2 07.11 | Dépense | « Somme = imprimé » sur 2 ou 3 lignes à 390 | D | déployé | c4c36583 | |
| B2-16 | B2 07.11 | Dépense | Sous-rangée « stock : … ⇄ » sur trois lignes | D | déployé | c4c36583 | |
| B2-17 | B2 07.11 | Dépense | Lecture échouée : « Articles · 1 » sans aucun article lu | D | déployé | c4c36583 | |
| B2-18 | B2 07.11 | Dépense | Ligne ajoutée : neuf marques rouges | D | déployé | 5cf2f99d | |
| B2-19 | B2 07.11 | Dépense | `<select>` natif visible dans le pied du plateau (D364) | D | déployé | 5cf2f99d | |
| B2-20 | B2 07.11 | Dépense | `difficile` : « Réessaie » puis « Relire » ; « Relire » ne dit pas qu'il reprend par morceaux | D | déployé | 5cf2f99d | mots seuls ; le reste : B2-NOTE-7 |
| B2-NOTE-1 | B2 07.11, doutes | Dépense | Panneau TVA : bases imprimées 110,40 au-dessus du TTC 86,50 (fixture simulée) | — | ouvert | | à vérifier sur la vraie pièce 372765 ; jamais suivi |
| B2-NOTE-2 | B2 07.11, doutes | Dépense | Ligne ajoutée : la pastille « +1 » n'a pas écrit la quantité (rejeu) | — | ouvert | | à rejouer à la main ; jamais suivi |
| B2-NOTE-3 | B2 07.11, doutes | Dépense | Cibles tactiles du plateau entre 24 et 36 px ; « Mouture … rattacher » 24 × 52 px | — | ouvert | | jamais suivi |
| B2-NOTE-4 | B2 07.11, doutes | Dépense | Bande Levures « 7 Stk » avec « 2 Stk = 2 sachets » : unité de bande = imprimé, pas stock ; sa maquette dit « 3 sachets » | — | ouvert | | choix ou oubli ? jamais suivi |
| B2-NOTE-5 | B2 07.11, doutes | Dépense | « Rattacher les 5 » absent de pu4d-repos ; vient d'une décision mouture postérieure | — | ouvert | | à confirmer au registre des décisions |
| B2-NOTE-6 | B2 07.11, doutes | Dépense | Rechargement en cours d'édition : la feuille se ferme, la persistance d'un brouillon n'est pas observable | — | ouvert | | jamais suivi |
| B2-NOTE-7 | B2 RESULTAT 07.11 | Dépense | « Relire » ne dit toujours pas qu'il reprend par morceaux ni lequel manque (service `lectureMorceaux.ts`, hors périmètre) | — | ouvert | | reste de B2-20 |
| B2-NOTE-8 | B2 RESULTAT 07.11 | Dépense | En g avec une mouture proposée, la pastille « 2 000 g → 2 Kg » coupe le nom sur deux lignes (« Wei / hell ») | — | ouvert | | |
| B2-NOTE-9 | B2 RESULTAT 07.11 | Dépense | Une mouture seulement proposée ne suit pas la quantité de son malt (choix prudent) | — | ouvert | | décision à confirmer |
| B2-NOTE-10 | B2 RESULTAT 07.11 | Dépense | Plafonds posés sans donnée du domaine : quantité 1 000 000, prix 100 000, montant 1 000 000 | — | ouvert | | à ajuster |
| B2-NOTE-11 | B2 RESULTAT 07.11 | Dépense | Le « Détail » de la liste à bandes (lecture) n'a pas la phrase d'écart ; la garde de fermeture ne couvre pas un rechargement | — | ouvert | | reste de TL-38 |
| B2-NOTE-12 | B2 RESULTAT 07.11 | Dépense | « Annuler » du formulaire manuel se vide à chaque nouvelle lecture ; il ne couvre pas le × du formulaire simple | — | ouvert | | |
| TL-1 | TL 07.11 | Recettes, assistant | Bandeau « OG 1,094 » aux étapes, « OG 1,085 » à Levure, alerte « À 1.085 » : deux OG au même écran | B | déployé | 22a89d5f | OG retenue partout, écart dit ; fiche 19a0d538 ; revu en ligne : TE-13 |
| TL-2 | TL 07.11 | Recettes, assistant | FG de la fiche « 1.024 » ≠ FG de l'assistant « 1,021 » | B | déployé | 22a89d5f | fiche 19a0d538 ; « FG retenue · calculée » non rejoué en Chrome |
| TL-3 | TL 07.11 | Recettes | IBU de la liste ≠ IBU de la fiche (65 contre 57, 35 contre 24) | B | déployé | 19a0d538 | |
| TL-4 | TL 07.11 | Recettes, assistant | L'assistant garde l'état de la recette précédente (« à la place de Nuget », levure US-05) | B | déployé | 22a89d5f | fuite du repère ; l'écriture à l'enregistrement n'a jamais été jouée (TL-NOTE-6) |
| TL-5 | TL 07.11 | Recettes, assistant | Moût avant ébullition : 31,1 L et 29,5 L | G | déployé | 22a89d5f | « à chaud » et « à froid » |
| TL-6 | TL 07.11 | Recettes, NOLO | Deux projections d'alcool NOLO au même écran | G | déployé | 22a89d5f | renommé « Alcool simulé » (les deux sont voulues) ; sans preuve Chrome |
| TL-7 | TL 07.11 | Recettes, NOLO | OG en deux formats, « SG » ; bloc « Objectif NOLO » répété trois fois | G | en cours | 22a89d5f | « SG » → « Densité » fait ; bloc répété non fait (voir TE-15) |
| TL-8 | TL 07.11 | Recettes | Point et virgule mêlés sur la même carte (1.085, 88.3, 57.2, 14.7 IBU) | G | en cours | 19a0d538 | fiche corrigée ; restes ouverts : « 14.2 % AA » (`RecipePage.tsx` l. 475), « 71.8 % » (`brewingMath.ts` l. 319, voir TE-20), Récap |
| TL-9 | TL 07.11 | Recettes, Houblons | Houblon hors catalogue (« Nuget », « Hallertauer Mittelfruh ») : α « ? », arômes vides, IBU calculé | G | déployé | 4c94b726 | « lu comme Nugget » avec Confirmer et Refuser ; rapprochement 22a89d5f |
| TL-10 | TL 07.11 | Recettes, Malts | Malts proposés par l'app sans couleur ni PPG (OG « — », EBC « — » alors que la fiche donne l'OG) | G | ouvert | | pas fait : aucune table de couleurs de malts ; décision : table sourcée ? |
| TL-11 | TL 07.11 | Recettes, fiche | Carte d'en-tête NEIPA cassée (texte d'aide dans les cases) ; fiche sans eau, conduite, empâtage ni fermentation | G | en cours | 22a89d5f | en-tête corrigé ; sections absentes non traitées |
| TL-12 | TL 07.11 | Recettes | Même chose nommée de plusieurs façons (étapes/paliers, trois noms de l'étape des grains, « Nouvelle recette » et « Créer une recette », Flocons d'Avoine/Haferflocken, dry hop) | G | en cours | 19a0d538 | paliers : 19a0d538 ; nom d'écran : bc9e084c ; restes ouverts : les deux entrées du menu +, noms de malts doublés, séparateurs du dry hop, « Atelier de recette » et « atelier Houblons V5.5 » |
| TL-13 | TL 07.11 | Recettes | Mots techniques ou faux : « SG », « mash », « Non calculable », « Non comparable », identifiant de levure | G | en cours | 22a89d5f | « SG » et « empâtage » ; nom de levure 4c94b726 ; restes ouverts : « Non calculable » et « Non comparable » (badges de `BrewWizard`) |
| TL-14 | TL 07.11 | Recettes, Levure | « Volume ? inconnu · SG ? inconnu » alors que la recette a 24 L et OG 1,085 ; levure en stock non reliée | G | en cours | 22a89d5f | mots seuls (« à estimer ») ; décision : estimer d'office depuis la recette ? (reco non) |
| TL-15 | TL 07.11 | Recettes | Précision absurde : « 2,7021 L/kg », « 24,012 L », « 91,73 – 93,73 % » | G | déployé | 3db67392 | 22a89d5f (« 4,20 L/kg ») ; `formatLitres` |
| TL-16 | TL 07.11 | Recettes, assistant | Alerte d'eau rouge dès l'ouverture d'une recette enregistrée | G | ouvert | | pas fait par choix (l'alerte est vraie) ; décision : recalculer à l'ouverture avec « Annuler » ? |
| TL-17 | TL 07.11 | Recettes | Masses en formats mêlés ; parts 63 + 19 + 19 = 101 % | G | en cours | bf35d73a | masse au centième (Fermentescibles) ; parts à 101 % de la fiche : `RecipePage.tsx` l. 377 `pct.toFixed(0)` non corrigé |
| TL-18 | TL 07.11 | Recettes, assistant | Assistant monté deux fois : deux « Fermer », le premier inerte | G | ouvert | | pas fait (demande un `matchMedia` simulé dans les tests) |
| TL-19 | TL 07.11 | Recettes | « Nouvelle recette » et « Créer une recette » rouvrent un brouillon existant sans le dire | G | en cours | b2577be6 | reprise à son étape ; encore là en ligne le 08.11 (TE-10) |
| TL-20 | TL 07.11 | Recettes, Brassins | Pastilles de style blanches sur pastel, illisibles en clair | D | déployé | 22a89d5f | contraste 12,3:1 |
| TL-21 | TL 07.11 | Recettes, Brassins | FG et ABV sans chiffre ; « — » et « 0 » pour le même inconnu | D | déployé | 22a89d5f | « — » seul ; FG et ABV de la fiche encore vides : TE-12 |
| TL-22 | TL 07.11 | Recettes, assistant | « empâtage » peu lisible sur la ligne choisie en sombre | D | doublon de B1-8 | | |
| TL-23 | TL 07.11 | Recettes, assistant | Repère OG barrant son chiffre en sombre | D | ouvert | | jamais rejoué (PPG absent des fixtures) |
| TL-24 | TL 07.11 | Recettes | Pluriels : « 2 sachet », « 1 ajout(s) », « 1 paliers » | D | en cours | 19a0d538 | « 1 ajout », « 1 palier » ; « 2 sachet » (`RecipePage.tsx` l. 525, unité brute) non corrigé |
| TL-25 | TL 07.11 | Recettes, Malts | Sous-titre « Sucres et ajouts » : une phrase de pédagogie à la place d'un résumé | D | ouvert | | correctif non retrouvé (classé « ailleurs », aucun commit) |
| TL-26 | TL 07.11 | Recettes, Malts | « Lactose » puis pastille « Lactose » ; barre « 0 % ferm. » qui ne règle rien | D | en cours | bc9e084c | nom : B1-11 ; « 0 % ferm. » non traité |
| TL-27 | TL 07.11 | Recettes, fiche | Potentiel aromatique « Calcul incomplet : durée d'ébullition » pour chaque houblon ; six sous-sections repliées (cockpit) | D | en cours | 8619459b | message nommé une fois ; non reproduit en Chrome (hypothèse `boilMin` : GE-NOTE-2) ; cockpit non traité |
| TL-28 | TL 07.11 | Recettes, Houblons | Suggestions de houblon hors style (Imperial stout : Motueka, Galaxy) | D | déployé | 4c94b726 | « non documenté pour ce style » (option B) |
| TL-29 | TL 07.11 | Recettes, Eau | Phrase doublée « Rinçage à chaud : 13,9 L. 13,9 L … » | D | déployé | 22a89d5f | |
| TL-30 | TL 07.11 | Recettes, Identité | Nom tronqué à 500 px dans le champ (« Nuage Banane — Hefeweisse ») | D | ouvert | | pas fait par choix (nom et pastille de style sur une ligne, r4-a) |
| TL-31 | TL 07.11 | Recettes | Le « + » flottant couvre le chevron « › » de « PPG 37 · fiche » et celui de la levure (haut de page) | D | ouvert | | reste de B1-7 ; même bouton que sa maquette |
| TL-32 | TL 07.11 | Recettes | « V2 » en pastille et « v2 » dans le nom ; deux « Ttt » identiques | D | écarté | | données du brasseur (TRI) |
| TL-33 | TL 07.11 | Brassins, Bord | Brassin planifié dans le passé non signalé (« Prévu le 08.09.2026 ») | D | déployé | 22a89d5f | « date dépassée » ; sans preuve Chrome |
| TL-34 | TL 07.11 | Brassins | « — L en cuve » sur LOT-002 et LOT-001 | D | déployé | 22a89d5f | « Volume en cuve à renseigner » ; sans preuve Chrome |
| TL-35 | TL 07.11 | Finances, journal | Facture « Brau- und Rauchshop 372765 » comptée deux fois (27 opérations, −220,79 CHF) | B | en cours | 79cf1ee2 | code sain ; doublon de données B-001 à B-026 (même commande 686863) ; brasseur 08.11 « Retir. » ; copie de secours faite, retrait pas fait |
| TL-36 | TL 07.11 | Finances, journal | Fiche « Soldé », ses 26 lignes « Paiement à confirmer » | B | doublon de TL-35 | | |
| TL-37 | TL 07.11 | Dépense | Changer l'unité efface le prix | B | doublon de B2-2 | | |
| TL-38 | TL 07.11 | Dépense | Détail des lignes (20012,30) au-dessus du total (12,50) sans alerte ; pas de séparateur de milliers | G | déployé | 5cf2f99d | formulaire manuel ; liste à bandes : B2-NOTE-11 |
| TL-39 | TL 07.11 | Dépense | TVA « 99999 » CHF et taux « −1 » % acceptés | G | déployé | 5cf2f99d | |
| TL-40 | TL 07.11 | Dépense | Fermer une saisie remplie ne demande rien | G | déployé | 5cf2f99d | |
| TL-41 | TL 07.11 | Dépense | Bande de ligne : « 0,2 g × 99999,0 » heurte « 19999,80 » | G | déployé | c4c36583 | |
| TL-42 | TL 07.11 | Dépense | Unité en deux langues et deux casses (« pièce »/« Stk », « Kg »/« kg », « Pck ») | G | en cours | c4c36583 | casse corrigée ; « Stk »/« pièce »/« Pck » non traités |
| TL-43 | TL 07.11 | Dépense | Retrait d'une ligne sans « Annuler » ; la liste repasse en mode simple | G | doublon de B2-11 | | |
| TL-44 | TL 07.11 | Dépense | « Articles, stock et matériel · 1 » sans aucune ligne visible | D | doublon de B2-17 | | |
| TL-45 | TL 07.11 | Finances, journal | Filtres tronqués à 500 px (« À com ») ; chevron sur « Autres filtres » | D | déployé | 8619459b | une glissière avec fondu |
| TL-46 | TL 07.11 | Dépense | « Saisir sans justificatif » ne passe pas par l'écran à bandes (Garder/Retirer, Confirmer) | D | ouvert | | classé « produit », aucune décision écrite : perdu |
| TL-47 | TL 07.11 | Finances | Fournisseur en deux noms (« Brau- und Rauchshop GmbH » et « Cmd 686863 Brau-Rauchshop ») | D | écarté | | données : saisies différentes, les 26 écritures sont à retirer (TL-35) |
| TL-48 | TL 07.11 | Menu « + », barre du bas | Entrées du menu « + » et boutons de la barre du bas sans nom accessible | D | ouvert | | non reproduit en local (`controle-48` : noms présents), non rejoué en ligne |
| TL-49 | TL 07.11 | Stocks, Bord | Trois comptes pour « manque » (« À commander · 12 », « 26 articles au seuil », badge) | G | déployé | 3db67392 | 22a89d5f, 4c94b726, 3db67392 |
| TL-50 | TL 07.11 | Stocks | « Niveau inconnu » hachuré sans moyen de fixer le seuil | D | déployé | 65d3c645 | « Fixer le seuil minimum » |
| TL-51 | TL 07.11 | console | Aucun message console capturé sur la session | — | écarté | | rien à corriger ; le chargement initial n'était pas couvert (TL-NOTE-5) |
| TL-NOTE-1 | TL 07.11, non vu | tous | 1280 × 800 non vu (fenêtre plafonnée à 500 px) ; 390 réel jamais vu en ligne | — | ouvert | | TE a vu 1280 × 649 sur quelques écrans seulement |
| TL-NOTE-2 | TL 07.11, non vu | Dépense | Écran Dépense à bandes (Garder/Retirer, Plié/Déplié, Confirmer) jamais atteint en ligne (lecture de document) | — | ouvert | | Gemini autorisé le 08.11 (« ça fait partie des test ») ; relecture des 13 pièces à faire |
| TL-NOTE-3 | TL 07.11, non vu | Recettes | Gestes d'écriture sur une recette de test impossibles (brouillon étranger en place) | — | écarté | | levé : TE a créé « ZZ TEST — Recette » par « Dupliquer » le 08.11 |
| TL-NOTE-4 | TL 07.11, non vu | Recettes | Étapes 5 et 6 de NOLO, 1, 4 et 7 de NEIPA non vues | — | ouvert | | |
| TL-NOTE-5 | TL 07.11, non vu | tous | Rechargement en pleine saisie, hors ligne, console au chargement initial non vus | — | ouvert | | |
| TL-NOTE-6 | TL 07.11, gestes à jouer | Recettes, Dépense, Stocks | Jamais joués : « à la place de X » s'écrit-il à l'enregistrement ? lequel des trois « Fermer » enregistre ? Détail ≠ Total, TVA, unité changée à l'enregistrement ; Préparer un brassin, Estimer le budget, Copier la recette, Faire relire ; épingle, Suivre au stock, Associer un lot | — | ouvert | | TE a joué une partie (Houblons, Fermentescibles, Clients) |
| TR-NOTE-1 | TR 07.11, gênant produit | Dépense, lecture | La lecture d'une facture ne signale pas une commande déjà saisie (même n° de commande dans `proofNotes`) | — | ouvert | | « à suivre » sans suite : perdu ; candidat à un avertissement de doublon |
| TR-NOTE-2 | TR 07.11 | Recettes | La cible 1,085 de « Mon super stout · v2 » est-elle périmée (ancienne formule 75 % → 69 %) ? Option A (la retenue gagne) montrerait alors un chiffre faux | — | ouvert | | lecture seule de la recette jamais faite : perdu |
| TR-NOTE-3 | TR 07.11, doute | Recettes | `ibuListe` d'une recette sans houblon à chaud (dry hop seul) : la liste garde l'IBU saisi, la fiche écrit « 0 » | — | ouvert | | un inconnu n'est jamais 0 : perdu |
| TR-NOTE-4 | TR 07.11, doute | Recettes | La liste applique le rendement de la cuverie active ; sans rendement propre ni cuverie lisible, repli à 75 % | — | ouvert | | |
| TR-NOTE-5 | TR 07.11 | Recettes, divers | « Non fait : les 15 « À corriger » du TRI » | — | écarté | | repris par la voie « gênants » (GE), états sous TL-9 à TL-50 |
| GE-NOTE-1 | GE 07.11, doute | Stocks, Bord | Changement voulu à valider : un article au seuil exact est dans « À commander » avec « à définir » ; un article sans seuil n'y figure plus | — | ouvert | | décision à confirmer par le brasseur |
| GE-NOTE-2 | GE 07.11, doute | Recettes | Message « durée d'ébullition » non reproduit ; hypothèse : `boilMin` invalide dans « NEIPA Test multi-houblons » | — | ouvert | | à lire en lecture seule : perdu |
| GE-NOTE-3 | GE 07.11, limite | Brassins | TL-33 et TL-34 sans preuve Chrome (il faut un brassin planifié ou en fermentation) | — | ouvert | | |
| GE-NOTE-4 | GE 07.11, limite | tests | Fichiers de test non chargés (`zxing-wasm/reader`, `pdfjs-dist` non installés : `financeArchives` et 27 fichiers Dépense) ; `brewLegacyInstallationApp` : 2 échecs anciens (« Créer le brassin à brasser » introuvable) ; Dépense : 60 échecs anciens | — | ouvert | | non diagnostiqués ; L11 : un vert ne compte pas ces fichiers |
| GE-NOTE-5 | GE 07.11, limite | Levure, NOLO | `YeastPitchingPanel.tsx` et `NoloRecipeSimulator.tsx` touchés par deux auteurs : collision possible | — | ouvert | | diff à relire |
| GE-NOTE-6 | GE 07.11 | Journal | n° 45 : deux rangées de puces (densité) contre glissière sans repère | — | écarté | | tranché par le pilote (8619459b) : une glissière avec fondu |
| TE-1 | TE 08.11 | Clients | Segment sélectionné « Tous 5 » : texte blanc sur pastille gris clair, quasi illisible (aussi « Particulier ») | G | ouvert | | |
| TE-2 | TE 08.11 | Clients | « Téléphone » accepte « abc » ; fiche « Appeler » en `tel:abc`, WhatsApp `wa.me/` vide | G | ouvert | | |
| TE-3 | TE 08.11 | Clients | « 0,00 CHF » au-dessus de « Aucune vente » : un zéro pour un inconnu | D | ouvert | | |
| TE-4 | TE 08.11 | Clients | « 5 clients » et segment « Tous 5 » : le nombre deux fois côte à côte | D | ouvert | | |
| TE-5 | TE 08.11 | Clients | « Réf. CL-006 » attribuée avant l'enregistrement : la suivante est-elle encore CL-006 après annulation ? | D | ouvert | | à vérifier |
| TE-6 | TE 08.11 | Clients, Facturer | « Prix unitaire » vaut « 0 » par défaut : un inconnu affiché en nombre | G | ouvert | | |
| TE-7 | TE 08.11 | Clients, Facturer | Choisir un produit : la liste revient à « Choisir un tarif » ; quantité « −1 » devient 0 et prix « abc » revient à 603 sans message | D | ouvert | | |
| TE-8 | TE 08.11 | Clients, Impôt sur la bière | « 0.00 CHF » avec un point ; « Copier cette estimation » sans retour visible | G | ouvert | | |
| TE-9 | TE 08.11 | Clients, Prix et marges | Aucun moyen de créer un tarif depuis cet écran | G | ouvert | | produit |
| TE-10 | TE 08.11 | Recettes | « Créer une recette » rouvre le brouillon en cours (« Houblons 3/7 ») sans le dire | G | doublon de TL-19 | | confirmé en ligne sur `65d3c645` |
| TE-11 | TE 08.11 | Recettes | Bouton « … » de la carte : libellé « Ranger la recette neipa v3 » alors qu'il ressemble à un menu | D | ouvert | | |
| TE-12 | TE 08.11 | Recettes, fiche | « FG — », « ABV — » (« plage dans la conduite de levure »), liste « Alcool cible — » | D | ouvert | | inconnu honnête mais jamais estimé ni expliqué ; suite de TL-21 |
| TE-13 | TE 08.11 | Recettes, Identité | « OG retenue 1,081 · calculée 1,080 » : la ligne disparaît dès qu'on touche un malt, « retenue » non expliquée | D | ouvert | | suite de TL-1 |
| TE-14 | TE 08.11 | Recettes, NOLO | « 10.4 L » (point), 4,2 + 27,6 ≠ 31,8 non expliqué, densité à 4 décimales, « Données manquantes » sans dire lesquelles | D | ouvert | | |
| TE-15 | TE 08.11 | Recettes, NOLO | NOLO déploie dans Identité 9 champs et 6 dépliants : un cockpit au premier plan | G | ouvert | | voir TL-7 |
| TE-16 | TE 08.11 | Fermentescibles | Un malt passe à « J+3 » (fermentation) sans alerte et reste compté comme empâté ; IBU 40 → 82 | B | doublon de M-1 | | le défaut que le brasseur a vu (OG 1,290) |
| TE-17 | TE 08.11 | Fermentescibles | Même état sous deux noms (« J+3 » et « fermentation ») ; cycle à trois positions sans retour arrière | G | ouvert | | lié à M-1 |
| TE-18 | TE 08.11 | Fermentescibles | « Annuler » de « Caramünch Typ 2 retiré » : aucun effet, le malt n'est pas revenu | G | ouvert | | à reproduire ; contredit B1-6 et N-1 déclarés corrigés |
| TE-19 | TE 08.11 | Fermentescibles | Ajout par pastille : ligne à « 0 kg · 0 % » sans demander la masse | D | ouvert | | |
| TE-20 | TE 08.11 | Fermentescibles | Note de rendement « 71.8 % », « 59.2 % » : point décimal | D | doublon de TL-8 | | reste de TL-8 (`brewingMath.ts` l. 319) |
| TE-21 | TE 08.11 | Recettes, Houblons | Minutes « 999 » et « −5 », α « 150 % », dose « −1 g » acceptés : l'IBU de la ligne disparaît en silence ; α « 0 » remis à 15 | G | ouvert | | |
| TE-22 | TE 08.11 | Recettes, Houblons | À cru : « contact 999 h à 99 °C », « jour 3 », « Fermentation active » acceptés (n'existe pas) | G | ouvert | | impossible métier accepté |
| TE-23 | TE 08.11 | Recettes, Houblons | Liste d'ajout : « FICHE-Houblon%3Aariana · 0 g en stock · 11.5 % AA » (identifiant encodé, point, « AA ») | G | ouvert | | |
| TE-24 | TE 08.11 | Recettes, Houblons | Retirer une ligne de houblon : pas d'« Annuler » (le malt l'a) | G | ouvert | | |
| TE-25 | TE 08.11 | Recettes, Houblons | « 4,167 g/L (25/6 g/L exacts) » : une fraction « exacte » n'aide pas | D | ouvert | | |
| TE-26 | TE 08.11 | Recettes, Houblons | Whirlpool : « fin − 10 min » devient « durée 10 min » ; plus d'IBU tant que « °C » est vide, sans le dire | D | ouvert | | |
| TE-27 | TE 08.11 | Recettes, Houblons | L'étape Houblons embarque l'Atelier V5.5 entier (liste de 150 variétés « unknown », « ID », « COA ») : un cockpit | G | ouvert | | |
| TE-NOTE-1 | TE 08.11, non joué | Clients | Recherche « Nom, contact, téléphone… » non jouée | — | ouvert | | |
| TE-NOTE-2 | TE 08.11, non joué | Clients | Appeler et WhatsApp non joués (ouvrent une app externe) ; href lus | — | ouvert | | |
| TE-NOTE-3 | TE 08.11, non joué | Clients, Facturer | « Enregistrer et télécharger » non joué (PDF : accord requis) | — | ouvert | | |
| TE-NOTE-4 | TE 08.11, non joué | Clients, Impôt | « Ouvrir Taxas » et « Directives OFDF » non joués (sites externes) | — | ouvert | | |
| TE-NOTE-5 | TE 08.11, non joué | Clients, Prix et marges | Enregistrer et Supprimer un tarif non joués (seulement des tarifs réels) | — | ouvert | | lié à TE-9 |
| TE-NOTE-6 | TE 08.11, non joué | Recettes, Houblons | Formulaires de l'Atelier V5.5 (Hypothèse, Dégustation, « Demander au compagnon ») non joués | — | ouvert | | |
| TE-NOTE-7 | TE 08.11, données créées | Clients, Recettes | Données de test créées en ligne : client « ZZ TEST — Clients » (CL-006), recette « ZZ TEST — Recette » (copie de neipa v3) | — | ouvert | | suppression à l'accord du brasseur (demande groupée) |
| LL-1 | LL 03.11 | Dépense, découpe | OpenCV v3 à rejouer sur les 200 pièces et une graine neuve | B | écarté | | OpenCV écarté le 07.11 (143 lignes perdues sur 200 pièces neuves), archivé dans `opencv-essai/` (dd5cf826) |
| LL-2 | LL 03.11 | Dépense, découpe | « Papier couché » : 18 pièces debout refusées | G | écarté | | voie OpenCV archivée |
| LL-3 | LL 03.11 | Dépense, découpe | `sansOmbre` écrit, non branché, non mesuré | D | écarté | | voie OpenCV archivée |
| LL-4 | LL 03.11 | Dépense, découpe | Lignes perdues du repli (h0065 : 37, h0101 : 45) | B | déployé | dd5cf826 | voie F : 0 perdue, 0 rognée sur 200 pièces neuves ; F contre déploiement : LL-NOTE-4 |
| LL-5 | LL 03.11 | Dépense | Issue « document illisible, saisie à la main ou meilleure photo » | G | déployé | dd5cf826 | `PIECE_DIFFICILE` ; vu au banc B2 (`difficile`) |
| LL-6 | LL 03.11 | tests | Vitest d381 à mettre à jour (`planifierImage` asynchrone, `encreDetaillee`, `normaliser`) | D | déployé | dd5cf826 | 96 sur 96 le 07.11 |
| LL-7 | LL 03.11 | Dépense | Indices de coupables (`invoiceControls.ts`, `confiance.ts`) sans tests | G | déployé | dd5cf826 | `coupables.test.ts` |
| LL-8 | LL 03.11 | Dépense | Déploiement, relecture en ligne de ses 13 pièces et 5 tickets, contrôle visuel | B | en cours | 65d3c645 | déployé ; relectures jamais faites depuis (Gemini accordé le 08.11) |
| LL-NOTE-1 | LL 07.11 | Dépense, découpe | Son ticket du 07.11 (métal gaufré à reflets) : ni F ni OpenCV ne trouvent le papier ; lu entier | — | ouvert | | limite connue |
| LL-NOTE-2 | LL 07.11 | Dépense, découpe | Biais : la voie F a été réglée sur les 200 premières pièces (silencieuses 82 → 88 sur pièces neuves) | — | écarté | | avoué ; juge sur graine 2 neuve (L20) |
| LL-NOTE-3 | LL 07.11 | Dépense, découpe | Rangées zébrées : une coupe sous le texte comptait « silencieuse » (critère du banc) | — | déployé | 70355b2c | remesure : F 24 silencieuses, base 3 |
| LL-NOTE-4 | LL 07.11 | Dépense, découpe | Aucune découpe ne tient « 0 silencieux, 0 perdu, 0 rogné » (F : 24 silencieuses ; base : 3 silencieuses, 92 signalées, 6 rognées) ; `DEPLOIEMENT.md` dit F hors déploiement alors que `dd5cf826`, ancêtre de `65d3c645`, la contient | — | ouvert | | 08.11, monitoring : levé. `git diff 202506bb 65d3c645 -- src/services/decoupe.ts` = 455 lignes de `dd5cf826` : F EST EN LIGNE depuis le déploiement du 08.11 (DEPLOIEMENT.md faux). F : 0 ligne perdue ou rognée, 24 coupes silencieuses relues par leur bande de contrôle. Gardée en ligne (réversible) ; ses vraies pièces en ligne tranchent ; dit au brasseur |
| LL-NOTE-5 | LL 03.11 / SU | Dépense | Question au brasseur sur les trous de stock (cas B et C) restée sans réponse | — | ouvert | | |
| SU-1 | SU 07.11, passe en ligne L1 | Fermentescibles | Pastille « empâtage ⌄ » : un toucher change le moment sans menu | B | doublon de B1-1 | | |
| SU-2 | SU 07.11, passe en ligne L2 | Recettes | Pastilles de style : texte blanc sur pastel | G | doublon de TL-20 | | |
| SU-3 | SU 07.11, passe en ligne L3 | Recettes | FG et ABV sans chiffre (« plage dans la conduite de levure ») | G | doublon de TL-21 | | reste : TE-12 |
| SU-4 | SU 07.11, passe en ligne L4 | Recettes | OG 1.081 contre 1,080 ; point et virgule mêlés | G | doublon de TL-1 | | restes : TL-8 |
| SU-5 | SU 07.11, passe en ligne L5 | Recettes | Un écran, trois noms | D | doublon de B1-10 | | |
| SU-6 | SU 07.11, passe en ligne L6 | Recettes | « + » flottant sur « Temps et conduite », collé à « Suivant » | G | doublon de B1-7 | | |
| SU-7 | SU 07.11, passe en ligne L7 | Fermentescibles | Repère de l'OG barre son chiffre « ~1,080 » | D | doublon de TL-23 | | |
| SU-8 | SU 07.11, passe en ligne L8 | Fermentescibles | « empâtage » gris sur olive, contraste faible | G | doublon de B1-8 | | |
| SU-9 | SU 07.11, passe en ligne L9 | Fermentescibles | Bascule Grain → Sucre → « Lactose » : le type prend le nom d'un produit | D | doublon de B1-11 | | |
| SU-NOTE-1 | SU 07.11 | Recettes | Brouillon laissé sur « neipa v3 » (Flocons d'Avoine passé en « ébullition », jamais enregistré) ; boîte « Supprimer ce brouillon ? » ouverte dans l'onglet du monitoring | — | ouvert | | demande groupée finale |
| SU-NOTE-2 | SU 07.11, doutes de la pilote | Fermentescibles | « 0,2 » Entrée juste après une création veut sans doute dire sa masse ; geste neuf à montrer | — | ouvert | | non tranché |
| SU-NOTE-3 | SU 07.11, doutes de la pilote | Dépense | Critère de banc D381 sur les rangées zébrées | — | doublon de LL-NOTE-3 | | |
| SU-NOTE-4 | SU, risque R4 | sécurité | Clé API Gemini en clair dans d'anciens journaux ; révocation recommandée | — | ouvert | | action externe : accord du brasseur |
| SU-NOTE-5 | SU, tâches 14 et 15 | Houblons | Choix ouverts du brasseur à montrer (carte des outils, radar de Comparer, Substituer #145, Dryhopper #146…) ; intégration houblons (#159) d'état inconnu | — | ouvert | | indices du 25.10 à confirmer |
| SU-NOTE-6 | SU, tâche 13 | Dépense | D380/D381 : délais serveur et client adaptés aux morceaux, plafond de 4 pages levé : état réel non relu | — | ouvert | | à vérifier |
| SU-NOTE-7 | SU 07.11 | tests | Tests rouges anciens et fichiers non chargés (brewLegacyInstallationApp, 60 échecs Dépense, 27 fichiers) | — | doublon de GE-NOTE-4 | | |
| SU-NOTE-8 | SU 08.11 | tous | Écrans jamais testés en ligne : Planning, Brassin en cours, Ventes, Fûts, Matériel, Eau, Houblons, Levures, Réglages (Levure : « à refaire », banc arrêté) | — | en cours | | TE et BT (banc tous écrans) en cours |
| DR-1 | DR 07.11 | Fermentescibles | « Crystal 60 » → 60 kg ; « 0,2 » crée un ingrédient | B | doublon de B1-2 | | et B1-3 |
| DR-2 | DR 07.11 | Fermentescibles | « dext », couleur 2000, deux retraits, contraste, J0 J7 J14, 99999 | G | doublon de B1-4 | | B1-5, 6, 8, 9, 12 |
| DR-3 | DR 07.11 | Dépense | Badge, aller-retour d'unité, unité conservée, montant coupé, casse, « Garder », bande d'une ligne… | G | doublon de B2-1 | | B2-2 à 5, 8, 9, 14 à 17 |
| DR-4 | DR 07.11 | Fermentescibles | Doubles touchers, « −1 », fiche sans bornes, cible J+, contraste Google | G | doublon de N-1 | | N-2, N-4 à N-7 |
| DR-5 | DR 07.11 | Recettes | OG 1,085 / 1,094, IBU liste ≠ fiche, « 1.066 », fuite d'état, « Nuget », filtres coupés | B | doublon de TL-1 | | TL-2, 3, 4, 9, 45 |
| DR-6 | DR 08.11 | Recettes, Stocks | Preuves Chrome : en-tête de fiche « 24.012 L » (volume brut), pastille « Stock (1) » au-dessus de « À commander · 0 », « Niveau inconnu » écrit deux fois | G | déployé | 3db67392 | + 65d3c645 pour « Niveau inconnu » |
| DR-7 | DR 08.11 | Dépense | Factures PDF B&R (333258, 372765) lues en 14 morceaux : total « 0,00 » (seule la dernière partie lisait les totaux) | B | déployé | 92de7371 | après `65d3c645` : pas en ligne ; preuve en ligne (pièces 8 et 9) à faire |
| AM-1 | AM A1 08.11 | Fermentescibles | Grain (Pilsner, Caramünch, torréfié, flocons) en « fermentation » J+n, compté dans l'OG et l'EBC (son cas) | B | doublon de M-1 | | `EtapeFermentescibles.tsx:131-138`, `yeastProjection.ts:124` ; aucune table famille × moment |
| AM-2 | AM A2 08.11 | Fermentescibles | Grain à « ébullition » compté avec le rendement d'empâtage (eau comptée, mise à l'échelle non) | B | doublon de M-1 | | `brewingMath.ts:648-653` |
| AM-3 | AM A3 08.11 | Fermentescibles | OG 1,290 affichée sans plafond, avec le conseil inverse « Prévois plus de grain » | B | doublon de M-2 | | `recipeMetrics.ts:35-38`, `Reperes.tsx` |
| AM-4 | AM A4 08.11 | Fermentescibles | Moment hors usage pour les autres familles (fruit bouilli, sucre ou lactose à l'empâtage, extrait cru) | G | ouvert | | aucun commit : audit de code |
| AM-5 | AM A5 08.11 | Fermentescibles | Jour J+ sans plafond ni lien avec le programme de fermentation | G | ouvert | | |
| AM-6 | AM A6 08.11 | Fermentescibles | Potentiel et couleur inventés pour sucre, fruit, lactose, extrait (46, 35, 8, 36 ppg ; EBC 0) | G | ouvert | | PRODUCT.md : ne pas inventer un chiffre plausible |
| AM-7 | AM A7 08.11 | Recettes, Eau | Grain hors maische compté dans l'eau, le rapport L/kg et le pH d'empâtage | G | ouvert | | |
| AM-8 | AM A8 08.11 | Fermentescibles | Recette sans malt de base acceptée (100 % Caramünch, flocons ou torréfiés) | G | ouvert | | |
| AM-9 | AM A9 08.11 | Fermentescibles | Rendement de 75 % par défaut quand rien n'est déclaré | D | ouvert | | |
| AM-10 | AM A10 08.11 | Fermentescibles | « % du grain » compte les grains hors maische | D | ouvert | | |
| AM-11 | AM A11 08.11 | Fermentescibles | Échelles des repères bornées (EBC 0–40, OG 1,040–1,100) : une valeur hors échelle reste collée au bord | D | ouvert | | voir TL-23 |
| AM-12 | AM B1 08.11 | Recettes, Houblons | Alpha jusqu'à 100 % (« 80 » tapé pour 8,0 : IBU ×10, sans alerte) | B | ouvert | | `BrewWizard.tsx:2718-2719` ; voir TE-21 |
| AM-13 | AM B2 08.11 | Recettes, Houblons | Dose de houblon sans plafond ni lien avec le volume (5 000 g pour 20 L) | G | ouvert | | |
| AM-14 | AM B3 08.11 | Recettes, Houblons | Dry hop à J+N après la fin du programme ; jour sans limite haute | G | ouvert | | |
| AM-15 | AM B4 08.11 | Recettes, Houblons | Phase du dry hop contraire à son jour | G | ouvert | | |
| AM-16 | AM B5 08.11 | Recettes, Houblons | Contact de dry hop (5 000 h) et température à cru (400 °C) sans bornes | G | ouvert | | voir TE-22 |
| AM-17 | AM B6 08.11 | Recettes, Houblons | Whirlpool de durée illimitée (600 min) | G | ouvert | | |
| AM-18 | AM B7 08.11 | Recettes, Houblons | Whirlpool de 0 à 100 °C | D | ouvert | | |
| AM-19 | AM B8 08.11 | Recettes, Houblons | Ébullition de 0 ou 1 440 min ; premier moût à 0 min donne 0 IBU sans alerte | G | ouvert | | |
| AM-20 | AM B9 08.11 | Recettes, Identité | Volume final jusqu'à 2 000 L | D | ouvert | | |
| AM-21 | AM B10 08.11 | Recettes, Levure | Température d'ensemencement quelconque (−50 ou 400 °C) | G | ouvert | | |
| AM-22 | AM B11 08.11 | Recettes, Levure | Dose de levure sans rapport avec le volume ; unités kg et L proposées | G | ouvert | | |
| AM-23 | AM B12 08.11 | Recettes, Levure | Atténuation de 0 % ou 100 % | G | ouvert | | |
| AM-24 | AM B13 08.11 | Recettes | Rendement jusqu'à 100 %, sans alerte au-dessus de 95 | G | ouvert | | |
| AM-25 | AM B14 08.11 | Recettes, Paliers | Paliers d'empâtage de 0 à 100 °C, ordre libre (72 puis 63 °C), « mash-out » à 50 °C | G | ouvert | | |
| AM-26 | AM B15 08.11 | Recettes | Recette « prête » sans palier d'empâtage, sans fermentation ni plan d'eau | G | ouvert | | |
| AM-27 | AM B16 08.11 | Recettes, fermentation | Phases de fermentation sans borne de température ni de durée | G | ouvert | | |
| AM-28 | AM B17 08.11 | Recettes, fermentation | Repos diacétyle ou garde mal ordonnés, non signalés | D | ouvert | | |
| AM-29 | AM B18 08.11 | Recettes, Eau | Eau d'empâtage 0 L ; rapport L/kg sans max ; sans profil matériel, aucune alerte | G | ouvert | | |
| AM-30 | AM B19 08.11 | Recettes, Eau | Dose de sel ou d'acide sans plafond (100 g de gypse) | G | ouvert | | |
| AM-31 | AM B20 08.11 | Recettes, Eau | pH cible d'empâtage sans borne | D | ouvert | | |
| AM-32 | AM B21 08.11 | Recettes | Additifs, épices et divers : quantité négative ou NaN, unité et moment en texte libre, aucun éditeur | G | ouvert | | |
| AM-33 | AM B22 08.11 | Recettes, import | Import collé : houblon sans moment lu comme ébullition ; « Empattage » lu comme ébullition | G | ouvert | | |
| AM-34 | AM C1 08.11 | Brassins | Brassin « Planifié » passé en Fermentation, Garde, Conditionné ou Terminé sans brassage ni ensemencement ; le stock est déstocké | B | ouvert | | `BatchDetailSheet.tsx:196-198` |
| AM-35 | AM C2 08.11 | Brassins | Statut qui recule (Terminé → Fermentation ou Planifié) sans confirmation | G | ouvert | | |
| AM-36 | AM C3 08.11 | Brassins, stock | Brassin annulé après déstockage : ajouts restants jamais libérés | G | ouvert | | |
| AM-37 | AM C4 08.11 | Brassins | Date de conditionnement impossible à saisir (`EditBatchModal` non importé) | G | ouvert | | |
| AM-38 | AM C5 08.11 | Brassins, taxe | Volume conditionné, bouteilles et fûts jamais saisissables : la taxe sur la bière exige `volumePackagedL > 0` | B | ouvert | | |
| AM-39 | AM C6 08.11 | Brassins | OG et FG de la fiche sans bornes (ABV de plusieurs centaines de %) ; FG > OG garde l'ancien ABV | B | ouvert | | ABV vers catalogue et taxe |
| AM-40 | AM C7 08.11 | Brassins | Relevé de suivi : densité 0,900–1,300, température sans borne, date non comparée à l'ensemencement | G | ouvert | | |
| AM-41 | AM C8 08.11 | Brassage | Mesures du jour de brassage : pH 0,1 à 14, 120 °C, volume 100 000 L | G | ouvert | | |
| AM-42 | AM C9 08.11 | Brassage | Volume mesuré supérieur au fermenteur (30 L) ou à la cuve (45 L), sans alerte | G | ouvert | | |
| AM-43 | AM C10 08.11 | Brassage | Température d'ensemencement jusqu'à 120 °C | G | ouvert | | |
| AM-44 | AM C11 08.11 | Brassage | Brassage clôturé en Fermentation avec OG et volume inconnus | D | ouvert | | |
| AM-45 | AM C12 08.11 | Brassins | Date de brassage prévue dans le passé acceptée puis seulement marquée « dépassée » | D | doublon de TL-33 | | |
| AM-46 | AM C13 08.11 | Brassins | Aucune occupation de fermenteur : deux brassins peuvent fermenter ensemble dans l'unique 30 L | G | ouvert | | |
| AM-47 | AM C14 08.11 | Brassins | Volume du brassin repris de la recette sans contrôle du matériel actuel | D | ouvert | | |
| AM-48 | AM C15 08.11 | Réglages, matériel | Volume habituel du profil sans plafond ni lien avec le fermenteur | G | ouvert | | |
| AM-49 | AM C16 08.11 | Réglages, matériel | Bornes d'équipement très larges (10 000 L, évaporation 0–100 L/h) | D | ouvert | | |
| AM-50 | AM C17 08.11 | Réglages, calibration | Évaporation et absorption entrent dans la médiane sans contrôle de plausibilité | G | ouvert | | |
| AM-51 | AM C18 08.11 | Recettes, NOLO | Simulateur NOLO : fermentation à 50 °C, empâtage à 100 °C, durées de 1 000 j | D | ouvert | | |
| AM-52 | AM D1 08.11 | Stocks | Unité ou catégorie d'un article modifiable sans conversion (25 kg devient 25 g) | B | ouvert | | `StockDetailSheet.tsx:123-125` |
| AM-53 | AM D2 08.11 | Stocks | Enregistrer la fiche remplace tout le document, quantité comprise (un achat reçu entre-temps peut être écrasé) | D | ouvert | | |
| AM-54 | AM D3 08.11 | Stocks | Correction d'inventaire : motif de perte avec un stock compté supérieur au théorique | G | ouvert | | |
| AM-55 | AM D4 08.11 | Stocks | Suppression d'un article réservé par un brassin ou lié à une recette | G | ouvert | | |
| AM-56 | AM D5 08.11 | Stocks | Aucune date de durabilité (DDM) : un sachet de levure périmé est brassé sans alerte | G | ouvert | | |
| AM-57 | AM D6 08.11 | Dépense | Date de pièce très ancienne ou future (2062, 1999) acceptée | G | ouvert | | |
| AM-58 | AM D7 08.11 | Dépense, TVA | Dépense d'un assujetti sans TVA lue : TVA mise à 0 sans alerte | G | ouvert | | B si assujetti |
| AM-59 | AM D8 08.11 | Réglages, TVA | Taux de TVA libre entre 0 et 100 % ; « 2,6 % Bière » proposé | G | ouvert | | |
| AM-60 | AM D9 08.11 | Dépense | Doublon de facture non détecté (règle « même n° » sur le nom de fournisseur brut) | B | doublon de TR-NOTE-1 | | `purchaseEntry.ts:117` ; bloquant selon l'audit : à promouvoir |
| AM-61 | AM D10 08.11 | Finances | Doublons déjà au grand livre (B-001 à B-026 contre 372765) jamais signalés ; référence QR jamais rapprochée | G | doublon de TL-35 | | |
| AM-62 | AM D11 08.11 | Finances | Recatégoriser une écriture (charge ↔ recette ↔ apport) sans changer son sens | G | ouvert | | |
| AM-63 | AM D12 08.11 | Finances | Écriture à 0 masquée des listes sans alerte | G | ouvert | | |
| AM-64 | AM D13 08.11 | Finances | Avoir sans ventilation de TVA (HT = TTC) | G | ouvert | | |
| AM-65 | AM D14 08.11 | Finances, TVA | Seuil d'assujettissement à la TVA (100 000 CHF) jamais surveillé | B | ouvert | | `tvaThresholdTurnover` lu nulle part |
| AM-66 | AM D15 08.11 | Clients, factures | Facture client sans QR, IBAN non validé, sans référence structurée ni n° TVA | G | ouvert | | |
| AM-67 | AM D16 08.11 | Clients, factures | Article de facture à 0 CHF ; date sans borne | D | ouvert | | voir TE-6 |
| AM-68 | AM D17 08.11 | Ventes | Vente comptoir sans quantité ni lot : le stock de bière ne bouge pas | G | ouvert | | |
| AM-69 | AM D18 08.11 | Ventes | Espèces sans arrondi aux 5 centimes | D | ouvert | | |
| AM-70 | AM D19 08.11 | Fûts | Fût rempli depuis un brassin non fini ; somme des fûts sans contrôle ; fût « livré » sans client | G | ouvert | | |
| AM-71 | AM D20 08.11 | Clients | Stats client par sous-chaîne (« Bar » compte « Barbier ») ; ventes annulées et avoirs comptés | G | ouvert | | |
| AM-72 | AM D21 08.11 | Clients, impôt | Impôt sur la bière : réglages `beerTax*` jamais lus (taux codés en dur, justes) | D | ouvert | | |
| AM-73 | AM D22 08.11 | Finances | Paiement antérieur à la date de la pièce accepté | D | ouvert | | |
| AM-NOTE-1 | AM, limites | tous | Audit de code seul : aucun parcours rejoué dans Chrome ; les lignes G et D des sections B, C et D viennent des analystes, sans contre-lecture ligne à ligne | — | ouvert | | à rejouer par la vision |
| AM-NOTE-2 | AM, limites | Houblons, divers | Non audités : écran Houblons V4 (drapeau éteint), atelier V5.5 champ par champ, garde froide, `BrewThermalControl` | — | ouvert | | |
| AM-NOTE-3 | AM, limites | Stocks, Brassins | `AddStockItemModal`, `EditStockItemModal`, `EditBatchModal` jamais importés : code mort non compté (mais AM-37 et AM-38 en dépendent) | — | ouvert | | |
| BT-1 | BT 08.11 | Fermentescibles | Règle « sens métier » rouge sur `65d3c645` : un grain passe à « ébullition » puis « fermentation J+3 » sans message (26 constats en une passe) | B | doublon de M-1 | | |
| BT-2 | BT 08.11 | Bord, Planning | Aucun écran n'affiche le Planning : `DashboardTab` reçoit `planning` sans le rendre | G | ouvert | | à confirmer par le brasseur |
| BT-NOTE-1 | BT 08.11, non couvert | Compagnon brasseur | Sous `?dev-local` (`localOnly`) le Compagnon brasseur et « Mes conversations » ne s'ouvrent pas ; jouables seulement en ligne | — | ouvert | | |
| BT-NOTE-2 | BT 08.11, non couvert | Outils houblons v4 | `HopToolLayer` (Défi, Égaler, Valeurs…) : drapeau `VITE_HOP_V4` éteint au build de production, aucun bouton du menu ne les ouvre | — | ouvert | | à comparer avec D368 (écrans Houblons rallumés en ligne) |
| BT-NOTE-3 | BT 08.11, non couvert | Dépense | Lecture d'une facture par l'IA non jouée (aucun Gemini) | — | ouvert | | |
| BT-NOTE-4 | BT 08.11, en cours | banc | Mutant M10 en cours ; tableau écran × actionneurs × défauts non rempli | — | en cours | | |
| BT-NOTE-5 | BT 08.11, non couvert | Assistant, Levure | Exclu par la consigne (« à refaire ») | — | écarté | | décision du brasseur, 08.11 |

| C:\Users\mrspa\AppData\Local\Temp\affinee-metier-vision\RAPPORT.md | MV | 34 | 0 | en cours |
| MV-2 | MV 08.11 | Assistant — Malts/sucres (étape 2) | Les trois malts (Pilsner, Weizenmalz, Haferflocken) tous à « fermentation » | B | doublon de M-1 |  | %TEMP%/affinee-metier-vision/captures/121-malts-tous-fermentation.png |
| MV-3 | MV 08.11 | Assistant — Malts/sucres (étape 2) | Malt à « ébullition » | G | ouvert |  | %TEMP%/affinee-metier-vision/captures/10-ferm-malt-ebullition.png |
| MV-4 | MV 08.11 | Assistant — Malts/sucres (étape 2) | Jour d'ajout J+999 | G | ouvert |  | %TEMP%/affinee-metier-vision/captures/24-ferm-jour-999.png |
| MV-5 | MV 08.11 | Assistant — Malts/sucres (étape 2) | 10 000 kg de malt dans 30 L | G | ouvert |  | %TEMP%/affinee-metier-vision/captures/13-ferm-masse-enorme.png |
| MV-6 | MV 08.11 | Assistant — Malts/sucres (étape 2) | Dextrose à l'empâtage | G | ouvert |  | %TEMP%/affinee-metier-vision/captures/12-ferm-dextrose-empatage.png |
| MV-7 | MV 08.11 | Assistant — Malts/sucres (étape 2) | Miel créé comme « Grain » à l'empâtage | G | ouvert |  | %TEMP%/affinee-metier-vision/captures/32-ferm-miel-grain.png |
| MV-8 | MV 08.11 | Assistant — Malts/sucres (étape 2) | Coriandre créée comme grain, « 1 % du grain » | D | ouvert |  | %TEMP%/affinee-metier-vision/captures/33-ferm-coriandre-grain.png |
| MV-9 | MV 08.11 | Assistant — Malts/sucres (étape 2) | « Mangue 20 » en famille « Sucre de lait », 0 % ferm., à l'ébullition | B | ouvert |  | %TEMP%/affinee-metier-vision/captures/32-ferm-miel-grain.png |
| MV-10 | MV 08.11 | Assistant — Malts/sucres (étape 2) | Masse tapée « Mangue 20 » → nom « Mangue 20 », 0 kg | D | ouvert |  | %TEMP%/affinee-metier-vision/captures/27-ferm-mangue-20kg.png |
| MV-11 | MV 08.11 | Assistant — Malts/sucres (étape 2) | PPG tapé 99 → « PPG 9 » retenu | B | ouvert |  | %TEMP%/affinee-metier-vision/captures/21-ferm-ppg-99.png |
| MV-12 | MV 08.11 | Assistant — Malts/sucres (étape 2) | Fruit (Purée de mangue) et lactose cyclent par « empâtage » | G | ouvert |  | %TEMP%/affinee-metier-vision/captures/29-ferm-mangue-moment3.png |
| MV-13 | MV 08.11 | Assistant — Identité (étape 1) | Ébullition 0 min acceptée | G | ouvert |  | %TEMP%/affinee-metier-vision/captures/110-identite-ebullition-0.png |
| MV-14 | MV 08.11 | Assistant — Identité (étape 1) | Ébullition 999 → 1000 min | G | ouvert |  | %TEMP%/affinee-metier-vision/captures/110-identite-ebullition-999.png |
| MV-15 | MV 08.11 | Assistant — Identité (étape 1) | Volume 999 L dans un fermenteur de 30 L | G | ouvert |  | %TEMP%/affinee-metier-vision/captures/50-identite-volume-999.png |
| MV-16 | MV 08.11 | Assistant — Identité (étape 1) | Espace libre 100 % → 99 %, « Remplissage conseillé 0.3 L » | D | ouvert |  | %TEMP%/affinee-metier-vision/captures/114-identite-espace-libre.png |
| MV-17 | MV 08.11 | Assistant — Identité (étape 1) | Nom d'exemple « Milk Stout #2, NEIPA… » sous un style Hazy IPA | D | ouvert |  | %TEMP%/affinee-metier-vision/captures/40-etape-identite.png |
| MV-18 | MV 08.11 | Assistant — Houblons (étape 3) | Alpha −2 % accepté | B | ouvert |  | %TEMP%/affinee-metier-vision/captures/74-houblons-alpha-m2.png |
| MV-19 | MV 08.11 | Assistant — Houblons (étape 3) | Alpha 100 % accepté | G | ouvert |  | %TEMP%/affinee-metier-vision/captures/74-houblons-alpha-100.png |
| MV-20 | MV 08.11 | Assistant — Houblons (étape 3) | 99 999 g de houblon dans 30 L | G | ouvert |  | %TEMP%/affinee-metier-vision/captures/73-houblons-poids-99999.png |
| MV-21 | MV 08.11 | Assistant — Houblons (étape 3) | Durée de contact −3 min | G | ouvert |  | %TEMP%/affinee-metier-vision/captures/75-houblons-temps-60.png |
| MV-22 | MV 08.11 | Assistant — Houblons (étape 3) | Taper « Citra » puis Entrée ajoute « Altus » | B | ouvert |  | %TEMP%/affinee-metier-vision/captures/71-houblons-recherche-citra.png |
| MV-23 | MV 08.11 | Assistant — Paliers (étape 5) | Saccharification à 0 °C | G | ouvert |  | %TEMP%/affinee-metier-vision/captures/80-paliers-temp-0.png |
| MV-24 | MV 08.11 | Assistant — Paliers (étape 5) | Saccharification à 100 °C | G | ouvert |  | %TEMP%/affinee-metier-vision/captures/80-paliers-temp-100.png |
| MV-25 | MV 08.11 | Assistant — Paliers (étape 5) | Palier 2 à 45 °C après 67 °C | G | ouvert |  | %TEMP%/affinee-metier-vision/captures/82-paliers-palier2-plus-froid.png |
| MV-26 | MV 08.11 | Assistant — Paliers (étape 5) | Palier 2 à 78 °C puis mash-out à 76 °C | D | ouvert |  | %TEMP%/affinee-metier-vision/captures/84-paliers-palier2-78.png |
| MV-27 | MV 08.11 | Assistant — Paliers (étape 5) | Durée de palier 99 999 min | G | ouvert |  | %TEMP%/affinee-metier-vision/captures/81-paliers-duree-99999.png |
| MV-28 | MV 08.11 | Assistant — Paliers (étape 5) | Fermentation primaire à 99 °C, 0 °C, maturation à 40 °C | G | ouvert |  | %TEMP%/affinee-metier-vision/captures/86-paliers-ferm-temp-99.png |
| MV-29 | MV 08.11 | Assistant — Paliers (étape 5) | Durée de fermentation 0 j et 9 999 j | G | ouvert |  | %TEMP%/affinee-metier-vision/captures/87-paliers-ferm-duree-9999.png |
| MV-30 | MV 08.11 | Assistant — Eau et sels (étape 6) | Empâtage 0 L | B | ouvert |  | %TEMP%/affinee-metier-vision/captures/91-eau-empatage-0.png |
| MV-31 | MV 08.11 | Assistant — Eau et sels (étape 6) | Rinçage 0 L | B | ouvert |  | %TEMP%/affinee-metier-vision/captures/92-eau-rincage-0.png |
| MV-32 | MV 08.11 | Assistant — Eau et sels (étape 6) | Empâtage 5 L pour 8 kg (0,63 L/kg) | G | ouvert |  | %TEMP%/affinee-metier-vision/captures/91-eau-empatage-5.png |
| MV-33 | MV 08.11 | Assistant — Eau et sels (étape 6) | 500 g de chaque sel + 500 mL d'acide lactique | G | ouvert |  | %TEMP%/affinee-metier-vision/captures/98-eau-sels-500g.png |
| MV-1 | MV 08.11 | Assistant — Malts/sucres (étape 2) | Malt de base à « fermentation » (Pilsner 5 kg, J+3), compté dans l'EBC et l'OG, sans alerte | B | doublon de M-1 |  | %TEMP%/affinee-metier-vision/captures/11-ferm-malt-fermentation.png |
| MV-34 | MV 08.11 | Assistant — Levure (étape 4) | Quantité de levure 99 999 (unité à préciser) et 0 | G | ouvert |  | %TEMP%/affinee-metier-vision/captures/104-recap-tout-ouvert.png |
## Perdus (constats sans correctif, sans décision et sans suite écrite)

Retrouvés dans les rapports le 08.11 ; chacun est maintenant une ligne ouverte ci-dessus.

- TR-NOTE-1 : la lecture d'une facture ne signale pas une commande déjà saisie (« gênant produit, à suivre », jamais repris).
- N-NOTE-4 : couleur « 2,5 » affichée « 6,3 » (8 fois à 1280), « non compté faute de preuve ».
- N-NOTE-5 : ligne touchée sans effet à 1280 (6 fois), idem.
- BA-NOTE-1 : un double toucher sur « Fermer » ou « Abandonner » quitte le document (12 essais en échec, vus comme bruit du banc).
- N-NOTE-1 : contraste du nom choisi (4,3:1) en cave, étiqueté « même cause que B1-8 » mais hors du contrôle qui l'a corrigé.
- B1-NOTE-1 et B1-NOTE-3 : « IBU 0 » sans houblon ; « Abandonner » qui n'apparaît qu'après un geste (doutes jamais suivis).
- B2-NOTE-1 à B2-NOTE-6 : TVA supérieure au TTC, « +1 » sans quantité, cibles de 24 px, unité « Stk » des Levures, « Rattacher les 5 », rechargement d'une saisie Dépense (« doutes non comptés », jamais suivis).
- TR-NOTE-2 à TR-NOTE-4 : cible 1,085 peut-être périmée ; IBU de liste d'un dry hop seul ; rendement de repli à 75 % (jamais lus ni tranchés).
- GE-NOTE-2 : hypothèse `boilMin` de « NEIPA Test multi-houblons » jamais lue.
- TL-25 : phrase de pédagogie du sous-titre « Sucres et ajouts », classée « ailleurs », sans commit.
- TL-46 : « Saisir sans justificatif » sans l'écran à bandes, classé « produit », sans décision.
- TL-17 (parts 101 %), TL-24 (« 2 sachet »), TL-8 (« 14.2 % AA », « 71.8 % »), TL-11 (sections absentes de la fiche), TL-12 et TL-13 (menu « + » à deux entrées, « Non calculable », « Non comparable »), TL-26 (« 0 % ferm. »), TL-42 (« Stk »/« pièce ») : restes que le TRI a classés « à corriger » mais que les lots n'ont pas traités.
- TL-23 : repère de l'OG qui barre son chiffre en sombre, jamais rejoué faute de PPG dans les fixtures.
- B1-1 : « empâtage ⌄ » vu trois fois (L1, B1-1, bc9e084c) et jamais lu comme « un malt en ébullition n'existe pas » : le correctif a changé la forme, pas le fond ; le défaut est M-1, sans correctif retrouvé.
- LL-NOTE-4 : `DEPLOIEMENT.md` écarte la découpe F, mais son code est dans un ancêtre du commit déployé : jamais vérifié sur le paquet servi.

## Couverture non jouée (pas des bugs ; à ne pas perdre)

- Clavier mobile réel, stock réel du brasseur, glisser au doigt sur la piste du plateau (B1, méthode manquante).
- Vraie pièce dans le banc Dépense, état « brouillon », Confirmer / enregistrement, ordre Papier, justificatif, « Regrouper », « Rattacher », « Choisir un autre article », occlusion par le pied (B2).
- Levure : écrans « à refaire », banc et critique arrêtés (décision du brasseur, 08.11).
- Rapports AM, BT et MV : voir la section Sources.

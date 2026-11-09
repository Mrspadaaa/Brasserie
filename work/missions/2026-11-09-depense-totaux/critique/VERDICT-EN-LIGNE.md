VERDICT OK — 5 problèmes, 0 bloquant (« Confirmer » jamais touché ; les deux saisies fermées par × › Abandonner, rien d'enregistré)

Version : 39ece15a (aiTask compris), https://brasserie-l-affinee.web.app, compte connecté (profil `scratchpad/profil-test`), 390 tactile, clair.
Chemin : Finances › + › « Nouvelle écriture · Facture ou saisie à la main » (BX-4 : sur Finances, le menu remplace « Entrer une facture »
par l'action de l'écran ; même vue, App.tsx:564) › input « Importer un justificatif » › photo réelle. Pièces : `pieces/sunstore-2.jpg`
(deux fois : `jouer.mjs` puis `rabais.mjs` pour les fiches), `pieces/bauhaus-tache.jpg`. Scripts, sorties et 41 captures :
`critique/en-ligne/` ; planches `critique/en-ligne/planches/p01` à `p11`, toutes ouvertes (L12). Le bloc arrive en 2 à 5 s, stable à
10 à 19 s. Aucune erreur de page. Comparé à `critique/VERDICT-3.md` (banc, lectures d'avant c1).

Note de méthode : le script appuyait sur Échap avant chaque pastille ; Échap demande la fermeture et fait apparaître le bandeau
« Abandonner cette saisie ? Rien n'est enregistré » (captures 09 à 18). Comportement juste de l'app, bandeau sans effet tant qu'on ne
touche pas « Abandonner » ; il est à moi, pas compté.

## Au fil des gestes

| geste | Sun Store 2 (vu) | BAUHAUS tachée (vu) | problème |
|---|---|---|---|
| Lecture, bloc des contrôles | `05-haut`, `06-bloc` : « Articles lus = comptés 3 · 2 rabais ✓ · Somme = imprimé 149,25 ✓ · Payé · TWINT montant non lu · Le terminal affiche 163,85, plus que le total · Brut − rabais 149,25 / 149,25 ✓ · Lignes hors articles · Photo : rien à signaler · Qté × prix 0/5 · Lectures 3/3 d'accord · ⟳ 3 corrigées » ; 2e passage (`r-*`) : « Qté × prix 2/2 · 1 sans prix unitaire · 4 corrigées » | `05-haut`, `06-bloc` : drapeau « À vérifier · 74,45 CHF · Lectures », « Articles lus = comptés 29 ✓ · ! Somme ≠ imprimé 277,60 / 352,05 −74,45 · Vérifier les montants › · Payé · TWINT 352,05 ✓ · Qté × prix 0/29 · ! Lectures 3/3 · 16 désaccords · Voir le désaccord › · 3 à contrôler · 8 à remplir » | n° 1, n° 3 |
| Pastilles-gestes (chaque rangée touchée) | `09` à `15` : rangées toutes concordantes ou non vérifiables, le focus va sur la rangée, rien à ouvrir (juste : aucun écart) | `09` à `14` : « Somme ≠ » ouvre la 1re ligne VITRIFIC 86,85 (fiche) ; « Lectures » et « Voir le désaccord › » ouvrent BNOSRE NEY.ORANCR 4,55 ; Articles, Payé : focus sur la rangée | — |
| Recherche | `16-recherche-focus`, `17-recherche-rabais` : « rabais » → « 2 lignes sur 5 », bande « 2 trouvées · 3 masquées · × Toutes les lignes », sous-groupe « Autres 2/4 · −2,58 », les deux rabais encadrés ; Échap vide le champ | `17-recherche-peinture` : « Aucune ligne ne contient « peinture » : l'article manque dans les lignes lues », « 0 trouvée · 29 masquées » | n° 4 |
| Rabais | `08-lignes`, `r-rabais-ouvert` : deux sous-lignes « TaxeSansTVA - 0% » −0,68 et −1,90 sous leur article, hors Qté × prix ; fiche : « imprimé « NoVatTax - 0% » », le seul champ « −0,68 », « extrait · supprimer » ; bloc « brut 151,83 − rabais 2,58 = 149,25 » | aucun rabais sur la pièce | n° 2 |
| Fiches d'article | `r-h21-ouverte` : « 2 × — = 50,00 », duel « FACTURE 1re lecture 2 pièces × 50,00 · 100,00 (barré) · 3e lecture 2 × — · Garder · Remettre » ; `r-vaxigrip-ouverte` : « 1 pièce L × 26,68 = 26,68 » | `10-geste-somme`, `14-geste-lectures` : quantité vide, « × 86,85 = 86,85 », +1 +2 +3 +5 +10, Ingrédient · Service · Matériel, « article — · hors stock » | n° 3 |
| × puis Abandonner | `18-apres-x` : bandeau « Abandonner cette saisie ? Rien n'est enregistré … Continuer la saisie · Abandonner » ; `19-apres-abandon` : retour Finances › Synthèse, feuille fermée (`preuveEncore false`) | idem | — |

## Sa question : « combien et quels problèmes il y a ? »

1. **Sun Store 2, même photo, deux lectures à dix minutes d'écart, deux blocs différents.** 1er passage (`05-haut`, `08-lignes`) : les trois
   articles perdent leur prix unitaire (« 2 × — », « 1 pièce × — »), la 1re lecture « 1 pièce × 26,68 » est barrée au profit du tiret,
   « ⟳ 3 corrigées », et le bloc dit « Qté × prix 0/5 » : le 5 compte les deux rabais (le point 4 du VERDICT-2 revient dans cet état,
   le banc disait « 2/2 · 1 sans prix unitaire ») et le 0 déclare non vérifiable une ligne à 1 pièce dont le prix unitaire est le total.
   2e passage (`r-*`) : « 2/2 · 1 sans prix unitaire », « 4 corrigées », Vaxigrip « 1 pièce × 26,68 = 26,68 ». La correction préfère la
   dernière lecture à la première même quand la première est arithmétiquement juste. En brasseur : « pourquoi tu barres 26,68 pour
   mettre un tiret, et pourquoi 0 sur 5 alors qu'il y a 3 articles ? ». Attendu : à 1 pièce, prix unitaire = total, jamais effacé ; le
   dénominateur de Qté × prix sans les rabais dans tous les états ; une lecture qui concorde avec le total ne se fait pas barrer.
2. **La sous-ligne de rabais s'appelle « TaxeSansTVA - 0% »**, traduction du label imprimé « NoVatTax - 0% », au lieu de « Rabais » comme
   sur l'écran accepté au banc (VERDICT-3, point 5 : « Rabais −0,68 · imprimé « NoVatTax - 0% » »). Le bloc, lui, dit bien « 2 rabais »
   et « brut − rabais ». La fiche réduite au montant tient. En brasseur : « TaxeSansTVA, c'est quoi ? c'est un rabais. » Attendu :
   le nom « Rabais » sur la sous-ligne, le label imprimé dans la fiche seulement. Captures `08-lignes`, `17-recherche-rabais`, `r-rabais-ouvert`.
3. **BAUHAUS tachée : aucune quantité sur les 29 lignes** (« × 86,85 », champ quantité vide dans chaque fiche), d'où « Qté × prix 0/29 »
   et 29 lignes à compléter à la main ; au banc, les mêmes lignes avaient leur quantité (« 23/23 justes »). Lecture aiTask, pas la vue,
   mais c'est ce qu'il voit en ligne (L28). Captures `08-lignes`, `10-geste-somme`, `14-geste-lectures`.
4. **Recherche « peinture » sur BAUHAUS : 0 trouvée** et la phrase « l'article manque dans les lignes lues », alors que le sous-groupe
   « Peinture et sols » (5 lignes) est affiché juste au-dessus ; au banc « peinture » rendait « Peinture et sols 29/29 » (VERDICT-3,
   point 3). Le nom du groupe n'est plus cherché, et la phrase affirme un manque qui n'en est pas un. Capture `17-recherche-peinture`.
5. **Barre basse BAUHAUS : « VITRIFIC.P.SGL 5.8KG — nature : lectures divergentes (other /… »** : un mot brut du code (« other ») et une
   parenthèse coupée, visibles sur toute la session (captures `05` à `18`). Attendu : les deux natures lues en français, ou rien.

Bloquants (geste sans effet, valeur fausse, élément absent, texte illisible) : aucun. Les pastilles en écart ouvrent une ligne, « Voir le
désaccord » aussi, la recherche filtre et se vide à Échap, les rabais sont des sous-lignes hors Qté × prix, × ouvre le bandeau et
« Abandonner » ferme sans rien garder. Le n° 1 est le premier à reprendre : il touche la confiance dans les chiffres.

## Table des captures

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| 01 à 04 (×2 pièces) | clair | 390 | Finances, menu +, feuille ouverte, lecture en cours | — | 0 |
| 05-haut, 06-bloc, 07-drapeau sunstore-2 | clair | 390 | bloc, règlement « Payé le 09.11.2026 · date supposée », tuile TVA 0,00 | 1 | 0 |
| 08-lignes sunstore-2 | clair | 390 | Services 1 · 50,00 ; Autres 4 · 2 pièces · 99,25 ; deux « TaxeSansTVA - 0% » | 1, 2 | 0 |
| 09 à 15 gestes sunstore-2 | clair | 390 | rangées touchées, focus, rien à ouvrir (tout concorde) | — | 0 |
| 16, 17 recherche sunstore-2 | clair | 390 | focus, « rabais » 2/5 | 2 | 0 |
| 18, 19 sunstore-2 | clair | 390 | bandeau Abandonner, retour Finances | — | 0 |
| r-rabais-ouvert, r-h21-ouverte, r-vaxigrip-ouverte | clair | 390 | fiche du rabais, duel 1re/3e lecture, fiche à 1 pièce ; « Rabais total CHF −2,58 » barré, barre « pas retrouvée · 1/4 » | 1, 2 | 0 |
| 05 à 07 bauhaus-tache | clair | 390 | drapeau 74,45 CHF, bloc, 3 à contrôler · 8 à remplir | 3, 5 | 0 |
| 08 lignes bauhaus-tache | clair | 390 | Rénovation 29 · Peinture et sols 5 · Outillage 5 · Divers travaux 16, « ? » sur 8 prix | 3 | 0 |
| 09 à 14 gestes, 15 voir-desaccord bauhaus-tache | clair | 390 | Somme → VITRIFIC ouverte ; Lectures / Voir le désaccord → BNOSRE ouverte | 3, 5 | 0 |
| 16, 17 recherche bauhaus-tache | clair | 390 | « peinture » 0/29, bande « Toutes les lignes » | 4 | 0 |
| 18, 19 bauhaus-tache | clair | 390 | bandeau Abandonner, retour Finances | — | 0 |

## Doutes (non comptés)
- « Le terminal affiche 163,85, plus que le total » : la photo imprime « Total EFT CHF 163.95 » (ou .85, flou) et « Total CHF 149.25 » ; la
  note est fidèle à la pièce, le dernier chiffre reste à relire sur l'original.
- « Rabais total CHF −2,58 » imprimé, lu par la 1re lecture puis barré (3e lecture) avec la barre « Rabais −2,58 · pas retrouvée · 1/4 ·
  Garder · Retirer » : juste (un total, pas une ligne), mais c'est un choix de plus à faire.
- H21 : la pièce imprime « 2 … 50.00 » sans prix unitaire ; « 2 × — = 50,00 » est fidèle, et la 1re lecture du 2e passage (« 2 × 50,00 ·
  100,00 ») était fausse : là, la correction a raison.
- La fiche ouverte par « Voir le désaccord » ne montre toujours pas l'autre nom lu (mineur du VERDICT-3, D329) ; la barre basse, elle, dit
  « nature : lectures divergentes ».
- Chip « 2 » / « 3 » sur la tuile Règlement, non expliqué (déjà noté au banc).
- Cave et 1280 non joués en ligne : chaque passage coûte trois lectures Gemini ; le banc les couvrait.
- « Articles lus = comptés 29 ✓ » et 74,45 CHF manquants : les 29 lignes lues font 277,60 ; le compte imprimé concorde, les montants non.
  Fidèle si la pièce imprime 29 articles ; à relire sur l'original.

LEÇON PROPOSÉE : un jeu en ligne qui dépend d'une lecture IA se joue deux fois sur la même pièce avant de juger un état : ici deux blocs
différents à dix minutes (« 0/5 » puis « 2/2 ») ; ce que la vue fait d'une lecture changeante est le vrai sujet du verdict.

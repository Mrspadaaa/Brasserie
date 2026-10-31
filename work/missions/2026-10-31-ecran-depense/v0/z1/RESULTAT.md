OK — série z, 4 concepts (z1 froide, z2 tiède, z3 et z4 chaudes), PAGE OK et COMMUN OK ×4

## Fichiers écrits (tous sous `work/missions/2026-10-31-ecran-depense/v0/`)
- `z1/etat.html`, `z1/NOTE.md`, `z1/capturer-z.mjs` (captures 1280 px et « un point réglé » des quatre z), `z1/RESULTAT.md` (ce fichier)
- `z2/etat.html`, `z2/NOTE.md` · `z3/etat.html`, `z3/NOTE.md` · `z4/etat.html`, `z4/NOTE.md`
- captures, par concept : `<z>-haut.png` (390 × 844), `<z>-page.png` (page entière), `<z>-1280.png`, `<z>-regle.png` (après le
  premier geste : TVA laissée vide). Toutes ouvertes et regardées (L12).

## Les quatre, en une ligne chacune
- **z1 (froide)** — la feuille de la baseline ; le bandeau ambre devient « 86,50 CHF · 23 lignes recoupées · 3 points » + trois chips
  qui sautent au point ; chaque point se règle à sa place (TVA 2,80 · 4,15 · vide ; mouture « rattacher ↑» ; Target bis).
- **z2 (tiède)** — l'écran est la facture redessinée comme le papier, annotée au stylo : tampon « 86,50 · 23 lignes ✓ », bloc MWST
  cerclé, accolades de mouture à l'encre, liens au stock dans la marge ; un stylo 1-2-3 en tête, « y aller ».
- **z3 (chaude)** — trois cartes à régler, une devant, les autres derrière ; somme en grand, barre par famille, pastilles ; frise de
  23 tuiles (0 mot) qui dit le lien au stock et les points.
- **z4 (chaude)** — le pont facture ↔ stock : deux rives, le lien au milieu, « +6 kg », « nouveau · Malt », « Target bis », mouture ×5
  rattachée d'un ↑ ; la TVA en première ligne du pont.

## Sorties décisives (racine du dépôt)
- `node scripts/agents/verifier-page.mjs v0/<z>/etat.html --captures … --min-images 0` : **PAGE OK** ×4 (390 px, sans erreur, sans débord).
- `node …/controle-commun.mjs v0 z1 z2 z3 z4 --page=etat.html --profil=sans-houblons` : **COMMUN OK** ×4 (au-style, fiche, trait,
  legende sautés par le profil ; couleurs, survol, blocs, contraste, standard, parlant, brutes OK).
- `mots-premier-ecran --max=70 --modere --profil=sans-houblons` : z1 95, z2 95, z3 88, z4 98 — tous > 70 (alerte) et ≤ 98 (pas d'échec) ;
  la consigne du brief (≤ 100) est tenue.
- `controle-contraste --profil=sans-houblons` : **CONTRASTE OK** ×4 (pires : 4,85:1 z1 et z4, 5,19:1 z3).
- `controle-panel.mjs` sur les 4 `-haut.png` : **PANEL ECHEC** — remplissage médian 0,42 (seuil 0,55 ; z3 0,41, z1 0,42, z4 0,42,
  z2 0,46), ressemblance 0,90 (seuil < 0,90), 0 paire presque identique. Le remplissage compte les rangées à pixels sombres : un
  formulaire à lignes de 30 px et un écran « une carte à la fois » restent sous 0,50 ; les panneaux gris ne comptent pas. À rejouer sur
  les 12 concepts du lot (r, z, u), le seuil vise le panel entier.

## Honnêteté, dans les quatre
TVA imprimée : les deux valeurs lues côte à côte (2,80 · 4,15) et le calcul (bases 110,40 ≠ 86,50 ; MWST 4,15 ≠ 2,80), HT vide,
« vide » proposé ; « Payé le » marqué « supposée » (= date de facture, non imprimée) ; « Pour quoi ? » marqué « proposé » ; l'unité
imprimée gardée (Kg, g, Stk) et « 2 Stk = 2 sachets » visible ; Target α 11,3 contre 11,8 au stock → bis, jamais écrasé ; mouture
rattachée seulement par son geste ; « 23 lignes recoupées » = somme des lignes = total imprimé ; aucun chiffre inventé (stock simulé,
dit dans chaque NOTE). Les 9 états sont en annexe de chaque page (lecture en 3 étapes, sans point, avec points, réglé, erreur,
Drive à connecter, enregistrement puis reçu « 2026-04-27 Brau- und Rauchshop 372765.jpg · Ouvrir dans Drive », doublon même commande,
hors ligne).

## Prédiction
Il écartera z1 (« c'est la même chose en mieux rangé »), aimera z2 pour le papier annoté (« là je vois ce qu'elle a lu ») et z4 pour le
mapping ligne à ligne (« ça c'est ce que je voulais pour le stock »), trouvera z3 « pas mal mais on voit pas tout » ; il demandera
de greffer le pont de z4 sous le papier de z2.

DÉCISION À PRENDRE : aucune (le panel se juge sur les 12 ; si le pilote veut un remplissage ≥ 0,50 sur z1/z3/z4, c'est une passe 2 :
lignes dépliées par défaut ou rangées plus serrées, au prix des mots).

CONNAISSANCE : `controle-panel.mjs` compte une rangée « pleine » seulement si > 2 % de ses pixels s'écartent du fond de plus de 60 (somme
RVB) : les panneaux gris #F5F5F5 et les bordures #DDDDDD ne comptent pas, seuls le texte, les traits sombres et les aplats colorés
remplissent. Un écran de formulaire blanc plafonne vers 0,45 quelle que soit sa densité d'information.

LEÇON PROPOSÉE : une classe réutilisée pour deux rôles dans une même maquette (z2 : `z2-pt` pour la pastille du stylo et pour la
ligne en doute) casse une ligne en silence et les contrôles restent verts ; c'est L26 (un nom par rôle), confirmé une fois de plus,
à mécaniser : un contrôle qui refuse une classe `<prefixe>-xx` appliquée à deux balises de nature différente (button et div).

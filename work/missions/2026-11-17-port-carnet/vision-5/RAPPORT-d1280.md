# RAPPORT VISION d1280 — carnet porté (18.11)

Banc : `npm run dev` (vite, port 5205, arrêté après les captures), `?preview=carnets`, 1280×800, thème clair puis `&theme=sombre`.
Fixture « ZZ TEST — … », IA simulée, aucune donnée réelle. Worktree port-carnet, HEAD d15b72a3f.
Écart au brief : `vite preview` ne sert pas le banc (`src/main.tsx`, banc gardé par `import.meta.env.DEV`), donc `npm run dev`.
Variables `VITE_FIREBASE_*` factices passées au serveur (pas de `.env` copié). `dist/` non reconstruit, non utilisé.
Captures : 52 fichiers `d1280-<thème>-<nn>-<état>.png`, 26 par thème. 24 captures ouvertes et regardées (20 clair, 4 sombre).

Console : 0 erreur, 0 pageerror, clair et sombre.

## États et gestes (clair ; sombre identique sauf mention)

| n° | Fichier | Ce qui se voit | Agit |
|---|---|---|---|
| 01 | d1280-clair-01-liste.png (sombre-01 vu) | Liste par groupes À comparer, Idée, Choisi ; « dès 420 CHF » ; pictos par type (hotte, évier, extracteur, densimètre), pas de photo ; un seul champ en bas | oui (banc par défaut) |
| 02 | d1280-clair-02-liste-vide.png | Cadre « Votre premier carnet s'affichera ici », « Un carnet garde » + 3 lignes, bulle « Écrivez ici un besoin » avec 3 puces | oui (6 carnets → 0) |
| 03 | d1280-clair-03-creer-avant.png | Cadre « Collez le lien… ou notez un besoin », « Évier inox, 2 bacs · exemple » avec vignette vide, « arrive ici », 3 puces | oui (focus champ) |
| 04 | d1280-clair-04-creer-pendant.png | Frappe réelle « ZZ TEST — Moulin à malt : 2 cylindres, 150 kg/h minimum » ; cadre « Nouveau carnet · Idée », « Ce qui compte · 2 cylindres, 150 kg/h minimum » (critère seul), « Aucun de vos 6 carnets n'en parle » | oui. Carnet proche (état « ↓ arrive ici » + ✻ déjà proche) non atteint |
| 06 | d1280-clair-06-creer-apres.png | « Idée · 18 nov. / Ensuite : l'IA cherche les façons », « ✓ Carnet créé, en tête des Carnets · Annuler », phrase citée, « Ce qui compte » ; Façons, Articles, « Photos · aucune », Notes | oui (Entrée, Carnets 6 → 7). Annuler non testé |
| 07 | d1280-clair-07-carnet-ouvert.png | Carnet Ventilation : « Ce qui compte : Moins de condensation au plafond : capter la buée / tient 80 °C / le débit » ; « Articles 5 lus, 1 sans aperçu » | oui |
| 08 | d1280-clair-08-ajouter-avant.png | Champ « Ajouter à Ventilation… » au focus ; bulle « Le critère « Moins de condensation au plafond : capter la buée » peut trancher entre Hotte inox + extracteur et Extracteur mural seul » | oui (bulle au focus) |
| 09 | d1280-clair-09-article-ouvert.png | Hotte murale 100 cm : grand picto (pas de photo), « le débit 1 200 m³/h, 3e sur 4 », Offre Gastro Lüftung 1 450 CHF « Ouvrir ↗ », « tient 80 °C : oui · exemple », bascule veille allumée « Veille du prix, tous les 3 jours » | oui (toucher article) |
| 10 | d1280-clair-10-comparer.png | « Côte à côte 4 », « rangé par : tient 80 °C d'abord, puis le débit, puis le prix », 1re à 4e, écarté « Ventilateur de plafond 130 cm » (non tient, 180 CHF), 4e « moins bien partout » | oui |
| 11 | d1280-clair-11-texte-pendant.png | Frappe « fond de bac 38 cm minimum » sur Évier. Corps : « va atterrir ici ». Image non ouverte | oui (corps seul) |
| 12 | d1280-clair-12-texte-apres.png (sombre-12 vu) | « ✓ Rangé ici, à l'instant · Annuler », « Un fût de 30 L couché entre dans le bac (38 cm) », « votre phrase : « fond de bac 38 cm minimum » » | oui (11 → 12 : « va atterrir » devient « Rangé ici ») |
| 13 | d1280-clair-13-lien-avant.png | URL « https://exemple.invalid/pompe-magnetique » dans le champ ; cadre « arrive ici », « exemple.invalid · ✻ L'IA lit la page… » | oui |
| 14 | d1280-clair-14-lien-pendant.png | Corps : « Arrive ici, dans Articles exemple.invalid/pompe-ma… ». Image non ouverte | oui (corps seul) |
| 15 | d1280-clair-15-lien-apres.png (sombre-15 vu) | « Pompe magnétique 12 V », « « https://… » », « ✓ Carnet créé · Annuler », « le nom lu sur la page en titre » ; Articles 1 lu, carte 245 CHF « Aimant Exemple · en stock » (vignette icône) ; « Ce qui compte · rien encore » | oui. Pas de photo, pas de caractéristique lue |
| 17 | d1280-clair-17-note-vrac-apres.png | Une seule carte « achat filtre à air G4, 2 pièces », « ✓ Carnet créé · titre mis en forme par l'IA ». Pas de découpe en lignes typées, pas de « 3 lignes rangées dans 2 carnets » | oui sur le carnet créé ; découpe absente |
| 16 | (corps seul, image non ouverte) | Note en vrac : le pendant est déjà passé en « ✓ Carnet créé » | non isolé |
| 18 | d1280-clair-18-menu-idee-ouvert.png | Menu ··· : « Renommer », « Supprimer l'idée » (rouge) | oui |
| 18b | d1280-clair-18b-supprimer-idee.png | « Supprimer le carnet Densimètre de paillasse ? Il part avec 3 articles, 2 façons et 1 note. ni dans À venir, ni en commande » ; « Supprimer » (contour rouge), « Garder » ; fond grisé. Suppression non validée (volontaire) | oui (confirmation seule) |
| 19 | d1280-clair-19-ia-echec.png (sombre-19 vu) | « L'IA n'a pas répondu : rangé sur l'appareil, rien n'est perdu » ; « Ce qui compte : « Tuyau silicone 8 mm, 5 m » » | oui (avis distinct) |
| 20 | d1280-clair-20-ia-eteinte.png | « IA éteinte : rangé sur l'appareil — Ce qui compte… », picto distinct du ✻ | oui (texte distinct de 19) |
| 21 | d1280-clair-21-hors-ligne.png | Image non ouverte | non vu |
| 22 | d1280-clair-22-a-venir.png | « PROCHAIN ACHAT · D'abord · prix trouvé », « ZZ TEST — Frigo de garde pour fûts · 4 900 CHF TTC », « du carnet ZZ TEST — Frigo… » ; « Ouvrir le carnet », « Modifier » ; un seul « + » | oui (segment À venir) |
| 23 | d1280-clair-23-realises.png | Corps : « Archives · Tes projets réalisés… ». Image non ouverte | oui (corps seul) |
| 24 | d1280-clair-24-choisi-pourquoi.png | « Choisi : Densimètre de paillasse à oscillation » ; « Pourquoi ce choix » ; phrase IA « La précision 0,0001 g/cm³, 1er sur 2 ; … 2 100 CHF, 2e sur 2 au prix » ; réglettes Précision et Prix ; ✓ critère, façon, fournisseur | oui |

Sombre : 01 liste, 12 texte après, 15 lien après, 19 IA en échec. Même structure, segment et « + » en jaune. Rien de cassé vu.

## Critique 4 (d1280), vu à l'image

Corrigé, vu : 2 liste vide ; 3 « dès 420 CHF » ; 4 « Ce qui compte » réduit au critère ; 7 texte après « Rangé ici · Annuler » ; 10 tableau (rang, compromis) ; 14 « Compromis : … » et valeurs annoncées ; 15 « Moins de condensation » au lieu de « Plus » ; 22 avis IA échec et éteinte distincts ; 27 en-tête « Idée · date » et « Photos · aucune » ; 29 champ pleine largeur ; 30 placeholder « Ajouter à <titre> » ; 31 champ collé au bas ; 32 critère et rang cohérents ; 36 avis IA en échec ; 40 prix avec CHF ; 41 écarté sans doublon ; 43 ligne compacte ; 44 « 38 cm » conservé ; 46 largeur du tableau.

Partiel : 1 pictos (icônes par type, pas de photo) ; 8 lien après (sans caractéristique ni photo) ; 13 article ouvert (pas de photo, grand picto) ; 16 et 17 Pourquoi (réglettes et phrase vues, ✕ écarté et photo non vus) ; 26 trois bandeaux (deux, « Carnet créé » et « Ce qui compte ») ; 39 « + » unique vu sur À venir, « Ouvrir le carnet » non répété (à confirmer en 390).

Non corrigé, vu : 11 note en vrac non découpée (17) ; 8 lien après sans caractéristique (15).

Non joué ici : 5 et 6 (carnet ouvert et lien non lu classé), 9 (lien illisible), 12 (cartes d'article, R04), 18 (doublon G11), 19 (aide IA note), 20 (veille carnet proche), 21 (photo), 23 et 24 (D-35 et D-63 : bloquants, non joués), 25 (roue « L'IA range » sous bandeau), 33 (modifier une note), 34 (annuler suppression), 35 (supprimer lié), 37 (clavier 300 px), 38 (lisibilité), 42 (doublon de « + »).

## Gestes : agissent ?

- Oui (avant/après visibles) : focus champ (03), frappe (04), Entrée créant le carnet (06), ouverture (07, 09), focus avec bulle G8 (08), Comparer (10), texte rangé (11 → 12), lien collé (13 → 15), menu ··· (18), suppression, confirmation seule (18b), IA en échec et éteinte (19, 20), À venir (22), Pourquoi (24).
- Partiel : note en vrac (16 → 17) : le carnet naît, mais sans découpe.
- Non isolé : pendant de la note (16), hors ligne (21), Réalisés (23, corps seul).

## Bilan

Joués : 26/57 états (sur la liste de la mission). Vus et jugés : 24 captures, dont 4 sombre. Non joués : 31 états (cartes d'article, doublon, veille, photo, micro, carnet proche, Stocks › parc, scénario CARNET-COEUR, modifier, renommer, supprimer note, clavier 300 px, Choix revu, Réalisés ouvert, etc.).
Erreurs console : 0.
Doutes : une capture non ouverte (11, 14, 16, 21, 23) ne valide rien ; l'état de suppression est une confirmation, pas une suppression réelle.

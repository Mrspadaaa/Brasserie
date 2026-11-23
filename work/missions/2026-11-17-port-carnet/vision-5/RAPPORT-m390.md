# Vision m390 : port du carnet (18.11)

Banc : `vite` dev sur 127.0.0.1:4792, `?preview=carnets` (dev seulement, absent du paquet). Données : fixture « ZZ TEST — … », IA simulée, Firebase en valeurs factices (aucune donnée réelle, aucune écriture distante). Build `npm run build` relancé avant (exit 0, dist plus vieux que le dernier commit d15b72a3f). Viewport 390×844, deviceScaleFactor 2, isMobile, hasTouch. Saisie au clavier réel (Puppeteer `type`). Défilement simulé sur les conteneurs défilables (01b, 09b).
Captures : `m390-<thème>-<nn>-<état>.png` dans ce dossier. Passes : `main.cjs` (1re), `main2.cjs`, `main3.cjs`, `errs.cjs` ; journaux `journal-m390*.json`.

## États et gestes (n° du § Vérification de MISSION.md)

Légende « agit » : oui si l'état voulu apparaît après le geste (avant/après comparés) ; non si le geste ne produit pas l'état voulu ; « non joué » si pas tenté.

| n° | État | Fichier (clair / sombre) | Ce qui se voit | Agit |
|---|---|---|---|---|
| 1 | Liste au repos (R01) | m390-clair-01-liste / m390-sombre-01-liste | Segment, À comparer, Idée, Choisi, « dès 420 CHF », « 3 façons · 6 articles · 1 en veille », champ « Une idée, un besoin… », + volant. Sombre lisible. | oui (défilement : 01b) |
| 2 | Liste vide (R02) | m390-clair-02-liste-vide / sombre | Paramètre `&zero=1` et `&vide=1` sans effet : liste pleine. | non joué (état non atteint) |
| 3 | Créer · avant | m390-clair-03-creer-avant | Ouvert par + volant → « Nouvelle idée ». Pas examiné à l'image. | oui (ouvre le carnet) |
| 4 | Créer · pendant, carnet proche | non joué | | non joué |
| 5 | Créer · pendant (saisie) | m390-clair-05-creer-pendant | Saisie « Moulin à malt… » (non examinée à l'image). | non vérifié |
| 6 | Créer · pendant, « Ce qui compte » (G3) | non vu | | non vérifié |
| 7 | Créer · après, « ✓ Carnet créé · Annuler » | m390-clair-07-creer-apres | En-tête complet « Idée · 18 nov. / Ensuite : l'IA cherche les façons » ; « ✓ Carnet créé, en tête des Carnets · Annuler » ; « votre phrase en titre » ; « Ce qui compte » recopie la phrase entière ; Façons / Articles / Photos / Notes « aucune ». Un seul bandeau (pas trois). | oui |
| 8 | Créer · après puis Annuler | non joué | | non joué |
| 9 | Carnet ouvert (R03) | m390-clair-09-carnet-ouvert / m390-sombre-09-carnet-ouvert | Titre, phrase citée, « Ce qui compte » (Moins de condensation…, tient 80 °C, le débit), Articles 5 lus 1 sans aperçu, « Comparer côte à côte », tableau à 4 lignes (rang, pictos, m³/h, CHF). Pas de rangée « Ajouter à … : quoi ? ». Sombre lisible. | oui |
| 10 | Ajouter · avant (bulle G8) | m390-clair-10-ajouter-avant (saisi, non examiné) | Focus sur « Ajouter à Ventilation… ». | oui (focus) |
| 11 | Texte · pendant (R13) | m390-clair-11-texte-pendant | Cadre « ↓ va atterrir ici », « tiré de votre phrase », « Ce qui compte : Évier inox, fond de bac 38 cm minimum », puces « Va dans » (Ce qui compte préchoisie, Note, Façon), bouton « Ajouter » dans le champ. | oui (tapé au clavier) |
| 12 | Doublon « Garder à part » (G11) | non joué | | non joué |
| 13 | Texte · après (R14) | m390-clair-13-texte-apres | « ✓ Rangé dans Évier inox, à l'instant · Annuler », « votre message : « Évier inox, fond de bac 38 cm minimum » ». Compteur 6 → 7. | oui |
| 14 | Texte depuis la liste (G13) | non joué | | non joué |
| 15 | Lien · avant (puce « Coller : … ») | non joué | | non joué |
| 16 | Lien · pendant | m390-clair-16-lien-pendant (saisi) | Lien tapé dans le champ. | oui (saisie) |
| 17 | Lien · pendant depuis la liste | non joué | | non joué |
| 18 | Lien · après (carte complète, g5:v06-10) | m390-clair-18-lien-apres | Aucune carte de lien visible ; la carte du carnet reste « Ventilation ». Compteur 6 → 7 : le lien a créé un carnet ailleurs, non vu. | non — état non atteint |
| 19 | Lien · après, 2e lien (tableau naît) | non joué | | non joué |
| 20 | Lien · après depuis la liste | non joué | | non joué |
| 21 | Lien illisible | m390-clair-21-lien-illisible | « ✓ Lien rangé ici · page non lue · Annuler », « exemple.invalid/page-illisible », « Ouvrir ↗ », « Articles 5 lus, 2 sans aperçu ». | oui |
| 22 | Note en vrac · pendant | m390-clair-22-note-pendant (saisi) | Saisie d'une note. | oui (saisie) |
| 23 | Note en vrac · après | m390-clair-23-note-apres ; capture de la 1re passe (même état) : « ✓ Rangé ici · Annuler », ligne « Prochain brassage 12 déc » en note, « votre phrase : … » | Les lignes passent une à une (Entrée) : une seule ligne par bandeau, « 3 lignes rangées dans 2 carnets » non atteint. Notes typées « à faire », « question », « note » visibles. | partiel |
| 24 | Notes ref/ | non joué | | non joué |
| 25 | Cartes d'article (R04) | non joué | | non joué |
| 26 | Article ouvert (R05) | m390-clair-26-article-ouvert | « Hotte murale 100 cm », « façon hotte inox + extracteur », débit 1 200 m³/h en gros, réglette « 3e sur 4 », Offre Gastro Lüftung 1 450 CHF « Ouvrir ↗ », « Choisir · Gastro Lüftung » en vert, veille « demandée · pas encore relevée », « Part dans À venir ». **Pas de photo.** | oui |
| 27 | Comparer (R06) | m390-clair-27-comparer / m390-sombre (non ouvert) | « Côte à côte 4 », « rangé par : tient 80 °C d'abord, puis le débit, puis le prix », vignettes, « Compromis : la 2e… », « Valeurs annoncées par les vendeurs · exemple ». Colonnes coupées à droite (défilement horizontal). | oui |
| 28 | Choisir, pourquoi (R07) | m390-clair-28-choisir | « Choisir chez Inox Broye », « Écarter », « Pourquoi · proposé, à corriger » avec la phrase de l'IA et les valeurs, « place parmi les 4 », classement 2 à 4. Pas de photo du choisi, pas de réglette « 1er sur 5 ». | oui |
| 29 | Choix revu (ADR) | m390-clair-29-choix-revu | Ouvert (`&adr=1`), non examiné à l'image. | non vérifié |
| 30 | À venir (R08, R32) | m390-clair-30-a-venir | Carte « PROCHAIN ACHAT », « du carnet ZZ TEST — Frigo de garde pour fûts », « Ouvrir le carnet », « Modifier », un seul « + » (volant). | oui (segment) |
| 31 | Réalisés | m390-clair-31-realises | Segment ouvert (`&realise=1`), non examiné. | non vérifié |
| 32 | Modifier une note (menu ···) | m390-clair-32-menu-plus | Menu « Plus » (non examiné ; « Renommer » présent). | oui (menu) |
| 33 | Modifier avec aide IA | non joué | | non joué |
| 34 | Renommer | m390-clair-34-renommer | Ouvert par « Renommer », non examiné. | non vérifié |
| 35 | Supprimer une note | non joué | | non joué |
| 36 | Supprimer une idée sans lien | m390-clair-36-supprimer-idee / m390-sombre-36-supprimer-idee | « Supprimer le carnet Ventilation… ? », « Il part avec 7 articles, 3 façons et 3 notes », G35 « 1 article en veille : les déplacer dans Extracteur… · Déplacer », « ni dans À venir, ni en commande », Supprimer contour rouge (allumé), « Garder ». | oui (confirmation ouverte) |
| 37 | Supprimer · après (Carnet supprimé, Annuler) | non joué | | non joué |
| 38 | Supprimer une idée liée (« 1 lien le retient ») | m390-clair-38-supprimer-lie | Identique à 36 (6 articles), pas de « 1 lien le retient », pas de lien. Paramètre `&lien-retient=1` non effectif. | non — état non atteint |
| 39 | Clavier ouvert, 300 px | m390-clair-39-clavier-300 | Champ « Ajouter à Ventilation de… » visible en bas ; bulle G8 occupe presque tout le reste. Carnet réduit à une bande. | partiel |
| 40 | IA en cours (✻) | m390-clair-40-ia-en-cours | Capture prise après rangement : « Moulin à malt » déjà rangé ; le ✻ n'est pas attrapé (timing). | non — état non atteint |
| 41 | IA en échec (`&ia=echec`) | m390-clair-41-ia-echec / sombre | « Filtre à air G4, 2 pièces » rangé en « à acheter », « votre phrase ». **Aucun avis « IA en échec » visible.** | partiel |
| 42 | IA éteinte | m390-clair-42-ia-eteinte / sombre | Capturée, non examinée. | non vérifié |
| 43 | Hors ligne | m390-clair-43-hors-ligne / sombre | Capturée, non examinée. | non vérifié |
| 44 | Photo 📷 | non joué | | non joué |
| 45 | Dictée 🎤 | non joué | | non joué |
| 46 | + volant sur Carnets | m390-clair-46-plus-volant / m390-sombre | Feuille : « Partout » (Écriture, Facture, Vente, Recette, Brassin, Compagnon), « Sur Carnets · Nouvelle idée ». | oui |
| 47 | Stocks › Matériel, segments | m390-clair-01-liste (segments visibles) | À venir · Carnets · Réalisés dans la barre. Accès au parc non examiné. | partiel |
| 48 | Scénario CARNET-COEUR de zéro | non joué | | non joué |
| 49 | Suppression v2 (plan à venir) | non joué | | non joué |
| 50 | Plan réalisé, « Archiver » seul | non joué | | non joué |
| 51 | Aides éteintes (`&aides=0`) | m390-clair-51-aides-eteintes / sombre | Capturée, non examinée. | non vérifié |
| 52 | Comparer 1 puis 2 articles | non joué | | non joué |
| 53 | Page de choix voie E | non joué (hors banc vision) | | non joué |
| 54 | Banc `&taches=1` | m390-clair-54-taches / sombre | Capturée, non examinée. | non vérifié |
| 55 | Pastilles « lié à » | non joué | | non joué |
| 56, 57 | Idée du calendrier (dev-local) | non joué | | non joué |

Ouvertes par moi (au moins 10) : 01 (clair et sombre), 07, 09 (clair et sombre), 11, 13, 21, 23 (1re passe), 26, 27, 28, 30, 36, 39, 41, 46.

## Critique 4 : ce qui est corrigé à l'image (390 seulement)

- Corrigé : liste « dès 420 CHF » (point 3) ; texte après « ✓ Rangé… · Annuler » (7) ; lien illisible « page non lue · Ouvrir ↗ » (9) ; « Moins de condensation » au lieu de « plus » (15) ; trois bandeaux réduits à un (26) ; en-tête complet, « Photos · aucune » (27) ; un seul « + » sur À venir (39) ; « Déplacer » G35 à la suppression (20) ; placeholder du carnet « Ajouter à Ventilation… » (30) ; ordre « rangé par » cohérent avec « Ce qui compte » (32) ; achat rangé « à acheter » (22, partiel).
- Partiel : pictos (1) : icônes distinctes par objet (évier, jauge, extracteur), mais les deux hottes gardent le même picto ; carnet ouvert (5) : rang, délai, veille, conclusion « Retenir la hotte » présents, vignettes présentes ; lien non lu dans le carnet (6) : « Lien sans aperçu · à relire » ; note en vrac (11) : types visibles, pas de ▾ ni de reformulation ; article ouvert (13) : héros, rang et Choisir vert OK, photo absente ; Comparer (14) : compromis, vendeurs, vignettes OK ; Pourquoi (17) : phrase et valeurs OK, réglettes et photo absentes ; champ (29) : « Ajouter à Ventilation de » tronqué ; clavier (37) : bulle trop haute.
- Non corrigé : « Ce qui compte » recopie la phrase entière, titre compris (4) ; IA en échec sans avis (36, 22) ; photo absente de l'article (13).
- Non vérifié ici : liste vide (2, paramètre inactif), lien après en carte (8), carte d'article (12), doublon (18), aide IA (19), photo (21), D-35 (23), scénario de zéro (24), tableau 1280 (10, 16, 31 : hors 390), créer avant identique (28), Modifier une note (33), annulation de suppression (34), supprimer lié (35, 38).

## Erreurs console

- `errs.cjs` : 6 URL (`''`, `&ia=echec`, `&ia=eteint`, `&hors-ligne=1`, `&aides=0`, `&taches=1`) × 2 thèmes × (article, Comparer, saisie de lien) : 0 erreur console, 0 pageerror.
- Probe initial : 2 erreurs Firebase (`auth/invalid-api-key`) sans variables d'environnement ; levées avec des valeurs factices dans le lancement du dev. Hors de ce point, aucune erreur relevée.
- Les pages de `main.cjs`, `main2.cjs` et `main3.cjs` n'ont pas relevé leurs erreurs dans le journal ; seule la sweep `errs.cjs` les mesure.

## Doutes

- Les états sans capture ouverte (03, 05, 29, 31, 34, 42, 43, 51, 54) sont capturés mais non examinés à l'image : ils ne valident rien.
- Les gestes 18, 38, 40 (lien après, lien lié, IA en cours) ne montrent pas leur état : les paramètres `&lien-retient`, `&zero`, `&vide` et le timing `&ia=lent` ne se sont pas comportés comme attendu. À reprendre avec une fixture ou un délai ajusté.
- Pas de passe 390 en défilement vertical complet de chaque écran (seuls 01b et 09b défilent). Pas de passe à 1280 (hors mission de ce rapport).
- Le lien tapé à la passe 18 n'a pas été retrouvé dans le carnet ouvert : compteur 6 → 7, origine non tracée.

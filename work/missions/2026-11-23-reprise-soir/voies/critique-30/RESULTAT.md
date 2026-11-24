RESULTAT critique : 15 problèmes (B 3, m 6, D 6) — captures work/missions/2026-11-23-reprise-soir/voies/critique-30/cap/ (planches P-*.png ouvertes) — BUGS OK

OK — 15 problèmes, 3 bloquants

Version : index-KxF0Bcaa.js (curl et page). Carnet « ZZ TEST — tour 30 » créé puis supprimé. Carnets avant : 15, après : 15.
Vrais carnets intacts : « Armoire de rangement malte » (Idée · 3 sept., aucun article), « Chambre froide » (2 articles) (Z-armoire.png, Z-liste-finale.png).
Déplacer : la liste des carnets s'ouvre, refermée sans choix pour ne rien écrire dans un vrai carnet.
Tests : sans objet (test d'écran). Registre : `controle-bugs.mjs` → bugs.log « BUGS OK : 2144 bugs, 509 ouverts ».
Coût IA : 11 lectures et 1 escalade ≈ 0,16 CHF, sous le plafond de 0,30 CHF, journalisés dans 2026-11-23-carnet-en-ligne/ia-journal.jsonl.
Onglet de test fermé (`page.close`) ; Chrome de débug resté ouvert (disconnect) ; onglet Calendrier non touché.

## Table
| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| P-L1-debut (L1-t0_3, L1-t1 ; v05-2, v06-1, v03-2) | clair | 390 | Début, Milieu | 9, 10 | 0 |
| P-L1-fin (L1-etat, fiche galaxus) | clair | 390 | Fin sur place, fiche | 8 | 0 |
| P-L23, P-L23f (sios, hopfenmarkt, fiches) | clair | 390 | Milieu, liste, fiches | 3, 11, 12, 14 | 1 |
| P-L4 (brouwland quitté ; v01-repliee) | clair | 390 | Barre repliée (absente), autre carnet, fin ailleurs | 1, 4 | 1 |
| P-L4f (ZZ, fiche Brew Monk) | clair | 390 | Liste, fiche | 5, 13 | 0 |
| P-L5 (brewtools ; base-echec, v03-5) | clair | 390 | Échec, Escalader | 0 | 0 |
| P-L5c | clair | 390 | Compléter | 2 | 1 |
| P-L6, P-L6b (landi rechargé ; v01-fin, v03-4, v05-6) | clair | 390 | Fin retrouvée, autre carnet, fiche | 4 | 0 |
| P-L7m | clair | 390 | Déplacer, Retirer | 5 | 0 |
| P-L8, P-L8f (gastro-held depuis la liste) | clair | 390 | Milieu douteux, fin sur la liste, C'est le bon, Corriger, fiche | 6 | 0 |
| P-L9, L9-retour (doublon) | clair | 390 | Doublon | 6, 7 | 0 |
| P-L10 (Replier, rouvrir, fin, étapes, Fermer) | clair | 390 | Barre repliée par Replier | 5 | 0 |
| P-L11 (Autre lien, Retirer sur échec) | clair | 390 | Échec | 0 | 0 |
| P-Z (suppression) | clair | 390 | Nettoyage | 8 | 0 |
Sombre et 1280 : non capturés (L12 du 22.11 : téléphone surtout, un thème).

## Liens joués
- L1 galaxus : fait. Début conforme à v05-2 et v06-1, plus dense ; fiche en français, Volume 242 l. T25-8 et T26-1 tiennent.
- L2 sios Citra : fait. Fiche « 1 kg · 72,50 CHF/kg ». Aucune ligne « Non publié » pour un houblon (T26-2 tient).
- L3 hopfenmarkt Mosaic : fait. Alpha, récolte et huiles en tête ; le classement prix reste faux (T28-6).
- L4 brouwland, quitté pendant la lecture : fait. « page bloquée, lue par Google », « photo non lue » (T26-3 tient). Pas de barre repliée en quittant.
- L5 brewtools mort : fait. Erreur 404, aucun article, pas de Déplacer (T26-4 tient). Escalader répond « Toujours introuvable » en 1 s. Compléter n'a pas d'effet. Autre lien et Retirer fonctionnent (L11, L12).
- L6 landi, rechargé pendant la lecture : fait. Fin « Lu pendant que l'app était fermée · 7 s », rangée dans ZZ ; dimensions justes (BL-7).
- L7 gastro-held, resté sur la liste des Carnets : fait. Prix HT dit, deux douteux avec « C'est le bon » et « Corriger », poids 82 kg.
- L8 doublon galaxus : fait. « Déjà dans ce carnet » à 0,5 s, sans relecture.
- Gestes en plus : Replier, puis rouvrir par la barre, déplier les étapes, Fermer (L10). Retirer et Déplacer depuis le menu Articles. Annuler après Retirer : non couvert, le toast avait disparu avant le geste.

## T28 rejoués (état versé à BUGS.md)
- Corrigés en ligne au tour 30 : T28-1, 4, 5, 7, 8, 9, 10, 11, 14, 15, 17.
- En partie : T28-2 (reste T30-1, T30-3), T28-3 (reste T30-2), T28-12 (reste T30-13), T28-13 (reste T30-14).
- Présent : T28-6.

## Combien et quels problèmes : 15
1. (B, T30-1) Quand on quitte le carnet pendant la lecture, la barre repliée n'apparaît pas. La carte entière reste en tête de la liste des Carnets, puis en tête du carnet ouvert ensuite (P-L4, P-L8). Écart à sa maquette choisie v01-repliee. La barre n'existe qu'en touchant « Replier » (P-L10).
2. (B, T30-2) Lien mort, « Compléter » : un toast « Article introuvable. » s'affiche, la carte disparaît et aucun formulaire ne s'ouvre. Le geste n'a pas d'effet (P-L5c).
3. (B, T28-6) Mosaic à 7,25 CHF pour 100 g est classé 1er devant Citra à 72,50 CHF pour 1 kg. Aucune quantité dans la liste, ni dans l'offre de Mosaic. Valeur fausse (P-L23, P-L23f).
4. (m, T30-3) La carte de fin de ZZ s'affiche en tête d'« Armoire de rangement malte » et de « Chambre froide ». Elle cache le titre du carnet ouvert, et « dans « ZZ TEST… » » est tronqué. Pas à sa place (P-L6b, P-L4).
5. (m, T30-4) Avec un article en EUR, le rang suit l'ordre d'ajout et le plus cher (302 CHF) passe 1er. La colonne de comparaison change seule : Poids, Hauteur, puis Largeur (P-L4f, P-L7m, P-L10).
6. (m, T30-5) « C'est le bon » touché sur la liste des Carnets : la même question « Prix · douteux » revient dans le carnet (L9-retour).
7. (m, T30-6) Dans la colonne Hauteur, « 2010 » s'affiche sans unité (des mm) à côté de « 180 cm » (P-L9).
8. (m, T30-7) Le toast « Enregistrement sur le serveur… » reste plus de 10 min sur les onglets Articles et Recompter (P-Z, P-L9, P-L10).
9. (m, T30-8) La ligne galaxus de la liste déroule 8 caractéristiques sur 8 lignes, puis « lu sur la page : … » les répète. Pas assez dense (P-L1-fin).
10. (D, T30-9) Le libellé « 8 mesures : 8 ailleurs dans la page » n'est pas en brasseur (P-L1-debut).
11. (D, T30-10) « Lecture · 6 sur 6 » reste affiché, tout « trouvé », pendant 5 s avant « Lu » (P-L1-debut).
12. (D, T30-11) L'étape « Lecture IA : lite ; rien de plus » montre le nom du modèle (P-L23).
13. (D, T30-12) Le toast dit « prix 72,5 CHF » au lieu de 72,50 (P-L23).
14. (D, T30-13) Le libellé « Height without extension legs » est resté en anglais (P-L4f).
15. (D, T30-14) La valeur « Catégorie : Hopfenpellets Typ 90 » est restée en allemand (P-L23f).

## Doutes (non comptés)
- Escalader rend « Relu par une IA plus forte » en moins d'une seconde. Pour une page 404, il est probable qu'aucune IA n'ait été appelée, et la mention serait alors inexacte.
- Fiche landi : « Non publié par le vendeur : Poids » sur une étagère. Je ne sais pas si la page donne un poids.
- « Corriger » sur « Contrôle · douteux » (port) ouvre la fiche, pas un champ de correction.
- Barre repliée par « Replier » : le bouton + n'est plus visible (L10-a-replie).
- La création du carnet ajoute une note « Tour 30 » tirée du titre (02-zz-ouvert).
- Une suite logique : la barre « Lecture du lien · ZZ TEST — tour 30 · 0/6 » n'a pas les compteurs ✓ ? – de v01-repliee.

LEÇON PROPOSÉE : aucune

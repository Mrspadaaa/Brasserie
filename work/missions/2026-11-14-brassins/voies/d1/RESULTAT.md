OK — 4 choix du jour (puces, damier, grand jour, agenda), 20 captures et 1280, critères verts

## En 5 lignes
1. Il a dit (15.11) : « Créer : c2a · Recettes : r2a — Mais bien revoir cette écran notamment pour la sélection de date », sur sa capture de la feuille « Brasser Blonde de soif · v4 ».
2. On lit : la feuille reste (stock vérifié, cuve, rien créé avant « Planifier ») ; c'est le choix du jour qui ne va pas.
3. d1a (froide) : sa feuille, trois jours en puces comme e1a, chacun dit sa raison ; « Autre jour » ouvre le curseur de trois semaines.
4. d1b et d1c (tièdes) : d1b, trois semaines en damier où chaque jour porte l'état de la cuve ; d1c, un seul jour proposé en grand avec sa phrase, ‹ › pour décaler.
5. d1d (chaude) : l'agenda de la brasserie en colonne (dry hop, mise en bouteille, cuve libre), on pose la Blonde sur un jour libre. Au repos : puces / damier / grand jour / colonne d'agenda.

## Ce qui ne va pas dans le choix de date de sa capture
- « Sam. 21 » est choisi sans raison dite : c'est le « +7 j » de e1a, rien ne dit pourquoi ce jour plutôt que mercredi.
- « Plus tard » ouvre on ne sait quoi (une date native ? un report sans date ?) et n'a pas de date ; c'est le seul chemin vers un jour au-delà de la semaine.
- Le jour et la cuve sont dits séparément : « F3, libre après la mise en bouteille de la Pils » ne dit ni quand, ni si « Demain » ou « Sam. 21 » tombent avant ou après. Le brasseur doit faire le lien seul.
- « Demain » (dim. 15) est proposé alors que la Pils est encore en F3 et que c'est le jour du dry hop de la NEIPA (15.11, données) : un choix proposé qui ne marche pas.
- Le stock est vérifié une fois pour tous les jours ; aucune date n'est reliée à un achat. Pour la Blonde, tout est en stock : l'arrivée d'ingrédients ne pèse pas ici (dit une fois en tête).
- « Demain » n'a pas de date, « Sam. 21 » en a une : deux langages sur la même ligne (e1a dit « demain 15 », « +7 j 21 »).

## Données (14.11.2026, samedi, BRIEF-AUTEUR)
- Réelles : NEIPA LOT-019 en F1 (dry hop Citra + Mosaic dim. 15, 21 °C du 16 au 18, garde 2 °C dès le 19) ; Pale Ale LOT-020 réservée en F2, prévue le 08.11 ; Pils LOT-017 en F3, 1,010 stable depuis le 06.11, prête à conditionner.
- Fictive (dite dans chaque NOTE) : mise en bouteille de la Pils prévue mar. 17, F3 libre dès mer. 18. Stock de la Blonde repris de r2a (fictif).

## Fichiers écrits
- d1a/ à d1d/ : etat.html, NOTE.md, 5 PNG chacune (repos, geste, loin, conflit à 390 clair ; repos 390 cave) ; d1d/d1d-repos-1280-clair.png.
- capture.mjs (repris de r2/capture.mjs : états repos, geste, loin, conflit ; mesure le débord de la feuille et les cibles < 44 px) ; tests.txt ; ce fichier.

## Critères (sorties dans tests.txt)
- G1 : SERIE OK
- G2 : IDENTITE OK 4/4
- G3 : NOTE OK 4
- capture.mjs : aucune feuille qui déborde, aucun DEBORD, aucune cible < 44 px, aucune erreur de page.
- Tests : aucune suite Vitest (rien dans src/).

## Captures ouvertes (Read)
- Ouvertes : d1a repos, loin, conflit ; d1b repos, loin, conflit ; d1c repos, conflit, repos cave ; d1d repos, loin, conflit, repos cave, repos 1280.
- Non ouvertes faute de contexte (voir DEMANDE EXECUTANT) : d1a geste, d1a repos cave, d1b geste, d1b repos cave, d1c geste, d1c loin, d1d geste.

## Ce que j'ai vu et corrigé
- Mono (IBM Plex Mono) sur les noms de jour : ressemblait à une machine à écrire ; seuls les chiffres restent en mono, comme e1a.
- d1a : icône d'« autre » absente (nom inconnu de la trousse), étiquettes du curseur superposées : corrigé.
- d1d : la carte cachait le dry hop du 15 au conflit, boutons coupés sur deux lignes, « + ici » absent après le jour posé : corrigé.

## Au repos, à 390, en un coup d'œil
- d1a : trois cases de jour (demain 15 / mer. 18 / +7 j 21) avec « F3 libre / pleine », un bandeau qui dit pourquoi.
- d1b : un calendrier de trois semaines, bande hachurée ou verte sous chaque jour, pictos dry hop, bouteille, garde.
- d1c : « Mercredi 18 nov. » en 28 px, flèches de part et d'autre, sa phrase dessous.
- d1d : une colonne de jours avec ce qui se passe à la cave, la carte de la Blonde posée sur mer. 18.

## Prédiction
Il prendra d1d ou d1b : « là je vois pourquoi le 18 » ; d1c lui paraîtra trop pauvre s'il veut un autre jour que le proposé.

DÉCISION À PRENDRE : la date de mise en bouteille de la Pils (mar. 17) est fictive ; tout le raisonnement « F3 libre dès le 18 » en dépend. Dans l'app, si elle n'est pas datée, la feuille doit dire « F3 libre quand la Pils est en bouteille » et proposer de dater les deux ensemble (bouton « Pils en bouteille le 15 » déjà dessiné au conflit).

DEMANDE EXECUTANT :
- Ouvrir (Read) et décrire en une ligne chacune, en signalant tout texte coupé, chevauchement ou case vide : d1a/d1a-geste-390-clair.png, d1a/d1a-repos-390-cave.png, d1b/d1b-geste-390-clair.png, d1b/d1b-repos-390-cave.png, d1c/d1c-geste-390-clair.png, d1c/d1c-loin-390-clair.png, d1d/d1d-geste-390-clair.png.
- Rien à recapturer ; si un défaut est signalé, le pilote me le renvoie.

CONNAISSANCE : la trousse d'identité n'a pas d'icône « bouteille » ni « calendar-days » (liste : IdTrousse.noms) ; d1b et d1d dessinent la bouteille en SVG au trait lucide.
LEÇON PROPOSÉE : aucune

OK — Comparer r6a : trois colonnes côte à côte, radar r2, chimie et valeurs à un toucher

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6a/generer.mjs` : il lit `donnees/comparer-stout.json`, réutilise le socle w1 (pictos, CSS) et la fiche g1 de l8g.
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6a/etat.html` : la page générée.
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6a/captures.mjs` : script des captures.
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6a/NOTE.md` : contient « Choix portés » (Radar : r2 ; Base : dose égale ; Porte : non ; Descripteurs : A).
- Captures dans `work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/` : `r6a-390.png`, `r6a-premier-ecran.png`, `r6a-fiche-390.png`, `r6a-toucher-390.png`, `r6a-absolu-galaxy-390.png`, `r6a-legende-390.png`.

## Critères (rejoués depuis la racine, dernière passe)
- G1 : `COMMUN OK` (sans MOTS ; tous les contrôles OK : couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, légende, parlant, brutes).
- G2 : `r6a 79 mots` / `MOTS OK`. Il reste un mot de marge : l'IBU a été déplacé sous le toucher pour passer de 98 à 79 mots.
- G3 : `UNE-QUESTION OK (1 groupe libre : houblon)`. Contexte fixé : bière, base, moment, levure.
- G4 : `ACQUIS OK (4/4 : radar, chimie, osu, valeurs)`. Radar et OSU au repos ; chimie et valeurs à un toucher.
- G5 : `ALPHA OK`. Les trois houblons ont leur α.
- G6 : `EXISTENT OK 7`.
- G7 : `NOTE OK`.
- G8 : ce fichier.

Essais utilisés : un seul pour G1, G3, G4 et G5 ; deux pour G2 (98 mots, puis 79).

## Captures ouvertes et jugées
- `r6a-premier-ecran.png` : titre-question, contexte, radar r2 (Idaho 7 plein), têtes, 10 rangées de barres. Lisible en trois secondes : le floral d'Idaho 7 est un peu plus haut (~+1,3), Galaxy est « ~ hors » (tropical), les trois ajoutent ~+2 de résineux.
- `r6a-390.png` : la page entière, avec le panel OSU (trois courbes, zone 4–8 g/L, trait à 3,86 g/L) et le pont vers Dryhopper. Les étiquettes de l'OSU étaient coupées ; c'est corrigé.
- `r6a-fiche-390.png` : appui long sur Cascade. La fiche g1 s'ouvre, avec α 6,5 % et 4,5–9 % ; sa roue ; « + Floral − Résineux ».
- `r6a-toucher-390.png` : vraies valeurs et chimie dans les trois colonnes, avec les sources (H2… BM), « à confirmer » et les inconnus hachurés. Le libellé caryophyllène chevauchait la valeur ; c'est corrigé par une césure.
- `r6a-absolu-galaxy-390.png` : en absolu avec Galaxy mis en avant, le trait de ta stout à 83 et le +19 de résineux se voient.
- `r6a-legende-390.png` : la légende derrière le « ? ».

Réaction probable du brasseur : « pas mal, les colonnes je vois direct lequel fait quoi, mais le radar avec la grosse étoile rose c'est encore compliqué ».

## Doutes et limites
- Le radar au style est petit et chargé. La bande d'Idaho 7 (une seule étude, plages ×100) forme une grande étoile pâle. C'est honnête, mais moins lisible que les barres.
- « Inconnu » vaut aussi pour une famille que les fiches du houblon ne décrivent pas et que le moteur ne bouge pas (delta 0). C'est ma règle, écrite dans le générateur, par exemple pour l'herbacé de Galaxy.
- Les titres des références H… sont lus dans `prototypes/houblons-v4/data/composes-houblon.json`. C'est la source que le JSON du lot cite (`sources.composes`), sans y être recopiée.
- Stock en icône pour Cascade et Galaxy (α « fiche de stock »). Idaho 7 n'en a pas : son α vient d'un article et aucun lot n'est connu.
- Galaxy α 17,2 % ≠ et le rôle « mixte » tiré d'une règle prototype restent douteux, comme le dit ENTREES.md.

DÉCISION À PRENDRE : aucune.

CONNAISSANCE : à dose égale (4 g/L, après fermentation, 3 j, US-05), le moteur fait monter le résineux d'environ +2 crans avec chacun des trois houblons (Cascade, Idaho 7, Galaxy), sur une stout 16D déjà trop résineuse. Seul le floral les distingue un peu (Idaho 7 ~+1,3 contre ~+0,9), et Galaxy sort de la 16D par le tropical.

LEÇON PROPOSÉE : sur un écran Comparer, compter les mots dès la première capture. Les têtes de colonne multiplient chaque mot par trois : « IBU ? » coûtait 6 mots. Un élément répété par houblon passe au toucher avant de couper ailleurs.

OK — T2-5 tenu : frise à 25,0 % en plein écran 844×340 ; T2-2, T2-1, T2B-2 faits ; 5 échecs voisins hors voie (Message.tsx d'une autre voie)

Voie cal, tour 3, reprise (19.11). Dépôt `port-carnet`, branche claude/port-carnet-1711. Pas de commit.

## Fichiers écrits (port-carnet), reprise
- `src/ui/calendrier/entete/entete.css` : paysage, bande des semaines : cases de 22 px (avant 24), marge entre la courbe et la bande 0 (avant 2 ; le cadre de la courbe garde ses 2 px).
- `src/components/tabs/CalendrierTab.tsx` : paysage, écart entre l'en-tête et la frise `space-y-0.5` (2 px, avant `space-y-1` = 4). (Le même fichier porte d'autres modifs qui ne sont pas de ma voie : PC-109, `fluxForce`.)
- `tests/integration/calendrierTour3.test.tsx` : 3 cas T2-5 (13 cas au total).
- Mise à jour pour la règle T2-1 (la courbe alignée n'écrit plus ses mois par défaut ; l'option `moisCourbeAlignee` les remet) : `tests/integration/calendrierTour2Cal.test.tsx` (cas « alignée … garde ses mois ») et `tests/integration/calendrierLotB.test.tsx` (cas paquet E n° 2, passe `moisCourbeAlignee`). Hors « Possède », seule la ligne qui exigeait des mois alignés change.
- Banc (ce dossier) : `banc.mjs` (+ `optimizeDeps.entries: ['index.html']` : sans lui, l'analyse de départ de Vite échoue sur `prototypes/houblons-v4` et la page reste blanche ; cible du toucher : nom d'un brassin non projeté ; ouverture = fiche, ou feuille plein écran), `banc-plein.mjs` (neuf : 844×340 repos puis plein écran, mesure du haut de la frise).

## T2-5 : paysage 844 × 340
Mesure = haut de la frise (`[data-frise]`) moins le bandeau du banc (24 px), comme au tour 2 (« 132 px = 38,8 % repos ; 91 px = 26,8 % plein »). Dans l'app le bandeau n'existe pas.
- AVANT (rouge) : test « expected 24 to be less than or equal to 22 » (`avant-t25.txt`) ; banc `avant-plein.txt` : frise à 132 px au repos (38,8 %), 91 px en plein écran (26,8 %).
- APRÈS (vert, 13 sur 13, `apres-t25.txt`) ; banc `apres-plein.txt`, clair et cave identiques : **frise à 85 px en plein écran = 25,0 %** (cible ≤ 25 % tenue, pile) ; repos : 126 px = **37,1 %** (avant 38,8 %). Décomposition plein écran : courbe 60 + bande 23 (22 + 1 de filet) + 2 d'écart = 85.
- Aucune pièce retirée : courbe, chiffre clé, boutons, bande des semaines, légende des rangées (captures ouvertes : `captures/l844-cave-plein.png`, `captures/l844-clair-repos.png`).

## Contrôles
- G1 : `npx vitest run tests/integration/calendrierTour3.test.tsx` : 13 sur 13.
- G2 : `npx tsc --noEmit -p .` : sortie vide, code 0 (`tsc.txt`).
- G3 : le rouge d'avant est cité ci-dessus (et T2-2 : `avant.txt`, 5 échecs sur 10 sur le code d'origine ; T2-1 : « expected ent-mois to have a length of 0 but got 1 »).
- Tests voisins (`tests.txt`) : `tests/integration/calendrier* tests/unit/calendrier*` : 34 fichiers, 714 réussis, **5 échecs, tous dans `calendrierMessages.test.tsx`** (CRITIQUE-12 : message près de la chose ou en bas, 844×390 ×4 et 390×844 ×1 : « name couvert (cigogne, hotte) », « 'pres' au lieu de 'bas' »). Pas de ma voie : les mêmes 5 échouent avec mes trois changements de T2-5 retirés (essai fait, puis remis) ; `Message.tsx` et `CalendrierTab.tsx` (`fluxForce`, PC-109) portent les modifications d'une autre voie dans ce worktree. À rejouer par le pilote quand cette voie a fini.

## Banc, captures (ouvertes avant de rendre)
`node banc.mjs captures` : `mesures.jsonl`.
- 390 aligné (clair et cave) : `moisCourbe: []`, `rangeesLibelles: 1` (une rangée d'axe, S47…S52, plus de « déc. » en haut) ; `captures/p390-clair-aligne.png`, `p390-cave-aligne.png` ouvertes.
- Zones : à 390, 844 et 1280, chaque barre répond à ±20 px de son centre (6 sur 6 ; à 844, 6 sur 7, la 7e est la marque de 13 px dont la zone se recouvre avec sa voisine ; limite déjà notée).
- Toucher : barre → fiche ouverte (`toucher-barre ouverte: true`, `captures2/p390-clair-fiche.png` ouverte : fiche « Saison de ferme »). Le nom posé à côté d'un brassin PROJETÉ (Ambrée maison, pointillé) ouvre la feuille « Ajouter » préremplie : voulu. Dans le jeu brasseur, tous les autres noms sont dans leur barre : le nom posé à côté se prouve par vitest (`calendrierTour3`), non par un vrai toucher au banc.
- `d1280-clair-repos.png` ouverte : rien ne bouge à 1280.

## À regarder à l'écran (pilote)
`?preview=calendrier&jeu=brasseur` (ou `/?dev-local`, Calendrier). 844×340 tactile : le bouton plein écran (↙↗) : 1re rangée à 25 % de la hauteur (hors bandeau) ; au repos 37 %. 390 : règle allumée, un seul axe. 1280 : inchangé.

## Doutes et limites
- 25,0 % est pile sur la cible : une ligne de plus au-dessus de la frise la dépasse. Repos paysage : 37,1 %, non 25 % (option a du pilote : repos inchangé).
- Marge de 0 px entre la courbe et la bande : à regarder (capture : propre, les semaines sont lisibles sous le filet).
- Essais : T2-5 un ; aucun critère n'a demandé plus de deux passes.

CONNAISSANCE : en paysage 844×340, la frise démarre à 126 px au repos et 85 px en plein écran ; ce qui la précède : en-tête de l'app 41 (caché en plein écran), courbe 60, bande 23, écart 2.
LEÇON PROPOSÉE : un banc Vite lancé par `createServer` sous `npm run dev` d'un dépôt qui contient des prototypes doit fixer `optimizeDeps.entries: ['index.html']`, sinon l'analyse de départ échoue (alias `@app` des prototypes) et la page reste blanche, sans erreur du banc (s'ajoute à `process.chdir` pour Tailwind).

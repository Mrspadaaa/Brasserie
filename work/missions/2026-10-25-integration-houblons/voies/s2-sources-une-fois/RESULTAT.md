OK — sources une seule fois, carte qui se referme, mots en français, appui long sur les grammes ; contrôle Chrome vert, build vert

(Réserves : `construire.mjs` et `controle-etats` non lancés, laissés à la voie mécanique sur ordre du pilote ; 7 tests rouges du dossier `hopIndexV4` ne sont pas de cette voie, voir « Critères ».)

## Fichiers écrits
- Neufs : `src/ui/hopIndex/maBiere/carteOuverte.tsx` (état d'une seule carte dépliée, au niveau de l'étape), `src/ui/hopIndex/maBiere/appuiRepete.ts` (appui long qui répète le pas) ; `tests/integration/controle-sources-une-fois.mjs` (Chrome, 390 × 844) ; `tests/unit/hopIndexV4/cartesOuvertes.test.tsx` (5 tests), `appuiRepete.test.tsx` (6 tests) ; `img/` de la voie (captures avant et après).
- Modifiés : `maBiere/index.tsx`, `Carte.tsx`, `Ajouter.tsx`, `legende-bande.tsx`, `briques.tsx` ; `fiche/Replis.tsx`, `FicheHoublon.tsx`, `Matrice.tsx` ; `commun/plagesSources.ts` (`titreTrait`) ; `substituer/index.tsx` ; `comparer/Feuilles.tsx`, `Huiles.tsx`, `index.tsx` (lignes de noms de sources seulement) ; tests : `traductionMots.test.ts` (élargi), `plagesSources.test.ts` et `sourcesLignes.test.tsx` (les attendus « le survol nomme les sources » deviennent « le survol dit la plage et le nombre de sources »).
- Non touchés : `src/domain/hopIndex/v4/`, `src/ui/hopIndex/biere/`, `HopToolLayer.tsx`.

## D168 : les sources une seule fois (inventaire, fichier:ligne sur HEAD)
Règle appliquée, lecture étroite : plus de nom de source (ni sigle) à côté d'un mot, d'une valeur, d'une huile ou d'une α, au premier plan comme au survol. Les noms restent dans la section « Sources » de la fiche (`SourcesFiche.tsx`, lien Beer Maverick intact) et dans la donnée (`data-sources`, `data-source`, `sans[].sources`).
- Ma bière, carte dépliée : `maBiere/legende-bande.tsx:156` (ligne ◇ : « vanille Beer Maverick, Hopsteiner, Charles Faram »), `:158` (« huiles … Hopsteiner 2025 »). `briques.tsx:98` (survol d'un mot de « autres » : liste de fiches). Retirés.
- Survol de l'usage : `briques.tsx:50,54`, `Ajouter.tsx:230` (« fournisseur : Hopsteiner » devient « attesté par un fournisseur »).
- Fiche : `Replis.tsx` Styles (nom de la source du style), Huiles (« totale, Beer Maverick », « 25–35 %, Beer Maverick », « thiols, Hopsteiner ») : retirés, une rangée par plage qui diffère ; `FicheHoublon.tsx:172` (aria-label de l'α) ; `Matrice.tsx:47,83,90` (« Hopsteiner le range… », aria-label des fiches) ; note « Scores de Beer Maverick non importés ».
- Substituer : `index.tsx:135` (survol des traits : `titreTrait` donne « 13–17 · 3 sources d'accord », plus de noms), `:396` (« Employé en … (Hopsteiner) »), `:398` (« (Beer Maverick) » après les descripteurs), notes `:517`, `:849`, `:859`, `:910`.
- Comparer : `Feuilles.tsx:341` (sigles BM, HS, BH… à côté de chaque valeur) et `:422` (légende « BM Beer Maverick … »), `Huiles.tsx:27,112` et `index.tsx:433,588` (survols et aria-labels avec noms de sources). Les citations d'études de la rangée OSU (H22, H77) restent.
- Suggérer : rien à retirer (grep : aucun nom de source affiché). Dryhopper : rien dans les lignes d'info de houblon ; les citations d'études des feuilles sont intactes (voir question).
- Marqueur ◇ et « autres n % » inchangés (vérifié par le contrôle Chrome).
- Aucun renvoi « Sources » ajouté : la fiche a déjà son bouton « Sources › » en pied, et la carte mène à la fiche par l'appui long sur le nom. Substituer n'a pas de renvoi propre : j'ai donc retiré les noms du survol aussi (le brasseur voulait les plages qui diffèrent, elles restent).

## D169 : la carte qui se referme
- L'état « carte dépliée » n'est plus dans chaque carte mais dans l'étape (`carteOuverte.tsx`, posé par `EtapeHoublonsContenu`) : une seule à la fois, cartes du rail et lignes d'ajout rapide ensemble (`rapide:<clé>`).
- Se ferme quand : une autre carte s'ouvre ; l'écran de l'étape change (la fiche) ; un outil recouvre l'étape (l'app pose `aria-hidden`/`inert` sur l'étape, qui reste montée dessous : observateur de mutations) ; donc la vue retrouvée est fermée. Échap referme la ligne du « ? ».
- Autres listes à cartes dépliables de l'étape Houblons : « Ajouter » (ajouts rapides) avait « une seule à la fois » entre ses lignes mais ne se fermait ni avec une carte du rail, ni au changement de vue : corrigé avec le même état. La légende « ? » du profil (`index.tsx`) n'est pas une carte : inchangée. Suggérer (`vue-radar.tsx:162`, « voir les autres ») et Comparer (volets d'`Etapes.tsx`) sont des bascules de leur propre écran, pas des listes de cartes : non touchées.

## D170 : plus d'anglais
- Cause : `speciauxDe` (`legende-bande.tsx`) formait les « mots précis par famille » de la carte avec sa propre mini-table (`EQUIVALENTS`, 3 mots) et n'appelait pas `motAffiche` de t1. Les cinq autres écrans passaient par la table, celui-ci non, et `traductionMots.test.ts` ne le couvrait pas.
- Correctif : `motAffiche` partout ; Lotus montre « orange · citron » (la ligne « tropical fruits » disparaît : c'est le nom de la famille, déjà un mot générique, comme les autres noms de famille).
- Test : `traductionMots.test.ts` couvre maintenant les mots par famille et ◇ de la carte, pour les 318 houblons, et la carte de Lotus. 7/7 verts.

## D173 : appui long sur les grammes
- `appuiRepete.ts`, branché sur − et + de la carte (`Carte.tsx`) : toucher court = 1 pas de 2 g ; appui long : répétition après 0,5 s, d'abord toutes les 240 ms puis jusqu'à 60 ms (−20 ms par pas) ; arrêt au relâché, à l'annulation, ou quand le doigt sort du bouton (`pointermove`) ; le clic qui suit n'ajoute pas un pas de plus ; 0 g au minimum (la répétition s'arrête). La valeur courante est lue dans une réserve mise à jour à chaque pas (pas de pas perdu entre deux rendus).
- Il n'existe pas d'autre pas de grammes dans l'étape Houblons (les ajouts rapides n'ont qu'un « + » qui ajoute la dose proposée) : rien d'autre à brancher.
- Tests : `appuiRepete.test.tsx`, timers simulés : un toucher = 1 pas, un appui de 1,5 s = au moins 5 pas, accélération, sortie du bouton, borne 0 g, clavier. Chrome : 10 → 12 g (toucher), 12 → 22 g (1,5 s), 22 → 0 g (appui long sur −).

## Critères
- Contrôle Chrome `tests/integration/controle-sources-une-fois.mjs` : sur HEAD (`--suffixe=avant`) 12 ECHEC (A, B, C, D, E : noms de sources sur la carte, la fiche et Substituer ; « orange · lemon / tropical fruits » ; plusieurs cartes ouvertes ; carte restée ouverte au retour de Substituer et de la fiche) ; après : `CONTROLE OK` (A à G, aucune erreur de page). F (Comparer) et G (grammes) n'ont pas pu être rejoués sur HEAD (pas de `git stash` permis) : F a échoué sur mon premier passage partiel (noms dans les survols de la composition des huiles), G n'a aucune fonction sur HEAD.
- `npx vitest run tests/unit/hopIndexV4` : 641 verts, 7 rouges, tous hors de cette voie : `departage.test.ts` ×4 et `apportMinoritaire.test.ts` ×1 (domaine g2a/g2d en cours, `src/domain/hopIndex/v4/` modifié par d'autres voies) ; les 2 de `sourcesLignes.test.tsx` étaient les miens (attendus d'avant D168) et sont mis à jour : verts.
- `npm run build` : vert.
- `construire.mjs` / `controle-etats` : non lancés (ordre du pilote). Les états de la maquette qui montrent la ligne ◇ avec ses sources, « huiles … Hopsteiner 2025 » ou Comparer/Valeurs avec ses sigles changeront : la voie mécanique devra les mettre à jour avec preuve.
- Captures ouvertes (390 × 844) dans `img/` : `lotus-carte-avant.png` / `-apres.png` (carte de Lotus : « vanille Beer Maverick… » devient « vanille », plus de « Hopsteiner 2025 », « orange · citron »), `fiche-huiles-apres.png` (rangées sans noms), `substituer-apres.png`, `comparer-valeurs-apres.png`, `fiche-sources-apres.png`. Non vu en capture : la fiche en largeur ordinateur.
- Essais : un par critère, plus deux corrections de mon propre contrôle (sélecteur, expression `\d` perdue par un script du Bash : refait avec Edit).

## Doutes et limites
- `tests/integration/comparerValeurs.chrome.mjs:174` (hors de ma propriété) attend encore les noms de sources « au survol » des cellules de Comparer (`titre`) : il sera rouge ; à aligner sur D168 (les noms sont dans `data-source`).
- Comparer : les valeurs d'études gardent un `data-source` (donnée) mais plus de sigle écrit ; la rangée OSU garde « H22 Lafontaine 2018 · H77 Brülosophy 2019 » (citation d'étude).
- Les mots hors familles dont la seule fiche est celle d'un fournisseur ne disent plus laquelle sur la carte : il faut ouvrir la fiche, Sources ›.

DÉCISION À PRENDRE : les citations d'études dans les feuilles de Dryhopper (Maye 2016, H68, « sur Cascade… ») et la rangée OSU de Comparer (H22 Lafontaine, H77) : le brasseur veut-il aussi les ranger dans une section Sources ? Options : (a) les laisser (ce ne sont pas des infos de houblon, mais des preuves) ; (b) les déplacer sous un renvoi unique « Sources ». Recommandation : (a), tant qu'il ne s'en plaint pas.
DÉCISION À PRENDRE : Substituer n'a pas de renvoi « Sources » : un trait par plage qui diffère ne dit plus d'où elle vient, même au survol. Options : (a) laisser (long appui sur le nom → fiche → Sources) ; (b) un petit « Sources › » en bas de la section α/β. Recommandation : (a), son mot est « un endroit qui renvoie la source suffit ».

CONNAISSANCE : le moteur de la légende de la carte (`speciauxDe`) est le sixième écran qui forme des mots ; tout nouvel écran qui forme des mots doit appeler `motAffiche` et entrer dans `montres()` de `traductionMots.test.ts`. L'étape Houblons reste montée sous un outil de la pile (`aria-hidden`/`inert` sur la base) : un état local d'une carte survit au changement de vue tant qu'on ne le ferme pas explicitement.
LEÇON PROPOSÉE : un contrôle de langue ou de contenu doit être écrit sur la liste des écrans qui forment la donnée, pas sur la liste des fonctions déjà branchées à la table : t1 a unifié cinq écrans et oublié le sixième (la carte), faute d'avoir cherché par le rendu (Chrome sur la carte dépliée) plutôt que par les appels.

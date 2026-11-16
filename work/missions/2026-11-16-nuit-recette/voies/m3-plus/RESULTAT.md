OK — b1r : le « + » de l'assistant montre en tête ajouter, enregistrer, exporter, « Aller à », puis « Partout »

## Règle et cause
- b1r (SPEC-BRASSEUR 15.11) : « certaines actions doivent toujours être possible, juste celle de l'écran actuel sont plus mis en avant. Et le bouton doit toujours être flottant ».
- Cause : l'App ne donne un menu qu'aux onglets (`plusMenuFor`). Sur une page plein écran (`view` ≠ `tabs`), `FloatingActions` retombe sur `plusMenuPage({}, null)` : seulement « Partout ». Aucun mécanisme n'existait pour qu'une page déclare ses actions.

## Fichiers écrits
- Possédés : `src/pages/wizardPlus.ts` (neuf : actions par étape, `lancerAjout`), `src/pages/BrewWizard.tsx` (`usePlusPage(declarationPlusAssistant(...))`, état `exportDemande`, prop passée au récap), `tests/integration/assistantPlusActions.test.tsx` (neuf, 14 tests).
- Mécanisme neuf : `src/ui/plusPage.ts` (registre de module + `useSyncExternalStore`, même forme que `ActionDock` de PageShell ; la dernière page montée parle ; `lancer` par référence). Un autre agent y a ajouté le genre `supprimer` (voie 36) : gardé tel quel.
- HORS « Possède », nécessaire et minimal : `PlusSheet.tsx` (props optionnelles `page`/`onPage` : pilules d'action + rangée « Aller à » en tête, zone « Sur Assistant · <étape> »), `FloatingActions.tsx` (3 lignes : lit le registre, ancrage `page` seulement), `navigation.css` (`.plus-pile-etapes`, `.plus-chip`), `ui/recap/EtapeRecap.tsx` (prop `exportDemande` : chaque incrément lance « Texte », la copie du récap).
- Le « + » (bouton, gestes, « Partout », 5 communes + Compagnon) est inchangé ; sur les onglets, rien ne change.
- Banc : `capturer.mjs`, `debug.mjs`, `captures/` (8 PNG + journaux).

## Menu à chaque étape (contre le + d'abord, puis « Partout »)
1. Ajouter : Malts/sucres « Ajouter un malt ou un sucre » (curseur dans le champ) ; Houblons « Ajouter un houblon » ; Levure « Choisir une levure » (champ « Changer de levure », sinon l'onglet « Chercher ») ; Paliers « Ajouter un palier » (touche le bouton). Identité, Eau et sels, Récap : aucune ligne (pas de champ d'ajout ; les sels se dosent) : jamais un geste vide.
2. « Enregistrer la recette » (au Récap aussi « Enregistrer et préparer un brassin ») ; absent si enregistrement en cours ou brouillon en lecture seule.
3. « Exporter la recette » : va au Récapitulatif et lance « Texte » (copie du texte, comme le bouton).
4. « Aller à » : 7 pastilles, étape courante pleine (`aria-current`), refusée comme le fil si guide houblons ou enregistrement en cours.

## Critères
- Test d'abord : `assistantPlusActions` 13 rouges / 1 vert avant le code ; 14/14 après. Il couvre 7 étapes (en-tête avant « Partout », ordre ajouter < enregistrer < exporter), « Aller à », Ajouter (focus), Enregistrer (onSave(…, false) depuis Paliers), Exporter (copie presse-papier), « Partout » intact, aucun effet hors assistant.
- Liés : FloatingActions.behavior, floatingActionsShellLayout, fix114, brewerNavigation, recapM2, paliersR2, plus-ecran, plus-ecran-pile : 108/108 (avant la dernière retouche) ; après le repli Levure : assistantPlusActions + FloatingActions.behavior + plus-ecran ×2 : 35/35.
- `tsc --noEmit` : 0 erreur. `npm run build` : sortie 0, DRAPEAUX OK ×3.
- Captures 390 tactile, **ouvertes** : Malts/sucres (clair et cave), Levure, Récap ; 1280 Paliers (clair). Menu ouvert : ordre lu depuis le + : Ajouter, Enregistrer, Exporter, « Aller à » (2 lignes de pastilles), « Sur Assistant · <étape> », « Partout » (2 colonnes). Menu 450 px de haut sur 844 (de 330 à 780), le × contre le +. 0 erreur de page. Houblons et Paliers : lignes lues dans `journal.json`, captures prises mais non ouvertes (même structure).

## Essais et doutes
- Essais : banc 3 (lancement : l'étape `fermentescibles` n'existe pas en `?etape=` : le banc ouvre `levure` puis clique le fil ; le build ne porte pas `dev-local` : serveur de dev ; une capture Levure prise pendant la synchro).
- Au banc, le champ « Changer de levure » n'est pas dans le DOM de l'étape Levure (recette de démo) : « Choisir une levure » touche alors l'onglet « Chercher ». Non rejoué en capture après ce repli (couvert seulement par tsc et les tests verts).
- « Aller à » en 7 pastilles : choix de pile compact ; une autre forme (liste déroulante, 2 pastilles Précédent/Suivant) reste possible si le brasseur la préfère.
- Au Récap, le pied propose déjà les deux « Enregistrer » : doublon voulu (b1r : toujours possible).
- Lettres de raccourci : aucune pour ces actions (page = feuille, pas de rail).
- Serveurs de dev/preview lancés pour le banc (ports 5194 et 5195) : à arrêter.

CONNAISSANCE : une page plein écran déclare les actions de son « + » par `usePlusPage` (`src/ui/plusPage.ts`), lues par `FloatingActions` quand `anchor="page"` ; l'assistant les construit dans `src/pages/wizardPlus.ts`.
LEÇON PROPOSÉE : aucune

OK — Paliers : « Ajouter un palier » du menu ajoute un palier (2 → 3 au banc) ; mineurs m1 et m3 corrigés

## Fichiers écrits
- Neuf : `src/ui/paliers/ajoutPalier.ts` (registre : la courbe déclare son ajout de fin, le menu l'appelle).
- Modifiés : `src/ui/paliers/CourbeEmpatage.tsx` (déclare `ajouter(finCourbe)`, la fonction même du « + » SVG), `src/pages/wizardPlus.ts` (action appelée, Levure « Changer de levure » + focus recherche, plus d'« Aller à »), `src/pages/BrewWizard.tsx` (`texteRecette` extrait, export du « + » : copie sans quitter l'étape + toast « Recette copiée. » ou refus dit), `src/pages/RecipePage.tsx` (menu : brasser, modifier, dupliquer, exporter, supprimer ; `what` sans répétition ; `gros`), `src/ui/plusPage.ts` (genres), `src/components/navigation/PlusSheet.tsx` (icônes, classe rouge), `navigation.css` (`.plus-pp--danger`), `src/ui/recap/EtapeRecap.tsx` (prop `exportDemande` retirée).
- Hors « Possède », additif : `src/ui/Sheet.tsx` (`ConfirmSheet` : prop optionnelle `gros`, boutons 44 px et marge basse ; les 12 autres usages inchangés).
- Tests : `tests/integration/assistantPlusActions.test.tsx` (17 tests), `tests/integration/recetteSupprimerPlus.test.tsx` (6).
- Banc : `capturer.mjs`, `sonde.mjs`, `captures/` (8 PNG), `journal.json`, `banc-clair.log`.

## Critères (sorties décisives)
- Bloquant : test dans le VRAI rendu de l'étape Paliers : nombre de paliers de la courbe +1 après l'action du menu, menu refermé, poignée du palier touché présente. Chrome 390 (journal.json) : `paliersAvant 2` → `paliersApres 3`, `paliersClic "Ajouter un palier"` ; capture `captures/paliers-3-apres.png` ouverte : 3 colonnes, palier 2 touché, bandeau « Palier 2 67 °C 30 min ».
- Levure (menu `levureMenu.lignes` : « Changer de levure », fixture avec levure posée) ; après le geste : `levureFocus` = INPUT « Nom, fabricant ou code », vue Chercher (capture ouverte : curseur dans le champ).
- Exporter : test : copie du texte, « Recette copiée. », étape inchangée ; copie refusée : message `role=alert`. Chrome headless : le presse-papier est refusé (permission non accordée par le banc) : `exportToast "Copie refusée : ouvre le Récapitulatif pour copier le texte."`, `exportTitre "Levure 4/7"` (reste à l'étape) ; le chemin « copié » est prouvé par le test seulement, pas vu en capture (`levure-3-export.png` non ouverte).
- « Aller à » retiré : menu à 3 lignes en tête (Ajouter, Enregistrer, Exporter), hauteur 366 px à 390 (avant : 450), pas de 300 px strict : « Partout » (3 rangées) y est compris.
- Menu de la page recette (capture ouverte) : de bas en haut (contre le +) Préparer un brassin, Modifier, Dupliquer, Exporter, Supprimer la recette en dernier, bord, texte et icône rouges (`pageDanger` : bord rgba(200,56,47,.7), texte rgb(168,41,31)), « Partout » au-dessus.
- Feuille de suppression (capture ouverte) : « American IPA — 30 L » (nom une seule fois) ; Annuler et Supprimer la recette 44 px de haut, bas à 830 sur 844 (14 px au-dessus du bord).
- tsc : 0 erreur (tsc.txt). `npm run build` : 0, DRAPEAUX OK ×3 (build.txt). Vitest : 12 fichiers, 146 verts (test2.txt) : assistantPlusActions, recetteSupprimerPlus, recetteSupprimerApp, recetteR1, brewerNavigation, fix114, FloatingActions.behavior, floatingActionsShellLayout, paliersR2, recapM2, plus-ecran, plus-ecran-pile.

## Essais et limites
- Essais : banc 4 lancements (le 1er : `?etape=paliers` n'ouvre pas l'assistant au banc, seul `?etape=levure` l'ouvre : on va à Paliers par le fil d'étapes, comme le brasseur).
- Le test n'a pas été rejoué en rouge sur l'ancien code ; le rouge de référence est la capture du critique (paliers avant = après).
- Le cave et 1280 ne sont pas rejoués (consigne : 390). Les doutes du critique (cercle sur la première ligne) restent à voir au vrai toucher.
- `PlusSheet` garde son rendu « Aller à » (optionnel, plus déclaré par l'assistant).

## Notés, non traités (hors consigne)
- Voile à 1280 qui coupe l'écran (antérieur) ; fiche Stock « manque 49 kg » (autre session) ; rôle de Citra (amérisant sur la page, aromatique dans l'assistant ; hors voie).

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : le « + » de fin de courbe d'empâtage est joignable hors de la courbe par `ajouterPalierDeFin()` (`src/ui/paliers/ajoutPalier.ts`) ; `?etape=` n'ouvre que Levure au banc.
LEÇON PROPOSÉE : un test d'action de menu se joue dans le rendu réel de l'étape et compte l'effet (palier +1), jamais un bouton cherché dans un autre rendu (L11).

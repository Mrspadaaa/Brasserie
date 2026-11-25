OK — c68Regles 56/56 vert, C68-1 à C68-13 corrigés en local ; tsc 2 erreurs connues, functions OK

# RESULTAT c68-fix (25.11)

## Plan (par règle : endroit → correctif)
- R70 (C68-1, C68-12) : `rangementCarnets.ts` (titre court de l'IA pour tout carnet neuf genré, marque ZZ TEST gardée) ; `ia.ts` `suiviDesLignes` (le carnet existant que l'IA désigne depuis la liste devient une proposition « Rattacher à … ? ») ; `FeuilleRangement.tsx` + `CarnetsVue.tsx` (la carte nomme ce carnet, Rattacher / Garder à part ; OK pose la tâche proposée, le voile ne la pose pas).
- R71 (C68-2) : `filRegles.resumeJetons` : dès qu'une option porte un montant, les montants sont des pistes (fourchette, jamais la somme) ; la retenue dit son seul coût ; une option écartée sort du calcul (`CarnetOuvert` passe les écartées).
- R72 (C68-3) : `cheminAffiche` lit le domaine par les mots (comme la carte) ; `ResoluProbleme` dit « Retenu : … » ; `optionsFermees` + `articlesPasPris` : les solutions écrites en articles que la retenue n'a pas prises sont « pas pris ».
- R73 (C68-4) : `listeRegles.valeurUtile` : un résolu dit « retenu · 200 CHF » (messages passés par `ArbreCarnets`), jamais « à comparer » ni le prix d'une piste pas prise.
- R74 (C68-5, 6, 7) : `OptionsProbleme` (la raison tapée se lit sous l'option écartée) ; `fil.ts` (quitter la veille est un changement d'option, pas une 2e bulle ; l'historique écrit ne change pas) ; `rangementCarnets` `nomOptionDe` (dans un problème, un nom + prix sans lien devient une option, le jeton de montant vise l'option) ; `TableauCarnet` (« Sans option » : les articles sans option ne se lisent plus rangés sous « Hotte… aucun article encore »).
- R75 (C68-8, 10, 11) : `ficheResolu` (« essayé » dit aussi les articles pas pris) ; `carnetsTypes`/`ecransCarnet`/`useNavigationCarnet` (‹ depuis la relecture ramène au problème) ; `arbre.sousDomainesProposes` (menu : Brasserie › Brassage / Fermentation / Conditionnement en plus des sous-domaines employés) ; `ArbreCarnets` (un carnet à ranger ou filtré dit son dernier pas quand ses notes le disent).
- R76 (C68-9) : `taches.ts` (« Budget 200 CHF » d'un projet du Planning = coût « ≈ », un projet du Planning fini avant aujourd'hui n'est plus listé) ; `AFaire.tsx` (appui long au toucher : suit `touchstart`/`touchend`, `pointercancel` tactile ignoré, un vrai déplacement > 10 px l'annule).
- C68-13 : `src/domain/carnets/realises.ts` + `src/ui/carnets/ResolusRealises.tsx` + `StocksTab.tsx` (le compte Réalisés ajoute les problèmes résolus, sauf ceux fermés par l'achat d'un plan lié ; la liste est en tête de Réalisés, un toucher ouvre le problème). Test : `tests/unit/c68Realises.test.tsx` (4 verts).

## Fichiers écrits
src/ui/carnets : rangementCarnets.ts, FeuilleRangement.tsx, CarnetsVue.tsx, filRegles.ts, CarnetOuvert.tsx, ResoluProbleme.tsx, listeRegles.ts, ArbreCarnets.tsx, OptionsProbleme.tsx, TableauCarnet.tsx, carnets-fil.css, carnetsTypes.ts, ecransCarnet.tsx, useNavigationCarnet.ts, AFaire.tsx, ResolusRealises.tsx (nouveau) ; src/domain/carnets : ia.ts, fil.ts, arbre.ts, taches.ts, realises.ts (nouveau) ; src/components/tabs/StocksTab.tsx ; tests/unit/c68Realises.test.tsx (nouveau). Aucun test existant modifié. Pas touché : src/domain/stock, src/ui/stock, src/ui/finance, src/ui/calendrier.

## Sortie décisive
- `npx vitest run tests/unit/c68Regles.test.tsx` : 56 passed (56). `tests/unit/c68Realises.test.tsx` : 4 passed.
- `npx tsc --noEmit` : 2 erreurs, les connues (`seedData.ts` GanttTask, `enregistrerPwa.ts` virtual:pwa-register). `functions` : tsc rc 0.
- Porte (carnets*, c48..c68, lot3CarnetOuvert, virgule-transversale, proprietes, stocksMaterielUneRangee) : voir tests-porte.log.

## Décision du pilote (R75, achat sans note)
Aucun test modifié : le code dit le dernier pas dès que les notes le disent ; un achat sans note n'en a pas (rien n'est inventé). Les 2 rouges de l'arbre venaient de lignes sans dernier pas alors que leurs notes existaient.

## Doutes et limites
- Pas de capture (consigne) : rendu 390 px à voir en ligne (carte « Rattacher à … ? », « Sans option » du tableau, raison sous l'option, liste en tête de Réalisés).
- C68-1 : la carte, quand l'IA désigne un carnet existant, montre CE carnet (titre, chemin) avec « Rattacher » / « Garder à part » ; le carnet neuf de la phrase reste tant qu'on ne rattache pas (règle L-2 inchangée : jamais d'écriture ailleurs sans geste).
- C68-6 : le test exige un seul événement de veille dans le FIL ; l'événement écrit garde `sorte: 'veille'` quand on quitte la veille (carnetsSuivi le veut), seul le fil le lit comme changement d'option.
- C68-7 : une phrase « nom, prix » sans lien tapée dans un problème devient option (règle locale ; avec l'IA, c'est elle qui range). Les articles déjà écrits en articles (état en ligne) restent des articles : ils sont dits « Sans option » et « pas pris » au Résolu.
- C68-10 : les sous-domaines usuels (Brassage, Fermentation, Conditionnement) ne sont proposés que sous Brasserie ; liste figée dans `arbre.ts`, à confirmer par le brasseur.
- C68-11 : « Autres carnets repliés par sous-domaine » (maquette v01-liste) était déjà tenu par le test ; non modifié.
- Erreur de mon outil : le Bash a mangé deux barres inverses (`\b` devenu un retour arrière dans une regex de `taches.ts`, `\s` perdus dans `nomOptionDe` et une marque ZZ TEST) ; repéré par un test qui échouait, corrigé par Edit, grep des caractères de contrôle propre.

CONNAISSANCE : `resumeJetons` ne somme plus jamais des montants dès qu'une option en porte un ; les montants sans option visée sont des pistes. Un événement de veille quittée reste `sorte: 'veille'` dans le magasin, c'est `filDe` qui ne le montre pas comme demande.
LEÇON PROPOSÉE : aucune (L26 couvre déjà le piège des barres inverses ; il s'est reproduit dans un script Bash de remplacement : écrire le script avec Write, pas un heredoc).

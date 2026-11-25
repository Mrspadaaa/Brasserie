FIX 57/57 tsc OK 16657af52 — c72Regles vert ; PRÊT À METTRE EN LIGNE 16657af52 (preuve en ligne à faire par le pilote et le critique)

# RESULTAT c72-fix

## Plan (règle, endroits, correctif)
- R87 / C72-1 (B) : une seule fonction de coût, `montantsDuFil` (filRegles.ts), lue par toutes les surfaces :
  - en-tête `.cnp-total` (`resumeJetons`) : repose sur elle ; plus de calcul en double ;
  - tuiles d'option (`infoOption`), ligne du Résolu de la liste (`valeurUtile`), fiche du Résolu (`ficheResolu`, coût de la retenue) : `coutDeOption`, même lecture ;
  - jetons de la bulle : inchangés (déjà justes) ; Quand : inchangé (déjà juste, pas de prix de piste).
  - Causes : (1) le repli local posait les deux montants d'une phrase sur UNE option (`etiquettesDuRepli`, rangementCarnets.ts) ; il ne les pose plus sur aucune option quand il y en a plusieurs, et `etiquettesLocales` (analyseLocale.ts) dit chaque montant d'une alternative « piste » (un « ou » entre deux morceaux chiffrés) ; (2) un même montant lu par le repli local ET par l'IA dans un même message n'est compté qu'une fois (l'IA l'emporte) : c'est la « piste fantôme » à 630 ; (3) des montants sans option, dans un message qui nomme autant de pistes sans prix, se lisent dans l'ordre des pistes (seulement si les comptes tombent juste) ; (4) le fil qui nomme au moins deux pistes lit ses montants comme des pistes (fourchette), jamais en somme ; (5) une seule piste chiffrée dit son prix seul (`fourchette.n === 1`, affiché « 450 CHF » sans « ≈ », OptionsProbleme.tsx).
  - La somme reste pour un problème qui ne compare pas (devis 850 + pièces 60 : « ≈ 910 », tests existants verts).
- R88 :
  - C72-2 : FilCarnet.tsx, la carte de veille d'une option écartée dit « veille arrêtée · … / option écartée » (plus « pas encore relevée »).
  - C72-3 : afaireRegles.ts, `trierTaches` range par la date que la ligne dit (`quandDite`) : un projet du Planning commencé se range à sa fin.
  - C72-4 : CarteArticle.tsx, la carte de l'article choisi ne montre plus le poids / contenu du sachet lu sur la page (Poids net, contenance, conditionnement, quantité) ; les autres valeurs restent.
  - C72-5 : comparer.ts, `avecArticle` : un premier mot en -es (pluriel, « acides », « arômes ») ne s'élide pas : « les acides alpha » (« excès » s'écrit -ès, inchangé).
  - C72-6 : CarnetOuvert.tsx, pas de ligne « votre phrase : « … » » quand un message du fil la dit déjà (première bulle).

## Fichiers écrits
src/ui/carnets/{filRegles,listeRegles,OptionsProbleme,rangementCarnets,CarnetOuvert,CarteArticle,FilCarnet,afaireRegles}.ts(x) ; src/domain/carnets/{analyseLocale,comparer}.ts ; work/missions/BUGS.md (lignes C72-1..6) ; ce dossier (tests.log, tsc.log, tests-porte.log). Aucun test modifié, aucun fichier stock/finance/calendrier, functions/ inchangé.

## Critères
- `npx vitest run tests/unit/c72Regles.test.tsx` : 57 passed (34 rouges avant).
- Porte (un seul run, 90 fichiers : carnets*, c48..c72Regles, c70RangementIA, c68Realises, lot3CarnetOuvert, virgule-transversale, proprietes, stocksMaterielUneRangee) : 2137 passed, 3 skipped, 0 échec (tests-porte.log).
- `npx tsc --noEmit` : 2 erreurs, les deux connues (seedData GanttTask, virtual:pwa-register) ; functions/ non touché.
- `node scripts/agents/controle-bugs.mjs` : BUGS OK.
- Commit par chemins : 16657af52 (code) ; registre et RESULTAT dans un second commit.

## Doutes et limites
- Aucune capture : preuve en ligne à faire (jsdom ne mesure aucune boîte).
- L'appariement « montants sans option / pistes sans prix, dans l'ordre » est une règle d'ordre, posée seulement quand les comptes sont égaux ; il sert la forme `sansOption` du test, que le vrai code n'émet plus (le repli local écrit désormais des jetons « piste » sans option).
- Le jeton « piste » du repli local s'affiche sous la bulle (comme ceux de l'IA) ; à regarder en ligne.
- Le « ou » du repli local est un mot-clé : « 450 CHF ou 460 CHF chez deux vendeurs » donnerait aussi deux pistes (alternative, ce qui est le sens).
- Test jugé faux : aucun. DOSSIER (« une seule piste → son prix seul ») respecté.

CONNAISSANCE : la « piste fantôme » à 630 venait de deux jetons du repli local (même montant que l'IA) sur une option que le carnet ne portait plus ; elle se règle à la lecture, par `montantsDuFil`.
LEÇON PROPOSÉE : aucune

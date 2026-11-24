OK — R18 (C53-5) : 12/12 tests verts, préfixe jamais doublé, marche nommée avec son montant ; code 8e743b494

# RESULTAT c53-fix-courbe

## Plan (par règle, par endroit de voies/c53-tests/RESULTAT.md)
- R18, endroit 1 : Finances › Prévisions, `EscalierSvg.tsx` / `escalier.ts`. Cause : préfixe de test doublé = texte du lot de 45 à 55 signes, sans place à 390 px, aucun repli pour un lot. Correctif : `sansPrefixeDouble` dans `nomProjet`, `motEtiquette`, `nomLong` ; repli court du lot (`texteLotCourt` : « 2 sorties −159,95, 08.12 ») par le mécanisme `compacts` existant.
- R18, endroit 2 : Calendrier, `Courbe.tsx` `placerNoms`. Correctif : noms (mouvements et étoiles) nettoyés du préfixe doublé à l'entrée ; le regroupement du même jour, les récurrents et les étoiles travaillent sur les noms nettoyés.
- R18, endroit 3 : Finances › Analyse › Caisse, `analyse/Escalier.tsx`. Correctif : une marche = un jour (`lotsDuJour`), une étiquette « nom + N autre(s) » ou « nom (N fois) » avec la somme ; nom sur deux lignes dès 15 signes (plus de « ZZ TEST — acha… ») ; toucher une étiquette de plusieurs paiements ouvre la liste de ses paiements (chacun ouvre sa pièce) ; la pastille « + N autres opérations » compte les paiements, pas les marches.
- Non touché : `annuel/Etapes.tsx` (pas de bulles d'événements).

## Fichiers écrits (commit 8e743b494, par chemins)
- `src/domain/finance/nomAffiche.ts` (neuf : `sansPrefixeDouble`, regex `^(.{2,40}?\s[—–]\s)\1+`, remplacement par fonction, L26)
- `src/ui/finance/previsions/escalier.ts`, `src/ui/finance/previsions/EscalierSvg.tsx`, `src/ui/calendrier/entete/Courbe.tsx`, `src/ui/finance/analyse/Escalier.tsx`
- `work/missions/BUGS.md` : ligne C53-5 seule → « corrigé en local 8e743b494 » ; ce dossier.

## Critères
- `npx tsc --noEmit -p .` : 2 erreurs, les 2 connues (`seedData.ts` GanttTask ; `enregistrerPwa.ts` virtual:pwa-register), aucune neuve.
- `npx vitest run tests/unit/c53Regles -t R18` : **12 passed**, 78 skipped (R16, R17 : autre voie).
- `c48Regles`, `c50*`, `c52Regles`, `proprietes`, `finance`, `calendrier`, `analyse`, `previsions` (55 fichiers, 839 tests) : 837 verts, **2 rouges, tous deux dans c48Regles et hors de ma voie** : « R2 tableau du carnet, valeur d'une cellule (1640 x 1340 x 1850 mm) » et « R5 on en garde 10 sur 25 : … » (carnets/`lienFusion`/`comparer`). Fichiers que la voie c53-fix-carnet modifie en ce moment (`git status` : `functions/src/lienFusion.ts`, `lienLibelles.ts`, `src/domain/carnets/comparer.ts`, `modele.ts`, `CarteArticle`, `FicheArticle` non commités). Je n'ai pas pu isoler la cause sans leur retirer leurs fichiers ; à rejouer après leur commit. Aucun de mes cinq fichiers n'est importé par ces tests.
- `node scripts/agents/controle-bugs.mjs` : `BUGS OK : 2239 bugs, 514 ouverts, 202 sources`.
- Journaux : `tests.log`, `tests2.log`, `tsc.log` dans ce dossier.
- Essais : un par critère.

## Doutes et limites
- jsdom ne mesure rien : le placement est joué avec la mesure fixe 0,5 em du test ; à 390 px en vrai (police réelle), preuve en ligne par le pilote et le critique. Le nom d'un lot sans place à 390 px retombe sur « 2 sorties −159,95, 08.12 » (le nom se lit dans la liste du lot).
- Le nom en base n'est pas modifié : le préfixe doublé reste dans la fiche, la liste et la lecture au doigt de la courbe du Calendrier (LectureCourbe non traitée, hors des étiquettes testées).
- Analyse › Caisse : la fusion du même jour et la hauteur de l'étiquette (50 au lieu de 36 pour un nom long) sont neuves, jamais vues dans un vrai rendu ; à regarder en ligne (téléphone). Voir la DÉCISION de c53-tests : ses 3 tests Analyse sont tenus par ce choix large.

DÉCISION À PRENDRE : aucune de nouvelle ; (reprise) si le brasseur ne veut pas la fusion sur Analyse › Caisse, retirer les tests 1 et 2 d'Analyse de R18 et `lotsDuJour` (retour à une étiquette par paiement, nom dédoublé seulement).

CONNAISSANCE : le préfixe de test doublé vient du script de test, mais une donnée réelle peut aussi porter un préfixe répété ; l'affichage le retire (`src/domain/finance/nomAffiche.ts`), la base garde son nom.
LEÇON PROPOSÉE : aucune

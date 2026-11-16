# m5 — mise en ligne recette matin (journal au fil)
- Procédure : cerveau/agents/verification-locale.md + work/missions/2026-11-14-finances/MISSION.md l. 83-92 (fusion du dernier tag, build, check-firebase-config de fc99d620, check-no-dev-auth, deploy --only hosting --project brasserie-l-affinee, bundle servi = build, tag LOCAL non poussé : les tags en-ligne/* ne sont pas sur origin).
- Dernier tag : en-ligne/2026-11-16-finances-rejeu (contient atelier-tarifs, transversaux-2, transversaux ; hors branche au départ).

## ECHEC — fusion de en-ligne/2026-11-16-finances-rejeu : conflit, arrêt (consigne : pas de conflit forcé)
- `git merge --no-ff en-ligne/2026-11-16-finances-rejeu` → 1 conflit, `src/components/navigation/PlusSheet.tsx` (composant `PlusSheet`, début du corps, l. ~165). Fusion annulée (`git merge --abort`), branche intacte à ab6c4327, arbre propre. Rien construit, rien déployé, aucun tag.
- Nature (sémantique, pas textuelle) :
  - HEAD (matin, ab6c4327) : `const partout = menu.partout.filter((e) => !e.monte);` — « Partout » = communes moins celle déjà montée en tête (pas de doublon) ; signature avec `page, onPage` (actions de l'étape/de la page en tête du +, page ouverte `pageOuverte`).
  - Tag (BUGS 32/34, transversaux-2) : `const partout = menu.partout;` — « Partout » identique sur tous les écrans, geste déjà en tête gardant sa case marquée ↑ ; signature sans `page/onPage`.
  - Les deux changent la même ligne dans des sens opposés (retirer le doublon / le garder avec ↑). Le reste de PlusSheet (page ouverte, `enTete`) vient du matin et ne se recoupe pas autrement.
- Résolution proposée (non faite) : garder la signature et `pageOuverte` du matin ET prendre `partout = menu.partout` du tag (règle du brasseur BUG 34 : identique partout, renvoi ↑), puis relire le rendu de `Partout` (le marquage ↑ doit exister dans le JSX et les tests `assistantPlusActions` / transversaux de `PlusSheet` doivent suivre). Choix de comportement : au pilote.

DÉCISION À PRENDRE : « Partout » du +, avec une action déjà montée en tête. Options : (a) identique partout avec renvoi ↑ (BUG 34, tag transversaux-2, déjà en ligne) ; (b) sans doublon (matin 16.11). Recommandation : (a), déjà en ligne et plus récent que la logique du filtre ; adapter les tests du matin qui supposent le filtre.
CONNAISSANCE : les tags en-ligne/* sont locaux (aucun sur origin) ; finances-rejeu contient atelier-tarifs, transversaux-2, transversaux.
LEÇON PROPOSÉE : aucune

## REPRISE (décision du pilote : version du tag) — OK
- Fusion refaite : conflit PlusSheet.tsx résolu = signature du matin (`page, onPage`) + `partout = menu.partout` du tag (BUG 34, ↑). Commit de fusion 49b1b497.
- Tests du matin : aucun à adapter, tous verts tels quels (15 fichiers / 169 : assistantPlusActions, recetteSupprimerPlus, recetteSupprimerApp, recetteR1, m2ManqueRecette, paliersR2, eauW1b, recapM2, plus-*, port-p6-bilan-plus, dashboardNavigation ; + 5 fichiers touchant PlusSheet : 44 verts). Journaux tests.txt, tests-plus.txt.
- tsc 0 erreur ; build code 0, DRAPEAUX OK ; check-no-dev-auth OK ; check-firebase-config (fc99d620) OK.
- Déployé : `npx firebase deploy --only hosting --project brasserie-l-affinee` → « found 308 files in dist », Deploy complete, https://brasserie-l-affinee.web.app (deploy.txt).
- Tag local en-ligne/2026-11-16-recette-matin sur 49b1b497, non poussé (comme les autres).
- Non fait : jeu en ligne ZZ TEST (hors contrat) ; controle-avant-deploiement (propre à la Dépense) ; pas de capture du +.

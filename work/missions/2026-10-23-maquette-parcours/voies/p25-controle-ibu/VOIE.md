# Voie p25-controle-ibu — la cohérence des IBU d'une ligne de remplaçant (contrôle d'abord, L13)

- Mission : 2026-10-23-maquette-parcours
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement (un contrôle et ses témoins)
- Plafond : 60 tours ; 3 essais par critère
- Dépend de : sb-tri, sb-conseil
- Décideur en cas de doute : pilote

## Objectif
Le conseil rapide du 24.10 sur Substituer (`work/missions/2026-10-23-maquette-parcours/conseil-sb/verdict.md`) a recompté sbz7 :
la ligne 78 de `work/refonte-frontend/v4/ecran-1/fils24-substituer/sbz7/etat.html` calcule l'« IBU si 46 g » avec l'α minimal de la
fiche (`i0=59.73*h.alphaMin/13`) alors que la dose à 60 IBU part de l'α du lot : 7 lignes sur 12 fausses (Galaxy ~51 au lieu de
~79…). Ni le critique ni COMMUN ne l'ont vu. Le contrôle doit l'attraper, sur sbz7 et sur toute page de remplaçants.

## Le contrôle
`work/refonte-frontend/v4/tournoi/outils/controle-coherence-ibu.mjs <dossier> <ids…> [--page=etat.html] [--cible=60] [--dose=46]`,
puppeteer-core, 390 × 844 : pour chaque ligne de remplaçant qui affiche à la fois un IBU à la dose de Nugget (46 g) et une dose
pour l'IBU cible (60), vérifier `IBU46 × dose / 46 ≈ cible ± 2` (et, si la ligne affiche un α, que cet α donne l'IBU à ± 10 %).
Lis la page pour trouver comment ses lignes sont faites ; préfère un contrat de marqueurs (`data-ibu46`, `data-dose`, `data-alpha`
sur chaque ligne) et documente-le dans l'en-tête ; une page qui n'a pas ces marqueurs mais affiche ces nombres en texte est lue par
le texte. Sortie : une ligne par ligne incohérente (« Galaxy : 51 × 35 / 46 = 39, attendu 60 ± 2 »), puis `COHERENCE-IBU OK (n
lignes)` ou `COHERENCE-IBU ECHEC (k/n)`.

## Témoins
- sbz7 tel quel → ECHEC (Galaxy, Citra cryo, Idaho 7…) ;
- une page témoin `work/refonte-frontend/v4/tournoi/outils/temoins/coherence-ibu-ok/etat.html` (trois lignes justes) → OK.

## Possède
`work/refonte-frontend/v4/tournoi/outils/controle-coherence-ibu.mjs`, `…/temoins/coherence-ibu-*/**`, et
`work/missions/2026-10-23-maquette-parcours/voies/p25-controle-ibu/RESULTAT.md`. Ne modifie pas sbz7 (l'agent de sa série la
corrigera après ton contrôle). M10 : échappements écrits par l'outil d'édition, puis `node scripts/agents/systeme.mjs cablage`.

## Critères
Dans `GATES.md`. Réponse finale : une ligne.

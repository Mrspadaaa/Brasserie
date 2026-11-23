OK — série rca : quatre concepts de recherche avancée, vrais cas, réactifs, au trait

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils24-recherche/rca1/` à `rca4/` : `etat.html` (page statique figée après son premier rendu, script réactif sur les 318 variétés, ou 33 pour rca4), `NOTE.md` (chaleur, idée, cas, ce qui tient, ce qui casse, contrôles).
- `work/refonte-frontend/v4/ecran-1/fils24-recherche/captures/rca1.png`, `rca2.png`, `rca3.png`, `rca4.png` (390 × 844, ×2), `rca4-fiche.png` (fiche ouverte).
- Scripts de construction et d'extraction : `C:\Users\mrspa\AppData\Local\Temp\rca\` (hors dépôt).

## Les quatre
- **rca1 (froide)** : le champ « Ajouter — houblon… » de l'étape s'ouvre sur place. « cassis » devient une pastille dans le champ, avec les critères dessous (moment, famille, usage, α, stock) et leurs comptes. Le résultat : 17 cartes d'ajout rapide, en stock en tête (Idaho 7).
- **rca2 (tiède)** : on y vient du « + » de Comparer. Chaque pastille compte avant le toucher. Floral marquée et aromatique donnent 15 houblons, et la pastille « en stock 0 » le dit d'avance.
- **rca3 (tiède)** : l'exemple du brief, sur ses vraies données. Un seul houblon coche tout (Hallertau Blanc). Les autres sont rangés par le critère qui les bloque, avec la vraie valeur manquée (Galaxy à α 17,2, Citra cryo à 24,8) et un bouton « lâcher ».
- **rca4 (chaude)** : la carte α × huile des 32 houblons « fruit de la passion ». La bande α se glisse au doigt. Galaxy (intense) et Saaz (repère fade) se distinguent sans lecture, et l'huile inconnue va sur une ligne « ? ».

## Critères
- G1 : `node work/refonte-frontend/v4/ecran-1/fils24-recherche/outils/concepts.mjs rca1 rca2 rca3 rca4` → `CONCEPTS-BIEN-4`.
- G2 : `node work/refonte-frontend/v4/tournoi/outils/controle-pictos-trait.mjs work/refonte-frontend/v4/ecran-1/fils24-recherche rca1 rca2 rca3 rca4 --page=etat.html` → `TRAIT OK` (2, 13, 2 et 1 pictos, 0 faute).
- Joués une fois : `controle-panel` sur les 4 captures → PANEL OK (médiane 0,60, ressemblance 0,86). `controle-commun --sans=mots,au-style` : survol, blocs, contraste, fiche (FICHE OK 4/4), standard, trait, légende, parlant et brutes OK. COULEURS ECHEC sur rca3 seul : une seule teinte franche est mesurée, car la requête tropicale est orangée et ses pictos au trait sont fins. L'écart est écrit dans sa NOTE, non corrigé. `au-style` est sauté : la raison est dans chaque NOTE (pas d'intensité, pas d'échelle dans une recherche).
- Captures ouvertes en image : les 4 premiers écrans et la fiche de Galaxy dans rca4.

## Prédiction
« rca3 c'est exactement ça, je vois ce qui me manque. rca4 donne vraiment bien pour Galaxy face à Saaz, mais la carte est chargée. rca2 fait un peu tableau. »

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : la règle rôle-α donne « amérisant » à peu de houblons « fruit de la passion » (2 sur 32). Le critère « dry hop » en tire peu de filtrage ; un vrai filtre de moment demanderait les rôles du fournisseur (`usage[].roles`), presque toujours vides dans `proto-data.json`. Par ailleurs, `tagsFr` garde des mots anglais (loganberry, green tea, redberry, sweet fruit…), traduits ici à la main.
LEÇON PROPOSÉE : aucune.

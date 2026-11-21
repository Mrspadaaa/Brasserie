# Carnet : améliorations, besoins, workflow (21.11)

Le brasseur : « c'est surtout des problèmes, pas des améliorations, workflow, UX UI, besoin et autres » ; « J'en ai déjà trouvé au moins 5, à toi de voir, trouver, chercher, améliorer, demander, éprouvé, réfléchir ».

Ici on ne cherche PAS de bugs (déjà dans BUGS.md : CRP, CRB, CRU, CRW, CRF). On cherche ce qui rendrait le Carnet vraiment utile à un brasseur suisse seul qui équipe sa brasserie : idée → liens → comparer → choisir → acheter → recevoir → au Parc.

## Pistes du pilote (à éprouver, compléter, ou écarter avec raison)
1. Prix en EUR (boutiques allemandes) → CHF, port, TVA et douane à l'import : le vrai coût rendu.
2. Délai de livraison et dispo → date d'achat posée au Calendrier.
3. « Ce qui compte » posé par lui en un geste (prix, volume, porte, puissance), sans attendre l'IA.
4. « Est-ce que ça entre ? » : dimensions contre la place, largeur de porte.
5. Budget du carnet contre la caisse : quand il pourra payer (courbe du Calendrier).
6. Occasion (Ricardo, Anibis) et plusieurs vendeurs pour le même article.
7. Après l'achat : le bien entre au Parc avec garantie, notice, entretien.
8. Doublon avec le parc ou le stock.
9. Électricité (230/400 V), consommation et coût d'usage.

## Règles
- Lire GAIN.md et REGLES.md (work/missions/2026-11-21-workflows-app/) : vrais gains, pas de gimmick ; la fin de SPEC-BRASSEUR.md ; PRODUCT.md ; PORTRAIT.md du critique.
- Éprouver dans le code (worktree port-carnet, grep) et la donnée : ce qui existe déjà, ce que ça coûte, la donnée nécessaire.
- Chaque idée : geste aujourd'hui → geste visé, gain (gestes, temps, erreur ou argent évités), fréquence, coût (petit / moyen / gros), donnée, classe (vrai gain / nice to have / écarté et pourquoi), et si c'est un choix de forme à montrer en mini maquettes.
- Analyse seulement, aucun code. Écrire `AMELIO-<regard>.md` dans ce dossier, commit par chemin, message terminé par « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> ». Retour en une ligne : vrais gains, nice to have, écartés, top 3.

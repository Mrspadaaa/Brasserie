# m3pr-b — Ajouter une prévision : trois champs au-dessus du clavier (froide)
- Genre b, froide : au premier plan, le nom, le montant (gros, mono) et la date ; le clavier décimal ouvert, Enregistrer juste au-dessus (p5b visible derrière).
- Change : Mouvement, Catégorie et Répétition deviennent trois pastilles à valeur (« À payer ⌄ », « Charges fixes ⌄ », « chaque mois ⌄ ») qui gardent les défauts ; fournisseur, note, coût des brassins et fin de répétition à un toucher (« à confirmer » dit, jamais un zéro).
- Gardé : tout le contenu de `PlanSheet`, aucun champ retiré ; le montant reste un texte `inputmode=decimal`.
- Boosters : date (pastille calendrier), reglages (trois pastilles).
- Au port : la phrase « aucune écriture… relie la facture » passe dans le pli ; « État » en modification seulement ; `useKeyboardInset` pour tenir Enregistrer au-dessus du clavier.
- passe 2 : défauts corrigés — le montant en noir (rouge = en retard seulement).

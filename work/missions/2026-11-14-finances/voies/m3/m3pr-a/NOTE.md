# m3pr-a — Ajouter une prévision, rangée (tiède)
- Genre a, tiède : le contenu de `PlanSheet` tel quel, en langage v6a (p5b derrière). Exemple : l'électricité de v6a (68,00, payée le 9 nov.), prévue chaque mois.
- Change : « Mouvement » devient une bascule À payer / À recevoir en tête ; Catégorie en 8 puces (Ventes, Apports grisées en « à payer ») ; Répétition en segment de 4 ; « Coût de revient » en 3 lignes radio ; Note repliée.
- Gardé : libellé, montant (texte, `inputmode=decimal`), date, fin de répétition (vide = sans fin), fournisseur, la phrase « aucune écriture » dite en mots de brasseur.
- Boosters : sens (bascule), categorie (puces), repetition (segment), cout-brassin (radios).
- Au port : « État » (brouillon, à venir, terminée, annulée) n'existe qu'en modification : à placer sous la note ; jamais `type="number"`.
- passe 2 : défauts corrigés — « À payer » en noir (rouge = en retard) ; Ventes / Apports grisés en trait plein (pointillé = sans pièce) ; phrase de pied en une ligne.

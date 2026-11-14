# m3pm-b — Projet matériel : le minimum (froide)
- Genre b, froide : une demi-feuille sur p5b, qui reste lisible au-dessus (l'étiquette « frigo −3 000, 15.11 » y est : c'est ce projet). Premier plan : le nom, l'avancement et l'échéance en pastilles, le budget 3 000,00, le mois, l'interrupteur « Dans mes prévisions · le 15.11 ».
- Change : tout le reste (besoin, prix 2 800,00 / livraison 200,00 / pose / devis, usure 5 ans, notes, achats liés, Réalisé, Archiver) passe derrière une seule rangée qui dit ce qui manque (« pose ? »).
- Gardé : chaque champ de `UpgradeSheet`, à un toucher ; « À estimer » si le budget est inconnu, jamais 0,00.
- Boosters : mois (pastille), inclure (interrupteur).
- Au port : si budget ou mois manquent, l'interrupteur reste éteint et dit « budget à estimer » à sa place (règle `upgradeReadiness`).
- passe 2 : défauts corrigés — le projet est le frigo 3 000,00 du 15.11 de p5b (plus « Fermenteur 750,00 » au-dessus de « frigo −3 000 »).

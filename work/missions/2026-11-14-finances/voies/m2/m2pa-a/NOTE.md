# m2pa-a — Payer, tiède
Genre a : PaymentSheet rangé (Loyer de l'atelier, 400,00, à payer le 25 nov.).
Change : montant en grand (champ texte, inputmode decimal), bouton « Tout · 400,00 » ; date en trois segments (Aujourd'hui · Hier · Autre date) ; moyen en quatre (Banque · TWINT · Espèces · Autre) ; le bouton dit le montant.
État clé : paiement partiel 250,00 → « reste à payer · 150,00 » hachuré.
Inchangé : règles du code (pas plus que le reste dû ; date jamais après aujourd'hui) ; « encaissement » pour une vente.
Au port : paiement d'origine inconnu : date vide et message « paiement historique inconnu » au-dessus du montant.
passe 2 : défauts corrigés — règles écrites en pied retirées (plafond au reste dû et date passée restent des règles du champ, non affichées).

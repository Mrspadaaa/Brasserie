# Décisions du pilote sur PLAN.md de uv (09.11)

- D1 (a) : `src/ui/FloatingActions.tsx` et les tests qui nomment « Encaisser une vente » passent au Possède de uv.
- D2 : deux puces TWINT · Espèces sous « Payé ici », sans valeur par défaut ; le geste attend le choix.
- D3 : lien par le nom du tarif ; un tarif non reconnu passe par « Autre ». (Le format porté par le tarif viendra avec le port de c7c.)
- D4 : la date reste celle du jour, mais la date de la facture imprimée (« 9 nov. 2026 » de l'annexe) se touche pour la changer (compromis
  « 99 % », second plan, pas un champ au premier plan) ; les bornes de date existantes restent.
- D5 : justificatif joint depuis le détail de l'écriture au journal ; listé comme manque pour le pilote.
- D6 : accepté (« Virement » = Facture QR payée plus tard).

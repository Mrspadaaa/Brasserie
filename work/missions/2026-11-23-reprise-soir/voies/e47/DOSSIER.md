# Dossier e47 — test en ligne du tour 47 (voies/critique-47/RESULTAT.md) et C46-5

Lignes complètes : `grep -n "^| E47-\|^| C46-5" work/missions/BUGS.md` (captures citées).
- E47-1 (m) : la marmite brewstore est marquée « rupture » alors que la page dit « sur commande, expédiée sous 28 jours ». Attendu : un état « sur commande (délai) » distinct de la rupture.
- E47-2 (m) : dans Comparer, la colonne Hauteur met 143,5 cm face à 370 mm ; elle était « Volume » juste avant et a changé sans geste. Attendu : colonnes stables, une même grandeur dans une même unité.
- E47-3 (D) : libellé allemand gardé (« Gesamtabmessungen mit Motor ») : tout libellé traduit en français.
- E47-4 (D) : références affichées comme des quantités (« 109 971 ») : une référence est un texte, jamais formatée en nombre.
- E47-5 (D) : les 10 caractéristiques gardent un doublon (Capacité et Volume 50 L) et laissent l'essentiel (marmite : inox AISI 304, induction non ; frigo : classe E, 104 kWh/an). Attendu : doublons fusionnés, l'essentiel (matière, énergie, compatibilité) avant le secondaire.
- C46-5 (D) : 79,95 s'écrit 80 dans À venir (src/ui/finance/UpgradeWorkspace.tsx l. 74-75, 166, 409, 417, 430) et dans la frise/Achats (src/ui/calendrier/entete/Courbe.tsx). Attendu : centimes affichés dès qu'il y en a ; un montant rond reste sans centimes ; même rendu partout.

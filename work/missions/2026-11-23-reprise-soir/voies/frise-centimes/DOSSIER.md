# Dossier frise-centimes

- Constat (voies/critique-49/RESULTAT.md, ligne C46-5 de BUGS.md) : sur la frise, la bulle Achats dit « −80 » au-dessus de la carte « −79,95 ». La voie e47 a corrigé À venir et une partie de src/ui/calendrier/entete/Courbe.tsx, pas la bulle.
- Règle : un montant s'écrit avec ses centimes dès qu'il en a, sans centimes s'il est rond ; même rendu partout dans le Calendrier et À venir. Les cumuls d'axe ou de graduation peuvent rester arrondis si ce sont des repères, pas des montants d'une chose : écris lesquels dans RESULTAT.md.

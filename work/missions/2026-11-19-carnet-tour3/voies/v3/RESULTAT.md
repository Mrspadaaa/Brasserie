# v3 — vision locale de la Dépense (port 5186, port-carnet HEAD 2cef4d4db de claude/port-carnet-1711)

EN COURS (reprise 2). Banc : `?dev-local&depense=…` (vite.v3.config.mjs : cache Vite isolé `%TEMP%/v3-vite-cache`, HMR et surveillance coupés,
car d'autres sessions éditent port-carnet et le cache partagé donnait « Invalid hook call »). Réponses Gemini ENREGISTRÉES, jamais Gemini réel.
port-carnet porte des modifications non commitées d'autres sessions (carnets, calendrier), hors Dépense.

id | verdict | observé (≤ 25 mots) | capture | taille/thème
---|---|---|---|---
LR1-6 | corrige (avec réserve) | Provisoire : « Somme en cours » neutre, aucun « manquants », pas d'en-tête rouge. Reste : total 46,40 souligné de tirets rouges pendant la lecture. Final : « À vérifier · 1 ligne retirée » | lr16-provisoire, lr16-final | 390 clair, 1280 cave
LR1-7 | corrige (réserve) | Quantité 2, montant 50, prix vidé : la rangée dit « 2 pièces × 25,00 · 50,00 », mais le prix est écrit dans le champ, sans jaune ni data-dp-prix-deduit | lr17-deduit | 390 clair, 1280 cave
LR1-5 | present (en-tête) | doc14 : fournisseur « BRAU- UND RAUCHSHOP » suivi de « Brau- und Rauchshop » barré (même nom, casse seule). v3-lent : Sabro « 30 g » barré sous « 30 g » | reel-doc14, lr16-final | 1280 cave, 390 clair
LR3-3 | present (partie ouverte) | doc25 : « MASQUE DE PROTECT. » porte « COMBINAIBON JETABLE · 1 ? × 9,50 · 9,50 » barré (voisine). Lignes « 1 ? × 4,95 » barré sous « ? × — » (prix perdu au final) | reel-doc25 | 1280 cave, 390 clair
LR2-3 | non-tranché | doc25 « 3/3 · 7 désaccords » pour 35 points lectures-divergentes (19 quantité, 6 nature, 5 montant, 3 nom…) ; doc2 « 1 désaccord » pour 2 points (vendor, currency) : règle de compte non lisible à l'écran | reel-doc25, reel-doc2 | 390 clair, 1280 cave
M9-3 | corrige | Retrait de la ligne 3 (2,40) : « Somme ≠ imprimé 84,10 / 86,50 −2,40 », « 22 / 23 », plus de « Somme = imprimé ». Toucher réel du bouton sans effet (clic DOM requis), voir défauts | m93-retrait | 390 clair, 1280 cave
LR1-9 | present | doc2 390 : « Voir le désaccord » ouvre la ligne 1 (Sedation, sans montant) ; ni les deux lectures ni le champ en désaccord visibles ; carte fixe du pied (≈ 200 px) couvre la ligne ouverte | lr19-desaccord | 390 clair
T3-6 | corrige | Saisie à la main « ZZ TEST — v3 dépense », 1,00 à payer, Enregistrer : feuille fermée, « Achat enregistré. », écriture listée en Finances (dev-local, sans réseau lent) | t36-apres, t36-finances | 390 clair, 1280 cave
T3-7 | corrige | Saisie à la main, total 1,00, « À payer » : pastille du pied « Mon mois −1,00 » (390 et 1280) | t37-mon-mois | 390 clair, 1280 cave
BE-23 | non-joue | — | — | —
BE-27 | corrige | Stocks › Matériel › Enregistrer un achat, « Créer la fiche de ce matériel », bas à 390 : « La fiche reprendra le prix et la date… » lisible au-dessus d’« Enregistrer » | be27-bas | 390 clair, 1280 cave
E1-2 | non-joue | — | — | —
BR-27 | non-joue | — | — | —
TE-35 | non-joue | — | — | —
TE-36 | non-joue | — | — | —
LR1-14 | non-joue | — | — | —

## Défauts neufs (« combien et quels problèmes ? »)
1. doc14, 1280 : colonne des lignes trop étroite ; l'ancienne valeur barrée « 2 Kg × 2,305 · 4,61 » se casse sur 5 lignes, noms coupés « Premi Pils… », « SPEC W ».
2. doc25, 1280 : en-tête de groupe « Rénovation 22 · 1 pièce + ? » : le montant déborde à droite de la colonne (un « 1 » coupé au bord).
3. doc2 : nom du fournisseur barré « Drs H. et I. Gauderon-Comment Sàrl » sous le nom long qui le contient (variante, pas une correction) ; même famille que LR1-5.
4. doc2 : Règlement montre « À payer » choisi et « Payé » barré : lecture provisoire « Payé » rendue comme une correction.
5. LR1-6 provisoire 390 : le bouton « Confirmer » gris avec une roue, sans dire ce qu'on attend (aucun texte « lecture en cours » au pied).
6. M9-3 : après « Retirer la ligne 3 » voulu par le brasseur, l'app dit « 2,40 CHF manquants » et « Ajouter la ligne manquante » : un retrait volontaire lu comme un manque.
7. M9-3 : le bouton « Retirer la ligne 3 » (390) reste hors de l'écran (y = 988 sur 844) même après défilement : un toucher réel n'a aucun effet (le clic DOM retire). À confirmer : bouton d'un geste de glissement ?
8. LR1-7 : à 390, champs de la ligne repliée (Quantité, Prix) présents sous le résumé « Pour quoi ? » (elementFromPoint) : couche cachée mais touchable ? à vérifier.
9. LR1-7 : après montant 50, « Payé · TWINT ≠ imprimé 13,40 / 50,00 −36,60 » : attendu (montant changé), noté pour mémoire.
10. BE-23 : la barre « imprimé ? · … » n'apparaît dans aucun banc (3, doc25, doc14) ; aucun « Stk » à l'écran. Rouge non atteint : la barre n'est pas jouée.

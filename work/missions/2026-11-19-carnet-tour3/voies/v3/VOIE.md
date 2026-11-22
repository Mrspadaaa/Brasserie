# Voie v3 — vision locale de la Dépense (mission 2026-11-19-carnet-tour3)
Règles : `../../VISION.md` (lecture seule du code, webapp-testing, port 5186, 390 tactile et 1280, clair ET sombre, chaque capture
ouverte). Trouver les bancs de la Dépense : `git -C <port-carnet> grep -n "preview=" -- src | grep -i "depense\|expense\|lecture"`
et les réponses enregistrées que les tests utilisent (tests/unit/depense/**) ; jamais Gemini réel.
États à capturer et juger (détail : `../f1/RESULTAT.md` « état à capturer », `../f3/RESULTAT.md`) :
1. LR1-6 : bloc de contrôles pendant une lecture provisoire (aucun rouge « manquants » avant le final), puis le final.
2. LR1-7 : ligne quantité 2, montant 50,00, sans prix : « 2 × 25,00 » déduit.
3. LR1-5 / LR3-3 / LR2-3 : barrés et compte de désaccords sur une lecture enregistrée (doc25, doc14) ; M9-3 « Somme = imprimé » après retrait d'une ligne ; LR1-9 (constat dans `../e1/LIGNES.md`).
4. T3-6 : Nouvelle dépense saisie à la main, Enregistrer : la feuille se ferme, l'écriture est listée.
5. T3-7 : dépense à payer de 1,00 : pastille « Mon mois » dit « −1,00 ».
6. BE-23 : barre « imprimé ? · g kg pièce » sans « Stk ». BE-27 : Atelier › Acheter du matériel, « Créer la fiche de ce matériel », bas à 390 : la phrase reste lisible au-dessus d'« Enregistrer ».
7. E1-2 : saisie à la main de 3 lignes, « pièce » choisie sur chacune (par « Unité à remplir » et par le menu de ligne), Enregistrer, rouvrir : chaque ligne garde « pièce » ?
8. f3 : BR-27 (coût négatif → message), TE-35, TE-36 : un écran chacun.
9. LR1-14 (constat dans `../e1/LIGNES.md`) en local seulement.
Puis la question ouverte sur chaque écran traversé : « combien et quels problèmes ? » (liste numérotée).

## Preuves (obligatoires)
- RESULTAT.md tenu au fil : `id | verdict (corrige/present/non-joue) | observé (≤ 25 mots) | capture | taille/thème`, puis « Défauts neufs ».
- Tests : aucun à écrire ; si un test est lancé, `--reporter=dot > voies/v3/tests.txt`.
- Captures 390 et 1280, ouvertes, dans `voies/v3/captures/`. Serveur arrêté à la fin (vérifier le port 5186 libre).
- Plafond : à 170 k, `REPRISE : <fichier>`. Réponse finale : une ligne.

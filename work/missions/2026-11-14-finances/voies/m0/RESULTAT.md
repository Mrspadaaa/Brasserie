OK — 13 sous-vues capturées à 390 × 844 ; 3 vues sans bouton ou sans donnée, dites ci-dessous.

Fichiers écrits :
- work/missions/2026-11-14-finances/voies/m0/capturer.mjs
- work/missions/2026-11-14-finances/voies/m0/tests.txt
- work/missions/2026-11-14-finances/voies/m0/cap/fi.png, do.png, ar.png, ap.png, fo.png, pa.png, mo.png, pr.png, pm.png, im.png, bb.png, pf.png, ia.png
- work/missions/2026-11-14-finances/voies/m0/RESULTAT.md

Une ligne par clé (capture ouverte et regardée, sauf mention) :
fi : ok — Opérations › Filtres ouvert (panneau Courantes, Toutes, À payer, Sans justificatif, Toutes catégories).
do : bouton désactivé — « Doublons » a l’attribut disabled ; écran capturé avec le bouton visible (pas de feuille).
ar : ok — Opérations › Archives ouvert (« Aucune année archivée »). « Gérer les archives » absent : ar2 non produit.
ap : ok — feuille « Apport ou prélèvement privé » (aucun enregistrement, Enregistrer non cliqué).
fo : ok — fiche « Achats divers » (250,20 CHF, Soldé, Modifier les informations, Fermer ; rien cliqué).
pa : ECHEC pour la feuille Payer — aucune rangée « à payer » en novembre (« à payer 0,00 » ; toutes les rangées sont « ✓ payé »). Capture = Opérations sans feuille. Bouton Payer non vu.
mo : ok — « + pièce » (première rangée, Ventes) ouvre « Modifier l’écriture comptable » (REC-REEL-1) ; Modifier des fiches non capturé.
pr : ECHEC — aucun bouton « + » ni « Ajouter une prévision » dans Prévisions ; le seul « + » est « + Vente ». Capture = Prévisions 90j, sans feuille.
pm : lecture provisoire — Synthèse, ligne « Fournisseurs, matériel » dépliée (Entreprise du coin 5 500,00 ; Quincaillerie 250,20). Aucun projet matériel ouvert : à confirmer.
im : ok — Annuel › étape 4 « Matériel et usure » › « Ajouter un matériel » : feuille « Ajouter un amortissement » (non enregistrée).
bb : ok — Synthèse › « Estimer un brassin » : « Quel brassin veux-tu estimer ? » (Ssr, Pale test). Budget du brassin non ouvert.
pf : ok — Synthèse › « Solde et paramètres financiers » (solde à compléter, Enregistrer non cliqué).
ia : ok — Synthèse › « Comprendre mes dépenses » : feuille « Compagnon brasseur ». Le champ contient un texte pré-rempli par l’app ; aucun envoi, aucun appel Gemini.

Essais : 1 passe complète, puis 2 relances (correction du bouton de l’immobilisation, « Ajouter un matériel »). Une relance s’est arrêtée après « im » ; la passe finale est relancée seule (voir tests.txt).

Critères : G1 CAPTURES OK (13 PNG présents, chacun ouvert et regardé).

Douteux :
- pa : Payer et pr (« + ») n’ont pas de bouton visible dans les données du banc ; à rechercher ailleurs (ex. « 2 sorties » de Prévisions) : non vérifié.
- pm : la capture montre la liste des fournisseurs, pas un projet matériel.
- bb : le choix du brassin, pas le budget ouvert.
- Doublons désactivé : la vue sans feuille.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune

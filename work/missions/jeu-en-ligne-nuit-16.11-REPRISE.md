# Jeu en ligne nuit 16.11 — état de reprise (agent Sonnet, arrêté à 200 k)

Constats à verser dans BUGS.md, section « Jeu en ligne nuit 16.11 » (non versés : BUGS.md non relu, hook bloquant). Onglet Chrome 1005988292, desktop 1538x784.

## Constats (n°, gravité, écran, constat, geste)
1. grave | Brassins › feuille Conduite (d1b) | « Prévu le 30.11.2020 » alors que le brassin est prévu le 30.11.2026 | Brasser une recette ZZ, date lu 30, Planifier, Ouvrir LOT-020, Commencer le brassage
2. moyen | Brassins › fiche | Après « Commencer le brassage », la fiche reste ouverte devant l'écran Conduite (fond flou), fermer par × pour voir l'écran | Commencer le brassage
3. mineur | Brassins › fiche | La feuille saute en hauteur à chaque changement d'onglet Préparer/Carnet/Dossier, le clic suivant rate sa cible | Onglets de la fiche
4. mineur | Brassins › Ranger | La feuille « Ranger » s'étale sur toute la largeur écran (1538 px) au lieu d'une colonne centrée | « … » sur la carte
5. mineur | Brassins › calendrier c2a | Tous les jours (16.11 au 6.12) en « cuve pleine » ; à confirmer si voulu (Milk Stout sans date de mise en bouteille) | Brasser une recette
6. mineur | Brassins › filtres | « Tout effacer » ne retire pas la puce « À brasser » restée active | Filtres › style › Voir › Tout effacer
7. mineur | Atelier › Matériel | Pas de « prochain achat » mis en avant ; ligne sans prix (ZZ) sans crayon ni « + mois » : la modifier oblige à ouvrir la feuille | À venir
8. moyen | Atelier › Matériel | Aucune suppression d'un projet : seulement Archiver, sans confirmation ; ZZ TEST — Matériel reste dans Archives (suppression impossible) | Ouvrir ligne › Archiver
9. mineur | Atelier › Archives | Ouvrir un projet archivé gèle la page ~30 s (clics sans réponse, puis reprise) | Archives › ligne
10. moyen | Atelier › Tarifs | Bouton « Noter » ouvre « Nouvelle note / piste » (carnet), pas une saisie de tarif | Tarifs › Noter
11. mineur | Atelier › Tarifs | Les notes de type Tarif sont mêlées aux tarifs, absentes du Carnet « Tout » ; la nouvelle note créée par « Noter » est toujours de type Tarif | Noter, titre, Enregistrer
12. moyen | Atelier › Tarifs | Graphe log : 2 points aux extrêmes (5 et 900 CHF/L) ; donnée réelle « Bouteille 75 cl 569,50 » = 759,33 CHF/L (Restaurant du Lac), à vérifier (Opérations : Vente 10 × bière 75 cl = 5 695) | Toucher le point bouteille
13. moyen | Atelier › Carnet | Saisie dans « Noter… » : message « L'IA n'a rien proposé » : un appel IA part-il à l'enregistrement ? à vérifier (coût Gemini) | Carnet › Noter… › Entrée
14. mineur | Atelier › Tarifs/Carnet | Feuille d'édition de note pleine largeur écran, non centrée | Crayon sur une note
15. mineur | Atelier › Contacts | « Contacts 1 » affiché avec 2 lignes ; menu contact : feuille tronquée (« Convertir en client » coupé) | Carnet › Contacts › ligne
16. mineur | Atelier | Le premier clic sur un onglet juste après la fermeture d'une feuille est avalé (Carnet, Tarifs) | Fermer une feuille puis cliquer un onglet
17. grave | Finances › Opérations › Modifier une dépense | Le formulaire Modifier affiche la date « 15.11.2025 » au lieu de 16.11.2026 (dépense ZZ créée le 16.11.2026) ; enregistrer pourrait changer la date | Dépense › Modifier (non enregistré, non zoomé : à reconfirmer)
18. mineur | Finances › Nouvelle dépense | Page pleine largeur 1538 px ; libellé « Total TTC » collé sous l'en-tête | + › Nouvelle écriture › Saisir sans justificatif

## Joué
- Brassins : r2a/c2a (feuille Brasser + calendrier), fiche (3 onglets), filtres, Carnet de fiche : joués. ZZ LOT-020 supprimé : OUI (confirmation affichée, carte retirée). Filtres : OK.
- Atelier : Matériel (ajout, modification Plus tard, Archiver) ; Tarifs (point touché, ouverture) ; Carnet (ajout, retrait) ; Contacts (ajout via type Prospect, retrait). ZZ supprimées : Matériel NON (archivé, Archives), note Tarif OUI, note Carnet OUI, contact OUI.
- Finances : vues Synthèse, Opérations, Prévisions, Annuel vues (pas de correspondance établie avec m1do-a, m1ar-c, m3pr-c, m3pm-d, m3im-c, m4bb-a, m4pf-c, m4ia-c). Dépense ZZ créée (12,50 « À payer »), Payer OK (payé banque), Apport ZZ 5,00 créé, Modifier ouvert (constat 17).

## Reste à faire (nouvel agent)
- SUPPRIMER/ANNULER : « ZZ TEST — Dépense » (12,50, Finances › Opérations, formulaire Modifier ouvert : cliquer Annuler), « ZZ TEST — Apport » (+5,00, bouton Annuler sur la ligne) ; ZZ TEST — Matériel archivé (pas de suppression possible).
- Finances : jouer les 8 vues m1do-a… avec leur tag, Modifier (reconfirmer la date 15.11.2025 par zoom).
- Fûts : refus de remplissage et « Marqué propre » sur un fût ZZ TEST : NON joué.
- Verser les constats dans BUGS.md.

## Mise à jour (agent Sonnet 2, plafond 70 tours atteint)
- Constats 1 à 23 versés dans BUGS.md (section « Jeu en ligne nuit 16.11 »). Constat 17 non reproduit.
- Nettoyage : dépense ZZ annulée (paiement corrigé puis écriture annulée) ; apport ZZ +5,00 NON retirable (constat 19) ; prévision ZZ passée « Annulée » ; ZZ TEST — Matériel archivé.
- Reste : m3pm-d (feuille ouverte dans le hub « N sorties » de Prévisions), m3im-c, m4bb-a (Budget d'un brassin), m4pf-c (Soldes et paramètres) ; m4ia-c sans appel payant ; Fûts (refus de remplissage, « Marqué propre »).
- Navigation : Finances › Prévisions › bouton « N sorties » ouvre le hub (Ajouter une prévision, Budget d'un brassin, Mes projets de matériel, Soldes et paramètres).

## Mise à jour (agent Sonnet 3, ~45 tours)
- Constats 24 à 30 versés dans BUGS.md. Joués : m4bb-a (Budget d'un brassin), m4pf-c (Solde et paramètres, rien modifié), m3pm-d (projet ZZ créé jusqu'à « Prêt à acheter », puis archivé : non supprimable, constats 8 et 27), Fûts (fût ZZ F-005 créé puis retiré).
- NON joués : m3im-c (exige un achat réel lié), refus de remplissage et « Marquer propre » sur un fût ZZ (constat 29 : un fût neuf est toujours propre), m4ia-c (appel IA payant).
- Reste à nettoyer côté données : ZZ TEST - Projet materiel archivé, ZZ TEST — Matériel archivé, prévision ZZ annulée, apport ZZ +5,00.
- Onglet de travail 1005988295 ; onglet 1005988292 laissé ouvert (hérité).

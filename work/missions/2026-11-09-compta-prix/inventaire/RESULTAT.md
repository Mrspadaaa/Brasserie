OK — 16 captures faites sur 16 (13 mobile 390 + 3 bureau 1280), état actuel, sans toucher à src/.

Fichiers écrits :
- work/missions/2026-11-09-compta-prix/inventaire/capturer-compta.mjs (script, adapté du capturer fermentescibles)
- work/missions/2026-11-09-compta-prix/inventaire/explorer-compta.mjs (exploration des libellés, sans capture ; à supprimer si inutile)
- work/missions/2026-11-09-compta-prix/inventaire/captures/*.png (16 pages entières + 13 « -haut »)
- work/missions/2026-11-09-compta-prix/inventaire/captures/journal.json
- work/missions/2026-11-09-compta-prix/inventaire/RESULTAT.md

Critères : GATES.md absent du dossier (le VOIE ne renvoie qu'à VOIE.md) ; pas de CHECK rejoués. Contrôle retenu : 16 captures présentes, MANQUES vide, ERREURS PAGE 0 (lancement du 2e passage : « CAPTURES : 16 ; MANQUES : [] ; ERREURS PAGE : 0 ; REQUETES BLOQUEES : 2 »). Serveur : http://localhost:3000 existant, non relancé.

Essais utilisés : 4 passages du script (2 échecs de sélecteur corrigés : tarif ouvert par « Modifier le tarif … » ; quantité = textarea, pas input).

Ce que montrent les captures (ouvertes : tous les -haut, synthese-1280, previsions-1280, prix-marges-1280 ; pages entières non ouvertes un par un sauf via le -haut) :
- synthese-situation : Trésorerie 4 181,60 CHF ; à payer 460,00 CHF (Solde atelier 60,00 en retard ; Loyer 400,00 le 25 nov.).
- synthese-couts : dépenses nettes 725,40 CHF (novembre) ; charges fixes 468,00 (65 %), brassage 186,80 (26 %), nettoyage 42,00 (6 %), matériel 28,60 (4 %) ; coût brassin « Pale Ale de septembre » 7,51 CHF/L (27 L).
- budget-brassin (feuille ouverte depuis Coûts) : 64,26 CHF TTC (ingrédients 22,42 ; autres frais 41,84) ; volume à brasser 30, net 27 L.
- operations : 7 opérations, −65,40 CHF ; 9 nov. 6 opérations −5,40 ; filtres « À payer 2 », « En retard », « À encaisser », etc.
- previsions-echeances (90 jours) : factures à régler 460,00 ; budgets 1 614,26 ; sorties 2 074,26 ; entrées 0,00 ; solde estimé 2 107,34 « scénario partiel » ; bandeau « Prévision incomplète ».
- previsions-projets : Fermenteur supplémentaire 750,00 (janv. 2027, À étudier) ; Hotte de brassage 800,00 (devis en cours) ; Système de brassage « À estimer ».
- annuel : exercice 2026 « Brouillon » ; Comptes provisoires ; Inventaires « À compléter » ; Matériel à amortir 1 fiche ; Vérifications 0/6.
- clients-liste : 2 clients (Café du Bourg, Pro ; Martin Rey, Privé), tous « Prospect — Aucune vente ».
- impot-biere : 26,6 L conditionnés → 4,49 – 8,98 CHF ; « densité initiale manquante pour 1 brassin(s) » ; taux plein.
- prix-marges : 3 tarifs — Pale Ale 33 cl 4,50 / coût 1,20 / +3,30 (73,3 %) ; Pale Ale 50 cl 7,00 / 1,60 / +5,40 (77,1 %) ; Fût 20 L 110,00 / 42,00 / +68,00 (61,8 %).
- prix-marges-tarif : même tableau, bouton « Modifier le tarif » (crayon) ; la feuille du tarif ouverte n'est pas dans la capture de la fiche — à vérifier au besoin.
- facturer : feuille « Facturer Café du Bourg » ; bandeau « Autorise une fois le Drive… Connecter Drive » suivi de « La connexion Google ne peut pas être préparée. Réessaie. » ; formulaire dessous (Date 09.11.2026, Article 1, total « À compléter »).
- facturer-rempli : produit « Pale Ale 33 cl », quantité 24, prix 4,5 ; total 108,00 CHF. Non enregistré, aucun PDF.
- synthese-1280, previsions-1280, prix-marges-1280 : mêmes données, mise en page bureau (barre du bas en bas, sélecteur « Ce mois » en haut de Prix et marges).

Points douteux :
1. Le bandeau Drive bloque l'enregistrement dans l'app locale : « Connecter Drive » non cliqué (compte Google externe). Le bouton « Enregistrer et télécharger » non cliqué.
2. La fixture pose costTotal 1,60 pour le 33 cl, et l'app affiche 1,20 : le coût affiché semble recalculé, non lu. Pas vérifié pourquoi ; ne pas tenir ces coûts pour des données.
3. La pastille « Compagnon hors connexion · mode local » recouvre une partie du contenu en bas de page dans previsions-echeances-haut, annuel-haut et clients-liste (capture non jugée au-delà du constat).
4. Captures pleines : les pages longues (previsions-echeances 1057 px, annuel 1042 px, previsions-1280 1038 px) sont en fullPage ; la barre du bas peut apparaître au milieu de la capture — non vérifié sur chaque pleine page.
5. facturer-diag.png (état Drive, premier essai) supprimé comme doublon de facturer.png.

Fixture (mémoire seule, cache dev-local, aucune écriture réelle) : 2 clients, 3 tarifs, 1 lot LOT-DEMO-1 « Pale Ale de septembre » (conditionné, 20 × 33 cl + fût F-001, 26,6 L).

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune

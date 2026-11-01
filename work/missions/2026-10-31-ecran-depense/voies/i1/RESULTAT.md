OK — inventaire et captures 390/1280 faits sur fixtures ; onglets « Entrées » absents du code.

Fichiers écrits :
- work/missions/2026-10-31-ecran-depense/inventaire/capture-1280-lu.mjs (nouveau : captures lu 1280 et ligne ouverte, sans réécrire capture.mjs)
- work/missions/2026-10-31-ecran-depense/inventaire/captures/depense-lu-1280.png
- work/missions/2026-10-31-ecran-depense/inventaire/captures/depense-lu-articles-1280.png
- work/missions/2026-10-31-ecran-depense/inventaire/captures-journal-1280.txt
- work/missions/2026-10-31-ecran-depense/inventaire/inventaire-depense.md
- work/missions/2026-10-31-ecran-depense/voies/i1/RESULTAT.md

Captures regardées (une phrase chacune) :
- depense-vide-390 : feuille « Nouvelle dépense » vide, bouton Joindre, total 0,00, Déjà payé, Articles repliées.
- depense-articles-vide-390 : section Articles ouverte, type Ingrédients, « Aucun mouvement de stock », Ajouter une ligne.
- depense-lu-390 : justificatif prêt, bandeau « Service » absent, carte « Facture · 2 articles · Lecture à confirmer », total 108,1 à confirmer.
- depense-lu-articles-390 : ligne « Malt pils » ouverte (libellé, type, TTC 60, stock), « Regrouper » et « Ajouter une ligne ».
- depense-erreur-390 : bandeau « Service IA momentanément indisponible », Drive non connecté, « Justificatif prêt », total 0,00.
- depense-vide-1280 : modale centrée, mêmes champs, pied « Enregistrer la dépense ».
- depense-lu-1280 : modale centrée, bandeau Drive, carte ambre, total 108,1 à confirmer, date dépliée.
- depense-lu-articles-1280 : Articles ouvert, ligne 1 ouverte, défilement nécessaire pour la fin.
- fin-synthese-390 / -1280 : Synthèse, « Solde de départ à renseigner », « Aucune facture suivie ».
- fin-operations-tout-390 / -1280 : Opérations, filtre Tout, « Aucune opération enregistrée ».
- fin-previsions-390 / -1280 : Prévisions 90 jours, « Prévision incomplète », montants à 0,00.
- diagnostic-lecture.png : capture d'un essai antérieur, non utilisée.

Critères :
- G1 : `node scripts/agents/systeme.mjs note work/missions/2026-10-31-ecran-depense/inventaire/inventaire-depense.md --contient "Nouvelle dépense,Articles,Entrées,Prévision,Tout,ExpenseSheet.tsx"` → `NOTE OK` (exit 0).
- G2 : compte récursif des .png dans inventaire/ → `CAPTURES OK 17` (exit 0). Ce compte inclut recon/ et diagnostic-lecture.png, antérieurs à i1.

Essais :
- Captures 1280 lu : 2 essais. Le premier a pris « Comprendre mes dépenses » (regex trop large) ; corrigé sur « Nouvelle écriture Dépense », puis OK.
- G1 : 1 essai, OK. G2 : 1 essai, OK.

Ce qui reste douteux :
- Onglets « Entrées » et « Prévision » du brief : absents du code. Onglets réels : Synthèse, Opérations, Prévisions, Annuel ; « Tout » est un filtre d'Opérations. Non corrigé (hors contrat), à trancher par le pilote.
- Non atteints : états « lecture vérifiée / corrigée / incomplète », hors ligne, doublon, avoir, matériel, erreur d'enregistrement ; une seule fixture. Gestes non joués listés dans inventaire-depense.md.
- DriveConnection.tsx non relu (nom seulement) ; l'état Drive « ne peut pas être préparée » vient du banc (émulateur driveAuthorization absent).
- Éléments « non localisés » dans l'inventaire : libellés des vues Prévisions et de la barre basse.
- Captures comme inventaire, non mesurées ; pas de jugement visuel au-delà de la description.

CONNAISSANCE : aucune

LEÇON PROPOSÉE : aucune

# Reprise — lenteurs (22.11), arrêt à ~150 k

Fait : MESURES.md (CAL-LENT ROUGE, gestes WF* en INP, 5 pires gestes, remèdes), BUGS.md (8 lignes, « mesure du 22.11 »).
Builds et sorties brutes : `%TEMP%/lenteurs-22-11-b/` (`build-tour9`, `build-tour7`, `build-tour9-nm` non minifié ; `out/`). Outils copiés dans `outils/`
(`pas2.mjs` lit `pas/*.txt`, `CPU=4 BUILD=<dossier> OUT=<dossier> [PROFIL=1] node pas2.mjs pas/<f>.txt <nom>` ; `top-profil.mjs` lit un `.cpuprofile`).

## DEMANDE EXECUTANT (reste à faire, mécanique)
1. Profils par geste (un `.txt` d'un seul geste, `PROFIL=1`, build `build-tour9-nm`) pour : Poser un brassin, Ajouter en, Noter, Recette,
   Commencer le brassage ; `node outils/top-profil.mjs <profil> 10` ; verser les parts dans MESURES.md § 3 (aujourd'hui agrégées sur la séquence).
2. WFR-8 et T2B-3 : jouer Actions rapides › Recette (ou Brassins › Recettes › fiche) jusqu'à Eau → Récap, Enregistrer et préparer, retour Levure ;
   écrire les pas dans `pas/produire.txt`, 5 tours tour7/tour9 alternés (`suite.mjs` en exemple).
3. Parcours CAL-LENT : variante de `lenteur.mjs` avec `menuDuree('3 mois')` avant « evenement-ouvrir » (voir MESURES § 1), 5 tours, pour avoir Modifier et
   Enregistrer sur 5 tours ; trace avec `--sans-trace` retiré pour « semaine » et « frise » (chercher `mesurerTraits`).
4. « OK » après facture (WFV-16) : lire les boutons de la feuille de facture (`d`) pour le libellé exact ; Dossier, Budget, étalonnage (WF2-3) : idem.

## Décision à prendre
Corriger `Frise.tsx` l. 253 (`mesurerTraits` à chaque rendu) et `pageVisibilityCheck` (PageShell.tsx l. 186, cache recréé à chaque appel) : deux
remèdes standards, gain estimé −50 % et −150 à −250 ms ; à confier à une voie de code avec A/B alterné (poste bruité, `ab-lenteur.mjs`).

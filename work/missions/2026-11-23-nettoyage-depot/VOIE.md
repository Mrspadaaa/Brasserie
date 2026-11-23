# Voie inventaire du nettoyage — tri des tests (règle à jour, 23.11)

Ses mots : « le 90% [des tests] est inutile » ; « un test d'intégration par écran vivant. Attention car fragile vu que
c'est des tests souvent avec des nouveaux comportements, pareil pour les autres ».

GARDER seulement ce qui est stable :
- calculs du domaine (moteur, eau, stock, dates, finances) ; intégrité des données et du hors ligne ;
- contrôles de ses plaintes (cités par DEFAUTS-RECURRENTS.md ou un script de parcours/déploiement) ;
- gestes qu'il a validés : e2e/ (Playwright), tests/unit/proprietes (fast-check).

RETIRER (rien n'est retiré par la voie, liste seulement) :
- tout test d'écran qui fige un comportement non validé ou mouvant (sous-compte « fragile ») — plus de « un test par écran » ;
- code mort, anciennes couches, tests figés par lot/version, textes ou DOM figés, doublons, comportement abandonné.

Rendu dans INVENTAIRE.md : comptes et listes par groupe, lignes, temps vitest gagné, 10 cas vérifiés à la main.

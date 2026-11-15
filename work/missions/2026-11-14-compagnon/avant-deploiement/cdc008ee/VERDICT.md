# Avant déploiement — compagnon brasseur p2a

Version : cdc008ee
Captures : banc `voies/b-port3` sur f8739172 (branche claude/compagnon-p2a) ; cdc008ee = en-ligne/2026-11-15-futs + cette branche, diff nul sur les fichiers du compagnon (`git diff --stat f8739172 cdc008ee -- src/ui/Brewer* src/ui/companion src/ui/finance/FinanceAssistant.tsx src/ui/Sheet.tsx` : 0 ligne).
Question ouverte du brasseur : « combien et quels problèmes il y a ? ». Critique Opus : c3 (93 défauts), c4 (33 restants : fidélité 9, donnée 7, banc 17) ; fx3 a corrigé 14 des 16 non-banc ; les restes ci-dessous ne faussent aucune lecture.

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| accueil-1280-cave.png | sombre | 1280 | accueil | 1 | 0 |
| accueil-1280-clair.png | clair | 1280 | accueil | 1 | 0 |
| accueil-390-cave.png | sombre | 390 | accueil | 1 | 0 |
| accueil-390-clair.png | clair | 390 | accueil | 1 | 0 |
| attente-1280-cave.png | sombre | 1280 | attente | 0 | 0 |
| attente-1280-clair.png | clair | 1280 | attente | 0 | 0 |
| attente-390-cave.png | sombre | 390 | attente | 0 | 0 |
| attente-390-clair.png | clair | 390 | attente | 0 | 0 |
| bureau-1280-cave.png | sombre | 1280 | bureau | 1 | 0 |
| bureau-1280-clair.png | clair | 1280 | bureau | 1 | 0 |
| bureau-390-cave.png | sombre | 390 | bureau | 1 | 0 |
| bureau-390-clair.png | clair | 390 | bureau | 1 | 0 |
| conversations-1280-cave.png | sombre | 1280 | conversations | 0 | 0 |
| conversations-1280-clair.png | clair | 1280 | conversations | 0 | 0 |
| conversations-390-cave.png | sombre | 390 | conversations | 0 | 0 |
| conversations-390-clair.png | clair | 390 | conversations | 0 | 0 |
| erreur-1280-cave.png | sombre | 1280 | erreur | 1 | 0 |
| erreur-1280-clair.png | clair | 1280 | erreur | 1 | 0 |
| erreur-390-cave.png | sombre | 390 | erreur | 1 | 0 |
| erreur-390-clair.png | clair | 390 | erreur | 1 | 0 |
| finances-1280-cave.png | sombre | 1280 | finances | 1 | 0 |
| finances-1280-clair.png | clair | 1280 | finances | 1 | 0 |
| finances-390-cave.png | sombre | 390 | finances | 1 | 0 |
| finances-390-clair.png | clair | 390 | finances | 1 | 0 |
| fournisseurs-1280-cave.png | sombre | 1280 | fournisseurs | 0 | 0 |
| fournisseurs-1280-clair.png | clair | 1280 | fournisseurs | 0 | 0 |
| fournisseurs-390-cave.png | sombre | 390 | fournisseurs | 0 | 0 |
| fournisseurs-390-clair.png | clair | 390 | fournisseurs | 0 | 0 |
| limites-1280-cave.png | sombre | 1280 | limites | 0 | 0 |
| limites-1280-clair.png | clair | 1280 | limites | 0 | 0 |
| limites-390-cave.png | sombre | 390 | limites | 0 | 0 |
| limites-390-clair.png | clair | 390 | limites | 0 | 0 |
| plafond-1280-cave.png | sombre | 1280 | plafond | 1 | 0 |
| plafond-1280-clair.png | clair | 1280 | plafond | 1 | 0 |
| plafond-390-cave.png | sombre | 390 | plafond | 1 | 0 |
| plafond-390-clair.png | clair | 390 | plafond | 1 | 0 |
| planche-1280-cave.png | sombre | 1280 | planche | 0 | 0 |
| planche-1280-clair.png | clair | 1280 | planche | 0 | 0 |
| planche-390-cave.png | sombre | 390 | planche | 0 | 0 |
| planche-390-clair.png | clair | 390 | planche | 0 | 0 |
| reponse-1280-cave.png | sombre | 1280 | reponse | 1 | 0 |
| reponse-1280-clair.png | clair | 1280 | reponse | 1 | 0 |
| reponse-390-cave.png | sombre | 390 | reponse | 1 | 0 |
| reponse-390-clair.png | clair | 390 | reponse | 1 | 0 |
| urgent-1280-cave.png | sombre | 1280 | urgent | 0 | 0 |
| urgent-1280-clair.png | clair | 1280 | urgent | 0 | 0 |
| urgent-390-cave.png | sombre | 390 | urgent | 0 | 0 |
| urgent-390-clair.png | clair | 390 | urgent | 0 | 0 |
| zero-1280-cave.png | sombre | 1280 | zero | 0 | 0 |
| zero-1280-clair.png | clair | 1280 | zero | 0 | 0 |
| zero-390-cave.png | sombre | 390 | zero | 0 | 0 |
| zero-390-clair.png | clair | 390 | zero | 0 | 0 |

## Problèmes restants (un par état compté 1)
- accueil : banc en jour de brassage : questions du brassage, pas de frise de dry hop (aucune fermentation dans la donnée du banc) ; × cerclé au focus
- reponse : « Rappel 09:00 » retiré (aucune capacité de rappel) ; « Écart de dose » au lieu de « Dose totale » en g/L
- erreur : libellé « Réessayer l’envoi » au lieu de « Envoyer au retour du réseau »
- finances : repli du banc : Finances non monté par la page de banc, accueil recette avec la question
- plafond : banc : la carte « Budget IA du mois atteint » vient d’un échec de plafond, non joué ; bandeau et champ « En pause » vus ; carte couverte par tests
- bureau : la page de fond ne réagit pas à la proposition (hors du compagnon)

Pilote : vu (planche 390 cave des 12 vues, côte à côte reponse, plafond, accueil en 390 clair, bureau 1280 clair).
Bloquants : 0

# Reprise : intégration des lots du Carnet et lot 11 (23.11, pilote Opus, arrêté à 360 k de contexte)

Worktree : `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet`, branche `claude/port-carnet-1711`, HEAD `5cfde01b5`. Rien poussé ni déployé.
Les fichiers non commités des autres (murDonnees.ts, src/ui/stock/*, source4-…json, work/missions/2026-11-20-frise/*) sont intacts.

## Fait
- Pull de origin/main (290fd00d5), puis fusion des lots 1 à 10 (`a79eeba1b`). Seuls conflits : 2 PNG de référence (fiche-article 844, comparer 844), régénérés ensuite.
- tsc : 0 erreur. vitest complet, fusion puis final, comparé à la base 290fd00d5 : aucun nouvel échec.
  Une seule différence : `tests/unit/carnetsLot1.test.ts` ne charge pas dans port-carnet, car `cheerio` manque dans `functions/node_modules`.
  C'est l'environnement, pas le code : rejoué sur la fusion dans le worktree lot-1, il passe (17/17).
- Rouges e2e qui ne viennent pas de la fusion : ils sont déjà rouges sur leur branche seule, à 844.
  - lot-9 : L-58 et L-59 ;
  - lot-10 : L-71.
- `playwright.config.ts` : le projet bureau-1280 est ancré à `e2e/carnet`. Avant, le chemin « port-carnet » faisait aussi passer le Calendrier à 1280.
- Lot 11, avec un test rouge d'abord pour chaque point :
  - L-20 : Retirer un critère, avec Annuler.
  - L-50 : le carnet reste ouvert au rechargement. Le `test.fail` de lot-8 est levé.
  - L-4 et L-1 : la raison de la page non lue est dite dans le bandeau ; « Relire » est offert après un échec.
  - L-2 : « Y ajouter ? » (`carnetSuggere`). Code fait, mais l'IA simulée ne fait jamais de suggestion : non prouvé au banc.
  - L-30 : « Y ajouter en façon » ajoute vraiment.
  - P5 : pas de défaut reproduit sur la fusion ; il était déjà corrigé par le L-2 du lot 1.
  - lireMontant passe par lireDecimal ; « 1.845 » est lu 1845 ; l'icône du carnet suit son plan (iconesIdees).
  - « Supprimer avec son plan » est rouge ; « Abandonner » reste à côté de « Garder ».
  - D430 : 14 px partout dans le Carnet ; CARNET-LIS passe à 14.
  - D431 : voie Sonnet `claude/carnet-lot-11-date`, fusionnée. Elle couvre Quand, À venir, Modifier et la fiche ; PW-2 est levé ; la frise de Quand pose une semaine (« S5 »).
- Captures de référence refaites et regardées. Captures 390 du lot 11 regardées (planche : scratchpad `l11/p-c11.png`).

## Reste : la porte est rouge (bloquant)
`deploy-seul.sh` (sans DEPLOYER) s'arrête sur « PARCOURS CALENDRIER ECHEC (5) » : « date fête / vente / achat / papier / travaux : rangée des jours
de la feuille introuvable ». Cause : D431 (commit e3a3b7531) a retiré de la feuille Modifier les rangées de jours « L … D », remplacées par la
frise au jour (`ChoixDate`, `[data-choix-date]`, `[data-date-point]`). Il faut mettre à jour `scripts/parcours/calendrier.mjs` (l'étape « date … »)
pour qu'elle tire le repère de la frise au jour, puis rejouer la porte jusqu'à « PARCOURS CALENDRIER OK » et « PRET, NON DEPLOYE ».

## Reste aussi
- Les points hors lot qui n'étaient pas dans les priorités, encore ouverts : pastille « Idée » d'un projet acheté sans choix ; prix tapé en bas
  devenu une note ; « Plus tard » ne déplace pas le plan ; « 1 article · 400 CHF » dans analyseLocale ; « Rangé ici » pendant le rangement ;
  « Hors ligne » qui couvre les sous-onglets ; NouvelleVersion.tsx mort (le supprimer demande un accord) ; AtelierPorte qui prend 150 px en paysage.
- Worktrees temporaires à retirer : `base-vitest` (détaché sur 290fd00d5), `lot-11-date`.
- Non fait, comme demandé : la lecture IA d'une photo, L-61, L-63, L-64, Q-1, Q-1b, Q-2, Q-5, Q-6.

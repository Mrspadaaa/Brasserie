# Voie k6-diagnostic — pourquoi sa pièce du 01.11 au soir est mal rendue (D261, D262)

Agent : `auteur` (Sonnet). Plafond : 60 tours. Pilote : Opus. Aucun appel à Gemini, aucun déploiement, aucun commit.

## Ses mots (SPEC-BRASSEUR, 01.11 nuit)
« Ça semble pas être super juste ??? » ; « le ht, TVA semble pas super fonctionné comme illustré dans la capture » ; « ça à pas classé,
levure, malt, outils de brassage, autre ect... Correctement ». Ses captures de l'écran (hors Git, à ouvrir en image) :
`work/missions/2026-10-31-ecran-depense/brasseur/01-11-brau-{justificatif-ouvert,port-date,noms-doubles,lignes,tete}.jpg` ; la pièce :
`work/finalisation-tickets-2026-10-08/H13-reels/doc14-commande-brau-ecran.jpg`. Défauts : `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md`
lignes D261a à D261c, D262a, D262c. D261a (noms doublés) et D262b (date) sont déjà corrigés par le pilote : n'y touche pas.

## Questions (une réponse prouvée par question : chemin:ligne, test ou rejeu)
1. **D262a — TVA** : quelle règle lève le point ④ / la pastille TVA (ou HT) sur sa capture alors que la TVA imprimée est juste ? Chemins :
   `functions/src/invoiceControls.ts`, `src/domain/finance/invoicePoints.ts`, `src/ui/depense/etat.ts`, `src/ui/finance/ExpenseSheet.tsx`.
   Rejoue la règle sur une fixture qui imite sa pièce (valeurs inventées, même forme : TVA comprise, un seul taux, port, arrondi).
2. **D261b — arrondi** : un écart ≤ 5 centimes dû à l'arrondi suisse (« Rundung ») est-il traité comme un écart de somme ? Écris le test
   qui échoue aujourd'hui (attendu : pas de blocage, une mention « arrondi » au plus).
3. **D262c — genres des lignes** : d'où vient la famille affichée (levure, malt, houblon, matériel de brassage, autre) : le `kind` de la
   lecture (`SCAN_KINDS`), un rapprochement au stock, une table de l'app ? Pourquoi sa pièce est mal classée ? Écris le test qui échoue
   sur une fixture de même forme.
4. **D261c — temps** : d'après `functions/src/` (étapes parallele / troisieme), qu'est-ce qui appelle la 3.8 sur une pièce pareille
   (quels champs divergent entre les deux Flash-Lite dans `compareInvoiceReview`, `functions/src/invoiceScanCore.ts:418`) ? Si le banc
   (`scripts/banc-lecture-facture.ts`, mode `--hors-ligne --reprendre`) peut relever **quels champs** divergent, ajoute ce relevé au rapport
   du banc (sans changer le jugement), avec un test.
Pour chaque défaut : la cause, le correctif le plus petit **proposé** (diff dans le RESULTAT, non appliqué si c'est dans `functions/` ;
appliqué seulement dans `scripts/` et `tests/`), et le test qui échoue sur l'actuel.

## Possède
`tests/unit/depense/banc-k6/` (neuf), `scripts/banc-lecture-facture.ts` (relevé des divergences seulement), son test,
`work/missions/2026-11-01-banc-lecture/voies/k6-diagnostic/RESULTAT.md`. Rien d'autre. Tests : la copie isolée
(`node work/missions/2026-10-31-ecran-depense/voies/p3c-port/copie.mjs "<cmd>"`), jamais de serveur de dev dans
`C:/Users/mrspa/Documents/Brasserie`. Aucune valeur de ses pièces (montants, noms d'articles, adresse) dans le RESULTAT ni le retour.
Ne touche jamais `.codex/hooks.json`, `source4-portable-bundle-manifest-01.json`, `functions/.env`, `functions/.secret.local`.
Retour en une ligne : `K6-DIAG OK — <4 causes en 4 mots chacune> — <chemin du RESULTAT>`.

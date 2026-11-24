# Voie prix-houblon — un prix lu porte son conditionnement ; prix au kilo pour comparer (LIEN-PRIX-JUSTE)

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 120 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie.
- Lis DOSSIER.md À LA PLACE des sources brutes.

## Économie
- Mécanique : le banc des liens (sans IA gratuit ; avec IA : budget 0,10 CHF, journal).
- Gestes : grep ciblé ; un script par lot ; tests et banc dans des fichiers.

## À faire
1. État de l'art en tête de RESULTAT.md (une ligne : prix d'offre schema.org Offer/AggregateOffer + unitPriceSpecification / referenceQuantity, variantes Shopify `product.json`, prix au gramme des boutiques ; décision).
2. Ajouter au banc permanent les deux pages (capture de la page servie au serveur, vérité écrite depuis le DOSSIER) : https://www.motlerhops.fr/collections/tous-nos-houblons/products/citra-us et https://www.brauundrauchshop.ch/citra-136-2. Banc avant : rouge sur ces deux liens.
3. Tests rouges AVANT le correctif (tests-rouge.log), depuis les règles du DOSSIER ; puis correctif dans la lecture serveur (functions/src/lien*) et l'affichage (src/domain/carnets, src/ui/carnets) ; vert.
4. « Relire » sur un article déjà lu à prix « dès » sans quantité retrouve un vrai prix (ou dit pourquoi) : test.
5. En-tête de colonne « prix EUR » (capture) : la colonne des prix dit la monnaie de comparaison (CHF), jamais celle d'un article ; test.
6. Registre : ligne neuve PX-1 (B) et PX-2 (m, en-tête) à work/missions/BUGS.md → « corrigé en local <hash> » ; BUGS OK.

## Critères
- tsc (racine et functions/) : aucune erreur neuve ; tests touchés, c48..c59Regles, carnets*, proprietes verts ; banc 63+2 liens : ces 2 justes, aucun autre champ en recul, 0 invention ; BUGS OK ; commit par chemins ; fin « PRÊT À METTRE EN LIGNE <hash> » (aiTask à déployer par le pilote : il l'accepte).

OWNS : functions/src/lien* et modules de lecture des liens ; scripts/banc-liens.ts et le banc (work/missions/2026-11-23-carnet-en-ligne/banc-liens/) ; src/domain/carnets/** ; src/ui/carnets/** (affichage du prix seulement) ; tests/unit/ que tu crées ; lignes PX de BUGS.md ; ton dossier ; lignes ajoutées au journal IA. Ne touche pas src/domain/stock, src/ui/stock. Ne déploie rien.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre).
- Tests : npx vitest run <fichiers> --reporter=dot > tests.log 2>&1; tail -5 tests.log (dans ton dossier).

# Vérité et règles de notation de t2a (écrites le 14.11 AVANT toute passe payante)

Vérité : `cas-t2a.json` (17 cas : 6 imports, 6 relectures, 3 COA, 2 fiches de variété). Recettes et relectures inventées pour le banc (aucune donnée du brasseur) ; COA et photos : fixtures publiques du dépôt `tests/fixtures/gemini-usage-bench/`. Valeurs attendues calculées à la main.
Moitiés (L20) : « choix » (3 cas par usage) sert à éliminer en passe courte ; « jugement » (les autres) ne sert qu'aux finalistes. Un tirage par cellule ; le bruit n'est pas mesuré. Le juge est ce code, pas le brasseur (L27).
Code : `scripts/banc-t2a-usages.ts` (fonctions `noteImport`, `noteRelecture`, `noteCoa`, `noteVariete`, testées).

## Règlement du coût (décision du pilote, 14.11)
Coût d'un appel = jetons (entrée + sortie dont réflexion) + requêtes de recherche LUES dans `groundingMetadata.webSearchQueries`, au tarif officiel : 14 $ les 1 000 requêtes (page de prix Google, lue le 14.11.2026 ; au-delà de 5 000 requêtes gratuites par mois partagées entre tous les modèles 3 et suivants, que le banc ne déduit pas), converti à 1,25 CHF/USD de provision comme `geminiCosts.ts` : 0,0175 CHF la requête.
Colonne « ancrage non prouvé » : appel ancré dont la réponse ne porte pas `webSearchQueries` ; sa recherche éventuelle n'est pas facturée dans le tableau (borne haute donnée en fin de passe). Le journal du tour est donc une estimation honnête, jamais une facture.

## Notation (note 0 à 1, moyenne pondérée des critères applicables)
- Import : identité 0,10 (nom, DI et DF à `tolOg`) ; fermentescibles 0,25 (nom, kg à 2 %, `kind: sucre` pour le candi) ; houblons 0,30 (nom, g à 3 %, alpha à 0,05 abs. quand attendu, étape dans `stages`, `timeMin`/`dayOffset` exacts) ; levure 0,10 ; empâtage 0,15 (°C à 0,6, durée exacte) ; ajouts 0,10 si attendus. Alpha absent de la recette attendu `null` : un alpha donné sans `source` est INVENTÉ.
  INVENTÉ = ligne en trop (au-delà de `nbFermentables` / `nbHops`) ou alpha non sourcé. INUTILISABLE = pas de JSON, coupé, HTTP, délai, volume hors 1 %, fermentescible attendu absent.
- Relecture (barème de `gemini-usage-bench.ts`) : JSON 1, défauts plantés relevés avec la bonne gravité 4, aucun « bloquant » injustifié 2 (critique), donnée manquante signalée 1, sobriété sur recette saine (au plus une remarque de goût) 1. INUTILISABLE = pas de JSON ou `findings` absent.
- COA : `found` 1, lot 2, année de récolte 2, chaque mesure attendue (analyte + valeur) 4, aucune mesure interdite (plage variétale, HSI non déterminé, µg/L) 3 (critique).
- Variété : variété fictive « Affinée Gold » : `found: false` 2, ni analyse ni description 3 (critique). Citra : `found: true` 3, alpha 10 à 15 % 4 (ordre de grandeur publié, non une vérité fine), source avec URL 3.
- Élimination en passe courte : qualité de choix < production − 0,05, ou ≥ 1 inutilisable, ou p50 > 2 × production.
- Mesures : qualité moyenne, inutilisables, p50/p90 s, CHF par appel (jetons + requêtes lues), tarif du 1.12 pour Argon et Carbon (doublé).
- Plafond de sortie : 12 000 jetons pour les cellules Gemini 4 (la réflexion compte dans la sortie), 8 000 en production pour l'import et la relecture : ce relèvement est dit dans RESULTAT.

## Amendement du 14.11, après la passe 1 (appliqué à toutes les cellules par re-notation `--tableau`, sans nouvel appel)
- Le programme d'empâtage est lu dans `mashSteps`, `mash.steps` ou `steps` (le schéma de production prévoit les trois ; le serveur les rassemble). La passe 1 avait noté 0/n des paliers rendus sous `steps`.
- Un houblon cité une seconde fois (même nom, même alpha attendu) peut rester sans alpha dans la réponse (`alphaFacultatif`).
- Un palier absent ou un `steps: []` reste noté faux : la lecture élargie n'invente rien. Tests : `tests/unit/banc-t2a-usages.test.ts`, « amendements de notation ».

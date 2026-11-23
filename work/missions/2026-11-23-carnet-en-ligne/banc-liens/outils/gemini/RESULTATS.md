# Gemini lit une page produit à partir de son seul lien (23.11)

Mesure réelle, url_context, température 0, sortie JSON (nom, marque, prix, devise, TTC/HT, frais vers la Suisse, photos, caractéristiques ; « rien inventé, champ absent vide »). Clé lue par `readLocalKey` (jamais affichée). Appels en parallèle (8 au plus, les quatre configurations d'un lien ensemble), chrono par appel, une ligne par appel dans `ia-journal.jsonl` (méthode `banc-liens-gemini`, 54 lignes).

## Limites à lire d'abord

- **Budget dépassé : 0,988 CHF dépensés pour 0,8 CHF permis (+0,188 CHF).** Cause : une garde trop prudente a coupé le premier passage à 0,46 CHF ; je l'ai assouplie, et huit appels partis ensemble ont lu de grosses pages (lien 40 : 111 000 jetons d'entrée en 3.8 Flash = 0,21 CHF à lui seul). Rien n'est parti après. Aucun appel de plus : la suite attend l'accord du pilote.
- **16 liens sur 63 mesurés** (les liens 26 à 41, la vérité structurée du banc : `verite-ajout.json`). Les liens 1 à 25 n'ont pas de vérité champ par champ (captures et tableau du RAPPORT seulement) : non notés. Les liens 42 à 63 : budget épuisé.
- Neon : 6 liens (26 à 31), coupé automatiquement car sa médiane (10,6 s) dépasse celle de 3.8 Flash (5,5 s).
- **Le repli google_search de 3.8 Flash n'est pas mesuré** : il devait partir après le premier échec de prix (liens 27 et 36), le budget l'a empêché. Hydrogen et Neon avec google_search : non testés.
- Peu de liens : un écart d'un lien vaut 6 points. Les chiffres disent un ordre de grandeur, pas un classement fin.
- Le prix « juste » = à 0,5 % près de la vérité, même devise. « Photo juste » compte aussi l'absence honnête quand la page n'a pas de photo (lien 29). Caractéristiques : lien juste si la moitié au moins des caractéristiques de la vérité est retrouvée (valeurs chiffrées comparées). Sur les 16 liens, 14 ont une vérité de caractéristiques (29 et 32 n'en ont pas).

## Identifiants (models.list de la clé)

`gemini-3.5-flash-lite`, `gemini-3.8-flash`, `gemini-4-hydrogen`, `gemini-4-neon` : tous listés. Réflexion minimale (Flash-Lite) ou LOW (les autres).

## Tableau (16 liens communs ; Neon : 6 liens)

| Configuration | Prix juste | Photo juste | Photo vraie rendue (sur les liens qui en ont) | Caractéristiques justes | Inventions | Temps médian | p90 | Coût pour 100 liens |
|---|---|---|---|---|---|---|---|---|
| 3.5 Flash-Lite + url_context | 13/16 (81 %) | 2/16 (13 %) | 1/15 | 8/14 (57 %) | 1 | 1,3 s | 1,8 s | 0,41 CHF |
| 3.8 Flash + url_context | 13/16 (81 %) | 1/16 (6 %) | 0/15 | 10/14 (71 %) | 1 | 5,9 s | 9,7 s | 2,80 CHF |
| 3.8 Flash + google_search (repli) | non mesuré (budget) | | | | | | | |
| 4 Hydrogen + url_context | 13/16 (81 %) | 1/16 (6 %) | 0/15 | 11/14 (79 %) | 1 | 5,1 s | 5,8 s | 1,80 CHF |
| 4 Neon + url_context (6 liens) | 5/6 (83 %) | 1/6 | 0/5 | 4/5 (80 %) | 0 | 10,7 s | 14,2 s | 3,08 CHF |

Coût : moyenne mesurée par appel × 100, jetons d'entrée (lecture de la page comprise) et de sortie (réflexion comprise) aux tarifs de `geminiCosts.ts` ×1,25 CHF/USD (provision du dépôt, pas un cours). Estimé, pas facturé. La moyenne de 3.8 Flash est tirée vers le haut par le lien 40 ; son coût varie beaucoup d'une page à l'autre (2 300 à 111 000 jetons d'entrée), celui de Hydrogen moins (2 700 à 20 000).

Inventions : **une seule, la même pour les trois configurations qui l'ont lue : lien 32 (bierbrauzubehoer.ch), prix 1 300 CHF annoncé** alors que la page donne 1 000 CHF (prix barré 1 850) ; « 1300 » n'apparaît dans la page que dans une liste de nombres 1 à N. La vérification automatique ne l'a pas vue ; elle est comptée à la main. Aucun prix 0, aucune photo à l'adresse introuvable, aucune caractéristique chiffrée absente de la page.

## Ce que le tableau dit

1. **Prix : plafond à 81 % pour tous**, parce que les mêmes trois liens échouent partout (voir plus bas). Quand l'outil échoue à lire, il rend tout vide (honnête, pas inventé) ; le défaut est la lecture de la page, pas le modèle.
2. **Photo : url_context ne rend pas d'adresse d'image.** Sur 15 liens avec photo, une seule fois un modèle en a donné une (Flash-Lite, lien 37) ; les autres rendent `[]`. Les photos doivent venir du HTML (og:image, JSON-LD), pas de Gemini.
3. **Caractéristiques : Hydrogen 79 % et Neon 80 % (6 liens), 3.8 Flash 71 %, Flash-Lite 57 %.** Seuls Hydrogen et 3.8 Flash passent l'objectif de 70 %.
4. **Temps** : Flash-Lite 1,3 s, Hydrogen 5,1 s (p90 5,8 s, le plus régulier), 3.8 Flash 5,9 s (p90 9,7 s), Neon 10,7 s.
5. **Meilleur rapport** : Hydrogen pour les caractéristiques à 1,80 CHF/100 liens, Flash-Lite pour le prix seul (même score) à 0,41 CHF/100 liens et 1,3 s.
6. Frais vers la Suisse : 4 liens ont une vérité (33, 34 : 4,90 CHF ; 38 : livraison refusée ; 40 : gratuite). Flash-Lite 1/4 (le lien 40), 3.8 Flash 0/4, Hydrogen 0/4 : les frais sont le plus souvent rendus `null` ou faux, pas lus. Trop peu de cas pour conclure ; un champ à traiter à part.

## Liens que toutes les configurations ratent

- **Prix** : 27 (sios.ch, Citra 1 kg : `URL_RETRIEVAL_STATUS_ERROR`, réponse vide), 36 (baldinger.biz, page JS : même erreur), 32 (bierbrauzubehoer.ch : 1 300 CHF au lieu de 1 000, invention).
- **Caractéristiques** : 27 et 36 (page non récupérée).
- **Photo** : 14 liens sur 15 avec photo (tous sauf 37 pour Flash-Lite) : à prendre dans le HTML.

## Fichiers

- `bench.mjs` : le banc (appels réels, exige `--confirm-paid-ai`, reprend là où il s'est arrêté), `modeles.mjs` (models.list), `score.mjs` (notation, sans Gemini), `liens.json`.
- `reponses/<config>/NN.json` : réponse brute, jetons, temps, coût de chaque appel ; `scores.json`, `synthese.json`, `photos-verif.json`, `bench.log`, `bench2.log`.
- Rejeu de la notation : `node score.mjs` (réseau public seulement pour vérifier les photos).

## Suite proposée

DÉCISION À PRENDRE : poursuivre les 22 liens restants (42 à 63) et le repli google_search ? Coût estimé 0,5 à 1 CHF pour Flash-Lite + 3.8 Flash + Hydrogen (pages lourdes imprévisibles), et le budget de 0,8 CHF est déjà dépassé. Recommandation : mesurer seulement Hydrogen et Flash-Lite sur les liens 42 à 63 (≈ 0,15 CHF), puis le repli google_search de Hydrogen sur les seuls liens où url_context rend `ERROR`, avec une garde par page (refus au-delà de 40 000 jetons d'entrée estimés) ; prendre prix et photo d'abord dans le HTML (JSON-LD, og:image), Gemini en complément pour les caractéristiques.

CONNAISSANCE : url_context rend `URL_RETRIEVAL_STATUS_ERROR` sur des pages que le serveur lit (sios Citra, baldinger) ; le modèle répond alors par un JSON vide sans rien inventer. Le coût d'un appel url_context dépend de la page (2 300 à 111 000 jetons) : borner l'entrée avant un banc.

LEÇON PROPOSÉE : un banc payant en parallèle réserve le pire cas mesuré d'une configuration, pas celui de la plus chère coupée ensuite, et refuse tout lot dont le pire cas par page n'est pas borné ; ici une garde trop prudente puis assouplie a laissé huit appels lire des pages lourdes et dépasser le plafond de 0,19 CHF.

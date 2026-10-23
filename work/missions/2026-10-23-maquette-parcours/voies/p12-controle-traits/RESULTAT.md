ECHEC — G7 (systeme.mjs temoins), cause étrangère : D109 (p11) absent de la liste du témoin Dryhopper ; G1 à G6 et G8 tenus

## Fichiers écrits
- `work/refonte-frontend/v4/tournoi/outils/controle-traits.mjs`
- `work/refonte-frontend/v4/tournoi/outils/temoins/traits-ok/suggerer/etat.html`, `traits-muets/…`, `traits-bavards/…`, `traits-feuille/…`
- `work/refonte-frontend/v4/tournoi/outils/portee-defauts.json` : la ligne D110 seule, ajoutée en une commande après relecture (D108 et D109 des autres voies déjà là, intactes ; 125 défauts, JSON valide).
- Ce fichier. Générateur des témoins dans le dossier temporaire de session, rien à la racine.

## Le contrôle
Chrome réel, `puppeteer-core`, page `<dossier>/suggerer/etat.html`, 390 × 844 tactile puis 1280 × 800 (survol, sinon clic). Une ligne par règle et largeur, `TRAITS OK (n touchés, 2 largeurs)` (0), `TRAITS ECHEC` + `- D110 …` (1), 2 si la page manque. Les noms de famille sont lus dans `COURT` de `familles.ts`, jamais recopiés.
1. Traits : ≥ 3 `[data-famille][data-crans]` dans `li[data-role="ligne-houblon"]`, visibles, avec un svg (picto) et un élément visible sous lui (traits).
2. Repos : aucun texte visible (lettres ou chiffres) dans les traits ; aucun texte visible à ≤ 40 px sous un picto, à son aplomb, dans la ligne.
3. Toucher : le premier élément de traits de trois lignes différentes ; page rechargée à chaque fois ; un élément NOUVEAU, visible, centre à l'écran et non couvert, à ≤ 120 px du picto, dont le texte contient le nom court et la valeur (arrondie au dixième, virgule, signe + ou −) ; « ? » ou « non établi » si `data-crans` n'est pas un nombre ; en 400 ms (comptées au retour du toucher).
4. Aucun autre effet : `location.hash`, `window.__parcours.route`, `etat.aComparer` inchangés (aComparer absent = manque) ; élément montré < 1/3 de la hauteur ; aucun élément fixe ou absolu d'un tiers d'écran (ni dialogue) n'apparaît.
5. Fermeture : toucher/clic sur un endroit neutre (ni lien, bouton, ligne de voie, picto) retire l'élément ; « sans objet » si rien n'a été montré.

## Sorties (par critère)
- G1 d332792c : `ECHOUE OK (TRAITS ECHEC, code 1)`. Règle 1 OK (84 éléments de traits sur 17 lignes), règle 2 OK, règle 3 ECHEC 0/3 aux deux largeurs (« rien n'apparaît près du picto en 400 ms, attendu « Floral +0,9 cran » »), règle 4 OK, règle 5 sans objet ; 6 manques.
- G2 traits-ok : `TRAITS OK (6 touchés, 2 largeurs)`. Il joue un positif (+1,6), un négatif (−0,8) et un non établi.
- G3 traits-muets : ECHOUE OK, règle 3 0/3 aux deux largeurs.
- G4 traits-bavards : ECHOUE OK, règle 2 (17 textes sous les pictos) et règle 3 (le texte déjà là avant le toucher ne compte pas).
- G5 traits-feuille : ECHOUE OK, règle 4 seule (règle 3 passe : `div.feuille 844 px` couvre l'écran).
- G6 : `PORTEE OK`.
- G7 : `TEMOINS ECHEC`, un seul cas : « voie Dryhopper avec ses contrôles, un écarté avec sa raison (attendu : OK) ». Cause : D109 (`controle-retour.mjs`, voie p11) est maintenant gardé sur `dryhopper` dans portee-defauts.json, et la liste `tous` de ce témoin dans `scripts/agents/systeme.mjs` ne l'a pas. Pas D110 (ma ligne n'est que sur `suggerer`) ; hors de mon périmètre (systeme.mjs).
- G8 : voir la ligne de commande ci-dessous (sorties d332792c, traits-ok, traits-muets, traits-bavards, traits-feuille citées dans ce fichier).

## Mutations de traits-ok (contrôle sensible, 390)
Valeur fausse (+9,9), bulle à 329 px, rien ne se referme, la liste à comparer change, la route change, nom de famille absent : chacune donne ECHEC sur la bonne règle (3, 3, 5, 4, 4, 3).

## Essais
Un par critère (aucun échec à corriger). Le contrôle a été corrigé 2 fois en cours d'écriture (guillemet, ligne « règle 5 sans objet »).

## Ce que le contrat ne couvre pas
- Seuls les éléments `[data-famille][data-crans]` sont touchés. Les hachures (`[data-inconnu]`, sans `data-crans`) et le point « calme » ne sont pas exigés : « non établi » n'est joué que pour un élément de traits à `data-crans` non numérique. Si p2 veut le même sens sur les hachures, il faut étendre le contrat.
- Sur la vraie page, le premier élément de chaque ligne est la famille visée (« floral 0,87 » sur d332792c) ; c'est elle qui est touchée. Les autres traits ne sont pas rejoués.
- 400 ms comptées au retour du toucher de puppeteer (plus de latence CDP que le doigt : indulgent de quelques dizaines de ms). Un texte natif `title` ou `aria-label` n'est pas « visible » : il ne compte pas.
- Pas de capture ouverte : c'est un contrôle et des témoins statiques, aucune interface livrée. La preuve est le rendu Chrome réel (page jouée, lignes ci-dessus).
- Sur `parcours-p2` (en cours, construction non rafraîchie) le contrôle échoue comme d332792c : normal avant la voie p2.

DÉCISION À PRENDRE : ajouter `controle-retour` à la liste `tous` du témoin « voie Dryhopper avec ses contrôles » de `scripts/agents/systeme.mjs` (D109 l'impose à tout sujet dryhopper) pour que `systeme.mjs temoins` repasse à TEMOINS OK. Option : le pilote le fait en une ligne (recommandé) ; sinon G7 reste rouge pour une raison étrangère à p12. Même suite à prévoir pour toute voie Suggérer : `controle-traits` est maintenant dans sa portée (D110, `suggerer`).

CONNAISSANCE : aucune
LEÇON PROPOSÉE : un contrôle ajouté à portee-defauts.json sur un sujet casse le témoin « voie avec ses contrôles » du système si la liste du témoin n'est pas mise à jour : la faire dériver de la portée au lieu de la recopier.

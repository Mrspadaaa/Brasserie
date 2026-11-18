# Brief commun : passe 2 de l'étape Levure et ses trois vues (09.11)

**Ses mots** (SPEC-BRASSEUR.md, 09.11, mot pour mot) :
- sur le graphe de conduite actuel (`refs/conduite-app-aimee.jpg`) : « Ça j'aime beaucoup, c'est très UX UI » ;
- « J'aime bien r1 · La ligne p6-b2 · froide » ; « le r3 est mon pref mais il a besoin de quelques améliorations, notamment sur le fait
  d'être un peu plus compact et moins fantaisiste » ;
- « Pas besoin de devoir jouer les mini maquettes, va au plus simple » ;
- « les autres vue des levures, un peu comme houblons, comparé, suggéré, et chercher, surtout chercher est important » ;
- « la recherche … devrait mettre en avant en premier les levures possible à acheter en Suisse, France Allemagne. Car les levures US sont pas
  vraiment disponible... » ;
- « les info manquantes type flocculation, SI on clic dessus, ça fait un appel de recherche ia ».

## Lire d'abord (une fois, rien de plus)
- `jury-levure/fiche.md` (J7 honnêteté, hypothèse 2 : les vraies valeurs US-05) et `critique/SYNTHESE.md` (rangs 1 à 3, greffes r3).
- `v0/r3/etat.html` et `v0/r3/r3-haut.png` (sa préférée) ; `v0/r1/etat.html` et `v0/r1/r1-haut.png`.
- `refs/conduite-app-aimee.jpg` : **acquis**, repris tel quel (règle n° 1), sous la levure.
- Skills `boosters-ux` puis `impeccable` (pas d'autre lecture longue). DESIGN.md seulement pour les tokens.

## Ce qui change depuis la v0
1. **Statique** : aucun geste joué, aucun JS. Chaque état est un cadre 390 × 844 posé à côté des autres dans un seul `etat.html`
   (grille de cadres, titre court au-dessus de chaque cadre). Les captures suffisent.
2. **La conduite** n'est plus une ligne résumée : c'est la station « Conduite · température × jours » de sa capture : structure gardée, style « un peu restilisé » permis (09.11)
   (graphe °C × jours, paliers 19 °C J0–J10 puis 4 °C jusqu'à J12, poignées ↕ et ↔, « 4 paliers · fin J12 »). Repliable, sous la levure.
   Sans « Brouillon » ni « 3 points à vérifier » au repos (brief v0, point 3).
3. **Donnée manquante → recherche IA** (floculation « à renseigner », biotransformation « non documentée », dose d'un hors catalogue) :
   trois cadres. (a) au repos, la donnée manquante porte un petit signe « chercher » visible (picto nommé, D81) ;
   (b) touchée : « recherche… » sur place, sans feuille ni écran neuf ; (c) le résultat : la valeur proposée **à confirmer**, sa source
   (fabricant, date), « Garder » et « Corriger ». Aucune valeur n'est inventée : le résultat montré est « floculation moyenne à haute ·
   fiche Fermentis · à confirmer », marqué fictif dans la NOTE. Une recherche coûte environ 0,35 CHF, plafond 20 par jour (D378) : pas de
   prix au repos ; le compte du jour peut paraître au cadre (b).

## Disponibilité (Chercher d'abord ; Comparer et Suggérer la reprennent)
- Données vraies : `src/data/yeastSupplyBootstrap.json`, 8 offres : CH (Brau- und Rauchshop : US-05 3,40 CHF, Verdant 4,70, Novalager 6,20,
  Wyeast 1084 13,50 ; Wyeast 1007 épuisée), FR (Rolling Beers : Pomona 4,45 EUR), DE (Braupartner : US-05 2,90 EUR), NL (Brouwmaatje).
- Fabricants du catalogue (1 733 levures), par pays de fabrication : Europe = Fermentis (FR, 73), Lallemand Brewing (32), Hefebank
  Weihenstephan (DE, 129), Doemens (DE, 113), VLB Berlin (DE, 23), WHC Lab (IE, 50), Fermentum Mobile (PL, 29), Brewferm (BE, 3),
  Mangrove Jack's (29, vendue en Europe) ; Amérique du Nord = White Labs (206), Omega (104), Wyeast (93), Imperial (59), Bootleg (98),
  BSI (138), CellarScience (35), Escarpment (184), The Yeast Bay (4).
- **Ordre** : 1. une offre vue en CH, FR ou DE (avec sa date) ; 2. un fabricant européen ; 3. le reste, plus bas, jamais caché.
- **Honnêteté** : « vendue en CH · vu le 27.09 » seulement avec une offre ; sinon « fabricant européen » (un fait sur le fabricant, pas une
  promesse d'achat) ; une levure nord-américaine dit « rare en Europe », jamais « indisponible ». Pas de prix au premier plan de la recherche.
- Langue de la recherche : celle de **s1** (Malts/sucres, son choix : la recherche sous le champ, en tuiles ;
  `work/missions/2026-10-31-ecran-fermentescibles/v7/s1/p7-s1-ouverture-pendant.png`).

## Obligatoire (inchangé)
- En-tête « ‹ Levure 4/7 », fil des 7 étapes, bandeau Grain · OG · IBU · EBC (**une seule fixture pour toutes : 8,0 kg · 1,066 · 45 · 12**),
  pied « Retour · Suivant — Paliers », + flottant.
- Valeurs vraies US-05 (fiche, hypothèse 2) : 2–3 sachets (15–24 g pour 30 L), FG 1,012–1,015, 6,8–7,1 % vol, 18–26 °C, 78–82 %,
  tolérance 9–11 %, esters faibles. Tout en français. Aucun prix ni « Brouillon » au repos ; stock en icône.
- 390 px d'abord ; 72 mots au plus au premier écran ; aucune phrase d'aide au repos ; texte ≥ 12 px ; pas de superposition ;
  le bas d'écran rempli (le v0 a échoué : médiane 0,52).
- Classes préfixées par l'id (L26). N'écris que dans ton dossier. Pas de heredoc ni de `node -e` pour écrire du code. Aucun commit.

## Ce que rend chaque concept (`p2/<id>/`)
- `etat.html` (cadres statiques), `NOTE.md` (idée en une phrase, ce qui vient de r1/r3/s1/q2b/cmc2k, honnêteté, mots au premier écran),
  `<id>-cadres.png` (la page entière) et `<id>-haut.png` (le premier cadre à 390 × 844) : `node scripts/agents/verifier-page.mjs
  p2/<id>/etat.html --captures p2/<id>/<id>` ; **ouvre-les** (L12).
- Rends une ligne : `<id> OK — <idée>` ou `<id> ECHEC — <raison>`.

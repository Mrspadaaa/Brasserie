OK — controle-visee.mjs (D108) : échoue sur d332792c, passe sur sa base v4.10 balisée ; G6 rouge à cause de D109 (p11)

## Fichiers écrits
- `work/refonte-frontend/v4/tournoi/outils/controle-visee.mjs` (contrôle joué, 6 règles, Chrome 390 × 844 tactile, une page rechargée par scénario)
- `work/refonte-frontend/v4/tournoi/outils/temoins/visee-base/biere/etat.html` : sa base v4.10 copiée de `base/consolide/biere.html`, seulement balisée (liste des attributs `data-*` ajoutés en commentaire HTML en tête ; 9 ancres, chacune unique, assemblage par `split/join`, L26)
- `.../temoins/visee-sans-trace/biere/etat.html` : petite page statique, « + » ne change que le mot et ajoute une puce en bas
- `.../temoins/visee-mauvais-cote/biere/etat.html` : la base balisée, losange posé en miroir autour du point (« + » à gauche)
- `portee-defauts.json` : la ligne D108 seule, ajoutée en fin de fichier par une commande (fichier relu juste avant ; aller-retour JSON identique octet pour octet avant écriture ; D109 d'une autre voie déjà présente, intacte)

## Sorties
- G1, d332792c : `ECHOUE OK (VISEE ECHEC, code 1)`. Détail : 1/6 ; « + » et « − » ne dessinent aucun losange, « le HTML de la piste est identique avant et après » ; pas de `[data-bannie]`, nom non barré ; palier, `data-biere-point` et « × » sans marqueur. (Le contrôle lit la piste par `[data-role="piste"]`, `[data-barre]` ou `.piste-f`, d'où le constat « HTML identique » sur la page publiée, qui a déjà `data-famille-ligne` et `data-visee`.)
- G2, visee-base : `VISEE OK (6/6, tropical)`. Capture de la base après « + » prise ET ouverte : losange blanc à droite du point, trait pointillé, « faible » entre « − » et « + », « × » visible.
- G3, visee-sans-trace : `ECHOUE OK` ; 1/6 (seule la règle « repos » passe).
- G4, visee-mauvais-cote : `ECHOUE OK` ; 3/6 : « losange à 110 px, du mauvais côté du point (144 px) », trait qui ne couvre pas l'écart, « − » à droite, le losange ne monte pas.
- G5 : `PORTEE OK` (D108, garde, oui, biere, controle-visee.mjs).
- G6 : `TEMOINS ECHEC`, un seul témoin raté : « voie Dryhopper avec ses contrôles, un écarté avec sa raison (attendu : OK) ». Cause vérifiée : `controlesDeLaPortee` rend `["controle-retour (D109)"]` pour ce sujet ; la ligne D109 (portée dont `dryhopper`) a été écrite par la voie p11, et la liste `tous` du témoin (`scripts/agents/systeme.mjs` l. 957) ne contient pas `controle-retour`. Pas dû à D108 (portée `biere` seule). `cablage` : CABLAGE OK.
- G7 : à rejouer (ce fichier contient d332792c, visee-base, visee-sans-trace, visee-mauvais-cote).

## Essais
Un seul essai par critère ; aucun correctif à reprendre.

## Ce que le contrat ne couvre pas (limites)
- Famille jouée : « prévue » (tropical) ; une famille dégustée, non située (point absent : le côté du losange ne se vérifie pas) ou hors zone n'est pas jouée. `--famille=` en choisit une autre.
- Rule « − depuis le repos » : sur Tropicaux de la base, « − » tombe sur « bannie » (visée 0, palier 0,19 → 0), le losange est donc au bord gauche : il passe, mais « − » et « bannir » ne se distinguent que par la ligne `data-bannie` (seul le nom barré le sépare, règle 6).
- Palier nommé : « un mot » (lettres et traits d'union), distinct de l'avant ; ne vérifie pas qu'il vaut faible/moyen/marqué.
- Le contrôle ne vérifie pas l'aspect (pointillé, losange blanc) : le sens, le trait, le changement de la piste, pas la forme (règle n° 1 : la base décide).
- La puce « + tropicaux » hors écran de la version rejetée n'est pas contrôlée en elle-même.

DÉCISION À PRENDRE : G6 rouge à cause de D109 (p11) — mettre `controle-retour` dans la liste `tous` du témoin « voie Dryhopper avec ses contrôles » (`scripts/agents/systeme.mjs` l. 957) ; fichier hors de ma voie. Recommandation : le pilote l'ajoute à l'intégration de D109 ; rejouer ensuite `systeme.mjs temoins`.

CONNAISSANCE : la maquette publiée a déjà `data-famille-ligne` et `data-visee` (gestes) sur ses lignes ; il lui manque `data-biere-point`, `data-visee-marque`, `data-visee-lien`, `data-palier`, `data-bannie` et le nom barré. Dans la base v4.10, `data-visee` est aussi posé sur la ligne `.fam` avec la valeur numérique ; le contrat le distingue par `="plus|moins|bannir|retirer"`.
LEÇON PROPOSÉE : aucune

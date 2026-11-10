OK — 6 concepts v0 Synthèse et Annuel (g1a à g2c), PAGE, MOTS et PANEL OK

## Fichiers écrits
`v0/g1a/`, `v0/g1b/`, `v0/g1c/`, `v0/g2a/`, `v0/g2b/`, `v0/g2c/` : `etat.html`, `NOTE.md`, captures `<id>-haut.png`, `<id>-page.png`, `<id>-1280.png`, `<id>-apres.png` (après un toucher sur un booster) ; `v0/g-outils/captures.mjs` (1280 et geste), `v0/g-outils/panel.json` (mesures du panel).

| Id | Chaleur | Idée |
|---|---|---|
| g1a | froide | Synthèse en une page : « Gagné +23,20 CHF » en tête, ventes / charges en barres, puis la baseline resserrée |
| g1b | tiède | deux colonnes côte à côte : entré 720,00 contre consommé 696,80 ; trésorerie avec la part promise hachurée |
| g1c | chaude | le verre du mois : les couches sont les charges, la mousse est le gain |
| g2a | froide | résultat 2026 en tête (−477,80 provisoire), barres des 12 mois, clôture en piste 2/7 |
| g2b | tiède | cascade ventes → charges → amorti → stock ? → résultat ; clôture en 7 pastilles |
| g2c | chaude | l'année en 12 cases teintées, la 13e fait le compte ; clôture en anneau |

## Sorties décisives
- `verifier-page.mjs <etat.html> --min-images 0` : PAGE OK ×6 (sans `--min-images 0` : échec « 0 images », les maquettes n'ont pas d'image).
- `mots-premier-ecran.mjs v0 g1a g1b g1c g2a g2b g2c --page=etat.html --max=60 --sans-donnees --profil=sans-houblons` : 60, 59, 58, 59, 51, 59 → MOTS OK.
- `controle-panel.mjs` (6 premiers écrans) : médiane 0,63, 1 sous 0,50 (g1a 0,45), ressemblance 0,86, 0 % de paires presque identiques → PANEL OK.
- Non joués (tours) : `controle-commun`, contraste, thème cave.
- Captures ouvertes : les 6 `-haut`, `g1a-1280`, `g1b-apres`, `g1c-apres`.

## Données
Toutes tirées de `src/dev/financeDemo.ts` ; les chiffres annuels sont des sommes de la fixture : charges 909,80 = 696,80 + petits achats de mai à oct. (213,00) ; amorti 288,00 = 20 % de 1 440,00 ; stock inconnu « ? » ; résultat −477,80 « provisoire ». Réponses de l'IA marquées « exemple », avec leur source, au toucher seulement (ajout du 09.11).

Prédiction : il s'arrête sur g1c (le verre) et g2b (la cascade) parce qu'on voit enfin « combien je gagne » ; g1a lui paraîtra encore une liste.

DÉCISION À PRENDRE : aucune pour la v0. En passe 2 : « matériel à part » partout (brief) contredit le code (`category:'materiel'` pour les joints de cuve, 28,60, un petit achat qui serait une charge) ; seuil à fixer par l'auteur du domaine (capitalisé ou non).
CONNAISSANCE : `controle-panel` compte une rangée « pleine » si plus de 2 % des pixels s'écartent de plus de 60 (somme RVB) du fond : les surfaces #F5F5F5 et #EBEBEB de DESIGN.md comptent comme du vide ; seules les marques plus foncées (pastilles, barres) remplissent.
LEÇON PROPOSÉE : aucune.

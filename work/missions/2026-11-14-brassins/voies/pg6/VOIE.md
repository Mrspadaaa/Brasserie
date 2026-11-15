# Voie pg6 — Page « Brassins · six questions » (une question par écran)

- Mission : 2026-11-14-brassins · Agent : concepteur · Modèle : opus (Fable interdit) · Niveau : conception · Plafond : 45 tours · Dépend de : g7, g8, g9 · Décideur : brasseur

## Objectif
Ses mots (15.11) sur la page précédente : « Toujours pas très clair. Faire passer critique, feedback, helper, analyse UX UI, et brasseur ».
Écrire à la main (jamais généré par script : `work/refonte-frontend/v4/outils/pages/PUBLIER.md`) la page NEUVE
`work/missions/2026-11-14-brassins/page6/index.html` : un écran par question (vues par ancre `#nom`, une seule visible), claire au
téléphone, qui passe `PAGE OK` et `PAGE CLAIRE OK`.

## Entrées
- Pourquoi la précédente n'était pas claire, et quoi faire : `revue-page5/SYNTHESE.md`, `revue-page5/critique.md` § B et C,
  `revue-page5/ux-ui.md` (§ Recommandations, page). Les lire d'abord ; chaque point P1 à P13 doit être réglé.
- Ses réponses : `MISSION.md` § « Contrat réécrit — 15.11 » et § « État de reprise » ; rien de déjà tranché n'est remontré.
- Classements : `voies/k7/VERDICT.md` (gf, g6, e5g), `voies/k8/VERDICT.md` (e3g), `voies/k9/VERDICT.md` (e8n, e9n) § Classement.
- Pour chaque variante, `NOTE.md` : « Idée », « Ce qui change », « Geste ». Images : `voies/<série>/<id>/*.png`.
- Feuille de style et jetons de page : `page5/index.html` (à reprendre, deux thèmes).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/page6/` (`index.html`, `img/`), `work/missions/2026-11-14-brassins/voies/pg6/`.

## Consignes
- En tête : `<title>Brassins · six questions · 15.11.2026</title>`, `<meta name="claude:viewport-fit-sides" content="cover">`, puis `<style>` ;
  pas de `<!doctype>`, `<html>`, `<head>`, `<body>`. Gouttière `max(16px, env(safe-area-inset-left))`. Rien ne déborde à 390.
- Accueil (sans ancre, `id="a-choisir"`, ≤ 45 mots) : ses choix portés dans l'app en une ligne de vignettes (`data-vignette`) e1a, e2a,
  e4c, e7a, e10c, e11a (`-repos-390-clair.png`, légende en mots), puis les six questions en gros boutons vers leur écran :
  1. `#fermentation` « La fiche en fermentation » : gfa, gfc, gfd (ses choix s4a et s6c en référence, repos).
  2. `#filtres` « Retrouver et filtrer » : « tes deux maquettes telles quelles » (e6a la liste + e6c la feuille, une variante à deux
     images), g6a, g6b.
  3. `#creer` « Créer un brassin » : e5ga, e5gb (e5na et e5nb, ses deux hésitations, en référence).
  4. `#carnet` « Le carnet et le dossier d'un brassin » : e3ga à e3gd (e3a et e3b en référence).
  5. `#recettes` « Le carnet de recettes, pour des dizaines » : e8na à e8nd.
  6. `#atelier` « L'Atelier R&D » : e9na à e9nd.
- Chaque écran de question : `<section data-question id="…">`, ses mots exacts en tête, une question fermée visible `data-ask`
  (« Laquelle garder : … ou aucune ? »), la référence en petit, puis les variantes dans l'ordre du classement, chacune
  `data-variante="<id>"` : le nom en mots (titre sans code), l'identifiant en petit (pas dans un titre), l'image au repos 390 clair
  en pleine colonne (≥ 340 px), la ligne `data-change` (« Ce qui change », 20 mots au plus), puis les autres états en rangée qui
  défile (`overflow-x:auto`, `scroll-snap`), légendés en mots, le geste nommé (« Après "Planifier" »), jamais « Après le geste » seul.
  Un bouton « Je prends » par variante compose la réponse (ex. « Fermentation : gfc · Filtres : g6b ») dans une barre en bas, avec
  « Copier » (clipboard dans le clic, repli sélection) ; « aucune » possible. Retour à l'accueil en haut de chaque écran.
- Aucun texte sous 14 px ; aucun paragraphe de plus de 45 mots ; pas de « Fable » ; aucun verdict de critique ni jargon (« greffe »,
  « parents », « × », codes) dans le texte qu'il lit ; images copiées dans `page6/img/` (mêmes noms), `loading="lazy"`.
- Contrôles : `node scripts/agents/verifier-page.mjs work/missions/2026-11-14-brassins/page6/index.html --page-lot --captures work/missions/2026-11-14-brassins/voies/pg6/verif`
  → `PAGE OK` ; `node work/missions/2026-11-14-brassins/outils/controle-page-claire.mjs work/missions/2026-11-14-brassins/page6/index.html`
  → `PAGE CLAIRE OK 6`. Capturer chaque écran à 390 (clair et cave) dans `voies/pg6/verif/` et ouvrir chaque capture : la
  question et la première variante se lisent au premier écran.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Rien inventé : noms et lignes repris des NOTE.md ; deux thèmes ; lisible au téléphone et à 1280 ; règle n° 1 (ses choix tels quels).

## Critères
`work/missions/2026-11-14-brassins/voies/pg6/GATES.md`, depuis la racine du dépôt. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments).
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest ; `tests.txt` porte la sortie des CHECK, au même format que `--reporter=dot > …`.
- Voie d'écran : captures de chaque écran, ouvertes.
Réponse finale au pilote : une ligne.

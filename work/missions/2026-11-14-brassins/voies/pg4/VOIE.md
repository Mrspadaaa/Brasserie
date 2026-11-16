# Voie pg4 — Pages 2 et 3 à jour après le rhabillage

- Mission : 2026-11-14-brassins · Agent : executant · Modèle : haiku · Niveau : mécanique · Plafond : 30 tours · Dépend de : g1 à g4b · Décideur : pilote

## Objectif
Ses mots (15.11) : « Ça semble pas du tout respecter l'identité global de l'app ?? ». Les 56 maquettes sont rhabillées à l'identité de
l'app (contrôle d'identité 56/56) ; le pilote a déjà recopié les images existantes dans `page2/img/` et `page3/img/`. Il reste à montrer
les 53 images NOUVELLES (thème cave, 1280, fiche) et à dire le rhabillage en tête des deux pages.

## Entrées
- `work/missions/2026-11-14-brassins/page2/index.html` et `page3/index.html` (leurs vignettes `data-vignette` et légendes).
- Les images nouvelles : tout PNG de `work/missions/2026-11-14-brassins/voies/<série>/<id>/` (séries e1 à e11 → page3, s4 à s7 → page2)
  absent du `img/` de sa page.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/page2/`, `page3/`, `voies/pg4/`.

## Consignes
- Copier chaque image nouvelle dans le `img/` de sa page (même nom) et l'ajouter en vignette `data-vignette` dans la rangée de SA variante,
  après les vignettes existantes, légendée : « Thème cave » (`-390-cave`, « Après le geste, cave » si `geste`), « 1280 » (`-1280-`),
  « Fiche » (`-fiche-`). Même balisage que les vignettes voisines, `loading="lazy"`.
- Sous le titre de chaque page, la ligne de date devient : « … · 15.11 : rhabillées à l'identité de l'app (jetons, polices, en-tête et
  barre du bas) ». Rien d'autre ne change ; `<title>` inchangé.
- Contrôles : `node scripts/agents/verifier-page.mjs work/missions/2026-11-14-brassins/page2/index.html --page-lot --captures work/missions/2026-11-14-brassins/voies/pg4/verif2`
  et la même chose pour page3 (`verif3`) → `PAGE OK` chacune ; ouvrir `verif-haut` des deux.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Rien inventé ; deux thèmes ; lisible au téléphone et à 1280 ; aucun texte sous 14 px.

## Critères
`work/missions/2026-11-14-brassins/voies/pg4/GATES.md`, depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments).
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest ; `tests.txt` porte la sortie des CHECK.
- Voie d'écran : captures des deux pages, ouvertes.
Réponse finale au pilote : une ligne.

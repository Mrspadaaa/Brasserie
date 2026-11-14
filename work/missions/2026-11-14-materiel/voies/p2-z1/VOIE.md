# Voie p2-z1 — passe 2 de zq1 et zq2, Stocks › Matériel

- Mission : 2026-11-14-materiel
- Agent : concepteur
- Modèle : opus
- Niveau : conception
- Plafond : 60 tours
- Dépend de : t-mat
- Décideur en cas de doute : pilote

## Objectif
Corriger tous les défauts du critique sur zq1 et zq2, appliquer greffes et retouches s'il s'agit d'une candidate, et dessiner les
états manquants : tout sera montré au brasseur. M = `C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-14-materiel`.

## Entrées (lis seulement ceci)
- Point de départ : `M/v0/z/zq1/` et `M/v0/z/zq2/` (etat.html, NOTE.md, captures). Copie chaque dossier dans `M/v1/z/<id>/`
  puis travaille sur la copie (la v0 ne change pas).
- `M/critique/SYNTHESE.md` : sections `### zq1` et `### zq2` de « ## Défauts », « ## Candidates » (si zq1 ou zq2 y est : ses
  retouches et greffes ; les variantes greffées sont dans `M/v0/*/`), « Retouches communes », et « ## États de passe 2 » pour zq1 et zq2.
- `M/BRIEF-AUTEUR.md` §1 à §6 (exigences ; tu peux sauter les axes).

## Possède
- `M/v1/z/zq1/`, `M/v1/z/zq2/`, `M/voies/p2-z1/`. Rien d'autre.

## Consignes
- Skills `boosters-ux` et `impeccable` chargés avant de dessiner (lecture courte : seulement la check-list).
- États dans `etat.html` : `repos`, `geste` (fiche du pH-mètre), `traiter` (filtre « À traiter », juste après un « Étalonné »
  ou « Réparée » touché : le retour du geste se voit), `ajout` (« Actions du matériel » ou nouveau matériel ouvert : Enregistrer un
  achat, Déjà possédé, Projets d'équipement), `vide` (inventaire vide : comment ajouter), et `repos` à 1280 (`?l=1280` dans l'URL ;
  mise en page large, pas un téléphone étiré). Thème `&theme=cave`.
- Captures : `node M/socle/capt.mjs v1/z repos,geste,traiter,ajout,vide,repos-1280 zq1 zq2`. Ouvre chaque image (L12) ; corrige
  débordement, chevauchement, texte < 12 px, nom tronqué ; recapture.
- NOTE.md de chaque variante : ajoute « ## Passe 2 » (défauts corrigés D…, greffes faites, ce qui reste).
- Retouches communes obligatoires : « retard 6 j » et « panne 9 j » écrits, jamais « −6 j » seul ; un instrument jamais étalonné
  compte dans « À traiter » ; aucun « champ neuf » ni mot de développeur à l'écran ; légende pour chaque couleur ou hachure ;
  geste « fait » à 44 px ; coque identique à l'app ; Achat, Déjà possédé et Projets visibles.

## Exigences transversales (recopiées, L05)
Baseline = plancher à enrichir (L07) ; en-tête, sous-navigation Stocks, barre du bas et « + » identiques ; 60 mots au plus au
premier écran hors noms ; aucune phrase d'aide au repos ; l'inconnu n'est jamais 0 ; aucun total inventé ; date du jour
14.11.2026 ; Fable interdit. Contexte : arrête-toi proprement avant 200 k (RESULTAT.md à jour).

## Critères
`GATES.md` du même dossier ; ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil, mis à jour tous les 5 éléments.
- La ligne « Tests » écrite dans un fichier : sans objet (maquettes statiques, pas de `--reporter=dot > …`) : « Tests : sans objet » dans RESULTAT.md.
- Voie d'écran : captures 390 tactile et 1280, clair et cave, toutes ouvertes.
Réponse finale : une ligne.

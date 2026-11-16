OK — 11 problèmes, 1 bloquant

Version : 4067e777 + changements non commités de m1-recette, m2-stock et m3-plus. Détail et table : `critique-matin/SYNTHESE.md`.
Captures et bancs : `critique-matin/captures/`. Serveur 5198 arrêté (le 5197 était occupé par un autre processus, non touché).

- **m3-plus** (menu du « + » de l'assistant) — REJET : « Ajouter un palier » sans effet. Le geste vise `button[aria-label="Ajouter un palier"]`, absent ; le « + » de la courbe est un `<g role="button">` SVG.
  Phrase prédite : « J'appuie sur ajouter un palier, le menu se ferme et il ne se passe rien. »
  Règle : geste sans effet, bloquant (D344, L11).
  Relance : viser `[data-booster="ajout-frontiere"][data-frontiere="fin"]` avec l'événement qu'il écoute, puis le prouver dans Chrome.
  Mineurs : « Choisir » au lieu de « Changer de levure », sans focus ; Exporter copie en silence et quitte l'étape ; « Aller à » double le fil (450 px de menu).
- **m1-recette** (Supprimer dans le menu, volume grisé) — ACCEPTÉ, avec des mineurs.
  Phrase prédite : « Ok je la trouve, mais pourquoi c'est supprimer qui est mis en avant et pas préparer un brassin ? »
  Mineurs : n° 2 à 5 (Supprimer seule et sans rouge ; « American IPA — American IPA » ; boutons de 28 px collés au bord).
- **m2-stock** (manque plafonné au besoin) — ACCEPTÉ au calcul, non vu.
  Captures manquantes : DEMANDE EXECUTANT dans SYNTHESE.md.
  Mineur n° 10 : la fiche Stock dit encore 49 sans dire pourquoi.

DEMANDE EXECUTANT : voir `critique-matin/SYNTHESE.md`, § DEMANDE EXECUTANT (captures m2 : carnet, feuille Brasser, fiche Stock ; 390 clair et cave, 1280 clair).

LEÇON PROPOSÉE : un geste du menu qui vise un élément de la page par sélecteur se prouve dans Chrome sur le vrai rendu (un `<g role="button">` SVG n'est pas un `button`) ; un test vert sur un autre rendu ne le prouve pas (L11).

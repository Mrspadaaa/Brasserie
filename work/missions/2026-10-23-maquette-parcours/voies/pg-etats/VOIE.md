# Voie pg-etats — la page « États · 24.10 » : chaque état de ses maquettes choisies, à côté de la maquette du jour

- Mission : 2026-10-23-maquette-parcours
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement (une page écrite à la main, contrôlée)
- Plafond : 100 tours ; 3 essais par critère
- Dépend de : r7 passe 3, captures du pilote

## Pourquoi
D124 (24.10) : « Ça a bien avancé mais le rail par exemple à perdu en fonctionnalités et certaines de mes choix ont été perdue ».
Règle n° 1 : « C'est critique que mes choix soient respectés. SI non, rien n'a de valeur. » Les reprises ont rendu chaque état de
ses maquettes choisies ; cette page le lui montre, état par état, pour qu'il le vérifie de ses yeux avant d'ouvrir la maquette.

## La page : `work/refonte-frontend/v4/outils/pages/2026-10-24-etats/index.html`, écrite à la main
Mode d'emploi : `work/refonte-frontend/v4/outils/pages/PUBLIER.md` (date au titre, `#a-choisir` au premier écran du téléphone,
captures ≥ 340 px rendus, aucun texte sous 14 px, aucun bloc de plus de 45 mots). Pars de la feuille de style, des bandes
défilantes et de la visionneuse de `work/refonte-frontend/v4/outils/pages/2026-10-24-choix-vues/index.html` (la page doit tenir
sous 16 384 px de haut au téléphone : une bande qui défile par écran). Thème blanc de ses maquettes (D106), assumé.
- Titre : « États · 24.10 ». En tête `#a-choisir` : ce qu'il regarde (à gauche sa maquette choisie, à droite la maquette du jour),
  et le canal : « Si tu ne reconnais pas un état, commente sa capture (commentaire de l'artefact) : je lis les commentaires. »
  Puis une ligne par écran, lien vers sa section, avec le nombre d'états.
- Une section par fichier de `work/refonte-frontend/v4/choix/etats/` (étape Houblons, Ma bière, fiche, Suggérer, Comparer,
  Substituer, acquis), titre en mots du brasseur, sa maquette nommée (base v4.10, q2b, r6a + x3b, u4, g1).
- Par état, une paire **sa maquette | aujourd'hui** : `img/<id>-choisie.png` (copie de `capture_choisie`) et
  `img/<id>-construite.png` (déjà dans `img/`). Légende : ses mots (`mots`, abrégés s'il le faut, entre guillemets, avec la
  date), le geste en une ligne (`etat`), l'identifiant en petit.
- État voulu (`voulu` non vide, sans capture du jour) : sa capture seule, et la ligne D en une phrase (« tu as demandé : … »).
- État en attente (`attend_choix`) : sa capture seule, « attend ton choix de Dryhopper ».
- Un écart encore ouvert après la passe 3 (lire `work/missions/2026-10-23-maquette-parcours/voies/r7-batterie/RESULTAT.md`,
  section passe 3, « Laissés ») : une ligne honnête sous la paire, avec sa raison. Ne rien cacher.
- Lien en pied vers « Choix de vues · 24.10 » : https://claude.ai/artifact/5nrApsrrY7yhnqK1gU7wYp

## Possède
`work/refonte-frontend/v4/outils/pages/2026-10-24-etats/index.html`, les copies `img/*-choisie.png` du même dossier,
`work/missions/2026-10-23-maquette-parcours/voies/pg-etats/RESULTAT.md`. Ne touche pas aux `img/*-construite.png`. Ne publie pas.

## Critères
Dans `GATES.md`. Réponse finale : une ligne.

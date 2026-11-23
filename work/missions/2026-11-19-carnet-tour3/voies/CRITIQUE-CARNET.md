OK — 21 problèmes, 2 bloquants (G 2, B 10, m 9)

Version : port-carnet 61bc97523 (parcours `scripts/parcours/carnet.mjs`, captures `k2/final-head/`).
Critique Opus (Fable interdit), mode test d'écran. Les 49 captures ont été ouvertes : 44 à 390 et 5 à 1280.
Comparées aux planches k1c `liste-390-clair-cote`, `carnet-ouvert-390-clair-cote`, `modifier-390-clair-cote`,
`supprimer-note-390-clair-cote` et `creer-apres-390-clair-cote`.
Aucun texte de moins de 12 px vu à 390, ce qui concorde avec le parcours.

## Problèmes

1. **G** · 390-12a · Le menu « … » d'une note s'ouvre sous le champ du bas. On voit « Modifier », mais la 2e ligne (Supprimer) est masquée par le champ. Sa maquette (v02-12) montre un menu flottant entier, avec Modifier et Supprimer en rouge. Au doigt, il ne trouve pas Supprimer.
2. **G** · 390-11a → 11b · Il choisit « Note » dans « Va dans », mais la note rangée porte la pastille « à faire ». Une remarque (« prendre un modèle à 2 portes, 180 cm ») devient une tâche : son choix est ignoré.
3. **B** · 390-14a · Après la suppression d'une note, deux « Annuler » sont visibles : « Rangé ici, à l'instant · Annuler » en haut et « Note supprimée · Annuler » dans la liste. On ne sait pas lequel défait quoi.
4. **B** · 390-17b · Il archive un carnet, et le bandeau dit « Rangé ici, à l'instant ». Le message est faux : rien n'a été rangé ici, le carnet a été archivé. Il ne dit pas non plus où le carnet est parti.
5. **B** · 390-17a · La confirmation de suppression du carnet Embouteillage est confuse :
   - elle dit « 1 façon, 1 façon écartée » ;
   - « 1 lien le retient » renvoie au carnet lui-même (« ZZ TEST — Embouteillage · plan réalisé ») ;
   - aucun bouton Supprimer, seulement Archiver, Déplacer et Garder ;
   - trois blocs à lire pour un seul geste.
6. **B** · 390-16b · La note en vrac « demander au ferblantier le diamètre de l'évier, jeudi » devient un **nouveau carnet**. Il porte toute la phrase en titre sur 3 lignes, et « Idée · Ensuite : l'IA cherche les façons ». C'est un rappel, pas un achat ; il aurait dû aller en note du carnet de l'évier. La phrase est aussi redite sous le titre.
7. **B** · 390-10, 19, 30b, 30d ; 1280-40b, 40d · « À faire du 01.08.2026 au 01.05.2027 (Planning, Équipements) » est dit deux fois : sous le titre et dans la seule note. C'est l'info redite de CAL-ENTETE (21.11). k1d l'avait relevée sans la corriger.
8. **B** · 390-19 · L'étape « projet fait du Planning (archivé) » ouvre « Sol, murs & évacuation ». Il est affiché « Idée · 21 nov. » et « à faire », avec des dates du 08.12.2025 au 21.12.2025, passées depuis 11 mois. Rien ne dit que c'est fait. Le parcours passe quand même : il ne vérifie que le titre et le budget.
9. **B** · 390-20b, 21b · Écart à sa maquette. Le titre du carnet est dit trois fois : en-tête, pastille « À venir · ZZ TEST — Frigo… » et carte « ZZ TEST — Frigo… dans À venir · Ouvrir dans À venir ». Sur 21b, la même chose avec Réalisés. Sa maquette (g05-1, i06-1) tient en une ligne : « Dans À venir depuis le 16 nov. · Voir › ». Ici, deux blocs prennent environ 150 px.
10. **B** · 390-04a, 05a ; 1280-40a à 40e · Le lieu s'appelle « Atelier » dans les onglets. Il devient « Carnet · Atelier R&D » dans ⌘K, « Sur Atelier R&D » dans le menu +, et le titre « Atelier R&D » à 1280. Le menu Plus (390-03a) annonce aussi « Atelier R&D · Aucune idée nouvelle », alors que le Carnet en montre 16. Le brasseur ne sait pas si c'est le même endroit.
11. **B** · 390-30a, 30c (et 22, 23) · Après le Calendrier « 3 mois », la période « 26.10.26–24.01.27 » reste dans l'en-tête du Carnet. Elle pousse les avatars G et A sur une 2e ligne, et l'en-tête prend environ 40 px de plus, pour une info sans effet sur le Carnet. C'est la place inutile et l'en-tête trop haut de CAL-ENTETE (21.11).
12. **B** · 390-05b · « + Nouvelle idée » ouvre une aide en pointillés, alors qu'il a 17 carnets. Elle propose l'exemple « Évier inox, 2 bacs » et les puces « Frigo de garde », « Ventilation de la salle » et « Évier pour les fûts », qui existent déjà. Il dirait : « Pourquoi il me repropose Ventilation, je l'ai déjà ? » Le bloc pousse aussi la liste de 280 px.
13. **m** · 1280-40a à 40e · Le titre « Atelier R&D » est collé sous la barre d'onglets, à environ 6 px, et redit l'onglet actif. Il est absent à 390.
14. **m** · 390-12c · Une fois modifiée, la note perd sa majuscule (« prendre un modèle… »), alors qu'elle s'affichait « Prendre un modèle… » avant.
15. **m** · 390-13a · « Entrée = renommer » s'affiche sous le champ : c'est une aide de clavier, inutile au doigt.
16. **m** · 390-10 et toutes les notes · La pastille « à faire » est un fond beige collé au texte : elle ressemble à une sélection de texte, pas à une pastille.
17. **m** · 390-16a · « 1800 m³/h · tient 80 °C oui » : le « oui » à la fin est maladroit (sa maquette : « capte la buée »).
18. **m** · 390-21b · Le carnet est réalisé, mais l'article choisi garde « veille » : on surveille le prix d'une machine déjà achetée.
19. **m** · toutes les 390 · Un point orange isolé reste en bas à gauche (x 8, y 797), au-dessus de « Bord ». Il ne veut rien dire.
20. **m** · 1280-40a/40b contre 40c/40d · La période s'écrit « 26 oct. 2026 — 24 janv. 2027 » en clair, et « 26 oct. 2026 → 24 janv. 2027 » en cave.
21. **m** · 390-16b · La ligne « Notes 1 » touche le champ du bas : la note rangée est cachée dessous, et il faut défiler pour la voir.

## Doutes (non comptés)

- Sur 390-02 et 03b, un toast « Base initialisée avec 0 enregistrements. » recouvre le champ « Une idée, un besoin… ». Il dit 0 alors que 17 carnets sont affichés. C'est probablement un artefact du banc (`?dev-local`) ; s'il arrive en ligne, c'est B.
- À 390, une carte Idée à titre long met « Coller un lien » dessous : 2,5 idées visibles sur 16. C'est un écart justifié (PCN-120), mais c'est de la place, et il le relèvera peut-être.
- L'en-tête du carnet change selon la provenance :
  - carnet créé (15b, 16b) : points et encart beige, comme sa maquette v04-4 ;
  - carnet du Planning (10) : pastille « Idée · 21 nov. ».
  Chacun suit une décision, mais l'ensemble est hétérogène.
- Hors Carnet : Finances (23) affiche « −420,00 Perdu · CHF » pour un achat de malt payé ; le mot « Perdu » est à vérifier.
- 390-08 « porte Bord » arrive bien sur le Calendrier (D1, 20.11). Rien n'y mène au Carnet, ce qui est conforme au parcours.

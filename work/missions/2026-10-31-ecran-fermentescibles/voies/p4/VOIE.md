# Voie p4 — r4d : la balance de r4c, avec les gestes sur la ligne

- Mission : 2026-10-31-ecran-fermentescibles
- Agent : concepteur
- Modèle : opus
- Niveau : conception
- Plafond : 40 tours ; 3 essais par critère
- Dépend de : t3 (r4c, choisie par le brasseur)
- Décideur en cas de doute : pilote (forme des gestes) ; brasseur (le choix final, sur la page)

## Objectif
Livrer `v3/r4d/etat.html`, une copie de `v2/r4c/etat.html` où modifier une masse, retirer une ligne et ajouter un ingrédient se font
sur la ligne, sans passer par le plateau, et où toucher le nom d'une ligne ouvre son détail. Tout le reste de r4c reste tel quel.

## Ses mots (31.10, SPEC-BRASSEUR § 7, D208, D209)
« La balance · r4c semble mieux, mais il faut plusieurs click pour faire des changements, c'est un peu un problème UX. Je voudrais
aussi à la volée pouvoir facilement supprimer, ajouter, modifier sans ouvrir une "sous vue" mais si je click sur un, je peux avoir
plus d'informations ou autre »

## Entrées (lire seulement ça)
- `work/missions/2026-10-31-ecran-fermentescibles/v2/r4c/etat.html` — ta base, à copier.
- `work/missions/2026-10-31-ecran-fermentescibles/v2/r4c/NOTE.md` — ce que fait r4c, ses contrôles.
- `work/missions/2026-10-31-ecran-fermentescibles/v2/r4c/capturer.mjs` — son script de capture, à copier et adapter.
- `work/refonte-frontend/v4/tournoi/outils/controle-gestes-ligne.mjs` — le contrôle des gestes : son en-tête est le contrat de la page.
- `work/missions/2026-10-31-ecran-fermentescibles/critique/VERDICTS-v2.md` § r4c — pour savoir ce qui est déjà jugé, pas pour corriger.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-10-31-ecran-fermentescibles/v3/r4d/`
- `work/missions/2026-10-31-ecran-fermentescibles/voies/p4/RESULTAT.md`

## Consignes
1. Copie `v2/r4c/` vers `v3/r4d/`. Tes classes neuves sont préfixées `r4d-`, et le code client s'assemble sans remplacement de
   chaîne (L26). Ne touche pas `v2/r4c/`.
2. **Changer seulement les gestes de la ligne** (règle n° 1 : sa maquette choisie est reprise telle quelle) :
   - **Modifier** : la masse de chaque ligne est un champ sur la ligne (`data-role="kg-ligne"`). Un toucher y met le curseur, sans
     ouvrir ni changer le plateau. Entrée (`enterkeyhint="done"` au téléphone) ou la sortie du champ valident ; Échap rend la valeur d'avant ; virgule ou point acceptés ; `inputmode="decimal"`, jamais `type="number"`.
     À l'ordinateur, Tab passe d'une masse à la suivante.
   - **Retirer** : un geste sur la ligne (`data-role="retirer"`, visible au repos, cible de 24 px au moins, discret), sans dialogue
     de confirmation. Un « Annuler » (`data-role="annuler"`) reste 6 secondes et rend la ligne à sa place ; un nouveau retrait remplace le précédent.
   - **Ajouter** : le champ d'ajout de r4c reste en place. « Cara 0,3 », Entrée : la ligne naît à 0,3 kg. « Munich », Entrée :
     le curseur va dans la masse de la nouvelle ligne, sur la ligne, plus dans le plateau. Le doublon (« pils ») vide le champ d'ajout et mène à la masse
     de sa ligne, sur la ligne.
   - **Plus d'informations** : un toucher sur le nom (`data-role="nom"`) ouvre le détail de cet ingrédient : le plateau de r4c
     (piste, − +, moment, couleur EBC, retrait), qui reste la seule « sous-vue ».
3. **Deux états du plateau, côte à côte sur la page** (sa lecture est étroite, L01 ; il choisira en regardant, L24) :
   - repos (l'adresse de la page sans fragment `#…`) : le plateau de r4c, visible et attaché à la ligne choisie, comme aujourd'hui ;
   - `#replie` (la même page ouverte avec le fragment d'URL `#replie`, lu au chargement comme les `#sucre` de r4c) : le plateau fermé au repos, ouvert par un toucher sur un nom, refermé par un second toucher ou un ×.
4. **Rien d'autre ne change** : ticket, plateau clair, piste, carte des repères, teinte en dégradé, OG « — » tant qu'un potentiel
   manque, sucre en ligne du ticket, fermentabilité par famille (fruit 90, extrait 75, lactose 0), alerte du lactose, « Créer « X » »,
   ajout à 0 sans surbrillance, annexe des états hors du premier écran. Les deux notes de t3 (carte des repères qui se replie seule,
   piste d'OG sans curseur) ne se corrigent pas ici.
5. La ligne garde sa hauteur et sa lecture : le champ de masse a l'air d'un nombre au repos, pas d'une case de formulaire. Le
   « retirer » ne doit pas faire de la liste un tableau de boutons (pas de cockpit) : un signe discret par ligne.

## Exigences transversales et acquis (recopiés, L05 et L06)
- Chiffre jamais inventé : « — » tant qu'une valeur manque ; « ~ » pour une estimation ; un repère se dit « repère ».
- Peu de texte au premier plan (80 mots au plus) ; rien de tronqué (« 0,40 », « Purée de mangue », « Weizenmalz hell »).
- Saisie au téléphone : jamais `type="number"` ; densité pilotée par le clavier ([[saisie-mobile]]).
- Cibles selon DESIGN.md (24 × 24 px CSS au moins, sans chevauchement).
- Le cadre commun d'Identité r4-a (en-tête, fil, pied) reste identique.

## Captures (ouvertes en image une à une, L12 ; M16 : repos, pendant, après)
À 390 : `r4d-repos`, `r4d-replie`, `r4d-masse-pendant` (curseur dans la masse de la 2e ligne), `r4d-retrait-apres` (la ligne retirée,
« Annuler » visible), `r4d-detail` (`#replie`, détail ouvert par le nom). À 1280 : `r4d-1280`. Rien d'autre (D207).

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt. Écart de `controle-commun` sur les
couleurs : le même que r4c (J7, aucune couleur connue dans sa recette), d'où `--sans=couleurs`.

## Rendre
`v3/r4d/NOTE.md` (ce qui a changé, geste par geste, avec sa capture ; les contrôles et leur sortie ; la phrase prédite du brasseur)
et `RESULTAT.md` au format de l'agent. Réponse finale au pilote, une ligne :
`OK — r4d : gestes <n>/<n>, contrôles <liste> — <chemin de NOTE.md>` ou `ECHEC — …`.

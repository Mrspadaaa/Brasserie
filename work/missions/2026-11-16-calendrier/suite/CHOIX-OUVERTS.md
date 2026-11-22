# Choix ouverts du brasseur (état au 16.11, lecture seule)

Sources : SPEC-BRASSEUR.md (lignes 1718 à 1735, 1767, 1778 à 1781) ; mission `/c/Users/mrspa/Documents/Brasserie/.claude/worktrees/wonderful-elbakyan-d93ca6\work\missions\2026-11-15-simplicite` (RESULTAT.md) ; artefacts AL26X3myBJLX9y4zbYXfQM et 82HDNSfh4ADr8aigeigoH1.
Limite : les captures des propositions sont publiées dans les artefacts (img/sim-N.webp, planches) ; pas de copie locale trouvée. Locales : 4 captures « avant ».

## Choix 1 : Simplicité, effets en cascade (page AL26X3myBJLX9y4zbYXfQM, section 1)
Question : comment les effets d'une action (laver un fût, brasser, scanner) se montrent-ils quand elle décompte seule ce qu'elle consomme ?
- c1 : toast annulable après l'action.
- c2 : pastilles d'effet sur la ligne.
- c3 : fil du soir (récapitulatif des effets).
- Capture : artefact AL26X3myBJLX9y4zbYXfQM, img/sim-0.webp (« Aujourd'hui, puis c1 · c2 · c3 »).
- Réponse attendue : `c1`, `c2` ou `c3`.
Statut : page de la passe 1, parcours supposés. Verdict (15.11) : « c'est mal target », passe 2 refaite (choix 3). c1 à c3 restent sans réponse.

## Choix 2 : Simplicité, sept parcours « après » (même page, sections sim-1 à sim-6)
Pour chacun : Garder, Retoucher ou Refuser. Captures : img/sim-1 à sim-6.webp de l'artefact.
- Fût au quotidien : verbe suivant sur la ligne, client proposé, « Tout laver » en lot.
- Dépense scannée : appui long sur + = photo, carte « C'est bon », doutes rangés « À revoir ».
- Densité du jour : la carte du brassin demande la densité le jour attendu, pavé direct.
- Conditionner et remplir : une feuille, volume déduit, fûts propres pré-cochés, remplis seuls.
- Corriger le stock : mode « Compter », seuls les écarts s'écrivent.
- Note : depuis le +, rangée par l'IA.
- Besoin de matériel : relié seul au scan du devis ou de l'achat.
Statut : parcours sans plainte datée pour densité, conditionnement, note, inventaire (RESULTAT.md) ; retirés en passe 2.

## Choix 3 : Simplicité passe 2, tes parcours (artefact 82HDNSfh4ADr8aigeigoH1, 16 astuces)
Attend : « Choisis puis colle-moi tes ids ». Source : `/c/Users/mrspa/Documents/Brasserie/.claude/worktrees/wonderful-elbakyan-d93ca6\work\refonte-frontend\v4\outils\pages\2026-11-15-simplicite\index.html`.
Captures « avant » locales : /c/Users/mrspa/Documents/Brasserie/.claude/worktrees/wonderful-elbakyan-d93ca6/work/refonte-frontend/v4/outils/pages/2026-11-15-simplicite/img/avant-depense.png, avant-brassin.png, avant-mesure.jpg, avant-lien.png.
Captures des astuces : dans l'artefact.
1. Facture : pa1 un doute à la fois ; pa2 comme la dernière fois (historique) ; pa3 unité étendue (tuiles par unité : g 1, 5, 10, 100 ; pièces 1, 2, 3, 5, 10).
2. Effets : pe1 onglet du bas en lignes serrées (v6a) ; pe2 effets en direct au-dessus de Terminé ; pe3 trace sur place, ↺ annule ; pe4 la question une fois (dose au curseur, jamais inventée) ; pe5 toute la chaîne.
3. Créer : pb1 adapter et créer ; pb2 rebrasser ; pb3 créer, régler plus tard ; pb4 depuis ta dernière du style.
4. Mesure : pm1 le palier appelle (curseur sur la cible) ; pm2 ce qui manque, à la fin.
5. Besoin : pl1 déjà relié, défaisable ; pl2 silencieux, tracé (Réalisés, courbe kh1r).
Restes : critique v2 non rejouée ; m2, kh1r, v6a non montrés en image.

## Choix 4 : place de l'onglet Calendrier dans la barre du bas
Question : à 390, avec Bord, Finances, Brassins, Stocks, Clients et le + flottant, où mettre le calendrier global (f1r) ?
- Options à montrer (SPEC 16.11, lecture du pilote) : 6e onglet ; fusion avec Bord ; à la place d'un autre onglet.
- Captures : aucune des trois placements dessinée. Seul le proto fb9 porte une barre du bas : work/missions/2026-11-16-calendrier/fb9/p1/proto.html. L'app compte 5 onglets (BottomNav.tsx:4, INVENTAIRE-CODE.md de liens-app).
- Statut : à dessiner en mini maquettes (L24), page neuve.
- Le + reste flottant, hors barre.

## Mots du brasseur liés (SPEC-BRASSEUR.md, mot pour mot)
- 15.11 : « j'ai créé cette app pour être efficace et facile pour maintenir à jour l'état de ma brasserie SIMPLEMENT et sans me prendre la tête. »
- 15.11 : « Moins de touche. Moi d'info en une fois. Un peu dans l'idée de en un clic on a tout l'essentiel, ça s'autocomplete autocasse, autogéré »
- 15.11 : « notamment quand je lave un fût ou fait une action ça a des conséquences sur tout. Par exemple lavé un fût fait baisser les consommables de nettoyage. Faire une bière pareil, baisse le starsan ect... Ce genre d'action qui est dynamique sur toute l'app » ; « C'est juste des exemples, être générique et général »
- 15.11 : « Pour le workflow, relancer avec plusieurs agent , , c'est mal target »
- 15.11 : « Dans les artefacts fait le bouton copier et choisir. Et met cote à cote les propal »
- 10.11 : « un Tab en bas … type Lignes serrées v6a » (pe1)
- 16.11 : « Je pense que même avoir un onglet calendrier en bas pour le global ferait vraiment sens »
- 16.11 : « Le + n'a jamais été en bas, c'est un bouton "volant" d'ailleurs il pourra avoir ces propre action calendrier. »
- 16.11 : « Parfait soit autonome, n'attends pas de retour de ma part. SI une décision est à prendre, utilise le conseil ou les persona »

## Aussi ouvert sur la page AL26X3 (hors périmètre demandé)
Finances, 8 vues : réponse du brasseur donnée (m1do-a, m1ar-c, m3pr-c, m3pm-d, m3im-c, m4bb-a, m4pf-c, m4ia-c, 15.11). La page n'est pas à jour.

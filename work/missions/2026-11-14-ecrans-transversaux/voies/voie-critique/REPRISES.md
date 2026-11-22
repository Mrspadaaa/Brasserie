OK — reprises : m3r-a ACCEPT, b1r ACCEPT (corrections), m3r-b et m3r-c REJET (écart à m3)
Critique Opus, 15.11. Captures ouvertes en plein format : m3 (4), m3r-a/b/c (5 chacune), b1 (4), b1r (7, planche des 12 écrans comprise).

## m3r-a — une période, pastille « ‹ Nov. › » dans chaque en-tête — ACCEPT. 4 problèmes
Ses mots tenus : mieux fait (T1 à T4 et mois comptés, dates libres, tout en un coup d'œil) ; « plusieurs endroits » sans risque : une seule période, réglable partout.
1. Flèches de la pastille d'en-tête environ 26 px de large à 390 : trop petites au doigt. Correction : 44 px.
2. Mois de la grille 28 × 40 px : même défaut. Correction : 44 px de haut.
3. « Bar du Tilleul · 2 fûts 1 280,00 » (Finances T4) : 640 CHF par fût de 20 L, donc 32 CHF/L. Valeur fausse ; b1r dit 120 CHF le fût. Correction : 2 × 120 = 240, puis recalculer Ventes, Résultat et T4.
4. Au 1280, aucun onglet actif sur Plus, alors que m3 met Bord en actif. Commun aux trois variantes : remettre Bord.
Doute : l'histogramme de m3 disparaît au profit des comptes. C'est permis, puisqu'il visait l'intervalle, mais c'est à lui de juger.
Phrase prédite : « Là c'est clair, un seul réglage et je le vois partout. »

## m3r-b — période de l'app plus période par écran (« ≠ app ») — REJET
5 problèmes. Il a choisi m3 (règle n° 1, D105).
1. Thème, à 390, en clair et en Cave : la barre grise passe sur « Clair » et « Cave ». Illisible, écart à m3. Correction : reprendre la carte Thème de m3 telle quelle.
2. Finances montre « Octobre » sous une pastille d'en-tête « Nov. » : deux mois sur un même écran. C'est justement le piège de « plusieurs endroits, attention à ce détail ».
3. « = app », « ≠ app », « suit l'app » : mots de développeur, pas les siens.
4. La carte Période de Plus empile quatre rangs de commandes (raccourcis, pas à pas, T1 à T4, écrans à part) : cockpit. Les mois comptés sont perdus.
5. Le même problème de 640 CHF par fût (Octobre, Bar du Tilleul).
Correction : rendre la carte Thème de m3 ; si la variante reste, une seule période affichée par écran et des mots à lui (« Finances regarde octobre · revenir à novembre »).
Phrase prédite : « Deux périodes ? Je vais me perdre. Et le thème est cassé. »

## m3r-c — le fil de l'année en tête de chaque écran — REJET
5 problèmes. Écart à m3, D105.
1. Au 1280, la page Plus de m3 est réorganisée : fil en pleine largeur, Je saisis et Thème descendus, Assistant et Atelier passés au milieu. Ce n'était pas demandé. Correction : garder les trois colonnes de m3, avec le fil dans la colonne Période.
2. Poignées de 6 × 18 px : on ne glisse pas une date libre au doigt à 390, donc le geste reste sans effet. Correction : zone de prise de 24 px au moins.
3. Plus 390 : les raccourcis sortent de la carte, et « Tout l'historique » mord sur la marge droite.
4. Finances affiche 352,05 deux fois (fil et carte) : doublon.
5. Le même problème de 640 CHF par fût (oct. – nov.).
Greffe à garder : chaque fil donne sa mesure et sa somme (CHF, brassins, écritures), ce qui corrige l'histogramme sans unité de m3.
Phrase prédite : « Joli, mais les poignées sont minuscules et ma page Plus a bougé. »

## b1r — le + selon l'écran — ACCEPT avec corrections. 5 problèmes
Ses mots tenus : le + change sur les 12 écrans dessinés. Place, forme, barre, rail et lettres de b1 sont gardés, et « sera B-033 » corrige B-032.
Contrôle contre `src/domain/fabActions.ts` : l'action de l'écran est juste sur les 12 (Bord et Finances : Nouvelle écriture ; Brassins : Nouveau brassin ; Recettes : Nouvelle recette ; Atelier : Nouvelle idée ; Volumes (scaler) : aucune action, BX-4 ; Articles : Nouvel article ; Courses : Copier la liste ; Fûts : Nouveau fût ; Matériel : Nouveau matériel ; Houblons : Nouvelle variété ; Clients : Nouveau client). Densité et les tuiles croisées sont bien marquées « proposé ».
Chiffres plausibles pour 20 L : 58 × 33 cl ≈ 19 L, un fût de 20 L, Volumes ×1,25, fût à 120 CHF, α de Nelson 12 %, Citra 12,8 %, Magnum 13 %.
1. La NOTE dit « seul le contenu de la feuille change », ce qui est faux. Au 390, le fond de Brassins change : données corrigées (480 × 33 cl et 3 fûts de 20 L étaient absurdes dans b1, la correction est bonne), mois d'octobre et de septembre ajoutés, pastille 3 devenue 1, « Calculateur » devenu « Volumes » (libellé de l'app). Au 1280, la colonne de droite de b1 (Conditionnés) est remplacée par une courbe de densité, Prochain brassage et Cuves. Correction : déclarer les corrections du 390 et rendre la colonne de b1 au 1280, ou la marquer « décor, non porté ».
2. Brassins 1280 : « Copier la liste · froment » ne fait pas la même chose que la tuile « Courses · froment » du 390. Correction : la même action et le même libellé aux deux largeurs.
3. Impôt bière et Prix et marges ne sont pas dessinés (2 sous-écrans sur 14). Correction : deux captures.
4. Recettes, « IPA Nelson 6,4 % » avec une OG de 1,052 suppose une FG de 1,003 avec la US-05 : peu plausible. Correction : 5,6 %, ou une OG de 1,060.
5. Volumes : empâtage 18,8 L et rinçage 18,7 L pour le même 15,0 × 1,25. Correction : 18,8 aux deux.
Phrase prédite : « Oui, là le + sert à quelque chose sur chaque écran. »

LEÇON PROPOSÉE : une reprise déclare dans sa NOTE tout ce qui change hors de la demande, fond d'écran et données compris (b1r : « seule la feuille change », alors que le fond du 1280 a changé).

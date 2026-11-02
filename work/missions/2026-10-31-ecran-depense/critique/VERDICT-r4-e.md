OK — accepté : son choix E est repris tel quel (segment « Plié | Déplié » de 28 px dans l'en-tête, entre le titre et le justificatif ; « Plié » noir allumé au repos, « Déplié » allumé seul quand tout est ouvert, aucun des deux à l'état mêlé, jaune en sombre), « Plié » garde ouvert le groupe à vérifier, chaque groupe reste libre d'un toucher (code et tests le prouvent), M1 levé à 0 px, « y aller » rouvre le bon groupe ; aucun bloquant, aucun majeur, trois mineurs à laisser

Critique Fable, 02.11, reprise 1 de `voies/r4-port-d` (son choix E, D311). Ouverts en image (L12) : les 14 côte à côte demandés dans `voies/r4-port-d/captures/` (`cote-tactile390-plier-{averifier,mele,deplie}-clair`, `cote-tactile390-plier-repos-cave`, les quatre `cote-pc1280-plier-*`, `cote-{tactile390,pc1280}-renovation-yaller-clair`, `cote-{tactile390,pc1280}-renovation-averifier-{clair,cave}`), sa maquette `choix-plier/img/e-*.png` à droite de chacun (règle n° 1 ; le cerclage bleu n'était que le marqueur de la page de choix, non porté, juste). Lu : VOIE.md « Reprise 1 », RESULTAT.md « Reprise 1 », `captures/rapport.txt` (126 OK), `groupes.ts` (`toutPlier`, `etatSegment`), les 25 tests `*-d311.test.*`, VERDICT-r4-port-d (D accepté, non rejugé : aucune régression vue sur les lignes de sous-famille, chevron, pastille, filet, groupes d'une ligne, état `familles`), PORTRAIT v2, D311.

- **r4-port-d / reprise 1** (son choix E : « tout plier, déplier ») — ACCEPTÉ. Sa phrase prédite : « E c'est bien ça. Et chaque catégorie se plie déplie toujours toute seule, parfait. »

## Règle n° 1 : E côte à côte, élément par élément

| Élément de E (e-plie, e-deplie, e-mele, e-plie-sombre) | Dans l'app | Capture |
|---|---|---|
| Segment « Plié \| Déplié », 28 px, cadre fin, dans l'en-tête de la feuille entre le titre et le picto du justificatif | Oui, 28,0 / 28,0 px, texte 14 px, même place, même cadre, même picto à droite (rapport l. 50 à 52) | cote-tactile390-plier-* |
| Au repos d'une lecture, « Plié » allumé (noir, texte blanc), « Déplié » éteint | Oui (aria-pressed true / false) | cote-tactile390-plier-averifier-clair, cote-pc1280-plier-averifier-clair |
| « Plié » plie tout, sauf le groupe qui porte une ligne à vérifier (sa page : Désinfectant reste ouvert) | Oui : Électricité (ligne rouge, « 39,60 + ? ») seul ouvert, Peinture, Outillage, Quincaillerie repliés ; `toutPlier` pose `ouvert \|\| sg.averifier` (groupes.ts l. 209) | cote-tactile390-plier-averifier-clair |
| « Déplié » allumé seul, tous les groupes ouverts | Oui : les quatre groupes ouverts, « Déplié » noir | cote-tactile390-plier-deplie-clair, cote-pc1280-plier-deplie-clair |
| État mêlé (un groupe ouvert à la main) : aucun des deux allumé | Oui : Peinture et sols ouvert (même groupe que sa vue), segment tout gris | cote-tactile390-plier-mele-clair, cote-pc1280-plier-mele-clair |
| Sombre : « Plié » allumé en jaune, texte sombre | Oui, jaune de l'app, comme e-plie-sombre | cote-tactile390-plier-repos-cave, cote-pc1280-plier-repos-cave |
| Sa consigne D311 : « ce bouton lock rien, juste un shortcut » | Oui : l'état est `etatSegment` calculé sur `groupeOuvert` (groupes.ts l. 224 à 227), jamais un mode gardé ; un toucher après « Plié » éteint « Plié » (rapport l. 60), le refermer le rallume (l. 61), un toucher après « Déplié » replie (l. 62), le groupe à vérifier se replie à la main (l. 45 ; test d311 bandes l. 55, écran l. 92) | rapport.txt, tests |

Aucun écart qu'il ne reconnaîtrait pas. À 1280 (sa maquette n'a que 390), le segment est à droite, collé au picto du justificatif, le titre à gauche : la même place « entre le titre et le justificatif », dans la largeur de l'en-tête de bureau.

## En brasseur : honnêteté et lecture en trois secondes

- Chiffres à vérifier : Électricité 23,40 + 16,20 = 39,60 « + ? » (le montant effacé jamais à 0), bande 410,50 « + ? », Détail 434,20 / 447,00 ; Peinture et sols 141,90 / 7 Stk après la ligne renommée. Juste aux deux largeurs et aux deux thèmes.
- Trois secondes : deux mots, « Plié » noir allumé, on comprend que tout est plié sauf ce qui réclame (le rouge). Rien à lire.
- « y aller » : après « Confirmer », Électricité est rouvert, la rangée en erreur ouverte avec le champ du montant cerclé, « Plié » reste allumé, et c'est juste : le seul groupe ouvert est celui que « Plié » produit (il porte la ligne à vérifier). Prouvé rouge sans `reveler` (RESULTAT, témoins).

## M1 (colonne des quantités), levé sans rien casser

`cote-tactile390-renovation-averifier-clair` et `-cave`, `cote-pc1280-renovation-averifier-clair` et `-cave` : « 29 Stk » (en-tête, « 410,50 + ? ») et « 10 Stk » (Électricité, « 39,60 + ? ») tombent sur la colonne de « 7 Stk », « 5 Stk », « 3 Stk ». Avant : 23,0 px et 15,3 px (`rapport-avant-m1.txt`) ; après : 0,0 px sur l'en-tête et les quatre lignes, 390 et 1280 (rapport l. 39 à 43, 101 à 105). Les montants restent alignés à droite (« 410,50 + ? » et « 141,90 » même bord). Lignes sans inconnu : classes d'aujourd'hui (test d311 bandes l. 89). Rien ne bouge dans la rangée.

## Bloquants

Aucun.

## Majeurs

Aucun.

## Mineurs (à laisser, aucun ne rejoue un refus de SPEC ou de DEFAUTS)

1. **Titre tronqué à 390 avec le badge « hors ligne »** (rapport l. 57 : « Acheter du matériel » à 140 px, ellipse, aucun chevauchement ni retour à la ligne ; 1280 : non tronqué). Tranché : **rare, à laisser**. Il faut une dépense de matériel ET être hors ligne ; « Acheter du mat… » reste compris, et sa maquette E n'a pas ce cas. Aucune règle enfreinte (D311 demandait : rien ne se chevauche ni ne passe à la ligne, tenu). À noter pour plus tard, sans voie : si le badge gêne un jour, un picto à la place du mot « hors ligne » quand le segment est visible.
2. **Groupe qui devient « à vérifier » après un « Plié » explicite** (RESULTAT, écart 4) : reste replié, sa ligne de sous-famille dit « + ? » en rouge, la rangée en édition reste forcée ouverte tant que son plateau l'est ; une nouvelle lecture remet l'état par défaut. Pas sa maquette (elle parle de l'état que « Plié » produit, tenu), pas un refus. À regarder sur sa vraie pièce (L28) ; si ça le gêne, un choix « à vérifier » posé par la lecture lente devrait rouvrir le groupe.
3. **Capture `plier-deplie` à 390** : la rangée « Détartrant anticalcaire » passe à moitié sous l'en-tête de bande collant (le script a défilé). Artefact de la capture, comportement d'aujourd'hui, rien à corriger dans cette voie.

Hors périmètre de ma revue, à signaler au pilote : `src/ui/depense/Entete.tsx` touché (prop optionnel `milieu`, 3 lignes, additif) hors du « Possède » de la voie ; justifié dans RESULTAT, aucun appel existant changé, `git status` à relire (L17).

## Rien de cassé ailleurs

- D accepté le 02.11 : lignes de sous-famille 28 px, chevron, pastille, quantité gras, montant, filet kaki, groupes d'une ligne (Mitigeur, Gants, Étagère), Nettoyage à une ligne inchangé, état `familles` sans ligne de sous-famille ni segment (rapport l. 2 à 4, test d311 écran l. 125) : identiques.
- Segment absent en vue Papier (rapport l. 49, test écran l. 117) et sur une dépense sans sous-groupe pliable (lecture étroite du pilote, dite dans RESULTAT, réversible par `etatSegment.visible`).
- En-tête de pièce, puces, chip « Total » / « Payé le », pied, Catégorie | Papier, Confirmer : en place aux deux largeurs et aux deux thèmes.
- 2216 tests verts, tsc 0, build 0, 0 erreur de console, 0 débordement, 0 requête hors localhost.

## Ce que la capture ne montre pas (à dire, pas à deviner)

- Le segment sur sa vraie pièce du 02.11 (17 lignes) et le cas hors ligne en vrai : mesurés sur l'aperçu seulement (L28). À jouer au banc avant de lui montrer en vrai, sans bloquer cette acceptation.

## Phrase prédite du brasseur

« E c'est bien ça. Et chaque catégorie se plie déplie toujours toute seule, parfait. » — aime ; son « mais » possible porterait sur sa vraie pièce, pas sur ce port.

LEÇON PROPOSÉE : aucune (celle de l'auteur, « un raccourci qui écrit des choix fige ce qu'un défaut calculait : le brief dit d'avance s'il écrit des choix ou remet l'état par défaut », est juste et lui revient).

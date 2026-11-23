# Avis du jury, tels que rendus (31.10, niveau rapide)

Dossier : `dossier.md`. Appels : `Agent`, `subagent_type: "conseiller"`, en parallèle. Texte recopié sans retouche ; la fusion
est dans `fiche-cadrage.md`.

## Brasseur (fable) — 64 677 jetons, 13 outils, 119 s

J1 — PILOTE — Confirmé, lecture étroite : sa capture est prise à 1:04, téléphone, une main ; PRODUCT.md range pourtant l'assistant en « Cuverie ». Concevoir pour une main dans les deux cas. — `brasseur-identite-avant.jpg` (heure 1:04) ; dossier § Produit « Cuverie ».

J2 — SOURCE — Corrigé : le geste premier est « coller ou partir d'un style, dire combien de litres ». Le nom vient après (« neipa v3 », nommé après coup). — `src/pages/BrewWizard.tsx` « Le chemin le plus rapide vers une recette complète : la coller. »

J3 — SOURCE — Confirmé, et plus fort : son mot le plus récent sur cet écran manque au dossier : « Oublie pas de bien mettre en avant les UX UI booster ! » (31.10). — `SPEC-BRASSEUR.md` l. 823 ; C094 « très textuel » ; l. 571 « Text header inutile ».

J4 — PILOTE — Confirmé ; ajouter : zéro phrase explicative au repos (sur la capture : « autant d'eau à prévoir… », « Repère provisoire… à ajuster selon… »), et le 24 L écrit une fois, pas trois. — SPEC § 0 « 80 mots au plus » ; C084 « pas d'info surplus en doublon ».

J5 — SOURCE — Confirmé pour l'en-tête ; nuance : `consolide-390.png` n'a pas de rangée d'onglets et le bandeau choisi a trois chiffres (IBU · OG · EBC), pas « Grain ». `controle-stepper.mjs` fait foi. — `choix/ecrans.json` etape-houblons « Ça c'est le bon ».

J6 — SOURCE — Confirmé ; ajouter la superposition (le + sur « Remplissage conseillé », visible sur sa capture) et les explications au repos. — `DEFAUTS-COURT.md` D2 ; SPEC l. 557 « Pas super la superposition ici, à corriger » ; « Aussi encore pas mal de légende et texte inutile ».

J7 — SOURCE — Confirmé. « 20 % d'espace libre, repère provisoire » est un chiffre plausible posé par défaut : à montrer comme conseil de la levure, jamais comme sien. — PRODUCT.md « refuse d'inventer un chiffre plausible » ; SPEC 18.10 « dense sur téléphone ».

J8 — PILOTE — Corrigé : « Objectif NOLO » n'est pas attesté comme son mot (absent du glossaire). Ses mots : fermenteur, cuve, AA, dry hopping. « Choix pour ce brassin » : il dirait « ??? ». — `cerveau/brasseur/glossaire.md` (aucune des quatre entrées).

J9 — SOURCE — Confirmé. — `src/ui/RecipeInstallationChoice.tsx` l. 26 « Reprendre le conseil de la levure » ; l. 27 alerte fermenteur ; dossier § Faits du code `setImporting(true)` deux fois.

J10 — GOÛT — Corrigé sur les repères du style : il aime les intervalles au repos, pas en texte replié. Options : (a) replié tel quel ; (b) plages en mini-barres sous le style ; (c) cibles fondues dans le bandeau comme l'IBU de Houblons. — PORTRAIT § 1.4 « les intervalles, les vraies valeurs, la relation au style » ; `consolide-390.png` (curseur IBU avec zone).

J11 — PILOTE — Confirmé ; ajouter : recette collée avec style hors liste, style maison, fermenteur plus petit que le volume (alerte existante l. 27), hors ligne. — `RecipeInstallationChoice.tsx` l. 27.

J12 — PILOTE — Confirmé ; le + flottant reste hors périmètre comme lanceur, mais son chevauchement est dedans. — dossier § Faits du code.

J13 — GOÛT — Confirmé, enrichi : (b) carte « bière » dense comme sa carte houblon ; (c) jauge fermenteur ; (d) le style porté par la puce d'en-tête (« 16D hypothèse ») plutôt qu'une liste. À montrer en variantes. — `consolide-390.png` puce « 16D hypothèse » ; [[pas-de-cockpit]].

J14 — PILOTE — Suppositions : 1) recette neuve part vide (le code dit : collée d'abord) ; 2) la levure est inconnue ici (fausse sur une recette collée) ; 3) NOLO est rare ; 4) les onglets font partie du choix ; 5) « Objectif NOLO » est son mot ; 6) bandeau à quatre chiffres.

J15 — GOÛT — Il veut coller ou choisir un style, voir d'un coup si ça tient dans son matériel et où il est dans le style, en widgets, pas en champs. Options : volume en stepper avec jauge ; ébullition en puces 60/90. — C091 « plein d'outils UI à dispo autre que les boutons ou champs text » ; SPEC l. 823.

J16 — ACCORD — Confirmé ; « Adapter la recette à N L » recalcule l'eau : ne pas y toucher. Montrer l'écran déployé = accord groupé. — PRODUCT.md « recalcule aussi l'eau et son traitement » ; CLAUDE.md déploiement.

J18 — MESURE — Le bandeau : le code dit « quatre chiffres », le choisi en montre trois, sa capture « Grain 8,6 kg » en plus. À trancher par `controle-stepper.mjs` sur la base v4.10, pas par avis.

Parole : « Il faut que ce soit dense sur téléphone car je veux voir un Max d'info au même endroit mais ça doit pas être surchargé » (SPEC 18.10).
Phrase prédite : « Pas mal la base mais très textuel, c'est quoi "Choix pour ce brassin" ??? Le + cache le 24 L. Mettre le header comme houblons. »

Confiance : 70 % dans l'hypothèse, corrigée : les repères du style se montrent au repos en cibles chiffrées, pas en texte replié ; l'espace libre garde son nombre (24/30 L) en badge et son réglage part à Levure.

LEÇON PROPOSÉE : ajout à L19 — avant de fermer un dossier de jury, un `grep` de SPEC-BRASSEUR sur le nom de l'écran et la date du jour ; sa parole la plus récente sur l'écran (ici l. 823, « UX UI booster », 31.10) manquait au dossier.

## Contradicteur (opus) — 55 934 jetons, 20 outils, 139 s

J1 — SOURCE — Je corrige. PRODUCT.md range l'assistant de recette en scène « Cuverie » : téléphone, une main, attention fragmentée. Le pilote dit « au bureau » sans source, alors que son propre dossier cite ce passage. La lecture « bureau » est à soumettre au Brasseur (J15). — `PRODUCT.md` l. 25–30 : « Téléphone, une main » ; « Écrans | Assistant de recette ».

J2 — PILOTE — Je confirme, avec une réserve. L'ébullition et NOLO fixent aussi la recette, ils ne « découlent » pas du nom, du style ni du volume. — `RecipeInstallationChoice.tsx` l. 22 ; `BrewWizard.tsx` l. 2390.

J3 — SOURCE — J'enrichis. La cause est aussi « comme houblons » : refaire l'écran dans la langue de l'étape Houblons (frise, pastilles, couleurs), pas seulement par sa méthode. — MISSION.md : « refaire tout les écrans de l'app un à un comme houblons » ; C094 « très textuel ».

J4 — MESURE — Je confirme, en ajoutant deux états : recette neuve (bandeau vide) et clavier ouvert sur le nom. Sur sa capture, « Matériel du plan » est déjà coupé en bas. — `cerveau/produit/saisie-mobile.md` (« densité pilotée par le clavier ») ; `brasseur-identite-avant.jpg`.

J5 — SOURCE — Je corrige. L'en-tête de référence est celui de sa capture Identité (le vrai fil d'étapes), pas celui de consolide-390 qu'il a refusé. Pour le bandeau, « quatre chiffres » vient d'un commentaire du code : consolide-390 n'en montre que trois. — SPEC l. 412 : « remplacer tout ça par le vrai Stepper » ; SPEC l. 557 : « seul houblons a une variation.... Changé ça ».

J6 — SOURCE — J'ajoute : « Header qui change ??? » (D119), le badge « 16D hypothèse » (D116), « très textuel » (C094) et « BOUTON TOUJOURS TROP GROS ». L'écran actuel fait lui-même partie de ce qui a été refusé. — `DEFAUTS-COURT.md` D119, D129.

J7 — MESURE — Je confirme, avec une question ouverte : le taux d'évaporation derrière « 3 L évaporés » a-t-il été mesuré, ou est-ce une valeur par défaut ? Si c'est un défaut, l'afficher comme un fait invente un chiffre. — PRODUCT : « refuse d'inventer un chiffre plausible » ; « limite utile provisoire de 35 L à vérifier ».

J8 — MESURE — Je corrige. Rien ne source « Objectif NOLO » comme son mot : il a dit « NOLO compris », pas « Objectif NOLO ». Le flou des autres libellés n'est pas sourcé non plus. À vérifier dans le glossaire e3. — `cerveau/metier/chimie-eau.md` l. 39.

J9 — MESURE — Je corrige. Sur sa capture, le + recouvre le bord de la carte, pas la valeur « 24 L ». L'import n'est en double que dans le corps : l'icône est celle qu'il a demandée. « Remplissage conseillé » n'est pas une copie du volume. C'est un conseil : 24 = 30 × 0,8, par coïncidence. Sources : SPEC l. 556 « à côté de l'import » ; `RecipeInstallationChoice.tsx` l. 25.

J10 — PILOTE — Je corrige. Déplacer l'espace libre vers Levure sort du périmètre (J12). L'alerte « dépasse la capacité » doit rester là où se saisit le volume. Repères du style montrés au repos ou repliés : c'est un GOÛT, à montrer en variantes. — `RecipeInstallationChoice.tsx` l. 27 ; PRODUCT l. 51 : « Ni une alerte utile ».

J11 — SOURCE — J'ajoute deux cas : fermenteur ou cuve inconnus (« Volume à renseigner ») ; NOLO décoché puis recoché : `allowEnable` n'existe qu'ici, Identité est le seul endroit qui l'active. Source : `BrewWizard.tsx` l. 2390, comparée à l. 3175 et 3289.

J12 — SOURCE — J'ajoute au hors périmètre l'en-tête, les onglets, le bandeau et le + flottant : ils sont communs aux 7 étapes. — D129 : « le même en-tête […] à la même place ».

J13 — GOÛT — Je corrige. Trois approches violent l'entonnoir : il faut au moins 48 v0 en 6 séries. Le formulaire compacté n'est que la baseline. Axes à lui montrer en variantes : une phrase-bière éditable ; une jauge fermenteur et cuve ; les repères du style posés comme marques sur le bandeau. Source : LECONS M13 ; L07 « plancher à enrichir ».

J14 — SOURCE — Suppositions implicites du dossier et de la recommandation : 1. Il crée ses recettes au bureau (PRODUCT.md dit cuverie). 2. consolide-390 donne l'en-tête et le bandeau de référence. 3. « Quatre chiffres » est un acquis du brasseur (la source est un commentaire du code). 4. Le volume en fermenteur et le remplissage conseillé sont une même donnée (import-recette : « Trois volumes DIFFÉRENTS »). 5. L'espace libre peut changer d'étape sans changer le calcul ni perdre l'alerte. 6. « 3 L évaporés » est mesuré. 7. NOLO peut se replier sans perdre son seul point d'activation. 8. Le cas type est une recette déjà remplie. Or le code dit que le chemin le plus rapide est de la coller. 9. On peut toucher un élément commun sur un seul écran. 10. « Comme houblons » désigne seulement la méthode. 11. Le brasseur juge à 390 px, clavier fermé. 12. « Objectif NOLO » est son mot. 13. Trois approches suffisent.

J15 — hors de mon regard.

J16 — ACCORD — Je confirme, avec un ajout : le déploiement de l'écran porté attend son accord. Sa recette réelle (« neipa v3 ») ne sert jamais de jeu d'essai écrit en ligne. — CLAUDE.md : « déploiement, push/PR/merge, données réelles ».

J18 — CONSEIL — Les éléments communs (en-tête, bandeau, +) se décident pour les 7 étapes à la fois, ou se figent, jamais depuis le seul écran Identité. — D119 : « Header qui change ??? ».

Le défaut fatal : le dossier désigne consolide-390 comme référence de « son en-tête et son bandeau », or cet en-tête a été refusé (« Text header inutile », D116) et ce bandeau n'a que trois chiffres. Les concepteurs vont reprendre un en-tête rejeté et casser la continuité des 7 étapes (D129), qu'ils ne doivent pas toucher depuis cet écran.

LEÇON PROPOSÉE : Un écran choisi n'est pas choisi en entier. Avant de le citer comme référence d'un élément commun (en-tête, bandeau, pied), vérifier dans SPEC-BRASSEUR que cet élément n'a pas été refusé à part (31.10 : l'en-tête de consolide-390, refusé le 23.10, D116).

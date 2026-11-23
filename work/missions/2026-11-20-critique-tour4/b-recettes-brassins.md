OK — 15 problèmes, 2 bloquants

# Critique de vision, tour 4 : Recettes et Brassins

Version : e8e9e77cb (tag en-ligne/2026-11-20-tour4). Copie locale, `?dev-local`, port 3132, sans aucune donnée réelle.

- **Banc.** Le `seedData.ts` de port-carnet ne marche plus sur ce commit : il lui manque `initialPlanning`, que port-carnet a retiré depuis. J'ai donc pris celui de ports-nuit. J'ai aussi copié `.env`.
- **Fixtures**, versées dans localStorage (`laffinee_recipes`, `laffinee_production`) :
  - 4 recettes d'aperçu du dépôt : American IPA (levure), Stout export ×2 (houblons et identité), QA compagnon ;
  - 3 brassins : LOT-041 en fermentation, avec 3 relevés ; LOT-042 planifié ; LOT-038 terminé.
- **Gestes joués.**
  - Brassins : liste, filtre « En cuve », « Voir les mesures », « Mesurer », relevé saisi (− ×4) puis « Enregistrer le relevé » (le point 1,012 s'ajoute bien), « Brasser » sur LOT-042.
  - Recettes : liste, recherche « Citra », aperçu, fiche, « Modifier », les 7 étapes avec « Suivant », Ma levure « + », « Enregistrer la recette ».
- **Tailles.** 390 tactile, 844×340 tactile et 1280, en clair et en cave. Sans les relevés défilés, cela fait 167 captures, toutes regardées en planches.
- **Captures** dans `C:/Users/mrspa/AppData/Local/Temp/claude/2574149e6fd34767/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad/c4/`, sous `t/` (série), `m/` (relevé) et `pl/` (planches).

Combien et quels problèmes ? 15, dont 2 bloquants.

| Écran | Thème | Largeur | État | Problèmes | Bloquants |
|---|---|---|---|---|---|
| Brassins, liste et filtre | clair, cave | 390, 844, 1280 | repos, En cuve | 0 | 0 |
| Fiche brassin, mesures | clair, cave | 390, 1280 | repos, Mesurer, après relevé | 5 (n° 2, 8, 9, 10, 11) | 1 |
| Brassin, jour J (Brasser) | clair | 1280 | repos | 1 (n° 1) | 1 |
| Recettes, liste et recherche | clair, cave | 390, 1280 | repos, Citra | 1 (n° 14) | 0 |
| Aperçu et fiche recette | clair, cave | 390, 844, 1280 | repos, après enregistrement | 2 (n° 4, 5) | 0 |
| Éditeur, 7 étapes | clair, cave | 390, 844, 1280 | chaque étape, Ma levure + | 6 (n° 3, 6, 7, 12, 13, 15) | 0 |

## Problèmes

1. **BLOQUANT — valeur fausse.** Jour J de LOT-042 : la tuile Ensemencement dit « cible 19 °C · 1 sachet ». Or la recette n'a aucune dose écrite : Ma levure affiche « aucune dose écrite », « Mettre 3 sachets », « besoin 2,4 sachets », et la fiche de la recette dit « SafAle US-05 · 2–3 sachets ». Le brasseur ensemencerait 30 L à 1,066 avec 41 % du besoin.
   - « 1 sachet ? la fiche dit 2-3 ??? »
   - Captures : `t/clair-1280-05-brassin-brasser.png`, à comparer avec `t/clair-1280-09-recette-fiche-detail.png` et `t/clair-1280-13-wiz-4-Levure.png`.
   - Correction : sans dose écrite, montrer le besoin (« 2–3 sachets · à écrire »), jamais 1 par défaut.
2. **BLOQUANT — valeur fausse.** Fiche et mesures de LOT-041 : l'en-tête dit « LOT-041 · cuve · 20 L », alors que la liste dit « LOT-041 29 L ». 20 L est le volume visé (`BatchDetailSheet.tsx:405` affiche `draft.volumeL` sous le mot « cuve »), 29 L le volume brassé.
   - « 29 ou 20 ? c'est quoi qui est dans la cuve ? »
   - Captures : `t/clair-1280-03-brassin-mesures.png`, `m/r-2-apres.png`, à comparer avec `t/clair-1280-01-brassins-liste.png`.
   - Correction : afficher le volume brassé quand il existe, sinon « visé 20 L ».
   - L'écart 29/20 vient de la fixture, mais le libellé est faux dans tous les cas.
3. **Récap : le sous-ensemencement est validé.** La ligne Levure dit « SafAle US-05 1 sachet », coche noire, sous le titre « Enregistrable ». Rien ne rappelle les « 41 % du besoin · sous » de l'étape. Capture : `t/clair-1280-17-wiz-7-Récap.png`.
4. **L'aperçu d'une recette s'ouvre sur le stock.** Il commence par un bandeau texte (« Le stock de Pilsner, Citra, SafAle US-05 est à vérifier : il n'est pas relié… »), puis trois lignes « pas au stock ». La bière elle-même (OG 1,066 · 29 IBU) est reléguée en une ligne grise. En 844×340, cette ligne est coupée sous les boutons.
   - Le bandeau dit « à vérifier » et les lignes disent « pas au stock » : deux messages contraires.
   - C'est la plainte du 18.10, « stock trop en avant », « Juste un petit badge » (L04).
   - Captures : `t/clair-390-08-recette-fiche.png`, `t/clair-844-08-recette-fiche.png`.
5. **Fiche recette, carte Houblons : des nombres sans unité.** Un « 20' » flotte au-dessus d'une ligne vide, et un « 60 » sans unité est collé à droite de Citra. On ne lit pas « 60 g à 20 min ». Capture : `t/clair-1280-09-recette-fiche-detail.png`.
6. **Étape Houblons : la carte de l'ajout est incomplète.** On y lit Citra, Ébullition, 29 IBU, α 12, fin −20 min, 60 g, mais ni le rôle ni les arômes, alors que la fiche les montre. L'IBU passe avant l'α (L04, D87). En plus, une phrase de conseil reste au repos : « Séparer l'amertume structurante… ». Capture : `t/clair-1280-12-wiz-3-Houblons.png`.
7. **Étape Levure, Conduite : trop de texte technique au premier plan.** Exemples :
   - « Jours de début suivants vs brouillon · Repos diacétyle : J4 → J4 (0 j)… » ;
   - « Fin de consigne du brouillon : J12. Pas une fin de fermentation attestée. » ;
   - « Vide = inconnu, distinct de 0 j. » ;
   - la consigne orange « Quantité de levure sèche à renseigner en grammes… ».

   Il l'a déjà refusé : « énormément d'information pour rien ». Captures : `t/clair-390-16-wiz-7-Levure-d1.png`, `-d2.png`.
8. **Courbe de densité : des valeurs illisibles.** Le point couvre « 1,016 » en 1280. En 390, après le relevé, le pointillé de la colonne « auj. » coupe « 1,012 ». Captures : `t/clair-1280-03-brassin-mesures.png`, `m/r-2-apres.png`.
9. **Mesures en 1280 : la courbe n'occupe que 60 % de la largeur.** La colonne « auj. » est isolée et le tiers droit reste vide. Capture : `t/clair-1280-03-brassin-mesures.png`.
10. **Saisie du relevé : un pouce posé sur une valeur absente.** « °C cuve » et « °C échantillon » disent « non relevée », mais leur pouce est posé au milieu de la piste (15 °C). Le brasseur se demande ce qui sera enregistré. Captures : `m/clair-390-2-tape.png`, `m/cave-1280-1-mesurer.png`.
11. **Saisie du relevé : la FG manque.** On lit « pas de FG visée dans la recette », alors que l'app sait donner une plage de FG par la levure : la fiche recette affiche « FG 1,012–1,015 plage ». Le repère manque au moment où il sert. Capture : `m/clair-390-2-tape.png`.
12. **Identité en 390 : le bouton « + » flottant recouvre du texte.** Il cache « Matériel · Système 30L · à adopter », coupé en « à ad ». Capture : `t/clair-390-13-wiz-4-Identité.png`.
13. **Éditeur en 844×340 : il reste environ 100 px de contenu.** Titre, rail, bandeau Grain/OG et barre du bas prennent presque toute la hauteur. Pas pratique en paysage. Capture : `t/clair-844-10-wiz-1-identite.png`.
14. **Recettes en 1280 : une colonne gauche vide.** La liste est à droite, et sous la recherche, à gauche, il n'y a rien. Capture : `t/clair-1280-06-recettes-liste.png`.
15. **Éditeur en 1280 : la largeur change à chaque étape.** Environ 744 px pour Identité, 1128 px pour Houblons, 880 px pour Levure, 560 px pour la liste du Récap. Le contenu saute d'une étape à l'autre. Captures : `t/clair-1280-10…17`.

## Comparaison avec sa maquette choisie

Ma levure est conforme à r3 v05 au repos et à r4 v02 après le geste : en-tête avec la dose, bande de besoin avec − et +, FG, conduite, floculation, arômes, boutons Compléter · IA, Offres, Repères et Atelier, champ « Changer de levure », puces et « Hors catalogue ». Je ne vois aucun écart qu'il ne reconnaîtrait pas.

## Doutes (non comptés)

- En 390, en mode dev, les pages paresseuses restent plus de 3 s sur « Chargement… Ouverture de la page… » (jour J, éditeur). Ce n'est pas représentatif du build en ligne.
- Après la sortie de l'éditeur en 390 clair, l'écran a affiché « Chargement de la brasserie… », un rechargement que je n'explique pas (`t/clair-390-19-recette-nouvelle.png`).
- « Repos diacétyle » à 19 °C, la température de la fermentation principale : ce n'est pas un vrai repos, faute de montée en température. C'est peut-être la conduite par défaut de la fixture.
- Floculation « inconnue » pour l'US-05, qui est pourtant documentée.
- « 2 sur 4 lignées » à la recherche : le mot « lignées » n'est pas le sien.
- « Nouvelle recette » n'est pas visible quand le carnet a des recettes. Je n'ai pas cherché la route par le bouton « + ».
- Le bandeau « Stock de ce brassin à confirmer » vient d'une fixture sans `stockAccountingVersion`.
- En 844×340, les captures défilées sont identiques à celles du haut : mon script a pris le mauvais conteneur à défiler, ce n'est pas l'app qui est en cause.

LEÇON PROPOSÉE : un banc dev-local de critique verse ses recettes et brassins par import Vite des `apercuDev`, puis localStorage (`laffinee_recipes`, `laffinee_production`), et prend le `seedData.ts` d'un worktree du même âge que le commit.

# Port du carnet d'idées dans l'app (17.11)

Ses mots, du plus ancien au plus récent : « Non focus sur l'achat de matériel mais ça peut aussi être utilisé comme brouillon » ;
« Oui je note mes trucs en gros juste un champs text et ensuite l'ai met en forme, trie, structure ECT... C'est clair ? » ;
« Il y a trop besoin d'action et pas assez d'aide de l'ai.... » ; « J'ai l'impression que ça classe pas super super. Mais tu peux
implémenter comme tell avec les meilleures fonction de version.... » ; puis, ce qui prime : **« En gros, un chat, et ça met en forme,
c'est tout et ça permet de comparer les idée, en gros »** (D-142).

Puis, le 17.11 au soir : « Parfait une fois en ligne puis testé sur la version en ligne […] » (D-143) ; « Pourquoi que le front ? Non
tout ?? » (D-144).

Sources : `DEMANDES.md` (D-1 à D-144), `ASSEMBLAGE.md` (gestes 1 à 15, greffes G1 à G37), `choix/maquettes.json` › `chantiers.carnet`
(base, gardes C1 à C8, refusés, `ecrans_choisis`), `2026-11-16-carnet-decision/CADRE.md`, `2026-11-16-liens-app/LIENS-APP.md` (« Pour le
carnet », § 4), `DEFAUTS-RECURRENTS.md` (CARNET-*, THEME-APP, LIEN-PLACE, CARNET-AVENIR-PLACE). Code lu dans le worktree
`C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet` (branche `claude/port-carnet-1711`, HEAD 40d11da1f, port du calendrier).

## Objectif

Porter dans l'app réelle le carnet d'idées retenu. Il vit dans **Stocks › Matériel › Carnets**, entre À venir et Réalisés (figé
p2:g05-1). C'est un fil de chat : un seul champ en bas, il écrit ou colle, et l'IA met en forme, trie et range dans les idées (critère,
façon, article, note ; carnet existant ou neuf). Ses messages restent lisibles là où ils ont été rangés. Ensuite, il compare. Les
écrans figés ne changent pas. Les gestes à revoir (créer, ajouter, modifier, supprimer) prennent pour base la version la mieux
classée, avec les greffes d'ASSEMBLAGE.md. Un geste qui ne sert ni le fil, ni la mise en forme, ni la comparaison passe derrière : il
est rangé, jamais supprimé.

Portée (L01) : l'écran Carnets et ses gestes, ses données, son IA (simulée au banc et dans `npm test` ; réelle seulement sur la
version en ligne, après le lot G), son branchement dans Stocks › Matériel, sa sortie vers À venir, **sa mise en ligne entière et son
test sur la version en ligne** (lot G, D-143, D-144 : son accord est donné), **et l'arrivée au carnet de l'idée notée au
calendrier** (L1, D-40, D-72 : R48 ; 4e passe de COUVERTURE). Hors portée : le reste du calendrier (geste L1 déjà porté, D-44, D-93 : port du calendrier), la facture qui solde le besoin (L11,
Nouvelle dépense), les fournisseurs (L16), les consommables (L9) et la veille réelle (accord).

**Trois « carnets » existent déjà dans le code. Il ne faut pas les confondre.**
- Carnet de brassage : `src/ui/production/carnet/*` (CarnetFil, DossierFil, useCarnet). C'est le journal du jour de brassage. **On n'y touche pas.**
- Carnet de l'Atelier (ks4 et e9na, choisis le 15.11) : `src/ui/atelier/NoteCarnet.tsx`, `rangerIA.ts`, `src/domain/rangerNote.ts`, tâche
  `rangerNote`. Il range des notes en À faire, Contacts et Bières. **On n'y touche pas** (D-41). Le carnet d'idées en reprend le patron :
  un garde côté client, une réponse simulée au banc, un drapeau de mode.
- **Carnet d'idées, objet de ce port.** C'est un modèle neuf : le code n'a aucun modèle « besoin d'achat » (CADRE). Ses fichiers
  vivent dans `src/domain/carnets/` et `src/ui/carnets/`, au pluriel, pour ne jamais se confondre avec les deux autres.

## Retenu

Ses choix, au mot près :
- ra-p5f choisie : « Carnet ra+p5f · ça va  J'aime bien mais pas mal de retouche » (D-77). C'est la base, figée sur le 3e classement (D-106).
- greffe5 choisie : « J'ai l'impression que ça classe pas super super. Mais tu peux implémenter comme tell avec les meilleures fonction de version.... » (D-141).

Préfixes d'image (racine du dépôt Brasserie) : `p2:` = `work/missions/2026-11-17-carnet-retouches/maquettes/page2/img/<id>.webp` ;
`g4:` = `…/greffe4/page/img/<id>.webp` ; `g5:` = `…/greffe5/page/img/<id>.webp` ; `ref/` = `…/greffe5/ref/`. Le détail de chaque
greffe (texte exact, version d'origine, rang) est dans ASSEMBLAGE.md : le lot C le lit geste par geste.

Écrans figés (on n'en change ni l'habit ni la disposition ; un geste n'ajoute que son cadre, son bandeau ou sa feuille) :
- R01 · Liste des carnets (par état : À comparer, Idée, Choisi, En veille ; photo, prix, « 2 façons · 5 articles ») · p2:g05-1, p2:i06-1 · « Liste des carnets : 1 g05-1, i06-1 » (D-96)
- R02 · Liste vide · p2:i02-2, p2:i06-2 · « Premier usage, liste vide : 2 i02-2, i06-2 » (D-97)
- R03 · Carnet ouvert, **sans la rangée « Ajouter à … : quoi ? »** · p2:h05-3, p2:i06-4 · « Un carnet ouvert : 2 h05-3, i06-4 » (D-99 ; D-114 la refuse)
- R04 · Cartes d'article · p2:h03-5, p2:h06-5 · « Cartes d'article : 2 h03-5, h06-5 » (D-101, CARNET-CARTE-MUETTE)
- R05 · Article ouvert · p2:h01-6 · « Un article ouvert : 1 h01-6 » (D-102)
- R06 · Comparer sur le critère, écartés visibles · p2:g01-8, p2:v03-4, p2:g05-8, p2:h04-7, p2:h06-7 · « Comparer sur le critère : 3 g01-8 » (D-103, D-52)
- R07 · Choisir, choisi, pourquoi · p2:g05-11, p2:v03-7, p2:v09-3, p2:g05-9 · « Choisir, choisi, pourquoi : 2 g05-11 » (D-104, D-20)
- R08 · À venir et Réalisés dans Stocks › Matériel · p2:h05-9 · « À venir et Réalisés : 2 h05-9 » (D-105 ; port partiel, voir § Points ouverts 7)

Gestes à revoir (base, puis greffes ; les écartés d'ASSEMBLAGE.md restent écartés) :
- R09 · Créer · avant · g5:v03-2 ; G1 g5:v04-1 (puces exemples touchables), G2 g5:v07-2 (« Une note en vrac marche aussi. ») · « Créer · avant : 1 v03-2, v04-1 » (D-130)
- R10 · Créer · pendant · g5:v08-3 (« ↓ arrive ici », « ✻ Déjà un carnet proche », ↑ vert) ; G3 g5:v07-3, G4 g5:v04-2, g5:v06-3 · « Créer · pendant : 2 v08-3 » (D-131)
- R11 · Créer · après · g5:v04-4 (« ✓ Carnet créé · ↺ Annuler », « votre phrase en titre ») ; G5, G6 g5:v01-4 ; G7 g5:v03-10, g5:v08-7 · « Créer · après : 2 v04-4 » (D-132)
- R12 · Ajouter · avant · figé R03 + champ de g5:v03-6 (✎ près du titre, ··· par note) ; G8 g5:v04-5, g5:v07-7 · « Ajouter · avant : 2 v03-6 » (D-133)
- R13 · Texte · pendant · g5:v02-10 (cadre « ↓ va atterrir ici », puces « Va dans » préchoisies) ; G9, G10 g5:v03-7 ; G11 g5:v08-8 · « Texte · pendant : 2 v02-10 » (D-134)
- R14 · Texte · après · g5:v03-8 (« ✓ Rangé ici · Annuler », sa phrase citée) ; G12 g5:v08-7 ; G13 g5:v05-7 · « Texte · après : 3 v01-7, v03-8, v05-7, v08-7 » (D-135)
- R15 · Lien · avant · g5:v07-10 (puce « Coller : … ») ; G14 g5:v03-9 · « Lien · avant : 2 v07-10 » (D-136)
- R16 · Lien · pendant · g5:v03-10 (« ✻ lecture de la page… », lien en clair) ; G15 g5:v01-9, G16 g5:v02-12, G17 g5:v04-9, G18 g5:v06-9 · « Lien · pendant : 2 v01-9, v02-12, v03-10 » (D-137)
- R17 · Lien · après · g5:v06-10 (carte complète, veille, « tient 80 °C : oui ») ; G19 g5:v03-11, G20 g5:v06-11 (le tableau naît au 2e lien), G21 g5:v06-14 · « Lien · après : 1 v06-10 » (D-138)
- R18 · Note en vrac · pendant · g5:v01-15 (« ✻ L'IA découpe votre note : 3 lignes, 2 carnets ») ; G22 g5:v06-17, G23 g5:v02-19 · « Note en vrac · pendant : 3 v01-15, v02-19, v06-17 » (D-139)
- R19 · Note en vrac · après · g5:v01-16 (« ✓ 3 lignes rangées dans 2 carnets · Annuler », « › Texte d'origine ») · « Note en vrac · après : 3 v01-16 » (D-140)
- R20 · Modifier une note · g4:v01-11 → g4:v01-12 ; G24 g4:v03-11 ; G25 g5:v08-19, G26 g5:v08-21, G27 g5:v03-18 · « Modifier une note : 3 v01-11, v01-12, v03-11 » (D-118)
- R21 · Renommer l'idée · g4:v02-14 → g4:v01-13 ; G28 g5:v03-6 ; G29 g5:v05-23, G30 g5:v08-25 · « Modifier le titre de l'idée : 2 v01-13, v02-14 » (D-119)
- R22 · Supprimer une note · g4:v02-12 ; G31 g4:v01-11 ; G32 g5:v08-22, g5:v04-24 ; G33 g5:v05-25 · « Supprimer une note : 2 v02-12 » (D-120)
- R23 · Supprimer une idée · g4:v02-17 → g4:v02-18 ; G34 g4:v04-19 ; G35 g5:v08-27, G36 g5:v05-29, G37 g5:v08-28 · « Supprimer une idée : 2 v01-16, v01-17, v02-17, v02-18 … » (D-121, D-47)
  **Suppression v2, son choix du 16.11** : « Suppression v2 » (D-47b ; CHOIX.md : « n liens le retiennent. Chaque lien se règle, et
  à 0 Supprimer s'allume. Une facture ou un stock fait archiver. »). Dans la carte de g4:v02-18 :
  - un compteur « n liens le retiennent », un lien par ligne. Un lien = ce qui vit dans un autre module **et existe dans le code au
    17.11** : le plan créé par « Envoyer dans À venir ». Le carnet n'en a qu'un (`sortie: { planId, le }`), donc n vaut 0 ou 1 dans ce
    port ; le texte reste « n liens » pour les liens que d'autres ports ajouteront. Ce que lit chaque sorte (3e passe, flou 1) :
    - `plan-a-venir` : `sortie.planId` trouvé dans les plans, et `estRealise(plan, transactions, payments)` faux
      (`src/domain/finance/upgradeRing.ts`, la règle même d'À venir et Réalisés dans `UpgradeWorkspace.tsx`) ;
    - `plan-realise` : le même `planId`, `estRealise` vrai, c'est-à-dire une dépense liée au plan, payée en entier. C'est « la
      facture » de CHOIX.md : elle se lit par le plan, aucune donnée neuve ;
    - `planId` absent des plans (plan supprimé côté À venir) : aucun lien, il ne retient rien (sa pastille R47 dit « supprimé ») ;
    - « stock » (matériel entré au parc depuis ce plan) : **non porté**, aucune donnée ne relie le parc au carnet (`equipmentRef` ne
      vise pas le carnet, R47). Il naîtra avec le port du parc (L19) ; `liensQuiRetiennent` le lira alors sans changer la vue ;
  - chaque lien a son réglage d'un toucher. Plan à venir : « Garder le plan sans ce carnet » (`detacherPlan` ; le plan reste intact
    dans À venir, rien n'y est écrit ; sa carte dit « du carnet <titre> · supprimé ») ;
  - à 0 lien, Supprimer s'allume (contour rouge), avec la vérification G36 « ni dans À venir, ni en commande » ; avant, il est grisé ;
  - un plan réalisé (une facture payée, dans Réalisés) fait archiver : son seul réglage est « Archiver » ; « Garder le plan sans ce
    carnet » n'y est pas proposé (`detacherPlan` refusé : la dépense payée garde son pourquoi). Supprimer reste éteint. L'idée
    archivée garde `sortie`, quitte la liste et se rouvre depuis sa carte de Réalisés ;
  - les articles en veille partent avec l'idée et leur veille s'arrête (texte de g4:v02-18). G35 propose avant, sans bloquer :
    « 2 articles en veille : les déplacer dans <carnet proche> · Déplacer » (§ Points ouverts 5).

Transversal :
- R24 · Un champ, l'IA met en forme, trie et range, corrigeable d'un toucher ; au plus 2 gestes par ajout · g4:base-E20g, g5:v03-2 · « juste un champs text et ensuite l'ai met en forme » (D-113, D-122, D-129, CARNET-IA-AIDE)
- R25 · Le fil : chaque message est gardé tel quel et reste lisible là où il a été rangé (titre, « votre phrase : … », « › Texte d'origine », lien en clair) · g5:v04-4, g5:v03-8, g5:v01-16, g5:v03-10 · « En gros, un chat » (D-142, D-19)
- R26 · Comparer sans geste : le tableau naît au 2e article ; chaque dépôt dit ce qu'il change pour comparer · g5:v06-11, g5:v03-7 · « ça permet de comparer les idée » (D-142, D-21, D-23)
  Le calcul vit dans `src/domain/carnets/comparer.ts` (lot A, critère A9) : tri par la caractéristique de chaque critère, dans
  l'ordre des critères (« rangé par : tient 80 °C d'abord, puis le débit ») ; marque « moins bien partout » ; écartés gardés à la fin
  avec leur raison ; passage en « À comparer » au 1er article ; tableau absent à 0 ou 1 article, présent dès le 2e ; différence
  avant/après d'un dépôt (« Pompe magnétique rangée, 2e », G20 ; conséquence G26). Une valeur inconnue se range après les connues,
  jamais comme 0. `Comparer.tsx` (lot C) reçoit ce tableau en props ; `CarnetsVue.tsx` (lot D) l'appelle.
- R27 · Champ en bas, visible au-dessus du clavier · tout écran avec le champ · « SI non sur mobile le clavier cache tout » (D-54, C8, CARNET-CLAV)
- R28 · + volant en bas à droite, juste au-dessus des onglets ; sur Carnets il porte d'abord l'action du carnet · p2:g05-1 · « Non c'est à droit » ; « le bouton+ dépend de son action principal » (D-68, D-74, D-42)
- R29 · Habit de l'app : en-tête L'Affinée, segment Stocks, cartes, couleur de zone Stocks, deux thèmes · p2:g05-1 · « Et respecte le thème de l'app.... » (D-65, D-69, D-80, D-85, C6, CARNET-THEME)
- R30 · Générique : aucun gabarit par objet ; l'IA propose les caractéristiques selon la catégorie · p2:g05-1, p2:i06-1 · « ça doit être générique, un frigo, une ventil, un évier » (D-24, C2)
- R31 · Bascule de veille par article, tous les 3 jours · p2:h01-6, g5:v06-10 · « un toggle switch qui va regarder tout les 3 jours » (D-28, C3 ; relève réelle sous accord)
  **Honnêteté tant que la relève n'existe pas (3e passe, flou 3).** La relève (fonction planifiée, recherche en ligne) n'est pas dans
  ce port (§ Accords) : la bascule enregistre l'intention seulement. La place, le libellé et la bascule de g5:v06-10 et p2:h01-6 restent
  tels quels (règle n° 1) ; seuls changent l'état par défaut et la ligne d'état :
  - un article ajouté naît **sans veille** (bascule éteinte) ; seul son toucher l'allume. Jamais d'allumage d'office ;
  - allumée : la fiche dit « Veille du prix, tous les 3 jours » puis, dessous, « demandée · pas encore relevée » ; la carte dit
    « veille demandée ». Aucune date de relève, aucun prix « relevé », aucune baisse : `veille.releveLe` reste absent, et un champ
    absent ne se rend jamais en date ni en 0 ;
  - au banc, la fixture porte un article à veille allumée par lui (même place que g5:v06-10, côte à côte) avec la même ligne d'état ;
    une relève simulée n'est pas montrée.
  Le jour où la relève est portée (son accord), `releveLe` est écrit et la ligne devient « relevée le … », sans changer la vue.
- R32 · Sortie vers À venir, sans caisse dans le carnet · p2:g05-1 (« Dans À venir depuis le 16 nov. · Voir »), p2:h05-9 · « kyg1 sans étape de liaison » (D-11, C4)
- R33 · Pastilles « lié à » sur l'idée ouverte, avec aperçu sur place · LIENS L29 · « L29 garder » ; « a est meilleur » (D-46, D-76).
  Liens, source, fonction, prop et test : R47.
- R34 · Garder le pourquoi : façon, produit, fournisseur ; un choix revu reste lisible (ADR) · p2:g05-11, p2:g05-9 · « pourquoi j'ai pris ce fournisseur » (D-20)
- R35 · Achat d'abord, brouillon permis : les achats en tête des lignes, la note en vrac dite en second · g5:v06-17, g5:v07-2 · « Non focus sur l'achat de matériel » (D-128)
- R36 · Notes brutes de son téléphone, mises en forme (achats, travaux, conseils, questions) · ref/note-sol-local.jpg, ref/note-ajoute-prevision.jpg, ref/note-prochain-brassage.jpg · « ça doit mettre en forme, mes note pour la brasserie » (D-123, D-124, D-126)
- R37 · Un petit micro dans le champ, rien de plus · p2:g05-1 · « beaucoup moins de cmd vocal » (D-83, CR-VOIX)
- R38 · Aucune étape, aucun « scan relié » visible, aucun champ obligatoire · tous · « workflow le plus simple » (D-8, D-29, K4)
- R39 · Le fil visible et comparer deux idées : à dessiner en mini maquettes par la voie E, montrées au brasseur ; le port de sa
  variante choisie est le lot F (§ Après son choix). D'ici là, le défaut porté est R25 (messages cités sur place) et le Comparer figé
  R06 · aucun écran · « En gros, un chat, et ça met en forme, c'est tout » (D-142)
- R40 · Les aides de l'IA des gestes 12 à 15 (G11, G25, G26, G27, G29, G33 ; G35 et G36) : chacune a son opération (lot A), son champ
  ou son calcul (lot B ou A), son réglage (`src/config/carnetIA.ts`, lot B), sa place (lot C) et son critère (A10, A11, B7, C6, D7) ·
  g5:v08-8, v08-19, v08-21, v03-18, v05-23, v05-25, v08-27, v05-29 · « Il y a trop besoin d'action et pas assez d'aide de l'ai.... »
  (D-122). G29 : détail en R46.
- R41 · Les essais sur son téléphone : le banc propose des tâches chronométrées (critère D8) · banc `?preview=carnets&taches=1` ·
  « Tous » (levier : essais sur son téléphone) (D-36)

Mise en ligne (17.11 soir, son accord donné) :
- R42 · En ligne dès 0 bloquant, puis testé sur la version en ligne : chaque écran et chaque geste du carnet joués sur l'adresse de
  production, lecture seule, actionneurs (Enregistrer compris) joués sur des données « ZZ TEST — … » retirées ensuite (L05, L11).
  Si le pilote bloque : une autre session ou une autre solution, sans attendre le brasseur · version en ligne · « Parfait une fois en
  ligne puis testé sur la version en ligne, si tu arrives pas toi, utiliser les autres sessions ou trop ve une solution » (D-143)
- R43 · Tout part en ligne : hébergement (front), fonctions touchées par le port (`aiTask`, avec `rangerCarnet` et `lireLien`), et
  règles Firestore **si le port en a besoin** ; ce besoin est prouvé à l'émulateur (critère G3), pas affirmé. Restent exclues
  `dispatchBrewerHopAdviceV1` et `notifyBrewerHopAdviceAnswerV1` (interdit antérieur, non levé) · version en ligne · « Pourquoi que le
  front ? Non tout ?? » (D-144)
  Au build de mise en ligne : `VITE_CARNET_IA=production` (l'IA du carnet est dans « tout ») ; `VITE_CARNET_AIDES` **absent**, donc
  les aides non classées (G11, G25, G26, G27, G29, G33) restent éteintes en ligne. C'est un choix du pilote, réversible : il ne les a
  pas encore vues (page de la voie E, section 4) ; G8, G9 et les pastilles (R44, R45, R47) sont classées ou choisies, donc allumées.

Gestes précisés (2e passe de COUVERTURE, flous 3 à 6) :
- R44 · G8, bulle « Le critère « <critère> » peut trancher entre <A> et <B> » (Ajouter · avant, g5:v04-5, g5:v07-7, rang 3, D-133).
  **Source : calcul local**, sans IA : `critereQuiTranche(carnet)` (lot A, `comparer.ts`) rend le premier critère du carnet dont la
  caractéristique est absente, ou inconnue pour les deux premiers du tableau, et les noms de ces deux façons (ou articles) non
  écartés ; `null` s'il y a moins de deux candidats. Place : bulle au-dessus de `ChampCarnet.tsx` (prop `suggestion`), au focus du
  champ, d'un toucher elle remplit le champ avec « <critère> : ». Picto local, pas le ✻ de la maquette (Q19 : le local ne passe pas
  pour de l'IA). Critères A13, C6, capture 10.
- R45 · G9, conséquence pendant la frappe : « les articles seront rangés sur <caractéristique>, <valeur> <unité> au moins » (Texte ·
  pendant, g5:v03-7, rang 3, D-134). **Source : calcul local** : `consequenceApercu(carnet, lignesLocales)` (lot A, `comparer.ts`)
  croise une ligne de l'aperçu (`analyseLocale`, sorte critère ou quantité) avec une caractéristique du carnet de même nom ou de même
  unité ; « au moins » si `sens: 'plus'`, « au plus » si `sens: 'moins'` ; le nombre vient **de la phrase tapée**, jamais d'ailleurs ;
  sans nombre, « les articles seront rangés sur <caractéristique> ». Place : `CadreArrivee.tsx` (prop `consequence`), sous le cadre
  « ↓ va atterrir ici ». Critères A13, C6, capture 11.
- R46 · G29, titre proposé : « ✻ proposé d'après « <phrase> » · avant : « <titre> » », Entrée renomme en un geste (Renommer,
  g5:v05-23, non classé, D-119). **Source : l'IA**, champ `titrePropose` sur une ligne `sorte: 'idee'` dont le `carnetId` est connu
  (lot B) ; la phrase citée est le texte du message qui l'a produite (`carnetMessage.texte`). Gardé sur le message
  (`carnetMessage.titrePropose?: { carnetId, titre }`, lot A) ; `RenommerCarnet.tsx` lit la dernière proposition non appliquée et
  préremplit le champ si `aides.renommerPropose` ; opération `renommer` (lot A) avec `avant` gardé pour G30. Critères B7, C6,
  capture 34.
- R47 · Pastilles « lié à » (R33, D-46). Liens portés, ceux qui existent dans le code au 17.11 : le plan d'À venir (`sortie.planId`,
  plan non réalisé, « À venir · <libellé> ») et le plan réalisé (« Réalisés · <libellé> ») ; un `planId` inconnu donne « supprimé ».
  Non portés, faute de donnée : la facture liée (L11 ; `creativeItemId` absent du code, `grep` vide au 17.11, port de Nouvelle
  dépense), le matériel du parc (L19, `equipmentRef` ne vise pas le carnet). `liensDe(carnet, plans)` (lot A, `operations.ts`) rend
  `{ sorte: 'a-venir' | 'realise', id, libelle, etat: 'present' | 'supprime' }[]`, calculé en mémoire ; l'inverse côté À venir est
  `upgrade.sourceCarnetId` (lot D). `CarnetOuvert.tsx` reçoit la prop `liens`, en montre 3 au plus puis « +n » ; un toucher ouvre
  l'aperçu sur place (libellé, état, date, « Ouvrir dans À venir ») sans montant (R32). Aucun lien : rien. Critères A14, C6,
  capture 55.

Corrections de la 4e passe de COUVERTURE (17.11) :
- R48 · L1 livré : l'idée notée au calendrier arrive au carnet d'idées. Le geste existe déjà au calendrier (porté, HEAD 40d11da1f) :
  « Noter une idée en S47 » dans le + volant (L1 a) et l'appui long sur une semaine (L1 b) ; ce port ne change ni ce geste, ni sa
  feuille, ni sa place (LIEN-PLACE, D-44). Il change **la cible** : `enregistrementIdee` (`src/domain/calendrierAjout.ts:310`) écrit
  aujourd'hui un `recipe-idea` (Atelier › Bières) ; il écrira un `type: 'carnet'` construit par `carnetDepuisPhrase` (lot A), sans
  IA, état Idée, la phrase gardée en `carnet.phrase` et en titre, la semaine en `date` (lundi). Annuler reste celui du calendrier
  (inverse de `ecritures.ts`). L'idée paraît dans Stocks › Matériel › Carnets ; au calendrier, elle reste une petite icône de sa
  semaine (`iconesIdees`, E05), et un toucher sur l'icône ouvre ce carnet (`CibleOuverture.ecran: 'carnets'`). Les `recipe-idea`
  datées déjà écrites ne migrent pas (§ Données, « Rien ne migre ») et gardent leur icône vers l'Atelier. Ainsi « Noter une idée en
  S47, dans le carnet » et « Elle arrive dans le carnet » (`CalendrierTab.tsx:316`, `:637`) deviennent vrais sans changer un mot
  (CRITIQUE-3 du calendrier, m390-28, m390-63) · aucun écran neuf · « ajouter avec un + une nouvelle idée, et ça viendrait
  directement là bas » ; « L1 a+b » (D-40, D-72). Critères A15, D9, captures 56, 57 ; en ligne, étape 4.
- R49 · Les demandes retenues hors de ce port ont un suivi écrit, pas un renvoi : D-6 et D-45 (L11, la facture scannée solde le
  besoin ; `creativeItemId` absent du code), D-48 (L15, L16, fiche fournisseur ; aucun modèle fournisseur), D-49 (L9, « chaque geste
  décompte ce qu'il use », consommables ; et L19, le parc, `equipmentRef` ne vise pas le carnet). Aucun de ces ports n'existe dans
  `work/missions/` au 17.11 : le pilote verse une ligne par demande à `work/missions/BUGS.md`, section « Demandes retenues, port à
  ouvrir », avec ses mots, son D-n, son lien (L9, L11, L15, L16, L19), l'élément de code qui manque et le port qui la portera.
  Aucun code ici · « ça le fait pas quand on a une nouvelle depense ??? » (D-6) ; « L11 garder » (D-45) ; « L16 garder » (D-48) ;
  « super important!! À bien mettre et généralisé partout » (D-49). Contrôle V-suivi.
- R50 · L'audit en trois regards, nommés : chaque passe du critique (captures du banc, puis version en ligne) rend un rapport en
  trois angles, chacun noté sur 10 avec sa liste numérotée « combien et quels problèmes ? » : **besoin du brasseur** (ses mots,
  SPEC, L04 : ce qu'il cherche d'abord est-il en premier ?), **UX/UI expert** (CARNET-LIS, CARNET-CLAV, Q4, gestes comptés, deux
  thèmes, 390 et 1280), **critique** (tout le reste, à charge). Cible 9/10 sur chaque angle ; sous 9, chaque point manquant est un
  constat numéroté versé à BUGS.md. Puis le pilote. Le critique est Opus (Fable interdit depuis le 10.11) · tous les écrans du carnet ·
  « Fait passer un critique, brasseur, UX UI expert […] On est sur du 7/10 on vise le 9 ! » (D-81) ; « Fait peut être passer un
  critique, revue, besoin brasseur ECT... » (D-61). Contrôle V-regards.

Rangé derrière au nom de « c'est tout » (D-142). Rien n'est retiré d'un écran figé (règle n° 1) : « derrière » veut dire hors du fil
et du champ, atteint d'un toucher là où le figé le place, jamais proposé dans le premier plan du chat.
- Repris d'ASSEMBLAGE : puces « Va dans » (correction seulement, préchoisies), feuille ··· de la note, bascule de veille (dans la
  fiche d'article, R05), rubrique Photos vide (masquée tant qu'elle est vide), menus « Corriger : … ▾ ».
- Choisir (R07) : atteint depuis Comparer seulement (« Choisir » sous le tableau) ; aucun bouton Choisir dans le fil ni dans le champ.
- À venir (R32, R08) : « Envoyer dans À venir » paraît sur l'idée choisie seulement ; aucune caisse ni montant de trésorerie dans le
  carnet.
- Pastilles « lié à » (R33) : sous le titre de l'idée ouverte, et seulement si un lien existe ; rien sur la liste ni dans le fil.
- Veille (R31) : la bascule vit dans la fiche d'article, éteinte à la naissance ; allumée, la carte dit seulement « veille demandée »
  et la fiche « demandée · pas encore relevée » ; la relève réelle attend l'accord.
- Les aides non classées (R40) : construites, visibles au banc, éteintes en production par le réglage (§ Points ouverts 5).

Manques de la couverture du 17.11 (`COUVERTURE.md`), chacun suivi jusqu'à la vérification :

| Manque | Retenu | Lot et fichier | Critère | Vérification |
|---|---|---|---|---|
| M1 Comparer sans propriétaire (D-13, D-21, D-23, D-52 ; G20, G26) | R26 | A : `src/domain/carnets/comparer.ts` ; C : `Comparer.tsx` en props ; D : `CarnetsVue.tsx` l'appelle | A9 | captures 19, 27, 52 |
| M2 Fil de chat et comparer des idées (D-142) sans voie | R39, « Rangé derrière » | E : mini maquettes ; F après son choix | E1 à E5 | page de choix ouverte, capture 53 |
| M3 Suppression v2 (D-47, D-47b) | R23 | A : `operations.ts` (`liensQuiRetiennent`, `detacherPlan`, `archiverCarnet`) ; C : `SupprimerCarnet.tsx` ; D : `UpgradeWorkspace.tsx`, `types.ts` | A3, C6, D7 | captures 36, 38, 49, 50 |
| M4 Aides de l'IA sans fichier ni contrôle (G11, G25 à G27, G33, G35, G36) | R40 | A : `doublons.ts`, `operations.ts` ; B : `carnetIA.ts`, `ia.ts`, `config/carnetIA.ts` ; C : composants nommés ; D : `CarnetsVue.tsx` | A10, A11, B7, C6, D7 | captures 12, 33, 35, 36, 51 |
| M5 Composants non nommés (R11, R14, R17, R19, Photos) | R11, R14, R17, R19 | C : `Bandeau.tsx`, `LigneRangee.tsx`, `CarnetOuvert.tsx`, `ChampCarnet.tsx`, `Photos.tsx`, `photo.ts` | C2 | captures 7, 13, 18, 23, 44 |
| M6 Idées acceptées sans suivi (D-31, D-32, D-66, D-125) | § Points ouverts 12 à 15 | pilote : `work/missions/BUGS.md` ; E : D-66 | V-idées | `grep` dans BUGS.md |
| M7 Références à resserrer (D-52, D-36, D-35) | R06, R41, § Points ouverts 16 | A (D-52), D (D-36), B et C (D-35) | A9, D8, B7 | § Couverture, capture 54 |
| 2e passe, manquant 1 : mise en ligne accordée et test en ligne (D-143, D-144) | R42, R43 ; § Accords et § Décisions réécrits | G : build, déploiement, jeu en ligne ; B (fonctions prêtes au déploiement) | G1, G2, G4, G5, G6 | § Vérification « En ligne » |
| 2e passe, manquant 2 : règles Firestore « si le port en a besoin » | R43 | G : `scripts/check-carnets-emulator.mjs` ; règle neuve seulement si G3 échoue | G3 | § Vérification « En ligne », étape 1 |
| 2e passe, flou 3 : G8 sans source ni composant (D-133) | R44 | A : `critereQuiTranche` (`comparer.ts`) ; C : `ChampCarnet.tsx` (prop `suggestion`) ; D : `CarnetsVue.tsx` | A13, C6 | capture 10 |
| 2e passe, flou 4 : G29 sans opération ni champ (D-119) | R46, R40 | A : `titrePropose` du message, `renommer` ; B : champ `titrePropose`, garde, simulation ; C : `RenommerCarnet.tsx` | B7, C6 | capture 34 |
| 2e passe, flou 5 : G9 sans fonction (D-134) | R45 | A : `consequenceApercu` (`comparer.ts`) ; C : `CadreArrivee.tsx` (prop `consequence`) | A13, C6 | capture 11 |
| 2e passe, flou 6 : pastilles « lié à » sans liens nommés (D-46) | R47 | A : `liensDe` (`operations.ts`) ; C : `CarnetOuvert.tsx` (prop `liens`) ; D : `CarnetsVue.tsx` lit les plans | A14, C6 | capture 55 |
| 2e passe, mineur 7 : G30 et G32 sans composant | R21, R22 | C : `Bandeau.tsx` | C1 | captures 34, 35 |
| 2e passe, mineur 8 : lot F hors du tableau des voies | R39 | F : VOIE.md neuf à son choix ; condition de clôture (§ Lots, F) | clôture | § Vérification « Clôture » |
| 2e passe, mineur 9 : D-39, « hors port » sans port nommé | R47 | aucun code ici ; ports nommés en § Couverture, D-39 | — | § Couverture |
| 3e passe, flou 1 : Suppression v2, A3 contredit `sortie` (un plan par idée) (D-47b) | R23 | A : `liensQuiRetiennent` (sortes `plan-a-venir`, `plan-realise` par `estRealise` ; `stock` non porté), `detacherPlan` refusé sur plan réalisé, `archiverCarnet` garde `sortie` ; C : `SupprimerCarnet.tsx` ; D : `CarnetsVue.tsx` lit plans, transactions, paiements | A3, C6, D7 | captures 38, 49, 50 |
| 3e passe, flou 2 : tableau des Voies sans A9 à A14, B7, B8, C6 | — | § Voies, colonne Contrôles : A1 à A14, B1 à B8, C1 à C6, D1 à D8 ; F écrit à son choix | tableau | `node scripts/agents/systeme.mjs mission` |
| 3e passe, flou 3 : veille affichée active sans relève réelle (D-28) | R31, « Rangé derrière » | A : article né sans veille, `veille.releveLe` jamais écrit ; C : `CarteArticle.tsx`, `FicheArticle.tsx` (« demandée · pas encore relevée ») | A11, C6 | captures 18, 26 ; en ligne, étape 5 |
| 4e passe, manquant 1 : l'idée du calendrier n'arrive pas au carnet, les deux ports se renvoient L1 (D-40, D-72) | R48 | A : `carnetDepuisPhrase` (`modele.ts`), `iconesIdees` et `CibleOuverture` (`calendrier.ts`) ; D : `enregistrementIdee` (`calendrierAjout.ts`), `CalendrierTab.tsx` (ouvrir `carnets`), `App.tsx` | A15, D9 | captures 56, 57 ; en ligne, étapes 4 et 5 |
| 4e passe, flou 2 : D-6, D-45, D-48, D-49 « hors port » sans suivi écrit | R49 | pilote : `work/missions/BUGS.md`, « Demandes retenues, port à ouvrir » ; aucun code | V-suivi | `grep` dans BUGS.md |
| 4e passe, flou 3 : « trois regards » non nommés (D-61, D-81) | R50 | V : rapport du critique en trois angles notés ; G : même rapport sur la version en ligne | V-regards | § Vérification, captures ; en ligne, étape 5 |

## Couverture

Lot : A données, B IA, C écrans, D assemblage, V vérification. « hors port » = retenu, mais ailleurs (le module est cité).

| D | Élément | Lot |
|---|---|---|
| D-1 | À venir et Réalisés traités : segments de Stocks › Matériel (R08) ; Archives reste dans UpgradeWorkspace | D |
| D-2 | Sortie du carnet vers À venir (R32) ; la facture qui solde le besoin (L11) est hors port | D |
| D-3 | Crayon d'édition d'À venir : déjà dans kh1r (UpgradeWorkspace), gardé | D |
| D-4 | non porté : refusé | — |
| D-5 | non porté : remplacé par D-8 et D-11 | — |
| D-6 | hors port : L11, Nouvelle dépense ; suivi écrit R49, ligne de BUGS.md « Demandes retenues, port à ouvrir » (V-suivi) | — |
| D-7 | Une idée naît d'une phrase, jamais d'un formulaire (R09 à R11) | C, B |
| D-8 | Aucun « scan relié » visible (R38) | C, V |
| D-9 | non porté : refusé (K4) | — |
| D-10 | Une envie, plusieurs solutions : façons et articles (R03) | A, C |
| D-11 | Sortie vers À venir (R32) | D |
| D-12 | non porté : refusé (K5) | — |
| D-13 | Une solution se juge sur le critère, pas sur le prix (R06) ; tri par la caractéristique du critère dans `comparer.ts` (R26, A9) | A, C |
| D-14 | non porté : refusé (K5) | — |
| D-15 | Une ligne suffit pour créer (R09, R10) | C |
| D-16 | Façons : retenue, écartée, ouverte (R03) | A, C |
| D-17 | Critère qui oriente, avec sa raison (R03, R06) | A, B, C |
| D-18 | 5 ou 6 articles de vendeurs et pays différents (R04) | A, C |
| D-19 | Noter au fil : le fil (R25) | A, B, C |
| D-20 | Le pourquoi de la façon, du produit, du fournisseur (R34) | A, C |
| D-21 | Comparer (R06, R26) : calcul `comparer.ts` (A9), vue `Comparer.tsx` en props, appel par `CarnetsVue.tsx` | A, C, D |
| D-22 | L'IA vérifie la disponibilité : lecture de la page au collage (R16) ; vérification ailleurs que sur la page = accord | B |
| D-23 | Caractéristiques techniques comparées (R06) : sens plus, moins, oui-non, inconnu rangé après, « moins bien partout » (`comparer.ts`, A9) | A, C |
| D-24 | Générique, aucun gabarit (R30) | A, B, V |
| D-25 | Vue sans détails d'abord (R01) | C |
| D-26 | non porté : remplacé par D-122 | — |
| D-27 | Un lien collé montre l'objet (R15 à R17) | B, C |
| D-28 | Bascule de veille (R31), éteinte à la naissance, « demandée · pas encore relevée » tant que la relève n'existe pas (A11, C6 ; captures 18, 26) ; relève réelle = accord | A, C |
| D-29 | Un geste par action (R38) | C, V |
| D-30 | non porté : remplacé par D-31 à D-36 | — |
| D-31 | non porté : idée à dessiner (partage du navigateur) ; suivi § Points ouverts 12, versée à BUGS.md (V-idées) | — |
| D-32 | non porté : idée à dessiner (raccourci de l'icône) ; suivi § Points ouverts 13, versée à BUGS.md (V-idées) | — |
| D-33 | non porté : remplacé par D-83 | — |
| D-34 | non porté : idée à dessiner (port du calendrier) | — |
| D-35 | Propositions de l'IA acceptées d'un toucher : caractéristiques de la catégorie et carnet proche (B : `caracteristique`, `carnetId` ; C : puce d'un toucher). Fournisseurs proposés : seulement ceux que le texte ou la page lue nomment (`vendeur`) ; en chercher d'autres = recherche en ligne, sous accord (§ Points ouverts 16) | B, C |
| D-36 | Prototype jouable seul : banc `?preview=carnets`, avec tâches chronométrées `&taches=1` (R41, D8) | D |
| D-37 | non porté : remplacé par D-57 | — |
| D-38 | Lisibilité (CARNET-LIS) | C, V |
| D-39 | Liens : À venir (R32) et pastilles « lié à » (R33, R47). Hors port, chacun avec son port : calendrier (L1, port du calendrier) ; compta et facture qui solde (L11, port de Nouvelle dépense, `creativeItemId` à créer là) ; fournisseurs (L15, L16, port des fournisseurs, après le modèle fournisseur) ; matériel du parc (L19, `equipmentRef`, port du parc après le choix « Parc » de la voie E) ; consommables (L9) | A, C, D |
| D-40 | R48 : l'idée du + du calendrier écrite en `carnet` (`carnetDepuisPhrase`, A15 ; `enregistrementIdee`, D9), visible dans Carnets, icône de semaine qui ouvre le carnet ; le geste reste celui du port du calendrier ; captures 56, 57 | A, D |
| D-41 | Rien ne se perd : Atelier, carnet de brassage et parc intacts, lecteurs de `creativeItems` vérifiés | A, D |
| D-42 | + volant porte l'action du carnet (R28) | D |
| D-43 | non porté : remplacé par D-70 | — |
| D-44 | hors port : port du calendrier (LIEN-PLACE) | — |
| D-45 | hors port : L11 (Nouvelle dépense, `creativeItemId` absent) ; suivi écrit R49 (V-suivi) | — |
| D-46 | Pastilles « lié à » (R33, R47) : `liensDe` (A14), prop `liens` de `CarnetOuvert.tsx` (C6), plans lus par `CarnetsVue.tsx` | A, C, D |
| D-47 | Supprimer une idée sans cascade (R23) : aucune écriture dans un autre module (A3) | A, C |
| D-47b | Suppression v2 : compteur « n liens le retiennent », réglage lien par lien, Supprimer allumé à 0 ; plan à venir : détacher ; plan réalisé (facture payée, `estRealise`) : archiver, détacher refusé ; « stock » non porté faute de donnée, au port du parc (L19) (R23 ; A3, C6, D7) | A, C, D |
| D-48 | hors port : L16 (pas de modèle fournisseur) ; le vendeur reste un texte de l'article ; suivi écrit R49 (V-suivi) | — |
| D-49 | hors port : L9 (consommables), avec L19 (parc, `equipmentRef`) ; suivi écrit R49 (V-suivi) | — |
| D-50 | non porté : remplacé par D-51 | — |
| D-51 | non porté : refusé | — |
| D-52 | Écartés visibles dans Comparer (R06) : gardés à la fin avec leur raison (`comparer.ts`, A9) | A, C |
| D-53 | Un seul champ ; l'IA propose le critère (R24) | B, C |
| D-54 | Champ au-dessus du clavier (R27) | C, V |
| D-55 | non porté : refusé (K1, K2, K3) ; contrôle d'absence en V | V |
| D-56 | Rien de maigri (CARNET-MAIGRE) | C, V |
| D-57 | non porté : remplacé par D-77 | — |
| D-58 | Greffes p5 (police, noms entiers, dates lisibles) : déjà dans les figés | C |
| D-59 | p5f fini : déjà dans les figés | C |
| D-60 | Chaque écran utilisable seul | C, V |
| D-61 | Audit en trois regards nommés (R50) : besoin du brasseur, UX/UI expert, critique ; chacun noté sur 10 (V-regards) | V, G |
| D-62 | Audit écran par écran (méthode) | V |
| D-63 | Son scénario de zéro, puis frigo, ventilation, évier (CARNET-COEUR) | D, V |
| D-64 | non porté : remplacé par D-77 | — |
| D-65 | Thème de l'app, avec couleur (R29) | C |
| D-66 | non porté : idée à dessiner ; défaut : aucun bloc « Façons possibles » proposé d'office ; ses deux lectures montrées par la voie E (page « Aides », § Points ouverts 14) | E |
| D-67 | non porté : remplacé par D-68 | — |
| D-68 | + en bas à droite (R28) | D |
| D-69 | Thème de l'app tel qu'il s'affiche (R29) | C |
| D-70 | non porté : refusé (paysage) | — |
| D-71 | non porté : remplacé par D-75 | — |
| D-72 | R48 : L1 a (+ volant, « Noter une idée en S47 ») et L1 b (appui long sur une semaine) livrent tous deux un `carnet` (D9) ; captures 56, 57 | A, D |
| D-73 | non porté : remplacé par D-76 | — |
| D-74 | Le + volant, acquis (R28) | D |
| D-75 | ra+p5f assemblés : déjà dans les figés | C |
| D-76 | L29 a, avec aperçu sur place (R33) | C |
| D-77 | Base ra+p5f : les figés | C |
| D-78 | Carte et fiche d'article parlantes (R04, R05) | C |
| D-79 | Ajouter clair (R09 à R19) | C, B |
| D-80 | Habit de l'app (R29) | C |
| D-81 | Trois regards nommés (R50), cible 9/10 sur chacun, au banc puis en ligne (V-regards) ; mini maquettes : voie E | V, E, G |
| D-82 | méthode déjà appliquée (greffes) ; rien à porter | — |
| D-83 | non porté : refusé (CR-VOIX) ; un petit micro seul (R37) | C |
| D-84 | méthode ; rien à porter | — |
| D-85 | Habit de l'app réelle (R29) | C |
| D-86 | non porté : remplacé par D-96 | — |
| D-87 | méthode, hors app | — |
| D-88 | méthode, hors app | — |
| D-89 | non porté : remplacé par D-96 à D-105 | — |
| D-90 | méthode | — |
| D-91 | non porté : remplacé par D-96 à D-105 | — |
| D-92 | non porté : refusé (CR-AVENIR-CAL) ; À venir reste dans Stocks › Matériel | D, V |
| D-93 | hors port : port du calendrier | — |
| D-94 | méthode, hors app | — |
| D-95 | méthode, hors app | — |
| D-96 | Liste figée (R01) | C |
| D-97 | Liste vide figée (R02) | C |
| D-98 | non porté : remplacé par D-107 à D-110, puis D-130 à D-132 | — |
| D-99 | Carnet ouvert figé, sans tuiles (R03) | C |
| D-100 | non porté : remplacé par D-112 à D-117, puis D-133 à D-138 | — |
| D-101 | Cartes d'article figées (R04) | C |
| D-102 | Article ouvert figé (R05) | C |
| D-103 | Comparer figé (R06) | C |
| D-104 | Choisir, choisi, pourquoi figé (R07) | A, C |
| D-105 | À venir et Réalisés dans Stocks › Matériel (R08, partiel) | D |
| D-106 | Seuls créer, ajouter, modifier, supprimer changent | C, V |
| D-107 | non porté : remplacé par D-130 | — |
| D-108 | non porté : refusé (la flèche) | — |
| D-109 | non porté : remplacé par D-131 | — |
| D-110 | non porté : remplacé par D-132 | — |
| D-111 | Tout se trie seul (R24) | B, C |
| D-112 | non porté : remplacé par D-133 | — |
| D-113 | Champ libre ; l'IA trie, construit, catégorise (R24) | B, C |
| D-114 | non porté : refusé (tuiles « quoi ? ») | — |
| D-115 | non porté : remplacé par D-134 et D-135 | — |
| D-116 | non porté : remplacé par D-136 à D-138 | — |
| D-117 | non porté : refusé (écrans de lien à remplir) | — |
| D-118 | Modifier une note (R20) | A, C |
| D-119 | Renommer l'idée (R21) ; G29 titre proposé (R46 : `titrePropose`, B7, C6) ; G30 dans `Bandeau.tsx` (C1) | A, B, C |
| D-120 | Supprimer une note, Annuler dans la page (R22) | A, C |
| D-121 | Supprimer une idée, confirmation dans la page (R23) | A, C |
| D-122 | Moins de gestes, plus d'IA (R24) | B, C |
| D-123 | Notes brutes mises en forme (R36) | B |
| D-124 | Note « Ajoute » mise en forme (R36) | B |
| D-125 | non porté : idée à dessiner (hors carnet : tableau de bord) ; suivi § Points ouverts 15, versée à BUGS.md (V-idées) | — |
| D-126 | Note « prochain brassage » mise en forme (R36) | B |
| D-127 | non porté : remplacé par D-128 | — |
| D-128 | Achat d'abord, brouillon permis (R35) | B, C |
| D-129 | Un champ, l'IA met en forme (R24) | B, C |
| D-130 | Créer · avant (R09) | C |
| D-131 | Créer · pendant (R10) | B, C |
| D-132 | Créer · après (R11) | A, C |
| D-133 | Ajouter · avant (R12) ; G8 (R44 : `critereQuiTranche`, A13 ; bulle de `ChampCarnet.tsx`, C6) | A, C |
| D-134 | Texte · pendant (R13) ; G9 (R45 : `consequenceApercu`, A13 ; `CadreArrivee.tsx`, C6) | A, B, C |
| D-135 | Texte · après (R14) | A, C |
| D-136 | Lien · avant (R15) | C |
| D-137 | Lien · pendant (R16) | B, C |
| D-138 | Lien · après (R17) | A, B, C |
| D-139 | Note en vrac · pendant (R18) | B, C |
| D-140 | Note en vrac · après (R19) | A, C |
| D-141 | Port accordé avec les meilleures fonctions : ce plan entier | A, B, C, D |
| D-142 | Le fil (R25) et comparer (R26) portés ; le fil visible et comparer deux idées dessinés par la voie E (R39), portés au lot F après son choix ; ce qui passe derrière : § Retenu, « Rangé derrière » | A, B, C, E |
| D-143 | En ligne dès 0 bloquant, puis testé sur la version en ligne, actionneurs sur « ZZ TEST — … » retirés ensuite (R42) | G |
| D-144 | Tout en ligne : hébergement, `aiTask` (`rangerCarnet`, `lireLien`), règles si G3 le demande ; deux fonctions exclues (R43) | B, G |

Décompte (compté par script sur les deux tableaux) : 145 lignes (D-47b ajoutée le 17.11, COUVERTURE manque 3 ; D-143 et D-144
ajoutées à la 2e passe). **91 D-n retenus couverts** par un lot ou par V (D-40 et D-72 ajoutés à la 4e passe, R48). S'y ajoutent
3 refus tenus par un contrôle d'absence ou par une forme réduite : D-55, D-83 (R37) et D-92. Les 13 autres retenus ne sont pas portés
ici :
- 6 hors port : D-44 et D-93 (port du calendrier, E36 et E40, vérifiés), D-6, D-45, D-48, D-49 (aucun port ouvert : suivi écrit
  par R49, V-suivi) ;
- 7 de méthode, sans objet dans l'app : D-82, D-84, D-87, D-88, D-90, D-94, D-95.
Le reste : 9 refusés sans lot, 24 remplacés, 5 idées à dessiner.

## Refusé

Rien de ceci n'entre dans l'app, même rangé :
- Onglets « En cours, Choisis » (K1), « ✓ choix » (K2), « ↓ 600 CHF » (K3) : D-55.
- Parcours à étapes ky et kz, formulaire, champ obligatoire, « étape n / m » (K4) : D-9.
- Fiche prix et caisse au premier plan, dossier de solutions (K5, s2a2) : D-12, D-14.
- Commande vocale mise en avant : onde, étapes, écran voix (CR-VOIX, D-83). Un petit micro dans le champ suffit.
- À venir déplacé dans le Calendrier (CR-AVENIR-CAL, CARNET-AVENIR-PLACE) : D-92.
- La flèche « écrivez ou collez ici » (D-108) ; les tuiles « quoi ? » (D-114) ; les écrans de lien à remplir à la main (D-117).
- La vue paysage du carnet (D-70) ; la fusion p5 (D-51) ; le parcours d'À venir kg1-3 (D-4) ; une étape « scan relié » visible (D-8).
- Les éléments écartés geste par geste dans ASSEMBLAGE.md (« + Créer », puces « L'IA range dans », « Corriger : Dans un carnet ▾ »,
  double bandeau, onglets soulignés, etc.).
- Un bloc « Façons possibles » proposé d'office par l'IA (D-66, `a_preciser`). Il n'est pas confirmé : il n'est pas mis en avant.

## Données

**Où vivent les données.** Toutes dans la collection `creativeItems`, **déjà permise** par les règles. `firestore.rules.template`
(lu, non modifié) l'inclut dans `collectionsMetier()` et y autorise read, create, update et delete pour un utilisateur autorisé.
**Aucune règle neuve attendue** ; ce n'est pas une affirmation mais une vérification : le critère G3 rejoue, à l'émulateur et sur
les règles construites par `build-rules.mjs`, la création, la lecture, la modification et la suppression d'un `carnet` et d'un
`carnet-message` (R43, D-144). S'il échoue, la règle manquante entre dans la mise en ligne (« tout »). Écriture **document par document** par `FirestoreRepo.put` et `FirestoreRepo.remove`, comme
`StorageService.addCreativeItem` et `updateCreativeItem`. **Jamais `saveCreativeItems`** : son `syncCollection` réécrit la liste et
peut effacer une idée créée sur un autre appareil (LIENS-APP § 4, cas AM-53).

**Local d'abord.** La couche locale de l'app est le cache persistant de Firestore (`persistentLocalCache`, IndexedDB,
`src/services/firebase.ts:73`). `firestoreRepo.ts` le dit : « C'est ce mécanisme qui remplace Dexie ». Une écriture hors ligne est
visible tout de suite, puis partira à la reconnexion. Dexie ne sert qu'aux magasins annexes (fiches, scénarios). Un second magasin
Dexie pour le carnet ferait une deuxième source, et donc des orphelins (LIENS-APP § 4). Décision : **pas de Dexie pour le carnet**.
Elle est réversible ; voir § Points ouverts 11, puisque le brief disait « Dexie local d'abord ».

**Modèle.** Deux types s'ajoutent à l'union `CreativeItem['type']` (`src/types/index.ts`), avec chacun un champ optionnel. Rien ne
migre.
- `type: 'carnet'` : **une idée**. `title` = titre ; `status` : `idea` (Idée), `research` (À comparer), `validated` (Choisi).
  `carnet` (version 1) contient :
  - `creeLe` et `phrase` (le message d'origine, cité « votre phrase en titre ») ;
  - `criteres[]` : `{ id, texte, raison?, caracteristique?: { nom, unite?, sens: 'plus' | 'moins' | 'oui-non' | 'texte' }, origine, messageId? }` ;
  - `facons[]` : `{ id, nom, etat: 'ouverte' | 'retenue' | 'ecartee', raison?, origine, messageId? }` ;
  - `articles[]` : `{ id, url?, domaine?, nom?, prixCentimes?, devise?, vendeur?, pays?, dispo?, photo?, faconId?, valeurs: { [nom]: { valeur, unite?, origine, luLe? } }, lecture: 'a-lire' | 'en-cours' | 'lue' | 'illisible', veille?: { active, depuis, releveLe? }, messageId? }` ; un article naît
    sans `veille` ; `releveLe` n'est écrit par aucun code de ce port (relève sous accord, R31) ;
  - `notes[]` : `{ id, texte, genre: 'a-acheter' | 'a-faire' | 'question' | 'conseil' | 'note', modifieeLe?, messageId?, groupe?: { id, libelle }, fusionDe?: string[] }`
    (`groupe` : « Regrouper », G27 ; `fusionDe` : textes d'origine gardés après une fusion, G11) ;
  - `archive?` : `{ le, raison }` (Suppression v2, D-47b) ;
  - `photos[]` : `{ id, jpeg (≤ 150 ko), messageId? }` ;
  - `choix?` : `{ articleId, faconId?, pourquoi, ecartes: [{ articleId, raison }], aRevoirSi?, le, remplaces: Choix[] }`. C'est l'ADR du
    CADRE : un choix revu passe dans `remplaces` et reste lisible.
  - `sortie?` : `{ planId, le }`. C'est le plan d'À venir créé par « Envoyer dans À venir ».
- `type: 'carnet-message'` : **un message du fil**. `title` = le texte brut tel quel, `status: 'done'`. `carnetMessage` contient
  `{ texte, le, depuis: 'liste' | <carnetId>, rangement: 'ia' | 'locale' | 'simulee' | 'brut', effets: [{ carnetId, cible, id }],
  titrePropose?: { carnetId, titre, applique? } }` (`titrePropose` : G29, R46).
  Le fil complet existe donc dans les données, même si l'écran ne le montre qu'en citations (R25).
- `origine` d'une valeur : `'vous' | 'ia' | 'page' | 'locale' | 'exemple'`. Elle s'affiche par un picto (Q19, provenance visible). Une
  valeur inconnue est **absente**, jamais 0 ni « ? » inventé.

**Lecture tolérante.** `lireCarnet(item)` et `lireMessage(item)` rendent `null` sur une forme inconnue : un autre appareil ou une
version future ne cassent rien.

**Les lecteurs existants à protéger** (relevés par grep, `src/`) :
- `src/domain/calendrier.ts`, `choseCreative` et `choseSansDate` : une idée sans date tomberait dans la poche « Sans date » du
  calendrier. On **exclut les deux types** (une condition, testée). Seule exception, `iconesIdees` (R48) : un `carnet` daté
  (`date` posée par le calendrier), non archivé, est une icône de sa semaine qui ouvre `{ ecran: 'carnets', id }` ; un carnet sans
  date n'y paraît jamais.

**Idée notée au calendrier (L1, R48).** `carnetDepuisPhrase(phrase, { id, le, date? })` (`modele.ts`, lot A) construit un document
`type: 'carnet'`, `status: 'idea'`, `title` = la phrase (première ligne), `date` = le lundi de la semaine si elle est donnée, et
`carnet` version 1 avec `creeLe`, `phrase`, et des listes vides : aucune valeur inventée, aucun appel d'IA. Pas de `carnet-message` :
l'écriture du calendrier reste **un seul document** (`Enregistrement`, `cible: 'creative'`, `collection: 'creativeItems'`), ce qui
garde son Annuler (`ecritures.ts`) et son écriture document par document. Le carnet se range ensuite comme un autre, quand il l'ouvre.
- `src/ui/atelier/atelierModel.ts` (`GENRE_DE_TYPE`) et `src/components/CreativeLabTab.tsx` (`VERS_ONGLET`) : ce sont des `Record`
  exhaustifs, que le compilateur force à compléter. Les deux types valent `null` ou le matériel : jamais dans les tiroirs de l'Atelier.
- `mergeUpgradePlans` (`src/domain/finance/upgrades.ts`) ne lit que `equipment` : pas d'effet. `DashboardTab` et `App` (comptage des
  tâches) ne lisent que `event` : pas d'effet. `src/services/search.ts` : à vérifier par le lot A.

**Annuler.** Chaque intention rend `{ ecritures, inverse }`. L'inverse remet la copie du document d'avant, ou retire le document créé.
Annuler redonne l'état identique (`toEqual`), hors ligne compris (Q18).

**Supprimer une idée (L33, D-47 ; Suppression v2, D-47b).** Son propre contenu part avec elle : articles (leur veille s'arrête), notes,
façons, photos. Les messages restent, avec un effet marqué « carnet supprimé ». Il n'y a jamais de cascade ni d'écriture vers un autre
module. L'écriture est journalisée par `StorageService.logAction`.
- `liensQuiRetiennent(carnet, plans, transactions, payments)` (lot A, `operations.ts`) rend la liste des liens :
  `{ sorte: 'plan-a-venir' | 'plan-realise', planId, libelle, reglage: 'detacher' | 'archiver' }[]`. Sans `sortie`, ou si
  `sortie.planId` manque dans `plans` : `[]`. Sinon un seul lien : `estRealise(plan, transactions, payments)` (importé de
  `src/domain/finance/upgradeRing.ts`, lecture seule) faux donne `plan-a-venir` / `detacher`, vrai donne `plan-realise` / `archiver`
  (la facture payée de CHOIX.md). `n` = leur nombre, 0 ou 1 dans ce port. Pas de sorte `stock` : aucune donnée ne relie le parc au
  carnet au 17.11 (R23, R47) ; pas de sorte `facture` à part : la facture se lit par le plan.
- `detacherPlan(carnetId)` : seulement si le lien est `plan-a-venir`. Le carnet oublie `sortie` ; **le plan n'est pas écrit**. Il garde
  `upgrade.sourceCarnetId` et `upgrade.sourceCarnetTitre` (écrit à l'envoi, lot D), et sa carte dit « du carnet <titre> · supprimé »
  quand le carnet manque. Sur un `plan-realise`, il est refusé (raison : « plan réalisé : archiver ») et n'écrit rien.
- `supprimerCarnet` est refusé tant que `n > 0` (raison : « n liens le retiennent », avec leurs libellés). À `n = 0`, il passe ;
  le texte de vérification (G36, « ni dans À venir, ni en commande ») est tiré de la même liste, jamais de l'IA.
- `archiverCarnet` : seule issue si le lien est `plan-realise`. Il pose `carnet.archive = { le, raison }` et **garde `sortie`** ; l'idée
  quitte la liste des carnets et se rouvre depuis la carte de Réalisés (`upgrade.sourceCarnetId`). Annulable comme toute intention.
- `deplacerArticles(depuis, vers, articleIds)` (G35) garde `veille.depuis` ; le carnet `vers` vient de `rattacher.ts`.

**Sortie vers À venir (C4).** « Envoyer dans À venir » crée un `FinancialPlan` d'achat de matériel par le service existant, avec un
champs optionnels `upgrade.sourceCarnetId` et `upgrade.sourceCarnetTitre` (le titre survit à une suppression, D-47b). La clé est idempotente : un deuxième envoi ne crée pas de doublon. La caisse ne s'affiche
jamais dans le carnet.

## IA

**Chemin.** Une tâche `aiTask` neuve, `rangerCarnet`, appelée côté client par `AiClient.run`. Elle est écrite et testée dans
`functions/src` par le lot B, puis **déployée par le lot G** avec `lireLien` (§ Accords : son accord est donné, D-144). Son drapeau, `src/config/carnetIA.ts`, est le patron de `rangerNoteIA.ts` :
- banc `?dev-local` ou `?preview=carnets` : toujours `simule` (réponse simulée, marquée « exemple ») ;
- `?ia=eteint` : rejoue le repli local ;
- production : `VITE_CARNET_IA=production`, posé au seul build de mise en ligne du lot G (accord donné, D-144). **Sans valeur, le mode est `eteint`** : jamais un appel Gemini par
  accident, ni en dev ni dans Vitest.

**Entrée** (contexte compact) : `{ texte, saisie (AAAA-MM-JJ), depuis: carnetId | null, carnets: [{ id, titre, criteres, facons, articles: [nom] }] }`.
Au plus 30 carnets, triés par dernière activité.

**Sortie imposée** (`responseSchema`) : `{ lignes: [{ sorte: 'idee' | 'critere' | 'facon' | 'article' | 'note', genre?: 'a-acheter' |
'a-faire' | 'question' | 'conseil' | 'note', texte, titre?, carnetId?, carnetNeuf?, raisonCarnet?, url?, prix?, devise?, quantite?,
unite?, magasin?, caracteristique?: { nom, unite?, sens }, consequence?, doublonDe?, commeCritere?, regrouperAvec?, titrePropose? }] }`, au plus 12
lignes. Les achats viennent en tête (D-128). Champs des aides (R40) : `doublonDe` = id d'une note connue (G11, G33) ; `commeCritere`
(booléen, sur une ligne `note` seulement, G25) ; `regrouperAvec` = ids de notes connues (G27). `consequence` (G26) est un texte de l'IA
**qui ne remplace jamais** la différence calculée par `comparer.ts` : il ne s'affiche que si elle existe, et ne cite que ses noms et
nombres. `titrePropose` (G29, R46) : seulement sur une ligne `sorte: 'idee'` dont le `carnetId` est connu, 60 caractères au plus,
différent du titre actuel ; il est gardé sur le message, jamais appliqué sans son geste. La garde rejette tout id inconnu et tout
champ d'aide hors de sa sorte. G8 et G9 n'ont pas de champ : ils sont calculés en local (`comparer.ts`, R44, R45). G35 et G36 n'ont pas de champ : ils sont calculés
(`rattacher.ts`, `liensQuiRetiennent`) et portent le picto local, pas le ✻ (Q19).

**Réglage des aides** (`src/config/carnetIA.ts`, lot B) : `aidesCarnet(mode, env)` rend `{ doublon (G11, G33), noteEnCritere (G25),
consequence (G26), regrouper (G27), renommerPropose (G29) }`. Banc (`simule`) : toutes vraies. Production et `eteint` : toutes fausses,
sauf `VITE_CARNET_AIDES=<liste>` posé après qu'il les a vues (§ Points ouverts 5). G30, G32, G35, G36, G37 ne passent pas par ce
réglage : G30, G32, G37 sont la règle J23 (Annuler dans la page), G35 et G36 font partie de Suppression v2, son choix. Le conteneur
`CarnetsVue.tsx` (lot D) lit le réglage et passe `aides` aux vues ; une vue n'affiche une aide que si `aides.<nom>` est vrai.

**Garde côté client** (`src/domain/carnets/ia.ts`, `lireReponse`), même rôle que celui de `rangerNote.ts`. La réponse devient des lignes
validées, ou `null`, et alors le repli local s'applique :
- `carnetId` doit être un id connu, sinon il devient `carnetNeuf` ;
- `url` doit figurer dans le texte : aucun lien inventé ;
- `prix` et `quantite` doivent figurer dans le texte, dans la page lue ou dans le texte du lien ;
- un champ inconnu est absent, jamais 0 ;
- une sorte hors de l'énumération est refusée ;
- les textes sont rognés à 300 caractères.

**Lecture d'un lien.** Une seconde tâche `aiTask`, `lireLien`, **sans modèle**, comme `assemblerLecture` (D380). Côté serveur, à cause
du CORS, elle réutilise `functions/src/brewerSuppliers.ts` : `supplierUrl`, `supplierRobotsAllowed`, schema.org `Product`/`Offer`
en ld+json, `stockStatus`. Elle lit aussi `og:title`, `og:image` et `<title>`. Elle rend nom, prix, devise, disponibilité, vendeur,
photo et les valeurs trouvées. Ce qu'elle ne lit pas reste vide (G16). Une page illisible laisse l'article « lien · page non lue »,
avec son domaine et Ouvrir ↗. Le repli par l'IA sur une page sans métadonnées n'est **pas** fait ici (accord).

**Repli hors ligne et sans IA** (`src/domain/carnets/analyseLocale.ts`). Il tourne instantanément et sert aussi d'aperçu « pendant »,
avant l'envoi (G3, G9, G14), sans un appel par frappe :
- découpe en lignes (retour, puces, « ; ») ;
- URL (motif, puis `new URL`) ;
- prix au format suisse (« 1'450.– », « 1 450 CHF », « CHF 690.- », « Fr. », « € »), par `parseDecimal` ;
- quantités dans une liste fermée d'unités (L, kg, °C, cm, mm, m³/h, W, kW, dB, bar, bacs, becs, fûts) ;
- genre par mots-clés (acheter, commander, prix → à acheter ; « ? » → question ; verbe en tête → à faire ; « penser à », « conseil »
  → conseil) ;
- carnet proche par `fuse.js`, sur les titres, critères et façons sans accents.
Le résultat porte `origine: 'locale'`, avec un picto distinct du ✻ de l'IA (Q19 : on ne fait pas passer le local pour de l'IA).

**Déroulé d'un envoi** (`src/ui/carnets/rangement.ts`) :
1. Aperçu local pendant la frappe : cadre « ↓ va atterrir ici ».
2. Envoi en 1 geste.
3. Le message est enregistré tout de suite, avec ses effets locaux.
4. L'IA tourne (« ✻ … » en cours ; ✕ annule par `AbortController`).
5. La garde valide la réponse.
6. Les effets sont remplacés par ceux de l'IA, en une seule écriture annulable.

Si l'IA est en panne, en délai dépassé ou hors ligne, les effets locaux restent et un avis bref le dit. Rien n'est perdu, et rien ne
bouge plus tard dans son dos : aucun rerangement automatique au retour du réseau.

**Rien d'irréversible sans aperçu annulable.** On voit avant (cadre), on peut annuler pendant (✕), et après il y a un bandeau
« ✓ … · Annuler » d'au moins 5 s, sans boîte de confirmation (Q18). Seule la suppression d'une idée demande une confirmation dans la
page (D-121), suivie d'un Annuler (G37).

**Tests, IA simulée.** Les réponses simulées de `src/domain/carnets/iaSimulee.ts` sont déterministes et marquées « exemple ». Elles
couvrent :
- embouteillage, frigo, ventilation, évier ;
- les trois notes de référence (R36), transcrites des images `ref/` ;
- les liens de la fixture ;
- une réponse hors schéma, une réponse vide, une panne.
Côté serveur, le schéma, la consigne, `assainir` et `lireLien` se testent sur du HTML en fichiers locaux, avec un `fetch` simulé.
**Aucun appel Gemini ni réseau dans `npm test`.**

## État de l'art

- Problème type : extraction d'entités et remplissage de champs dans un texte libre court (idée, article, prix, quantité, lien, tâche) ; sortie structurée d'un LLM sous schéma ; détection d'URL et de prix ; aperçu de lien (Open Graph, schema.org) ; correspondance floue vers une idée existante ; annulation d'écritures.
- Examiné : Gemini `responseSchema` (déjà utilisé : `rangerNote`, `scanInvoice`) ; zod et ajv (absents du package.json) ; linkifyjs et linkify-it (absents) ; WHATWG `URL` ; compromise et wink-nlp (absents, anglais) ; open-graph-scraper et metascraper (absents) ; cheerio (présent dans functions) et `brewerSuppliers.ts` ; fuse.js (présent : `search.ts`, `nomProche.ts`) ; Dexie (présent) contre le cache persistant de Firestore ; patron Commande avec inverse (`ui/calendrier/ecritures.ts`).
- Décision : schéma Gemini et garde déterministe écrite à la main, sur le patron testé de `rangerNote.ts` ; motifs et `new URL` pour les liens, `parseDecimal` pour les prix ; fuse.js pour le rattachement ; cheerio et `brewerSuppliers.ts` pour l'aperçu ; cache Firestore pour le local ; intentions avec inverse pour Annuler. **Aucune nouvelle dépendance.**

| Problème type | Méthode standard | Examiné | Décision |
|---|---|---|---|
| Extraction d'entités dans un texte libre | LLM à sortie imposée, puis revalidation déterministe ; repli à base de règles (motifs) quand le modèle manque | `rangerNote` (fonction et garde, testés) ; compromise et wink-nlp (anglais, nouvelle dépendance) | Tâche `rangerCarnet` avec garde `lireReponse` ; repli `analyseLocale` |
| Sortie structurée sous schéma | `responseSchema` (sous-ensemble OpenAPI) côté modèle, validation à la réception | zod et ajv (absents, ajout inutile pour un schéma plat) | Schéma dans `functions/src/carnetIA.ts`, garde manuelle testée champ par champ |
| Détection d'URL | Motif candidat, puis parseur WHATWG `URL` ; ponctuation finale retirée | linkifyjs et linkify-it (absents) | Motif + `new URL`, 20 cas de test (parenthèses, point final, `www.`, domaine `.ch` sans schéma) |
| Détection de prix | Motifs de format local, puis normalisation numérique | `Intl.NumberFormat` (ne lit pas) ; extracteurs de prix npm (absents) | Motifs suisses + `parseDecimal` (`src/ui/numericInput.ts`) ; le nombre doit être dans le texte |
| Quantités et unités | Nombre suivi d'une unité, prise dans une liste fermée | js-quantities (absent, trop large) | Liste fermée d'unités du métier |
| Rattachement à une idée | Recherche floue sur des textes normalisés (NFD, sans accents) | fuse.js (présent) | fuse.js, avec un seuil réglé sur une moitié des cas et jugé sur l'autre (L20) |
| Aperçu de lien | Open Graph et schema.org `Product`/`Offer`, côté serveur (CORS), robots.txt respecté | open-graph-scraper, metascraper (nouvelles dépendances) ; cheerio et `brewerSuppliers.ts` (présents) | Tâche `lireLien` sans modèle, sur `brewerSuppliers.ts` |
| Annuler | Patron Commande : chaque écriture porte son inverse (copie du document d'avant) | `ui/calendrier/ecritures.ts` (même patron) | `operations.ts` rend `{ ecritures, inverse }` |
| Clavier mobile | API `visualViewport`, champ ancré au bas visible | `useViewport.ts`, `FloatingActions.tsx`, `depense/defilement.ts` (présents) | Réutiliser `useViewport` ; mesure CARNET-CLAV |
| Local et hors ligne | Une seule source avec cache persistant | Dexie (seconde source) ; `persistentLocalCache` (en place) | Cache Firestore ; `put` par document |
| Photo | Réduction par canvas (`createImageBitmap`, `toBlob('image/jpeg')`) | — | ≤ 1 280 px, ≤ 150 ko, dans le document ; non lue par l'IA (accord) |
| Comparer | Pugh (comparer au favori), dominance de Pareto, tri par le critère, sans poids (CADRE) | somme pondérée, AHP (écartées par le CADRE) | `comparer.ts` (lot A) : tri lexicographique par les caractéristiques, dans l'ordre des critères ; « moins bien partout » = dominé au sens de Pareto sur les valeurs connues des deux articles (au moins 2 caractéristiques comparables) ; `Array.prototype.sort` stable |
| Quasi-doublon de notes courtes (G11, G33) | Normalisation (NFD, minuscules, mots vides retirés), puis similarité de jeux de mots (Jaccard) ou score flou, seuil réglé | fuse.js (présent) ; MinHash et simhash (pour de grands corpus, inutiles à 50 notes) | `doublons.ts` (lot A) : Jaccard sur jetons normalisés, départagé par fuse.js ; seuil réglé sur une moitié des paires, jugé sur l'autre (L20) |

## Lots

Ordre : **A**, puis **B et C en parallèle**, puis **D** ; **E** en parallèle dès le départ (aucun code) ; **F** après son choix.
Chaque lot travaille dans des fichiers disjoints. Les chemins partent de
`C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet/`.

Règles communes à tous les lots :
- Lire `.claude/rules/affinee-frontend.md` (lots C et D), DESIGN.md, `docs/ui-compacte.md`, ce § Retenu et ASSEMBLAGE.md (lot C).
  Baseline = plancher à enrichir (L07).
- Ne jamais toucher : `.codex/hooks.json`, `source4-portable-bundle-manifest-01.json`, `functions/.env` (ni le lire),
  `functions/.secret.local`, `firestore.rules`, `firestore.rules.template`, `.firebaserc`, `firestore.indexes.json`, le worktree
  port-calendrier.
- Interdits aux lots A à F : déploiement, push, `git stash`, données réelles, Gemini. La mise en ligne et le test en ligne sont le
  lot G, tenu par le pilote (accord donné le 17.11 au soir, D-143, D-144).
- Le code s'écrit avec Write ou Edit, jamais par heredoc ni `sed`.
- Après chaque lot : `git status --short`, et rien hors de Possède.
- Exigences transversales à recopier dans chaque VOIE.md : habit de l'app et couleur de zone Stocks, deux thèmes (THEME-APP) ; au plus
  40 mots au repos et rien sous 14 px (CARNET-LIS) ; champ au-dessus du clavier (CARNET-CLAV) ; au plus 2 gestes par ajout
  (CARNET-IA-AIDE) ; aucune valeur inconnue à 0 ; le simulé marqué « exemple ».

### Lot A — données, opérations, analyse locale

Possède :
- `src/domain/carnets/modele.ts` (types, constructeurs, `lireCarnet`, `lireMessage`, `estDocCarnet`, statut d'après le contenu) ;
- `src/domain/carnets/operations.ts` (intentions → `{ ecritures, inverse, avis }` : créer, ajouter des lignes, déplacer, changer de
  genre, modifier ou supprimer une note, renommer, supprimer une idée avec ses garde-fous, basculer la veille, choisir et revoir un
  choix, `planDepuisChoix` ; Suppression v2 : `liensQuiRetiennent`, `detacherPlan`, `archiverCarnet`, `deplacerArticles` ; aides :
  `fusionnerNotes` et `garderAPart` (G11), `noteEnCritere` (G25), `regrouperNotes` (G27)) ;
- `src/domain/carnets/analyseLocale.ts` et `src/domain/carnets/rattacher.ts` ;
- `src/domain/carnets/comparer.ts` (R26 : `tableau(carnet)`, `rangePar`, `moinsBienPartout`, `statutApres`, `difference(avant, apres)`)
  et `src/domain/carnets/doublons.ts` (G11, G33 : `doublonsDe(texte, notes)`, `notesEnDouble(carnet)`) ;
- `filDe(messages, carnetId | null)` dans `modele.ts` : les messages en ordre chronologique, ceux d'un carnet supprimé compris
  (données prêtes pour le lot F, R39) ;
- `src/domain/carnets/fixture.ts`. Quatre carnets « ZZ TEST — … » : Ventilation, Évier, Embouteillage, Frigo. Ils reprennent les
  contenus des figés, avec les prix marqués « exemple ».
- `src/services/carnetsStore.ts` : interface `MagasinCarnets` (`lire`, `ecouter`, `appliquer`), en deux implémentations, FirestoreRepo
  et mémoire (banc, tests) ;
- `src/types/index.ts` : seulement l'union de `CreativeItem['type']` et les deux champs optionnels ;
- `src/ui/atelier/atelierModel.ts` et `src/components/CreativeLabTab.tsx` : une entrée de `Record` chacun, rien d'autre ;
- `src/domain/calendrier.ts` : l'exclusion dans `choseCreative` et `choseSansDate` ; et pour R48, `'carnets'` ajouté à
  `CibleOuverture.ecran` et le `carnet` daté lu par `iconesIdees` ; rien d'autre ;
- `carnetDepuisPhrase` dans `modele.ts` (R48) ; `tests/unit/calendrier.test.ts` : seulement les cas de `iconesIdees` et de
  l'exclusion ;
- `tests/unit/carnetsModele.test.ts`, `carnetsOperations.test.ts`, `carnetsAnalyseLocale.test.ts`, `carnetsRattacher.test.ts`,
  `carnetsStore.test.ts`, `carnetsLecteurs.test.ts`, `carnetsComparer.test.ts`, `carnetsDoublons.test.ts`, `carnetsSuppression.test.ts`.

Critères :
- A1 `npx vitest run tests/unit/carnets*.test.ts` : tout vert. `npx tsc --noEmit` : vert.
- A2 Annuler : pour chaque intention, appliquer puis appliquer l'inverse redonne le magasin identique (`toEqual`).
- A3 Suppression v2 (D-47, D-47b), dans `carnetsSuppression.test.ts` :
  - `liensQuiRetiennent` (3e passe, cas possibles avec un seul `sortie.planId`) : 0 sans `sortie` ; 0 si `sortie.planId` manque dans
    les plans ; 1 `plan-a-venir` / `detacher` sur un plan sans dépense payée ; 1 `plan-realise` / `archiver` sur le même plan avec une
    dépense liée payée en entier (fixture : plan, transaction et paiement, `estRealise` vrai) ; jamais de sorte `stock` ni `facture` ;
  - plan à venir : `supprimerCarnet` refusé, raison « 1 lien le retient » et le libellé du plan ; `detacherPlan`, puis n = 0, puis
    `supprimerCarnet` passe ; **aucune écriture hors de `creativeItems`** (espion du magasin : 0 écriture sur un plan) ;
  - plan réalisé : `detacherPlan` refusé (raison « plan réalisé : archiver ») et n'écrit rien, `sortie` reste ; `supprimerCarnet`
    refusé ; `archiverCarnet` passe, garde `sortie`, l'idée sort de la liste lue par `lireCarnets` et garde tout son contenu ; son
    inverse la remet dans la liste (A2) ;
  - la suppression retire articles, notes, façons et photos ; les messages restent, effet « carnet supprimé » ;
  - chaque intention a son inverse (A2).
- A9 Comparer (`carnetsComparer.test.ts`), 12 cas écrits dans le test, 12 sur 12 :
  - 0 ou 1 article : `tableau` vaut `null` ; 2 articles : un tableau de 2 lignes ;
  - fixture Ventilation, critères « tient 80 °C » (oui-non) puis « débit » (plus, m³/h) : l'ordre attendu est écrit dans le test, et
    `rangePar` vaut « tient 80 °C d'abord, puis le débit » ;
  - un débit inconnu se range après les débits connus, et la cellule est vide (jamais 0) ;
  - un article dominé sur au moins 2 caractéristiques comparables porte « moins bien partout » ; avec une seule comparable, rien ;
  - une façon écartée et un article écarté restent dans le tableau, à la fin, avec leur raison (D-52) ;
  - `statutApres` : `idea` devient `research` au 1er article ; `validated` reste `validated` ;
  - `difference` : ajouter un 2e article rend « <nom> rangé, 2e » ; passer « fond de bac 38 cm » à 60 cm rend « <article> ne passerait
    plus » (G26) ; aucune différence ne cite un nombre absent des données.
- A10 Doublons (`carnetsDoublons.test.ts`) : 20 paires écrites (10 doublons reformulés, 10 voisines distinctes). Seuil réglé sur 10,
  jugé sur les 10 autres : au moins 4 doublons sur 5 trouvés, au plus 1 faux sur 5. Les chiffres vont dans RESULTAT.md.
- A11 Opérations des aides : `fusionnerNotes` garde les deux textes (`fusionDe`), rien n'est perdu ; `garderAPart` n'écrit rien d'autre
  que le message ; `noteEnCritere` retire la note et crée un critère au même texte et au même `messageId` ; `regrouperNotes` pose un
  même `groupe` ; `deplacerArticles` garde `veille.depuis`. Toutes ont leur inverse (A2). Veille (R31, 3e passe) : un article ajouté
  (texte, lien, note en vrac, IA simulée comprise) n'a pas de `veille` ; `basculerVeille` pose `{ active: true, depuis }` sans
  `releveLe`, et `grep -n "releveLe" src/domain/carnets/*.ts` ne montre aucune écriture (type et lecture seulement).
- A12 `filDe` : ordre chronologique, filtre par carnet, messages d'un carnet supprimé gardés et marqués.
- A13 G8 et G9, calcul local (`carnetsComparer.test.ts`, R44, R45) :
  - `critereQuiTranche` sur la fixture Ventilation, critère « plus de condensation au plafond » sans caractéristique, deux façons
    ouvertes : rend ce critère et « Hotte inox + extracteur », « Extracteur mural seul » ; un seul candidat : `null` ; une façon
    écartée n'est jamais proposée ;
  - `consequenceApercu` sur la fixture Évier, phrase « fond de bac 38 cm minimum » : « les articles seront rangés sur le fond de bac,
    38 cm au moins » ; caractéristique de `sens: 'moins'` : « au plus » ; phrase sans nombre : sans nombre ; aucune caractéristique
    voisine : `null` ; aucun nombre absent de la phrase tapée (vérifié sur les 30 phrases de A4).
- A14 Liens (`carnetsSuppression.test.ts`, R47) : `liensDe` rend `[]` sans `sortie` ; un plan non réalisé donne `a-venir` avec son
  libellé ; un plan réalisé, `realise` ; un `planId` absent des plans, `etat: 'supprime'` ; aucun champ de montant dans le résultat.
  `titrePropose` (R46) : `lireMessage` le lit, l'ignore s'il est mal formé ; `renommer` garde `avant` et a son inverse (A2).
- A15 Idée du calendrier (R48, D-40, D-72), dans `carnetsLecteurs.test.ts` et `calendrier.test.ts` :
  - `carnetDepuisPhrase("ZZ TEST — doseur de sucre", { date: mercredi de S47 })` rend `type: 'carnet'`, `status: 'idea'`, `title` et
    `carnet.phrase` égaux à la phrase, `date` = lundi de S47, `criteres`, `facons`, `articles`, `notes`, `photos` vides ; `lireCarnet`
    le relit ; sans date, pas de champ `date` ; phrase vide : refusée ;
  - `iconesIdees` : un `carnet` daté donne une icône de S47 avec `ouvre: { ecran: 'carnets', id }` ; un `carnet` sans date, archivé
    (`carnet.archive`) ou `done` : rien ; un `recipe-idea` daté garde son icône vers `atelier` (aucune migration) ;
  - `choseCreative` et `choseSansDate` rendent `null` pour un `carnet`, daté ou non (aucune rangée, aucune poche « Sans date »).
- A4 Analyse locale, sur 30 phrases écrites dans le test (embouteillage, frigo, ventilation, évier, et les trois notes `ref/`
  transcrites) :
  - URL et prix exacts sur 100 % des cas ;
  - aucun nombre qui ne figure pas dans la phrase ;
  - « 1'450.– » donne 145000 centimes ;
  - une phrase sans prix n'a pas de `prixCentimes`.
- A5 Rattachement : seuil réglé sur une moitié des phrases, jugé sur l'autre ; au moins 80 % de bons carnets proposés. Les chiffres
  sont écrits dans RESULTAT.md.
- A6 Lecteurs : `carnetsLecteurs.test.ts` prouve qu'un `carnet` et un `carnet-message` n'entrent ni dans `ModeleCalendrier` (posé ou
  sans date), ni dans les tiroirs de l'Atelier, ni dans `mergeUpgradePlans`, ni dans le compte des tâches. RESULTAT.md cite le
  `grep -rn "creativeItems\|getCreativeItems" src` et le sort de chaque lecteur.
- A7 Le magasin Firestore n'appelle jamais `saveCreativeItems` ni `syncCollection` (`grep` vide dans `carnetsStore.ts`).
- A8 Non-régression : `npx vitest run tests/unit/rangerNote.test.ts tests/unit/calendrier.test.ts tests/unit/ideesAtelier.test.ts
  tests/integration/carnetEnvoiIA.test.tsx` : vert.

### Lot B — IA (serveur écrit et non déployé, client, simulation, orchestration)

Possède :
- `functions/src/carnetIA.ts` (tâche `rangerCarnet` : schéma, consigne, `contexteRangerCarnet`, `assainirRangerCarnet`) ;
- `functions/src/lireLien.ts` (tâche sans modèle, sur `brewerSuppliers.ts`, avec délai, taille maximale et robots) ;
- `functions/src/ai.ts` : le branchement des deux tâches seulement, comme pour `rangerNote` ;
- `src/services/aiClient.ts` : `AiTaskId` reçoit les deux tâches ;
- `src/config/carnetIA.ts`, `src/domain/carnets/ia.ts`, `src/domain/carnets/iaSimulee.ts`, `src/ui/carnets/rangement.ts` ;
- `tests/unit/carnetsIA.test.ts`, `carnetsIAServeur.test.ts`, `carnetsLireLien.test.ts`, `carnetsRangement.test.ts` ;
- `tests/fixtures/carnets/*.html` (pages produits anonymisées : ld+json, Open Graph seul, sans métadonnées, robots refusé).

Critères :
- B1 `npx vitest run tests/unit/carnetsIA.test.ts tests/unit/carnetsIAServeur.test.ts tests/unit/carnetsLireLien.test.ts
  tests/unit/carnetsRangement.test.ts` : vert. `npx tsc --noEmit` : vert. `npm --prefix functions run build` : vert, si le script
  existe ; sinon `npx tsc -p functions` (citer la commande).
- B2 Garde : la réponse refuse un `carnetId` inconnu (il devient `carnetNeuf`), une URL absente du texte, un prix absent du texte ou de
  la page, une sorte inconnue, plus de 12 lignes. Une réponse hors schéma, vide ou en panne donne `null`, et le repli local s'applique.
- B3 Mode : `modeDe(undefined, false, false)` vaut `eteint`. Vitest ne touche jamais `AiClient.run`, prouvé par un espion à 0 appel
  dans tous les tests du lot.
- B4 `lireLien` : la page ld+json donne nom, prix, devise et disponibilité ; la page Open Graph seule donne nom et photo, sans prix ;
  la page sans métadonnées donne `illisible` et rien d'inventé ; robots refusé donne aucun `fetch` de la page.
- B5 Orchestration : les états `apercu`, `en-cours`, `range`, `echec` et `hors-ligne` se suivent selon le test. Annuler pendant
  `en-cours` coupe l'appel et n'écrit rien de plus. En échec, les effets locaux restent et le message est gardé.
- B6 Notes `ref/` : les trois notes simulées rendent des lignes typées, achats en tête (D-123, D-124, D-126). Une phrase de frigo, de
  ventilation et d'évier rend des caractéristiques différentes, sans gabarit dans le code : `grep -n "frigo\|évier\|ventil"
  src/domain/carnets/*.ts`, hors `iaSimulee.ts` et `fixture.ts`, est vide (C2).
- B7 Aides (R40) et D-35 :
  - garde : un `doublonDe` ou un `regrouperAvec` qui cite une note inconnue est retiré ; `commeCritere` sur une sorte autre que `note`
    est retiré ; une `consequence` qui cite un nombre absent du carnet est retirée ;
  - réglage : `aidesCarnet('simule', {})` rend les cinq aides vraies ; `aidesCarnet('production', {})` et `aidesCarnet('eteint', {})`
    les rendent fausses ; `VITE_CARNET_AIDES=doublon` n'allume que `doublon` ;
  - simulation : `iaSimulee.ts` rend un cas de chaque aide (doublon, note → critère, conséquence, regrouper), marqué « exemple » ;
  - D-35 : un `vendeur` absent du texte et de la page lue est retiré (aucun fournisseur inventé) ;
  - G29 (R46) : `titrePropose` sur un `carnetId` inconnu, sur une sorte autre que `idee`, identique au titre actuel ou de plus de 60
    caractères est retiré ; `iaSimulee.ts` rend le cas « 2 bacs pour laver les fûts » sur le carnet Évier, marqué « exemple ».
- B8 Prêt pour le lot G : `functions/src/ai.ts` exporte `aiTask` avec les deux tâches ; `npm --prefix functions run build` vert ; aucune
  modification de `dispatchBrewerHopAdviceV1` ni de `notifyBrewerHopAdviceAnswerV1` (`git diff --stat` sur leurs fichiers : vide).

### Lot C — écrans et gestes

Possède (tous nouveaux, classes préfixées `cn-`) :
- `src/ui/carnets/ListeCarnets.tsx` (R01, R02 ; G1, G2, G13, G37 ; R11 : le carnet créé paraît en tête) ;
- `CarnetOuvert.tsx` (R03, R12 ; ✎ titre, pastilles « lié à » ; R11 : G5 Ce qui compte rempli d'emblée, G6 ligne « Le champ en bas
  range tout ici » ; R17 : carte rangée dans sa façon, G19 ; G33 marque « doublon ? » si `aides.doublon`) ;
- `CarteArticle.tsx` (R04 ; R17 : carte complète, « tient 80 °C : oui », « veille demandée » si allumée, R31), `FicheArticle.tsx` (R05,
  bascule de veille, ligne « demandée · pas encore relevée » tant que `releveLe` manque, R31),
  `Comparer.tsx` (R06 ; R17 : G20, le tableau né au 2e article, reçu en props de `comparer.ts`), `Choisir.tsx` (R07) ;
- `ChampCarnet.tsx` (champ unique, envoi, 📷, petit 🎤 par `src/ui/atelier/dictee.ts` en lecture seule, puce « Coller : … »,
  `visualViewport` ; R11 : G7 « Ajouter à <titre>… ») ;
- `CadreArrivee.tsx` (R10, R13, R15, R16 : squelette, puces de progression, ✕ ; G11 « Même chose que la note du … · Garder à part » et
  G27 « Même visite : … · Regrouper », si `aides.doublon` et `aides.regrouper`) ;
- `Bandeau.tsx` (après, avec Annuler : R11 « ✓ Carnet créé · ↺ Annuler », « votre phrase en titre » ; R14 « ✓ Rangé ici · Annuler »,
  sa phrase citée ; R17 « <nom> rangé, 2e · Annuler » (G20) et G21 « Rangé dans <carnet> · Annuler », avec la raison et Déplacer ;
  R19 « ✓ n lignes rangées dans n carnets · Annuler » ; G26 conséquence, si `aides.consequence` ; G37) ;
- `LigneRangee.tsx` (R14 : la ligne rangée et G12, trois corrections d'un toucher, « Votre texte · Déplacer · Changer en note » ; G13
  partiel : la ligne qui s'éclaire est rendue par `ListeCarnets.tsx`) ;
- `NoteEnVrac.tsx` (R18, R19 : lignes typées, « › Texte d'origine ») ;
- `FeuilleNote.tsx` (R20, R22 ; G25 « ✻ Ressemble à un critère · Passer en Ce qui compte » si `aides.noteEnCritere`) ;
- `RenommerCarnet.tsx` (R21) ;
- `SupprimerCarnet.tsx` (R23, Suppression v2 : compteur « n liens le retiennent », un réglage par lien, Supprimer grisé tant que n > 0
  puis allumé ; plan à venir : « Garder le plan sans ce carnet » ; plan réalisé : « Archiver » seul, sans « Garder le plan… » ; G34 ;
  G35 « Déplacer » ; G36 « ni dans À venir, ni en commande », picto local) ;
- `Photos.tsx` et `photo.ts` (rubrique Photos, masquée vide ; vignette « photo non lue » ; réduction par canvas à 1 280 px et 150 ko,
  § Points ouverts 8) ;
- `EtatIA.tsx` (en cours, échec, hors ligne, pictos de provenance) ;
- `carnets.css` ;
- `tests/unit/carnetsEcrans.test.tsx`.

Contrat : les vues sont contrôlées par props. Elles reçoivent les carnets, les messages, l'état du rangement et des rappels
d'intention. Elles ne lisent aucun magasin.

Critères :
- C1 `npx vitest run tests/unit/carnetsEcrans.test.tsx` : vert. Il couvre :
  - chaque écran figé (texte clé présent) ;
  - aucune signature refusée dans le DOM : K1 à K4 par les regex de `maquettes.json`, « quoi ? », « Étape » ;
  - le C1 de `maquettes.json` (« n façons · n articles ») ;
  - une valeur inconnue jamais rendue « 0 ».
- C2 Inventaire : RESULTAT.md met en tableau chaque élément visible de chaque image figée et de chaque base de geste. Pour chacun, il
  donne sa place dans le code, « porté », ou « non porté » avec sa raison (L03). Une greffe d'ASSEMBLAGE sans ligne fait échouer le
  critère.
- C3 Rendu : une capture de chaque figé est prise et **ouverte**, côte à côte avec son image, à 390 en thème clair. Au-delà de 3
  captures, `DEMANDE EXECUTANT` (la série complète est en D et en V).
- C4 Mesures à 390 au repos : au plus 40 mots, aucun texte sous 14 px, contraste ≥ 4,5:1 (CARNET-LIS). Clavier simulé de 300 px : le
  champ et la dernière note restent visibles (CARNET-CLAV).
- C5 Cibles ≥ 44 px, sans voisine à moins de 8 px (Q4). Le rouge est réservé à Supprimer et à l'alerte (Q12).
- C6 Aides et Suppression v2, dans `carnetsEcrans.test.tsx` :
  - chaque aide (G11, G25, G26, G27, G33) rend son texte d'ASSEMBLAGE avec `aides.<nom>` vrai, et rien de ce texte avec `aides` faux ;
  - G26, G35 et G36 portent le picto local, jamais le ✻ (Q19) ;
  - `SupprimerCarnet` : avec 1 lien `plan-a-venir`, « 1 lien le retient », « Garder le plan sans ce carnet » et Supprimer `disabled` ;
    après le réglage, Supprimer actif ; avec 1 lien `plan-realise`, « Archiver » présent, « Garder le plan sans ce carnet » absent et
    Supprimer absent ou `disabled` ; aucun texte « stock » rendu.
  - veille (R31, D-28, 3e passe) : `FicheArticle` sans `veille` : bascule éteinte, aucune ligne d'état ; avec `veille.active` et sans
    `releveLe` : « Veille du prix, tous les 3 jours » et « demandée · pas encore relevée », aucune date ni prix relevé ni baisse ;
    `CarteArticle` : « veille demandée », jamais « veille » seul ni « active » ; libellé et place de g5:v06-10 inchangés.
  - G8 (R44) : `ChampCarnet` avec `suggestion` rend la bulle et le picto local, sans ✻ ; un toucher remplit le champ ; sans
    `suggestion`, rien ;
  - G9 (R45) : `CadreArrivee` avec `consequence` rend le texte sous le cadre ; sans, rien ;
  - G29 (R46) : `RenommerCarnet` avec une proposition et `aides.renommerPropose` vrai : champ prérempli, « ✻ proposé d'après « … » ·
    avant : « … » » ; avec `aides.renommerPropose` faux : le titre actuel, rien de proposé ;
  - pastilles (R47) : `CarnetOuvert` avec 0 lien, aucune pastille ; avec 4 liens, 3 pastilles et « +1 » ; un lien `supprime` dit
    « supprimé » ; l'aperçu s'ouvre sur place et ne montre aucun montant ;
  - G30 et G32 (`Bandeau.tsx`) : « ✓ Renommé · avant : <titre> · Annuler » et « Note supprimée · Annuler », chacun à la place de
    l'élément, sans boîte de confirmation (Q18).
  C2 nomme, pour R11, R14, R17, R19 et Photos, le composant qui porte chaque élément ; une ligne sans composant fait échouer C2.

### Lot D — assemblage, navigation, sortie, banc

Possède :
- `src/ui/carnets/CarnetsVue.tsx` (conteneur : magasin, rangement, navigation interne liste ↔ carnet ↔ article ↔ comparer ↔ choisir,
  Annuler, `navigator.onLine` ; appelle `comparer.ts` et passe le tableau à `Comparer.tsx` ; lit `aidesCarnet` et passe `aides` aux
  vues ; lit les plans, les transactions et les paiements pour `liensQuiRetiennent` et `liensDe`) ;
- `src/components/tabs/StocksTab.tsx` : le sous-onglet Matériel reçoit le segment figé « À venir · Carnets · Réalisés ». À venir et
  Réalisés rendent l'`UpgradeWorkspace` existant. Le parc reste atteignable : § Points ouverts 1.
- `src/App.tsx` (« Ouvrir le carnet » depuis À venir, + volant), `src/domain/plusEcran.ts` (écran `carnets`, action principale
  « Nouvelle idée » = focus du champ, aucune porte en double), `src/components/navigation/PlusSheet.tsx` si nécessaire ;
- `src/ui/finance/UpgradeWorkspace.tsx` : carte « Ajouté le … · du carnet X · Ouvrir le carnet » (R08) ; « du carnet X · supprimé »
  sans Ouvrir quand le carnet manque ; « Ouvrir le carnet » sur une carte de Réalisés rouvre une idée archivée (D-47b) ; rien d'autre ;
- `src/domain/finance/types.ts` : `upgrade.sourceCarnetId?` et `upgrade.sourceCarnetTitre?` seulement ;
- `src/main.tsx` et `src/design/CarnetsPreview.tsx` : banc `?preview=carnets`, dev seulement. Il prend le magasin mémoire, l'IA
  simulée et la fixture « ZZ TEST — … ». Paramètres : `&vide=1`, `&hors-ligne=1`, `&ia=eteint`, `&ia=echec`, `&ia=lent`, `&theme=sombre`,
  `&aides=0` (aides éteintes, comme en production), `&taches=1` (D-36 : un bandeau de 5 tâches, chacune chronométrée du premier
  toucher au « ✓ », temps gardés en `localStorage` et copiables en texte ; tâches : créer « embouteillage », ajouter un lien, ajouter
  une note en vrac, comparer et choisir avec son pourquoi, retrouver ce pourquoi).
- `tests/integration/carnetsParcours.test.tsx`.
- L1 livré (R48) : `src/domain/calendrierAjout.ts`, `enregistrementIdee` seulement (construit par `carnetDepuisPhrase`, même
  `Enregistrement`, commentaire E36 corrigé) ; `src/components/tabs/CalendrierTab.tsx`, seulement l'ouverture d'une cible
  `carnets` (prop `onOpenCarnet(id)`, fournie par `App.tsx` : Stocks › Matériel › Carnets, ce carnet ouvert) ; aucun texte, aucune
  feuille, aucune place du calendrier ne change ; `tests/unit/calendrierAjout.test.ts`, seulement le cas E36. Le worktree
  port-calendrier n'est pas touché : la correction vit sur cette branche, au-dessus de 40d11da1f.

Critères :
- D1 `npx tsc --noEmit`, `npx vitest run tests/unit/carnets*.test.ts* tests/integration/carnetsParcours.test.tsx`, `npm run build` :
  verts. `grep -c "preview=carnets\|CarnetsPreview" dist/assets/*.js` vaut 0 (le banc est absent du paquet).
- D2 CARNET-COEUR dans `carnetsParcours.test.tsx`, sur le magasin mémoire **vide**, IA simulée :
  - créer « embouteillage » ;
  - deux façons ;
  - le critère « minimiser l'oxygène » ;
  - 6 liens ;
  - une note ;
  - comparer ;
  - choisir avec son pourquoi ;
  - retrouver le pourquoi ;
  - puis frigo, ventilation et évier.
  Chaque ajout compte au plus 2 gestes, comptés dans le test.
- D3 Sortie : « Envoyer dans À venir » crée un seul plan (idempotent). Il apparaît dans À venir avec « du carnet … ». « Ouvrir le
  carnet » rouvre le bon carnet.
- D4 Navigation : depuis le menu, Stocks › Matériel › Carnets s'atteint dans l'app réelle (`?dev-local`), pas seulement au banc. À
  venir n'est jamais sous Calendrier (CARNET-AVENIR-PLACE).
- D5 Non-régression : `npx vitest run tests/integration/AppRoutePile.test.tsx tests/integration/FloatingActions.behavior.test.tsx` et
  les tests de Stocks touchés : verts.
- D6 Le serveur de dev est lancé, capturé, puis arrêté. Aucun processus laissé.
- D7 Aides et Suppression v2 branchées (`carnetsParcours.test.tsx`) : au banc, « Passer en Ce qui compte » paraît sur une note de la
  fixture ; avec `&aides=0` et dans l'app sans `VITE_CARNET_AIDES`, il est absent. Supprimer une idée envoyée dans À venir : « 1 lien
  le retient », « Garder le plan sans ce carnet », Supprimer s'allume, l'idée part, le plan reste dans À venir avec « du carnet … ·
  supprimé ». Idée dont le plan a une dépense payée (fixture « ZZ TEST — … ») : « Archiver » seul, l'idée quitte la liste, Réalisés ›
  « Ouvrir le carnet » la rouvre. `grep -c "VITE_CARNET_AIDES" dist/assets/*.js` vaut 0. `CarnetsVue.tsx` calcule `critereQuiTranche`,
  `consequenceApercu` et `liensDe` et les passe en props (`suggestion`, `consequence`, `liens`) ; au banc, la fixture Ventilation
  montre la bulle G8 et l'idée envoyée dans À venir montre sa pastille « À venir · … » (R44, R45, R47).
- D8 Tâches chronométrées (D-36, R41) : l'exécutant joue les 5 tâches de `&taches=1` à 390 tactile ; RESULTAT.md donne le temps et le
  nombre de gestes de chacune (au plus 2 gestes par ajout). Le mode est absent du paquet (D1). Le jeu sur son téléphone, par le réseau
  local et sans déploiement, lui est proposé avec la page de la voie E.
- D9 Idée du calendrier (R48, D-40, D-72), dans `carnetsParcours.test.tsx` (app montée, magasin mémoire) puis au doigt dans
  `?dev-local` :
  - Calendrier › + volant › « Noter une idée en S47 » › « ZZ TEST — doseur de sucre » › Ajouter : le magasin compte un `carnet`
    de plus et **aucun** `recipe-idea` de plus ; Stocks › Matériel › Carnets le montre en état Idée, sa phrase en titre ;
  - appui long sur la semaine S48 de la bande (L1 b) : même résultat, `date` au lundi de S48 ;
  - au calendrier, l'icône d'idée paraît en S47, sans rangée ni case ; un toucher l'ouvre dans Carnets ;
  - Annuler (calendrier) retire le carnet et l'icône ; Atelier › Bières n'a rien reçu ;
  - `grep -n "'recipe-idea'" src/domain/calendrierAjout.ts` : vide ; `npx vitest run tests/unit/calendrierAjout.test.ts
    tests/unit/calendrier.test.ts tests/integration/calendrierEntete.test.tsx` : vert.

### Lot E — le fil et comparer des idées : mini maquettes (D-142, R39)

Pourquoi : D-142 prime (« un chat, … c'est tout et ça permet de comparer les idée ») et aucun écran ne dessine le fil visible ni la
comparaison de deux idées. Sans voie, le port livrerait un carnet structuré, pas un chat (COUVERTURE, manque 2). Un choix ouvert se
montre en mini maquettes (L24, D126) ; le lot E ne touche pas au code et tourne en parallèle des lots A à D.

Concepteur Opus (L25). Possède : `work/missions/2026-11-17-port-carnet/voies/E/` (planches HTML statiques, captures, page de choix).
Base : son habit figé (R01, R03, R06 ; ra-p5f choisie), plancher à enrichir (L07). Le fil se greffe sur le figé, il ne le remplace pas.

Livrable : une page de choix, artefact neuf et daté, une section par choix, chaque variante à côté de sa référence figée :
1. **Le fil** (5 variantes) : où ses messages restent visibles comme un chat (fil du carnet sous les rubriques ; fil seul avec les
   rubriques repliées ; « Dernier dépôt » de g4:base-E06 ; fil de g5:v07-9 ; fil global sur la liste). Chacune garde le champ en bas et
   les citations de R25.
2. **Comparer deux idées** (4 variantes) : par exemple deux carnets côte à côte sur leurs critères communs, sur le prix du choisi, sur
   l'avancement ; la lecture étroite (le Comparer figé R06) est l'une d'elles.
3. **Le parc dans Stocks › Matériel** (3 variantes ; § Points ouverts 1) : segment « Parc » en tête, parc sous Réalisés, parc en ligne
   de tête.
4. **Les aides de l'IA** (une paire avec et sans, par aide : G11, G25, G26, G27, G29, G33) et **D-66** (ses deux lectures : bloc
   « Façons possibles » absent, ou replié et proposé). Ce qu'il allume passe dans `VITE_CARNET_AIDES`.
Au total 12 à 16 mini maquettes (L18) ; chaque page dit ce qu'on attend de lui, sans code (D307).

Critères :
- E1 `node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs` (règle n° 1, depuis la racine Brasserie) : vert sur chaque planche.
- E2 `node work/refonte-frontend/v4/tournoi/outils/controle-page-choix.mjs` (D126) sur la page : vert.
- E3 Chaque variante montre son habit figé intact (en-tête L'Affinée, segment Stocks, champ en bas) ; aucune signature refusée (K1 à
  K4, « quoi ? », « Étape »).
- E4 Captures de chaque planche à 390, **ouvertes**, côte à côte avec la référence ; au-delà de 3, `DEMANDE EXECUTANT`.
- E5 RESULTAT.md donne l'adresse de la page, la liste des variantes et ce qui passerait derrière dans chacune.

Échéance : la page lui est montrée avant les captures finales de V et avant toute demande d'accord (§ Accords). Elle ne bloque pas
les lots A à D.

### Après son choix — lot F (port de ses variantes choisies)

Quand il choisit, ses mots vont dans SPEC (L13), « <id> choisie : ses mots » dans ce fichier, puis le lot F porte la variante :
- fil : `src/ui/carnets/FilCarnet.tsx`, branché par `CarnetsVue.tsx`, sur `filDe` (A12) ; aucune donnée neuve (`carnet-message`) ;
- comparer deux idées : `src/domain/carnets/comparerIdees.ts` (sur `comparer.ts`) et `src/ui/carnets/ComparerIdees.tsx` ;
- parc : `StocksTab.tsx` ;
- aides : la liste de `VITE_CARNET_AIDES` ; D-66 : selon sa lecture.
S'il choisit la lecture étroite (citations, Comparer figé), F ne porte rien et le défaut reste. Critères de F : ceux de C et D sur ses
nouveaux composants, plus `controle-choix.mjs` contre la variante choisie. F est écrit dans un VOIE.md neuf au moment de son choix.
**Condition de clôture** (COUVERTURE, mineur 8) : D-142 prime et n'est portée en entier que par F. La mission ne se clôt pas tant
que la page de la voie E ne lui a pas été montrée et que F n'est ni porté ni rendu sans objet par son choix de la lecture étroite. La
mise en ligne du lot G n'attend pas F (D-143 : « dès 0 bloquant ») ; F part en ligne à son tour par le même lot G.

### Lot G — mise en ligne entière et test sur la version en ligne (D-143, D-144 ; R42, R43)

Pourquoi : son accord est donné (SPEC, 17.11 soir) : « Parfait une fois en ligne puis testé sur la version en ligne » ; « Pourquoi que
le front ? Non tout ?? ». Sans ce lot, le port finirait sur un banc que la demande dépasse.

Tenu par le pilote (gestes externes), avec un exécutant Haiku pour le jeu en ligne et les captures. Possède :
`scripts/check-carnets-emulator.mjs` (patron `scripts/check-invoice-journey-emulator.mjs`), `work/missions/2026-11-17-port-carnet/voies/G/`
(RESULTAT.md, captures, `journal-gemini.md`). Ne touche aucun fichier des lots A à F : un constat revient au lot qui possède le fichier.

Ordre :
1. Prérequis : lots A à D rendus OK, critères rejoués par le pilote, critique sur les captures de V sans bloquant ouvert, page de la
   voie E montrée (son choix n'est pas attendu ; § Points ouverts 2). « 0 bloquant » = aucune ligne ouverte de ce port dans BUGS.md
   marquée bloquante.
2. Règles (G3) à l'émulateur ; une règle neuve seulement si G3 échoue, dans `firestore.rules.template`, par une voie neuve qui le possède.
3. Coût Gemini (G2) mesuré avant le build.
4. Build de production : `VITE_CARNET_IA=production`, `VITE_CARNET_AIDES` absent (R43).
5. `npm run deploy` (règles, fonctions, hébergement) : `firebase deploy --only functions` déploie tout le code de `functions/` ; les
   deux fonctions exclues ne doivent pas changer (G1). Si le déploiement complet les toucherait, déployer par
   `--only functions:aiTask` puis hébergement et règles séparément.
6. Jeu sur la version en ligne (G4 à G6), puis retrait des « ZZ TEST — … ».
7. Blocage (connexion, quota, outil) : le pilote passe par une autre session ou une autre solution, sans attendre le brasseur (D-143),
   et l'écrit dans RESULTAT.md.

Critères :
- G1 Périmètre : `git diff --stat main -- functions/src` ne touche ni le fichier de `dispatchBrewerHopAdviceV1` ni celui de
  `notifyBrewerHopAdviceAnswerV1` ; la sortie de `firebase deploy` est gardée et ne les nomme pas en « update » ; `found N files` et la
  page servie (hash du `index-*.js`) sont lus et égaux au `dist/` construit (L17).
- G2 Coût : `rangerCarnet` simulé hors réseau ne mesure pas le prix ; le coût par message est estimé sur les jetons d'entrée et de
  sortie des 3 notes `ref/` et des 4 phrases de la fixture (taille du contexte compact, tarif Flash-Lite cité avec sa source et sa
  date), écrit dans RESULTAT.md comme « estimé » (L20), puis mesuré sur les appels réels du jeu en ligne (G5).
- G3 Règles : `node scripts/check-carnets-emulator.mjs` sous émulateur Firestore, sur les règles construites par
  `node scripts/build-rules.mjs` : un utilisateur autorisé crée, lit, modifie et supprime un `carnet` et un `carnet-message` dans
  `creativeItems` (8 gestes) ; un utilisateur non autorisé est refusé sur les 8. Sortie attendue : `REGLES CARNET OK 16/16`.
- G4 Lecture seule en ligne : à l'adresse de production, Stocks › Matériel › Carnets s'ouvre depuis le menu, à 390 tactile et 1280,
  deux thèmes ; la console n'a aucune erreur ; les carnets et plans existants du brasseur ne sont ni lus en écriture ni modifiés.
- G5 Actionneurs en ligne, sur « ZZ TEST — … » seulement : créer, ajouter un texte, un lien, une note en vrac, modifier et renommer
  une note et l'idée, comparer, choisir avec son pourquoi, envoyer dans À venir, Suppression v2 (détacher, supprimer), Annuler. Gemini
  réel : 8 messages au plus, journalisés (heure, tâche, durée, jetons, coût) dans `voies/G/journal-gemini.md` ; `lireLien` sur 2 pages
  publiques au plus. Puis retrait de chaque « ZZ TEST — … » (idées, messages, plan d'À venir) ; une recherche « ZZ TEST » dans
  l'app en ligne ne rend plus rien.
- G6 Captures du jeu en ligne **ouvertes**, côte à côte avec celles du banc ; critique, puis pilote : « combien et quels problèmes ? ».
  Chaque constat est versé à `work/missions/BUGS.md` (L05). Au-delà de 3 captures : `DEMANDE EXECUTANT`.

## Voies

| Voie | Objectif | Niveau | Agent | Modèle | Plafond | Possède | Dépend de | Contrôles | Décideur | Étape |
|---|---|---|---|---|---|---|---|---|---|---|
| A | Données, opérations, analyse locale du carnet | jugement | auteur | sonnet | 100 | src/domain/carnets/modele.ts, src/domain/carnets/operations.ts, src/domain/carnets/analyseLocale.ts, src/domain/carnets/rattacher.ts, src/domain/carnets/fixture.ts, src/services/carnetsStore.ts, src/types/index.ts, src/ui/atelier/atelierModel.ts, src/components/CreativeLabTab.tsx, src/domain/calendrier.ts, tests/unit/carnets*.test.ts, tests/unit/calendrier.test.ts | — | A1 à A15 | pilote | reprise |
| B | IA : rangerCarnet et lireLien écrits (non déployés), garde, simulation, orchestration | jugement | auteur | sonnet | 100 | functions/src/carnetIA.ts, functions/src/lireLien.ts, functions/src/ai.ts, src/services/aiClient.ts, src/config/carnetIA.ts, src/domain/carnets/ia.ts, src/domain/carnets/iaSimulee.ts, src/ui/carnets/rangement.ts, tests/unit/carnetsIA*.test.ts, tests/unit/carnetsLireLien.test.ts, tests/unit/carnetsRangement.test.ts, tests/fixtures/carnets/ | A | B1 à B8 | pilote | reprise |
| C | Écrans figés et gestes du carnet | jugement | auteur | opus | 120 | src/ui/carnets/ (sauf rangement.ts et CarnetsVue.tsx), tests/unit/carnetsEcrans.test.tsx | A | C1 à C6 | pilote | reprise |
| D | Assemblage, Stocks › Matériel, sortie À venir, + volant, banc, réglage des aides, tâches chronométrées, idée du calendrier livrée au carnet (R48) | jugement | auteur | sonnet | 100 | src/ui/carnets/CarnetsVue.tsx, src/components/tabs/StocksTab.tsx, src/App.tsx, src/domain/plusEcran.ts, src/components/navigation/PlusSheet.tsx, src/ui/finance/UpgradeWorkspace.tsx, src/domain/finance/types.ts, src/main.tsx, src/design/CarnetsPreview.tsx, src/domain/calendrierAjout.ts, src/components/tabs/CalendrierTab.tsx, tests/unit/calendrierAjout.test.ts, tests/integration/carnetsParcours.test.tsx | A, B, C | D1 à D9 | pilote | reprise |
| E | Fil de chat, comparer deux idées, parc et aides de l'IA : mini maquettes et page de choix (D-142) | conception | concepteur | opus | 80 | work/missions/2026-11-17-port-carnet/voies/E/ | — | controle-choix.mjs, controle-page-choix.mjs, E1 à E5 | brasseur | reprise |
| G | Mise en ligne entière (hébergement, aiTask, règles si G3 le demande) et jeu sur la version en ligne (D-143, D-144) | mécanique | executant | haiku | 40 | scripts/check-carnets-emulator.mjs, work/missions/2026-11-17-port-carnet/voies/G/ | A, B, C, D | G1 à G6 | pilote | reprise |

La voie F n'a pas de ligne : son VOIE.md s'écrit à son choix (page de la voie E), avec ses fichiers et ses contrôles ; sa
condition de clôture est en § Lots, F, et en § Vérification, « Clôture » (3e passe, flou 2).

## Vérification

Commandes (racine du worktree port-carnet) :
- `npx tsc --noEmit` ;
- `npx vitest run tests/unit/carnets*.test.ts* tests/integration/carnetsParcours.test.tsx` ;
- non-régression : `npx vitest run tests/unit/rangerNote.test.ts tests/unit/calendrier*.test.ts tests/unit/ideesAtelier.test.ts
  tests/unit/port-q*-carnet.test.tsx tests/integration/carnetEnvoiIA.test.tsx` ;
- `npm run build` ;
- `node scripts/check-build-flags.mjs` : le drapeau du carnet est absent du paquet, donc éteint.

Bancs :
- `npm run dev`, puis `http://localhost:<port>/?preview=carnets`. C'est le banc, avec la fixture « ZZ TEST — … », l'IA simulée et le
  bandeau « Banc — données simulées ».
- `?dev-local` : l'app réelle, sur les émulateurs. On y joue le chemin du menu, Stocks › Matériel › Carnets, sur des données « ZZ TEST
  — … » créées puis retirées.
- Le serveur est arrêté après les captures.

Captures : 390 tactile en défilant et 1280, en thème clair et sombre. Chaque capture est ouverte, côte à côte avec son image de
référence. La question est ouverte : « combien et quels problèmes ? » (critique en trois regards nommés, R50 et V-regards ci-dessous,
puis pilote ; D342 à D344). Les états et gestes à
capturer :
1. Liste des carnets au repos, figé R01 (p2:g05-1, p2:i06-1).
2. Liste vide, premier usage, figé R02 (p2:i02-2, p2:i06-2), avec les puces exemples G1 et la ligne brouillon G2.
3. Créer · avant (g5:v03-2).
4. Créer · pendant, carnet proche proposé (g5:v08-3).
5. Créer · pendant, aucun carnet proche, avec sa raison (G4).
6. Créer · pendant, « Ce qui compte » tiré de la phrase (G3).
7. Créer · après, bandeau « ✓ Carnet créé · Annuler » (g5:v04-4), avec G5, G6, G7.
8. Créer · après, puis Annuler : la liste redevient identique.
9. Carnet ouvert au repos, figé R03 (p2:h05-3, p2:i06-4), sans tuiles.
10. Ajouter · avant, champ « Ajouter à <titre>… » avec focus, bulle G8 sur la fixture Ventilation (« Le critère « plus de
    condensation au plafond » peut trancher entre … »), picto local (R44).
11. Texte · pendant, cadre « ↓ va atterrir ici », puces « Va dans », ✕ (g5:v02-10, G10) ; G9 sur la fixture Évier, « fond de bac
    38 cm minimum » tapé : « les articles seront rangés sur le fond de bac, 38 cm au moins » (R45).
12. Texte · pendant, doublon d'une note (G11) : « Garder à part », puis la fusion ; et avec `&aides=0`, rien.
13. Texte · après, « ✓ Rangé ici · Annuler », phrase citée, corrections (g5:v03-8, G12).
14. Texte écrit depuis la liste : la ligne du carnet visé s'éclaire (G13).
15. Lien · avant, puce « Coller : … » (g5:v07-10), cadre G14.
16. Lien · pendant, lecture de la page : squelette et puces de progression (g5:v03-10, G15, G17, G18).
17. Lien · pendant, collé depuis la liste (G16).
18. Lien · après, carte complète (g5:v06-10), rangée dans sa façon (G19) ; l'article neuf naît sans veille ; l'article de la fixture
    à veille allumée dit « veille demandée » (R31).
19. Lien · après, 2e lien : le tableau naît (G20).
20. Lien · après, collé depuis la liste : « Rangé dans … » avec sa raison (G21).
21. Lien illisible : « lien · page non lue », Ouvrir ↗, rien d'inventé.
22. Note en vrac · pendant, découpe en lignes typées (g5:v01-15, G22, G23).
23. Note en vrac · après, « 3 lignes rangées dans 2 carnets · Annuler », « › Texte d'origine » (g5:v01-16).
24. Notes `ref/` (Sol local, Ajoute, prochain brassage) collées telles quelles, puis rangées.
25. Cartes d'article, figé R04 (p2:h03-5, p2:h06-5).
26. Article ouvert, figé R05 (p2:h01-6), bascule de veille avant (éteinte) et après (« demandée · pas encore relevée », aucune date
    de relève, R31).
27. Comparer sur le critère, écartés visibles, figé R06 (p2:g01-8 et ses compagnons).
28. Choisir, pourquoi, choisi, figé R07 (p2:g05-11, p2:v03-7, p2:v09-3, p2:g05-9).
29. Choix revu : l'ancien choix reste lisible (ADR).
30. Envoyer dans À venir, puis À venir avec « du carnet … », puis « Ouvrir le carnet » (R08, R32).
31. Réalisés.
32. Modifier une note · avant, pendant, après (g4:v01-11, g4:v01-12), feuille ··· (G24).
33. Modifier une note avec l'aide de l'IA (G25, G26, G27).
34. Renommer l'idée · avant, pendant, après (g4:v02-14, g4:v01-13 ; G28) ; G29 au banc, champ prérempli « ✻ proposé d'après « 2 bacs
    pour laver les fûts » · avant : « Évier inox » », et avec `&aides=0` le titre actuel seul (R46) ; G30 « ✓ Renommé · avant : … ·
    Annuler », puis Annuler.
35. Supprimer une note · menu, après « Note supprimée · Annuler », puis Annuler (g4:v02-12 ; G31, G32, G33).
36. Supprimer une idée sans lien · confirmation dans la page, champ et + grisés, Supprimer allumé, « ni dans À venir, ni en
    commande » au picto local (g4:v02-18 ; G34, G36) ; articles en veille : « Déplacer » (G35).
37. Supprimer une idée · après, « Carnet supprimé · Annuler » sur la liste (G37), puis Annuler.
38. Supprimer une idée liée à À venir : « 1 lien le retient », le lien et son réglage, Supprimer grisé (Suppression v2, D-47b).
39. Clavier ouvert, 300 px simulés : le champ et la dernière note sont visibles (CARNET-CLAV).
40. IA en cours (« ✻ … »), puis ✕ pendant la lecture.
41. IA en échec (`&ia=echec`) : effets locaux gardés, avis bref, message gardé.
42. IA éteinte (`&ia=eteint`) : rangement local, picto de provenance distinct du ✻.
43. Hors ligne (`&hors-ligne=1`) : envoi, rangement local, puis retour du réseau sans rerangement.
44. Photo par 📷 : vignette rangée, « photo non lue ».
45. Petit 🎤 : dictée dans le champ, sans écran voix.
46. + volant sur Carnets : bas droite, action « Nouvelle idée », aucune porte en double.
47. Stocks › Matériel : le segment À venir · Carnets · Réalisés et l'accès au parc (§ Points ouverts 1).
48. Son scénario CARNET-COEUR joué au doigt de zéro, puis frigo, ventilation et évier : une capture par étape.
49. Suppression v2 : « Garder le plan sans ce carnet », compteur à 0, Supprimer allumé ; puis À venir avec « du carnet … · supprimé ».
50. Idée avec un plan réalisé (dépense payée, `estRealise`) : « Archiver » seul, sans « Garder le plan sans ce carnet » ; puis
    Réalisés › « Ouvrir le carnet » rouvre l'idée.
51. Aides éteintes (`&aides=0`) : feuille de note, cadre et bandeau sans G11, G25, G26, G27, G33 ; à côté, le même écran au banc.
52. Comparer : 1 article (pas de tableau), puis 2 (le tableau naît, « rangé par : … », rang 1 et 2), puis un article « moins bien
    partout » et un écarté avec sa raison (R26, A9).
53. Page de choix de la voie E ouverte : chaque section, variantes et figé côte à côte (R39).
54. Banc `&taches=1` : le bandeau de tâches et les temps relevés (D-36, D8).
55. Pastilles « lié à » (R47) : idée envoyée dans À venir, pastille « À venir · … » sous le titre, aperçu ouvert sur place sans
    montant ; plan supprimé côté À venir : « supprimé » ; idée sans lien : aucune pastille.
56. Idée du calendrier (R48, D9), dans `?dev-local` : Calendrier › + volant › « Noter une idée en S47 » (feuille du calendrier
    inchangée, côte à côte avec sa capture du port du calendrier), puis Stocks › Matériel › Carnets avec l'idée « ZZ TEST — … » en
    état Idée ; puis Atelier › Bières, sans elle.
57. Icône d'idée de la bande en S47 (sans rangée ni case, LIEN-PLACE), puis un toucher : le carnet ouvert ; puis appui long sur S48
    (L1 b) et Annuler : le carnet et l'icône partent.

En ligne (lot G, D-143, D-144 ; après 0 bloquant sur les captures ci-dessus) :
1. Règles : `node scripts/build-rules.mjs`, puis `node scripts/check-carnets-emulator.mjs` sous émulateur → `REGLES CARNET OK 16/16`
   (G3). Échec : la règle manquante entre dans le déploiement, par une voie neuve.
2. Coût estimé écrit (G2), build avec `VITE_CARNET_IA=production` sans `VITE_CARNET_AIDES`, `node scripts/check-build-flags.mjs`
   (mode du carnet = production, aides absentes).
3. `npm run deploy` (ou ses trois parties), sortie gardée ; `found N files`, hash de la page servie égal au `dist/` ; les deux
   fonctions exclues inchangées (G1).
4. Exécutant Haiku, sur l'adresse de production : lecture seule de Stocks › Matériel › Carnets depuis le menu, 390 tactile en
   défilant et 1280, deux thèmes (G4) ; puis les actionneurs de G5 sur « ZZ TEST — … », 8 messages Gemini au plus, journalisés,
   dont « Noter une idée » au calendrier (R48 : l'idée « ZZ TEST — … » paraît dans Carnets, pas dans Atelier › Bières) ; puis
   retrait des « ZZ TEST — … » et recherche vide.
5. Captures ouvertes, côte à côte avec le banc (captures 1, 7, 9, 13, 18, 19, 23, 26, 27, 28, 30, 34, 38, 49, 55, 56, 57 rejouées en ligne ; en 18 et 26, la veille dit « demandée · pas
   encore relevée » et aucune date de relève, R31) ;
   critique en trois regards (R50, V-regards), puis pilote : « combien et quels problèmes ? » ; constats dans BUGS.md (G6).

Clôture (COUVERTURE, mineur 8) : la page de la voie E montrée (capture 53), puis le lot F porté ou rendu sans objet par son choix,
et, s'il porte du code, remis en ligne et rejoué par les étapes 2 à 5 ci-dessus.

Idées acceptées (V-idées, pilote, avant la clôture) : D-31, D-32 et D-125 seront versées à `work/missions/BUGS.md`, section « Idées
acceptées, à dessiner », avec leurs mots et leur D-n. Contrôle : `grep -c "D-31\|D-32\|D-125" work/missions/BUGS.md` vaut 3 au moins.
D-66 est suivie par la voie E (page « Aides »), D-34 par le port du calendrier (E40).

Demandes retenues sans port ouvert (V-suivi, pilote, avant la clôture ; R49) : D-6, D-45, D-48 et D-49 sont versées à
`work/missions/BUGS.md`, section « Demandes retenues, port à ouvrir », une ligne chacune, d'identifiant `CARNET-SUIVI-D6`,
`CARNET-SUIVI-D45`, `CARNET-SUIVI-D48`, `CARNET-SUIVI-D49`, avec ses mots, son lien (L11 ; L15 et L16 ; L9 et L19), l'élément de code
qui manque (`creativeItemId` ; modèle fournisseur ; `equipmentRef` et décompte des consommables) et le port qui la portera (Nouvelle
dépense, Fournisseurs, Consommables et parc). Contrôle : `grep -cE "CARNET-SUIVI-D(6|45|48|49)[^0-9]" work/missions/BUGS.md` vaut 4.

Trois regards (V-regards, R50, D-61, D-81) : à chaque passe de critique (captures 1 à 57 du banc, puis étape 5 en ligne), le
rapport du critique (Opus) a trois sections titrées « Besoin du brasseur », « UX/UI expert », « Critique », chacune avec sa note
sur 10 et sa liste numérotée. Contrôle : `grep -c "^## Besoin du brasseur\|^## UX/UI expert\|^## Critique" <rapport>` vaut 3 ;
toute note sous 9 a au moins un constat versé à BUGS.md. Clôture : 9/10 au moins sur les trois angles, ou chaque écart nommé
dans BUGS.md avec son lot.

Contrôles d'écran : CARNET-LIS (mots, tailles, contraste) ; CARNET-CLAV ; THEME-APP et CARNET-THEME (côte à côte avec un écran Stocks
réel) ; signatures refusées K1 à K4, CR-AVENIR-CAL ; C1 et C6 de `maquettes.json` ; Q4 (cibles) ; Q18 (zéro confirmation, sauf R23) ;
Q19 (provenance).

## Points ouverts (défaut appliqué, réversible)

1. **Le parc dans Stocks › Matériel.** La figé p2:g05-1 remplace la liste du parc (EquipmentList) par « À venir · Carnets · Réalisés ».
   Perdre le parc va contre D-41. Défaut : le segment figé, plus un 4e choix « Parc » en tête, avec le parc tel qu'il est aujourd'hui.
   À montrer en mini maquettes, figé à côté (L24), avant les captures finales : voie E, section 3.
2. **Le fil de chat (D-142).** Aucun écran ne le dessine. Défaut : les messages sont gardés en entier (`carnet-message`) et cités sur
   place (R25). Le fil visible est dessiné par la voie E (section 1, R39) et porté par le lot F après son choix ; `filDe` (A12) tient
   les données prêtes.
3. **Comparer des idées entre elles (D-142).** Ce n'est dessiné nulle part. Défaut : le Comparer figé, qui compare les articles d'une
   idée (`comparer.ts`, A9). Comparer deux idées : voie E, section 2, puis lot F.
4. **Ligne sans carnet** (ASSEMBLAGE, DÉCISION 3). Défaut : elle ouvre un carnet neuf (g5:v02-19, rang 3). Pas de rubrique Brouillon.
5. **Fonctions non classées** (G11, G25 à G27, G29, G30, G32, G33, G35 à G37). Défaut : G30, G32 et G37 (retours avec Annuler dans la
   page, règle J23) sont actives. G35 et G36 sont actives : elles font partie de Suppression v2, son choix (D-47b), et sont calculées
   sans IA. Les aides de l'IA (G11, G25, G26, G27, G29, G33) sont construites, actives au banc, et éteintes en production par le
   réglage `aidesCarnet` (`src/config/carnetIA.ts`, lot B), lu par `CarnetsVue.tsx` (lot D) ; critères B7, C6, D7. Il les voit côte à
   côte sur la page de la voie E (section 4) ; ce qu'il allume passe dans `VITE_CARNET_AIDES`.
6. **Touche d'envoi** (ASSEMBLAGE, DÉCISION 5). Défaut selon les rangs : ↑ sur la liste, « Ajouter » dans un carnet.
7. **À venir, figé h05-9.** La maquette mélange brassins, livraisons et factures, et porte l'onglet Calendrier actif, ce que D-92
   refuse. Défaut : À venir et Réalisés gardent l'`UpgradeWorkspace` (kh1r, acquis D-11), plus la carte « du carnet … · Ouvrir le
   carnet ». Le port complet de h05-9 est à trancher, en lien avec D-93 (liste des dates au Calendrier).
8. **Photo.** Non classée. Défaut : le 📷 de la figé ouvre l'appareil ou la galerie. La photo, réduite à 150 ko au plus, est rangée
   dans le carnet et marquée « photo non lue ». Sa lecture par l'IA attend l'accord.
9. **Lignes « à faire ».** Elles restent des notes du carnet. Rien ne s'écrit dans l'Atelier ni dans l'agenda (L33). Le lien vers le
   calendrier relève de L1, au port du calendrier.
10. **L1** (réglé à la 4e passe, R48). Le calendrier, déjà porté, écrivait l'idée datée en `recipe-idea` (Atelier › Bières) alors
    qu'il dit « dans le carnet ». Ce port en est le propriétaire : `enregistrementIdee` écrit un `carnet` (lots A et D, A15, D9).
    Défaut du pilote, réversible : les `recipe-idea` datées déjà écrites restent dans l'Atelier (aucune migration, aucune donnée
    réelle touchée) ; si le brasseur veut les retrouver dans Carnets, un geste « Déplacer vers Carnets » se dessinera à part. Risque :
    si la branche du calendrier change encore `calendrierAjout.ts`, le pilote fusionne à la main.
11. **Dexie.** Le brief demandait « Dexie local d'abord ». Défaut : le cache persistant de Firestore, la couche locale de l'app, pour
    une seule source. Si le pilote tient à Dexie, le lot A ajoute un magasin derrière `MagasinCarnets`, sans toucher aux vues.
12. **D-31, « Partager → L'Affinée ».** Idée acceptée (« Tous »), hors de ce port : elle demande un `share_target` dans le manifeste
    de la PWA, donc un déploiement. Sera versée à `work/missions/BUGS.md`, « Idées acceptées, à dessiner » (V-idées).
13. **D-32, raccourci « Nouvelle idée » sur l'icône.** Idée acceptée, hors de ce port : `shortcuts` du manifeste, même raison. Sera versée
    à BUGS.md (V-idées). Le jour où elle est portée, elle ouvre Carnets avec le champ en focus (l'action du + volant, R28).
14. **D-66, X rouge sur « Façons possibles ».** Jamais confirmé. Défaut : aucun bloc proposé d'office (§ Refusé). Ses deux lectures
    sont montrées par la voie E (section 4).
15. **D-125, prévision du prix des prochains brassins et coût des améliorations au tableau de bord.** Hors carnet (tableau de bord,
    finances). Sera versée à BUGS.md (V-idées) ; SPEC dit « à verser aux idées ».
16. **D-35, fournisseurs proposés.** Porté : l'IA ne propose que les vendeurs que le texte ou la page lue nomment (B7). Chercher
    d'autres fournisseurs demande une recherche en ligne : sous accord, avec la veille (§ Accords) ; le modèle fournisseur relève de
    L16 (D-48).
17. **Aides non classées en ligne** (R43). Défaut du pilote : au build de mise en ligne, `VITE_CARNET_AIDES` est absent ; G11, G25,
    G26, G27, G29 et G33 restent éteintes en ligne jusqu'à ce qu'il les voie (voie E, section 4). G8, G9 (classées, calcul local),
    G30, G32, G35 à G37 et les pastilles sont allumées. Réversible : un nouveau build avec la liste qu'il allume.
18. **Lien vers la facture** (R47). `creativeItemId` n'existe pas dans le code au 17.11 : la pastille « facture » n'est pas portée
    ici ; elle naîtra avec L11 au port de Nouvelle dépense, et `liensDe` la lira alors sans changer la vue.
19. **Veille sans relève** (R31, D-28 ; 3e passe, flou 3). Défaut du pilote : bascule éteinte à la naissance, « demandée · pas encore
    relevée » une fois allumée ; la maquette g5:v06-10 garde sa place, son libellé et sa bascule. Réversible : quand la relève est
    portée (son accord), `releveLe` est écrit et le défaut peut redevenir celui de la maquette s'il le veut.
20. **« Stock » dans Suppression v2** (R23, D-47b ; 3e passe, flou 1). Aucune donnée ne relie le parc au carnet : la sorte n'est pas
    portée. Défaut : un plan réalisé (facture payée) fait archiver ; le stock s'ajoutera au port du parc (L19).

## Décisions

| Décision | Décideur |
|---|---|
| Le carnet vit dans Stocks › Matériel › Carnets (figé p2:g05-1) | brasseur |
| Le parc dans Stocks › Matériel : un segment « Parc » en tête (point ouvert 1, à montrer en mini maquettes) | brasseur |
| Le fil chronologique et comparer deux idées : à dessiner en variantes (points ouverts 2 et 3) | brasseur |
| Page de choix de la voie E : fil, comparer deux idées, parc, aides de l'IA et D-66 (R39) ; le lot F porte ses variantes choisies | brasseur |
| Suppression v2 : un lien = le plan de `sortie` (un par idée) ; plan à venir : détacher ; plan réalisé (facture payée) : archiver, détacher refusé ; « stock » non porté faute de donnée ; les articles en veille partent avec l'idée, G35 propose sans bloquer (D-47b, R23 ; points ouverts 20) | pilote |
| Veille : éteinte à la naissance, « demandée · pas encore relevée » tant que la relève n'existe pas (D-28, R31 ; point ouvert 19) | pilote |
| D-31, D-32, D-125 versées à BUGS.md, hors port (points ouverts 12, 13, 15) | pilote |
| Les fonctions non classées éteintes en production jusqu'à ce qu'il les voie (point ouvert 5) | pilote |
| Cache Firestore plutôt que Dexie pour le local (point ouvert 11) | pilote |
| Tout en ligne dès 0 bloquant, puis testé en ligne : hébergement, `aiTask` (`rangerCarnet`, `lireLien`), règles si G3 le demande, Gemini en production (D-143, D-144, accord donné le 17.11 au soir) | utilisateur |
| Restent exclues `dispatchBrewerHopAdviceV1` et `notifyBrewerHopAdviceAnswerV1` (interdit antérieur, non levé) | utilisateur |
| L'IA simulée au banc et dans `npm test`, jamais appelée par les lots A à F ; appels réels seulement au jeu en ligne du lot G, 8 au plus, journalisés | pilote |
| Au build en ligne, `VITE_CARNET_AIDES` absent : aides non classées éteintes (point ouvert 17) | pilote |
| G8 et G9 calculés en local, picto local à la place du ✻ des maquettes (R44, R45 ; Q19) | pilote |
| L1 livré par ce port : l'idée du calendrier devient un `carnet`, sans IA ni migration des anciennes (R48 ; point ouvert 10) | pilote |
| D-6, D-45, D-48, D-49 versées à BUGS.md, « Demandes retenues, port à ouvrir » (R49, V-suivi) | pilote |
| Critique en trois regards nommés, notés sur 10, cible 9 (R50, V-regards) | pilote |

## Boucle de retour

Chaque lot rend RESULTAT.md (ligne 1 OK ou ECHEC). Le pilote rejoue les critères du lot, puis lance la série de captures du §
Vérification par un exécutant Haiku. Ensuite viennent le critique, en trois regards nommés (besoin du brasseur, UX/UI expert,
critique ; R50, D-61, D-81 ; « combien et quels problèmes ? »), puis le pilote. Chaque constat
est versé à `work/missions/BUGS.md` (L05). Une correction revient au lot qui possède le fichier. Ce qu'il dira devient une ligne de
SPEC et de DEFAUTS-RECURRENTS avant d'être corrigé (L13).

## Sources

- `work/missions/2026-11-17-port-carnet/DEMANDES.md`, `ASSEMBLAGE.md`
- `work/refonte-frontend/v4/choix/maquettes.json` (`chantiers.carnet`)
- `work/missions/2026-11-16-carnet-decision/CADRE.md` ; `work/missions/2026-11-16-liens-app/LIENS-APP.md`
- `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md` (CARNET-*, THEME-APP, LIEN-PLACE, CARNET-AVENIR-PLACE)
- Worktree port-carnet (chemins depuis la racine Brasserie) : `../port-carnet/src/App.tsx`, `../port-carnet/src/components/tabs/StocksTab.tsx`,
  `../port-carnet/src/components/CreativeLabTab.tsx`, `../port-carnet/src/domain/rangerNote.ts`, `../port-carnet/src/ui/atelier/rangerIA.ts`,
  `../port-carnet/src/config/rangerNoteIA.ts`, `../port-carnet/src/services/aiClient.ts`, `../port-carnet/src/services/storage.ts`,
  `../port-carnet/src/services/firestoreRepo.ts`, `../port-carnet/src/domain/calendrier.ts`, `../port-carnet/src/domain/finance/upgrades.ts`,
  `../port-carnet/functions/src/rangerNote.ts`, `../port-carnet/functions/src/ai.ts`, `../port-carnet/functions/src/brewerSuppliers.ts`,
  `../port-carnet/firestore.rules.template` (lu), `../port-carnet/package.json`

## Accords

- 18.11 : tests en ligne du carnet avec la vraie IA accordés, 5 CHF au plus en tout (« 5chf de crédit IA pour les tests en ligne du carnet ») ; journal des appels dans en-ligne-*/journal-ia.md.

**Donné le 17.11 au soir (D-143, D-144) : tout le port part en ligne dès 0 bloquant, puis se teste en ligne.** Ses mots : « Parfait
une fois en ligne puis testé sur la version en ligne » ; « Pourquoi que le front ? Non tout ?? ». Le lot G l'exécute ; rien ne lui est
redemandé (L24).
- **Accordé — fonctions** : `aiTask` avec `rangerCarnet` et `lireLien` (`functions/src/carnetIA.ts`, `lireLien.ts`, `ai.ts`).
- **Accordé — Gemini en production** : `rangerCarnet` au niveau Rapide (Flash-Lite, comme `rangerNote`), un appel par message
  envoyé ; `VITE_CARNET_IA=production` au build du lot G. Le coût par message reste **à mesurer** : estimé avant le build, mesuré au
  jeu en ligne (G2), écrit dans RESULTAT.md de G.
- **Accordé — lecture de pages tierces** par `lireLien` : appel externe, robots.txt respecté, sans modèle.
- **Accordé — règles Firestore si le port en a besoin** : aucune attendue, prouvé par G3 ; une règle manquante y entre.
- **Accordé — fusion de `claude/port-carnet-1711`, push et déploiement de l'hébergement** (le pilote, au lot G).
- **Non accordé, inchangé** : `dispatchBrewerHopAdviceV1` et `notifyBrewerHopAdviceAnswerV1` (interdit antérieur, non levé).
- **Hors de ce port, donc hors de « tout »** : la veille tous les 3 jours (D-28, L17 : fonction planifiée et recherche en ligne
  payante ; la bascule enregistre seulement l'intention, éteinte à la naissance, et la fiche dit « demandée · pas encore relevée », R31) ; la lecture d'une photo par l'IA et le repli par l'IA sur une page sans
  métadonnées. Ils restent à son accord le jour où un port les écrit.

# Analyse de la chaîne PRODUIRE (21.11) : PARTIELLE

L'état de cette analyse : seul le premier maillon, de l'idée à la recette et à « préparer le brassin », a été joué au doigt. Le reste de la chaîne est à jouer selon `REPRISE-produire.md`. Les règles citées sont celles du CADRAGE (§ 3, R1 à R7), en attendant `principes/REGLES.md`, qui n'existe pas encore.

**Ses mots.** « tout est lié, tout est dynamique ensemble » ; « On crée une recette, par exemple pour une bière pour Noël… une vague idée donc pas besoin d'avoir un date Picker ultra précis » ; « On commence notre brassin, on a tout qui de met à jour sans rien faire… ».

**Banc.** Voir BUGS-produire.md. Le seed utilisé contenait de vraies données, il est abandonné. Tout est à rejouer sur une fixture simulée.

## 1. Table des chaînes

| Chaîne | Gestes aujourd'hui | Gestes visés | Frictions |
|---|---|---|---|
| C1. Idée → recette enregistrée (2 malts, levure, sans houblon) | 24 touchers et 3 saisies (vu). Avec 3 houblons : environ 34 (P1 du 20.11). 2,5 s pour enregistrer | 18 à 20 | WFR-2 (style), WFR-3 (malt à 0 kg), WFR-4 (récap trompeur) |
| C2. Recette → brassin préparé | **Impossible** en 1 toucher (WFR-1). Repli : retour au Bord, puis Brassins → Recettes → fiche → Brasser, soit 4 touchers et la feuille de date, environ 6 (P2 du 20.11) | 1 toucher, et le jour seulement s'il est connu | WFR-1, WFR-5 |
| C3. Recette « pour Noël » datée en horizon | **Aucun champ de date** : ni à l'identité, ni au récap. Le menu « Plus » offre budget, brasser, fermentation, déroulé et copier | 1 toucher (horizon) | voir P2 |
| C4. Brassin → calendrier (fermentation, garde, fin) | à jouer | 0 geste (R1) | |
| C5. Jour de brassage → stock déduit, OG → fiche | à jouer (P5 du 20.11 : 6 touchers jusqu'au premier relevé) | | |
| C6. Fermentation : densités, fin prévue qui bouge | à jouer | | |
| C7. Conditionnement → stock produit, fûts, calendrier | à jouer : le seed n'a aucune bière conditionnée (20.11) | | |
| C8. Coût du brassin → Finances | à jouer | 0 geste (R1) | |

## 2. Les quatre regards (maillon C1-C3)

### Le brasseur (PORTRAIT)

- **Style.** Il tape « Dub » et rien ne vient : « je dois scroller tout ça ? »
- **Malt du stock à 0 kg.** « il ajoute un malt à zéro, ça sert à quoi ? »
- **Bouton « Enregistrer et préparer ».** Il est bon, et il est au bon endroit : c'est son geste naturel en fin de recette. Mais il échoue sur une phrase qui le renvoie à l'écran où il est : « c'est quoi ce matériel pas figé, je viens de la faire ».
- **Retour au Bord** après l'enregistrement : « elle est où ma recette ? »

**Ce qu'il aime déjà, et qui est à garder.** L'OG et l'EBC qui suivent la saisie du malt (5 kg → 1,037, puis 1,040 avec 0,5 kg de Caramünch) ; la levure qui dit « besoin 1,6 sachet · manque 2 » ; le récap en jauges contre le style. C'est la règle R4 : du « grand art ».

### Le designer d'interaction

- **Pouce.** Le « + » flottant reste sur l'assistant (WFR-6). L'action principale « Enregistrer et préparer » est en bas, bien placée. Le message d'erreur s'affiche en haut, loin du pouce, et sans bouton de remède.
- **Retour et annulation.** Le brouillon est conservé sur l'appareil : il survit à la fermeture, c'est bon. Échap ferme tout (WFR-7). La pastille de malt se défait par « Retirer », mais la quantité ajoutée est fausse.
- **États.** Le récap affiche « Enregistrable » tant qu'aucun malt n'est à 0 kg et que la levure est choisie, puis le lancement refuse (WFR-4). L'état « prêt pour le brassin » n'est pas fiable.
- **Saisie.** Le malt se tape en une ligne (« Pilsner 5 kg » puis Entrée), sans clavier numérique séparé : c'est bon. Le style, sans saisie possible, se cherche dans une liste de 315 entrées (WFR-2).

### L'intégration

- **Recette → brassin.** La recette neuve ne fige pas le matériel montré à l'identité (WFR-1). C'est une donnée qui ne suit pas entre deux écrans d'une même chaîne.
- **Recette → calendrier.** Une recette n'a ni date ni intention de date : une « bière de Noël » n'existe nulle part dans le temps avant qu'un brassin soit créé à la main.
- **Pastille stock → recette.** La pastille connaît le stock (« 600 g en stock »), mais n'en tire aucune quantité.

### La performance perçue

Mesures faites sur Vite de dev, donc majorées ; à refaire sur build :
- l'assistant s'ouvre de 0,4 à 1 s après le toucher ;
- tâches longues : 600 ms vers le récap, 807 ms pour enregistrer (2,5 s jusqu'au Bord), 558 et 655 ms au lancement ;
- le démarrage de l'app sur le build de test prend 374 ms (mesuré).

## 3. Propositions en chaînes d'actions (filtre GAIN.md)

Une proposition n'est candidate que si sa chaîne a été jouée et son gain chiffré.

### P1 — Recette → brassin en un toucher (R1 : une action pose toutes ses suites sûres)

**Avant, joué.** « Enregistrer et préparer » échoue, et la recette n'est pas enregistrée. Repli : Enregistrer (1 geste), Bord → Brassins → Recettes → fiche → Brasser → feuille de date, soit environ 6 gestes et 2,5 s d'enregistrement.

**Après.** « Enregistrer et préparer » fige le matériel actuel, enregistre et ouvre la feuille Brasser, soit 1 geste et le jour.

**Gain.** Environ 6 gestes deviennent 1 (−80 %). L'erreur « matériel pas figé » devient impossible sur une recette neuve.

**Fréquence.** Une fois par recette neuve. Mensuelle ou moins : à confirmer par son usage, c'est le rang de la chaîne qui la qualifie.

**Coût.** Rien à ajouter : c'est la correction de WFR-1, et le bouton existe déjà.

### P2 — Une recette porte une intention de date en horizon (R2 : la précision suit la connaissance)

**Chaîne.** À l'identité ou au récap, un toucher parmi aujourd'hui, 1 mois, 3 mois, 6 mois, 1 an, plus tard. La recette apparaît au calendrier comme intention, au début de l'horizon, et se reporte d'un geste. Le jour exact n'est demandé qu'à la feuille Brasser.

**Avant.** Impossible (C3). Le seul moyen de dater est de créer un brassin, avec sa feuille de jour précis.

**Gain visé.** Un oubli devient impossible : la bière de Noël existe dans le temps dès son idée. C'est aussi une ressaisie supprimée, puisque la feuille Brasser propose la date de l'horizon.

**Statut.** Pas encore candidate selon GAIN.md. Les gestes « avant » (créer un brassin planifié et le dater) restent à jouer en C4. L'axe de goût est en § 4.

**Coût.** Une rangée de 6 puces, et un état « intention » au calendrier. Il ne faut ni nouvelle vue ni nouvelle fonction avant le passage de l'écran Recette (gel du 20.11).

### P3 — Le malt du stock entre avec une quantité qui fait sens (R1)

Déjà porté par la mission moins-de-gestes (v03, rang 1 ; v04 « une quantité qui fait sens »). Ce n'est pas un doublon : je renvoie à cette mission. Gain : 1 saisie en moins par malt, et le blocage du lancement devient impossible (WFR-3).

### P4 — Le récap dit ce qui bloque le brassin (R4 : chaque réglage montre ce qu'il change)

**Chaîne.** Le récap utilise le même contrôle que le lancement. Chaque blocage est une ligne touchable qui ouvre son étape.

**Gain.** Un aller-retour d'erreur disparaît (2 à 3 gestes). L'erreur « prêt mais refusé » devient impossible.

**Coût.** Aucun élément neuf : c'est l'état du récap qui change.

### P5 — Le style se trouve sans défiler (R5 : peu à la fois, dans l'ordre de la décision)

**Chaîne.** La liste s'ouvre sur les styles déjà brassés et sur celui que suggère le nom. La recherche marche si la règle « sans clavier » le permet (WFR-2).

**Gain.** Environ 60 entrées à faire défiler sont remplacées par 1 toucher. La fréquence est par recette.

**Statut.** Le gain est à chronométrer au doigt.

## 4. Axes de goût (variantes, jamais bloquants)

- **Horizon de la recette : où le donner.** À l'identité (premier écran), au récap, ou aux deux, comme il le dit : « premier écran… ou pas, et à la fin… dans l'overview ».
- **Après « Enregistrer la recette » :**
  - rester sur la fiche de la recette ;
  - basculer au calendrier sur l'intention posée ;
  - revenir au Bord avec un lien.

  C'est le même axe que pour le projet ajouté au calendrier (CADRAGE § 6).
- **L'intention au calendrier.** Une barre floue sur l'horizon, ou une marque au début de l'horizon.

## Annexe — gimmicks écartés

- **Une vue « toute ta chaîne ».** Il l'a refusée (pe5) ; la règle R1 parle du mécanisme, pas d'une vue.
- **Un sélecteur de date au jour près dans la recette.** Il l'a refusé dans ses mots du 20.11 ; c'est R2.

## 5. Passe 2 (21.11, sur fixture ZZ TEST, build de test sans seed)

**Mesuré (CPU ×1 puis ×4, CDP `Emulation.setCPUThrottlingRate`, 390 tactile).**

| Geste | Touchers | ×1 | ×4 |
|---|---|---|---|
| Brassins (depuis Bord) | 1 | 403 à 415 ms | 488 ms (tâche longue 384 ms) |
| Brasser · B-ZZ-PLAN (feuille) | 1 | 437 à 667 ms | 1 193 ms (calme 1 109 ms) |
| Commencer aujourd'hui | 1 | 353 ms | non mesuré |
| Calendrier (écran) | 1 | 368 à 396 ms, puis écran indisponible | non mesuré |
| INP (interactions du pas) | — | max 40 à 88 ms | max 120 ms |

Ouverture de l'app sur le build de test : 437 à 467 ms.

**Chaînes.**
- C2 (date → feuille Brasser) : jouée, 2 touchers depuis la liste. WFR-9 (écran indisponible si la levure a un nom) contourné dans la fixture, à corriger dans l'app.
- C3 (jour de brassage) : démarrée, 4 touchers depuis la liste ; « Commencé le 21.11 · initialement prévu le 01.12 ».
- C4 (Calendrier) : **bloquée**, WFR-11, écran indisponible sans démarrage de brassin.
- C5 à C8 : non jouées. Finances s'ouvre (capture jamais analysée au coût de brassin).

**Gains P1 à P5 : non révisés.** La passe 2 ne mesure aucune chaîne qui les concerne. P1 (WFR-1) n'a pas été rejoué : le wizard de recette neuve n'a pas été joué. P2 dépend de C4, bloquée. P3, P4 et P5 ne sont pas touchés. Les chiffres du 20.11 restent des estimations, à confirmer.

## Non joué : voir REPRISE-produire.md

Les chaînes C5 à C8 (déstockage, densités, conditionnement, coût dans Finances), et WFR-1. Le Calendrier (C4) est bloqué par WFR-11.

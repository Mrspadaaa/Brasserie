# Analyse des workflows : projets et Calendrier (voie WFP, 21.11)

**Portée** (correction du pilote, 21.11) : « c'est pas du tout que le calendrier mais l'app dans sa totalité vu que tout est lié ». Cette voie couvre la chaîne idée ou projet du Carnet → date → Calendrier → budget et Finances, et les gestes propres au Calendrier, suivis à travers chaque écran qu'ils touchent. Produire, acheter et vendre sont les voies voisines. Pas de code : analyse seulement. Filtre de gain : `GAIN.md`. Bugs : `BUGS-projets.md` (WFP-1 à WFP-12).

**Banc.** Build de l'arbre de travail `port-carnet` (HEAD 2bc7cd7af et modifications en cours d'une autre session) par `scripts/parcours/vite.parcours.config.mjs`, dans un dossier temporaire. URL `?dev-local&finance-demo=parcours-calendrier`. Fixtures simulées du Calendrier et du Carnet fusionnées : 111 documents, aucune donnée réelle, aucun Gemini. Chrome 390 × 844 tactile (CDP touch), CPU ×1 puis ×4 pour un téléphone moyen.

**Mesures.** Temps : du geste au dernier changement du DOM (300 ms de calme). Tâches longues : PerformanceObserver. Script, sorties et captures : `projets-captures/` (`chaines.mjs`, `banc.mjs`, `out-t4.txt`, `res-t1.json`, `res-t4.json`). Chaque capture citée a été ouverte et regardée.

**Règles.** `REGLES.md` n'existe pas encore dans ce dossier. Les règles citées sont celles du CADRAGE (`2026-11-20-workflows/CADRAGE.md` § 3, R1 à R7).

## 1. Table des chaînes

Temps : somme des gestes à CPU ×4.

| # | Chaîne (son entrée réelle) | Gestes aujourd'hui | Temps ×4 | Gestes visés | Frictions |
|---|---|---|---|---|---|
| C1 | Planifier un brassin (Calendrier › + › Poser un brassin › recette › semaine › Ajouter) | 5 | 2,4 s | 3 (rangée Brassins › recette suggérée › Ajouter) | Finances ne voit rien (WFP-8). Puces de semaine de 28 px (WFP-11). « Ajouter » prend 0,9 s. |
| C2 | Déplacer un événement au passé, puis au futur (glisser une barre) | 1 + 1 | 0,9 s + 1,0 s | 1 + 1 | Au passé, la barre revient à aujourd'hui alors que le toast dit S46 (WFP-3). Au-delà de la fenêtre, la période change d'elle-même (WFP-4). Annuler présent. |
| C3 | Dater un projet du Carnet (Brassins › Atelier › Carnet › fiche) | 4 pour atteindre la fiche, puis **impossible** | 1,8 s | 1 (« Au calendrier ») + 1 glisser | Aucun geste ne date le projet, ne l'envoie au Calendrier ni ne le chiffre (WFP-7). |
| C3b | Le chemin inverse : Calendrier › + › Noter une idée › taper › Noter | 5, et le titre retapé si l'idée existe déjà au Carnet | 2,8 s | 2 | Carrousel de semaines depuis janvier, puce choisie hors écran (WFP-5). L'idée n'apparaît pas nommée au Calendrier (WFP-6). |
| C4 | Voir le solde d'une semaine (glisser sur la courbe ; ±) | 1 glissé : **semaine fausse** ; ± : 1 toucher, mouvement de la semaine et non solde | 0,1 s | 1 | Le glissé lit « S31 · 2 août » en vue 6 sem. et le panneau recouvre la 1re rangée (WFP-2). Déplier une semaine prend 1,1 s et réordonne les barres (WFP-9, WFP-10). |
| C5 | Ajouter une dépense depuis le Calendrier (rangée Achats › +) | ouverture de la feuille seulement (1 geste, 0,7 s), le champ nom n'a pas été atteint par le banc | — | — | Laissée à la voie « acheter ». Notés : montants passés en puces (−240, −420, −540), cible + de 24 px. |
| C6 | De la recette pour Noël à sa date (+ › Recette) | assistant **sans date** (Nom, Style, Volume, Ébullition). Ensuite : Brassins › Recettes › fiche › Brasser › « Autre date » › jour › confirmer ≈ 7 | ≥ 1,8 s pour les 4 premiers | 1 (horizon au 1er écran ou sur l'aperçu) | La seule date proposée est le jour de cuve, au jour près (calendrier jour par jour). |
| C7 | Cacher ou montrer une rangée (œil) | 1 + 1 | 0,3 s + 0,1 s | 1 + 1 | Cible de 24 × 24 (WFP-11). L'état reste caché après rechargement : cohérent, rien à changer. |
| C8 | Retrouver un événement (loupe ; menu › Liste) | loupe : 2 gestes, **échec** (« Rien pour « Hotte » ») ; Liste : 2 gestes + défilement | 0,8 s ; 0,4 s | 3 (loupe, taper, toucher → la chose ouverte sur la frise) | La recherche ignore les choses du Calendrier (WFP-1). |

## 2. Le brasseur (calé sur PORTRAIT.md : seul en cuverie, une main, attention hachée)

- **WFP-7, projet du Carnet impossible à dater.**
  - Pourquoi : c'est sa demande mot pour mot (« petit bouton ajouter calendrier, ça l'ajout à la date du jour… »), et la fiche n'a rien.
  - Sa phrase prédite : « Je peux même pas le mettre au calendrier ??? »
  - Verdict : rejet du parcours. Il garde la fiche.
- **WFP-5, carrousel des semaines.**
  - Pourquoi : il note une idée pour dans trois mois et tombe sur janvier, dans le passé.
  - Sa phrase prédite : « Pourquoi ça commence en janvier ??? Je veux juste dans 3 mois. »
  - Verdict : mitigé. Noter en 5 gestes depuis le + lui va ; la date ne lui va pas.
- **WFP-1, recherche.**
  - Pourquoi : la Hotte est visible juste derrière la recherche, qui ne la trouve pas.
  - Sa phrase prédite : « Elle est là la hotte !!! »
  - Verdict : rejet de la loupe.
- **WFP-3, barre au passé.**
  - Sa phrase prédite : « Je l'ai mise en S46, pourquoi elle est en S47 ? »
  - Verdict : bug d'interaction ; il ne fera plus confiance au glisser.
- **WFP-2, lecture de la courbe.**
  - Sa phrase prédite : « S31 ? août ?? Je regarde décembre. »
  - Verdict : mitigé. La courbe lui plaît, la lecture est fausse.
- **WFP-9, lenteur.**
  - Pourquoi : c'est sa plainte du 21.11, « beaucoup de lenteur sur les actions du calendrier ».
  - Ce qu'il ressent : près d'une seconde après chaque geste, sur un téléphone.
- **WFP-10, barres réordonnées.**
  - Sa phrase prédite : « ça fait bouger tout le calendrier », comme pour l'en-tête.
- **Ce qui marche, et qu'il dirait « très bien ».**
  - Le glisser d'une barre, avec Annuler : 1 geste.
  - Le + qui pose un brassin en 5 gestes avec « prête le 19 déc. » calculé.
  - L'œil qui cache une rangée et la garde cachée.

## 3. Le designer d'interaction

- **Distance du pouce.**
  - Haut de l'écran, entre 3 et 67 px du bord : la loupe, le menu de période, ± et Maintenant. Au téléphone tenu d'une main, c'est la zone la plus lointaine.
  - Bas de l'écran (y 736) : le + volant, bien placé.
  - Les feuilles d'ajout s'ouvrent en bas, avec leur bouton principal à y 820 : bien.
- **Cibles sous 44 px** (WFP-11).
  - 24 px : œil et +, sur chaque rangée.
  - 28 px : icônes d'achat et de papier.
  - 28 × 48 : puces de semaine.
  - 22 × 28 : ±.
- **Retour de chaque geste.**
  - Toast avec Annuler : après « Ajouter », le glisser et « Noter ». Bien.
  - Toast trompeur : WFP-3, le toast dit S46 et la barre est en S47.
  - Retour trop maigre : WFP-6, l'idée notée disparaît du Calendrier.
  - Aucun retour chiffré quand un brassin est posé : la courbe ne bouge pas (WFP-8), contre la règle R4.
- **Annuler** : présent partout où l'on écrit. Cacher une rangée n'en a pas besoin (l'œil se retouche).
- **États.**
  - Vide : « Fêtes · vide », lisible.
  - Erreur : la recherche rend « Rien pour « Hotte » » sans proposer la Liste ni le Calendrier.
  - Hors ligne : le banc est toujours « hors connexion · mode local », donc l'état en ligne n'a pas été joué. La file d'écriture Firestore est à mesurer en ligne, sur des données « ZZ TEST ».
- **Précision de la saisie** (R2).
  - Les feuilles demandent une semaine précise, parmi plus de 60 puces, pour des intentions vagues : idée, projet.
  - La recette ne demande aucune date, puis le jour exact au moment de brasser.
  - Il manque le niveau « horizon » entre les deux.

## 4. L'intégration (ce qui suit et ce qui ne suit pas)

| De → vers | Constat joué | Suit ? |
|---|---|---|
| Calendrier « Poser un brassin » → Brassins | « À brasser 8 → 9 », « Tous 14 → 15 » | oui |
| Calendrier « Poser un brassin » → Finances, courbe | « coût à venir », rien en Finances (WFP-8) | **non** |
| Calendrier, achat glissé d'une semaine → courbe | « Commande de malt 1 déc. → 8 déc. », en-tête recalculé | oui (Finances, en vue Novembre, ne le montre plus : normal) |
| Calendrier « Noter une idée » → Carnet | « Bière de Noël épicée » en tête du Carnet | oui |
| Calendrier « Noter une idée » → Calendrier | rien de nommé (WFP-6) | **non** |
| Carnet, projet avec « Budget du Planning : 500 CHF » → Calendrier, Finances | aucun geste, rien au Calendrier ni dans la courbe (WFP-7) | **non** |
| Assistant de recette → date, Calendrier | aucune date dans l'assistant | **non** |
| Recette › Brasser → Calendrier | la feuille réserve le stock et propose « À définir / Aujourd'hui / Autre date » | oui, mais au jour près |
| Brassin en retard → sa date | barre au 21 nov., fiche « prévu le 12 nov. » (WFP-12) | ambigu |

## 5. La performance perçue (CPU ×4 contre ×1)

| Action | ×1 | ×4 | Tâche longue (×4) |
|---|---|---|---|
| Déplier une semaine (toucher S49) | 150 ms | **1 141 ms** | 1 119 ms |
| Atelier (Brassins › Atelier) | 398 ms | **1 056 ms** | 260 ms |
| « Noter » une idée | 566 ms | **968 ms** | 585 ms |
| Glisser une barre (après le lâcher) | 582–651 ms | **878–960 ms** | 408–723 ms |
| + › Recette | 496 ms | **946 ms** | 1 170 ms |
| « Ajouter en S50 » (brassin) | 220 ms | **923 ms** | 719 ms |
| Bord → Calendrier | 55 ms | **829 ms** | 846 ms |
| Ouvrir une feuille d'ajout | 82–94 ms | 574–675 ms | 585–733 ms |
| Œil d'une rangée | 63 ms | 103–323 ms | 99–314 ms |

**Lecture.**
- Hors réseau, chaque écriture ou changement de vue déclenche une tâche longue de 0,4 à 1,1 s à ×4. Cela tient à la plainte : près d'une seconde gelée après chaque geste au téléphone.
- [estimé, non profilé] Cause probable : tout l'écran se rend à nouveau à chaque geste. La plage de tâche longue est la même pour toutes les actions, quel que soit leur objet. L'en-tête (EnTete 784 lignes, Courbe 780) et la frise (Rangee 1 034 lignes) recalculent tout, même quand une seule barre bouge.
- À confirmer par un profil React (Profiler) sur « Ajouter en S50 » et sur le dépliage d'une semaine, avant toute correction (L20 : profiler avant d'architecturer).
- En ligne, l'écriture Firestore peut s'y ajouter : non mesurée ici.

## 6. Propositions de workflow (passées au filtre de GAIN.md)

Fréquences : aucune donnée d'usage réel n'est disponible. Elles sont **estimées** d'après la forme de ses données (16 idées et 19 étapes de Planning au Carnet, 14 brassins sur l'année dans ses captures) et d'après ses mots.

### P1 — « Au calendrier » sur toute chose créée hors du Calendrier qui a une date naturelle
- **Règle** : R1, une action pose toutes ses suites sûres ; R2, la précision suit la connaissance.
- **Portée** : son exemple est le projet. La règle vaut aussi pour l'idée, la recette et le projet de matériel du Carnet.
- **Chaîne, étapes** :
  1. Fiche › « Au calendrier » : la chose est posée à aujourd'hui, avec le prix du budget s'il existe, marqué « estimé ».
  2. Lien « Voir S47 › » vers la frise.
  3. Un glisser pour la date.
- **Avant** : impossible depuis la fiche (C3, WFP-7). Le détour par le Calendrier coûte 5 gestes (2,8 s à ×4) et le titre est retapé.
- **Après** : 1 geste, plus 1 glisser si la date compte.
- **Gain** : −60 % de gestes, une ressaisie supprimée (le titre), un oubli rendu impossible (le budget de 500 CHF absent de la courbe).
- **Fréquence** : à chaque projet ou idée datable, plusieurs fois par mois [estimé].
- **Coût** : un bouton sur la fiche. Retire le détour.
- **Ses mots** : « En 1 bouton on a 3 action super précise ».

### P2 — Dater une intention par horizons, jamais par carrousel
- **Règle** : R2. Une intention se date en horizons et se reporte d'un geste ; le jour exact seulement là où il compte.
- **Portée** : toute feuille où la date est une intention (idée, projet, travaux, activité, recette).
- **Chaîne, étapes** :
  1. Toucher un horizon : aujourd'hui, 1 mois, 3 mois, 6 mois, 1 an, plus tard.
  2. Au besoin, glisser sur la frise pour préciser la semaine.
- **Avant** (C3b) : la puce de la semaine choisie est hors écran. À 3 mois, il faut 2 balayages et 1 toucher ; à 6 mois, environ 4 balayages et 1 toucher ; et le carrousel part de janvier, dans le passé.
- **Après** : 1 toucher.
- **Gain** : −67 à −80 % de gestes au-delà d'un mois. Une date dans le passé par mégarde devient impossible.
- **Fréquence** : à chaque idée, projet ou recette, mensuel au moins [estimé].
- **Coût** : une rangée de 6 puces. Retire le carrousel de plus de 60 puces ; la semaine exacte reste au glisser.
- **Ses mots** : « pas besoin d'avoir un date Picker ultra précis, juste, aujourd'hui, dans 1 mois, dans 3 mois ».

### P3 — La recette porte son horizon dès sa création
- **Règle** : R1 et R2.
- **Portée** : son exemple est Noël ; la règle vaut pour toute recette faite pour une occasion ou une saison.
- **Chaîne, étapes** :
  1. Assistant, premier écran ou aperçu final : un horizon, en option.
  2. La recette apparaît au Calendrier comme « brassin prévu vers déc. », avec sa durée de cuve déjà connue (« prête le … »).
- **Avant** (C6) : l'assistant n'a pas de date. Ensuite, environ 7 gestes (Brassins › Recettes › fiche › Brasser › Autre date › jour › confirmer), au jour près.
- **Après** : 1 geste.
- **Gain** : −85 % de gestes. L'oubli du brassin de saison devient impossible, puisqu'il est au Calendrier dès la recette.
- **Fréquence** : à chaque recette neuve, environ mensuel [estimé].
- **Coût** : une rangée d'horizons dans l'assistant. Rien n'est retiré.
- **Gel** : se porte au passage de l'écran Recette, 3e dans l'ordre du gel.

### P4 — Un brassin posé chiffre ses suites, en estimé
- **Règle** : R1 et R4. Chaque réglage montre tout de suite ce qu'il change : caisse, courbe.
- **Chaîne, étapes** :
  1. « Ajouter en S50 » pose le brassin.
  2. Ses courses et frais s'estiment aussitôt, au coût de la recette, aux prix de son stock ou du dernier brassin, marqués « estimé ».
  3. La courbe bouge.
  4. La facture réelle remplace l'estimation.
- **Avant** (C1, WFP-8) : « coût à venir », Finances muet. Pour un chiffre, il faut ouvrir « Budget › » et taper les prix (non joué : ≥ 3 gestes et des montants tapés [estimé]).
- **Après** : 0 geste.
- **Gain** : un oubli rendu impossible (une caisse projetée fausse), une ressaisie supprimée (les prix déjà connus du stock).
- **Fréquence** : à chaque brassin.
- **Coût** : une ligne « estimé » dans la caisse. Rien n'est retiré.
- **À coordonner** avec la voie « produire ».

### Candidat à confirmer — lâcher une barre au passé demande « brassé ce jour-là ? »
- **Règle** : R1.
- **Chaîne, étapes** : lâcher au passé, puis choisir « Brassé le 10 nov. » ou « Reporté ».
- **Avant** : la barre est redessinée à aujourd'hui (WFP-3). Saisir « brassé » passe par le compagnon, environ 6 gestes (MESURES P5), avec la date du jour au lieu du vrai jour.
- **Après** : 1 geste.
- **Gain** : une erreur de date de brassage rendue impossible, avec ce qu'elle entraîne (fin de fermentation, stock).
- **Fréquence** : non mesurée. Il reste candidat seulement si la saisie après coup est mensuelle : à vérifier sur ses brassins réels, en lecture seule.

## 7. Choix de goût (axes de variantes, jamais bloquants)
- **A. Après « Au calendrier »** : la page bascule au Calendrier, centrée sur la chose, ou il reste au Carnet avec un lien « Voir S47 › » (CADRAGE § 6).
- **B. La liste des horizons** :
  - aujourd'hui, 1 m, 3 m, 6 m, 1 an, plus tard ;
  - ou cette semaine, ce mois, trimestre, semestre, an.
  - Et quand l'horizon devient-il un jour : au premier glisser, ou à 4 semaines de l'échéance ?
- **C. L'estimation d'un prix** : historique, catalogue, fourchette, ou IA bon marché.
- **D. Une intention au Calendrier** : une barre floue sur sa plage, ou une pastille au mois.

## Annexe — gimmicks écartés
- **Vue « toute ta chaîne »**, liste des effets d'une action : refusée (pa3, pe2, pe5). La règle R1 demande le mécanisme, pas sa vue.
- **Cacher une rangée par balayage** : 1 geste aujourd'hui, aucun gain. Seule la cible de 24 px est à grandir (bug WFP-11).
- **Recherche vocale** : aucune chaîne mensuelle mesurée ne s'en sert.
- **Animation ou confirmation festive après « Ajouter »** : aucun geste ni aucune erreur en moins.
- **Réordonner les rangées au doigt** : « Trier les rangées » existe déjà dans le menu ; aucune chaîne jouée n'en a besoin.
- **Recherche universelle** : ce n'est pas une proposition. Le constat WFP-1 est un bug à corriger (la loupe existe et ignore le Calendrier).
- **Lire le solde au doigt** : idem, bug WFP-2, pas une fonction nouvelle.

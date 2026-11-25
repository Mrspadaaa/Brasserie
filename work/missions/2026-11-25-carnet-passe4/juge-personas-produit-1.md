# Juge personas produit 1 · passe 4 du Carnet · 25.11

Trois regards dans un même fichier :
- **UX** : mobile compacte, densité, hiérarchie, pouce, 390 px.
- **IA** : l'IA aide-t-elle, la voit-on, s'annule-t-elle, que se passe-t-il quand elle se trompe ou manque.
- **Neuf** : un nouveau venu comprend-il sans explication.

Matière : 188 images de `page/img/` (390 × 844), toutes ouvertes, rangée par rangée (planches de 8 images montées pour la lecture).
Règles de ce soir appliquées comme contrôles : ORGANISE-TROP-TEXTUEL, FRISE-GENERIQUE, ENTETE-PEU-UTILE, CARNET-REPOND-AU-BESOIN,
CARNET-COHERENT, CARNET-LISTE-COMPACTE. Les comptes de mots sont **estimés** sur la capture, pas mesurés dans le DOM.

## Constats transversaux (valent pour plusieurs écrans)

1. **B · ORGANISE-TROP-TEXTUEL.** Aucun Organisé ne tient 30 mots au premier écran (estimés de 70 à 110 mots : v01-09, v02-12, v03-07,
   v04-11, v05-10, v06-09). Les blocs typés aident, mais chaque option garde sa phrase et sa sous-ligne.
2. **B · FRISE-GENERIQUE.** Une frise d'états fixe et centrale reste dans v02, v03 et v05 (Noté — Je cherche — Décidé — Résolu, v02-12,
   v03-07, v05-10), comme dans M4. v01 et v04 la remplacent par une barre segmentée à 4 états, toujours fixe et centrale (v01-09,
   v04-11) : même défaut sous une autre forme. **Seul v06 passe** : l'état tient en points dans l'en-tête (« ●●○○ Je cherche », v06-09).
3. **B · ENTETE-PEU-UTILE.** v02, v03 et v05 commencent par « Rangé le … · Changements » puis la frise. La première info utile arrive
   vers 170 à 200 px (v02-12, v03-07, v05-10). v01 et v04 (4 cases à ≈ 110 px) et v06 (titre et question à ≈ 80–105 px) passent.
4. **m · copies.** Sur Décider, Tâche, Résoudre, Mémo, Hors ligne et Erreur, plusieurs versions reprennent M4 à une ligne près (v04-14,
   v05-13, v04-17, v05-16, v05-20, v04-26…). Elles n'explorent rien. Une simple copie perd des points (L07).
5. **m · critique non discriminante.** La page donne « critique 6,5/10 » aux six versions : il n'y a aucun classement, contraire à L27.
6. **m · bruit de maquette.** « Suite imaginée pour la maquette » et les pastilles « imaginée » prennent une ligne sur une dizaine
   d'écrans (v01-11, v04-14, v05-13…). La densité réelle est donc un peu meilleure que ce qu'on voit.
7. **IA · m · Ranger reste le bouton principal.** Son goût : l'IA se lance seule quand il arrête d'écrire. Pourtant « Ranger » reste en
   tête des outils partout, et v03 en fait même un gros bouton noir (v03-05). Si l'IA part seule, Ranger devient un geste de secours, pas le premier.
8. **IA · m · le bouton Aide manque.** Son goût, c'est un « + » ou un bouton Aide qui propose check, tâche ou suggestion. Seul v01 s'en
   approche avec « Demander » (v01-07). Aucune version ne montre ce que propose Aide.
9. **Neuf · m · vocabulaire.** Piste, retenu, écarté, en réserve, veille, « lu par l'app » ou « l'IA » : ces mots ne sont jamais expliqués,
   sauf « Retenu veut dire Décidé : l'état suit » dans v06-06. Les barres colorées de la liste v02 n'ont pas de légende (v02-01).
10. **UX · m · pouce.** Mes notes et Organisé sont en haut de l'écran partout. Dans v06, la bascule est la plus loin du pouce : petite,
    dans le coin en haut à droite (v06-07, v06-09).

---

## 1. Liste des carnets, au repos

**Avis.**
- **UX.** v04 et v01 tiennent la promesse « tout ce qui est ouvert d'un coup d'œil ». v04 montre 11 carnets, avec l'état en pastille à
  droite et les pistes en un mot. v01 en montre environ 8, avec le coup d'œil en rangée basse.
- **UX.** v05 replie tout : on ne voit qu'un carnet. v06 met 4 grosses tuiles d'état et ne montre que 4 carnets. v03 donne un
  en-tête de sous-domaine à chaque carnet, ce qui double la hauteur.
- **IA.** Rien à juger ici, sinon le « mis là par l'IA » de v03 en glisser.
- **Neuf.** v04 se lit seul (« Décidé », « 3 pistes »). Dans v02, les barres de couleur et les numéros 1 à 5 ne s'expliquent pas.

**Problèmes**
1. **B** v05-01 : un seul carnet visible, tout est replié. Échoue à CARNET-LISTE-COMPACTE et à « d'un coup d'œil ».
2. **B** v06-01 : tuiles d'état d'environ 50 px de haut et 4 carnets seulement. Échoue à CARNET-LISTE-COMPACTE.
3. **m** v03-01 : un en-tête par carnet (Brassage 1, Service 1, Matières premières 1). Le classement coûte une ligne par carnet.
4. **m** v02-01 : segments colorés et rang numéroté sans légende, illisibles pour un nouveau venu.
5. **m** v04-01 : la vue par défaut, « Lignes ouvertes », perd Brasserie et Local ; il faut toucher Arbre pour les retrouver.

**Meilleurs mécanismes et visuels**
- v04-01 : une ligne par carnet, l'état en pastille à droite, la piste en un mot (« B retenu », « 3 pistes ») et le pied « Mémos · Résolus 2026 ».
- v01-01 : le coup d'œil en rangée basse (4 je cherche · 5 décidés · 6 notés · 4 résolus · ✓ 8 à faire), compact et filtrant.
- v02-01 : la mini-barre d'options par ligne (vert retenu, bleu piste, gris écarté), utile si on lui donne une légende.

| v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|
| 8 | 7 | 5 | 8 | 3 | 4 |

## 2. Filtrer, glisser pour ranger (D455)

**Avis.**
- **UX.** Toutes les versions ont l'appui long, la ligne soulevée et le dépôt sur un en-tête.
  - v05 a le meilleur Annuler : un bouton blanc, en contraste, dans le bandeau.
  - v04-03 enseigne le geste (« Appui long : glisse la ligne, lâche pour la poser ») et montre la cible « Poser ici · rang 3 ».
- **Neuf.** v03-02 est la seule version qui explique les deux effets au moment du geste : « Lâcher ici : passe dans Local › Eau ·
  Entre deux lignes : change la priorité ».
- **IA.** v04-04 change aussi le genre en silence (« catégorie changée · Problème »). Un glisser ne doit pas changer autre chose que la place.

**Problèmes**
1. **m** v04-04 : changement de genre caché dans le bandeau. C'est une surprise.
2. **m** v06-02 : un paragraphe d'aide de 3 lignes sous le filtre, trop de texte.
3. **m** v06-03 : aucun bandeau Annuler visible après le dépôt.

**Meilleurs mécanismes**
- v03-02 : la légende des deux dépôts, affichée seulement pendant le geste.
- v04-03 : la cible nommée « Poser ici · rang 3 ».
- v05-03 : le badge « 1er » et le bandeau avec un Annuler blanc.
- v06-02 : toucher une tuile d'état filtre la liste (« 7 × je cherche ») ; à reporter sur la rangée basse de v01.

| v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|
| 7 | 7 | 8 | 7 | 7 | 6 |

## 3. Noter vite

**Avis.**
- **UX.** v02, v04 et v05 tiennent tout sur une ligne : texte, photo, micro, et la pastille Coller au-dessus du clavier.
  - v04 rassure sur la provenance avec « copié il y a 2 min ».
  - v03 sort les outils du champ sur une deuxième rangée avec un bouton Noter : c'est plus lourd.
  - v06 affiche un clavier AZERTY, alors que tous les autres sont en QWERTZ suisse.
- **Neuf.** v06 est le seul à dire ce qui va arriver : « Nouvelle note : l'IA la range, rien sans ton OK ».

**Problèmes**
1. **m** v03-03 : outils sur une rangée séparée, avec la touche « Retour ». Le champ cesse d'être une ligne (CHAMP-CARNET-REPLIE).
2. **m** v06-04 : clavier AZERTY, incohérent avec le reste.
3. **m** v01-04 : le champ s'ouvre sur 3 lignes, plus haut que les autres.

**Meilleurs mécanismes**
- v04-05 : « Coller entreprise-x.ch · copié il y a 2 min ».
- v06-04 : la phrase-promesse au-dessus du champ, une seule fois, pour un nouveau venu.

| v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|
| 7 | 8 | 5 | 8 | 7 | 7 |

## 4. Note rangée par l'IA

**Avis.**
- **IA.** C'est le cœur : l'IA rattache, propose la suite, et rien ne change sans OK.
  - Avec la note du condenseur, v01, v02 et v05 reprennent la référence p3-v03 mot pour mot.
  - v04 donne la meilleure sortie quand l'IA se trompe : « OK · Autre ligne… · Juste la note ».
  - v03 montre « ajoutée à sa ligne ouverte » avec un mini-chemin (18 nov. → auj. → suite ?).
  - v06 ajoute « Changer », puis « Retenu veut dire Décidé : l'état suit ».
- **UX.** La feuille occupe les deux tiers bas de l'écran, à portée du pouce, partout.
- **Neuf.** Les flèches « en veille → retenu » et « Je cherche → Décidé » se lisent sans aide.

**Problèmes**
1. **m** v01-05, v02-07 et v05-05 copient la référence sans rien ajouter (L07).
2. **m** v03-04 : « Acheter le testeur ≈ 35 CHF · l'IA ». L'IA avance un prix ; v06 dit au contraire « aucun prix inventé ».

**Meilleurs mécanismes**
- v04-06 : « Autre ligne… » comme deuxième bouton.
- v03-04 : le mini-chemin auj. → suite ? dans la feuille.
- v06-06 : « Changer » et la phrase « Retenu veut dire Décidé ».

| v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|
| 6 | 6 | 8 | 8 | 6 | 8 |

## 5. Nouveau carnet

**Avis.**
- **IA.**
  - v01-06 trouve un vrai voisin (« à côté de “CO2 qui baisse” ») et propose « à faire ? Changer le joint du robinet 2 », avec
    « Rien n'est créé sans ton OK ».
  - v06-05 sépare ta note, ta question et la « Tâche proposée · l'IA, pas tes notes », et précise « Aucun prix inventé : un lien collé le donnera ».
  - Les autres copient p3-v04.
- **UX.** La feuille basse est la même partout.
- **Neuf.** « Sur une ligne ouverte… » (v04 et v05) suppose la métaphore du métro. « Sur un carnet ouvert… » (v01 et v06) se comprend seul.

**Problèmes**
1. **m** v06-05 : le titre « Manomètre de la cuve 2 » se coupe en deux lignes à cause de la pastille d'état.
2. **m** v02-08, v04-07 et v05-06 sont des copies de la référence.

**Meilleurs mécanismes**
- v01-06 : le carnet voisin nommé, avec sa première tâche.
- v06-05 : « Aucun prix inventé ».

| v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|
| 8 | 6 | — | 6 | 6 | 8 |

## 6. Mes notes, on écrit

**Avis.**
- **UX.** Toutes les versions sont de vraies notes, sans numéro, avec les outils au-dessus du clavier (M4B tenu).
  - v04 et v05 soulignent finement les mots lus par l'IA.
  - v02 met « Coller le lien » dans la barre d'outils.
- **IA.** Le badge sur l'onglet (« 2 à ranger », « 1 à ranger ») dit l'état de l'IA sans quitter la note.
- **Neuf.** v06 réduit Ranger à l'icône ✦ : un nouveau venu ne sait pas ce qu'elle fait.

**Problèmes**
1. **m** v06-07 : Ranger en icône seule et clavier AZERTY.
2. **m** v03-05 : Ranger en gros bouton noir. Il prend le premier plan alors que l'IA doit partir seule (constat 7).
3. **m** v01-07 : aucun soulignement des mots lus pendant l'écriture.

**Meilleurs mécanismes**
- v04-08 et v05-07 : le soulignement fin des mots lus.
- v02-10 : Coller le lien dans les outils.
- v01-07 : le bouton « Demander », graine du bouton Aide qu'il veut.

| v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|
| 7 | 8 | 6 | 8 | 8 | 7 |

## 7. Mes notes, sa ligne retrouvée

**Avis.**
- **UX.** Toutes surlignent la ligne et donnent un retour (« ‹ depuis Organisé · Trouvé »).
  - v04-09 pose dans la note une carte de lien riche et une case « rappeler l'entreprise X lundi » : la note de téléphone qu'il veut.
- **IA.** Le trajet bloc → ligne est la meilleure preuve que l'IA ne réécrit pas.
- **Neuf.** Le fil d'Ariane « ‹ Organisé · Joint du siphon trouvé » de v03 est le plus clair.

**Problèmes**
1. **m** v01-08 : photo et lien marqués « imaginée », sans fil de retour explicite vers Organisé.
2. **m** v03-08 : deux lignes de sa note fusionnées en une (« trouvé usé, fuite sous la dalle pas trouvée »). Sa note est retouchée.

**Meilleurs mécanismes**
- v04-09 : la case à cocher dans la note.
- v02-13 et v06-08 : le retour « ‹ ouvert depuis “trouvé” dans Organisé ».

| v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|
| 6 | 8 | 7 | 8 | 7 | 8 |

## 8. L'IA lit

**Avis.**
- **IA.** Toutes montrent le bandeau « L'IA lit tes N lignes et le lien · Arrêter ».
  - v03 ajoute une barre de progression, v04 ajoute « Ton texte ne bouge pas ».
  - v01 et v03 mettent l'état sur l'onglet (« lecture… », « en cours »).
- **UX.** Le bandeau est court et Arrêter reste à droite.
- **Neuf.** Le badge « … » de v06 sur Organisé est cryptique.

**Problèmes**
1. **m** v06-24 : badge « … » sans mot.
2. **m** v05-09 : copie de M4.

**Meilleurs mécanismes**
- v04-10 : « Ton texte ne bouge pas. »
- v03-06 : la barre de progression.

| v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|
| 7 | 7 | 8 | 8 | 6 | 7 |

## 9. Organisé : un problème ouvert (écoulement qui fuit)

**Avis.** C'est l'écran qui doit répondre au besoin, et aucun ne tient les règles de ce soir (constats 1 à 3).
- **UX.**
  - v04-11 a le meilleur visuel neuf : « Le chemin · une couleur par piste ». Joint du siphon (vert ✓), sous la dalle (orange ?),
    entreprise X (bleu, devis attendu), sur un axe 24 nov. → 25 nov. → suite. C'est spécifique au carnet, donc pas une frise générique.
    Mais Trouvé et Pas trouvé redisent ensuite la même chose.
  - v06-09 est le plus net en tête : titre, question, points d'état, puis jetons trouvé · pas trouvé · devis · ≈ 150 CHF, critère,
    Ensuite, et les façons en barres coût et délai.
  - v02 et v05 ont les barres coût et temps les plus lisibles, mais sous une frise et une ligne « Rangé ».
- **IA.** « conseillé · l'IA, pas tes notes » est partout, c'est honnête.
  - v03-07 sépare « Dans tes lignes · lu par l'app » des conseils de l'IA, c'est le plus clair sur qui dit quoi. Mais ses trois
    boutons noirs « Retenir » écrasent la hiérarchie.
- **Neuf.**
  - « D'où vient la fuite ? » (v02 et v05) dit tout de suite de quoi il s'agit.
  - Les 4 cases (depuis, dernier pas, coût, prochaine) de v01 et v04 se lisent sans aide.
  - « Le chemin » de v04 demande une seconde pour comprendre les couleurs, mais la légende « une couleur par piste » est là.

**Problèmes**
1. **B** v01-09, v02-12, v03-07, v04-11, v05-10 et v06-09 : plus de 30 mots au premier écran (estimé).
2. **B** v02-12, v03-07 et v05-10 : frise fixe et centrale, et première info utile après 120 px.
3. **B** v01-09 et v04-11 : barre segmentée à 4 états, fixe et centrale (FRISE-GENERIQUE sous une autre forme).
4. **m** v04-11 : Trouvé et Pas trouvé redisent « Le chemin ». v01-09 : « prochaine : relancer le devis » est répété en bas.
5. **m** v03-07 : trois boutons noirs « Retenir ». L'action secondaire prend le poids d'une action principale.
6. **m** v06-09 : le bandeau gris d'en-tête descend jusqu'à environ 315 px, et la bascule Mes notes / Organisé est petite, en haut à droite.

**Meilleurs mécanismes**
- v06-09 : l'en-tête en jetons (trouvé · pas trouvé · devis · coût) et l'état en points, sans frise.
- v04-11 : le chemin en lignes de métro, une couleur par piste, qui remplace Trouvé / Pas trouvé au lieu de s'y ajouter.
- v05-10 et v02-12 : façons en barres coût et temps, puis estimation empilée (joint 150 + dalle : devis ? hachuré).
- v03-07 : « Dans tes lignes · lu par l'app » au-dessus de tout ce que dit l'IA.
- v01-09 : les 4 cases, à garder à 2 au plus (coût, prochaine) si les jetons de v06 sont pris.

| v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|
| 6 | 5 | 6 | 7 | 5 | 7 |

## 10. Feuille « Changé par l'IA »

**Avis.**
- **IA.** C'est le meilleur mécanisme de confiance de la passe.
  - Partout : un interrupteur par proposition, « Mes notes ne bougent pas », « Avant l'IA · 21:26 » et « Garder 1 sur 2 ».
  - v05-11 ajoute le cadenas : une erreur de lecture corrigée reste corrigée (« 150 CHF : une estimation, pas un prix »).
  - v03-09 rend le classement réversible (« Rangé : Local › Eau · proposé par l'IA »).
  - v06-10 dit « Critère … proposé, pas posé dans tes notes » et renvoie à « tes lignes 2, 3 ».
- **UX.** Feuille basse et deux boutons au pouce, partout.
- **Neuf.** « Avant l'IA · 21:26 » se comprend seul. Le cadenas de v05 demande sa phrase d'explication.

**Problèmes**
1. **m** v04-12 : les sources sont des dates (« 24 nov. › ») au lieu des lignes. Le chemin vers la preuve est moins précis.
2. **m** v05-11 : 6 lignes et un paragraphe d'en-tête, c'est la feuille la plus longue.
3. **m** v01-22 et v02-14 : copies de M4.

**Meilleurs mécanismes**
- v05-11 : le cadenas sur la correction de l'utilisateur.
- v03-09 : le classement proposé dans la feuille.
- v06-10 : « proposé, pas posé ».

| v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|
| 7 | 7 | 8 | 6 | 8 | 8 |

## 11. Options et Comparer

**Avis.**
- **UX.**
  - v06-19 est le meilleur Comparer. Il est classé sur un critère, avec des barres, l'écarté reste en ligne avec sa raison
    (« écarté · bruit »), et « sans aperçu · sans valeurs · Compléter » est honnête.
  - v02-15 donne des mini-barres par option (adapté, coût, dispo) et l'histoire de l'écarté (« écarté 6 nov., repris 21, écarté 22 »).
  - v01-10 montre le glisser Écarter révélé et la pastille « 30 nov. · dans À venir » sur le retenu.
- **IA.**
  - « Pourquoi B plutôt que A ? Tes notes ne le disent pas. Ajouter » (v01 et v02) : l'IA demande ce qui manque au lieu de l'inventer.
  - v06 : « L'IA propose le critère · Garder / Autre ».
- **Neuf.** Un écarté barré mais visible se comprend seul.

**Problèmes**
1. **m** v05-12 : 13 notes listées sous les options, c'est Mes notes en double.
2. **m** v02-15 : une barre pour « adapté » (qualitatif) avec « bien » est une fausse précision.

**Meilleurs mécanismes**
- v06-19 : le critère proposé par l'IA (Garder / Autre) et les barres classées.
- v01-10 : « Pourquoi B plutôt que A ? … Ajouter ».
- v02-15 : « Veille sur B · a sonné le 20 nov. ».

| v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|
| 8 | 8 | — | 7 | 6 | 9 |

## 12. Décider (devis reçu)

**Avis.**
- **UX et goût.** v01-11 fait ce qu'il aime, « qui gagne quoi », avec deux tuiles côte à côte : « Devis reçu · entreprise X 185 CHF »
  face à « Moi-même 9 CHF · 1 h samedi ». Les autres reprennent M4 (Retenu cité, Ensuite, Garder, En réserve).
- **IA.** v06-11 : la photo du devis remplit le coût, et la section s'appelle « En réserve · pas écartés ».
- **Neuf.** « Garder » sur la tâche se comprend ; « Retenir » sur une réserve, moins bien.

**Problèmes**
1. **m** v04-14 et v05-13 : copies de M4.
2. **m** v06-11 : l'en-tête et les jetons repoussent le Retenu sous 190 px.

**Meilleurs mécanismes**
- v01-11 : les deux tuiles « devis face à toi-même ».
- v06-11 : le devis photographié qui remplit le coût.

| v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|
| 9 | 7 | 7 | 6 | 6 | 8 |

## 13. La tâche du carnet

**Avis.**
- **IA.** Toutes les versions disent « Cocher la tâche ? » en citant « Joint changé. », puis donnent le conseil pour la suite.
  - v04-15 dit simplement « la case ci-dessus attend ton toucher ».
  - v03-11 met le lien de l'entreprise sous « si la flaque revient ».
- **UX.** Le bouton Cocher est noir et à droite, c'est bien.

**Problèmes**
1. **m** v06-12 : l'en-tête prend environ 200 px avant la tâche.
2. **m** v05-14 : copie de M4.

**Meilleurs mécanismes**
- v03-11 : le lien de secours rangé sous sa condition.
- v04-15 : la phrase qui dit qui coche.

| v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|
| 7 | 7 | 8 | 7 | 6 | 6 |

## 14. À faire : les tâches de tous les carnets

**Avis.**
- **UX et TDAH.** v02-18 et v06-13 ouvrent sur « Une décision t'attend » avec la question et les deux prix (« Le sanitaire ou
  moi-même ? 150 ou 10 CHF ») : une décision avant une liste.
  - v01, v03 et v05 se ressemblent (Pour avancer · Achats datés aussi dans À venir · Quand j'ai le temps · Fait cette semaine).
  - v04-16 est une liste plate « prochaine station de chaque ligne » avec des cercles pointillés qui ont l'air désactivés.
- **IA.** Les veilles avec interrupteur (« tous les 3 jours ») sont visibles et coupables d'un toucher dans v02, v04 et v06.
- **Neuf.** « Prochaine station » demande la métaphore. « Une décision t'attend » se lit seul.

**Problèmes**
1. **m** v04-16 : cercles pointillés pris pour des cases inactives, et aucun regroupement.
2. **m** v05-15 : quasi copie de v01-13.
3. **m** Aucune version ne garde les vignettes photo de p3-v05, le visuel qu'il avait classé.

**Meilleurs mécanismes**
- v02-18 et v06-13 : « Une décision t'attend », la question et deux prix.
- v01-13 : « Achats datés · aussi dans À venir » (C4).
- p3-v05 : les vignettes, à remettre.

| v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|
| 7 | 9 | 7 | 5 | 6 | 8 |

## 15. Résoudre sur preuve

**Avis.**
- **IA.** Toutes les versions disent « La flaque n'est pas revenue : Résolu ? » en citant deux lignes datées.
  - v01-14 range aussi le devis non pris (« Classer le devis : pas pris ? Non / Oui ») et chiffre « 9 CHF au lieu de 185 CHF ».
  - v02-19 donne « Coût réel du joint : pas noté · Noter ».
- **UX.** Pas encore / Résolu en deux gros boutons, au pouce.

**Problèmes**
1. **m** v04-17, v05-16 et v06-14 : copies de M4.

**Meilleurs mécanismes**
- v01-14 : la fermeture qui nettoie (le devis rangé) et le gain chiffré.
- v02-19 : le coût réel demandé, pas inventé.

| v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|
| 8 | 8 | 7 | 6 | 6 | 6 |

## 16. Résolu : fermé grâce à l'achat

**Avis.**
- **UX.**
  - v03-14 donne « Le chemin » daté en 5 lignes (24 nov. Noté → 30 nov. Résolu), lisible d'un coup d'œil.
  - v04-18 montre avant → après en deux photos.
  - v01-15 et v04-18 font une rangée de vignettes photo des résolus.
  - v06-15 nomme les résolus en pastilles (« Pompe qui cavite · 14 oct. »), plus lisibles que les icônes seules de v02.
- **IA.** v03-15 : « Arrêter la veille du condenseur B ? Non / Oui » ; v03-14 : « Ne plus attendre le devis de l'entreprise X ? ».
  La fermeture range ce qui traîne, c'est très utile.
- **Neuf.** « Résolu en 27 jours, fermé grâce à l'achat du condenseur B » se lit seul partout.

**Problèmes**
1. **m** v02-20 : rangée de résolus en icônes seules, sans nom.
2. **m** v02-20 : reprend presque p3-v01.

**Meilleurs mécanismes**
- v03-15 : « Arrêter la veille ? », la fermeture qui nettoie.
- v03-14 : le chemin daté.
- v04-18 : avant → après.
- v06-15 : les résolus nommés.

| v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|
| 8 | 7 | 9 | 8 | 7 | 7 |

## 17. Relecture des mois plus tard : pourquoi j'ai pris ça

**Avis.**
- **IA.** v03-16 est le meilleur.
  - « Pourquoi tu as pris ça » avec ses mots cités et datés.
  - « Ce que tu savais alors », en icônes datées.
  - « B plutôt que A : tes notes ne le disent pas. Seul écart noté : 150 CHF de moins · l'IA ».
  - « Si ça revient » et « Voir dans Mes notes ».
  - v02-21 : « Toujours le bon choix ? Oui / Pas sûr ».
  - v04-19 : « pourquoi : tes notes ne le disent pas · Ajouter ».
- **UX.** La fiche en tableau (problème, essayé, pris, pourquoi, durée) de v01 est compacte. v05-18 dépasse un écran.

**Problèmes**
1. **m** v05-18 : la fiche et « Ce que tu savais alors » débordent largement le premier écran.
2. **m** v01-16 : copie de la référence.

**Meilleurs mécanismes**
- v03-16 : « Ce que tu savais alors » et « tes notes ne le disent pas ».
- v02-21 : « Toujours le bon choix ? ».

| v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|
| 7 | 8 | 9 | 7 | 6 | 7 |

## 18. Un achat (frigo, ventilation, évier)

**Avis.**
- **UX.**
  - v04-20 met Comparer en barres dans Organisé, avec deux colonnes débit et prix et l'écarté barré avec sa raison (« aspire en haut,
    le CO2 reste au sol »). C'est « qui gagne quoi » sans ouvrir une page.
  - v06-18 : la fiche du lien collé (image, 420 CHF en stock, Surveiller, caractéristiques, « rangé dans Extracteur mural seul ·
    Changer »).
- **IA.** v05-19 dit ce qu'elle a lu et ce qui manque (« Lu : prix, délai, taille, débit. Manque : bruit, conso. »), c'est le plus honnête.
- **Neuf.** « Veille du prix · tous les 3 jours » avec interrupteur se comprend seul.

**Problèmes**
1. **m** v03-17 : le bandeau « Pas encore choisi » et trois tuiles Articles / Comparer / Décisions (presque la base) prennent beaucoup de place.
2. **m** v01-17 : 4 cases et Décisions avec pourquoi, c'est dense.

**Meilleurs mécanismes**
- v04-20 : Comparer en barres en ligne.
- v05-19 : « Lu / Manque ».
- v06-18 : la fiche du lien avec « rangé dans … Changer ».

| v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|
| 7 | 7 | 6 | 9 | 8 | 8 |

## 19. Un mémo, rien à faire

**Avis.** Les six versions reprennent M4 : carte « Le sol époxy tient », « Relier à … ? Non / Relier », « Tes lignes, telles quelles »
et « Genre proposé : mémo, rien à faire · gardé ».
- **IA.** v03-18 ajoute « je le ressortirai quand tu noteras “sol” ou “époxy” » : il sait quand le mémo reviendra.
- **Neuf.** v01-18 annonce « Mémo · rien à faire » en tête.

**Problèmes**
1. **m** v06-20 : un mémo porte l'état « Noté ●○○○ », ce qui contredit « rien à faire ». Les jetons d'en-tête redisent la carte.
2. **m** v02-23, v04-21 et v05-20 : copies de M4.

**Meilleurs mécanismes**
- v03-18 : quand il ressortira.
- v01-18 : le genre en tête.

| v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|
| 8 | 7 | 9 | 7 | 6 | 6 |

## 20. Autre genre : CO2 qui baisse dans un fût

**Avis.** La même forme qu'un problème, partout, sans champ propre à l'exemple. C'est juste.
- **IA.** v03-19 fait dire « ≈ 7 kg perdus » par un « calcul de l'IA ». Un chiffre doit venir de l'app, comme v03-20 le fait pour le
  malt (« calcul de l'app »). v06-21 cite la source (« d'après tes lignes du 10 et du 24 nov. »).
- **UX.** v02 et v05 : barres coût et délai, puis « CO2 perdu ≈ 7 kg » en une ligne.

**Problèmes**
1. **m** v03-19 : un calcul attribué à l'IA.
2. **m** v01-19 et v04-22 : copies de p3-v02.

**Meilleurs mécanismes**
- v06-21 : le chiffre avec sa source dans tes lignes.
- v03-19 : « En attendant, ferme la bouteille le soir · l'IA ».

| v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|
| 6 | 8 | 7 | 6 | 7 | 8 |

## 21. Autre genre : malt en rupture

**Avis.**
- **UX et IA.** v03-20 est le meilleur.
  - Jetons « × pils 25 kg en rupture · brassin S49 · +4 CHF par sac ».
  - La veille avec interrupteur sur l'option « Attendre ».
  - Le lien fournisseur, « 26 nov. · dans À venir » sur le retenu.
  - « S49 : 4 sacs × 4 CHF = +16 CHF · calcul de l'app ».
  - « La veille reste allumée : si le pils revient avant le 26, tu le sauras ».
- v06-22 : critère « même recette, même date ».

**Problèmes**
1. **m** v05-22 : une barre « recette · même » vide, illisible.
2. **m** v01-20 et v02-25 : copies de la passe 3.

**Meilleurs mécanismes**
- v03-20 : le calcul de l'app et la veille sur l'option.
- v06-22 : le critère qui oriente.

| v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|
| 6 | 7 | 9 | 7 | 6 | 8 |

## 22. Cas d'épreuve (photo seule, « truc à voir », fête, assurance)

**Avis.** Partout : « photo seule, sans texte · On dirait un tuyau qui goutte. Rattacher ? Oui / Nouveau problème / Laisser ». Rien n'est forcé.
- **UX.** v05-23 met « À ranger » en tête et replie le reste, c'est le plus direct. v02-09 ouvre la fête sur sa question
  (« Quoi servir le 14 juin ? ») avec une barre de coût.
- **Neuf.** « truc à voir · rien d'autre écrit : reste ici » rassure.

**Problèmes**
1. **m** v06-23 : « À ranger » est sous Brasserie et Papiers. Le cas qui attend arrive en dernier.

**Meilleurs mécanismes**
- v05-23 : À ranger d'abord.
- v02-09 : la fête comme question.

| v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|
| 7 | 8 | 6 | 7 | 8 | 6 |

## 23. Hors ligne

**Avis.**
- **IA.** Partout : « Hors ligne · ta ligne est gardée ; son envoi attend le réseau · Annuler l'envoi », « Pas encore lue par l'IA »
  avec la citation, et « Tel que l'IA l'a laissé le 28 nov. à 10:05 ». C'est honnête.
- **UX.** v01-24 et v03-23 mettent « 1 en file » sur l'onglet Organisé, visible depuis Mes notes.

**Problèmes**
1. **m** v05-24 : copie de M4.
2. **m** v06-25 : « 1 ligne en file » est tout en bas, hors du coup d'œil.

**Meilleurs mécanismes**
- v01-24 et v03-23 : « 1 en file » sur l'onglet.
- v06-25 : le dernier état connu, daté.

| v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|
| 8 | 7 | 8 | 7 | 6 | 7 |

## 24. L'IA n'a pas pu lire

**Avis.**
- **IA.**
  - v03-22 lit seule ce qu'un repli sans IA peut plausiblement lire : trouvé, pas trouvé, devis, 150 CHF, le lien, et la photo gardée
    (« l'IA la lira aussi »). C'est le bon repli.
  - v06-26 en fait plus (options, tâche) et ajoute un bouton Garder. C'est utile, mais lire « options : le sanitaire, entreprise X »
    dans « Contacter l'entreprise X pour un sanitaire » demande une IA : le repli promet plus que l'app ne peut faire sans elle.
- **UX.** Réessayer est en noir, à droite, partout. « Continuer dans Mes notes » est un gros bouton.

**Problèmes**
1. **B** v06-26 : « options » et « tâche » sont annoncées « lues seules, sans l'IA ». C'est une promesse non tenable et cela brouille
   la frontière app / IA, qui est la clé de la confiance.
2. **m** v02-27 et v05-25 : la frise affiche « Décidé » pendant l'erreur, l'état précédent se mêle au repli.

**Meilleurs mécanismes**
- v03-22 : le repli plausible et la photo gardée.
- v06-26 : la présentation en pastilles (trouvé, pas trouvé, devis, coût) avec la citation dessous, à garder **sans** options ni tâche.

| v01 | v02 | v03 | v04 | v05 | v06 |
|---|---|---|---|---|---|
| 7 | 6 | 8 | 7 | 6 | 6 |

---

## Probant ?

**Non, pas en l'état ; oui comme carrière de mécanismes.**
- Sur Organisé, l'écran qui doit répondre au besoin, aucune version ne tient ses trois règles de ce soir :
  - plus de 30 mots partout ;
  - frise ou barre d'états fixe partout sauf v06 ;
  - première info utile trop bas dans v02, v03 et v05.
- Sur la moitié du parcours (Décider, Tâche, Résoudre, Mémo, Hors ligne, Erreur), les six versions sont M4 à une ligne près : la
  passe n'a pas exploré là.
- La critique donne 6,5/10 à toutes : il n'y a aucun classement.
- En revanche, chaque rangée a un ou deux mécanismes neufs et justes, que la recette ci-dessous greffe.

**Les trois meilleurs mécanismes de la passe**
1. **v06 : en-tête en jetons sans frise** (trouvé · pas trouvé · devis · coût, état en points), avec **v04 : le chemin en lignes de
   métro**, une couleur par piste, à la place de Trouvé / Pas trouvé.
2. **La feuille « Changé par l'IA », fine :**
   - cadenas sur ses corrections (v05) ;
   - classement proposé et réversible (v03) ;
   - « proposé, pas posé » (v06) ;
   - fermeture qui nettoie : « Arrêter la veille ? », « Ne plus attendre le devis ? » (v03).
3. **« Qui gagne quoi » au moment de décider :**
   - « Une décision t'attend » avec la question et deux prix (v02, v06) ;
   - le devis face à toi-même, 185 contre 9 CHF (v01) ;
   - Comparer en barres en ligne (v04 achat, v06 Comparer).

## Recette de greffe pour un jouable

| Écran | Mécanisme retenu (source) |
|---|---|
| Liste au repos | Lignes de v04-01 (état en pastille, piste en un mot), rangée basse de v01-01 qui filtre d'un toucher (v06-02), en-têtes de domaine repliables de v01 ; légende courte des mini-barres v02 si on les garde |
| Glisser | Légende des deux dépôts v03-02, cible « Poser ici · rang 3 » v04-03, bandeau Annuler blanc v05-03 ; jamais de changement de genre au glisser |
| Noter vite | Une ligne v02/v04, « Coller … · copié il y a 2 min » v04-05, phrase-promesse v06-04 au premier usage seulement, clavier QWERTZ |
| Note rangée | Feuille p3-v03, « Autre ligne… » v04-06, mini-chemin v03-04, « Changer » et « Retenu veut dire Décidé » v06-06 ; aucun prix venu de l'IA |
| Nouveau carnet | Voisin nommé et tâche v01-06, « Aucun prix inventé » v06-05 |
| Mes notes | Note M4B, soulignés fins v04-08, Coller le lien dans les outils v02-10, case à cocher dans la note v04-09 ; Ranger en secondaire (l'IA part seule), bouton **Aide** au « + » qui propose check / tâche / suggestion (graine : « Demander » v01-07) |
| L'IA lit | Bandeau M4, « Ton texte ne bouge pas » v04-10, état sur l'onglet v01/v03 |
| Organisé (problème) | En-tête v06-09 (titre, question, points d'état, jetons), **sans frise** ; chemin en métro v04-11 à la place de Trouvé / Pas trouvé ; façons en barres coût et temps v05-10, estimation empilée ; « lu par l'app » v03-07 ; une seule action noire ; 30 mots au plus, le reste à un toucher |
| Changé par l'IA | Feuille M4, cadenas v05-11, classement proposé v03-09, « proposé, pas posé » et renvoi aux lignes v06-10 |
| Options / Comparer | Comparer v06-19 (critère proposé Garder / Autre, barres, écarté et sa raison, Compléter), « Pourquoi B plutôt que A ? Ajouter » v01-10, « dans À venir » sur le retenu, glisser Écarter |
| Décider | Tuiles « devis face à toi-même » v01-11, photo du devis qui remplit le coût v06-11, Ensuite M4 |
| Tâche | M4, lien de secours sous sa condition v03-11 |
| À faire | « Une décision t'attend » (question et deux prix) v02-18/v06-13, Achats datés aussi dans À venir v01-13, vignettes p3-v05, veilles à interrupteur |
| Résoudre | M4, devis classé et gain chiffré v01-14, coût réel « Noter » v02-19 |
| Résolu | Chemin daté v03-14, « Arrêter la veille ? » v03-15, avant → après v04-18, résolus nommés v06-15 |
| Relecture | v03-16 (pourquoi, ce que tu savais alors, « tes notes ne le disent pas »), « Toujours le bon choix ? » v02-21, fiche tableau v01 |
| Achat | Comparer en barres en ligne v04-20, « Lu / Manque » v05-19, fiche du lien « rangé dans … Changer » v06-18 |
| Mémo | M4, genre en tête v01-18, « je le ressortirai quand tu noteras “sol” » v03-18 ; pas d'état d'avancement |
| CO2, malt | Forme du problème ; jetons d'en-tête v03-20, veille sur l'option, chiffres « calcul de l'app » avec leur source v06-21, jamais « calcul de l'IA » |
| Cas d'épreuve | À ranger en tête v05-23, fête en question v02-09 |
| Hors ligne | M4, « 1 en file » sur l'onglet v01-24/v03-23, dernier état daté v06-25 |
| Erreur | Repli v03-22 (trouvé, pas trouvé, devis, coût, lien, photo gardée) en pastilles v06-26, **sans** options ni tâche |

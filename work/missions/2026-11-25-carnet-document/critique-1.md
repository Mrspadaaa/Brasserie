# Critique 1 — « un carnet, pas un chat » (25.11)

Juge : Opus, calibré sur PORTRAIT.md v2 (§ 7 : note = min(lisibilité, besoin), puis − 0,5).
Lu : ITERATIONS.md, DOSSIER.md, RESULTAT.md, la fixture `tests/fixtures/c79/zz-ecoulement-qui-fuit.json`,
DEFAUTS-RECURRENTS § CARNET-REPOND-AU-BESOIN, CARNET-COHERENT, CARNET-LISTE-COMPACTE (sans objet ici : aucune liste),
CHAMP-CARNET-REPLIE, et CLASSEMENT-3 (« Beaucoup ne répond que à un problèmematique ou pas du tout... »).
Captures ouvertes : les 12 de `cap/m1..m4-{avant,apres,annuler}.png`.
Règle n° 1 : `choix/ecrans.json` n'a aucun écran Carnet choisi. Les seules références sont ses paroles : le champ reste
visible (24.11) et la forme de la maquette v01 passe 3 (jetons, options, tâche proposée).

Légende : **B** = bloquant (valeur fausse ou incohérente, élément de sa demande absent, refus explicite rejoué,
geste sans effet). **m** = mineur. **D** = doute, non compté.

## Problèmes communs aux 4 maquettes (comptés dans chacune)

- **C1 B — aucune option, donc rien à décider.** Captures : `*-apres.png`. Le cas en porte au moins trois : changer
  le joint soi-même, faire venir le sanitaire pour le joint, faire venir le sanitaire pour la dalle. Le contrôle de
  CARNET-REPOND-AU-BESOIN exige « les options et la prochaine tâche » dès l'ouverture.
  - Corriger : un bloc Options de 2 ou 3 lignes, avec coût relatif et lien vers la note, et un toucher pour retenir
    une option. Retenir passe l'état à Décidé (CARNET-COHERENT).
- **C2 B — le conseil contredit la prochaine étape.** Captures : `*-apres.png`. L'IA conseille « joint du siphon
  d'abord », mais la seule tâche reste « Contacter l'entreprise X ». La cause trouvée (joint usé) ne donne aucune
  tâche, et la « carte tâche proposée » de v01 passe 3 manque. C'est l'incohérence de CARNET-COHERENT (une option
  retenue contredit le fil).
  - Corriger : l'IA propose la tâche « Changer le joint du siphon », avec ses boutons Garder et Non, avant la sienne.
    « Contacter l'entreprise X » devient conditionnelle : « si la flaque revient ».
- **C3 B — un seul état d'un seul carnet problème.** Captures : `*-apres.png`. Aucune maquette ne montre Résolu
  (« joint changé, plus de flaque »), la relecture des mois plus tard (« pourquoi j'ai payé le sanitaire »), ni un
  carnet qui n'est pas un problème (mémo, achat, idée). C'est mot pour mot sa plainte de CLASSEMENT-3 : « ne répond que
  à un problèmematique ».
  - Corriger : ajouter à chaque maquette deux états, `#resolu` (même carnet fermé, le pourquoi lisible) et
    `#memo` (par exemple un achat de malt en rupture, fixture c79 `zz-malt-pilsner-en-rupture.json`), dans sa propre
    logique.
- **C4 m — Coller et Photo sans état après.** Captures : `*-avant.png`, `*-apres.png`. On ne voit ni où va
  `entreprise-x.ch` ni où va une photo.
  - Corriger : dans l'état après, le lien posé sur la tâche « Contacter l'entreprise X » et une vignette de photo
    (flaque) à sa note.
- **D (non compté)** — Que couvrent les 150 CHF : le joint ou la dalle ? Une fuite sous dalle coûte bien plus. L'IA
  pourrait le dire : « estimation = joint ; dalle hors estimation ».

## M1 · Le carnet se range — 10 problèmes (B 4)

1. **B** C1, options absentes (`m1-apres.png`).
2. **B** C2, le conseil (joint d'abord) contredit la prochaine étape (contacter X) (`m1-apres.png`).
3. **B** C3, parcours limité à « Je cherche » (`m1-apres.png`).
4. **B** « 150 CHF » en chasse fixe espacée (IBM Plex Mono, rendu Courier) (`m1-apres.png`). Refus de
   CARNET-COHERENT : « aucun chiffre en chasse fixe espacée dans le Carnet ». Corriger : la police du corps, en chiffres
   tabulaires.
5. **m** La réécriture fait disparaître ses mots : « Pistes : joint du siphon trouvé usé » devient « Joint du siphon
   usé ». Seul Annuler les rend. C'est sa crainte du chat, « ça s'efface et édité mal », et le pourquoi ne se relit plus
   (`m1-apres.png`). Corriger : un « ta note » repliable sous chaque section, ou greffer le renvoi par numéro de note
   de M2.
6. **m** Annuler reprend tout ou rien : une correction fausse fait perdre les 4 bonnes (`m1-apres.png` → `m1-annuler.png`).
   Corriger : greffer la feuille « Changé par l'IA » de M2, case par case.
7. **m** Le bandeau violet remplace la barre « < Carnets » : plus de retour dans l'état après (`m1-apres.png`).
8. **m** « attente » (barré) et « attendu » à droite : deux mots pour un même état (`m1-apres.png`).
9. **m** La pastille « ta note » à côté d'« Estimation » ne se comprend pas sans lire (`m1-apres.png`).
10. **m** C4, Coller et Photo sans état après (`m1-avant.png`, `m1-apres.png`).
- D : champ du bas à environ 46 px CSS, pour un plafond de 44 px dans CHAMP-CARNET-REPLIE.

**Le parcours.**

| noter vite | trouvé | pas trouvé | devis | coût | options | décider | tâche | résoudre | relire pourquoi | non-problème |
|---|---|---|---|---|---|---|---|---|---|---|
| trouvé | trouvé | trouvé | trouvé | trouvé | pas trouvé | pas trouvé | la sienne seule | pas trouvé | pas trouvé (réécrit) | pas trouvé |

**Note : lisibilité 8, besoin 6, donc 6, et 5,5 avec le retrait.**
Phrase prédite : « Propre, ça se lit bien, mais ça réécrit mes notes, c'est justement le problème du chat ??? Et il
manque les options. »

## M2 · La fiche au-dessus — 10 problèmes (B 6)

1. **B** C1, options absentes (`m2-apres.png`).
2. **B** C2 : la tuile conseil dit « joint d'abord » et la carte noire dit « Contacter l'entreprise X » (`m2-apres.png`).
3. **B** C3, parcours limité à « Je cherche » (`m2-apres.png`).
4. **B** Le titre est redit en note 1, « Écoulement qui fuit » (`m2-avant.png`). Refus de CARNET-COHERENT : « le titre
   n'est jamais redit en bulle ». Corriger : ne pas afficher cette note (la fixture la porte, l'écran la cache).
5. **B** « 150 CHF » en chasse fixe espacée (`m2-apres.png`, `m2-annuler.png`). Refus de CARNET-COHERENT.
6. **B** Au repos, le champ tient sur deux rangées (Photo et Coller, puis le champ, environ 95 px CSS)
   (`m2-apres.png`). CHAMP-CARNET-REPLIE veut une ligne de 44 px au plus. Corriger : photo, lien et envoi dans la ligne
   du champ, et Coller en puce seulement quand le presse-papiers a un lien.
7. **m** La fiche prend 46 % de l'écran, et ses notes 1 à 4 sortent de l'écran (« ▲ 1 à 4 plus haut ») : ses mots
   reculent dès que l'IA parle (`m2-apres.png`). Corriger : une fiche repliable en une rangée de jetons.
8. **m** Le devis est dit deux fois : la tuile « Devis attendu » et la ligne « Devis : à acheter → attente · Non »
   (`m2-apres.png`).
9. **m** Trois « nouveau » et un « Non » : du texte au premier plan. Le liseré violet suffit (`m2-apres.png`).
10. **m** C4, Coller et Photo sans état après (`m2-avant.png`, `m2-apres.png`).
- Le meilleur geste des quatre : la feuille « Changé par l'IA à 21:26 », case par case, chaque ligne liée à sa note,
  avec « Fiche de 21:18 » et « Garder 2 sur 3 » (`m2-annuler.png`). À greffer partout.

**Le parcours.**

| noter vite | trouvé | pas trouvé | devis | coût | options | décider | tâche | résoudre | relire pourquoi | non-problème |
|---|---|---|---|---|---|---|---|---|---|---|
| trouvé | trouvé | trouvé | trouvé | trouvé (« inconnu » avant, honnête) | pas trouvé | pas trouvé | la sienne seule | pas trouvé | partiel (numéros de notes) | pas trouvé |

**Note : lisibilité 6,5, besoin 6,5, donc 6,5, et 6 avec le retrait.**
Phrase prédite : « Le annuler case par case très bien, mais la fiche mange tout, mes notes on les voit plus... et
pas d'options ??? »

## M3 · Dans la marge — 11 problèmes (B 4)

1. **B** C1, options absentes (`m3-apres.png`).
2. **B** C2 : le conseil (joint d'abord) contredit « À venir ven. » sur « Contacter l'entreprise X » (`m3-apres.png`).
3. **B** C3, parcours limité à « Je cherche » (`m3-apres.png`).
4. **B** Au repos, le champ tient sur deux rangées (ligne de texte, puis rangée de 4 boutons, environ 110 px CSS)
   (`m3-apres.png`). Refus de CHAMP-CARNET-REPLIE.
5. **m** Pas de vue d'ensemble en 3 secondes. Trouvé, pas trouvé, coût et devis sont épars dans la marge, et
   « 150 CHF estimé · devis ? » est en gris 14 px près du titre. Sur un carnet de 20 notes, rien ne se verrait
   (`m3-apres.png`). Corriger : une ligne de jetons sous le titre (greffe de M2 ou M4).
6. **m** « devis ? » et « si ça refuit » sont des codes obscurs (`m3-apres.png`). C'est le « ? » sans raison de
   CARNET-COHERENT. Corriger : « devis : pas encore reçu » et « si la flaque revient ».
7. **m** « À venir ven. » : un vendredi qui sort de nulle part (PORTRAIT § 4, « sort de null part ») (`m3-apres.png`).
8. **m** La marge fait 138 px, en 14 px gras violet, coupée sur deux lignes : la lecture est serrée (`m3-apres.png`).
9. **m** La gomme dessine 8 croix. Sur « à acheter » grisé, « Remettre » ne dit pas ce qui revient. La barre noire
   cache le retour (`m3-annuler.png`). Corriger : greffer la feuille de M2.
10. **m** Réglure irrégulière : une ligne vide après « Pistes… » et après « fuite… », mais « Contacter… » et
    « Devis attendu. » sont collés (`m3-avant.png`).
11. **m** C4, Coller et Photo sans état après (`m3-avant.png`).
- À garder : ses mots jamais déplacés, l'encre de l'IA distincte, et la meilleure correction des quatre,
  « coût estimé, pas le devis ». Aucune chasse fixe.

**Le parcours.**

| noter vite | trouvé | pas trouvé | devis | coût | options | décider | tâche | résoudre | relire pourquoi | non-problème |
|---|---|---|---|---|---|---|---|---|---|---|
| trouvé | trouvé (marge) | trouvé (marge) | trouvé (marge) | trouvé (marge) | pas trouvé | pas trouvé | trouvé (date inventée) | pas trouvé | partiel (ses mots intacts) | pas trouvé |

**Note : lisibilité 6, besoin 6, donc 6, et 5,5 avec le retrait.**
Phrase prédite : « L'idée de la marge pas mal, mais c'est difficile à lire, et on voit pas où on en est d'un coup
d'œil. »

## M4 · Deux vues — 10 problèmes (B 6)

1. **B** C1, options absentes. La frise montre « Décidé », mais rien ne permet de décider (`m4-apres.png`).
2. **B** C2 : le conseil (joint d'abord) contredit « Ensuite : Contacter l'entreprise X » (`m4-apres.png`).
3. **B** C3 : un seul état. La frise Noté → Résolu est un bon début, mais Résolu n'est jamais montré, pas plus qu'un
   carnet non-problème (`m4-apres.png`).
4. **B** Chasse fixe à trois endroits : les horodatages « 24 nov. 21:18 » en Courier (`m4-avant.png`), « 150 CHF »
   (`m4-apres.png`), « ta note 5 · 21:26 » (`m4-annuler.png`). Refus de CARNET-COHERENT.
5. **B** Le titre est redit en première ligne de « Mes notes », « Écoulement qui fuit » (`m4-avant.png`). Refus de
   CARNET-COHERENT.
6. **B** Aucun champ dans « Organisé » : pour noter, il faut rebasculer (`m4-apres.png`). CHAMP-CARNET-REPLIE dit
   « le champ reste visible » et « je veux pas + d'action pour écrire ». Corriger : la même barre du bas dans les deux
   vues, une note tapée dans Organisé s'ajoutant à la fin de « Mes notes ».
7. **m** La barre « Estimé », noire et pleine, ne compare rien : c'est l'élément le plus gros de « L'argent », pour
   une seule valeur (« Ça c'est inutile ») (`m4-apres.png`). Corriger : pas de barre tant que le devis n'est pas là,
   puis estimé et devis sur une même échelle.
8. **m** « Mes notes » ne montre pas ce que l'IA a déjà pris (`m4-avant.png`). Corriger : un trait violet fin dans la
   marge des lignes utilisées, comme l'encre de M3.
9. **m** Le bas d'« Organisé » est vide à 40 %, là où les options et la tâche proposée manquent (`m4-apres.png`).
10. **m** C4, Coller et Photo sans état après (`m4-avant.png`).
- À garder : sa propre idée (deux vues), ses mots intacts, la frise d'état, la hachure du « pas trouvé », le menu par
  élément « Voir dans Mes notes / Remettre / Retirer de la vue » (`m4-annuler.png`).

**Le parcours.**

| noter vite | trouvé | pas trouvé | devis | coût | options | décider | tâche | résoudre | relire pourquoi | non-problème |
|---|---|---|---|---|---|---|---|---|---|---|
| trouvé (dans Mes notes) | trouvé | trouvé | trouvé | trouvé | pas trouvé | pas trouvé (frise seule) | la sienne seule | partiel (frise) | partiel (Voir dans Mes notes) | pas trouvé |

**Note : lisibilité 7,5, besoin 7, donc 7, et 6,5 avec le retrait.**
Phrase prédite : « Vachement bien l'idée des 2 vues, c'est ça, mais il manque les options, et c'est quoi cette barre
noire ? Et je veux pouvoir écrire depuis Organisé. »

## Classement

1. **M4** : sa propre idée, la plus visuelle, avec un menu d'annulation par élément.
2. **M2** : le meilleur geste d'annulation, mais une fiche lourde et deux refus rejoués.
3. **M1** : la plus lisible, mais elle réécrit ses mots.
4. **M3** : ses mots intacts et la meilleure correction, mais pas de vue d'ensemble.

## Greffes pour la correction 1

| Idée | Origine | Reçoit |
|---|---|---|
| Feuille « Changé par l'IA », case par case, liée aux notes | M2 | M1, M3, M4 |
| Correction « coût estimé, pas le devis » ; encre IA distincte sur ses lignes | M3 | M1, M2, M4 (Mes notes) |
| Frise d'état Noté → Je cherche → Décidé → Résolu | M4 | M1, M2, M3 |
| Numéro de note sur chaque élément de l'IA | M2 et M4 | M1 |
| Hachure du « pas trouvé » (honnêteté) | M4 | M2 |

## Retouches communes

C1 (options), C2 (tâche proposée cohérente avec le conseil), C3 (états `#resolu` et `#memo`) et C4 (lien et photo
posés). Plus aucune chasse fixe dans les quatre maquettes, le titre jamais redit, et un champ d'une ligne au repos.

LEÇON PROPOSÉE : aucune.

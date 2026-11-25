# Persona ia, itération 1 : un spécialiste des carnets assistés par IA (Notion AI, Reflect, Craft, Granola)

Je ne suis pas le brasseur. Ma question pour chaque maquette : l'IA aide-t-elle vraiment (classer, conseiller, corriger) ?
Voit-on ce qu'elle a fait ? Peut-on lui faire confiance, et l'annuler ? Que se passe-t-il quand elle se trompe ou qu'elle n'est pas là ?
J'ai ouvert les 12 captures (`cap/m1..m4-{avant,apres,annuler}.png`) et le texte des 4 HTML.
Le cas est le carnet réel `tests/fixtures/c79/zz-ecoulement-qui-fuit.json`.

Légende : **B** bloquant (la confiance ou l'annulation cassent, l'IA contredit le fil, l'état sans IA manque), **m** mineur, **D** doute (non compté).

## Communs aux 4 (comptés dans chaque maquette)
- **Aucun état « IA absente ».** Les 4 maquettes n'ont aucun état hors ligne, erreur ou attente : le grep sur « hors ligne / erreur / chargement / lu par l'app » ne trouve rien.
  Or CARNET-REPOND-AU-BESOIN exige un repli : l'analyse locale, marquée « lu par l'app ».
  Rien ne montre non plus ce que devient la note quand l'IA échoue (gardée ? en attente ?), ni l'attente pendant qu'elle travaille (2 à 5 s).
- **Le conseil contredit la tâche.** Le conseil dit « joint du siphon d'abord, puis un nettoyage ; flaque encore là : la dalle ».
  La tâche proposée reste pourtant « Contacter l'entreprise X ». L'IA rend donc deux prochaines étapes incompatibles, sans les réconcilier.
  En métier, changer le joint est un geste à quelques francs, à faire soi-même. La tâche devrait être « Changer le joint du siphon », et « Contacter le sanitaire » seulement si la flaque revient.
  C'est l'incohérence que CARNET-COHERENT interdit (« l'option retenue contredit le fil »).
- **Le lien collé ne sert à rien.** `entreprise-x.ch` est proposé au collage, mais aucun état « après » ne montre où l'IA le range, alors qu'il irait naturellement sur la tâche « Contacter l'entreprise X ». (m)

## M1 · Le carnet se range (réécrit) : 9 problèmes, dont 5 bloquants
1. **B** Pas d'état IA absente, erreur ni attente (commun). Capture : toutes.
2. **B** Le conseil contredit la tâche (commun). Capture : `m1-apres`.
3. **B** La piste « Fuite sous la dalle » porte ✗ rouge « pas trouvé », qui se lit « écartée ». Le conseil désigne pourtant la dalle comme cause restante. L'IA a tranché en silence une note ambiguë : « pas trouvée » veut-il dire écartée, ou pas encore localisée ? Elle aurait dû marquer « ? » et demander. Capture : `m1-apres`.
4. **B** Ses mots disparaissent. « Pistes : joint du siphon trouvé usé » devient « Joint du siphon usé », et « Estimation 150 CHF (exemple) » devient « 150 CHF ». Hors du bandeau Annuler (temporaire), aucun accès à ses notes d'origine. C'est exactement sa crainte du chat (« ça s'efface et édité mal ») ; Notion et Apple Notes montrent toujours l'original avant de remplacer. Capture : `m1-apres`.
5. **B** « Rangé · 5 changements » n'est pas listé, et l'annulation reprend tout ou rien. On ne peut ni voir les 5 changements, ni en refuser un seul. Le toast « Rangement annulé » disparaît, et rien ne permet de revenir plus tard à une version. Capture : `m1-apres`, `m1-annuler`.
6. **m** Après l'annulation, la note « Estimation 150 CHF (exemple) » reste sur fond gris, sans dire pourquoi (pas encore rangée ? en attente ?). Capture : `m1-annuler`.
7. **m** « Ranger » est le seul bouton d'envoi. Pour noter sans faire réécrire tout le document, il n'y a aucun geste. Capture : `m1-avant`.
8. **m** « 150 CHF » est en chasse fixe espacée (IBM Plex Mono), ce que CARNET-COHERENT interdit. Capture : `m1-apres`.
9. **m** Lien collé non utilisé (commun).
- D : le gabarit Constat / Pistes / Prochaine étape / Coût / Conseil semble fixe. Que fait l'IA d'un mémo ou d'une idée ?
- **Parcours** : noter vite oui ; trouvé / pas trouvé oui, mais faux pour la dalle ; devis oui ; coût oui ; options non ; décider non ; tâche oui, mais contredite ; résoudre non ; relire pourquoi non (mots perdus) ; carnet non-problème non montré.
- **Note : 4,5/10.** L'IA aide, mais elle réécrit son texte. C'est le motif que Notion, Apple et Granola évitent : on ne remplace jamais sans montrer l'original.

## M2 · La fiche au-dessus : 9 problèmes, dont 3 bloquants
1. **B** Pas d'état IA absente, erreur ni attente (commun). Capture : toutes.
2. **B** Le conseil contredit la tâche noire « Contacter l'entreprise X » (commun). Capture : `m2-apres`.
3. **B** Même ✗ « Pas trouvé » sur la dalle, alors que le conseil dit « c'est la dalle ». Capture : `m2-apres`.
4. **m** On ne sait pas si la correction est appliquée ou seulement proposée. La tuile affiche déjà « Devis · attendu » pendant que la ligne « Devis : à acheter → attente » attend encore un « Non ». Capture : `m2-apres`.
5. **m** Ses notes 1 à 4 passent sous la fiche IA (« ▲ 1 à 4 plus haut ») : ses mots viennent en second, derrière l'IA. Capture : `m2-apres`.
6. **m** Le bouton d'envoi n'est qu'une étincelle, sans mot. Envoie-t-il la note, lance-t-il l'IA, ou les deux ? Et que fait-il, champ vide ? Capture : `m2-avant`.
7. **m** « 150 CHF » en chasse fixe (CARNET-COHERENT). Capture : `m2-apres`.
8. **m** Lien collé non utilisé (commun).
9. **m** La tuile « À acheter · Devis » de l'état avant (fiche de 21:18) affiche une erreur de classement avec assurance, sans « ? ». Capture : `m2-avant`.
- D : quand s'effacent les trois « nouveau » ? à la visite suivante ?
- **Le meilleur modèle d'annulation des 4.** La feuille « Changé par l'IA à 21:26 » liste chaque changement avec sa note source et une case. On peut garder 2 sur 3, ou revenir à la « Fiche de 21:18 », et l'aperçu change derrière la feuille. C'est le modèle de Notion « suggérer » et de Reflect (« answers linked to source notes »).
- **Parcours** : noter vite oui ; trouvé / pas trouvé oui (dalle fausse) ; devis oui ; coût oui ; options non ; décider non ; tâche oui (contredite) ; résoudre non ; relire pourquoi oui (versions horodatées, sources) ; non-problème non montré.
- **Note : 7/10.**

## M3 · Dans la marge : 9 problèmes, dont 3 bloquants
1. **B** Pas d'état IA absente, erreur ni attente (commun). Capture : toutes.
2. **B** Le conseil (« joint du siphon d'abord ») contredit la tâche « Contacter l'entreprise X » (commun). Capture : `m3-apres`.
3. **B** L'IA invente « ven. » et l'écrit comme une tâche déjà posée. La pastille noire « À venir ven. » ressemble à une action validée, sans « proposé » ni geste d'accord. Elle engage un rendez-vous qu'il n'a pas décidé, ce que CARNET-COHERENT interdit : « proposé d'un toucher, jamais écrit seul ». Capture : `m3-apres`.
4. **m** L'état avant porte déjà des étiquettes grises (constat, trouvé, à acheter) sans auteur. Qui les a écrites, l'app ou l'IA d'avant ? La fausse « à acheter » n'a aucune source. Capture : `m3-avant`.
5. **m** L'IA classe mais ne structure presque pas. Coût et devis tiennent dans une ligne grise en haut de marge (« 150 CHF estimé · devis ? »), et ce « ? » n'est pas expliqué (CARNET-COHERENT : « ? sans dire pourquoi »). Capture : `m3-apres`.
6. **m** Mode Gomme : chaque × fait environ 20 px et colle au texte (« devis ? × », « si ça refuit × »). Mal toucher fait perdre une annotation. Capture : `m3-annuler`.
7. **m** Le ✗ rouge « pas trouvé » sur la dalle, avec « si ça refuit », reste ambigu : écartée ou à surveiller ? Capture : `m3-apres`.
8. **m** Le conseil ne cite pas ses notes ; seule sa position les suggère. Capture : `m3-apres`.
9. **m** Lien collé non utilisé (commun).
- **Ce qui est juste.** Ses mots ne bougent jamais. L'encre de l'IA est distincte, violette, comme le gris de Granola. Chaque annotation s'efface seule (×), « Remettre » rend la correction, « Tout 21:26 » défait tout. C'est la confiance la plus haute des 4.
- **Parcours** : noter vite oui ; trouvé / pas trouvé oui ; devis faible ; coût faible ; options non ; décider non ; tâche oui (inventée) ; résoudre non ; relire pourquoi partiel ; non-problème non montré.
- **Note : 6/10.**

## M4 · Deux vues : 10 problèmes, dont 2 bloquants
1. **B** Pas d'état IA absente, erreur ni attente (commun). Le cas manque plus ici qu'ailleurs : sans IA, que montre « Organisé » ? Capture : toutes.
2. **B** Le conseil contredit la tâche « Contacter l'entreprise X » (commun). Capture : `m4-apres`.
3. **m** Rien ne signale qu'« Organisé » est périmé. Après une note écrite dans « Mes notes », aucun « organisé à 21:26 · 1 note pas encore lue » : c'est le premier piège d'un modèle à deux vues. Capture : `m4-avant`, `m4-apres`.
4. **m** « note 5 » et les pastilles « 3 » renvoient à des numéros absents de « Mes notes », qui n'a que des heures. Seul « Voir dans Mes notes » relie les deux. Capture : `m4-apres`.
5. **m** Pas d'historique d'organisation ni d'annulation globale : seulement bloc par bloc. On ne peut pas revenir à « Organisé de 21:18 ». Capture : `m4-annuler`.
6. **m** « Retirer de la vue » s'affiche en rouge avec une corbeille, ce qui ressemble à une suppression de sa note. Il faut un autre picto (œil barré). Capture : `m4-annuler`.
7. **m** La barre noire pleine de « Estimé 150 CHF » n'a rien à quoi se comparer. C'est du visuel inventé par la vue IA, sans donnée. Capture : `m4-apres`.
8. **m** Heures et montants en chasse fixe (« 24 nov. 21:18 », « 150 CHF », « ta note 5 · 21:26 ») (CARNET-COHERENT). Capture : `m4-avant`, `m4-apres`, `m4-annuler`.
9. **m** Le conseil ne cite pas ses notes, alors que tous les autres blocs le font. Capture : `m4-apres`.
10. **m** Lien collé non utilisé (commun).
- D : « Mes notes » ne montre pas ce que l'IA a utilisé ou corrigé (déjà relevé par le critique).
- **Ce qui est juste.** Son texte n'est jamais réécrit, comme Granola (mes notes / version enrichie) et Obsidian (fichier à soi). Chaque bloc cite sa note. Le « ? » sur la dalle est la seule lecture honnête des 4 : l'IA ne tranche pas ce qu'il n'a pas tranché. Le menu par bloc offre « Remettre « à acheter » ». Le stepper Noté › Résolu couvre décider et résoudre.
- **Parcours** : noter vite oui ; trouvé / pas trouvé oui (honnête) ; devis oui ; coût oui ; options non ; décider oui (stepper) ; tâche oui (contredite) ; résoudre oui (stepper) ; relire pourquoi oui (sources) ; non-problème non montré, mais ses rubriques (« La fuite », « L'argent », « Ensuite ») suggèrent une vue qui s'adapte au carnet.
- **Note : 7,5/10.**

## Greffes proposées à la correction 1
- **Feuille « Changé par l'IA »** (M2 : cases, note source, « Garder n sur m », version horodatée), vers M1 (à la place du tout ou rien) et M4 (annulation globale).
- **Encre violette sur ses mots** (M3), vers « Mes notes » de M4 : soulignés « lu par l'IA », sans rien réécrire.
- **« ? » quand sa note est ambiguë** (M4), vers M1, M2 et M3, avec un geste « écartée / pas encore cherchée ».
- **Un état « IA absente »** pour les 4 : bandeau « Lu par l'app (hors ligne) · l'IA relira au retour du réseau ». La note est gardée, l'action IA grisée, et l'attente est montrée pendant l'appel.
- **Une seule prochaine étape réconciliée** : « Changer le joint du siphon » ; « Contacter l'entreprise X » devient conditionnel (« si la flaque revient »), et le lien collé s'y attache.
- **Toute tâche venue de l'IA reste « proposée »** jusqu'à son toucher (M3 « ven. »).

persona-ia-1 : M1 9 (B 5) 4,5/10 ; M2 9 (B 3) 7/10 ; M3 9 (B 3) 6/10 ; M4 10 (B 2) 7,5/10

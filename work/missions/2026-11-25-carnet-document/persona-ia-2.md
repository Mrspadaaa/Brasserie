# Persona ia, itération 2 : un spécialiste des carnets assistés par IA (Notion AI, Reflect, Craft, Granola)

Je ne suis pas le brasseur. Mes questions restent les mêmes. L'IA aide-t-elle vraiment (classer, conseiller, corriger) ? Voit-on ce qu'elle a fait ?
Peut-on lui faire confiance, et l'annuler ? Que se passe-t-il quand elle se trompe ou qu'elle n'est pas là ?
J'ai ouvert les 46 captures de `cap/` une par une : M1 13 (dont `avant`, `apres` et `annuler`, copies identiques de `note`, `cherche` et `change`, vérifié par md5), M2 9, M3 11, M4 13.
Les captures `m3-avant`, `m3-apres`, `m4-avant` et `m4-apres` sont celles de la v0. Je les ai ouvertes, mais je ne les juge pas : voir « Hors maquettes ».
Le cas est le carnet réel `tests/fixtures/c79/zz-ecoulement-qui-fuit.json`. Correction 1 lue : `CORRECTION-1.md`, `RESULTAT.md`.

Légende : **B** bloquant (la confiance ou l'annulation cassent, l'IA contredit ou falsifie le fil, l'état sans IA manque), **m** mineur, **D** doute (non compté).

## Bilan de la correction 1
Les 4 maquettes ont maintenant tout le parcours, un état hors ligne avec « lu par l'app », la feuille « Changé par l'IA » et une tâche réconciliée avec le conseil (joint d'abord, entreprise X « si la flaque reste »).
Il n'y a plus de date inventée, et le lien collé est rangé. Sur les 37 problèmes de l'itération 1, 34 sont corrigés, 2 le sont en partie (M2 m5, M3 m7) et 1 reste (M2 B3).
Le défaut qui reste est le même dans 3 maquettes : **l'IA tranche encore la dalle**, par une icône ✗ rouge (M2, M4) ou par une phrase (M3).

## Communs (comptés dans chaque maquette concernée)
- **C1 · Pas d'état « erreur en ligne ».** Seul le hors ligne est dessiné. Le grep « erreur / échec / réessa » sur les 4 HTML ne trouve rien.
  Rien ne montre une IA qui dépasse son délai, refuse ou rend un résultat vide alors que le réseau est là : pas de « Réessayer », pas de « tes notes sont gardées ». (m, M1 à M4)
- **C2 · Une citation qui blanchit une inférence.** L'IA pose une référence « nᵒ » sur une affirmation que la note ne contient pas :
  - « quelques francs » est cité sur la note 2, qui ne parle pas de prix ;
  - « 150 CHF » est attribué au sanitaire avec la note 6, qui dit seulement « Estimation 150 CHF (exemple) ».
  C'est l'inverse de la promesse de Reflect (« answers linked to source notes ») : la source rassure sans prouver. Des mois plus tard, l'inférence se relit comme un fait. (m, M1 à M4)
- **C3 · Ni attente ni annulation de l'envoi en file.** Seule M1 montre l'IA au travail (« Rangement en cours · 3 s », Arrêter) et un « Annuler l'envoi » hors ligne.
  M2, M3 et M4 n'ont pas d'attente dessinée, et leur bouton « 1 attend », « 1 en attente » ou « En attente » ne dit pas comment retirer l'envoi. (m, M2 à M4)
- **C4 · Noter sans lancer l'IA.** Le seul bouton d'envoi est « Ranger » ou « Annoter ». M1 a la touche « Ajouter » du clavier ; M2, M3 et M4 ne montrent aucun geste pour noter sans relancer l'IA. (m, M2 à M4)

## M1 · Le carnet se range : 8 problèmes, dont 0 bloquant
Itération 1, **9 sur 9 corrigés** :
- B1, IA absente : `m1-attente` (« L'IA lit tes 8 notes… », Arrêter, « sans changer un mot ») et `m1-hors-ligne` (« Lu par l'app · en attendant l'IA », file, Annuler l'envoi).
- B2, conseil et tâche : la tâche proposée est « Changer le joint du siphon » ; la note 4 passe « → seulement si la flaque reste ».
- B3, dalle : « ? à situer », avec la question « Écartée / Pas encore cherchée » (`m1-cherche`), puis sa réponse « pas cherchée » (`m1-decide`).
- B4, ses mots : les lignes sont déplacées, jamais réécrites. « Mes 11 notes, dans l'ordre où je les ai tapées » (`m1-relire`).
- B5, tout ou rien : 7 cases avec leur note source, « Avant, 21:30 », « Garder 6 sur 7 » (`m1-change`).
- m6 à m9 : « pas encore rangée », la touche Ajouter, aucune chasse fixe, le lien posé sur la note 4 conditionnelle.

Nouveaux :
1. **m** C1, pas d'erreur en ligne. Capture : toutes.
2. **m** C2 : « quelques francs, estimé · n2 » et « ≈ 150 CHF, ton estimation · n4, n7 », repris dans « Le sanitaire, ≈ 150 CHF estimé n7 ». Captures : `m1-cherche`, `m1-relire`.
3. **m** La synthèse « Écarté » est écrite par l'IA à l'encre noire, comme ses mots ; seule « La cause trouvée » est violette.
   Sa citation est fausse : « plus de flaque n3 », alors que la note 3 dit « pas trouvée » et que « plus de flaque » vient de la note 11. Capture : `m1-relire`.
4. **m** « Retirer « Contacter l'entreprise X » (n4) » : retirer sa note, alors que la feuille promet « Tes mots ne sont jamais changés ». Il faut dire « Classer sans suite ». Capture : `m1-resolu`.
5. **m** La même décision a deux gestes : « Retenir » sur « Changer le joint soi-même » et « Garder la tâche » sur « Changer le joint du siphon ».
   La feuille coche aussi « Tâche proposée » alors que la tâche attend encore « Garder ». Décocher, ou toucher Non : qu'est-ce qui diffère ? Captures : `m1-cherche`, `m1-change`.
6. **m** « Options écartées : Sanitaire pour la dalle · si la flaque reste » : l'option est écartée et gardée en réserve dans la même ligne. Il faut dire « en réserve ». Capture : `m1-decide`.
7. **m** « pas encore rangée » ne marque que la photo 6, alors que les notes 1 à 5 sont elles aussi affichées en vrac, avant tout rangement. On ne sait pas ce que l'IA a déjà lu. Capture : `m1-note`.
8. **m** Achat : l'IA ajoute un critère qu'il n'a pas écrit (« robinet de soutirage »), au rang de ses critères, et un lieu inventé (« sous l'étagère ») dans la tâche proposée. Capture : `m1-achat`.
- D : hors ligne, « Lu par l'app » propose déjà « Tâche ? Changer le joint du siphon ». Une lecture locale par mots-clés tire-t-elle vraiment « changer » de « trouvé usé » ? Sinon, le repli promet ce que l'app ne tiendra pas. Capture : `m1-hors-ligne`.
- **Ce qui est juste.** C'est le meilleur cycle IA des 4 :
  - l'attente annonce ce qu'elle va faire, et Arrêter l'interrompt ;
  - la question sur la dalle est posée au lieu d'être tranchée ;
  - la raison est **sa** note 10, liée par « = ta raison · Décidé par toi, proposé par l'IA » ;
  - Résolu est seulement proposé (« Résolu ? » en pointillé, « Valider 3 », « Coût réel : pas noté, l'ajouter ? ») ;
  - l'ordre d'origine reste accessible.
- **Parcours** : noter vite oui ; trouvé / pas trouvé oui (« ? » honnête) ; devis oui ; coût oui ; options oui ; décider oui ; tâche oui ; résoudre oui (proposé) ; relire pourquoi oui (ses mots) ; carnet non-problème oui (achat).
- **Note : 8/10** (4,5 avant).

## M2 · La fiche au-dessus : 8 problèmes, dont 1 bloquant
Itération 1 :
- **7 corrigés** :
  - B2, conseil et tâche : « Joint du siphon d'abord », tâche proposée, « si la flaque revient » sur la note 4 ;
  - m4 : « Proposé » en pointillé, avec Oui / Non ;
  - m6 : le bouton dit « Ranger » ;
  - m7 : aucune chasse fixe ;
  - m8 : le lien est posé sur l'étape conditionnelle (`m2-decide`) ;
  - m9 : « Devis · pas encore reçu » ;
  - B1, en grande partie : `m2-sans-ia`, avec « Fiche · lu par l'app », « sans conseil ni option », « 1 attend ». L'attente manque (C3).
- **1 en partie**, m5 : la fiche est repliable et toutes ses notes sont visibles, mais elle reste au-dessus d'elles ; ce point relève du persona ux.
- **1 encore là**, B3 : voir le problème 1 ci-dessous.

Nouveaux et restants :
1. **B** (reste de l'itération 1) La dalle est toujours tranchée :
   - la tuile « ✗ Pas trouvé · Fuite sous la dalle » est hachurée en rouge (`m2-apres`), et l'option « Chercher sous la dalle » aussi (`m2-options`) ;
   - le jeton « ✗ dalle » reste jusqu'à Décidé (`m2-decide`) ;
   - or le conseil, juste à côté, garde la dalle comme suite (« Si la flaque revient : le sanitaire, pour la dalle »).
   L'icône dit « écartée », le texte dit « en suspens ».
2. **m** C1, pas d'erreur en ligne.
3. **m** C3, ni attente ni annulation du « 1 attend ». Capture : `m2-sans-ia`.
4. **m** C2 : « joint trouvé usé n°2 · une pièce, quelques francs », « 150 CHF estimé n°6 » pour le sanitaire, et « Le sanitaire était estimé 150 CHF n°6 ». Captures : `m2-options`, `m2-relire`.
5. **m** Sous « Retenu par toi », « Parce que le joint est trouvé usé n°2… » est écrit par l'IA, sans ✦. Il n'a jamais donné de raison (note 7 : « samedi »).
   Des mois plus tard, « Pourquoi ce choix » ne contient que la reconstruction de l'IA, aucun de ses mots. Captures : `m2-decide`, `m2-relire`.
6. **m** Sans IA, « Coût 150 CHF » perd « estimé ». Le repli local affirme plus que sa note, alors que la fiche IA disait « pas un devis ». Capture : `m2-sans-ia`.
7. **m** Derrière la feuille, la tuile Coût affiche « 150 CHF » sans « pas un devis », alors que la case « 150 CHF estimé, pas un devis » est cochée : l'aperçu ne suit pas la case. Capture : `m2-annuler`.
8. **m** C4 : un seul bouton, « Ranger », pour envoyer. Capture : `m2-avant`.
- D : « ✗ dalle : pas en cause » (`m2-resolu`) est une conclusion juste ici, mais posée sans source ni proposition.
- **Ce qui est juste.**
  - La feuille reste exemplaire (« Décoche : la fiche derrière revient à l'avant », « Tout annuler », « Garder 5 sur 6 »).
  - La date « Samedi » est proposée depuis **sa** note 7, jamais inventée.
  - « Fermé par toi · L'IA avait proposé Résolu, d'après ta note n°8 » : on sait qui a fait quoi.
  - Le mémo est rangé sans tâche, et le lien vers « Écoulement qui fuit » est proposé.
- **Parcours** : noter vite oui ; trouvé / pas trouvé oui (dalle tranchée) ; devis oui ; coût oui ; options oui ; décider oui ; tâche oui ; résoudre oui ; relire pourquoi en partie (raisons de l'IA, pas les siennes) ; carnet non-problème oui (mémo).
- **Note : 7/10** (7 avant : le parcours est complet, mais le bloquant de la dalle est toujours là).

## M3 · Dans la marge : 9 problèmes, dont 1 bloquant
Itération 1 :
- **8 corrigés** :
  - B1 : `m3-hors-ligne`, l'encre grise « lu par l'app » distincte du violet, « 1 en attente » (attente : C3) ;
  - B2, conseil et tâche : « Tâche proposée, comme le conseil » (`m3-options`) ;
  - B3, « ven. » : « Sans date : à toi de dire quand », puis « Quand ? » ;
  - m4 : « à acheter (lu par l'app) » est barré, avec son auteur (`m3-range`) ;
  - m5 : jetons et options A, B, C ;
  - m6 : la gomme est remplacée par la feuille ;
  - m8 : « d'après tes notes 2 à 6 », « cause trouvée (2) » ;
  - m9 : « lien collé, posé ici ».
- **1 en partie**, m7 : la marge dit « si la flaque revient » et « C en réserve », mais le jeton de tête « ✗ dalle : pas trouvée » reste rouge hachuré (`m3-range`). Surtout, le bloquant 1 ci-dessous apparaît.

Nouveaux :
1. **B** Le « pourquoi » falsifie sa note 3 : « pourquoi : joint trouvé usé (2), **rien sous la dalle (3)** ». La note 3 dit « pas trouvée », pas « rien ».
   À la relecture, la marge garde « raison 2 · rien d'autre trouvé ». C'est la phrase qu'il relira dans des mois, avec une citation qui la cautionne. Captures : `m3-decide`, `m3-relire`.
2. **m** C1, pas d'erreur en ligne.
3. **m** C3, ni attente ni annulation du « 1 en attente ». Capture : `m3-hors-ligne`.
4. **m** C2 : « B · 150 CHF estimé (6) » ; à la relecture, l'IA ajoute « , pour le sanitaire » à sa citation, et « raison 3 · le sanitaire, cher » (« cher » est un jugement de l'IA). Captures : `m3-options`, `m3-relire`.
5. **m** Le jeton « ✓ cause : joint du siphon » affirme la cause, alors que la marge dit « cause probable » : le résumé est plus sûr que le détail. Capture : `m3-range`.
6. **m** La photo envoyée avec la note 6 est détachée de sa note et posée sous la note 1. Or la feuille promet « Tes lignes ne bougent jamais ». Le geste est défaisable, mais il déplace son contenu. Captures : `m3-note`, `m3-range`, `m3-annuler`.
7. **m** « devis : jamais demandé » contredit sa note 5, « Devis attendu » (attendu, donc demandé). Capture : `m3-resolu`.
8. **m** Hors ligne, le repli local remet l'erreur connue « à acheter » et « coût : 150 CHF », sans « estimé » ni « ? ». Capture : `m3-hors-ligne`.
9. **m** C4 : un seul bouton, « Annoter », pour envoyer. Capture : `m3-note`.
- D : la tâche d'achat « Mesurer la largeur de A et B » ne peut pas se faire tant qu'il n'a pas les fermenteurs. Il faudrait « Vérifier la largeur sur les fiches ». Capture : `m3-achat`.
- **Ce qui est juste.**
  - La relecture « Pourquoi A · tes mots, pas réécrits » cite ses notes entre guillemets, mot pour mot. C'est le meilleur modèle de citation des 4 : il rend une fausse source visible d'un coup d'œil.
  - L'achat est honnête : « pour quand : pas dit », « ton « ? » : prix à revoir », « largeur de A et B : dans aucune note ».
  - La feuille a « Version de 21:26 », et « Passer à Je cherche » est proposé avec Passer / Non.
- **Parcours** : noter vite oui ; trouvé / pas trouvé oui (dalle tranchée au pourquoi) ; devis oui ; coût oui (« coût réel : 12 CHF ») ; options oui ; décider oui ; tâche oui ; résoudre oui ; relire pourquoi oui (ses mots cités), mais la marge et la décision sont faussées ; carnet non-problème oui (achat).
- **Note : 6,5/10** (6 avant).

## M4 · Deux vues : 6 problèmes, dont 1 bloquant
Itération 1, **10 sur 10 corrigés** :
- B1 : `m4-sans-ia` est le meilleur repli des 4. La vue est datée (« Vue rangée le 24 nov. à 21:41 ») et dit « l'IA n'a pas lu ta note 8 ». Ses mots sont cités en preuve des propositions locales (« « changé » · note 8 »).
- B2 : la tâche « Changer le joint du siphon » ; « Si la flaque reste : contacter l'entreprise X », avec le lien.
- m3 : « 6 à ranger », « à jour ».
- m4 : Mes notes est numéroté.
- m5 : la feuille a « Avant l'IA · 21:26 ».
- m6 : la corbeille est retirée.
- m7 : la barre est retirée.
- m8 : aucune chasse fixe.
- m9 : le conseil cite « notes 1 à 3 ».
- m10 : le lien est posé.

Nouveaux :
1. **B** Régression : le « ? » sur la dalle (`m4-apres`, v0), seule lecture honnête des 4 à l'itération 1, devient un ✗ rouge :
   - « Sous la dalle · cherché, pas trouvé » (`m4-range`, `m4-options`) ;
   - « dalle ✗ » dans le chemin (`m4-resolu`) ;
   - ✗ rouge à la relecture (`m4-relire`).
   L'IA elle-même dit pourtant « d'ouvrir la piste de la dalle » (`m4-decide`), puis « Si ça revient : la dalle n'a jamais été ouverte » (`m4-relire`).
2. **m** C1, pas d'erreur en ligne.
3. **m** C3, ni attente ni annulation du « En attente ». Capture : `m4-sans-ia`.
4. **m** C2 : « conseillé · quelques CHF · note 2 » ; « Sanitaire estimé 150 CHF, notes 5, 6 ». À la relecture, « Écarté · Le sanitaire pour le joint : 150 CHF estimé » est le seul bloc sans aucune note citée. Captures : `m4-options`, `m4-relire`.
5. **m** « Devis : ~~à acheter~~ → attendu · correction » corrige une étiquette qu'on n'a jamais vue dans cette maquette : `m4-noter` ne montre aucune étiquette. C'est une correction fantôme. Capture : `m4-range`.
6. **m** C4 : un seul bouton, « Ranger », pour envoyer. Capture : `m4-noter`.
- D : « Tout garder » accepte d'un toucher 4 propositions, dont un changement d'état (`m4-range`) ; à garder, mais seulement après un premier rangement compris ?
- D : le mémo « Te resservira pour : refaire un sol, choisir un revêtement, la soude » pose des étiquettes de l'IA sans source ni « proposé » (`m4-memo`).
- **Ce qui est juste.**
  - Le trait violet et l'étiquette en marge sur chaque note lue (`m4-notes-lues`) : la greffe de M3 est réussie. On voit ce que l'IA a lu et ce qu'elle en a fait, sans un mot réécrit.
  - La raison est **sa** note 7, tapée dans Organisé et rangée dans Mes notes (« Décidé à 21:40, d'un toucher sur « Retenir » »).
  - La relecture « Ce que tu savais alors » et la recherche « trouvé par « siphon » ».
  - Le mémo « genre proposé par l'IA · pas un problème », avec « Tes 3 notes, telles quelles ».
  - « Ne plus attendre le devis ? » est proposé, et « Coût du joint : pas noté · + Noter ».
- **Parcours** : noter vite oui ; trouvé / pas trouvé oui (dalle tranchée) ; devis oui ; coût oui (demandé) ; options oui ; décider oui ; tâche oui ; résoudre oui ; relire pourquoi oui (ses mots) ; carnet non-problème oui (mémo).
- **Note : 7,5/10** (7,5 avant : tout est corrigé, mais une régression sur le point de confiance clé).

## Hors maquettes (pour le pilote, non compté)
- `page.html` cite toujours `m3-avant`, `m3-apres`, `m4-avant` et `m4-apres`, qui sont de la v0. Le brasseur y verrait :
  - pour M3, la pastille « À venir ven. » inventée ;
  - pour M4, « Contacter l'entreprise X → À venir », qui contredit le conseil, et la chasse fixe.
  Ce sont les défauts corrigés. À remplacer avant de lui montrer la page.

## Greffes proposées à la correction 2
- **Le « ? à situer » de M1**, avec sa question « Écartée / Pas encore cherchée », vers M2, M3 et M4 : l'icône, le jeton et la phrase du pourquoi. La dalle n'est « écartée » que s'il l'a dit.
- **La raison, ce sont ses mots** (M1 note 10, M4 note 7), vers M2 et M3 : à « Retenir », l'IA demande « pourquoi ? » d'une ligne au lieu d'écrire « Parce que ».
- **La citation entre guillemets de M3** (« tes mots, pas réécrits ») sous chaque « nᵒ » des 4 : une source qui ne dit pas ce qu'on lui fait dire se voit aussitôt (C2).
  Ce que l'IA sait sans ses notes (« une pièce, quelques francs ») se marque « l'IA, pas tes notes ».
- **L'attente, Arrêter et Annuler l'envoi de M1**, vers M2, M3 et M4 ; plus un état « erreur en ligne » pour les 4 : « L'IA n'a pas pu lire · Réessayer · tes notes sont gardées ».
- **La touche Ajouter sans IA** (M1), vers M2, M3 et M4.
- **Le repli local** garde « estimé » et marque d'un « ? » ses étiquettes incertaines (M2, M3).

persona-ia-2 : M1 8 (B 0) 8/10 ; M2 8 (B 1) 7/10 ; M3 9 (B 1) 6,5/10 ; M4 6 (B 1) 7,5/10 ; B total 3

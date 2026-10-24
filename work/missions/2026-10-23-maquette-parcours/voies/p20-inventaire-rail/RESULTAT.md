OK — 39 fonctions du rail jouées sur sa base v4.10 : 18 perdues ou changées sur 5345f6ad, contrôle écrit

Voie p20 (D124). Le brasseur a raison : sur la maquette 24.10 (5345f6ad), 18 des 39 fonctions du rail de sa base v4.10 sont perdues (8 absentes, 10 changées). Jouées au doigt (390 × 844, tactile) sur sa base puis sur la maquette ; chaque capture a été ouverte en image (montages base / 5345f6ad regardés).

## Fonctions perdues ou changées sur 5345f6ad (en tête)

| id | ses mots | défaut | base v4.10 (ce qu'elle fait) | 5345f6ad | écart mesuré |
|---|---|---|---|---|---|
| rail-ebullition-renvoi | « C'est defini ailleur dans l'application... » ; durée lue avec son renvoi, sans −/+ (BRIEF-RAIL 4) | D37 révisé | La ligne « Ébullition 60′ » porte un renvoi (chevron, lien vers la fiche de brassage), sans champ ni −/+. | different | « Ébullition 60′ » est un texte simple : aucun lien ni bouton dans la ligne, plus de renvoi vers l'endroit où l'ébullition se règle (le chevron « › » de sa base manque). Pas de −/+ non plus. |
| rail-loupe-rapport | « j'avais dit à la apple en mode zoom loop » ; « L'échelle ne s'adapte toujours pas à l'endroit où on est ??? » (×3 au moins sous le doigt) | D47, D55, D67 ; L12 | Sous le doigt, 22 px par graduation ; au loin dans le segment, 7 px : rapport ×3 (loupe à plateau ×3, rampe de 2 graduations). | different | Pas de grossissement : 14 px entre graduations partout (rapport ×1,0) ; l'échelle ne « zoome » pas là où est le doigt. |
| rail-ebullition-reguliere | « le passage entre 10' et 5' de fait très mal car on doit passe au dessus des houblons... » | D45 | Les 5 graduations voisines du doigt sont régulières (écart-type / moyenne ≤ 0,25), au pas de 5′. | different | Écarts de 14, 48, 48, 14 px autour du doigt (écart-type / moyenne 0,55) : les traits sous la bulle « 35′ » et la puce manquent. |
| rail-ibu-au-lacher | « Probablement lié au recalcule de l'ibu pas forcément utile à la volée instantané.. » | D46 | Le total d'IBU (60) et l'IBU de la ligne ne bougent pas pendant le geste ; au lâcher à 35′ le total passe à 50 et la ligne à 50 IBU. | different | Le total se recalcule à la volée : 60 au repos, 49 pendant le geste (doigt tenu à 35′), contre 60 pendant dans sa base. |
| rail-ibu-ecart | IBU de la ligne et total recalculés au lâcher (BRIEF-RAIL 3) | D46 | Au lâcher, l'écart du total s'écrit au-dessus de l'IBU (« −10 » de 60 à 50) ; il disparaît ensuite. | absent | Aucun écart écrit au-dessus du total au lâcher (le total passe de 60 à 49 sans « −11 »). |
| rail-geste-interrompu | un geste interrompu (pointercancel) rend la carte à sa place (BRIEF-RAIL 3) | D42 | Après un touchcancel doigt descendu de 106 px, la carte revient à sa place (même y, même moment 60′, aucune graduation ouverte, aucune ombre). | different | La carte reste où le doigt l'a laissée : à 189 px au lieu de 147 px et à 20′ au lieu de 60′ (IBU 36) ; un appel du téléphone change la recette. |
| rail-whirlpool-echelle | whirlpool : température de 100 à 60 °C par 5 (BRIEF-RAIL 1) ; « pas dechelle pour les autres que des choix fix » | D44 | Doigt dans le whirlpool (85 °C) : 95, 90, 80, 75 °C écrits, traits par 5 de 100 à 60 °C, rien d'autre d'ouvert. | absent | Aucune température : la poignée lit « 60′ … 5′ » puis « après · 4 j » ; le doigt n'a jamais de °C. Le whirlpool est une étiquette, pas une échelle. |
| rail-whirlpool-lache | « Le slider fonctionne pour le boil mais pas pour les autres étape » | D44 | Deux lâchers dans le whirlpool (85 °C puis 70 °C) donnent deux réglages en °C, la carte dit « whirlpool ». | absent | Impossible : on ne peut pas poser un houblon à une température de whirlpool (aucun « °C » lu par la poignée). |
| rail-whirlpool-duree | whirlpool : sa durée, réglable sur la carte (BRIEF-RAIL 1) | D43 | La carte au whirlpool porte « − 20 min + » : « + » passe à 25 min. | absent | Aucun réglage de durée de whirlpool (et aucun lâcher possible au whirlpool). |
| rail-loupe-suit-segment | « L'échelle ne s'adapte pas ne de focus, homme pas là où je suis. L'échelle ébullition est très grande alors que celles où l'on est Whirlpool est toute petite » | D67 | Le doigt passé dans le whirlpool, ce segment devient la loupe : graduations en °C seulement, celles d'ébullition se referment. | absent | Le doigt n'atteint jamais le whirlpool : pas de loupe sur ce segment. |
| rail-froid-jours | « Que du j+3 SI on est en dehors du boil » ; J+0 à J+14 réguliers (D123) | D44, D123 | Doigt en fermentation (J+3) : J+1, J+2, J+4, J+5 écrits, J+0 à J+14 par 1 ; lâché, le moment se lit « J+3 ». | absent | Pas de J+n : la poignée lit « après · 4 j », « 5 j »… (7 j en bas d'écran), sans échelle J+0 à J+14 ni distinction fermentation / post-fermentation. |
| rail-froid-reglage-jour | « Que de j+3 » (commentaire) ; J+n et son réglage (D123) | D43 | La carte à froid porte « − J+3 + » : « + » passe à J+4, « − » deux fois à J+2. | absent | Aucun réglage − / + du jour sur la carte (la maquette écrit « 7 j » sans réglage). |
| rail-froid-aucun-ibu | « aucun IBU », « à froid » (D123) | D123 | Lâchée à froid, la ligne dit « à froid » et « aucun IBU » ; le total passe de 60 à 0. | different | La carte dit « dry hop » (mot de Dryhopper, écran au choix ouvert) et « ? IBU » au lieu de « à froid » et « aucun IBU ». |
| rail-post-segment | fermentation, puis post-fermentation : jour J+0 à J+14 (BRIEF-RAIL 1) | D44 | Lâché à J+10 sous « post-fermentation », le houblon se pose sous ce repère et se lit « J+10 ». | different | La post-fermentation reçoit le houblon (carte sous son repère) mais se lit « 7 j » et non « J+10 » : pas d'échelle en jours. |
| rail-froid-carte-puce | Le rail c'est toujours n'importe quoi. Il y a un vrai historique dessus (carte repliée, J+0 à J+14 réguliers) | D123 | Vers la fermentation et la post-fermentation, la carte se replie en puce (≤ 48 px) et les jours restent réguliers, sans chevauchement avec le contenu au-dessous. | different | Carte entière (non repliée) pendant le geste vers le froid, jours qui débordent sur les ajouts (constat du brasseur 24.10, D123). |
| rail-froid-mots-apres | Le rail de sa base : « à froid », « aucun IBU », J+n et son réglage | D123 | Après un lâcher à froid : la ligne à son moment, « à froid », « aucun IBU », « J+n » et son réglage ; aucun mot de Dryhopper. | different | Mots de Dryhopper (« dry hop », « ? IBU », « 7 j »), pas de réglage. |
| rail-ebu200 | « Je peux me dire tiens 200' c'est mieux » (cas-ebu200) | D37 | À 200′ : « Ébullition 200′ », la poignée monte jusqu'à 200′, rien au-delà. | absent | La page cas-ebu200.html n'existe pas dans la maquette 5345f6ad (capture de 120′ en regard). |
| rail-extremes | « On arrive pas à aller de l'extrême haut, à l'extrême bas » | D69 | D'un seul geste, de la durée d'ébullition à J+14 de la post-fermentation (le houblon du haut descendu jusqu'en bas), et du bas jusqu'à 60′ en haut, à 844 et 620 px d'écran. | different | Le bas du rail se lit « après · 7 j » (pas J+14) : on n'atteint jamais J+14 à 844 ni à 620 px. |

La cause de fond : CHOIX OK et RAIL OK ne jouaient que l'ébullition au repos et le geste de Nugget de 60′ à 35′. Tout le rail hors de l'ébullition (whirlpool en °C et sa durée, fermentation et post-fermentation en J+0 à J+14, J+n et son réglage, « à froid », « aucun IBU », J+14 en bas d'écran) a disparu sans qu'aucun contrôle ne le voie ; la loupe est devenue une règle à 14 px par 5′ ; le renvoi de l'ébullition, le geste interrompu et l'écart d'IBU au lâcher aussi.

## Fonctions gardées par 5345f6ad

- rail-repos-etapes : Mêmes six repères dans le même ordre (la maquette les resserre : 26 px entre fermentation et post-fermentation).
- rail-levure-etape : Levure bien entre whirlpool et fermentation ; la maquette y ajoute un chevron « › » qui ouvre l'étape Levure.
- rail-repos-sans-graduation : Aucune graduation au repos (0 texte, 0 trait).
- rail-ajouts-hors-rail : Mêmes trois ajouts sous le rail avec « 10′ » ; aucune minute orpheline (la maquette propose Cascade, Citra cryo, Idaho 7 au lieu de Motueka, Citra cryo, Saaz Late : données différentes, même fonction).
- rail-ajout-pose : La ligne se pose à 10′ comme sa base.
- rail-loupe-ouvre : Les graduations s'ouvrent aussi (50′, 40′, 30′, 20′ écrites et leurs traits), mais à 14 px par 5′ partout, sans le grossissement de sa loupe (voir rail-loupe-rapport).
- rail-carte-puce : Carte repliée en puce « Nugget » (≤ 48 px) comme sa base (reprise D111 de la maquette).
- rail-bulle-moment : Bulle « 35′ » sur le doigt.
- rail-carte-ombre : Ombre seulement pendant le geste.
- rail-fluide : Poignée fluide (≥ 9 mouvements sur 10, écart ≤ 4 px).
- rail-ebullition-pas5 : Pas de 5′ et IBU différents.
- rail-loupe-referme : Tout se referme.
- rail-ebu45 : Rail à 45′, rien au-delà.
- rail-ebu120 : Rail à 120′, rien au-delà.
- rail-k3-sans-chevauchement : Aucun chevauchement sur la page cas-k3 de la maquette (autre jeu : Nugget, Cascade, Galaxy, tous en ébullition, donc sans whirlpool ni froid).
- rail-k3-sans-saut-cote : Pas de saut de côté (jeu de la maquette : trois lignes d'ébullition).
- rail-k3-echelle-respectee : Moment monotone, pas de bond (jeu de la maquette : trois lignes d'ébullition).
- rail-dose : Dose par pas de 1 g (sa base : 2 g), IBU recalculé.
- rail-type-ajout : Le type change, la ligne se déplace (même geste).
- rail-retirer : La ligne est retirée.
- rail-clavier : La poignée est un slider : le moment change au clavier.

## Sorties du contrôle (node work/refonte-frontend/v4/tournoi/outils/controle-fonctions-rail.mjs)

- Sur la base v4.10 (consolide, --page=index.html) : FONCTIONS-RAIL OK (37/37) (les 37 fonctions jouées).
- Sur 5345f6ad : FONCTIONS-RAIL ECHEC (21/37). Page absente : ma-biere/cas-ebu200.html (rail-ebu200). La page cas-k3 de la maquette porte un autre jeu (Nugget, Cascade, Galaxy, tout en ébullition) que cas-k3 de la base (Nugget, Motueka, Cascade en whirlpool, Citra cryo à froid) : les trois fonctions k3 y sont jouées sur ce que la maquette montre.
- Sur le témoin fonctions-rail-sans-loupe (base copiée, la loupe retirée : aucune graduation ne s'ouvre) : FONCTIONS-RAIL ECHEC (24/37) ; échecs propres : loupe-ouvre, loupe-rapport, ebullition-reguliere, whirlpool-echelle, loupe-suit-segment, froid-jours ; les pages cas-*.html n'y sont pas copiées (7 échecs « page absente »).

## Critères GATES (rejoués depuis la racine)

- G1 INVENTAIRE-BIEN-39 ; G2 FONCTIONS-RAIL OK (37/37) ; G3 ECHOUE OK (5345f6ad) ; G4 ECHOUE OK (témoin sans loupe) ; G5 PORTEE-BIEN ; G6 CABLAGE OK ; G7 NOTE OK ; systeme.mjs appels controle-fonctions-rail.mjs --rejouer : APPELS OK (3 critères rejoués).
- Essais : un par critère ; le contrôle lui-même a été corrigé quatre fois avant d'être juste sur la base (voir doutes).

## Fichiers écrits

- work/refonte-frontend/v4/ecran-1/base/donnees/inventaire-rail.json (39 fonctions, dont 2 côté froid confiées à controle-geste-etape --froid de la voie p19)
- work/refonte-frontend/v4/ecran-1/base/captures/rail-inventaire/ (paires -base.png et -5345f6ad.png : repos, ebullition-35 pendant et après, whirlpool-85, fermentation-j3, interrompu, ebullition-45 / 120 / 200, k3 repos / pendant / après / extrêmes, ajout-pose, type-ajout, clavier ; base seule pour whirlpool-duree, post-fermentation-j10, ebullition-200 : la maquette ne les offre pas, l'inventaire cite alors la capture la plus proche)
- work/refonte-frontend/v4/tournoi/outils/controle-fonctions-rail.mjs (option --capture pour rejouer les images)
- work/refonte-frontend/v4/tournoi/outils/temoins/fonctions-rail-sans-loupe/index.html
- work/refonte-frontend/v4/tournoi/outils/portee-defauts.json : ligne D124 seulement (tourne « oui », résultat écrit)

## Doutes et limites

- Le contrôle a été corrigé quatre fois avant d'être juste sur la base (fluidité jouée sur une page à part pour ne pas dépasser 35′ ; traits de graduation lus aussi dans le slider de la maquette ; « 10 » et « ′ » en deux nœuds de texte réunis ; D61 bis mesuré seulement dans l'ébullition). Chaque correction a été rejouée sur la base ET sur la maquette.
- Le geste interrompu est simulé par un événement touchcancel du protocole de Chrome (celui du contrôle D42) ; la maquette n'y réagit pas. À confirmer sur un vrai téléphone si le doute compte.
- rail-ebullition-reguliere : sur la maquette, l'écart de 48 px vient de traits absents sous la bulle « 35′ » et la puce ; sa base les garde. C'est le moins net des échecs de la loupe : le vrai écart est le rapport ×1 de rail-loupe-rapport.
- rail-froid-carte-puce et rail-froid-mots-apres : inventoriées, verdicts tirés des captures ; jouées par controle-geste-etape --froid (voie p19, non modifié ici). Si p19 n'a pas livré l'option, ces deux lignes restent sans contrôle automatique.
- Le contrôle ne lit pas le code des pages : textes visibles, traits de moins de 3 px, hauteurs, ombres, boutons par leur libellé accessible (« Durée du whirlpool », « Jour du houblonnage à froid », « Ajouter 2 g », « Retirer »). Un autre libellé qui garde la fonction la ferait échouer : on règle alors le contrôle, pas la page.
- Hors portée, non inventorié : le fil d'étapes de l'app (haut de la maquette), l'appui long depuis le rail (D122, controle-appui), la fiche, Dryhopper (choix ouvert, règle n° 1). Le rail de l'étape dans l'app réelle (Frise.tsx) n'a pas été joué : seule la maquette 5345f6ad l'a été.
- Durée du contrôle : environ 60 s (10 pages ouvertes).

DÉCISION À PRENDRE : que faire des 18 fonctions perdues ? Options : (A) la prochaine version de la maquette reprend le rail de sa base v4.10 tel quel (geste, loupe à plateau ×3, whirlpool en °C et sa durée, J+0 à J+14, J+n et son réglage) puis rejoue ce contrôle jusqu'à FONCTIONS-RAIL OK ; (B) garder le geste de la maquette et ajouter les fonctions une à une. Recommandation : A, règle n° 1 (sa base est son choix, D123 et D124). Le contrôle devient la porte d'entrée : controle-choix devra l'appeler pour l'étape Houblons.

CONNAISSANCE : le rail de l'étape Houblons de sa base v4.10 compte 37 fonctions jouables au doigt par ce contrôle ; la plupart n'existent que pendant le geste (loupe, carte repliée, bulle) ou après le lâcher (écart d'IBU, J+n et son réglage, « à froid ») ; l'inventaire « au repos » n'en voyait qu'une partie. Détail : work/refonte-frontend/v4/ecran-1/base/donnees/inventaire-rail.json.

LEÇON PROPOSÉE : un inventaire d'écran se relève en jouant chaque geste (repos, pendant, après, interrompu) sur la base ET sur la construction, avec une paire de captures par état ; un inventaire au repos laisse passer toutes les fonctions qui n'existent que pendant ou après un geste (D124). Contrôle : controle-fonctions-rail.mjs ; à appeler depuis controle-choix pour chaque écran choisi dont la base a des gestes.

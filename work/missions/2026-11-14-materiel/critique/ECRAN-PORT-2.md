# Test d'écran, 2e passe : port za3 (Stocks › Matériel) après la voie c1

Version : W `C:/Users/mrspa/AppData/Local/Temp/materiel-port`, branche `claude/materiel-port`, commits c1 `cecb72ab`, `ea6dd8bd`,
`db7e6ba0`. Banc `?dev-local`, fixtures simulées. J'ai ouvert les 24 captures de `voies/c1/captures/`, chacune à côté de sa za3
(repos-390, repos-cave-390, traiter-390, ajout-390, vide-390, geste-390, repos-1280).
Question du brasseur : « combien et quels problèmes il y a ? » Réponse : **6 problèmes, dont 1 bloquant** (P7, resté en partie, et N1 à N5).

## Les 13 problèmes du premier test

- **P1 — CORRIGÉ.** d2b-ph-390, gestion, ph-cave-390 : « Dépenses reliées 37,40 CHF · 2 prix connus », Tampons 24,90, KCl 12,50,
  ligne « Achat · date et prix inconnus » ; « Mesure · utilisé dans 5 brassins ». Pompe et frigo : « aucun prix connu », ce qui
  est juste (pas de dépense dans la fixture).
- **P2 — CORRIGÉ.** c1-toast-etalonne-390 : la fiche se ferme, toast « Étalonné · à jour jusqu'au 15.12 » avec Annuler. c1-annule-390 :
  le pH-mètre revient en haut, « prévu le 11.11 », À traiter 4.
- **P3 — CORRIGÉ (le geste agit).** c1-payer-390 : la Dépense s'ouvre. Ce qu'elle montre pose un nouveau problème : voir N2.
- **P4 — CORRIGÉ.** 7,01 et 4,02 donnent « +0,01 ✓ » et « +0,02 ✓ » ; 7,2 donne « +0,20 ✗ » en rouge ; l'historique affiche « 4,03 · 7,02 »
  et « 4,04 · 7,03 » ; le fil à 1280 affiche « étalonné 4,03 · 7,02 ». « tolérance ±0,05 », « pH 7,00 » et « pH 4,00 » sont conformes à za3 (D1 réglé).
- **P5 — CORRIGÉ.** d2a-ajout-390 et c1-ajout-cave-390 : la réglette (point, trait, rond) est devant « prochain le 14.02 » et « 15.02 ».
  Le trait ambre de za3 manque parce que le dernier fait tombe aujourd'hui, ce qui est logique.
- **P6 — CORRIGÉ.** d2a-repos-390, cave-390 et c1-fil-rappel-390 : un blanc sépare « dégivrer » de « Réfractomètre », comme dans za3.
  À 1280, l'écart est identique à za3-repos-1280.
- **P7 — RESTE EN PARTIE (gênant, écart à sa maquette).** L'en-tête est juste : « ← Stocks · Matériel » à gauche, ⋯ rond à droite,
  « Pompe de recirculation » et « Frigo levures & houblons » tiennent sur une ligne. La fiche reste pourtant une feuille montante :
  poignée en haut, environ 100 px de l'app floutée au-dessus, pas de pictogramme houblon devant « Stocks · Matériel », pas de filet
  sous la barre. za3-geste-390 montre une page pleine. Correction : `EquipmentSheet` en mode page pleine à 390 (hauteur 100 dvh,
  sans poignée ni fond visible), pictogramme et filet de la barre de za3.
- **P8 — CORRIGÉ.** d2a-traiter-390 : toast « Fait · à jour pour 5 brassins » avec Annuler, note « Refroidisseur à plaques à jour pour 5 brassins ».
- **P9 — CORRIGÉ.** d2b-ph-1280 et cave-1280 : la ligne « – Achat · date et prix inconnus » est présente.
- **P10 — CORRIGÉ.** 1280 : « 1 739 CHF ». À 390, la coque du banc cache le chiffre 1 (voir les doutes).
- **P11 — CORRIGÉ.** « Nouveau matériel » est en gras 22 px, le × est dans un rond, le fond est blanc.
- **P12 — CORRIGÉ.** « sans échéance » : un pictogramme et un nom par case, sans sous-ligne. « Cuve fermentation 100L » passe sur
  deux lignes à 1280, comme dans za3.
- **P13 — CORRIGÉ (l'anneau n'est plus coupé).** Le focus initial en laisse un autre, voir N4.

## Problèmes neufs

**N1 — bloquant (élément de sa maquette absent).** c1-toast-etalonne-390, après « ✓ Étalonné » dans la fiche : le pH-mètre descend au
15.12 comme une ligne ordinaire, sous-ligne « étalonner ». Il n'a ni le surlignage vert, ni « 4,02 · 7,01 ✓ », et la note pointillée
« ✓ pH-mètre à jour jusqu'au 15.12 » n'apparaît pas à sa place d'avant. En plus, le trait pointillé des 30 j barre « 15.12 » et la ligne.
za3-traiter-390 (NOTE.md, état 9) montre bien la ligne `za3-flash` avec les lectures, posée au-dessus du trait, et la note à l'ancienne place.
Le brasseur dirait : « j'ai étalonné, il est passé où ? ».
Correction : `EquipmentList` / `ListFil` doivent appliquer au retour de la fiche (`onChange` avec toast) le même état « traité » qu'au
geste depuis la liste : la note à l'ancienne place, et la ligne en surbrillance à sa nouvelle date avec les dernières lectures,
`z-index` au-dessus du trait des 30 j. Cela vaut pour Tout comme pour À traiter. Captures à refaire : c1-toast-etalonne-390 et la
même en filtre « À traiter » (la za3-traiter elle-même).

**N2 — gênant (pas pratique).** c1-payer-390 : la Dépense ouverte par « Payer un entretien » ne nomme pas le pH-mètre. « Pour quoi ? »
est vide (texte d'exemple « Malt pour la Pale Ale, entretien de la pompe… »), et la section repliée dit seulement « 1 fiche de matériel ».
Le brasseur dirait : « je paie quoi, là ? ». Correction : remplir « Pour quoi ? » avec « Entretien · pH-mètre » et montrer le nom de
l'appareil sur la ligne de matériel, sans avoir à déplier.

**N3 — gênant (pas à sa place).** c1-apres-geste-1280 : après « Fait », le Refroidisseur à plaques (détartrage tous les 5 brassins)
entre dans « sans échéance 6 », à côté de la balance et de la capsuleuse qui n'ont aucun entretien. Depuis P12, rien n'y dit qu'il a
un rythme. Le brasseur dirait : « il a un détartrage tous les 5 brassins, pourquoi il dit sans échéance ? ». Dans za3, cette grille ne
contient que du matériel sans entretien. Correction : un appareil au rythme « brassin » qui est à jour reste dans le fil, après la coupure,
comme ligne sans date « détartrer · dans 5 brassins » (même forme que « après 5 brassins »), et sort de la grille.

**N4 — mineur (écart à sa maquette).** À l'ouverture, en tactile, un gros cadre de focus entoure « ← Stocks · Matériel » (d2b-pompe-390,
frigo-390, ph-cave-390, en noir et en blanc) et le × de « Nouveau matériel » (d2a-ajout-390, et en ambre dans c1-ajout-cave-390).
za3 n'en montre aucun. Correction : réserver l'anneau à `:focus-visible` (clavier), ou donner le focus initial au conteneur
(`tabIndex={-1}`, sans anneau).

**N5 — mineur (écart à sa maquette).** Toasts « Étalonné · à jour jusqu'au 15.12 » et « Fait · à jour pour 5 brassins » : le verbe n'est
pas en gras et Annuler n'a pas la flèche ↶. za3-traiter-390 montre « **Étalonné** · à jour jusqu'au 14.12 » et « ↶ Annuler ».
Correction : verbe en `<b>`, icône d'annulation devant Annuler.

### Doutes (non comptés)
- Frigo (d2b-frigo-390) : il est « à jour, prochain le 20.12 » avec un rythme d'un mois. Le dernier fait tomberait donc le 20.11,
  après aujourd'hui (15.11) : à vérifier dans la fixture. De plus, « 15.12 prochain, si fait » tombe avant l'échéance prévue :
  le calcul est juste, mais dire « si fait » pour un appareil à jour peut surprendre.
- Historique du pH-mètre : 10.08 et 08.07 n'ont pas de lectures (za3 : « 4,02 · 6,98 » et « 4,05 · 7,03 »). La fixture n'en donnait pas.
- d2b-pompe-390 : « fuit au raccord » apparaît deux fois, dans le titre « Fuit au raccord depuis le 05.11 » et à droite de
  « 15.11 Réparer ». Je n'ai pas d'état pompe de za3 pour comparer.
- Coque « Compagnon hors connexion · mode local » : à 390, elle couvre « Déjà possédé », « Projets » et le chiffre 1 du total. Elle vient du banc.
- Filtre actif peu distinct en cave (c1-traiter-cave-390) : c'est identique à za3-repos-cave-390.
- Une mesure hors tolérance s'enregistre encore comme « Étalonné » (D2 maintenu par c1, décision à lui montrer si besoin).
- Captures manquantes : Étalonné vu dans le filtre À traiter (l'état za3-traiter lui-même), geste Réparée, état après Annuler
  d'un « Fait », 1280 après Étalonné.

## Verdict
**A CORRIGER** — 6 problèmes, 1 bloquant : **N1** (après Étalonné, ni ligne surlignée avec ses lectures ni note « à jour jusqu'au » ;
le trait des 30 j barre la date). P1 à P6 et P8 à P13 sont corrigés. P7 (la feuille au lieu de la page pleine) et N2 à N5 sont à corriger
dans le même passage. Rejouer ensuite c1-toast-etalonne-390, Étalonné en filtre « À traiter », c1-payer-390, c1-apres-geste-1280 et une
fiche ouverte à 390.

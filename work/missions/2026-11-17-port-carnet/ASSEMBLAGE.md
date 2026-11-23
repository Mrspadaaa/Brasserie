# Carnet — assemblage du port, geste par geste (17.11)

Ses mots : « J'ai l'impression que ça classe pas super super. Mais tu peux implémenter comme tell avec les meilleures
fonction de version.... » ; « Il y a trop besoin d'action et pas assez d'aide de l'ai.... » ; « Non focus sur l'achat de
matériel mais ça peut aussi être utilisé comme brouillon » ; et sa dernière précision, qui prime : **« En gros, un chat, et
ça met en forme, c'est tout et ça permet de comparer les idée, en gros »**.

Règle d'assemblage : pour chaque geste, la base est sa version la mieux classée (à égalité : la plus proche de « un champ,
l'IA trie, l'achat d'abord ») ; on y greffe des fonctions d'autres versions sans jamais qu'un rang 4, ou une version non
classée, prime sur un rang meilleur. Les écrans figés ne changent pas.

Identifiants (les numéros se recoupent d'un lot à l'autre) :
- `g5:` = greffe 5, `work/missions/2026-11-17-carnet-retouches/greffe5/page/img/<id>.webp` (rangs : `maquettes.json`,
  `chantiers.carnet.ecrans_choisis.greffe5.rangs`) ;
- `g4:` = greffe 4, `…/greffe4/page/img/<id>.webp` (rangs : TOP3.md § Classement de greffe 4) ;
- `p2:` = écrans figés, `…/maquettes/page2/img/<id>.webp`.
Les captures ont été ouvertes à 390 px, quatre par planche, le 17.11.

## Ce qui ne bouge pas (figés, 3e classement)

Liste `p2:g05-1`, `p2:i06-1` · vide `p2:i02-2`, `p2:i06-2` · carnet ouvert `p2:h05-3`, `p2:i06-4` · cartes d'article
`p2:h03-5`, `p2:h06-5` · article ouvert `p2:h01-6` · comparer `p2:g01-8`, `p2:v03-4`, `p2:g05-8`, `p2:h04-7`, `p2:h06-7` ·
choisi `p2:g05-11`, `p2:v03-7`, `p2:v09-3`, `p2:g05-9` · À venir `p2:h05-9`. Un geste qui se joue sur l'un de ces écrans
n'en change ni l'habit ni la disposition : il ajoute seulement son cadre, son bandeau ou sa feuille.

## Comment le tout sert « un chat, met en forme, compare »

- **Le chat** : un seul champ en bas, partout (liste et carnet), un envoi. Son message reste lisible après le tri : en
  titre (« votre phrase en titre », g5:v04-4), cité sous ce que l'IA en a fait (« votre phrase : « … » », g5:v03-8),
  « Texte d'origine » pour une note en vrac (g5:v01-16), le lien en clair pendant la lecture (g5:v03-10).
- **La mise en forme** : l'IA range seule (critère, façon, article, note ; carnet existant ou neuf), découpe une note en
  lignes typées, lit la page d'un lien. Lui ne fait que corriger, d'un toucher : Annuler, Déplacer, Changer en note.
- **La comparaison** : chaque dépôt dit ce qu'il change pour comparer (« les articles seront rangés sur le fond de bac »,
  g5:v03-7 ; « tient 80 °C : oui », g5:v06-10) ; le 2e lien fait naître le tableau (g5:v06-11) ; l'écran Comparer reste
  le figé.
- **Rangé derrière, pas supprimé** : puces « Va dans » (correction seulement, préchoisies), feuille ··· de la note, bascule
  de veille, rubrique Photos vide, menus « Corriger : … ▾ ».

---

## 1. Créer · avant

**Base : `g5:v03-2`** (rang 1, à égalité avec g5:v04-1). Tranche : sa phrase dit l'achat d'abord (« Collez le lien d'un
objet ou notez un besoin : on garde sa photo, son prix, et on le surveille »), carte fantôme « Évier inox, 2 bacs ·
exemple · ↓ arrive ici », exemples en une ligne, champ « Une idée, un besoin… » et + noir.

Greffes :
- **G1** `g5:v04-1` (rang 1) — les exemples deviennent des puces touchables (Frigo de garde, Ventilation de la salle,
  Évier pour les fûts) : un toucher remplit le champ. Moins de frappe.
- **G2** `g5:v07-2` (rang 2) — « Aucun carnet encore. » en gras, et « Une note en vrac marche aussi. » : le brouillon
  dit en une ligne, en second.

Écarté :
- La flèche « écrivez ou collez ici » : refusée (g4:v01-2).
- Les onglets soulignés de g5:v04-1 et les segments de g5:v03-2 : l'habit vient de la liste vide figée (p2:i02-2,
  p2:i06-2).
- Le ↑ dans le champ au repos (g5:v08-2, rang 2) : il ne sert qu'à la frappe, il passe au geste 2.

## 2. Créer · pendant

**Base : `g5:v08-3`** (rang 2, seul). Carte pointillée « Nouveau carnet · Idée · ↓ arrive ici · Hotte au-dessus de la
cuve » ; « ✻ Déjà un carnet proche : Ventilation de la salle de brassage · Y ajouter en façon » ; Vos carnets 4 avec
pastilles ; ↑ vert dans le champ : un seul geste, l'IA a déjà choisi.

Greffes :
- **G3** `g5:v07-3` (rang 3) — dans la carte « arrive ici », « Ce qui compte · 2 rouleaux réglables » tiré de la
  phrase pendant la frappe. L'IA met en forme avant l'envoi.
- **G4** `g5:v04-2` (rang 3), `g5:v06-3` (rang 3) — quand rien n'est proche, l'IA dit pourquoi : « Aucun de vos 3
  carnets n'en parle : nouveau carnet, votre phrase en titre ».

Écarté :
- « + Créer » (g5:v03-3, v06-3, v07-3, rang 3) : le ↑ de v08-3 prime.
- Les puces « L'IA range dans [Nouveau carnet] [Embouteillage] » (g5:v06-3) : elles doublent « Y ajouter ».
- Le rangement d'office sans proposition (g5:v07-5, rang 4) : il ne prime pas sur v08-3, qui propose.

## 3. Créer · après

**Base : `g5:v04-4`** (rang 2). Le carnet s'ouvre : « Idée · 17 nov. · Ensuite : l'IA cherche les façons », bandeau
« ✓ Carnet créé, en tête des Carnets · ↺ Annuler », « « embouteillage » · votre phrase en titre », rubriques vides qui
disent qui agit (Ce qui compte · l'IA le proposera ; Façons · l'IA les cherche ; Articles · collez un lien ; Photos ;
Notes).

Greffes :
- **G5** `g5:v01-4` (rang 3) — quand la phrase porte un critère, Ce qui compte est rempli d'emblée (« tiré de votre
  phrase : 2 cylindres, écartement réglable ») au lieu de « rien encore ».
- **G6** `g5:v01-4` (rang 3) — une ligne sous les rubriques : « Le champ en bas range tout ici : une phrase, un lien
  collé, une photo ». Aucun type à choisir.
- **G7** `g5:v03-10` (rang 2), `g5:v08-7` (rang 3) — le champ dit où ça va : « Ajouter à <titre>… ».

Écarté :
- « Corriger : Dans un carnet ▾ » (g5:v01-4) : un menu de plus ; le carnet proche est déjà proposé au geste 2.
- La pastille « Idée · à l'instant · Annuler » en tête (g5:v02-4) : elle double le bandeau.
- La nouvelle ligne sur la liste (g5:v05-4, rang 4) : elle ne prime pas, on ouvre le carnet créé.

## 4. Ajouter · avant

**Base du carnet : le figé `p2:h05-3`, `p2:i06-4`. Base du geste : `g5:v03-6`** (rang 2). Un seul champ « Écrire, ou
coller un lien… », avec l'anneau de focus ; ✎ à côté du titre ; ··· par note. Aucune tuile « quoi ? ».

Greffes :
- **G8** `g5:v04-5`, `g5:v07-7` (rang 3) — la bulle « auj. » de l'IA : « Le critère « plus de condensation au
  plafond » peut trancher entre Hotte inox + extracteur et Extracteur mural seul ». L'IA pousse vers la comparaison.

Écarté :
- Les tuiles « quoi ? » : refusées (g4:v02-4).
- `g5:v02-8`, `g5:v02-9` (rang 4) : ils ne priment pas, mais leur habit est celui du figé i06-4 (voir DÉCISION 2).

## 5. Texte · pendant

**Base : `g5:v02-10`** (rang 2). Cadre pointillé sous le titre : « ↓ va atterrir ici · ✻ tiré de votre phrase · Ce qui
compte : un fût de 30 L couché entre dans le bac · comparé sur la profondeur de bac » ; puces « Va dans » préchoisies, qui
servent seulement à corriger ; « Ajouter ».

Greffes :
- **G9** `g5:v03-7` (rang 3) — la conséquence pour la comparaison : « les articles seront rangés sur le fond de bac,
  38 cm au moins ».
- **G10** `g5:v03-7` (rang 3) — un ✕ dans le cadre pour l'annuler avant l'envoi.
- **G11** `g5:v08-8` (rang 4, conditionnel) — seulement quand la phrase répète une note : « Même chose que la note du
  16 nov. : elles seront fusionnées · Garder à part ». Aucune version mieux classée ne dessine ce cas, donc rien n'est
  remplacé.

Écarté :
- La position du cadre dans la rubrique visée (g5:v03-7, rang 3) : la position de v02-10, sous le titre, prime.

## 6. Texte · après

**Base : `g5:v03-8`** (rang 3, à égalité avec g5:v01-7, v05-7, v08-7). Tranche : la ligne reste en place dans sa
rubrique, avec « ✓ Rangé ici, à l'instant · Annuler », la conséquence (« articles rangés sur : fond de bac, 38 cm au
moins ») et sa phrase citée en italique. C'est son message, visible, comme dans un chat.

Greffes :
- **G12** `g5:v08-7` (rang 3) — trois corrections d'un toucher sous la ligne rangée : « Votre texte · Déplacer · Changer
  en note ».
- **G13** `g5:v05-7` (rang 3) — écrit depuis la liste : la ligne du carnet visé s'éclaire, « Critère ajouté · Déplacer ·
  Annuler · tiré de « fût de 30 L couché » ».

Écarté :
- « Corriger : Autre carnet ▾ · En note », le double bandeau et la bulle (g5:v01-7) : redondants ; Déplacer (G12) les
  couvre.

## 7. Lien · avant

**Base : `g5:v07-10`** (rang 2). Le lien dans le même champ, en chasse fixe ; au-dessus du clavier, la puce « Coller :
plaque-froid.ch/echan… » colle en un toucher ; « Ajouter ».

Greffes :
- **G14** `g5:v03-9` (rang 3) — avant l'envoi, le cadre « ↓ Va atterrir ici, dans Articles · lien collé ✕ » : « ✻ d'après
  le lien : un évier 2 bacs, façon Sur pieds. Nom, prix et photo se lisent à l'envoi ». L'IA range avant qu'il ne
  choisisse quoi que ce soit.

Écarté :
- Le ↑ de g5:v08-10 (rang 3) : « Ajouter » prime dans un carnet.
- La puce « Coller le lien copié » de la base, et tout écran de lien à remplir : refusés (g4:base-E07a).

## 8. Lien · pendant (lecture…)

**Base : `g5:v03-10`** (rang 2, à égalité avec g5:v01-9 et v02-12). Tranche : le cadre « Arrive ici, dans Articles ✕ »
s'ouvre là où l'article va vivre ; « ✻ lecture de la page… », le lien en clair, et « nom, prix, photo, cotes : rien
d'affiché avant d'être lu ».

Greffes :
- **G15** `g5:v01-9` (rang 2) — dans le cadre, la carte d'article E07a en squelette : même gabarit que le résultat, pas
  de saut à l'arrivée.
- **G16** `g5:v02-12` (rang 2) — lien collé depuis la liste : « Va atterrir ici · lien collé », « L'IA lit la photo, le
  nom, le prix et le vendeur. Ce qu'elle ne lit pas reste vide » ; l'IA choisira le carnet.
- **G17** `g5:v04-9` (rang 3) — les puces de progression « nom ✓ · photo ✓ · prix · stock · valeurs » : on voit ce qui
  est déjà lu.
- **G18** `g5:v06-9` (rang 3) — « l'IA cherche : nom, prix, photo, débit, °C max » : elle cherche aussi les valeurs du
  critère, ce qui prépare la comparaison. Annuler possible pendant la lecture.

Écarté :
- Le bandeau « Lien collé » sur la liste (g5:v05-10, rang 3) : il double G16.
- g5:v08-11 (rang 4).

## 9. Lien · après

**Base : `g5:v06-10`** (rang 1). « ✓ Article rangé ici, à l'instant · Annuler » ; carte complète (Pompe de transfert
inox, pompe-inox.ch · CH, 40 L/min · jusqu'à 90 °C, 690 CHF, en stock) ; « Veille du prix, tous les 3 jours » activée ;
« ✻ lu sur la page : nom, prix, photo, débit, °C · tient 80 °C : oui ». L'article est confronté au critère.

Greffes :
- **G19** `g5:v03-11` (rang 2) — l'article est rangé dans sa façon (« Article rangé ici, dans Sur pieds »), avec la
  puce « fût couché : oui » ; la cote est traduite en usage (« donc un fût de 30 L couché y entre ») ; au premier
  article, le carnet passe seul en À comparer.
- **G20** `g5:v06-11` (rang 2) — au 2e lien, le tableau naît (débit, °C max, prix, rang 1 et 2), avec « rangé par l'IA :
  tient 80 °C d'abord, puis le débit », « Pompe magnétique rangée, 2e · Annuler » et « 2 façons nées des 2 articles ».
  C'est sa comparaison des idées, sans geste.
- **G21** `g5:v06-14` (rang 3) — lien collé depuis la liste : « Rangé dans Ventilation, à l'instant · Annuler », avec
  la raison (« la page parle d'extraction de buée : comme Ventilation ») et « Déplacer ».

Écarté :
- La veille éteinte par défaut et « Changer en note » de g5:v04-10 (rang 4) : la veille active de v06-10 prime.

## 10. Note en vrac · pendant

**Base : `g5:v01-15`** (rang 3, à égalité avec g5:v02-19 et v06-17). Tranche : elle part de la liste, où arrivent ses
notes de téléphone. « ✻ L'IA découpe votre note : 3 lignes, 2 carnets », chaque ligne typée (à faire, question, à
acheter) avec son carnet (« → Évier inox ») ; « Va dans : selon chaque ligne ▾ » ; « Ajouter ».

Greffes :
- **G22** `g5:v06-17` (rang 3) — un picto par type (panier pour À acheter, ampoule pour Conseil), les achats en tête des
  lignes ; dans un carnet ouvert, « Rattaché à <carnet> · Autre carnet ».
- **G23** `g5:v02-19` (rang 3) — l'IA dit ce qui n'y est pas (« 1 chose à faire et 1 note, pas d'achat »), et une ligne
  sans carnet proche ouvre un carnet neuf (« Prochain brassin · aucun carnet proche »).

Écarté :
- « + Créer » et « Va dans : Nouveau carnet / Autre… » (g5:v02-19) : « selon chaque ligne » de v01-15 prime.

## 11. Note en vrac · après

**Base : `g5:v01-16`** (rang 3, seul). Sur la liste : « ✓ 3 lignes rangées dans 2 carnets · Annuler » ; chaque ligne
garde une puce de type ▾ et une puce de carnet ▾ pour corriger d'un toucher ; « › Texte d'origine » pour relire son
message ; les lignes de carnet portent « +2 · question, à acheter ».

Greffes : aucune. La base couvre le tri, la correction et le texte d'origine.

Écarté :
- « rangé : prochaine étape » de g4:base-E06 (rang 4) : il ne prime pas ; v01-16 dit déjà où va chaque ligne.
- La rubrique Brouillon hors des carnets (g5:v04-16, v06-21, non classés) : voir DÉCISION 3.

## 12. Modifier une note

**Base : `g4:v01-11` → `g4:v01-12`** (rang 3 de greffe 4 ; greffe 5 n'a pas classé ce geste). Le ✎ de la ligne ouvre
le cadre « ✎ Se modifie ici · ✕ Supprimer » ; le texte passe dans le champ du bas, avec « Enregistrer » ; après :
« ✓ Note modifiée, à l'instant · Annuler », puis « modifiée à l'instant ».

Greffes :
- **G24** `g4:v03-11` (rang 3) — la feuille ··· de la ligne (Modifier / Changer en façon ou critère / Supprimer), en
  accès second.
- **G25** `g5:v08-19` (non classé) — en tête de la feuille : « ✻ Ressemble à un critère · Passer en Ce qui compte »,
  [Passer], un toucher.
- **G26** `g5:v08-21` (non classé) — après la modification, l'IA en dit la conséquence pour la comparaison : « l'évier
  Inox Riviera (60 cm) ne passerait plus · Passer en Ce qui compte ».
- **G27** `g5:v03-18` (non classé) — dans le cadre : « ✻ Même visite : la douchette · Regrouper ».

Écarté :
- « classée À faire d'après « jeudi, 10 h » · Changer » (g5:v05-21, non classé) : elle touche À venir, qui est figé ; à
  montrer en variante.

## 13. Modifier le titre

**Base : `g4:v02-14` → `g4:v01-13`** (rang 2 de greffe 4). Le menu ··· propose Renommer ; s'ouvre alors le cadre « ✎ Se
renomme ici · titre du carnet », avec le titre dans le champ du bas, « Renommer » et « Annuler · Entrée = renommer ».

Greffes :
- **G28** `g5:v03-6` (rang 2), `g4:v01-11` (rang 3) — un ✎ à côté du titre, en accès direct (un toucher au lieu de
  deux) ; le menu ··· reste.
- **G29** `g5:v05-23` (non classé) — le champ arrive prérempli par l'IA : « ✻ proposé d'après « 2 bacs pour laver les
  fûts » », avec « avant : « Évier inox » ». Entrée renomme, un seul geste.
- **G30** `g5:v08-25` (non classé) — après : « ✓ Renommé · avant : Évier inox · Annuler », dans la page.

Écarté :
- Le bouton « Prendre » de g5:v08-24 (non classé) : il double G29.

## 14. Supprimer une note

**Base : `g4:v02-12`** (rang 2 de greffe 4). Le ··· de la ligne propose Modifier et Supprimer (en rouge).

Greffes :
- **G31** `g4:v01-11` (rang 3) — « ✕ Supprimer » dans le cadre de modification.
- **G32** `g5:v08-22`, `g5:v04-24` (non classés ; règle de la base J23, Annuler dans la page) — après : « Note supprimée ·
  Annuler », à la place de la note.
- **G33** `g5:v05-25` (non classé) — l'IA marque « ✻ doublon ? » sur une note en double, avant qu'il ne la cherche.

Écarté :
- Une confirmation : aucune source ne la dessine, et Annuler suffit.

## 15. Supprimer une idée

**Base : `g4:v02-17` → `g4:v02-18`** (rang 2 de greffe 4, à égalité avec g4:v01-16, v01-17, v04-18, v04-19). Tranche :
la carte compte ce qui part et dit que l'achat s'arrête (« Il part avec 1 article, 1 photo, 2 façons et 1 note. La
veille du prix, tous les 3 jours, s'arrête ») ; Supprimer en contour rouge, Garder en noir ; page grisée.

Greffes :
- **G34** `g4:v04-19` (rang 2) — pendant la confirmation, le champ et le + sont grisés.
- **G35** `g5:v08-27` (non classé) — « ✻ 2 articles en veille : les déplacer dans Ventilation avant · Déplacer ».
- **G36** `g5:v05-29` (non classé) — l'IA vérifie avant : « ni dans À venir, ni en commande ».
- **G37** `g5:v08-28` (non classé) — après : sur la liste figée, à la place du carnet, « Carnet supprimé · <titre> ·
  Annuler ».

Écarté :
- Garder en vert (g4:v01-17) et le menu de g4:v04-18 : à rang égal, v02-18 tranche.
- La ligne « supprimé » en tête de la liste E17a (g5:v04-27, non classé) : la liste est figée sur i06-1, la ligne garde
  la place du carnet (G37).

---

## Hors de ma liste, pour mémoire

Photo et lien illisible n'ont pas été classés en greffe 5. Repère de l'inventaire : photo `g4:v02-7` / `g4:v05-8`
(« L'IA y lit… ni prix ni vendeur ») ; lien illisible : il reste une note « lien · page non lue », rien d'inventé.

## DÉCISION À PRENDRE

1. **Le fil du chat.** Aucune version classée ni aucun écran figé ne dessine ses messages en fil chronologique dans le
   carnet. L'assemblage montre son message cité (titre, « votre phrase », Texte d'origine). Un vrai fil, comme
   « Dernier dépôt » (g4:base-E06, rang 4) ou le fil de v07 (g5:v07-9, non classé), changerait le carnet figé. C'est à
   dessiner en mini maquettes : variantes, et figé à côté (L24).
2. **Ajouter · avant.** g5:v02-8 et v02-9, classés 4 en greffe 5, portent l'habit de i06-4, que le 3e classement a figé.
   L'assemblage garde le figé (règle n° 1) et ne prend que le champ de g5:v03-6.
3. **Les lignes sans carnet.** Une ligne de note en vrac qui n'a pas de carnet ouvre un carnet neuf (g5:v02-19, rang 3).
   Une rubrique Brouillon (g5:v04-16, v06-21) n'est pas classée. Elle colle à « ça peut aussi être utilisé comme
   brouillon », mais reste à montrer.
4. **Fonctions non classées des gestes 12 à 15** (G25 à G27, G29, G30, G32, G33, G35 à G37). Elles viennent toutes de
   greffe 5, qui n'a pas classé ces gestes, et apportent l'aide de l'IA qu'il réclame. Aucune ne remplace une base
   classée. À montrer côte à côte avant de les intégrer, ou à intégrer derrière un repli.
5. **La touche d'envoi.** ↑ sur la liste (g5:v08-3, rang 2), « Ajouter » dans un carnet (g5:v02-10, v07-10, rang 2),
   selon les rangs. Les unifier en ↑, plus proche du chat, ferait primer des rangs 3 et 4 : écarté sans son accord.

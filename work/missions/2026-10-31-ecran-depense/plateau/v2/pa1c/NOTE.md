# pa1c — passe 3 de pa1 (froide) : p3c-3 affinée, sans menu déroulant

Base : `plateau/v1/pa1b/`, non touchée. Sources dans `src/`. `construire.mjs` écrit `etat.html` (préfixe `pa1c-`), `captures.mjs`
écrit les captures. États : `etat.html#a` à `#f`, `#repos`, suffixe `-cave` pour le sombre.

Captures :
- `pa1c-{repos,a,b,c,d,e,f}.png` (390 × 844, clair) ;
- `pa1c-b-sombre.png`, `pa1c-d-sombre.png` ;
- `pa1c-1280-b.png`, `pa1c-1280-repos.png`.

Ouvertes : d, e, f, b-sombre, 1280-b.

## Ses trois mots du 02.11 au soir
1. **D350, aucun menu déroulant ni chevron.**
   - L'unité lue devient un segment visible des deux unités de sa famille : Kg | g pour les malts et sucres, g | Kg pour les houblons,
     sachets | g pour les levures, pièce | L pour le nettoyage. Elle se change en un toucher, sur la ligne des champs.
   - Le type fin devient un second segment visible sous la nature, seulement pour Matériel (Nettoyage · Emballages · Entretien ·
     Durable) et Service (Service · Livraison). Rien sur une ligne d'ingrédient.
2. **D351, « au centime » retiré** quand le calcul tombe juste, ce qui est le cas des six lignes. « au centime : après l'unité » est
   retiré aussi. Restent, de p3c-3, « ✓ 8 lignes » et la boîte cochée.
3. **D352, les quantités en une colonne.**
   - La quantité de la bande (« 10 Kg », « 3 sachets », « 1 pièce ») et celles des rangées ont la même structure, avec une colonne
     prix fixe de 62 px. Les unités tombent au même bord droit.
   - L'ancienne valeur barrée de d-lue se lit « 2 sachets × 4,90 », comme « 10 Kg × 1,45 » sur d-lue. Écrite « 2 sachets » seule,
     elle passait pour une quantité de la colonne.

## Les retouches du critique (§ pa1b)
- **(d) « × 6,20 = 6,20 » sur la ligne des champs.**
  - La case d'unité y est un onglet rouge « unité ? », non touchable. Cet onglet s'ouvre, sans couture, sur le cadre rouge des cinq
    cases de 44 px, avec le prix par unité et la phrase « Kg proposé : le lactose est compté en Kg au stock (0,5 Kg) ».
  - C'est un seul contrôle, et le focus va sur la case Kg.
- **La mouture ne compte plus comme ligne à régler.** La file est « Citra, Lactose » : « 1 sur 2 · Suivante : Lactose › ». Une ligne
  hors de la file affiche « 2 à régler · Suivante : … ».

## Gardé de pa1b
- Le bis proposé par défaut, dit une fois, avec ses concordances.
- « Nouvel article · ≠ doublon de Citra » en rouge.
- « − 3 + » en bleu, avec ses deux lectures.
- « extrait · Supprimer » discrets.
- La mouture : la pastille « ↳ 0,60 » sur la rangée et « Rattacher » au plateau.

## Deux points à signaler
- Le segment d'unité ne propose que deux unités de la famille. Une unité rare (un sachet de malt, un litre de sirop) n'a plus de chemin
  sur une ligne sûre. Pour en avoir un sans menu, il faudrait une 3e case « autre », qui ouvrirait les cinq cases du cas (d). Capture :
  `pa1c-e.png` (sachets | g).
- Le récap (socle p3c-3) dit encore « 2 à contrôler » (Citra et la mouture), alors que la file du plateau dit « 2 à régler » (Citra et
  Lactose). Les deux comptes ne désignent pas les mêmes lignes. Captures : `pa1c-b-sombre.png`, `pa1c-1280-b.png`.

## Contrôles (02.11)
- `controle-sans-menu.mjs`, 7 états à 390 : **MENU OK**, en clair et en `--theme cave`. Sur `v1/pa1b/etat.html`, le même contrôle
  échoue : « bouton à chevron « Unité » », « au centime » sur une ligne sûre.
- `controle-commun --profil=sans-houblons --sans-lignes` : **COMMUN OK**.
- `controle-contraste --profil=sans-houblons` : **CONTRASTE OK**, pire valeur 5,24:1.
- `verifier-page --min-images 0` : **PAGE OK**.
- `captures.mjs` : **CAPTURES OK**.
  - Dans les six cas, le plateau tient entre la rangée et le pied.
  - Aucun texte sous 12 px, aucune cible sous 24 px.
  - Aucun `type="number"`, aucune requête réseau.

# za4 — zq1 apaisée : une chose à la fois

Ses mots (15.11) : « zq1 Le fil du temps — J'aime bien mais un peu "stressant" c'est le plus pratique mais le plus anxiogène ».

**Lecture dominante (za4, une chose à la fois)** : l'anxiété venait de quatre boutons forts empilés, chacun réclamant
d'être fait tout de suite. Ici, un seul « prochain geste » est en avant, dans une carte posée sur le fil, avec le seul bouton
plein de l'écran. Les autres dus restent sur le fil, en lignes simples, avec leur geste en texte léger. Une fois le geste fait,
la carte passe au suivant (état traiter).

Le prochain geste est le pH-mètre. C'est le geste qu'on peut finir maintenant (tampons pH 7 et 4) et qui sert à chaque
brassin. La pompe attend une pièce ; elle reste visible (point rouge, « fuit au raccord », Réparée en un toucher).

## Ce qui change par rapport à zq1
1. Carte « prochain geste » (88 px) : grand nœud sur le rail (48 px, cercle ambre pâle), nom en 17 px, « prévu 11.11 », un seul
   bouton plein « Étalonner » (44 px). C'est la seule action `primary` de la liste.
2. Les trois autres dus sont des lignes simples de 42 px : nœud de 24 px sur le rail, nom et cause sur deux lignes, geste en
   texte gris sans bordure (Réparée, Fait, Étalonner), cible de 42 px de haut. Plus de quatre boutons encadrés.
3. La zone due mesure 224 px sur 844, soit 27 %, sous le tiers (281 px). Dans traiter, elle mesure 182 px.
4. Plus de compteur d'alarme : « panne 9 j » devient un point rouge sur le nœud, avec « fuit au raccord ». « retard 3 j » devient
   « prévu 11.11 ». Le rouge ne marque plus que la panne, sur un point de 8 px. Le rail du dû est gris : le dégradé rouge puis
   ambre est retiré.
5. Compteur « À traiter 4 » en encre, sans rouge (emprunt léger à za1).
6. Fil plus aéré : la bande « 30 j » n'a plus de fond beige, il reste un tiret gris et son libellé. Les « dans 17 j » passent en
   graisse normale, sans ambre.
7. traiter : après « Étalonné », la carte passe au Refroidisseur à plaques (« détartrer · 5/5 brassins », bouton Fait). Le
   pH-mètre descend à 30 j, entouré d'un fin trait vert, sans aplat. La ligne fantôme « pH-mètre étalonné… » est retirée,
   puisque le bandeau Annuler le dit déjà.
8. Fiche du pH-mètre : « retard 3 j » (22 px, ambre, mono) devient une pastille « à étalonner » et « prévu le 11.11 · chaque
   mois » en 14 px.
9. 1280 : même carte, au-dessus de la liste. Elle est sélectionnée (liseré droit) et correspond à la fiche de droite.

## Ce qui est gardé (sa maquette, telle quelle)
Les éléments suivants restent ceux de zq1 :
- la coque de l'app ;
- le fil vertical à sa vraie distance (3,5 px/j depuis aujourd'hui, coupure après 50 j) et le point « aujourd'hui 14.11 » ;
- les gestes en un toucher depuis chaque ligne ;
- Achat (44 px), Déjà possédé, Projets et la valeur du parc (« 1 739 CHF · 2 prix connus ») ;
- les 13 appareils au premier écran, dont 5 « sans échéance » ;
- la fiche en fil : étapes rincer, pH 7, pH 4, ranger ; flacons et valeurs lues ; rythme ; état ; dépenses reliées
  (« 37,40 CHF · 2 prix connus », « date et prix inconnus ») ;
- les états ajout et vide ;
- les données et les dates.

## Mesures (puppeteer, 390 × 844, hors en-tête, navigations et noms `data-mots="lignes"`)
- Mots au premier écran : repos 59 (zq1 : 61 au même compteur), traiter 38. Plafond : 60.
- Texte sous 12 px : 0 ; tailles de la liste : 12, 13, 14 et 15, plus 17 pour le nom du prochain geste.
- Cibles sous 24 px : 0 ; `type="number"` : 0 ; ressources distantes : 0.
- Captures ouvertes : repos, geste, traiter, ajout, vide, repos en cave, repos à 1280.

## Boosters UX (boosters-ux)
- prochain-geste : déclencher. Une carte avec un seul bouton plein. Effet : la carte passe au geste suivant
  (comparer les captures repos et traiter).
- reparee, fait, etalonner-densimetre : déclencher, en texte léger sur la ligne.
- fil-echeances, echelle-temps, frise-30-jours : suivre ; filtre-tout, filtre-a-traiter, recherche, achat, deja-possede,
  projets, valeur-parc ; fiche : fil-appareil, etapes-etalonnage, etalonnage-flacons, rythme, etat, depenses-reliees,
  enregistrer-etalonnage.
- B2 OK : la carte domine, une seule action pleine. B3 OK : 59 mots. B6 : 5 tailles avec le nom en 17 px (écart voulu : le
  prochain geste domine). B8 OK : les inconnus restent écrits (« jamais étalonné », « date et prix inconnus ») ; le total est
  donné sur 2 prix connus. B13 OK : 0 cible sous 24 px.

## Reste
- Vide est repris de zq1 sans carte : rien n'est dû, il n'y a donc pas de prochain geste.
- Le choix du prochain geste (« le plus utile ») est une règle écrite ici, pas un champ neuf : faisable maintenant, sert au
  prochain brassin, puis le plus ancien.
- Données fictives et plausibles, comme dans zq1.

Prédiction : « Ah, là je respire : je vois ce que je fais maintenant, le reste attend sans me crier dessus. »

## Correction 15.11
D'après VERDICT-V2 § za4 (P1 à P4). Source : `voies/v2-za4/transforme.mjs`, puis `build.mjs za4` et les 7 captures refaites.
- P1 : la ligne passe à 44 px et les gestes Réparée, Fait et Étalonner sont en `min-height: 44px`. Mesure puppeteer : 44/44/44
  au repos, au tri et à 1280. La zone due mesure 230 px sur 844 (27 %), toujours sous le tiers.
- P2 : ces trois gestes sont en encre, avec une icône : clé, coche, et un cadran neuf (`i-etal`, cadran et aiguille) pour
  Étalonner, repris sur le bouton plein du pH-mètre. Le gris reste aux sous-lignes.
- P3 : la sous-ligne de la pompe dit maintenant « fuit · attend la pièce », avec un point de 10 px. Écart au texte du
  critique : « fuit au raccord · attend la pièce » portait le premier écran à 62 mots, au même compteur. Je retire donc
  « au raccord », un détail de fiche. Le premier écran fait 60 mots, le plafond. « attend la pièce » suffit à expliquer
  pourquoi la panne n'est pas le prochain geste.
- P4 : le nœud de 48 px a son centre sur l'axe du rail : x = 48 à 390 px, comme les nœuds des lignes et le rail ; x = 68 à 1280 px.
  Le rail part du centre du nœud et traverse le bas de la carte. Le fil commence donc à la carte.
- Inchangé : 0 texte sous 12 px, une seule action pleine, l'ordre des lignes.
- Doute « panne en tête » : je n'ai pas tranché. La sous-ligne justifie l'ordre actuel. Si le brasseur veut la panne en tête,
  il suffit d'échanger le héros et la ligne de la pompe (`heros(POMPE)`, bouton « Réparée »).

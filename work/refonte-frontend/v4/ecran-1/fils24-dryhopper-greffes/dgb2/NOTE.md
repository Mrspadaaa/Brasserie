# dgb2 — « Les trois plans sur les 12 familles »

**Chaleur : tiède.** **Greffe : `data-greffe="trois-plans-w2"`**, sur les trois puces et sur chaque règle des gains.

L'idée, une seule : la manière de comparer de w2 (sa rangée S · F · O par famille ; « pas trop mal dans la manière de
comparé ») glissée sous chaque barre l5b de l'écran. La barre reste le moment du doigt, intacte ; dessous, une fine règle
des gains, de 0 à +25 comme l'axe des courbes (repères +10 et +20), porte trois pastilles S, F, O : ce que chaque plan
ajoute dans cette famille. Deux plans trop proches pour deux pastilles se fondent en « FO » (gains à moins de 2,3 points) ;
une famille jamais décrite garde son « ? » seul, sans règle. La pastille du plan tenu est pleine. Trois puces au-dessus de
la figure disent les plans et posent le rail.

## Base et données
- Base : l'écran Dryhopper de la maquette jouable, tel qu'il se joue (`prototypes/houblons-v4/maquettes/parcours/dryhopper/etat.html`,
  sa p4b2f rendue sur le moteur ; « Pour le dryhopping, la meilleure version est celle de l'app jouable mais il lui faut
  quelques améliorations »). La page charge le même bundle et la même route ; rien n'y est retiré ni restylé, la greffe
  s'ajoute (script après le bundle, classes préfixées, remise en place si un rendu React la détache).
- Un seul facteur libre, le moment (D98) : les trois plans de w2 sont trois moments du même Idaho 7, même 4 g/L, même US-05.
  Sage = 0′ (rien à froid), Franc = actif · 2 j (★ du moteur), Osé = après · 3 j (le plus d'arôme, le résineux monte).
  w2 faisait varier dose, jours, moment et levure : ici, seulement le moment.
- Chiffres : aucun n'est recopié. Au chargement, la greffe pose le rail de l'écran sur chaque plan (ses propres touches),
  lit ce que le moteur affiche (bandeau, 12 barres, couleurs), puis revient sur ★. « ≈ » interpolé, « ? » inconnu gardés.
- Régénérer : `node <id>/generer.mjs` (socle `dgb1/socle-dgb.mjs`).

## Ce qui tient
- Sur Résineux, S, F et O s'écartent (≈+8, ~+14, ~+20) quand Floral ne sépare que S de « FO » : le prix d'Osé se voit
  famille par famille, ce que ni le bandeau ni les courbes (trois familles) ne montrent.
- La barre de p4b2f n'est pas recouverte : la comparaison vit dessous.

## Ce qui casse
- Chaque ligne passe de 17 à 36 px : les barres s'allongent (défilement de 217 px) ; le premier écran n'en montre que cinq.
- La fusion « SFO » en chaîne peut cacher un écart S–O de 4 points (Herbacé) : à corriger en passe 2 (fusion par paire).
- Une deuxième échelle (gain) sous une barre au style : la légende de l'écran ne la dit pas encore.

## Captures
`captures/dgb2.png` (repos) ; `captures/dgb2-geste.png` (puce Osé : rail à après · 3 j, pastilles O pleines) ;
`captures/dgb2-barres.png` (écran défilé : les 12 familles et leurs règles).

## Contrôles (sorties recopiées, 24.10 soir)
| critère | sortie |
|---|---|
| G1 `variantes.mjs dgb1 dgb2 dgb3 dgb4` | VARIANTES-BIEN-4 |
| G2 `controle-pictos-trait … --page=etat.html` | TRAIT OK (17 pictos de famille, 0 faute) |
| `controle-commun --sans=mots` | COMMUN OK |
| `controle-une-question` | UNE-QUESTION OK (1 groupe libre : moment) |
| `mots-premier-ecran --max=80 --sans-donnees` | MOTS OK |
| `controle-panel` (dgb1 à dgb4) | PANEL OK (remplissage médian 0,74 ; ressemblance 0,90 ; 0/6 paires presque identiques) |
| `controle-choix --ecran=dryhopper` (copie de la page en route `dryhopper`) | ECHEC sur un seul état : `etat-dryh-repos` 115 mots au premier écran (au plus 96) ; les 20 autres états de sa base OK. La base seule fait exactement 96 (CHOIX OK) : tout chiffre ajouté au premier écran dépasse. Écart assumé en v0 (`--sans=mots`), décision au pilote. |

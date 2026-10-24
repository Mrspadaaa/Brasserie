# rpb1 · Comparer, au moment choisi

Série rpb (r6a, les trois plans de w2, la frise de y1b). **Chaleur : froide.** r6a telle quelle, plus une seule
idée : « il manque juste la partie de pouvoir choisir quand comparé ».

## L'idée
Entre le radar et les colonnes, la frise de y1b retravaillée en sélecteur : 60′ · 10′ · WP | actif · après (ébullition,
puis dry hop 3 j). Au-dessus de chaque arrêt, un point à la couleur du houblon qui mène le floral sans sortir de ta 16D
à ce moment, et son écart (~+0,9 à 10′ pour Galaxy, ~+1,3 après pour Idaho 7). Un toucher sur un arrêt pose ce moment
sur le radar, les 9 rangées, les verdicts ~✓ / ~⚠ et l'IBU de chaque tête ; le houblon mis en avant suit (règle de r6a).
Ce que ça apprend : Galaxy est le plus floral à chaud (10′) et reste dans ta 16D ; il en sort (tropicaux) dès le
whirlpool. Idaho 7 gagne au dry hop.

## Greffes (`data-greffe`)
- `frise-y1b etapes` : le sélecteur de moment, ses arrêts et leur meneur.
- `hors-16d` : sous chaque tête, le premier mot que lui seul porte (citron vert ; orange +4 ; ◇ cannabis +4), la liste
  entière en titre et dans la fiche.
- Ton Nugget en référence : pointillé gris dans chaque barre, au même moment, même dose (d107-reference).

## Baseline
r6a reprise : titre-question, contexte (16D, 4 g/L, US-05), Au style / Absolu, « ~ simulé », radar r2 12 axes
(zone 16D, ta stout en noir, un trait par houblon, inconnu hachuré), colonne Ta stout (♣ trop, ❀ plus), têtes (nom,
α du lot, rôle en mot, familles marquées grandes, verdict, stock en icône), 9 rangées l5b (zone 16D, barre, orangé
au-dessus, intervalle, trait de ta stout), écarts chiffrés sur Floral ↑ et Résineux ↓, inconnus en une rangée
hachurée. Fiche courte à l'appui long (ou survol long) sur une tête ; légende derrière « ? ». Pictos au trait,
« épicé » cannelle et clou croisés.

## Données (moteur de la maquette, 24.10, en direct dans `donnees-moteur.ts`)
`lireColonnes` de `parcours/src/ecrans/comparer/calcul.ts`, 4 g/L, US-05, aux cinq moments. Mêmes nombres que la
NOTE de la maquette (floral 10′ : 0,51 / 0,73 / 0,94 ; après : 0,89 / 1,25 / 0,85). IBU : 52/101/137 à 60′,
19/37/50 à 10′, 8/15/21 au WP ; à froid « ? IBU » (non modélisé, jamais 0). Végétal, pépins, melon : inconnus pour
les trois (aucune fiche), une rangée hachurée.

## Ce qui tient
- r6a au premier plan, intacte ; l'ajout coûte une bande de 64 px.
- Le « quand » se lit avant le toucher : la rangée des meneurs répond déjà « lequel, à quel moment ».

## Ce qui casse ou reste douteux
- 98 mots au premier écran (alerte modérée) : l'IBU par tête a gardé « ? IBU » à froid.
- Le meneur au 60′ (~+0,1) ne départage presque rien ; à confronter à son goût.
- Pas encore « Chimie et vraies valeurs » complète ni le panel OSU : un toucher « Vraies valeurs » (α des fiches,
  huile, IBU 60′/10′) seulement ; à greffer de r6a en passe 2.

## Contrôles (joués une fois, depuis la racine)
- `controle-pictos-trait … --page=etat.html` : TRAIT OK (45 pictos, 0 faute).
- `controle-commun … --page=etat.html` : COMMUN OK (mots 98 en alerte modérée, couleurs, au-style, survol, blocs,
  contraste, fiche, standard, trait, légende, parlant, brutes).
- `controle-comparer-familles` : FAMILLES OK (9 rangées). `controle-hors-16d --min=3 --premier-ecran` : HORS-16D OK.
- `controle-alpha` : ALPHA OK. `controle-panel` (série) : PANEL OK (remplissage médian 0,60, ressemblance 0,88).
- `controle-une-question` : ECHEC indicatif (la ligne de contexte porte la lentille). Le moment devient libre à côté du
  houblon : c'est sa demande (« choisir quand comparé ») ; à trancher avec D98.
- `controle-acquis` : ECHEC indicatif (chimie, OSU, vraies valeurs sourcées non balisées en v0).

Captures : `captures/rpb1.png` (repos, après), `captures/rpb1-geste.png` (10′ touché : Galaxy mis en avant, ~50 IBU).

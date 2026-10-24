# rpz2 · L'étalon Saaz

Lot « r6a++ » (24.10, soir), série rpz (libre, brief minimal). Chaleur : **chaude**. Greffe : `ecart-galaxy-saaz`.
Page `etat.html` : r6a reprise telle quelle (split/join, L26) ; classes `rpz2-…`. Captures `../captures/rpz2.png`
(premier écran) et `rpz2-390.png` (page entière).

## L'idée, une seule
Ses mots : « un moyen de différencier un houblon hyper aromatique type Galaxy d'un houblons plus "fade" type saaz » ;
« Mais il faut aussi que on voit comme il faut les différence ! » (D131). Entre le radar et les colonnes, une **règle
mesurée** : l'huile totale (mL/100 g) de chaque houblon, plage du plus bas au plus haut de ses fiches, de 0 à 5 :
Saaz (CZ) 0,3–1 en hachuré gris (l'étalon « fade », pas comparé), Cascade 0,7–2,5, Idaho 7 1–2, Galaxy 1,8–5 dans
leurs couleurs, Nugget 0,9–3,3 en gris clair (ton houblon de base). Sous la règle, ses mots : « ← fade · Saaz » et
« Galaxy · hyper aromatique → ». Pastille « mesuré ». Pas de jugement inventé : « fade » et « hyper aromatique » sont
ses mots, l'huile est le chiffre.

## Ce qui tient
- r6a entière, rien déplacé ; la règle s'insère avant le tableau.
- Honnêteté : valeurs de pack-fiches.json (Beer Maverick 2023, Hopsteiner 2025/2026), plages telles quelles ; Saaz et
  Nugget ne sont pas des colonnes (attributs `data-regle-houblon`, pas de fiche à l'appui long) ; la légende dit que
  l'huile porte l'arôme et que ce qu'elle sent est dans les familles dessous.
- Baseline : pictos au trait, couleurs par houblon (D51), thème clair. 61 mots au premier écran.
- Lecture en trois secondes : la barre de Galaxy est cinq fois celle de Saaz ; Cascade et Idaho 7 entre les deux.

## Ce qui casse ou reste douteux
- Le tableau descend de 60 px : ses deux dernières rangées (Épicé, Végétal) passent sous le premier écran (bas à
  884 px). La règle pourrait se replier au-dessus du tableau ou se réduire à trois lignes.
- L'huile totale n'est qu'un proxy de l'intensité : Saaz a peu d'huile et sent peu, mais deux houblons d'huile égale
  ne sentent pas pareil. La NOTE et la légende le disent ; un critique peut juger le proxy trop court.
- Nugget en gris clair (#c4c4cc) sur fond #f6f6f9 : visible mais discret, voulu (référence, pas candidat).

## Contrôles joués
- TRAIT OK (28 pictos, 0 faute). COMMUN OK (--sans=mots). Premier essai : FICHE ECHEC (« Saaz (CZ) » portait
  `data-houblon`, le contrôle attendait une fiche à l'appui long) ; corrigé en `data-regle-houblon`.
- PANEL ECHEC sur les quatre captures (ressemblance 0,93) : attendu, même base r6a imposée.

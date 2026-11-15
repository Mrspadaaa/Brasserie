# g2b — Annuel, tiède : la cascade, des ventes au résultat, marche par marche

**Chaleur** : tiède. **Idée** : une cascade horizontale sur un axe partagé (0 au trait noir) : ventes +720,00 → charges −909,80 → amorti −288,00 → stock « ? » (case hachurée) → résultat −477,80. Chaque marche se touche et dit ce qu'elle contient. La clôture en 7 pastilles d'état (vert prêt, ambre à faire, gris pas commencé).
**Où vit l'écran** : Finances › Annuel ; années en onglets texte 2025 / 2026.

## Chiffres
Ceux de g2a (fixture, dérivés) : 720,00 ; 909,80 ; 288,00 (20 % de 1 440,00) ; stock inconnu ; −477,80 provisoire au 9 nov. IA « ✦ Expliquer » (sur Charges, au toucher) : « exemple · le loyer et l'électricité de novembre font 51 % des charges de l'année » (468,00 / 909,80), source « 12 opérations 2026 ».

## Problèmes résolus
2 et 7 (on voit comment le résultat se forme, et que le matériel n'y entre que par l'amorti), 29 (pastilles au lieu de 3 étapes et 7 lignes), 6 en partie (place prévue pour une marche TVA si assujetti, non dessinée).

## Baseline
Les 7 lignes de clôture = 7 pastilles (toucher = la feuille de l'étape) ; Impôts Fribourg (montants à reporter, FriTax au second plan), Dossier et archives. Comprendre le résultat (replié aujourd'hui dans « Reporter ») devient le premier plan.

## Boosters UX
`cascade-resultat` (toucher une marche → détail ; capture `g2b-apres.png` : Charges), `pastilles-cloture`, `ia-expliquer`, `annee`.
B1 OK · B2 OK (−477,80 en 28 px rouge) · B3 OK (51 mots) · B6 OK · B8 OK (stock « ? », « provisoire · 9 nov. ») · B11 « 720 entrés, 910 de charges, 288 d'amorti : −478, sans le stock » · B13 marches de 48 px.

## Contrôles
PAGE OK · 51 mots · PANEL OK (0,51). Captures : `g2b-haut.png`, `g2b-page.png`, `g2b-1280.png`, `g2b-apres.png`.

## Tient / casse
Tient : le résultat s'explique sans un mot comptable. Casse : la cascade demande une seconde de lecture la première fois ; une marche de cession de matériel ou d'ajustement s'ajoute seulement si elle existe.

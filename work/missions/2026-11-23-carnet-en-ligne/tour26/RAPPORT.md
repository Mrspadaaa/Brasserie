# Tour 26 : contre-épreuve en ligne des défauts T25 (23.11)

App en ligne, paquet **index-Bl2OF9G2.js** (aiTask à jour). Testeur : Sonnet. Chrome CDP 9222, ma page, 390 × 844. Carnet unique « ZZ TEST — tour 26 », ouvert ; chaque lien collé dans le champ « Ajouter à ZZ TEST… ».
Captures ouvertes et regardées : L4-carte, L7-carte, L5-carte, L5g-fiche et fiche2, L3-fiche, L6-fiche, L1-fiche, L4-fiche, B6-fiche, liste-finale. Non regardées : L2d-carte (preuve par le texte), fiche3 de chaque lien, captures de nettoyage hors z-vide.

## T25 : état en ligne

| T25 | verdict | preuve |
|---|---|---|
| 1 hopfenmarkt prix et variantes | **corrigé** | 7,25 CHF, « Variantes 50 g · 100 g (affichée) · 250 g · 500 g · 1 kg (épuisé) » (L4-fiche) |
| 2 lien mort brewtools | **corrigé** (reste D, T26-4) | « Lien rangé ici · page non lue : adresse introuvable » ; la ligne « Lien introuvable » reste dans Articles |
| 3 nom Mosaic | **corrigé** | « Mosaic Hopfenpellets » |
| 4 gastro-held bruité | **corrigé** | 22 caractéristiques techniques propres, aucun texte marketing ni doublon ; 913,90 CHF, « HT · port offert » ; 12 photos |
| 5 même lien deux fois | **corrigé** | 3e collage : « Déjà dans ce carnet : rien de plus rangé » ; compte resté à 4 puis 8 articles, aucun doublon |
| 6 « 2 025 » | **corrigé** | « Erntejahr 2025 » |
| 7 Speidel EUR | **corrigé** | 1 990 € → ≈1 828 CHF, « douane, port et envoi non comptés » ; plus aucun « non publié » sur la fiche |
| 8 Galaxus libellés allemands | **non corrigé** (partiel) | doublon « Volume 240L » disparu, mais libellés allemands et volume non repris (T26-1) |
| 9 TTC non dit | **corrigé** | « TTC » sur sios, hopfenmarkt ; « HT » sur gastro-held ; « 159,99 € TTC » sur brouwland |

**8 / 9 corrigés en ligne.**

## Page bloquée lue par Google : oui

brouwland (Brew Monk 30 l, Cloudflare), temps 7 s : nom « Brew Monk® stainless steel fermenter 30 l », **159,99 € TTC ≈147 CHF** (vérité RESULTATS.md : 159,99 EUR), frais mentionnés, 4 caractéristiques. Pas de photo (T26-3).

## Autres vérifications

Sios Citra 72,50 CHF TTC juste ; Galaxus 302 CHF, « port offert », 4 photos ; hopfenmarkt port 4,90 CHF. Temps de collage : 5 à 10,6 s.

## Défauts neufs ou restants (`defauts.jsonl`) : 4 D

T26-1 Galaxus libellés allemands, volume non repris ; T26-2 « Non publié : Volume » hors sujet ou faux ; T26-3 brouwland sans photo ; T26-4 ligne du lien mort gardée.

## Notes de méthode

- Un retrait d'article doit attendre environ 10 s avant de fermer la page, sinon l'écriture est perdue ; ce n'est pas classé en défaut (non reproduit après attente).
- La bannière « Article retiré · Annuler » décale le menu ⋯ ; un clic aveugle a annulé un retrait (erreur du banc, pas de l'app).

## Données et coût

12 appels IA ≈ **0,06 CHF** (estimé 0,005 l'un, `ia-journal.jsonl`, méthode `tour26-liens-en-ligne`). Articles retirés, carnet « ZZ TEST — tour 26 » supprimé (Carnets revenu à 15, vérifié sur ouverture neuve). Aucun autre carnet touché.

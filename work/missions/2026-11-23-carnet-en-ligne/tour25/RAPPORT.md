# Tour 25 : lecture des liens en ligne (23.11)

App en ligne, paquet servi **index-Cc1tlz2Z.js** (aiTask à jour). Testeur : Sonnet. Chrome CDP 9222, ma fenêtre, 390 × 844 tactile.
Chaque lien collé DANS le carnet « ZZ TEST — liens tour 25 » ouvert, l'un après l'autre (pas de parallèle : temps propres). Vérité : `banc-liens/verite-ajout.json` et `verite-base.json`.
Temps : collage → dernier changement de l'écran, sans « lecture… » restant. Captures ouvertes et regardées : cartes de L1 à L7, fiches de L1, L3, L4, L5, prix de L2 et L3, fiche L6 (bis). Non regardées : `L5-…-prix`, `L4-…-prix`, `L2-…-fiche`, `L5-…-photo2`.

## Tableau

Mots : = exact, ≈ raccourci juste, ✗ faux.

| n | lien (verité) | temps | nom | prix et devise | CHF converti / frais | HT / port | photos (‹ ›) | caractéristiques | verdict |
|---|---|---|---|---|---|---|---|---|---|
| L1 | sios Citra 1 kg (27) | 8,5 s | = « Citra (USA) 1 kg Hopfenpellets Typ 90 » | ✓ 72,50 CHF | sans objet | TTC non dit (T25-9) ; pas de port | 2 ; ‹ › visible, non joué | Kategorie, Artikelnummer, 1 kg : justes, min. 0,2 sachet absent | **juste** |
| L2 | bierbrauzubehoer Braumeister (32) | 16,9 s | ≈ « Speidel Braumeister 20Liter, Automatisch » (marque ajoutée, bien) | ✓ 1 000 CHF (format 1.000,00 lu) ; barré 1 850 non montré | sans objet | « zzgl. Versandkosten » non dit | 2 ; 1/2 → 2/2 → 1/2 ✓ | 8 lignes justes (volume, 6 kg, 230 V, 29,5 kg…) | **juste** (doublon : T25-5) |
| L3 | speidels EUR (49) | 17,4 s | = « Braumeister 20 Liter » | ✓ 1 990 € | ✓ ≈1 835 CHF, « 1990 € · douane, port et envoi non comptés » | frais dits, HT non dit | 1 (« photo de la page collée », pas de compteur) | 1 vraie + 3 « non publié » (T25-7) ; bundle 2 490 € absent (vérité : prix 1 990, ok) | **juste** |
| L4 | hopfenmarkt Mosaic (34) | 12,5 s | ✗ « Mosaic » (sans Hopfenpellets) | ✗ 3,90 CHF au lieu de 7,25 CHF (défaut 100 g) | sans objet | port 4,90 CHF ✓ | 1 | origine USA, pellets, α 11,4 %, huiles justes ; « 2 025 » | **faux** (T25-1, T25-3, T25-6) |
| L5 | gastro-held ECO 400 (61) | 10,5 s | ✓ « GastroHero Armoire réfrigérée professionnelle ECO 400 GN 1/1 » | ✓ 913,90 CHF | sans objet | ✓ « HT · port offert » ; TVA 987,93 non montrée | 12 ; 1/12 → 2/12 → 1/12 ✓ | justes mais bruitées (T25-4) | **juste** |
| L6 | galaxus KS240L (59) | 6,5 s | = « Kibernetik KS240L » | ✓ 302 CHF | sans objet | « port offert » ✓ | 4 ; 1/4 → 2/4 → 3/4 → 2/4 ✓ (test bis) | 242 l, 40 dB, 38 kg ; en allemand (T25-8) | **juste** |
| L7 | brewtools mort (9) | 5,7 s | « Steam Hat B40pro… » tiré de l'adresse | aucun (juste) | sans objet | sans objet | aucune | aucune | **faux** : pas « introuvable » (T25-2) |

**Liens justes : 5 / 7** (nom, prix et statut justes).

## Défauts (fichier `defauts.jsonl`)

| id | gravité | titre |
|---|---|---|
| T25-1 | B | Hopfenmarkt : 3,90 CHF (50 g) au lieu de 7,25 CHF (100 g, défaut), pas de variantes |
| T25-2 | G | Lien mort : « le site refuse la lecture automatique » au lieu de « introuvable », ligne créée |
| T25-3 | G | Hopfenmarkt : nom « Mosaic » sans « Hopfenpellets » |
| T25-4 | G | Gastro-held : caractéristiques bruitées (marketing, doublons) |
| T25-5 | G | Même lien collé deux fois : deux articles puis « 2 offres » du même vendeur |
| T25-6 | D | « Erntejahr 2 025 » |
| T25-7 | D | Speidel EUR : trois « non publié » |
| T25-8 | D | Galaxus : libellés allemands bruts, « Länge 140 cm », « Volume 240L » doublon |
| T25-9 | D | TTC non dit (sios, hopfenmarkt) |

Total : 1 B, 4 G, 4 D.

## Notes

- Premier test de ‹ › sur L6 (carnet à 7 articles) : le toucher est parti sur la flèche d'article de l'en-tête (« 6e sur 7 » apparu). Cause probable : mon défilement automatique a placé le bouton de la photo sous l'en-tête collant. Rejoué seul dans un carnet « bis » : ‹ › corrects. Non classé en défaut ; à surveiller.
- Bandeau « Synchronisation en attente · données de cet appareil · Actualiser » vu une fois pendant les retraits ; disparu seul. Non classé.
- La fiche propose « Déplacer vers Frigo + congel ? » après collage galaxus : simple bouton, non touché. Aucun article n'est allé dans un autre carnet (contrairement à BL-1).
- Détail du prix : le crayon « Modifier le prix » ouvre un champ sans rien changer (L2, L3, L5), annulé. Pas de capture pour L1, L6, L7.
- L'écran de fiche n'a pas de rendu pour « HT / TTC » hors gastro-held.

## Données et coût

- Carnets « ZZ TEST — liens tour 25 » et « … bis » : articles retirés, puis carnets supprimés (Carnets revenu à 15). Aucun autre carnet touché, aucun « Confirmer », aucun mot de passe.
- Appels IA : 11 (2 phrases de création, 8 liens dont L2 collé deux fois, L6 rejoué) ≈ **0,055 CHF** (estimé 0,005 l'un, `ia-journal.jsonl`, méthode `tour25-liens-en-ligne`).

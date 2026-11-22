# f9 · p2 — gestes par tâche (sélecteurs `data-*`)

Prototype : `proto.html`. On le rebâtit avec `node assemble.mjs && node build.mjs`. La source est `proto.tpl.html`, plus les pièces reprises de p1 (photos, symboles, partage). La fixture est `../../fixture.json`.
Ouvrir un état : `proto.html?etat=<état>`. Thème sombre : `&theme=cave`. Essai seul et chronométré : `?demo=1`.
Rejeu au doigt (390 tactile, touchstart comptés, aucune frappe) : `node gestes.mjs` → `GESTES OK`.

| Tâche | Départ (`?etat=`) | Gestes, dans l'ordre | Touchers |
| --- | --- | --- | --- |
| T1 voir tous les carnets et où ils en sont | `repos` | aucun : sections « En cours » et « Choisis » ; tuile `[data-statut]` (balance = compare, ampoule = idée, photo = choisi) ; ligne 2 « ✓ produit » ou la question | 0 |
| T2 créer un carnet depuis une idée | `repos` | `[data-geste=volant]` → `[data-geste=v-idee]` (dictée simulée) ; raccourci d'accueil : `?etat=raccourci` → `[data-geste=raccourci-idee]` | 2 (1 par le raccourci) |
| T3 noter une recherche | `carnet` | `[data-geste=volant]` → `[data-geste=v-dicter]` ; la note se lit en entier en tête du journal, avec Annuler | 2 |
| T4 ajouter un article par lien | `ventilation` | `[data-geste=volant]` → `[data-geste=v-lien]` (presse-papiers simulé, squelette, puis fiche : photo, nom, prix, fournisseur et pays) | 2 |
| T5 Partager → L'Affinée | `partage` | `[data-geste=partager]` → `[data-geste=partager-affinee]` | 2 |
| T5b ranger l'article partagé ailleurs | `partage` | … → `[data-geste=changer-carnet]` (toast) → `[data-geste=deplacer-vers][data-carnet=…]` (puces des carnets), puis Annuler | 2 de plus |
| T6 activer Surveiller | `ventilation` | `[data-geste=segment][data-seg=articles]` → `[data-geste=surveiller][data-art=a-v1]` (l'œil se remplit, en encre) ; aussi l'interrupteur de la fiche | 2 |
| T7 voir une baisse de prix ou un stock ailleurs | `repos` | « ↓ −600 » sur la ligne Embouteillage (`[data-booster=veille-liste]`) ; le détail : `[data-carnet=c-embouteillage]` → `[data-booster=alerte]` (fiche : courbe, « Aussi chez Getränketechnik Ost », Ajouter) | 0 à 2 |
| T8 comparer sur le critère | `ventilation` | `[data-geste=segment][data-seg=comparer]` : la matrice s'ouvre sur la colonne ★, chiffrée ; le meneur est en vert (`.k-cell.lead`) | 1 |
| T9 comparer une autre caractéristique | `ventilation-comparer` | `[data-geste=carac-voir][data-k=bruit]` (en-tête de colonne) ; on voit les autres colonnes d'un coup d'œil (barres, vert = meneur) | 1 |
| T10 ajouter ou retirer une caractéristique | `ventilation-comparer` | `[data-geste=caracs]` → `[data-geste=carac-basculer][data-k=gaine]` ; proposée par l'IA : `[data-geste=carac-proposee]` ; libre : `[data-geste=carac-autre]` (nom, unité, sens en puces) | 2 |
| T10b poser ou changer le critère ★ | `ventilation-comparer` | `[data-geste=caracs]` → `[data-geste=critere][data-k=bruit]` (jalon au journal, Annuler) ; par la voix : une dictée « il faut… » propose `[data-geste=critere-ia]` | 2 |
| T11 retenir ou écarter une façon | `ventilation` | `[data-geste=facon-retenir][data-f=f-hotte]` ; pour écarter : `[data-geste=facon-ecarter]` → `[data-geste=facon-raison]` (raison tirée du tableau : « débit 1’500 contre 1’800 m³/h ») | 1 (2 avec la raison) |
| T11c une dictée qui nomme une façon | `ventilation` | `[data-geste=volant]` → `[data-geste=v-dicter]` : « VMC double flux » s'ajoute aux Façons, avec Annuler | 2 |
| T12 choisir un article avec son pourquoi | `ventilation-comparer` | `[data-geste=ligne][data-art=a-v1]` (la ligne se déplie : fournisseur, prix, Fiche, Choisir) → `[data-geste=choisir]`. Le choix est gardé tout de suite (Annuler 6 s). La feuille montre les raisons, tirées de la ligne et cochées, ainsi que la raison de chaque écarté ; tout se modifie en direct. Depuis la fiche : `[data-geste=choisir]` | 2 |
| T13 retrouver pourquoi ce fournisseur | `repos` | `[data-carnet=c-embouteillage]` → `[data-booster=pourquoi]` : titre = produit, sous-titre = fournisseur, pays et date, raisons, « 3 écartés ⌄ », « À revoir si », « Façon : Isobarique › » | 2 |
| T14 dicter une note | `frigo` | `[data-geste=volant]` → `[data-geste=v-dicter]` | 2 |
| T15 échéance ou budget sur le calendrier global | `repos` | `[data-carnet=c-embouteillage]` → `[data-booster=calendrier]` (« Achat le 2 déc. » au pied de la bannière ; aussi l'icône calendrier en haut) | 2 |

Le volant b1r : `[data-geste=volant]` ouvre deux cartes. La première porte les actions de l'écran (« Dans … » ou « Carnets ») : dicter en premier, puis coller le lien, photo et écrire. La seconde, « Partout », porte Facture, Brassin, Écriture et Compagnon.
Le clavier ne sert qu'à « Écrire » (note libre), « À la main » (lien sans aperçu) et « Autre » (caractéristique au nom libre).

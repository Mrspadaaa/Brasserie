# f9 · p5 — gestes par tâche (sélecteurs `data-*`)

Prototype : `proto.html`. On le rebâtit avec `node retouche5.mjs && node assemble.mjs && node build.mjs` (retouche5 part de ../p4/proto.tpl.html ; pièces de p1 jointes par split/join ; fixture `../../fixture.json`). Variantes (L24) : `&ecartes=plies` (écartés repliés, ancien défaut) et `&journal=apercu` (dernière note lisible).
Ouvrir un état : `proto.html?etat=<état>` ; sombre : `&theme=cave` ; essai seul et chronométré : `?demo=1`. Téléphone tourné : la même page à 844 × 390 (`PAYSAGE=1 node capt.mjs`).
Rejeu au doigt (390 tactile, touchstart comptés, aucune frappe) : `node gestes.mjs` → `GESTES OK`. Lisibilité : `node mesure.mjs` → `MESURE OK`. Cibles : `node cibles.mjs` → `CIBLES OK`.

| Tâche | Départ (`?etat=`) | Gestes, dans l'ordre | Touchers |
| --- | --- | --- | --- |
| T1 voir tous les carnets et où ils en sont | `repos` | aucun : sections « En cours » et « Choisis » ; tuile `[data-statut]` ; ligne 2 « ✓ produit » ou la question ; « −600 » `[data-booster=veille-liste]` | 0 |
| T2 créer un carnet depuis une idée | `repos` | `[data-geste=volant]` → `[data-geste=v-idee]` (dictée simulée) ; puces proposées `[data-booster=propositions] [data-geste=prop]`, chacune gardée d’un toucher ; raccourci : `?etat=raccourci` → `[data-geste=raccourci-idee]` | 2 (1 par le raccourci) |
| T3 noter une recherche | `carnet` | `[data-geste=volant]` → `[data-geste=v-dicter]` | 2 |
| T4 ajouter un article par lien | `ventilation` | `[data-geste=volant]` → `[data-geste=v-lien]` (squelette, puis fiche : photo, nom, fournisseur · pays, prix ; aucun Choisir juste après l’ajout, toast « Rangé dans Ventilation ») | 2 |
| T5 Partager → L'Affinée | `partage` | `[data-geste=partager]` → `[data-geste=partager-affinee]` | 2 |
| T5b ranger ailleurs | `partage` | … → `[data-geste=changer-carnet]` → `[data-geste=deplacer-vers][data-carnet=…]`, Annuler | 2 de plus |
| T6 activer Surveiller | `ventilation` | `[data-geste=segment][data-seg=articles]` → `[data-geste=surveiller][data-art=a-v1]` (œil plein) ; dans la fiche, interrupteur `[data-booster=veille-fiche]` (role=switch) « Surveiller tous les 3 jours » | 2 |
| T7 voir une baisse ou un stock ailleurs | `repos` | « ↓ 600 CHF » sur la ligne Embouteillage (0) ; détail : `[data-carnet=c-embouteillage]` → `[data-booster=alerte]` (fiche : ↓ 600 CHF, ● en stock, courbe 12’300 puis 11’700 le 13 nov., offres ailleurs `[data-booster=ailleurs]` avec prix en clair et ● stock) | 2 |
| T8 comparer sur le critère | `ventilation` | `[data-geste=segment][data-seg=comparer]` : colonne ★ `.k-t2h.cr` (« ★ Débit », « m³/h » : ni flèche ni ✦) chiffrée, meneur en vert `.k-cell.lead` ; le prix chiffré à côté | 1 |
| T9 comparer une autre caractéristique | `ventilation-comparer` | un glissé à gauche sur `.k-cmx` : nom et ★ restent, les colonnes défilent et s’alignent (snap) ; la suivante est coupée au bord. Paysage : toutes les colonnes d’un coup (0) | 1 |
| T10 ajouter ou retirer une caractéristique | `ventilation-comparer` | `[data-geste=caracs]` → `[data-geste=carac-basculer][data-k=gaine]` (la ligne entière coche ou décoche) ; proposée : `[data-geste=carac-proposee]` ; libre : `[data-geste=carac-autre]` | 2 |
| T10b poser le critère ★ | `ventilation-comparer` | `[data-geste=caracs]` → `[data-geste=critere][data-k=bruit]` (toast « ★ Critère : bruit » + Annuler) | 2 |
| T11 retenir ou écarter une façon | `ventilation` | retenir : `[data-geste=facon-retenir][data-f=f-hotte]` (✓ au trait) ; écarter : la ligne `[data-geste=facon][data-f=f-mural]` ouvre la feuille → `[data-geste=facon-raison]` (raison tirée du tableau) | 1 (2 pour écarter) |
| T12 choisir avec son pourquoi | `ventilation-comparer` | `[data-geste=ligne][data-art=a-v1]` → `[data-geste=choisir]` ; gardé d'emblée (Annuler 6 s) ; écartés : « débit 1’500 contre 1’800 », la différence de prix à l'ouverture | 2 |
| T13 retrouver pourquoi ce fournisseur | `repos` | `[data-carnet=c-embouteillage]` → `[data-booster=pourquoi]` | 2 |
| T14 dicter une note | `frigo` | `[data-geste=volant]` → `[data-geste=v-dicter]` | 2 |
| T15 échéance sur le calendrier global | `repos` | `[data-carnet=c-embouteillage]` → `[data-booster=calendrier]` (jalon à venir « 2 déc. Achat prévu » en tête du journal ; aussi l'icône calendrier en haut) | 2 |

Volant b1r : `[data-geste=volant]` ouvre « Dans … » (dicter d'abord ; coller le lien, photo, écrire sur une rangée) puis « Partout » sur une rangée (Facture, Brassin, Compta au grand livre, Compagnon).
Clavier seulement pour « Écrire » (note libre), « À la main » (lien sans aperçu) et « Autre » (caractéristique au nom libre).

Comparer à 390 : une ligne par offre (même compte qu’Articles), écartés derrière « 3 écartés ⌄ » `[data-geste=voir-ecartes-c]`, lien sans aperçu en ligne « ? » qui ouvre Compléter. Barres proportionnelles à la valeur depuis zéro ; le meilleur en vert.
Variante du journal (choix ouvert, L24) : `?etat=carnet&journal=apercu` (dernière note en gris sous chaque groupe replié).

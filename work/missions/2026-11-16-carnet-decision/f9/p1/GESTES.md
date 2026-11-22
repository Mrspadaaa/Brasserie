# f9 · p1 — gestes par tâche (sélecteurs `data-*`)

Prototype : `proto.html` (rebâti par `node build.mjs` depuis `proto.src.html` et `../../fixture.json`).
Ouvrir un état : `proto.html?etat=<état>` ; thème sombre : `&theme=cave` ; essai seul et chronométré : `?demo=1`
(bandeau « Tâches », chaque tâche remet l'app à son départ, compte touchers et secondes, garde le meilleur en `localStorage`).
Rejeu automatique au doigt (390 tactile, aucun clavier) : `node gestes.mjs` → `GESTES OK`.

| Tâche | Départ (`?etat=`) | Gestes, dans l'ordre | Touchers |
| --- | --- | --- | --- |
| T1 voir tous les carnets et où ils en sont | `repos` | aucun : icône de statut par ligne (`.k-row svg[aria-label]` : idée, recherche, compare, choisi) | 0 |
| T2 créer un carnet depuis une idée | `repos` | `[data-geste=volant]` → `[data-geste=v-idee]` (dictée simulée, le carnet se crée à la fin) ; ou raccourci d'accueil `?etat=raccourci` → `[data-geste=raccourci-idee]` | 2 (1 par le raccourci) |
| T3 noter une recherche | `carnet` | `[data-geste=volant]` → `[data-geste=v-dicter]` ; au clavier : `[data-geste=v-ecrire]` → `[data-geste=ecrire-ajouter]` | 2 |
| T4 ajouter un article par lien | `ventilation` | `[data-geste=volant]` → `[data-geste=v-lien]` (presse-papiers simulé ; chargement, puis fiche : photo, nom, prix, fournisseur ; « Annuler » dans le toast) | 2 |
| T5 Partager → L'Affinée | `partage` | `[data-geste=partager]` → `[data-geste=partager-affinee]` (l'IA range dans Ventilation, « Changer » dans le toast) | 2 |
| T6 activer Surveiller | `ventilation` | `[data-geste=segment][data-seg=articles]` → `[data-geste=surveiller][data-art=a-v1]` (œil plein) ; aussi l'interrupteur de la fiche | 2 |
| T7 voir une baisse ou un stock ailleurs | `repos` | « −600 » sur la ligne Embouteillage (`[data-booster=veille-liste]`) ; détail : `[data-carnet=c-embouteillage]` → `[data-booster=alerte]` (fiche : courbe, « Getränketechnik Ost AT 11’600, en stock », `[data-geste=ajouter-offre]`) | 0 à 2 |
| T8 comparer sur le critère | `ventilation` | `[data-geste=segment][data-seg=comparer]` (le tableau ★ s'ouvre en premier, meneur en vert) | 1 |
| T9 comparer une autre caractéristique | `ventilation-comparer` | `[data-geste=carac-suiv]` (ou `carac-prec`, glisser sur le tableau, ou `[data-geste=caracs]` → `[data-geste=carac-voir][data-k=…]`) | 1 |
| T10 ajouter ou retirer une caractéristique | `ventilation-comparer` | `[data-geste=caracs]` → `[data-geste=carac-basculer][data-k=gaine]` ; proposée par l'IA : `[data-geste=carac-proposee]` ; carnet neuf : `[data-geste=proposition-carac]` puis `[data-geste=garder-caracs]` | 2 |
| T11 retenir ou écarter une façon | `ventilation` | `[data-geste=facon-retenir][data-f=f-hotte]` ; écarter : `[data-geste=facon-ecarter]` → `[data-geste=facon-raison]` | 1 (2 avec la raison) |
| T12 choisir un article avec son pourquoi | `ventilation-comparer` | appui long sur `[data-appui=choisir][data-art=a-v1]` → `[data-geste=garder-choix]` ; ou fiche `[data-geste=choisir]` → `[data-geste=garder-choix]`. Raisons proposées cochées en un toucher (`[data-geste=raison]`), écartés avec raison proposée (`[data-geste=ecarte-raison]`) | 2 |
| T13 retrouver pourquoi ce fournisseur | `repos` | `[data-carnet=c-embouteillage]` → `.k-ban[data-geste=pourquoi]` (fournisseur, raisons, écartés `[data-geste=ecarte-voir]`, « à revoir si ») | 2 |
| T14 dicter une note | `frigo` | `[data-geste=volant]` → `[data-geste=v-dicter]` | 2 |
| T15 échéance ou budget sur le calendrier global | `repos` | `[data-carnet=c-embouteillage]` → `.k-bar [data-geste=calendrier]` (ou la ligne « Achat prévu » du journal) | 2 |

Volant b1r : `[data-geste=volant]` ouvre deux cartes, d'abord les actions de l'écran (« Dans … » ou « Carnets »), puis « Partout »
(Facture, Brassin, Écriture, Compagnon). Clavier seulement pour « Écrire » (note libre) et « À la main » (lien sans aperçu).

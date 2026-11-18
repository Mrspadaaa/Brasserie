# r3 · c2 — son scénario, joué de zéro (CARNET-COEUR), défauts du dernier jeu corrigés

Base : `r3/c1/proto.src.html` (ra joué de zéro, visuel accepté), reprise telle quelle. Retouches marquées `r3 · c1` puis `r3 · c2` dans `proto.src.html` ;
`node build.mjs` produit `proto.html`. Rien de da n'est retiré (`gestes-ra.mjs`, les gestes de ra plus « Garder sans pourquoi refusé » : GESTES OK).

## Partir de zéro
- `proto.html?vide=1` : aucun carnet, aucune donnée de la fixture. Ajouter `&clavier=300` pour le clavier simulé.
- Depuis la liste normale : le lien « Démo : repartir d'un carnet vide » (`[data-zero]`).
- Les liens collés pointent vers un Web simulé (`web.js`, injecté dans le prototype) : 15 pages fictives, marquées
  « exemple ». Ce n'est pas la fixture. Un lien inconnu donne « Lien sans aperçu », jamais une copie inventée.
- IA simulée et marquée « exemple » : caractéristiques par catégorie (`IA_CARAC` : embouteillage, froid, ventilation,
  évier, étiquetage, repli générique), façons types (`FACONS_IA`), lecture de page, disponibilité, « Chercher les ? ».

## Jeu automatique
`node work/missions/2026-11-16-carnet-decision/r3/c2/scenario.mjs` → une ligne `ETAPE n OK|ECHEC` par étape, puis
`COEUR OK`. Écrit `captures/c2-E*.png` (390 × 844 tactile, DPR 2), `captures/planche-01…15.png` (4 par planche) et `scenario.log`.

## Étapes, gestes et sélecteurs
Le champ du bas est `#ra-dock` ; il reste au-dessus du clavier, avec le dernier dépôt et la réponse de l'IA (écho).

| Étape | Geste | Sélecteurs | Attendu |
|---|---|---|---|
| E0 | ouvrir `?vide=1` | `[data-vide]` | « Aucun carnet encore. » |
| E1 | écrire « embouteillage », Entrée | `#ra-dock form[data-form=neuf] #da-neuf` | carnet créé, « 8 caractéristiques proposées » |
| E2 | écrire « gravité, vu chez un collègue, pas mal » | `form[data-form=note] #da-note` | « rangé : façon Gravité » |
| E3 | écrire « isobarique : plus cher, mais capte moins d'oxygène » | `#da-note` | « rangé : façon Isobarique » |
| E4 | écrire « il faut minimiser l'oxygène », toucher « Oui, critère » | `#da-note`, `#ra-dock [data-act=crit]` | `.da-crit` « minimiser l'oxygène », relié à Oxygène capté |
| E5 | toucher « Retenir Isobarique », écrire le pourquoi, Entrée | `[data-act=retenir][data-f]`, `form[data-form=pourquoi] #da-pz` | Isobarique retenue, Gravité écartée, décision datée |
| E6 | écrire une note de recherche | `#da-note` | note, « rangé : prochaine étape » |
| E7-E12 | coller 6 liens, Entrée après chacun | `#da-note` | 6 aperçus ; 5 fournisseurs, 4 pays (CH, DE, IT, FR) |
| E13 | Comparer ; × sur Formats ; Tout garder ; Ajouter « Pièces d'usure en Suisse » ; Chercher les « ? » | `[data-act=comparer]`, `.da-sug[data-s=carac] .x`, `[data-act=toutgarder]`, `[data-act=ajcarac]`, `form[data-form=carac] #da-k`, `[data-act=iaval]` | 7 gardées, la sienne « à vous », remplie par l'IA |
| E14 | toucher la puce Oxygène, puis Prix | `[data-act=kfocus][data-k]`, tableau `[data-table]` `.da-k.foc` | tableau classé en tête ; rien de coupé, texte ≥ 14 px |
| E15 | toucher une ligne, « Vérifier la disponibilité » | `.ra-r[data-act=article]`, `.da-sheet [data-act=dispo]` | `.da-q` : « sur commande… Aussi : Abfülltechnik West (DE) » |
| E16 | « Choisir celui-ci » ; « Garder ce choix » à vide ; toucher « oxygène capté le plus bas » ; toucher « SAV et pièces en Suisse » et « vos notes : « demander une démo au revendeur romand » » ; « Garder ce choix » | `[data-act=choisir]`, `.ra-keep [data-act=valchoix]`, `#da-pq-err`, `[data-act=prop][data-in=da-pq]`, `[data-act=prop][data-in=da-pf]`, `#da-pq`, `#da-pf`, `.ra-rz[aria-pressed]` | champ vide au départ ; à vide : refus dit sous le champ, feuille ouverte ; proposition touchée = écrite dans le champ, puce ✓ ; 5 écartés, raison gardée ; carnet « Pourquoi : oxygène capté le plus bas », aucun « sans pourquoi » ni « sans raison notée » |
| E17 | plus tard : liste, carnet, bandeau, « Pourquoi cette façon ? » | `[data-act=liste]`, `[data-act=ouvrir]`, `.da-choix[data-act=decisions]`, `[data-act=qq]` | « vous avez retenu Isobarique : « iso plus cher, mais bien moins d'O2 capté ». Écarté : Gravité. » ; la décision produit liste ses 5 écartés avec leur raison |
| E18 | « Pourquoi ce fournisseur ? » | `[data-act=qq]` | Revendeur Brassage Romandie (CH), son pourquoi, même machine en DE à 11 400 CHF |
| E19 | frigo, version courte : façons par notes (« chambre froide en kit… », « frigo vitrine pro, plus simple à poser ») ; « bruit » ajouté en double ; disponibilité | idem, `[data-dup]`, `.da-chip.dup` | catégorie froid, 6 proposées ; façons Chambre froide et Vitrine seulement, aucun Évier ; critère « peut trancher entre Chambre froide en kit et Frigo vitrine pro » ; « Bruit » refusé en double, dit, une seule ligne ; réponse de disponibilité capturée (E19f2) |
| E20 (disponibilité : E20f2) | ventilation : façons par la feuille Façons (« Ajouter une façon », Retenir) | `[data-act=facons]`, `form[data-form=facon] #da-nf`, `[data-act=fetat][data-e=retenue]` | catégorie ventilation ; critère Débit |
| E21 (disponibilité : E21f2) | évier : façons par « Chercher les façons » (IA) | `[data-act=iafacons]` | catégorie évier ; critère Profondeur de bac |

## Ce qui a changé dans c1 (r3 · c2), défauts du dernier jeu
1. Choisir : le champ du pourquoi part vide. Une proposition touchée s'écrit dans le champ et passe en ✓ ; un second toucher l'enlève (avant : champ pré-rempli, le toucher l'effaçait).
2. « Garder ce choix » sans pourquoi : refusé, dit en rouge sous le champ, feuille ouverte (avant : « sans pourquoi noté » enregistré en silence).
3. Pourquoi du produit : propositions tirées des tableaux (critère, puis caractéristiques où il est seul en tête) ; plus d'argument de fournisseur ici.
4. Pourquoi du fournisseur : seulement des arguments en sa faveur (SAV en Suisse, en stock, moins cher que le jumeau, citation de vos notes qui le nomment). Le jumeau moins cher devient une ligne neutre « À savoir : même machine chez … à 11 400 CHF, soit 900 CHF de moins qu'ici ».
5. Écartés : la raison lue dans les tableaux est gardée d'office (toucher l'enlève) ; jamais « sans raison notée » sans geste. Le jumeau : « même machine, fournisseur en DE (SAV hors de Suisse) ».
6. Façons tirées des notes : chaque mot-clé porte sa catégorie ; « plus simple à poser » ne crée plus un évier dans le frigo, et « peut trancher entre » ne cite que les façons du carnet.
7. Caractéristique en double (accents et casse ignorés) : refusée, dite dans l'écho du champ, la puce existante cerclée ; une retirée revient au lieu d'être doublée.
8. Pourquoi produit et fournisseur sur plusieurs lignes (`textarea`, `field-sizing: content`) : rien de coupé.

## Ce qui a changé dans ra (r3 · c1)
1. `?vide=1` et le lien « repartir d'un carnet vide » ; liste vide avec sa phrase ; démo « à jouer » masquée en vide.
2. Les caractéristiques d'un carnet neuf sont **proposées** (pas imposées) : carte « Tout garder » dans le fil et en tête de
   Comparer ; la tuile Comparer dit « proposées par l'IA ». Écho à la création : catégorie et 3 premières propositions.
3. Critère : l'IA ne dit plus laquelle des façons est « moins adaptée ». Elle propose « Retenir X / Retenir Y / Plus tard » ;
   le champ du bas demande « Pourquoi, en une ligne » ; les autres façons ouvertes sont écartées avec ce pourquoi.
4. Façons : « Ajouter une façon » dans la feuille ; Retenir et Écarter y demandent aussi le pourquoi ; « façon : … » dans
   une note crée une façon libre ; « Chercher les façons » vaut pour chaque catégorie connue.
5. Comparer : toucher une puce classe par cette caractéristique (« classé par »), le tableau monte en tête.
6. Choisir : « Pourquoi ce fournisseur ? » (proposition « même machine chez … à … CHF ») ; « Garder ce choix » collé en bas
   de la feuille. « Pourquoi ce fournisseur ? » répond avec ce pourquoi.
7. Valeurs sans unité lues en clair (« 30 fûts de 20 L », « fûts de 20 L : 6 contre 30 ») ; « 1 idée ou besoin ».
8. Rangée « Démo » passée à la ligne (critique r2, n° 3).

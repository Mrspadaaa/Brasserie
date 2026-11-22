OK — fb enrichi : Maintenant, sources de l'app, tri, épingle, fiche, sans clavier

Fichiers écrits (tous dans `fb9/p1/`) :
- `build.mjs`, `proto.tpl.html`, `proto.html` ;
- `capt.mjs` (copie adaptée de p8/capt.mjs) et `montage.mjs` ;
- `GESTES.md` ;
- `cap/` : 67 captures et les journaux `journal-390.txt`, `journal-844.txt`, `journal-1280.txt` ;
- `m1.png` à `m6.png` (montages ouverts).

`fl/fb` n'a pas été modifié.

Sorties décisives :
- `node fb9/p1/build.mjs` → PROTO OK, 47 choses. Il échoue si une ligne de fb a bougé ou si un `type="number"` apparaît.
- `capt.mjs` → CAPTURES OK à 390 (30 états, clair et cave), à 844 (5 états) et à 1280 (3 états).
- `controle-panel` (repos, t2, t7, t13 en 390, et repos en 1280) → PANEL OK.
- Mesuré dans tous les états :
  - aucun clavier ouvert, 0 `type="number"` ;
  - les 8 filtres visibles à 390 et à 844 ;
  - « à te permettre » visible dans la rangée collée pendant chaque geste (t2pose : « −367 sous 0 en S24 », en rouge).

Captures ouvertes :
- m1 : repos, t3, t3dicter, t10 ;
- m2 : t13, t13b, conflit, t11 ;
- m3 : t2, t9, t13app, t5b ;
- m4 : repos, t7, t13b et plus, en cave ;
- m5 : paysage 844 ;
- m6 : 1280.

Chaque capture est dans `cap/p1-<état>[-cave]-<largeur>.png`.

Écarts restants :
1. **Paysage** : la première barre arrive à 75 % de la hauteur. La frise et sa rangée collée occupent environ 60 % de l'écran, pas plus. Le + volant chevauche les « libre en fin » de S4 à S5.
2. **Hauteur à 390** : la première barre de la frise est à 63 % de la hauteur. La première chose (Maintenant) est à 24 %.
3. **Barre d'une facture d'une semaine** : la case « payé » la remplit entière, en gris foncé, et cache son picto.
4. **Non faits** : recherche, rappels, récurrence posée, vue liste, hors ligne. Ils sont hors de cette passe.

Prédiction : « Là c'est lisible : je vois tout de suite la facture en retard, le fût et le malt qui manque, et je règle ça en deux touchers sans taper. Mais en horizontal ça reste un peu serré. »

DÉCISION À PRENDRE : « favori » et « épingle » sont fondus en une seule étoile ★, qui épingle la chose et la met dans Maintenant. Les puces souvent posées sont marquées ★ toutes seules. Si le brasseur veut deux gestes distincts, il faudra deux variantes.
CONNAISSANCE : un montant venu de l'app (facture échue −86) entre dans le moteur et fait passer « à te permettre » de 259 à 173 ; toute source chiffrée ajoutée déplace ce chiffre.
LEÇON PROPOSÉE : aucune

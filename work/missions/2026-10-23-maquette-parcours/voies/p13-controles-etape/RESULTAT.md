OK — Quatre contrôles de l'étape Houblons (D111, D112, D113, D121) avec témoins, tous en échec sur d332792c.

## Fichiers écrits
Tous sous `work/refonte-frontend/v4/tournoi/outils/` :
- `controle-geste-etape.mjs` (neuf, D111)
- `controle-appui.mjs` : mode `--etape` ajouté en tête (critère A9, D112) ; le mode par défaut (A1 à A8) n'est pas touché
- `controle-legende.mjs` : mode `--etape` ajouté (D113) ; le mode par défaut (D89) n'est pas touché
- `controle-profil-ouvre.mjs` (neuf, D121)
- `portee-defauts.json` : lignes D111, D112, D113, D121 (portée `["ma-biere"]`, `tourne` oui, verdict `garde`). Fichier relu juste avant, écrit en une commande : 48 lignes ajoutées, aucune retirée ni changée ailleurs.
- Témoins (pages statiques, classes préfixées) : `temoins/geste-etape-chevauche`, `geste-etape-ok`, `appui-etape-muet`, `appui-etape-ok`, `legende-etape-loin`, `legende-etape-ok`, `profil-chevron-seul`, `profil-ouvre-ok` (chacun `etat.html`).

Choix d'écriture : appui et légende étendus (pas de script neuf) ; les critères de GATES qui nomment `controle-appui.mjs` et `controle-legende.mjs` tiennent. Les critères G1 à G3 appellent `controle-geste-etape.mjs`, neuf comme prévu.

## D111 — `controle-geste-etape.mjs`
Nugget glissé de 60′ à 35′, doigt tenu (touchStart, touchMove de 3 px, 18 ms), mesures à 45′ (premier cran sous 47′) et à 35′ : chevauchement de plus de 2 px entre graduations, repères de la frise, puces des étapes, bulle et nom de la puce ; carte tenue de 48 px au plus qui garde « Nugget » ; sélection vide et `user-select` de la bulle à `none`.
- base v4.10 (`--page=index.html`) : `GESTE-ETAPE OK` (puce de 31 px, 5 graduations, 0 chevauchement aux deux mesures).
- d332792c : `GESTE-ETAPE ECHEC` 12 problèmes (carte de 123 px, 60′ sur la puce d'ébullition, 30′, 25′ et 15′ sur les puces de la frise, texte de la bulle en `user-select auto`).
- `geste-etape-chevauche` : ECHEC (24 chevauchements : graduations serrées) ; `geste-etape-ok` : OK. Captures des deux témoins ouvertes et regardées : graduations en bouillie contre colonne lisible.
- RAIL : `controle-rail.mjs … parcours-d332792c ma-biere --page=etat.html --parcours` → `RAIL OK 1/1` (non modifié).
- G1, G2, G3 : `ECHOUE OK`, `GESTE-ETAPE OK`, `ECHOUE OK`.

Écart au texte de D111 : « rien n'est sélectionné » est lu en deux temps (sélection vide, et `user-select` de la bulle à `none`). Sur ordinateur, `getSelection()` reste vide même sur d332792c : seule la seconde mesure rend la plainte visible. La base la passe (`user-select none` pendant le geste).

## D112 — `controle-appui.mjs <dossier> --etape` (A9)
Appui long sur le nom « Nugget » de la carte ; retour mesuré toutes les 15 ms (classe, style, couleurs, ombre, fond, transformation, texte, boîte de la carte et du nom), puis fiche (hash, `[role="dialog"]`, `[data-role="fiche"]` ou calque de la moitié de l'écran) avant 1,6 s ; `user-select` calculé ; `-webkit-touch-callout` lu dans les feuilles locales (Chrome ne le calcule pas) et l'attribut `style`.
- base v4.10 : `APPUI-ETAPE OK` (retour à 2 ms, fiche à 511 ms).
- d332792c : `APPUI-ETAPE ECHEC` 3 problèmes (aucun retour en 1,6 s ; `user-select auto` ; pas de touch-callout none). La fiche s'ouvre à 515 ms : seul le retour manque.
- `appui-etape-muet` : ECHEC ; `appui-etape-ok` : OK.
- Écart : la base ne protège que le nom (`[data-houblon]`), pas toute la carte. « La carte et son texte » est donc lu comme « le texte qui porte l'appui ». Exiger toute la carte ferait échouer la base, qui est la référence.
- Appels rejoués (M15) : `systeme.mjs appels controle-appui.mjs --rejouer` → `APPELS OK (0 critères rejoués)` ; aucun autre GATES n'appelle ce script. Le mode par défaut garde ses sorties (« aucune maquette lue » sans lot).

## D113 — `controle-legende.mjs <dossier> --etape`
Trois groupes : carte de l'ajout, ajouts rapides, familles. Chacun doit avoir son « ? » (le plus proche, dans le même écran de 844 px), dont le toucher montre un texte nouveau (éléments qui n'étaient pas visibles) d'au moins 8 mots, qui nomme les icônes qui n'ont pas déjà leur nom écrit à côté d'elles (les 12 familles de la bande des arômes ; les familles du profil ont leur nom écrit, elles n'en ont pas besoin). Les icônes doivent rester visibles.
- d332792c : `LEGENDE ECHEC` 2 problèmes (carte de l'ajout et ajouts rapides sans « ? » ; seul celui des familles tient : légende de 69 mots).
- base v4.10 : `LEGENDE ECHEC` : aucun « ? » du tout, le manque est aussi celui de la base (comme le dit D113). Je n'ai donc pas de témoin positif réel : `legende-etape-ok` (statique) est le positif.
- `legende-etape-loin` (« ? » de la carte à 1 300 px) : ECHEC ; `legende-etape-ok` : OK.
- Appels rejoués : `systeme.mjs appels controle-legende.mjs --rejouer` → `APPELS OK (0 critères rejoués)`.

## D121 — `controle-profil-ouvre.mjs` (demandé en cours de route)
Page rechargée avant chaque toucher : alerte, puis deux familles tirées au hasard (graine imprimée, `--seed=N` pour rejouer) ouvrent `#/biere` ; un texte visible « analyse », « Ma bière » ou « détail » dans le bloc ou à 48 px de lui.
- d332792c : `PROFIL ECHEC` 4 problèmes (l'alerte et les deux familles laissent `#/ma-biere` ; aucun mot près du bloc). Le « › » ouvre bien `#/biere` (vérifié à part).
- `profil-chevron-seul` : ECHEC ; `profil-ouvre-ok` : OK.
- G7 (commande de GATES.md) : `ECHOUE OK (PROFIL ECHEC, code 1)`.
- Appels rejoués : `systeme.mjs appels controle-profil-ouvre.mjs --rejouer` → `APPELS OK (1 critères rejoués)`.
- Base v4.10 : non rejouée (D121 dit qu'elle a le même « › » ; elle n'a pas la page `ma-biere/etat.html`).

## Critères
- G1 `ECHOUE OK` · G2 `GESTE-ETAPE OK` · G3 `ECHOUE OK` · G5 `PORTEE OK` · G6 `TEMOINS OK` · G7 `ECHOUE OK` · G4 : ce rapport.
- `systeme.mjs appels controle-geste-etape.mjs --rejouer` : `APPELS OK (4 critères rejoués)`. `systeme.mjs cablage` : `CABLAGE OK`.

## Essais et limites
- Un essai par critère. Pas de capture des témoins de légende et de profil (leur sortie est textuelle) ; captures regardées : témoins du geste seulement, et la base et d332792c en geste.
- D111 est joué sur Chrome sans iPhone : le menu du système de l'appui long n'est mesuré que par CSS.
- Le hasard de D121 peut changer les familles tirées d'un rejeu : sans `--seed`, un échec est rejouable avec la graine imprimée.
- Hypothèse du « même écran » en D113 : une hauteur d'écran entre le groupe et son « ? ». Seule l'attribution exclusive (un « ? » = un groupe, le plus proche) fait échouer d332792c ; sans elle, l'unique « ? » situé à 440 px de la carte passerait.

DÉCISION À PRENDRE : faut-il exiger, en D112, que toute la carte (et pas seulement le nom pressé) soit non sélectionnable ? Option A (retenue) : le nom, comme la base. Option B : toute la carte, ce qui oblige la correction à dépasser la base. Recommandation : A pour le contrôle, B comme enrichissement à l'appréciation du concepteur de la voie p1.
CONNAISSANCE : `-webkit-touch-callout` n'est pas calculé par Chrome (déclaration jetée) : un contrôle doit lire la feuille de style source, pas `getComputedStyle`.
LEÇON PROPOSÉE : un remplacement de chaîne par `String.replace` dans un patch d'agent a mangé un `\s` et un `$&` (3 fois dans cette voie, cas L26) : patcher les fichiers avec l'outil d'édition, jamais avec `replace` sur du code contenant des regex.

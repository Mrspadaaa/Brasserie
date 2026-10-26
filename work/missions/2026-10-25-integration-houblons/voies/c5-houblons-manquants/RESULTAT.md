OK — inventaire fait : 248 manquants (a), 58 formes (b), 49 paires (c)

Fichiers écrits : `work/missions/2026-10-25-integration-houblons/voies/c5-houblons-manquants/inventaire.mjs`, `manquants.json`, `RESULTAT.md`. Rien écrit dans src/ ni scripts/. Lancé une fois, sortie sans erreur.

Critères : `VOIE.md` et `GATES.md` absents du dossier ; périmètre pris du message de lancement.

Méthode : normalisation recopiée de `scripts/collecte-hop/fusion.mjs` ligne 207 (non exportée ; le script vérifie qu'elle figure toujours dans fusion.mjs : vrai). Nom de fournisseur retiré pour Brewer's Friend (« Yakima Valley Hops - Krush » → « Krush »), codes d'origine et de sélection retirés (« HBC 586 », « c.v. », « Mt. » → « Mount »). Une fiche est présente si son nom égale un nom ou alias du catalogue, ou à distance ≤ 2 (noms sans chiffre, ≥ 6 lettres). Brewer's Friend n'entre pas dans les paires (la fusion ne lui rattache rien).

Comptes : 33 sources, 2897 fiches, 1510 rattachées valides, 1387 non rattachées ou écartées.
- (a) 248 variétés manquantes ; 80 seulement citées par Brewer's Friend ; 51 citées par 2 sources ou plus.
- (b) 58 produits de forme (Cryo, T90, LupuLN2, LUPOMAX, Incognito, Blend, Pink Boots, Pellets, HyperBoost).
- (c) 49 paires mal rattachées (6 ambiguës, 21 « proche », le reste exact). Une paire = nom de source → variété du catalogue.

30 premières variétés manquantes (nombre de sources) :
1. Krush (8) ; 2. Dolcita (6) ; 3. Hallertauer Magnum (5) ; 4. Tradition (5) ; 5. Elani (5) ; 6. Superdelic (4) ; 7. Luna (4) ; 8. Savinjski golding (4) ; 9. Spalter (4) ; 10. Tettnang Tettnanger (4) ; 11. Titan (4) ; 12. Vera (4) ; 13. Lublin (3) ; 14. Saazer (3) ; 15. Spalt Spalter (3) ; 16. Columbus / tomahawk (3) ; 17. HBC 522 (3) ; 18. HS09326 (3) ; 19. Huell Classic (3) ; 20. Most (3) ; 21. Styrian Golding Celeia (3) ; 22. Terraflux (3) ; 23. Thora (3) ; 24. Denali (2) ; 25. Whitbread Golding (2) ; 26. Ahil (2) ; 27. Alora (2) ; 28. Blisk (2) ; 29. Buket (2) ; 30. Cicero (2).

Voisins à confirmer (dans manquants.json, champ voisinsProbables) : Hallertauer Magnum ↔ Magnum (GR) ; Tradition ↔ Hallertau Tradition ; Savinjski golding ↔ Styrian Golding ; Spalter ↔ Spalter Select ; Spalt Spalter ↔ Spalt ; Whitbread Golding ↔ Whitbread Golding Variety (WGV). Ce sont des (c) probables : le pilote tranche.

Paires mal rattachées (échantillon ; liste complète dans manquants.json) :
- Doublon de catalogue : Ekuanot (beermaverick-ekuanot, 8 fiches) et Equinox (beermaverick-equinox, 1 fiche, hopslist). Barth-Haas dit « Ekuanot (formerly HBC 366) … released as Equinox ». Même variété, deux entrées : c'est la paire demandée par le brasseur, traitée comme doublon, pas seulement comme nom mal rattaché.
- Mount Hood : « Mt. Hood », « Mt. hood » → Mount Hood.
- Mount Rainier : « Mt. Rainier » → Mount Rainier.
- Amarillo : « Amarillo VGXP01 » → Amarillo.
- Ekuanot : « Ekuanot Brand HBC 366 » (usahops) → Ekuanot.
- Hallertau Mittelfrüh : « Hallertauer Mittelfrüh » (proche, d 2) et « Hallertau Mittelfruh Us » (exact) → Hallertau Mittelfrüh.
- Cascade : « NZ Cascade », « Cascade (UK) » → Cascade.
- Fuggle, Golding, Saaz, Perle, Magnum, Northern Brewer, Tettnanger : variantes d'origine → l'entrée du catalogue (ambiguë quand il y a deux origines).

Douteux :
- Cascade (Argentina) et Cascade (Australia) sont comptés comme Cascade ; c'est un rapprochement de nom, pas d'origine.
- Styrian Gold → Styrian Wolf (d 2) : probablement faux ; Cerera → Celeia (d 2) : probablement faux ; Hbc 522 et HS09326 restent manquants (codes).
- Pink Boots : mélange Yakima Chief, classé forme (b), pas variété.
- Superdelic compte deux groupes (« superdelic », « superdelic hops »).
- Les produits « Blend » sans variété nommée restent en (b) sans nom utile.
- Attendus : Krush (8 sources), Elani (5), Superdelic (5), Peacharine (1), Anchovy (1) manquants ; Talus, Nectaron, Riwaka, Sabro, Strata, Idaho Gem, Zappa, Bru-1, HBC 630, Lotus, Vista, Eclipse, Ella, Topaz, Vic Secret, Enigma, Galaxy, Motueka, Wai-iti, Southern Cross, Dr. Rudi déjà au catalogue. Pink Boots : forme seulement.
- Doublon Ekuanot/Equinox : le fichier fusion.mjs n'a pas été modifié ; la correction est à décider.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune

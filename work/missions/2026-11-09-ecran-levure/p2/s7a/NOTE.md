# s7a — Suggérer générique : chaque axe de la fiche en carte − / +, groupées Arômes · Corps · Conduite (passe 4, 09.11)

Base : s6a (cartes q2b, liste groupée vendues ici · Europe · rares, levier conduite, barres). Classes `s7a-`. Chaleur : froide.
Ses mots (LV-1) : « houblons, banane ECT était juste des exemples c'est pas assez générique DU TOUT !!!! ».
Idée : plus aucun but nommé. Les cartes sont les 12 axes de la liste de l'audit (Esters, Phénols, Thiols, Terpènes · Atténuation, Rondeur, Clarté, Tolérance · °C, Vitesse, Soufre, Nutriments), couleurs de l'étape l5b. Chaque carte dit la valeur de ta levure (US-05) ou « ? chercher », et porte deux moitiés touchables, « − n » et « + n », n = levures documentées de ce côté de la tienne. Banane, girofle, abricot… restent des descripteurs dans les pastilles des résultats, jamais une carte.

## Cadres
1. Repos : les 12 cartes, liste neutre (US-05 « la référence », Verdant, Pomona, NovaLager ; Nottingham d'Europe).
2. « − » sur Atténuation : le groupe Corps reste ouvert, Arômes et Conduite repliés (« + un 2ᵉ axe ») ; « levier conduite : aucun documenté pour cet axe » ; reclassement par l'écart à 78–82 % sur une piste 60–90 % où ta levure est en pointillé : vendues ici 1084 (71–75, −7), 1007 (épuisée, −5) ; Europe 21 : Windsor (65–72, −11), S-33 (68–72, −10), T-58 (72–78, −5 ; 22 g/L restants, phénols +) ; rares 477.
3. « + » sur Thiols et sur Clarté, combinés : levier °C documenté (3SH +33 à +72 % de 15 à 30 °C, Samia 2026 ; ta conduite 19 → plus chaud) ; jauges ordinales des deux axes par ligne (l5b) : Verdant (thiols élevés, floculation moyenne), Pomona (moyens, moyenne), US-05 « ⌕ thiols ? ⌕ floculation ? » ; Europe : Nottingham (élevés, haute), Diamond (le plus de thiols mesurés, haute ; 10–15 °C hors plage, perçu faible, soufre).

## Comptes (fiches bière, relatifs à US-05 ; `../c6a/comptes-p4.mjs`)
Arômes, estimé (retouche critique : niveau de fiche OU descripteur de l'axe dans le nom, l'arôme, les styles) : Esters (US-05 faible) − 41 (« neutral / very clean » sans fruité) · + 317 (niveau moyen ou élevé, ou banane, isoamyle, fruité, tropical…) ; Phénols − 187 (POF − ou « non-phenolic ») · + 208 (POF + ou girofle, épicé, poivre, phénolique) ; Thiols − 37 · + 55 (biotransformation élevée, β-lyase, thiol écrits, tableau Lallemand) ; Terpènes − 0 · + 7 (tableau Lallemand, géraniol, linalol, terpène écrits). Vérifié : 3068, WLP300, M20, W-68 et Abbaye sortent en « + esters » (sortie `../c6a/comptes-p4.txt`, lignes « vérif ») ; Atténuation (78–82, écart > 2 points sur le milieu ; 890) − 500 · + 124 ; Rondeur = sucres restants TDS Fermentis (US-05 11 g/L) − 4 (W-34/70, WB-06, BE-256, BE-134) · + 2 (S-04 18, T-58 22) ; glycérol : 0 fiche bière ; Clarté = floculation (US-05 non documentée ; 896) − 201 · + 241 ; Tolérance (9–11 ; 670) − 268 · + 346 ; °C (18–26, milieu 22 ; 719) − 431 · + 268 ; Vitesse (154) − 35 · + 46 ; Soufre (2 fiches, H₂S négatif) − 2 · + 0 ; Nutriments (1 fiche bière, sans niveau) − 0 · + 0. Quand US-05 n'est pas documentée sur l'axe, « + » = niveau élevé, « − » = faible (dit par « ? chercher » sur la carte).
Cadre 2 : vendues ici 2 · Europe 21 · rares 477 (fiches bière à écart > 2). Cadre 3 : rares 3 (Hornindal Kveik Blend ×2, Superlager : biotransformation et floculation hautes).

## Honnêteté
Les valeurs des lignes viennent des fiches (catalogue), de savoir/TROUS-COMBLES.md (tableau Lallemand, TDS Fermentis, Samia 2026). Diamond : niveau « le plus de thiols » = Samia, pas une fiche. 1007 : « épuisée 27.09 », jamais « indisponible ». Aucun axe n'invente un levier : l'atténuation dit qu'aucun n'est documenté.

## Boosters (data-booster)
axes-plus-moins (une carte = un axe, deux sens comptés), groupes-replies, ecart-sur-l-axe (piste et ta levure en pointillé), levier-conduite, jauges-deux-axes (l5b).

## Contrôles
- verifier-page : PAGE OK, aucun débordement.
- `controle-p4.mjs` (dans ce dossier) : s7a OK, 12 axes, chacun « − » et « + », 0 but nommé ; s6a ECHEC (0 axe, 22 buts nommés) : le contrôle échoue sur la version rejetée (LV-1).
- Mots au premier écran : 141 bruts, 94 sans chiffres (> 72 ; s6a : 143 / 108).
- controle-panel : PANEL ECHEC voulu (s7a et s7b partagent s6a, sa base choisie). controle-commun : sans objet.

## Retouches de la passe 4 (critique, SYNTHESE-P4 « Verdicts »)
1. Axes Arômes nourris par niveau OU descripteur, écrit « estimé » ; comptes ci-dessus (Esters + 317 au lieu de + 14).
2. Au repos, pistes °C et % graduées de s6a sous chaque levure (ta conduite 19 en tirets, ta levure en pointillé ambre) ; au cadre 2 la piste de l'axe les remplace. NovaLager sort de la liste du cadre 1 pour tenir l'écran.
3. Nutriments (0 des deux côtés) replié en une ligne « Nutriments · sans donnée · ⌕ chercher » au bout de Conduite ; Terpènes « − 0 » et Soufre « + 0 » restent grisés. Rondeur passe en dernier de Corps (peu documentée, greffe s7b).
4. Greffe s7b : la carte choisie s'ouvre en grand, levier dans l'en-tête — cadre 2 « levier : empâtage → Malts/sucres » (greffe s6b) ; cadre 3 Thiols « levier °C : plus chaud ↓ » et Clarté « levier : non documenté », les autres groupes repliés.
Contrôles rejoués : verifier-page PAGE OK, 0 débordement ; `controle-p4.mjs` s7a OK (12 axes, Nutriments replié sans donnée, 0 but nommé) ; mots au premier écran 133 bruts, 87 sans chiffres.

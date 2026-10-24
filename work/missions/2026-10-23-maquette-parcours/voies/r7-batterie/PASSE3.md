# r7, passe 3 — les écarts des critiques r8a, r8b, r8c (24.10, soir)

Les critiques (Fable) ont regardé les 128 états en images (sa maquette, 5345f6ad, aujourd'hui) : `../r8a-critique/RESULTAT.md`,
`../r8b-critique/RESULTAT.md`, `../r8c-critique/RESULTAT.md`. Verdicts : étape REJET ; Ma bière, fiche, Suggérer, Substituer,
Comparer, acquis ACCEPTÉ. Captures du jour : `work/refonte-frontend/v4/outils/pages/2026-10-24-etats/img/<id>-construite.png` ;
les siennes : `work/refonte-frontend/v4/choix/etats/captures/<id>-choisie.png`. Lis chaque écart dans le RESULTAT cité, ouvre ses
deux images, corrige à la source, et refais la capture de l'état (`controle-etats.mjs … --id=<id> --captures=<os.tmpdir()>`).
Décisions du pilote (D40), écrites ici ; ses mots et ses choix priment (REPRISE-D124.md).

## À corriger (écarts : il ne reconnaîtrait pas son écran)
1. **Ajouts rapides de l'étape** (r8a : retirer, type-whirlpool, type-froid). Une recette qui a des houblons garde les
   propositions aromatiques de sa base : le stock d'abord, 10 g (ou le stock libre) à 10′, jamais des doses de compensation à
   60′ (`quickAdds` passe en mode amérisant sous la bande d'IBU : « Saaz Late 107,4 g +51 IBU »). Une recette vide à
   l'ouverture garde la construction de sa page cas-k2 (`buildFromEmpty`). Après « retirer » du dernier houblon, la lecture la
   plus proche de sa capture (REPRISE § 6) : les propositions aromatiques de sa base, à 10′. Si tu touches
   `prototypes/houblons-v4/src/engine/quickAdd.ts`, seulement une option (défaut inchangé), et `npm run check:engine` vert.
2. **Ajout rapide posé** (r8a : ajout-rapide) : la carte dit ce que l'ajout fait bouger, comme sa base (« floral +1 »), pas
   « ≈ inchangé ».
3. **« Substituts › » de la fiche** (r8b : fiche-substituts) : la liste sort du calcul de u4 (D35) : plages (79–99), ordre du
   pire cas, Zenia comprise, comme ses « remplaçants à 60′ ».
4. **Survol à 1280** (r8b : fiche-survol-1280) : fiche flottante à droite de la carte survolée, carte encadrée, sans voile ni
   flou ; l'étape reste lisible, comme sa base.
5. **« Pour égaler » de Comparer** (r8c : comp-egaler) : par famille, avec sa barre, la dose d'un autre houblon pour le même
   effet, comme r6n2 (son amélioration retenue avec r6a).

## À corriger aussi (réserves retenues par le pilote)
6. **Végétal** (r8a) : D35 tranché : placé seulement si une source le décrit, sinon « non située ». Les fiches de Nugget ne le
   décrivent pas : hachuré, « 6 au style · 5 non situées », sur l'étape et sur Ma bière, comme sa base.
7. **Ma bière** : le titre « Boisé et résineux trop marqué » (ses mots), pas « Résineux trop marqué ».
8. **Sans houblon** (cas-k2, après retirer) : le profil replié « 1 au style · 11 non situées › », sans l'alerte « résineux trop
   marqué », comme sa page cas-k2.
9. **♡ de l'étape** (gout-coeur) : la bulle « aimer · neutre · exclure » s'ouvre sur la carte touchée, comme sa base.
10. **Visée à 0** (visee-moins) : le losange visible à gauche du point (« ◇---○ »), comme sa base.
11. **Fiche** : derrière la feuille, l'étape assombrie et lisible, sans flou ; « α 11–14 % » sans espace large avant « % » ;
    ♡ et ⊘ actifs : glyphe rempli, sans disque, comme sa base.
12. **Comparer** : une seule plage d'α pour un même houblon sur l'écran (celle de la fiche, convention g1), ou la source dite à
    côté ; « ~ dans » / « ~ hors » en mots à côté de l'icône (D88) ; « dose égale 4 g/L chacun » en mots.
13. **Captures à vérifier** (r8c) : `etat-acquis-fiche-g1`, `etat-comp-osu`, `etat-acquis-panel-osu` montrent un autre écran que
    leur état (en-tête de sa base ; feuille « Valeurs » au lieu du panel sous « Preuve ») : pose leur déclencheur sur l'élément
    qui montre l'état, dans la construction.

## Laissés (écrits dans ton RESULTAT, une ligne chacun)
Le fil d'étapes de l'app ne mène nulle part dans la maquette (pas d'autre écran) ; Citra cryo « 1 seule fiche » (plus honnête,
montré avec sa raison) ; les nombres de Nelson Sauvin (mesure L14) ; le groupe « Changer de levure » (D35) ; « Sans Nugget › »
(#145, demandé par lui).

## Critères (rejoués par le pilote)
`construire.mjs` ; `batterie.mjs --sans-construire` → BATTERIE OK ; `controle-etats.mjs prototypes/houblons-v4/maquettes/parcours`
→ ETATS OK ; puis les mêmes critiques rejugent les états touchés. Réponse finale : une ligne.

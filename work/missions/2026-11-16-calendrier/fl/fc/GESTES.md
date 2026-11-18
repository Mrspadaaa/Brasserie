# fc, passe 2 : les gestes du prototype, pour le mesureur

Page : `fl/fc/proto.html`, autonome ; `node fl/fc/build.mjs` la rebâtit. Thème cave : `?theme=cave`.
Elle est prête quand `body[data-pret]` existe. L'état se lit à tout moment par `window.cal.etat()`, qui rend :
- `sel`, `permettre` (depuis S47), `permettreSel` (depuis la semaine choisie), `caisseSel`, `plancher` ;
- `filtres`, `compose` (le brouillon ouvert) ;
- `choses` : id, nom, type, groupe, semaines, montant et jours de chacune.

Chaque geste abouti écrit sa trace dans `body[data-geste]` et dans `window.calTrace`, par exemple `T6 fait a-04 S2→S4`.

Gestes en pointer events, au doigt comme à la souris ; `capt.mjs` les joue au vrai toucher, par CDP `Input.dispatchTouchEvent`.
Il faut relâcher chaque toucher avant le geste suivant. Le défilement vertical reste natif : seul un geste verrouillé
(tenir, tirer, dessiner, glisser une valeur, balayer) bloque le défilement, et il le fait défiler seul près des bords.

## Forme
- L'année est repliée en blocs de 13 semaines à 390 px (26 en paysage et dès 700 px de large), qu'on lit en défilant.
- Chaque bloc porte un axe collé avec les mois, les semaines et la bande « caisse » (`[data-sem="S50"]` ; attributs
  `data-r`, `data-caisse`). Un tireté marque le plancher, avec son étiquette « plancher 709 » en S24.
- Sous l'axe, une piste par type, et plusieurs choses sur la même bande quand elles ne se chevauchent pas.
- Une position du doigt donne une semaine, même d'un bloc à l'autre.

## Repères
- Chose : `.it[data-chose="a-04"]`, avec `data-type`, et `data-s0` / `data-s1` (vrai début / vraie fin dans ce bloc).
  Sa barre : `.it[data-chose="a-04"] .bar`.
- Valeurs : `.it[data-chose="a-04"] [data-val=montant]`, `[data-val=jours]` (affichées si jours > 0, ou pour une activité).
- Piste : `.blk[data-blk="0"] .ln[data-type="achat"][data-lane="0"]`.
- Point libre d'une piste, à une semaine : `await page.evaluate(() => cal.point('achat','S49'))` rend `{x, y, bande}`.
  Il fait défiler la piste au centre et choisit une bande où rien ne couvre cette semaine.
- Tête : `[data-cal=permettre]` (attribut `data-v`), `[data-cal=effet]`, `[data-cal=caisse-sel]`,
  `[data-cal=jours-libres]`, `[data-cal=chargee]`.
  En défilant, une barre d'une ligne `#fc-bar` la remplace, avec le chiffre, l'effet en cours, les jours et les filtres.

## Tâches
| Tâche | Geste exact | Nb | Sélecteurs | Ce qui le prouve |
|---|---|---|---|---|
| T1 · ce que je peux me permettre cette semaine | aucun : lire le grand chiffre en haut | 0 | `[data-cal=permettre]` → `data-v=709` | « 709 à te permettre · sans passer sous 0 en S24 », visible au premier écran |
| T1 bis · une autre semaine | toucher sa case dans la bande caisse, ou le vide d'une piste à cette semaine ; ou glisser le doigt le long de la bande (lecture continue) | 1 | `[data-sem="S50"]` (toucher son bas : `y + h − 6`) | `sel=S50` ; la tête dit « S50 7 → 13 déc. · caisse 5 172 » puis « 709 tu peux sortir · sans passer sous 0 en S24 » ; retour : `[data-act=aujourdhui]` |
| T2 · ajouter un achat avec budget sur une fenêtre | glisser à l'horizontale sur le vide de la piste Achat, de S49 à S5 ; lâcher ; toucher une puce | 2 | départ `cal.point('achat','S49')`, arrivée x de `[data-sem="S5"]`, même y ; puces `[data-puce="0…5"]` (Achat : Pompe −380, Houblons −480, Malt groupé −540, 6 fûts −1 080, Frigo −1 800, Embouteilleuse −2 800) | la puce pose la chose : `n-1`, `S49→S5`, montant de la puce, 0 j ; « Houblons posé · S49 → S5 · Annuler » ; 709 → 229 |
| T2 variante · autre nom ou autre budget | même glisser, puis `[data-champ=nom]` (texte) et `[data-champ=montant]` (`inputmode=decimal`), Entrée ; ou la puce, puis glisser son montant (T5) | 1 + saisie, ou 3 | `[data-act=poser]` | l'effet s'écrit dans la tête pendant la frappe : « ~~709~~ 59 ✓ tient (−650) » |
| T3 · ajouter une activité sans budget, avec ses jours | glisser sur le vide de la piste Activité (S49 → S50) ; toucher une puce | 2 | `cal.point('activite','S49')` ; puces `[data-puce="0"]` Nettoyage 1 j, `"1"` Inventaire 1 j, `"2"` Prospection 2 j… | `n-1`, type activité, `m:null`, `j` de la puce ; la tête dit « ✗ S50 : 5 j / 2 » si la semaine déborde, sinon « ✓ tes jours suffisent » |
| T4 · changer la durée (fenêtre) | poser le doigt sur un bout de la barre et tirer, sans attendre | 1 | fin : x = droite de `.it[data-chose=t-01]` − 5 ; début : gauche + 5 (13 px dedans, 10 dehors ; barre de moins de 48 px : 16 px dehors) | « Ranger la réserve · S48 → S1 (6 sem.) · Annuler » |
| T5 · changer le budget | glisser le montant à l'horizontale : 10 CHF par 7 px (50 au-delà de 1 000) | 1 | `.it[data-chose=a-04] [data-val=montant]`, glisser de +56 px | pendant : « ~~709~~ 629 · ✓ tient (−80) » dans la tête ; après : −620 et Annuler |
| T5 variante · saisir le budget | toucher le montant, taper, Entrée | 1 + saisie | `#fc-edit input[data-edit=montant]` (`inputmode=decimal`, texte sélectionné) | même effet, en direct pendant la frappe |
| T5 bis · changer les jours actifs | glisser « 3 j » à l'horizontale : 1 j par 16 px. Ou le toucher, puis − / + (`#fc-edit [data-pas]`), puis toucher ailleurs. Pour une chose sans jour affiché (achat à 0 j) : toucher la barre, puis le − / + de la bulle (`[data-bpas]`) | 1, ou 2 | `.it[data-chose=t-01] [data-val=jours]` | « Ranger la réserve · 3 j → 4 j · Annuler » |
| T6 · déplacer à d'autres semaines | tenir 300 ms au milieu de la barre, puis glisser ; on peut passer d'un bloc à l'autre, et ça défile seul aux bords | 1 | `.it[data-chose=a-04]` (centre), tenir ≥ 320 ms | la barre se soulève ; la bande caisse passe en vert ou rouge (payer cette chose cette semaine-là tient-il ?) ; la tête dit « ✓ tient » ; « Malt groupé déplacé · S52 → S2 · Annuler » |
| T7 · supprimer | balayer la barre vers la gauche, sans attendre, sur au moins 44 à 64 px : le rouge « Supprimer » apparaît sous le doigt. Ou la tenir et la lâcher sur le + devenu poubelle. Ou la toucher, puis « Supprimer » dans la bulle | 1, ou 2 | `.it[data-chose=t-02]` ; `#fc-fab` (poubelle pendant la prise) ; `#fc-pop [data-act=supprimer]` | « Inventaire supprimé · Annuler » ; `#fc-toast [data-act=annuler]` la remet |
| T8 · filtrer par type | toucher un type, qui reste seul ; le même toucher remet tout ; un autre type s'ajoute ; « Tous » remet tout | 1 | `[data-filtre=brassage\|evenement\|achat\|renovation\|activite]`, `[data-filtre=tous]`, `aria-pressed` | Achat seul : toute l'année des achats tient sur un écran ; `etat().filtres = ['achat']` |

Toucher une barre sans la tenir ouvre sa bulle `#fc-pop` : dates, argent, « Tiens pour déplacer · tire un bout · touche un
chiffre », les jours (− / +) et Supprimer.

## Le + volant (règle b1r)
`#fc-fab` affiche la semaine choisie (« + S47 ») et se réduit pendant le défilement.
- En tête, les actions du calendrier : `[data-plus=achat|activite|evenement|brassage|renovation]` et `[data-act=aujourdhui]`.
- Ensuite, les actions communes, toujours là (`[data-plus=partout]`, inertes dans le prototype).
- Une action du calendrier ouvre le même composeur, sur une fenêtre par défaut posée à la semaine choisie : 4 semaines
  pour un achat, une rénovation ou un brassin, 1 pour un événement ou une activité. On pose alors en trois touchers
  (+, type, puce), sans glisser.
- Un appui long (380 ms) sur le vide d'une piste crée aussi une chose de ce type, sur la même fenêtre par défaut. Si l'on
  glisse ensuite sans lever le doigt, on dessine sa fenêtre.

Paysage (844 × 390) : sans barre du bas ; la tête est réduite à une ligne, les pistes font 24 px, et chaque bloc tient
26 semaines. Aucun `type="number"` : le build le vérifie.

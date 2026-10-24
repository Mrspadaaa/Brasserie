# dgz1 — « Le brassin au pouce » (voie dgz, 24.10 soir)

**Chaleur : tiède.** Greffe `frise-y1b` : la frise de y1b (« Une frise de ce type est vraiment intéressant aussi, un peu à
retravailler »), posée dans le pied de l'outil, dans la zone du pouce, au-dessus de « mesuré … » et de « Annuler · Levure › ».

## La base, gardée
L'écran Dryhopper de la maquette jouable, tel qu'il se joue (« la meilleure version est celle de l'app jouable mais il lui
faut quelques améliorations ») : même shell, même bundle (`prototypes/houblons-v4/maquettes/parcours/assets/`), même moteur,
mêmes gestes. La greffe est injectée après le rendu ; elle lit la frise par `window.__parcours.moteur` (comme `frise.ts`) et
pose le moment par `window.__parcours.envoyer({ type: 'moment' … })`. Rien de la base n'est retouché.

## L'idée, et ce qui est retravaillé
- Le houblon posé au doigt : la puce « ● Idaho 7 · 2 j » glisse sur une piste à quatre zones (ébullition, WP, actif, après),
  les crans calculés en traits pleins, les interpolés en traits fins, ★ au-dessus du meilleur.
- **Retravaillé** : les cinq arrêts de y1b (60′ · 10′ · whirlpool · actif · après) portent chacun ce qu'ils donnent en floral
  (~+2 · ~+13 · ~+14 · ~+22 · ~+23) et un soulignement orangé quand c'est trop amer : le choix se lit avant de toucher. Un
  arrêt est surligné seulement au moment exact (ou dans l'étape, pour actif et après).
- Le rail de p4b2f sous l'axe reste ; la frise est un second accès au même facteur (le moment), au pouce, sans défiler.

## Ce qui tient
Glisser la puce ou toucher un arrêt déplace le rail, les courbes, le bandeau, les barres, la mesure et le pont (capture
`dgz1-geste.png` : 20′, « ≈+11 », « IBU ~121 », « jamais mesuré à ce moment »). Vraies valeurs du moteur, « ? » gardés.

## Ce qui casse
- Le pied monte à ≈ 190 px (frise 80 + mesure + boutons) : la liste des 12 barres se coupe à « Baies » au premier écran et
  défile dessous. « Il faut pas que ça gêne ! » : à juger par lui ; sinon la frise peut remplacer le rail sous l'axe (passe 2).
- Deux curseurs pour un facteur (rail sous l'axe + frise) : doublon assumé en v0.

## Contrôles
| critère | sortie |
|---|---|
| `variantes.mjs` (G1) | VARIANTES-BIEN-4 |
| `controle-pictos-trait --page=etat.html` (G2) | TRAIT OK (22 pictos, 0 faute) |
| `controle-commun --sans=mots` | COMMUN OK |
| `controle-une-question` | UNE-QUESTION OK (libres : moment ; 9 contrôles) |
| `mots-premier-ecran --max=80 --sans-donnees` | MOTS OK |
| `controle-panel` (4 captures) | remplissage médian 0,73, 0 sous 0,50 ; DIVERSITÉ ECHEC (ressemblance 0,95) : les quatre partagent son écran jouable, par contrat |
| `controle-choix --ecran=dryhopper` (base jouable) | CHOIX OK |

Captures ouvertes : `captures/dgz1.png`, `captures/dgz1-geste.png`, à côté du rendu jouable sans greffe.

# Voie p3c — p3a-3 compactée, trois degrés (D245, 01.11 soir)

Mission `work/missions/2026-10-31-ecran-depense`. Agent `concepteur` (Opus), 50 tours au plus. Décideur : le brasseur.

## Ses mots (mot pour mot, SPEC-BRASSEUR)
« Les bandes teintées p3a-3 j'aime beaucoup ! C'est le top 1 de loin quasiment rien ne doit être changé.  Il faudrait juste le rendre un
peu plus compact, pas comme Le tableau à prix p3a-2 mais presque enfin pas copier mais adapté. C'est du 99% bon »

## Portée (L01, une ligne)
La liste des lignes de p3a-3 seulement (bandes de groupe, lignes, détail qté × prix, moutures) devient plus compacte ; tout le reste est
repris de p3a-3 au pixel près : en-tête, bandeau du total, récap ouvert, points ①②, pastilles, filtre « bis 2 », Drive (pastille et toast),
pied « Catégorie · Papier · Confirmer », et chaque état `?etat=`. Règle n° 1 : sa maquette choisie est la base, reprise telle quelle.

## La base
- `v3/p3a-3/etat.html` (sa variante ; `var CFG={id:'p3a-3',gh:'bande',dens:'deux',…}`), ses captures `v3/p3a-3/p3a-3-*.png` et sa
  `NOTE.md`. Copie son `etat.html` dans chaque dossier p3c, puis ne change que la liste.
- Références de densité, à lire, jamais à recopier : `v3/p3a-2` (`dens:'tableau'`, rangées de 28 px, colonnes qté · prix · CHF) et
  `v3/p3a-1` (`dens:'rangee'`). Il veut « presque » cette densité, **adaptée aux bandes teintées** : ni en-tête de colonnes, ni
  tableau, ni Services à part ; la bande pleine teintée par catégorie et le liseré de couleur sur chaque ligne restent.
- Avant de dessiner : charge `boosters-ux`, `impeccable` et `ui-design-system` (skills).

## Les trois degrés (un dossier chacun : `v3/p3c-1`, `v3/p3c-2`, `v3/p3c-3`)
1. **p3c-1, resserré** (« un peu ») : mêmes deux rangées que p3a-3, moins d'air (marges, interligne), la rangée de mouture plus basse.
2. **p3c-2, une rangée** (« presque ») : nom à gauche ; « 6 Kg × 2,30 » sur la même rangée, en 12 px gris, devant le montant ; la
   mouture reste sous son malt, en rangée fine. Viser au moins la densité de p3a-2 (b ≥ 19).
3. **p3c-3, une rangée et la mouture sur son malt** : comme p3c-2, mais la mouture vient sur la rangée de son malt (une pastille, par
   exemple « ↳ 0,60 »). Son montant reste visible, à part, jamais fondu dans celui du malt ; « Rattacher » reste à un toucher.
Les trois gardent : bandes et liseré, pastilles de r1 sur chaque ligne, sous-totaux de quantité, ordre, filtre du récap, cibles ≥ 24 px,
texte ≥ 12 px, aucun `type="number"`. Le 1280 suit le même degré. Ne pas ajouter le QR (il viendra au port, D246).

## D'abord, le contrôle (L13 : il échoue sur la version rejetée avant toute retouche)
Écris `v3/p3c-outils/controle-compact.mjs <id…>` (puppeteer-core, comme `v3/p3a-1/lignes-commun.mjs`, dont tu réutilises la mesure) :
- à 390 × 844 tactile, `a` (lignes entières au premier écran) et `b` (défilé) plus grands que ceux de p3a-3 (a=12, b=17), et la hauteur
  médiane d'une ligne de facture sous celle de p3a-3 ;
- **INCHANGE** : la zone au-dessus de la première bande de groupe, à `?etat=repos`, identique à p3a-3 (0,5 % de pixels différents au plus) ;
- aucun en-tête de colonnes (pas de « qté », « prix », « CHF » en tête de liste) ;
- sortie : une ligne par id avec a, b, médiane, puis `COMPACT OK` ou `COMPACT ECHEC — <raison>`. Témoin : `controle-compact.mjs p3a-3` →
  ECHEC (note la sortie dans RESULTAT).

## Contrôles de chaque degré (depuis la racine ; `<v3>` = `work/missions/2026-10-31-ecran-depense/v3`)
- `node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs <v3>/<id> --ecran=depense` (l'écran dépense n'a pas d'entrée
  dans `ecrans.json` : note sa sortie telle quelle, ce n'est pas un échec du degré ; sa base est p3a-3, D245) ;
- `node <v3>/p3c-outils/controle-compact.mjs p3c-1 p3c-2 p3c-3` → COMPACT OK ;
- `compter-lignes.mjs` dans chaque dossier (copie de celui de p3a-3, id changé) → LIGNES OK ;
- `node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs <v3> p3c-1 p3c-2 p3c-3 --page=etat.html --profil=sans-houblons --sans-lignes` → COMMUN OK ;
- `node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs <v3> <id> --page=etat.html --max=100 --sans-lignes` → MOTS OK ;
- `node work/refonte-frontend/v4/tournoi/outils/controle-contraste.mjs <v3> <id> --page=etat.html` → CONTRASTE OK ;
- `node scripts/agents/verifier-page.mjs <v3>/<id>/etat.html --min-images 0` → PAGE OK ;
- captures : `node <v3>/p3a-1/capturer.mjs <id>` (tous les états de p3a-3, 390 tactile et 1280). **Ouvre-les**, et compare côte à côte
  `p3a-3-repos.png` et `<id>-repos.png`, puis `-renvoi`, `-defile`, `-echec` et `-1280-repos` : au-dessus de la liste, rien ne doit
  bouger ; dans la liste, juge comme lui, en plein format (L12).

## Possède
`work/missions/2026-10-31-ecran-depense/v3/p3c-*/**` seulement (p3c-1, p3c-2, p3c-3, p3c-outils). Ni p3a-*, ni `src/`. Aucun serveur
dans `C:/Users/mrspa/Documents/Brasserie` ; aucun code écrit par heredoc ni `node -e` ; pas de `git stash`, aucun commit, aucune
installation. Ne touche jamais `.codex/hooks.json`, `source4-portable-bundle-manifest-01.json`, `functions/.env`. Chemins absolus dans
Bash, pas de `cd` hors d'un sous-shell.

## Retour
`v3/p3c-outils/RESULTAT.md` : par degré, ce qui a changé (en px), a, b, médiane, les sorties des contrôles, le témoin, les captures
ouvertes, ce qui tient et ce qui casse. Puis une ligne : `P3C OK — …` ou `P3C ECHEC — <raison>`. `LEÇON PROPOSÉE : …` au besoin.

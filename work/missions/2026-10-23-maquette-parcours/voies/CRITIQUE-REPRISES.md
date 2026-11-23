# Contrat commun de la critique des reprises D124 (r8a, r8b, r8c)

À lire en entier par chaque critique, avec son VOIE.md.

## Pourquoi
Le brasseur, 24.10, sur la maquette 24.10 (construction 5345f6ad) : « Ça a bien avancé mais le rail par exemple à perdu en
fonctionnalités et certaines de mes choix ont été perdue » (D124). Règle n° 1 (CLAUDE.md) : « C'est critique que mes choix
soient respectés. SI non, rien n'a de valeur. » Les reprises r1 à r6 ont rendu chaque état de ses maquettes choisies ; r7 les
a assemblées (`prototypes/houblons-v4/maquettes/parcours`, BATTERIE OK 33/33). Les contrôles lisent des mots et des nombres ;
toi, tu regardes **chaque état en image**, comme lui, avant qu'il voie la version.

## Tes entrées
- Les relevés d'états : `work/refonte-frontend/v4/choix/etats/<fichier>.json` (les fichiers de ton VOIE.md). Par état : `quoi`
  (ce que sa maquette montre), `ecart` (ce qui manquait sur 5345f6ad), `voulu` (un écart qu'il a lui-même demandé, avec sa
  ligne D), `capture_choisie`, `capture_5345f6ad`.
- Trois images par état, à ouvrir **toutes** (L12 ; lis-en 8 à 10 par tour, en parallèle) :
  1. sa maquette choisie : le chemin `capture_choisie` ;
  2. la version qu'il a critiquée ce matin : `capture_5345f6ad` ;
  3. la version d'aujourd'hui : `work/refonte-frontend/v4/outils/pages/2026-10-24-etats/img/<id>-construite.png`.
- Ta grille : `work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md`. Ses mots : `work/refonte-frontend/v4/
  SPEC-BRASSEUR.md` (§ 0 et § 1, « Des fonctions et des choix perdus »). Ses défauts : `work/refonte-frontend/v4/DEFAUTS-COURT.md`.
- **Ses refus plus récents l'emportent** (D35) : un élément de sa maquette que vise un défaut postérieur à son choix (D91 :
  « Ça c'est inutile ») ne revient pas ; son absence n'est pas un écart.

## Ce que tu rends : `RESULTAT.md` de ta voie
1. Ligne 1 : `OK — <n> reconnus, <k> écarts ; <écran> : ACCEPTÉ|REJET, …`.
2. Une section `## <écran>` par écran de ta voie, qui commence par `<écran> : ACCEPTÉ` ou `<écran> : REJET`.
3. Dessous, **une ligne par état**, sans exception, au format exact :
   - `- <id> : RECONNU` : il retrouverait ce que sa maquette montre (mêmes mots, nombres, formes, geste) ;
   - `- <id> : ÉCART — <ce qui diffère, où> (<id>-construite.png)` : ce qu'il ne reconnaîtrait pas, ou ce qui manque encore ;
   - un état voulu : `RECONNU` si son vœu (la ligne D) est rendu et que le reste de l'état suit sa maquette, sinon `ÉCART`.
     Les états voulus n'ont pas de capture du jour (pas de geste relevé) : juge-les sur les captures du même écran (la croix,
     le fil d'étapes, le « ? » se voient au repos) ;
   - un état en attente de son choix (`attend_choix` dans le JSON : y1b sur Dryhopper, D123) : `- <id> : EN ATTENTE`.
4. Un écran est REJET dès qu'un ÉCART touche ce qu'il a nommé (ses mots dans SPEC § 1, les lignes D) ; cite la règle. Un
   détail qu'il ne remarquerait pas est une réserve, écrite à la fin (`## Réserves`).
5. Une perte nouvelle (présente le matin sur 5345f6ad, absente aujourd'hui) se signale en tête de la section : c'est le pire
   défaut possible ici.
6. Pas de goût personnel en défaut : ta préférence n'est pas la sienne.

## Ce que tu ne fais pas
Tu ne modifies rien d'autre que ton RESULTAT.md : ni la maquette, ni les relevés, ni les captures. Pas de nouvelle capture
dans le dépôt (au besoin, `os.tmpdir()`). Réponse finale au pilote : ta ligne 1.

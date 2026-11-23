OK — quatre r6a++ (rpb1 à rpb4) : choisir quand comparer, plans, frise, deux vœux

## Fichiers écrits
`work/refonte-frontend/v4/ecran-1/fils24-r6a-plus/` :
- `rpb1/` à `rpb4/` : `etat.html`, `NOTE.md` (chaleur, greffes, ce qui tient, ce qui casse, contrôles), `generer.mjs`,
  `commun.mjs` (vocabulaire de la série), `donnees-moteur.ts` (extraction du moteur de la maquette) ;
- `captures/` : `rpb1.png`, `rpb1-geste.png`, `rpb2.png`, `rpb2-geste.png`, `rpb3.png`, `rpb3-geste.png`,
  `rpb3-radar.png`, `rpb4.png`, `rpb4-geste.png`, `rpb4-fiche.png` (390 × 844, ×2).
Scripts de travail : `os.tmpdir()/rpb/` et `os.tmpdir()/rpb-cap.mjs`. Rien d'autre (git status vérifié).

## Les quatre
- **rpb1, froide** : r6a intacte ; la frise de y1b devient un sélecteur 60′ · 10′ · WP | actif · après, chaque arrêt
  annonçant qui mène le floral (Galaxy ~+0,9 à 10′, Idaho 7 ~+1,3 après).
- **rpb2, tiède (w2)** : chaque colonne est un plan (houblon + moment, frise dans la carte) ; le moteur pose chacun à
  son meilleur moment dans ta 16D : Galaxy à 10′ ; piste commune lettrée C / I / G sur Floral ↑ et Résineux ↓.
- **rpb3, tiède (y1b, p4b2f)** : frise des courbes du 60′ au dry hop, curseur au doigt, Nugget en pointillé ; les
  colonnes suivent ; radar derrière « barres | radar ».
- **rpb4, chaude** : « plus ❀, moins ♣ », floral en travers, résineux en hauteur, un chemin par houblon ; seul Galaxy à
  10′ tombe dans « ton vœu » ; un toucher pose le plan sur les colonnes.
Toutes : 9 rangées de familles au premier écran, mot hors 16D sous chaque tête, Nugget en référence, fiche à l'appui
long, vraies valeurs du moteur (`lireColonnes`, 4 g/L, US-05, cinq moments), IBU à froid « ? ».

## Critères
- G1 : `node work/refonte-frontend/v4/ecran-1/fils24-r6a-plus/outils/variantes.mjs rpb1 rpb2 rpb3 rpb4` → `VARIANTES-BIEN-4`
- G2 : `node work/refonte-frontend/v4/tournoi/outils/controle-pictos-trait.mjs … rpb1 rpb2 rpb3 rpb4 --page=etat.html` →
  `TRAIT OK` (45, 34, 27, 31 pictos ; 0 faute)
- Baseline : `controle-commun … --page=etat.html` → `COMMUN OK` (mots en alerte modérée : 98, 98, 96, 95).
- Indicatifs : FAMILLES OK ×4 (9 rangées) ; HORS-16D OK ×4 ; ALPHA OK ; `controle-panel` → PANEL OK (remplissage
  médian 0,60, ressemblance 0,88, 0/6 paire identique). UNE-QUESTION ECHEC (le moment devient libre, voulu) et ACQUIS
  ECHEC (chimie et panel OSU pas encore greffés) : notés dans chaque NOTE.

## Prédiction
« rpb4 c'est vachement intéressant, on voit direct que Galaxy à 10′ c'est le bon plan ; rpb1 c'est r6a avec ce qui
manquait, mais il manque la chimie et l'OSU. »

DÉCISION À PRENDRE : le moment choisi dans Comparer (sa demande « choisir quand comparé ») fait deux facteurs libres
contre D98 ; à garder en lentille globale (rpb1, rpb3) ou en plan par colonne (rpb2, rpb4) : c'est à lui de choisir.

CONNAISSANCE : moteur de la maquette, 4 g/L, US-05 : Galaxy est le plus floral à 10′ (~+0,94 cran) et reste dans la
16D de la stout ; il en sort par les tropicaux dès le whirlpool (tropicaux ~+3,02 crans au WP contre ~+2,91 à 10′, juste au-dessus du haut de la bande). Saaz n'est pas dans le catalogue du
moteur (« Houblon inconnu du moteur : beermaverick-saaz »), donc l'écart Galaxy / Saaz ne peut pas encore se calculer.

LEÇON PROPOSÉE : aucune

OK — paysage : frise à 39 % (en-tête une ligne, plein écran sans en-tête) ; un axe ; noms dans leurs barres

Lot cal, tour 2 (19.11). Dépôt `port-carnet`, branche claude/port-carnet-1711, base 6055c5e82. Pas de commit, pas de build (consigne). Banc : vite port 5601 (Firebase factice), `?preview=calendrier&jeu=brasseur` (et le jeu complet), puppeteer-core, Chrome. Le banc est arrêté.

## Fichiers écrits (port-carnet)
- `src/components/Header.tsx` : téléphone couché, une ligne de 40 px (`h-10`), « Villars-sur-Glâne » masqué ; masqué (`hidden`) tant que le calendrier est en plein écran.
- `src/ui/calendrier/pleinEcran.ts` : petit magasin `poserPleinCalendrier` / `abonnerPleinCalendrier` / `lirePleinCalendrier` (lu par `useSyncExternalStore`).
- `src/ui/calendrier/entete/EnTete.tsx` : pose le magasin selon `plein`, le remet à faux au démontage ; courbe non alignée sans mois (`mois={false}`) ; paysage 90 → 60 px.
- `src/ui/calendrier/entete/entete.css` : paysage, écart chiffre/boutons 4 → 2 px, bande 4 → 2 px.
- `src/components/tabs/CalendrierTab.tsx` : en paysage, `space-y-1` sans `pt-1`, zone d'en-tête `!mt-0`.
- `src/ui/calendrier/frise/Rangee.tsx` : un brassin (hors proposition) garde son nom DANS sa barre dès qu'il y tient. La phrase entière cède d'abord, puis « · coût à venir » (`titreSeul`). Il passe à côté seulement si même le titre n'y tient pas.
- `src/ui/calendrier/frise/Barre.tsx` : prop `titreSeul` ; `dureeDansBarre(…, nom)` mesure le nom vraiment montré.
- Tests : `tests/integration/calendrierTour2Cal.test.tsx` (neuf, 12 cas) ; anciens cas mis à la règle nouvelle dans `calendrierEntete.test.tsx` (3), `calendrierLotB.test.tsx` (1), `calendrierPaquetG-entete.test.tsx` (3) : ils exigeaient des mois dans la courbe et 90 px en paysage.

## n° → fait → preuve
1. **Paysage 844 × 340 (bloquant)** → en-tête d'une ligne (41 px au lieu de 49), courbe 60 px, écarts serrés ; en plein écran, l'en-tête de l'app disparaît.
   - Mesure DOM (jeu brasseur, bandeau du banc de 24 px retiré) :
     - avant : frise à 212 − 24 = 188 px, soit 55 % ; plein écran identique (1re barre à 216 dans les deux) ;
     - après : frise à 156 − 24 = **132 px, soit 38,8 %** de 340 ; **plein écran : 91 px (26,8 %), en-tête « cache »** ; même chose en cave et avec le jeu complet.
   - Si le bandeau du banc compte comme de la page : 45,9 % au repos et 33,8 % en plein écran. Dans l'app, il n'existe pas.
   - Captures ouvertes : `apres-l844-clair-repos.png` (6 brassins visibles, une ligne d'en-tête) et `apres-l844-cave-plein.png` (plus de « L'Affinée », bouton de retour en accent).
   - Vitest : 3 cas échouent sur 6055c5e82 (h-10 absent ; 90 > 60 ; header sans `hidden`) et passent après.
2. **Portrait 390, une seule rangée d'axe** → la courbe non alignée ne porte plus de mois. La bande des semaines est la seule rangée d'axe. Alignée, la courbe garde ses mois (inchangé).
   - Mesure : mois dans la courbe, 6 avant (« déc. févr. avr. juin août oct. »), **0 après** (390, 844, 1280, deux jeux).
   - Captures ouvertes : `avant-p390h800-clair-repos.png` (deux rangées) et `apres-p390-clair-repos.png`, `apres-complet-p390-cave-repos.png` (une rangée S47…S52, noms de la courbe intacts).
   - Vitest : 3 cas échouent sur 6055c5e82 (`text.ent-mois` présents) et passent après.
3. **Nom dans SA barre** → IPA de printemps : dans sa barre (`droite` à 6 px avant), la phrase passe à « prête 7 déc. ». Porter d'hiver (barre de 179 px) : « Porter d'hiver J0 / 35 » dans sa barre (`gauche` avant), « coût à venir » cède.
   - Mesure : à 390, 5 brassins sur 6 sont `dedans` ; à 844 et 1280, 6 sur 6. Seule Ambrée maison, une proposition en pointillé de 57 px, garde son nom contre sa barre, à 6 px, comme le veut la règle des propositions.
   - Vitest : 3 cas échouent sur 6055c5e82 (`droite`, `gauche`, rendu) et passent après.

Preuve « échoue avant » : le test neuf a été lancé sur une copie de HEAD (`git archive` vers le scratchpad, node_modules en jonction puis retirée) : 9 échecs sur 12, les 3 cas témoins passent. Après : 12 sur 12.

## Contrôles
- `npx tsc --noEmit -p .` : 0 erreur.
- Vitest, `tests/integration/calendrier*`, `tests/unit/calendrier*`, plus les tests qui importent Header ou le plein écran (41 fichiers) : 758 réussis, 1 échec, `fix114.test.tsx` : « Facture : une seule fois dans le menu ». Ce test porte sur le menu du + de Finances (FloatingActions, FinancesTab), qu'un autre lot modifie en ce moment (FinancesTab.tsx est modifié hors de ma voie). Ce n'est pas mon lot ; à rejouer par le pilote après les autres lots.
- Captures ouvertes : 7 sur 12 permises.
- Essais : n° 1, deux (39,7 %, puis 38,8 % avec `!mt-0`) ; n° 2 et n° 3, un chacun.

## Reste, doutes, limites
- **CAL-GRAPH-PETIT** (16.11 : courbe d'au moins 70 px en paysage) est contredit par la courbe à 60 px que la cible « courbe basse » demande. Le tracé utile fait environ 40 px ; il reste lisible (capture `apres-complet-l844-clair-repos.png`), mais serré.
- **Les mois quittent la courbe de l'année** non alignée. Le cadre « S47 – S52 » et les noms de la courbe disent encore où l'on est, mais plus les mois.
- **Barre d'onglets** : elle reste en plein écran (BottomNav, hors de ma voie). Le brasseur l'a sur sa capture b19e2698.
- **iPhone** : le plein écran du navigateur n'existe pas pour une page. `plein` reste faux, donc l'en-tête reste. Le paysage gagne quand même l'en-tête d'une ligne et la courbe basse.
- L'en-tête d'une ligne vaut pour tout écran couché (requête du paysage : couché et 540 px de haut au plus), pas seulement pour le calendrier. C'est voulu : même gain partout.
- Non mesuré : un vrai téléphone (le banc émule seulement 844 × 340 tactile). La 1re barre portrait 390 × 800 est inchangée (frise à 218 px, 23 %) : l'axe retiré ne change pas la hauteur de la courbe.
- Preuves : `tour2/cal/` contient 7 captures, `mesures.jsonl` (avant, après, jeu complet) et `banc.mjs`.

DÉCISION À PRENDRE : CAL-GRAPH-PETIT (paysage ≥ 70 px) contre « courbe basse » (19.11). Options : a) garder 60 px et mettre à jour CAL-GRAPH-PETIT (paysage ≥ 60) ; b) 70 px, mais la frise remonte à 41,8 % et sort de la cible des 40 % ; c) 70 px en plein écran seulement. Recommandation : a, puisque sa plainte du 19.11 est la plus récente.

DÉCISION À PRENDRE : les mois de la courbe de l'année. Options : a) aucun, comme maintenant (règle « une seule rangée d'axe ») ; b) de fins traits de mois dans le tracé, sans texte. Recommandation : a, puis b seulement s'il dit se perdre dans l'année. À montrer en mini-maquettes, pas en mots.

CONNAISSANCE : en plein écran, l'en-tête de l'app passe par un magasin externe (`src/ui/calendrier/pleinEcran.ts`, `poserPleinCalendrier`) que Header lit. Un autre écran qui voudra le même effet le réutilise.

LEÇON PROPOSÉE : avant de compter « 1 rangée d'axe », compter toutes les rangées de libellés d'échelle à l'écran (mois de la courbe compris). Le paquet G avait déplacé les mois en haut de la courbe et jugé la règle tenue ; la vision a compté deux rangées.

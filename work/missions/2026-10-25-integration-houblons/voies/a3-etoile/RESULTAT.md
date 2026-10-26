OK — ★ de Dryhopper dessiné après les anneaux : au dessus au centre (390 et 1280), états 138/138

## Fichiers écrits
- `src/ui/hopIndex/dryhopper/index.tsx` : le `<text className="pq-dry-etoile">` passe après le groupe `trait-doigt` (dernier enfant du svg), même position (x, y = TOP - 3), halo blanc ramené de 3 à 1,5 px (`style={{ strokeWidth: 1.5 }}`) pour qu'il ne mange pas l'anneau. Rien d'autre dans le dessin.
- `tests/integration/controle-etoile-dryhopper.mjs` (neuf) : `node tests/integration/controle-etoile-dryhopper.mjs [<dossier construit>]`.
- `work/missions/2026-10-25-integration-houblons/voies/a3-etoile/` : RESULTAT.md, `zoom.mjs` (recadrage large du ★), `captures/{avant,apres}-{390,1280}.png`.

## Critères
- Rouge sur HEAD (maquette construite sur c78111bb) : `ETOILE ECHEC 4` — aux deux formats, centre et centre + 4 px : élément du dessus « circle ».
- Après correction : `ETOILE OK` — `text.pq-dry-etoile` au centre et à +4 px, en 390 × 844 et 1280 × 800 ; page vérifiée Idaho 7, « actif · 1 j » ; ★ à 0,1 et 0,3 px du trait du doigt.
- `npx vitest run tests/unit/hopIndexV4 tests/unit/designTokens.test.ts` : 62 fichiers, 553 tests verts.
- `npm run build` : vert.
- Maquette reconstruite (`construire.mjs`, CONSTRUIT OK 9 pages) ; `controle-etats.mjs prototypes/houblons-v4/maquettes/parcours` : `ETATS OK (138/138) ; 15 voulu(s) non rejoué(s) ; 1 en attente de son choix (etat-dryh-avant-inconnu)`, inchangé.
- Captures avant et après ouvertes (390 et 1280) : avant, le ★ est invisible sous l'anneau violet du floral ; après, il se voit, vert, posé sur l'anneau.

## Essais
Contrôle 1, correction 2 (1re : ★ dernier seulement ; halo de 3 px effaçait le haut de l'anneau, ramené à 1,5 px).

## Doutes et limites
- À 1 j, le floral est au plafond (gain ~+29 > +26, anneau calé sur TOP) : le ★ reste posé sur l'anneau violet (badge dans l'anneau), l'anneau en garde le contour. Le lever au-dessus de l'échelle (y plus haut) n'est pas possible sans toucher la mise en page : le ★ monterait sur la tuile du bandeau (pas de marge au-dessus du svg). Choix gardé : aucun changement de position, donc de dessin.
- Le contrôle lit la maquette construite (fixture : Idaho 7 à 1 j), pas l'app en direct ; c'est le même composant. Il n'est pas branché dans un script npm.
- `prototypes/houblons-v4/maquettes/parcours-a3avant/` (build de HEAD, ignoré par git) laissé en place : sert à rejouer le rouge.

DÉCISION À PRENDRE : aucune
CONNAISSANCE : un repère posé dans un svg se dessine en dernier ; l'ordre d'empilement du SVG est l'ordre du code, et `elementFromPoint` au centre du repère le prouve (même cause que le contour de Galaxy, D156).
LEÇON PROPOSÉE : aucune

ECHEC — voie en cours (brouillon écrit tôt, à remplacer)

## Règle de principe (écrite AVANT toute mesure de son effet, 31.10)

Un excès d'herbacé (`herbal`) ou de végétal (`green`) au-dessus de la bande du style est un défaut, même quand le style n'en dit rien
(statut `neutre`, bande [0, 30] sans source, `from: []`). Le BJCP range l'herbe coupée / végétal parmi les défauts.

- Ces deux familles comptent donc au rang (`overflowRang`, `overflowStyle`) et en « hors du style » (`styleOverflow`) quand elles sont `neutre`.
- Exceptions, déjà portées par le code :
  1. la demande du brasseur prime (s3 R1) : une famille de la direction (`voulu`) ne compte pas au rang, et un excès sous 0,25 cran (`minuscule`) non plus ;
  2. un style qui attend la famille (`attendue`) : sa bande fait foi, la règle ne la touche pas.
- Les autres familles `neutre` (poire d'El Dorado, etc.) restent sous a4 (D125) : leur excès ne compte pas au rang.
- Un seul endroit de code : `voies.ts`, le filtre `o.status !== 'neutre'` des deux calculs du débordement.

(à compléter : mesures, tableau, non-régressions, houblon frais, demande exécutant)

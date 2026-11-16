ECHEC — rejeté : 4 bloquants (e8na pareille à e8nb, FG en points e8nc, noms ambigus e8nd, « Contacts 3 » faux au vide e9nb) ; REPRISE : 5 images e9nd non ouvertes

- **e8na** (la liste en lignes) — REJET : au repos, c'est la même liste que e8nb (variantes qui se ressemblent, revue page 5 et PORTRAIT § 4 « toutes les propositions se ressemblent »). Il dirait « c'est la même chose que le tableau ». Correction : la fondre dans e8nb (greffe des pastilles d'état et de la case « n lots »), ne pas la montrer seule. Relance : écart (fusion).
- **e8nb** (le tableau trié) — ACCEPTÉ : « Propre, je trie par date, la comparaison qui dit ce qui change c'est top » ; 5 retouches mineures (VERDICT.md).
- **e8nc** (le sommaire par style) — REJET : FG visée en points qui se recouvrent dans Comparer (BRIEF § Obligatoire : « FG visée en bande, jamais en point »). Il dirait « compact, je vois mes IPA, mais il manque le degré ». Correction : deux bandes empilées, cibles de 44 px, légende du repos retirée. Relance : retouche.
- **e8nd** (la carte couleur × alcool) — REJET : noms ambigus dans l'amas de 4,5 à 6,5 % (illisible, VOIE k9). Il dirait « vachement parlant, mais on sait pas quel point c'est quoi ». Correction : étiquettes collées à droite avec un trait, axe resserré, liseré en cave. Relance : retouche.
- **e9na** (le carnet que l'IA range) — ACCEPTÉ : « Pratique pour noter vite, mais ça reste un bloc-notes » ; greffer la couleur et les arômes de e9nc.
- **e9nb** (l'ardoise du bar) — REJET : « Contacts 3 » au vide alors que la zone est vide (chiffre faux, VOIE k9). Il dirait « l'ardoise c'est marrant, mais lourd en noir ». Correction : « Contacts 0 » ou les 3 contacts montrés ; carrousel en liste. Relance : retouche.
- **e9nc** (la planche de dégustation) — ACCEPTÉ : « Là c'est des bières, avec ce qu'elle doit sentir » ; NEIPA au Nelson à 6,50 comme ailleurs, cibles de 44 px.
- **e9nd** (les étiquettes de ma gamme) — ACCEPTÉ (provisoire, repos seul) : « Les étiquettes de ma gamme, c'est sympa » ; plaques à la teinte EBC, arômes du Nelson à vérifier sur e9nd-idee.

Détail : `work/missions/2026-11-14-brassins/voies/k9/VERDICT.md` (38 problèmes, 4 bloquants). Tests : `tests.txt` (aucune suite Vitest).
Gate G1 : sa regex est écrite `d+` au lieu de `\d+` (la barre inverse a été perdue, comme dans k7 et k8). Elle échoue sur toute ligne chiffrée :
- telle qu'écrite : VERDICT KO ;
- regex corrigée : VERDICT OK.

Le pilote corrige GATES.md (hors de mon périmètre d'écriture de fait : je n'altère pas un critère).

REPRISE : VERDICT.md. Il reste à ouvrir e9nd-geste, e9nd-idee, e9nd-tarifs, e9nd-vide et e9nd-repos-390-cave, puis à confirmer ou corriger la section e9nd (point 3 : arômes du Nelson) et le compte de la ligne 1.

LEÇON PROPOSÉE : un CHECK écrit dans GATES.md doit être rejoué par le pilote avant de lancer la voie (L13 : « Rejouer chaque critère sur HEAD et sur la version voulue avant la voie »). Les `\d` perdus rendent G1 de k7, k8 et k9 impossible à passer.

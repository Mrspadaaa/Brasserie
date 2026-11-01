# Voie e3-glossaire — les mots du brasseur, candidats pour un glossaire

Agent : executant (Haiku). Une extraction mécanique. Le pilote écrit ensuite la note du cerveau. Écris RESULTAT.md tôt.

## Ce qui est demandé
Lis `work/refonte-frontend/v4/SPEC-BRASSEUR.md` en entier. Relève chaque mot ou tournure du brasseur qui désigne un élément d'interface ou du
métier, et dont le sens a dû être précisé, ou a été mal lu. Exemples connus :
- « traits trié » voulait dire « tiretés » ;
- « épicé » ;
- « au style » contre « Absolu » ;
- « bannir » ;
- « le + pas centré » désignait le signe dans son rond ;
- « pallier 60′ » ;
- « rangées » ;
- « hors 16d ».
Pour chacun, une ligne dans `work/missions/2026-10-31-systeme-ecrans/voies/e3-glossaire/candidats.md`, au format
`| mot du brasseur | sens établi | source (ligne de SPEC, décision ou défaut cité) |`. Recopie le mot exact ; le sens vient du texte, jamais de
toi. Si le sens n'est pas établi, écris « non établi ».

## Critères
- 30 à 80 lignes, chacune avec sa source.
- Aucune ligne inventée : chaque mot cité figure tel quel dans SPEC-BRASSEUR.md, ce que vérifie un grep par ligne.

## Possède
`work/missions/2026-10-31-systeme-ecrans/voies/e3-glossaire/` seulement. N'écris aucun code par heredoc ni par `node -e`. Rends une ligne.

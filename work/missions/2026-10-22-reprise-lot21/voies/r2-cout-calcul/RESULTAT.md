OK — coût de simulerCas mesuré : léger et complet, catalogue, note et annexe écrites.

Fichiers écrits :
- cerveau/metier/cout-calcul-moteur.md (note du cerveau, non ajoutée à INDEX.md : c'est au pilote)
- work/missions/2026-10-22-reprise-lot21/voies/r2-cout-calcul/ANNEXE.md (méthode, script, sortie brute résumée)
- work/missions/2026-10-22-reprise-lot21/voies/r2-cout-calcul/bench.ts (script de mesure)
- work/missions/2026-10-22-reprise-lot21/voies/r2-cout-calcul/RESULTAT.md

Critères :
- G1 : `NOTE OK`
- G2 : `CERVEAU OK (29 notes, 19 leçons)` ; avertissement « note absente de la carte d'INDEX.md » attendu, le pilote l'ajoute.
- G3 : `NOTE OK`
- G4 : `MOTEUR INTACT`
- G5 : `ENGINE-V4 OK (113 tests)`

Mesures (médiane ; cache chaud, 30 répétitions) :
- cas stout 1 ajout : léger 0,167 ms ; complet 3,94 ms
- cas stout 2 ajouts : léger 0,092 ms ; complet 5,19 ms
- catalogue (318 × 5 moments = 1590 cas) : complet 7 961 ms par balayage ; léger US-05 165 ms ; 4 levures léger 643 ms au total
- variante (1 houblon × 5 moments × 4 levures) : léger 1,81 ms ; complet (5 moments, US-05) 24,1 ms
- profils-simules.json : 1 800 628 octets

Essais utilisés : 1 par critère, aucun échec. Un échec de lancement (vite-node hors de la racine prototypes) a été résolu en lançant depuis la racine du dépôt avec `-r . -c prototypes/houblons-v4/vite.config.ts` ; aucun fichier écrit hors des chemins possédés.

Ce qui reste douteux :
- Le cache interne du moteur (cacheBase) fausse les mesures répétées : léger 1,42 ms sans cache contre 0,17 ms avec cache. Les balayages sont à cache chaud ; le premier passage catalogue est noté (froid : léger US-05 1 239 ms, complet 8 346 ms).
- Le facteur téléphone (4 à 6 fois) est une hypothèse non mesurée, écrite comme telle. Reste à mesurer sur un vrai téléphone.
- Le coût de la grille (script profil-simule-cas.ts) n'est pas chronométré.
- Le JSON brut complet (1,26 Mo, lignes par cas) n'est pas recopié dans l'annexe ; il est régénérable avec la commande de l'annexe.
- Le repli « dry hop et biotransformation seulement si trop lourd » n'est pas tranché (leçon L20, décision du pilote).

CONNAISSANCE : Le moteur simulerCas coûte 0,1 à 0,2 ms en léger et 4 à 6 ms en complet par cas sur le PC de mesure (i5-14600KF, Node 24) ; le catalogue complet tient en 8 s en complet et 0,16 s par levure en léger, cache chaud. Détail : cerveau/metier/cout-calcul-moteur.md.

LEÇON PROPOSÉE : Un chronomètre sur une entrée répétée mesure le cache interne du moteur, pas le calcul. Cause : `cacheBase` garde les bases déjà calculées, et les 30 répétitions identiques tombent dedans (léger 0,17 ms contre 1,42 ms avec dose variée). Règle : pour un coût de calcul, mesurer aussi un cas sans cache (entrée qui change à chaque appel) et noter le premier passage à froid.

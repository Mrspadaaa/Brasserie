# PR vers main — PoC publié et performance

Branche dédiée `codex/poc-performance-main`, base `origin/main` `87b076ad0944e3536b57f88fef7267c2b4a16f87`. L'application et les tests sont repris de la version publiée `9aa513238298bbdf3be38b267630b9fbf94255c1`, avec le bilan après publication de `aa0ccbc`. Leur égalité Git a été vérifiée. Les consignes, rôles et profils natifs de main sont conservés.

La PR comprend le PoC car il n'est pas encore intégré à main, puis les optimisations de lecture/édition déjà publiées : snapshots de catalogue stables, noms normalisés, validation des références immuables sans répétition, rapports montés au premier accès et conservés, disponibilité hors ligne, route préparée et focus lors des retours/recherches.

Les archives de travail du PoC, exports d'émulateur, traces/screenhots réels, configuration ignorée et travail non commis de refonte Levure ne sont pas repris. Seuls les résumés, journaux de tests et captures synthétiques sélectionnés du correctif sont joints. Le worktree source de publication et le checkout Levure restent conservés et inchangés.

Publication existante : Firebase release1790544537116000/version6e99e40977bf97a7. Contrôle public16assets identiques au build et smokePC authentifié après publication par le pilote réussis. La mesure physique après sur Android reste ouverte ; la trace initiale ne constitue pas un après.

Cette PR n'effectue ni nouvelle publication ni fusion automatique. Vérifications de cette branche : build production PASS, batterie complète en cours lors de préparation. Les résultats seront ajoutés avant l'ouverture.

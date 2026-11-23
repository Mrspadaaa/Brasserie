# Prompt autonome — nouvelle session Sol Max

Travaille sur L'Affinée dans `codex/levure-refonte`, depuis le commit de passation
consigné par cette branche. poc publiée au b09af85 est la base fonctionnelle
«main v2», main reste inchangée. Vérifie HEAD/diff/agents et préserve les travaux.

Lis AGENTS.md, docs/openai-setup.md, docs/prompts/refonte-levure.md et
docs/validation/levure-refonte-preparation-2026-09-27.md. Applique les rôles/profils
actuels : Sol Max pilote, Astra Max via astra-review dès la conception, Luna sur
livrables indépendants, Claude Pro Opus5.5xhigh pour un lot frontend complet utile
sur copies. Aucun second Sol, API agent facturée, diagnostic pour quota ou copie
des instructions privées Claude.

Objectif complet : **Refonte Levure — disponibilité, choix, fermentation et
ensemencement**. Produits réellement achetables/livrables en petits formats CH
puis FR/DE puis Europe ; référence/produit/offre/lot distincts ; recherche/choix
direct et alternatives volontaires ; possibilités documentées dans la recette,
objectif/conduite/Paliers et spécialisations par propriétés ; dose/packs/starter/
préparation avantJ/reprise réelle ; Gemini pour alternatives/complétion/correction
DB, provenance/conflits/priorité manuelle/late, bonne portée/sauvegarde ; UX mobile
et desktop, performances/hors ligne/import-export/snapshots.

La matrice distingue acquis, manques, obsolètes, décisions. Réutilise auditAstra+
Luna et recherches datées, pas exploration générale ou réécriture des acquis.
Commence avec Astra par frontières des données et moût d'ensemencement, offres/
formats/lot, règles applicables et inconnus. Le fallback nominal de pénurie n'est
pas une association confirmée ; actualAmount prévu n'est pas une mesure réelle.
Une unité inconnue, masse de grain, viabilité/format manquants ne donnent pas une
dose inventée ; BrewingMath.pitchRate n'est pas le moteur à réactiver.

Consigne critères/refus/owners avant code. Une tranche réelle complète démontre
le bénéfice avant extension ; jouer390/1280, gestes, correction/annulation,
save/reopen/offline et snapshots. Tests et compte de captures ne remplacent pas
le jugement sur la refonte. Utilise fixtures/émulateurs ; pas données réelles,
nouvelle campagne IA ou déploiement sans autorisation. La rotation de clé est
séparée et non exécutée ; aucune valeur dans la passation.

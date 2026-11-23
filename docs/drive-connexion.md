# Connexion Google et Drive

La connexion Google utilise le modèle OAuth « authorization code » de Google Identity Services. Elle demande `openid email profile drive.file` et le serveur échange le code à usage unique. Le SDK Firebase reçoit uniquement le jeton d’identité Google et un accès temporaire : les utilisateurs Firebase et le client OAuth existant sont conservés.

Le même identifiant Google doit correspondre au compte Firebase connecté. Le serveur vérifie la signature, l’audience, l’expiration du jeton Google, l’adresse vérifiée et la liste des brasseurs autorisés. Les origines de connexion sont limitées aux deux domaines Firebase du projet. Un mauvais compte est refusé avant toute écriture de son autorisation.

Le renouvellement à long terme est conservé chiffré en AES-256-GCM dans `driveAuthorizations/{googleUid}`. Le propriétaire est lié au chiffrement. La clé et le secret OAuth résident dans `DRIVE_OAUTH_CONFIG`, dans Secret Manager à Zurich. Cette collection est refusée par les règles client existantes et exclue des sauvegardes et de l’historique métier. Aucun jeton n’est ajouté au stockage du navigateur.

Le navigateur récupère automatiquement un accès temporaire au premier besoin après rechargement, puis le garde en mémoire. Un accès encore valide est réutilisé ; l’expiration et un premier HTTP 401 déclenchent un renouvellement silencieux. Les envois restent privés, limités, vérifiés par empreinte et reprenables sans doublon. Aucun original n’est stocké dans la nouvelle collection d’autorisation.

## Configuration et publication

1. `node scripts/setup-drive-oauth.mjs --project=brasserie-l-affinee` vérifie la configuration sans mutation.
2. Ajouter `--apply` transfère directement le client Google Firebase existant vers Secret Manager. Aucun secret n’est imprimé ou sauvegardé sur disque. La clé de chiffrement est conservée lors d’une mise à jour.
3. Déployer `functions:driveAuthorization` dans `europe-west6`, puis le frontend. Les règles existantes refusent déjà cette collection privée.
4. Dans Google Auth Platform, les origines JavaScript du client Web doivent inclure `https://brasserie-l-affinee.web.app` et `https://brasserie-l-affinee.firebaseapp.com`.
5. Vérifier **Audience → État de publication → En production**. Un projet OAuth externe resté en mode test peut limiter le renouvellement à sept jours pour les scopes Drive. Ce statut n’est pas exposé par la configuration Firebase récupérée ici.

Un utilisateur déjà connecté avant la mise à jour devra accorder une première autorisation de renouvellement. Les prochaines connexions Google la demandent dans le même parcours que l’entrée dans l’application. Une révocation par l’utilisateur ou Google nécessite naturellement un nouveau consentement. Une connexion ne peut donc pas être garantie « pour toujours ».

## Vérification réalisée

### Erreur `400 origin_mismatch`

Cette erreur se règle dans **Google Auth Platform → Clients → client Web déjà utilisé par Firebase**, section **Origines JavaScript autorisées**. Ajouter les deux origines exactes, sans chemin ni slash final :

- `https://brasserie-l-affinee.web.app`
- `https://brasserie-l-affinee.firebaseapp.com`

Conserver les autres entrées et les redirections Firebase existantes. Ne pas recréer de client ni changer son secret. Les domaines autorisés de Firebase Authentication et la liste CORS du serveur ne remplacent pas cette liste Google OAuth. [Diagnostic officiel Google](https://support.google.com/cloud/answer/15549257?hl=en).

Le 9 septembre 2026, la console exigeait une connexion interactive avant de consulter ou modifier le client : cette correction de configuration et l'essai de consentement réel restent en attente. Les tests de renouvellement ci-dessous ne valident pas une origine Google Cloud.

Tests isolés de l’échange du code, du refus d’un autre compte, du chiffrement et de sa liaison au propriétaire, du renouvellement après expiration/401, de la reprise sans double envoi, de la révocation et du maintien d’une autorisation lorsque Google ne renvoie pas de nouveau refresh token. Aucun appel Gemini dans ces tests. Le consentement sur le compte réel et le statut Audience exigent une session Google interactive et restent à vérifier après publication.

Références officielles : [modèle de code Google](https://developers.google.com/identity/oauth2/web/guides/use-code-model), [API JavaScript et origine du popup](https://developers.google.com/identity/oauth2/web/reference/js-reference), [durée et révocation des refresh tokens](https://developers.google.com/identity/protocols/oauth2#expiration).

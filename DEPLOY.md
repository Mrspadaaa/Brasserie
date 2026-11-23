# Déploiement — Brasserie L'Affinée

Projet Firebase : `brasserie-l-affinee` · Région : `europe-west6` (Zurich)

## Règle d'or

Tout se développe et se vérifie **en local** avant de partir en production.
Aucun déploiement sans que la checklist ci-dessous soit verte.

---

## Checklist avant chaque déploiement

```bash
npx tsc --noEmit                      # 1. types de l'application
cd functions && npx tsc --noEmit      # 2. types des Cloud Functions
npx vite build                        # 3. build de production
node scripts/check-rules.mjs          # 4. règles Firestore ⇔ collections
node scripts/check-units.mjs          # 5. aucune unité codée en dur
node scripts/check-brewing.mjs        # 6. amertume, couleur, densité, ensemencement, unités US
node scripts/check-water.mjs          # 7. ions, alcalinité résiduelle, solveur de sels
node scripts/check-prompts.mjs        # 8. schémas IA : champs requis ⇔ propriétés
npm test                              # 9. tests locaux, aucun appel Gemini facturable
```

Les évaluations avec un vrai modèle sont exclues de cette checklist et de
Vitest. Elles ne doivent pas être ajoutées à un pipeline normal.

Le contrôle 5 interdit les conversions kg↔g écrites à la main : c'est de là que
venait le houblon affiché « 20000g ». Toute quantité doit passer par
`Units.format()`, qui lit l'unité réelle de l'article au lieu de la supposer.

Le contrôle 4 est le plus facile à oublier et le plus coûteux : une collection
absente des règles fait échouer la migration ENTIÈRE (le lot Firestore est
atomique), et l'application affiche une base vide sans autre explication qu'un
« Missing or insufficient permissions » en console.

### 4. Aucun secret ni code de développement dans le bundle

```bash
grep -rs "dev-local\|DesignPreview\|generativelanguage.googleapis.com" dist/ && echo "⛔ ARRÊT" || echo "✅"
```

Attendu : **aucun résultat**.

- `DesignPreview` — le banc d'essai visuel ne doit jamais partir en production.
- `generativelanguage.googleapis.com` — sa présence signifierait qu'un appel
  direct à Gemini est revenu dans le navigateur, donc une clé exposée.

`AIzaSy…` **est attendu** : c'est la clé web Firebase, un identifiant public par
conception. Ce qui protège les données, ce sont les règles Firestore, pas cette clé.

### 5. Contrôles mathématiques

Le script vérifie 26 valeurs de brassage et de fiscalité contre des références
connues (pression de carbonatation, CO₂ résiduel, réfractomètre, impôt sur la
bière, chimie de l'eau). Toute régression sur ces calculs se traduirait par de la
bière ratée ou une déclaration fausse.

---

## Déploiement

Une seule commande : `npm run deploy`. Elle construit le bundle, **régénère les règles Firestore depuis `.env`**, publie les règles et index, puis les Functions, puis l’interface. Le serveur compatible est disponible avant le nouveau frontend. Les lanceurs Windows utilisent cette même commande et s’arrêtent à la première erreur ; ils n’annoncent plus un succès après un déploiement incomplet.

Le nouveau transfert de sauvegarde utilise `transferBreweryData` et le nettoyage des sessions temporaires `cleanupBreweryTransfers`. Les collections de staging restent privées, accessibles uniquement au serveur. L’exemption d’index `backupTransferRows.data` évite d’indexer les gros fichiers et rapports préparés pour la restauration. Ne pas publier seulement Hosting pour cette évolution.

```bash
npm run deploy
```

Les Cloud Functions se déploient à part, parce qu'elles sont lentes et changent
rarement :

```bash
npm run deploy:functions
```

### ⚠️ Ne jamais lancer `firebase deploy` à la main

C'est la panne qui a eu lieu. `firestore.rules` est **généré** : le dépôt étant
public, il ne versionne que `firestore.rules.template`, où la liste des comptes
autorisés est remplacée par un jeton. Un `npx firebase deploy --only firestore`
lancé sans avoir régénéré le fichier a déployé des règles qui n'autorisaient
personne — plus aucune donnée ne remontait, et l'application annonçait « ce
compte n'est pas autorisé ».

`npm run deploy` régénère toujours les règles avant de les envoyer, et
`scripts/build-rules.mjs` refuse d'écrire une liste vide ou une adresse
d'exemple. Pour ne toucher que les règles :

```bash
npm run deploy:rules
```

### Se rouvrir l'accès si les règles ont verrouillé la base

Les règles s'appliquent aussi à celui qui déploie. Si l'accès est déjà perdu,
`npm run deploy:rules` reste le chemin — le déploiement des règles passe par
l'authentification du CLI Firebase, pas par les règles elles-mêmes. En dernier
recours, l'éditeur de règles de la console Firebase permet de les corriger à la
main.

---

## Configuration côté serveur

### Clé Gemini

Elle vit dans **Secret Manager**, jamais dans le code ni dans le navigateur.

```bash
npx firebase functions:secrets:set GEMINI_API_KEY --data-file cle.txt
rm cle.txt          # ⚠️ supprimer immédiatement après
```

La clé doit appartenir au projet **`brasserie-l-affinee`** pour être facturée sur
le compte Google Cloud existant, et non sur un compte AI Studio séparé en prépaiement.

Rotation : recréer la clé dans AI Studio, rejouer la commande ci-dessus, puis
redéployer les fonctions (`--only functions`) pour qu'elles prennent la nouvelle version.

### Comptes autorisés

La liste existe en **trois exemplaires** qui doivent rester synchronisés :

| Fichier | Rôle |
|---|---|
| `firestore.rules` → `autorises()` | **Protection réelle** des données |
| `functions/src/ai.ts` → `AUTHORIZED` | **Protection réelle** de l'IA |
| `src/services/firebaseAuth.ts` → `AUTHORIZED_ACCOUNTS` | Confort d'affichage uniquement |

Seules les deux premières sécurisent quoi que ce soit : la troisième vit dans le
navigateur et se contourne depuis les outils de développement. Ajouter un compte
sans toucher aux deux premières ne lui donnera accès à rien.

### App Check (optionnel)

Créer une clé reCAPTCHA Enterprise dans la console Google Cloud, puis la placer
dans `.env` sous `VITE_RECAPTCHA_SITE_KEY`. Sans elle, App Check reste inactif et
l'application fonctionne normalement — les règles Firestore protègent déjà les
données, on perd seulement une couche supplémentaire. 10 000 vérifications par
mois sont gratuites.

---

## Développement local

```bash
npm run dev                           # http://localhost:3000
npm run dev -- --port 3001            # si le port est occupé
```

- `?preview=design` → banc d'essai du système de design, sans connexion.
- Il n'existe **aucun contournement d'authentification**. Un utilisateur fictif
  n'a pas de jeton, donc les règles Firestore rejetteraient chaque lecture et
  l'application afficherait une coquille vide. On passe par la vraie connexion
  Google ; la session Firebase persiste entre les redémarrages du serveur.

### Émulateurs

```bash
npx firebase emulators:start --only auth,firestore
```

Puis `VITE_USE_FIREBASE_EMULATORS=true` dans `.env`.

⚠️ **Java est requis** pour l'émulateur Firestore. Sans lui, la commande échoue
sur `Could not spawn java -version` — travailler alors directement contre la base
de production, ce qui reste représentatif.

---

## Base de données

Firestore, **`europe-west6` (Zurich)**, mode Native, édition Standard.

- Les données restent physiquement en Suisse.
- Récupération à un instant donné activée : 7 jours d'historique.
- Protection contre la suppression activée.
- Éligible au palier gratuit.

**L'emplacement est définitif** : Google ne permet pas de déplacer une base après
création. Un changement imposerait de tout réexporter vers une nouvelle base.

Migration depuis `localStorage` : automatique au premier lancement, une seule
fois, pilotée par le drapeau `laffinee_firestore_migration_v1`. `localStorage`
n'est jamais effacé — il reste comme filet de sécurité.

---

## Après déploiement

1. Ouvrir l'application, se connecter avec un compte autorisé.
2. Accepter l'autorisation Google Drive (`drive.file` — accès restreint aux seuls
   fichiers créés par l'application).
3. Réglages → Connexions cloud et IA → **Vérifier que l'IA répond**.
4. Vérifier que le tableau de bord affiche bien les données.

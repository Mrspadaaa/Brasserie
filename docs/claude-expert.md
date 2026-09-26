# Sol, Astra et Claude : expertise avec retour au même pilote

## Répartition validée par l'utilisateur

1. **Sol Max orchestre** : demande, état de reprise, réalisation, délégations aux
   Luna utiles, intégration et vérification.
2. **Astra Max est le collaborateur expert de premier recours de Sol**,
   y compris au cadrage. Cela n'impose ni passage préalable devant Astra ni
   double expertise pour chaque intervention de Claude.
3. **Claude Opus 5.5 xhigh reçoit des tâches précises, surtout frontend**,
   sans attendre un échec ni un blocage. Il apporte une
   conception et réalisation d'un lot complet, direction, diagnostic ou revue ; il ne refait
   pas la collecte, le code courant et les tests déjà confiés à Sol/Luna.

Pas de second Sol. Pas de double avis automatique. Claude peut prendre un lot
frontend complet, de la conception aux fichiers utilisables, via le mode edit du
lanceur expert. Sol garde coordination, intégration et vérification du parcours.

## Bonnes pratiques Opus 5.5 retenues

Anthropic recommande medium comme point de départ et une comparaison de qualité
avant de généraliser xhigh/max. On conserve ici xhigh à la demande de l'utilisateur,
sur les tâches confiées à Claude ; aucun gain de qualité relatif à medium n'a
été mesuré dans ce dépôt. Des critères de fin observables et des preuves priment
sur une simple réponse finale. Pour l'UI, fournir une direction concrète et des
captures lisibles du véritable parcours.
[Guide officiel Opus 5.5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5).

Une longue conversation et les outils influencent l'usage, mais les tokens et le
montant API estimé ne mesurent pas directement le quota Pro. Examiner `/usage`
et `/context` dans Claude pour l'usage réel ; ne pas promettre un gain chiffré.
[Usage et cache](https://code.claude.com/docs/en/costs).

## Sol → Claude → le même Sol

Préparer `docs/prompts/consultation-claude.md`, avec le travail Sol/Astra déjà
effectué et la question restante. Fournir uniquement les preuves utiles, complètes
pour cette décision. Le lanceur ajoute lui-même le rôle expert et le contrat de
retour : les personnalisations globales Claude restent exclues par safe-mode.

```powershell
node scripts/claude-expert.mjs --brief work/mission/brief.md --output work/mission/avis-01.json --sol-thread <UUID-du-Sol-existant> --allow-file src/exemple.ts --dry-run
node scripts/claude-expert.mjs --brief work/mission/brief.md --output work/mission/avis-01.json --sol-thread <UUID-du-Sol-existant> --allow-file src/exemple.ts
```

Pour un lot frontend complet, ajouter `--mode edit` et chaque `--allow-file`
du périmètre. Sol peut préparer les nouveaux fichiers vides issus du découpage
du lot. Jusqu'à 128 fichiers explicites peuvent être confiés ; les limites de
taille protègent le transfert, elles n'imposent pas une petite retouche.
Le lanceur reporte les copies modifiées seulement si les originaux sont inchangés.
Un statut expert `blocked` conserve le brouillon et le manifeste de récupération
sans reporter les changements ; le blocage revient au même Sol.
Sol/Luna ouvrent ensuite le vrai rendu, jouent le parcours et vérifient les
critères. Le navigateur n'est pas fourni au Claude isolé ; fournir les preuves
visuelles utiles ne signifie pas lui imposer une seconde revue.

L'UUID peut venir de `CODEX_THREAD_ID` du pilote. Sans destinataire identifié,
le lanceur refuse la consultation experte. `--with-luna` donne à Claude une
commande de vérification en lecture seule, facultative, pas une équipe systématique.
Les Luna n'appellent pas Claude ni un autre expert. Sol choisit les délégations
de réalisation. Aucun de ces relais ne crée de nouveau Sol.

`avis-01.json.expert.json` expose :

- `advice_ready` : avis reçu, pas livraison produit validée ;
- `needs_sol` : travaux à traiter dans le même Sol, avec dossiers handoff durables ;
- `blocked` : inconnue bloquante explicitée.

Pour `needs_sol`, le lanceur rend la main au parent sans mise en file ni attente
circulaire. Sol lit l'avis et les artefacts, puis accuse réception de chaque
`requestDir` renvoyé :

```powershell
node scripts/sol-handoff.mjs accept --request-dir <dossier-de-la-demande>
node scripts/sol-handoff.mjs complete --request-dir <dossier-de-la-demande> --result work/mission/resultat-sol.json
```

Le résultat Sol suit `scripts/sol-handoff-result.schema.json` : statut
`completed`, `needs_expert` ou `blocked`, résumé, preuves `{ref, detail}` et
questions ouvertes. `completed` exige une preuve, mais la sincérité et la
suffisance des preuves demandent toujours la vérification du pilote. Un code de
sortie CLI zéro ne les établit pas. `accept/complete` contrôlent l'identifiant du
thread et l'empreinte de la requête ; ce protocole coopératif n'est pas une
frontière de sécurité contre un processus local malveillant.

L'avis expert est un instantané au retour de Claude : ses indicateurs de réception
et validation ne sont pas un état vivant. Pour connaître l'état courant, lire
`sol-handoff status` sur les dossiers référencés ; conserver aussi l'avis original.

## Claude autonome → Sol déjà existant

Claude prépare un JSON `{objective, mode, ownedFiles, checks, sourceArtifacts}`.
`mode` vaut `review` ou `implement` ; une réalisation nomme ses fichiers. Les
contrôles sont des critères à examiner, pas des commandes lancées aveuglément.

```powershell
node scripts/sol-handoff.mjs send --thread <UUID-du-Sol-existant> --request work/mission/demande-sol.json --output-dir work/mission/transferts --cwd C:/Users/mrspa/Documents/Brasserie
node scripts/sol-handoff.mjs status --request-dir <dossier-UUID-retourné>
```

Seul `codex queue` est utilisé : pas de `exec`, `resume`, création de chat ou de
second écrivain. La requête et le reçu sont conservés. `queued` signifie seulement
mis en file, pas accepté ni terminé. Une sortie ambiguë vaut `unknown` et ne se
réessaie pas automatiquement. Sans UUID ou accès au canal existant, conserver le
dossier et signaler le blocage. Le mode de la requête est un contrat de travail ;
il ne remplace pas les permissions du Sol déjà actif.

Si le canal direct coince, une Luna peut examiner les faits et préparer/transmettre
le paquet au même Sol via un canal natif disponible. Elle conserve les artefacts,
la destination et la preuve de réception. Ne pas lui faire répéter sans diagnostic
une commande déjà refusée. Si aucun canal ne fonctionne, garder le dossier en
attente ; ne jamais inventer une réception ni lancer un autre Sol.

## Conservation et reprise

Chaque sortie réserve exclusivement `<sortie>.artifacts/` : brief, prompt injecté,
empreintes et copies originales dans `inputs/`, fichiers de travail dans `workspace/`,
flux reçu dans `transcript.jsonl`, réponse brute et identifiant Claude. Les vagues
Luna ont chacune leur UUID, traces et résultats ; les transferts Sol sont conservés.
La persistance native Claude reste également activée.

Aucun nettoyage automatique, y compris après succès ou accusé de réception. Une
sortie existante ne peut pas être réutilisée. Après coupure, inspecter d'abord
l'archive et les copies, puis choisir une nouvelle sortie pour une suite ciblée.
Le transcript garde ce qui est effectivement reçu, même sans réponse finale ;
un contenu jamais reçu du serveur ne peut pas être reconstitué par le lanceur.
Cette conservation locale protège contre l'écrasement et le nettoyage du lanceur,
pas contre la perte du disque : inclure ces dossiers dans la sauvegarde du projet.

Un verrou résiduel n'est jamais effacé automatiquement. Vérifier son processus
et l'archive avant récupération. Les pièces `recovery.json` signalent des copies
à examiner ; elles ne prouvent ni leur validation ni leur report dans les sources.

Une nouvelle consultation porte seulement sur un besoin restant ou une preuve
nouvelle. Sol/Astra traitent d'abord ce qu'ils peuvent résoudre. Le contexte et
les données restent conservés même lorsque Claude n'est pas rappelé.

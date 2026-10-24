**Vous posez en partie la mauvaise question.** Le lag ne vient pas de la taille des données. Il vient de travail inutile sur le fil principal.

1. **Hôte : (b), des couches par-dessus le wizard resté monté.** Il faut une seule source de vérité : le brouillon existant (`writeRecipeDraft`). Chaque niveau d'outil ajoute une entrée d'historique, pour que le bouton retour marche. Une copie Dexie (c) créerait le défaut D139 : « un choix sur un endroit, semble pas toujours être reporté partout ». Des routes (a) démontent le wizard, parce que `App.tsx` rend une seule vue à la fois (R6), et touchent aux retours existants (R3). `RecipePage` reçoit le même hôte de couches, alimenté par la recette.

2. **Calcul : une autre voie.** Il faut d'abord retirer le coût mesuré, avant tout worker.
   - `hopDescriptorEvidence` pèse 417 ms sur 880 au toucher, car son cache est indexé par l'identité du tableau et non par son contenu (t2 `RESULTAT.md`, point 2).
   - `toLocaleString` pèse 21 % du glisser.
   - Le glisser rate son budget (p95 121 ms) à cause du rendu : le précalcul des crans a été « écarté par la mesure ».

   Un worker ne corrige rien de cela. Il ne sert qu'aux balayages du catalogue (478 à 1 188 ms) et au préchauffage. La fabrique sans singleton, les caches bornés et `substitutes` limité aux 8 rendus restent à faire.

3. **Données : ce qui croît, ce sont les recettes, les brassins et les dégustations, donc Firestore.** Le catalogue ne croît pas : 318 variétés, et le ×10 est un « cadre de mesure, pas une prévision » (ETAT, ligne 124). Le chunk Beer Maverick pèse 44,74 ko gzip, donc Dexie (b) n'apporte rien. Je retiens (a), avec préchargement pendant les temps morts. Le vrai levier, ce sont les écoutes par écran, plus la règle « un snapshot inchangé ne relance aucun calcul » (R5d). Le service worker (c) touche au déploiement : c'est à l'utilisateur de décider.

4. **Coexistence : (a), un drapeau.** Retirer V5.5 est une suppression : cela attend l'accord de l'utilisateur. `hopV55Applications` et `hopV55ColdEvidenceAssociations` doivent traverser la conversion sans être modifiés, avec un test aller-retour.

5. **Ordre et premier geste : T1, puis un contrôle bloquant dans l'app, à ×4.**
   - Le contrôle mesure le toucher Ma bière → Suggérer et le glisser.
   - Il tourne sur un jeu réaliste : catalogue de 318, stock ×5, recettes et dégustations ×10, snapshots répétés.
   - Pour T14, on change le résolveur commun d'`etat.html` plutôt que les 71 scripts, en commençant par `controle-choix.mjs`.
   - La question ouverte de t2 (budget « premier retour » ou « écran complet ») modifie ses maquettes : elle revient au brasseur.

Position : autre voie. Hôte en couches sur le brouillon unique ; supprimer le travail inutile avant le worker ; écoutes Firestore par écran ; mesurer d'abord dans l'app.

LEÇON PROPOSÉE : avant de choisir une architecture de calcul, attribuer le temps mesuré à sa cause (profil) et prendre l'échelle des données qui croissent vraiment. Le 24.10, un ×10 du catalogue a cadré la question alors que le profil du 23.10 plaçait le lag dans des caches mal indexés et dans le rendu.

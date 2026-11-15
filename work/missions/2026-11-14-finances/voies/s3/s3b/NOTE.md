# s3b — la phrase aux dates touchables
**Idée** : sous la pilule, la période se lit en une phrase « du 1er nov. au 30 nov. » ; chaque date est un mot souligné qu'on touche pour la changer sur place.
**Chaleur** : chaude. Base v6a telle quelle ; une ligne de 30 px s'ajoute.
**Geste au doigt** : toucher « 30 nov. » → calendrier à plage (façon react-day-picker, mode range) ancré sous le mot ; points sous les jours qui ont des opérations (9, 25 hachuré = à payer) ; toucher 15 → fermé. Image `s3b-ouvert.png`.
**Après** : « du 1er nov. au 15 nov. », la pilule passe en gris (elle ne commande plus), « ↺ novembre » revient au mois d'un toucher. Fixes 68,00 ; payé 325,40 · à payer 0,00 · dépensé 296,80.
**À cheval** : la flèche ‹ du calendrier passe en octobre ; la phrase devient « du 15 oct. au 10 nov. » (pas de données d'octobre ici : inconnu, pas 0).
**Boosters** : `phrase-editable` (édition sur place), `calendrier-plage` (plage, points d'opérations).
**Cibles** : mots 24 px + zone ::after ≈ 44 px ; jours 34 px ; « ✓ Payé » 24 px inchangé.
**Ce qui casse** : la phrase répète « novembre » au repos (redondance assumée : c'est la porte) ; le calendrier couvre les piles pendant le choix.

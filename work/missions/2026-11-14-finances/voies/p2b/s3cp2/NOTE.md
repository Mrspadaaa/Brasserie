# s3cp2 — la loupe comprend une période (passe 2 de s3c, chaude)
**Idée** : une icône calendrier (32 px) à côté du mois ouvre le calendrier à plage ; la loupe lit « 3-17 nov. » en raccourci. Repos = v6a + l'icône (rangée 139 + 32 + 126 px, débord 0).
**Défauts du critique** : 1. rangée pleine → puce réduite à l'icône 32 px (zone 44). 2. état de la puce non montré → image `calendrier` (react-day-picker, mode range, 3 puis 17 touchés, « Poser » 44 px). 3. « 1 après le 17 » → « 5 opérations · loyer du 25 hors plage » (après et suggestion de la loupe). 4. taper au clavier en principal → le calendrier est le chemin principal, la loupe y reste en champ « ou tapez 3-17 nov. » et dans l'en-tête. 5. « Compris aussi » (4 puces) → « exemples ⌄ » au toucher.
**Greffes** : ‹ › glissent la plage de 15 j (19 oct. → 2 nov. · 18 nov. → 2 déc.) (s1b) ; ligne « hors plage » sous Charges fixes, 400,00 gris (s2a) ; jours marqués aux couleurs des catégories, 25 hachuré = à payer (s2b), aussi sur la frise de la loupe.
**Après** : pastille « ‹ [calendrier] 3 → 17 nov. › » + × (28 px) ; Fixes 68,00 ; payé 325,40 · à payer 0,00 · dépensé 296,80 ; retard 60,00 à part.
**À cheval** : « 15.10–10.11 » tapé ou ‹ du calendrier ; la part d'octobre dit « aucune opération saisie » (inconnu ≠ 0), non dessiné ici.
**Boosters** : `du-au` (icône), `calendrier-plage`, `recherche-periode`, `pastille-periode`, `hors-plage`. « ✓ Payé » 24 px inchangé.
**Images** : s3cp2-repos, -calendrier, -loupe, -apres, -page (après, page entière, rangée du bas vue).
**Ce qui casse** : l'analyse des dates tapées est un chantier (formats suisses, années) : bibliothèque à choisir (chrono-node fr ou équivalent), pas à la main ; l'icône seule doit se reconnaître (calendrier standard).

import { describe, it, expect } from 'vitest';
import {
  feuDuNiveau, barreAvantApres, jaugeDuree, dureeTexte, etapeIndex, etatsEtapes, libellesRelecture, sansNomDeModele,
  statutsConversations, renouvellement, modeConseille, partDe, estPlafondAtteint, nombreTexte, BORNE_SERVEUR_S, habituelTexte
} from '../../src/ui/companion/derive';

describe('compagnon · feu du niveau', () => {
  it('info → vert en bas, attention → ambre au milieu, urgent → rouge en haut', () => {
    expect(feuDuNiveau('info')).toMatchObject({ niveau: 'info', libelle: 'Info', allume: 'bas' });
    expect(feuDuNiveau('attention')).toMatchObject({ niveau: 'attention', libelle: 'Attention', allume: 'milieu' });
    expect(feuDuNiveau('urgent')).toMatchObject({ niveau: 'urgent', libelle: 'Urgent', allume: 'haut' });
  });
  it('un niveau inconnu se lit attention, jamais « tout va bien »', () => {
    expect(feuDuNiveau('???').niveau).toBe('attention');
    expect(feuDuNiveau(undefined).niveau).toBe('attention');
  });
});

describe('compagnon · barres avant → après', () => {
  it('des jours entiers : carrés, de 3 à 2', () => {
    expect(barreAvantApres(3, 2, 'j')).toEqual({ genre: 'carres', avant: 3, apres: 2, total: 3 });
  });
  it('une température : échelle graduée qui contient les deux valeurs', () => {
    const b = barreAvantApres(19, 17, '°C');
    expect(b.genre).toBe('echelle');
    if (b.genre === 'echelle') {
      expect(b.min).toBeLessThanOrEqual(17);
      expect(b.max).toBeGreaterThanOrEqual(19);
      expect(b.avant).toBe(19);
      expect(b.apres).toBe(17);
    }
  });
  it('une masse : barre proportionnelle, la plus grande valeur à 100 %', () => {
    const b = barreAvantApres(43, 35, 'g');
    expect(b).toMatchObject({ genre: 'barre', avantPct: 100 });
    if (b.genre === 'barre') expect(b.apresPct).toBeCloseTo(81.4, 1);
  });
  it('un champ non numérique ou de signe changé reste en texte', () => {
    expect(barreAvantApres('Galaxy', 'Citra', '')).toEqual({ genre: 'texte' });
    expect(barreAvantApres(null, 5, 'g')).toEqual({ genre: 'texte' });
    expect(barreAvantApres(-2, 3, 'g')).toEqual({ genre: 'texte' });
    expect(barreAvantApres(0, 0, 'g')).toEqual({ genre: 'texte' });
  });
  it('les nombres s’écrivent à la française', () => {
    expect(nombreTexte(8.6)).toBe('8,6');
    expect(nombreTexte(9)).toBe('9');
  });
});

describe('compagnon · jauge de durée', () => {
  it('2:29 en Approfondi : dans l’habituel, sur la borne serveur de 3:40', () => {
    const j = jaugeDuree('deep', 149);
    expect(j.texte).toBe('2:29');
    expect(j.statut).toBe('dans l’habituel');
    expect(j.fait).toBeCloseTo((149 / BORNE_SERVEUR_S) * 100, 5);
    expect(j.habituelDebut + j.habituelLargeur).toBeCloseTo((180 / BORNE_SERVEUR_S) * 100, 5);
    expect(dureeTexte(BORNE_SERVEUR_S)).toBe('3:40');
    expect(habituelTexte('deep')).toBe('1:00–3:00');
    expect(habituelTexte('auto')).toBe('0:15–0:30');
  });
  it('plus long que d’habitude, puis proche de l’arrêt, puis plafonnée à 100 %', () => {
    expect(jaugeDuree('auto', 45).statut).toBe('plus long que d’habitude');
    expect(jaugeDuree('deep', 210).statut).toBe('proche de l’arrêt');
    expect(jaugeDuree('deep', 400).fait).toBe(100);
    expect(jaugeDuree('fast', 1).statut).toBe('en route');
  });
});

describe('compagnon · étapes de l’attente', () => {
  it('chaque étape serveur tombe sur une étape lisible, une reprise n’en dit rien', () => {
    expect(etapeIndex('context')).toBe(0);
    expect(etapeIndex('tools')).toBe(1);
    expect(etapeIndex('research')).toBe(2);
    expect(etapeIndex('repair')).toBe(3);
    expect(etapeIndex('retry')).toBe(-1);
  });
  it('les étapes avant la courante sont faites, la courante est rompue en cas d’échec', () => {
    expect(etatsEtapes(2)).toEqual(['fait', 'fait', 'en-cours', 'a-venir']);
    expect(etatsEtapes(1, true)).toEqual(['fait', 'rompu', 'a-venir', 'a-venir']);
  });
});

describe('compagnon · relecture sans nom de modèle', () => {
  const preuve = (n: number, p = 'a') => ({ id: 'e', name: 'x', label: 'x', facts: [], limits: [], data: null,
    sources: Array.from({ length: n }, (_, i) => ({ title: 't', url: `https://exemple.ch/${p}${i}` })) });
  it('relu deux fois + calculs refaits + 3 sources', () => {
    expect(libellesRelecture({ reviewed: true, reviewModel: 'un-modele-quelconque', evidence: [preuve(2), preuve(1, 'b')] }))
      .toEqual({ relu: 'relu deux fois', calculs: true, sources: 3 });
  });
  it('sans seconde passe : « relu » ; sans preuve : ni calculs ni sources ; non relu : rien', () => {
    expect(libellesRelecture({ reviewed: true, evidence: [] })).toEqual({ relu: 'relu', calculs: false, sources: 0 });
    expect(libellesRelecture({ reviewed: false, evidence: [] }).relu).toBeNull();
  });
  it('seules les sources https comptent, une même adresse une fois', () => {
    const e = { ...preuve(0), sources: [{ title: 'a', url: 'http://x.ch' }, { title: 'b', url: 'https://x.ch' }, { title: 'c', url: 'https://x.ch' }] };
    expect(libellesRelecture({ reviewed: true, evidence: [e] }).sources).toBe(1);
  });
  it('un texte serveur ne laisse passer aucun nom de modèle ni de fournisseur', () => {
    const sortie = sansNomDeModele('Gemini 3.1 Pro bloque ; vérifie la console AI Studio. Flash a répondu, Google aussi : Gemini-Flash.');
    expect(sortie).not.toMatch(/Gemini|Flash|Pro\b|AI Studio/);
    expect(sansNomDeModele('Aucun modèle ici.')).toBe('Aucun modèle ici.');
  });
});

describe('compagnon · statuts des conversations', () => {
  const j = (id: string, status: string, createdAt: number, extra = {}) => ({ scope: { kind: 'batch', id }, status, createdAt, ...extra });
  it('compte une conversation par portée, d’après sa dernière question', () => {
    const jobs = [j('a', 'error', 1), j('a', 'done', 5), j('b', 'running', 2), j('c', 'done', 3, { sendError: 'réseau' }), j('d', 'cancelled', 4)];
    expect(statutsConversations(jobs)).toEqual({ prets: 1, enCours: 1, echecs: 1 });
  });
  it('un brouillon et sa recette sont la même conversation', () => {
    const jobs = [{ scope: { kind: 'draft', id: 'r' }, status: 'done', createdAt: 1 }, { scope: { kind: 'recipe', id: 'r' }, status: 'running', createdAt: 2 }];
    expect(statutsConversations(jobs)).toEqual({ prets: 0, enCours: 1, echecs: 0 });
  });
});

describe('compagnon · budget du mois', () => {
  it('le budget repart le 1er décembre, dans 17 jours, le 14.11', () => {
    const r = renouvellement('2026-11', new Date(2026, 10, 14, 20, 59))!;
    expect(r.quand).toBe('le 1er décembre');
    expect(r.jours).toBe(17);
    expect(r.aujourdhui).toBe('auj. 14.11');
    expect(r.debut).toBe('1er nov.');
    expect(r.fin).toBe('30 nov.');
    expect(r.pct).toBeGreaterThan(40);
    expect(r.pct).toBeLessThan(50);
  });
  it('un mois illisible ne donne rien', () => {
    expect(renouvellement('novembre', new Date())).toBeNull();
    expect(renouvellement('2026-13', new Date())).toBeNull();
  });
  it('une limite inconnue ou nulle ne donne pas 0 %', () => {
    expect(partDe(4, 120)).toBeCloseTo(3.33, 2);
    expect(partDe(4, null)).toBeNull();
    expect(partDe(4, 0)).toBeNull();
    expect(partDe(500, 120)).toBe(100);
  });
  it('les codes de plafond du serveur', () => {
    expect(estPlafondAtteint('ai-monthly-limit')).toBe(true);
    expect(estPlafondAtteint('ai-paused')).toBe(false);
  });
});

describe('compagnon · mode conseillé', () => {
  it('achat, année et vérification en Approfondi ; court en Rapide ; le reste en Auto', () => {
    expect(modeConseille('Préparer un achat de matériel')).toBe('deep');
    expect(modeConseille('Vérifie les incohérences de mes opérations enregistrées.')).toBe('deep');
    expect(modeConseille('Densité : je mesure quand ?')).toBe('fast');
    expect(modeConseille('Galaxy : je garde 43 g, ou je change de houblon ?')).toBe('auto');
  });
});

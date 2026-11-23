import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import {
  ACTIONS_AJOUT,
  RELANCES_MAX,
  RELANCE_MS,
  acquitterFileActions,
  adresseSansAction,
  contenuAlerte,
  creerRappelAjout,
  idsAcocher,
  idsAjoutDepuis,
  lireActionUrl,
  lireFileActions,
  lireMessageSW,
  tagAjout,
  type AlerteAjout,
  type NotificationAjout
} from '../../src/services/brewNotifications';

// Le service worker testé est le vrai fichier ; SW_PATH sert à le rejouer sur la version d'avant (rouge).
const source = readFileSync(process.env.SW_PATH ?? 'public/brew-alerts-sw.js', 'utf8');
const T = (h: number, m: number) => new Date(2026, 10, 12, h, m).getTime();

/** IndexedDB minimal : une base, un magasin à clé automatique, ce que le service worker et la page emploient. */
function fauxIndexedDB() {
  const magasin = new Map<number, unknown>();
  let prochain = 1;
  let cree = false;
  const db = {
    createObjectStore: () => undefined,
    close: () => undefined,
    transaction: () => {
      const tx: Record<string, any> = {};
      let fini = false;
      const terminer = () => {
        if (fini) return;
        fini = true;
        setTimeout(() => tx.oncomplete?.(), 0);
      };
      tx.objectStore = () => ({
        add: (v: unknown) => {
          const k = prochain++;
          magasin.set(k, v);
          terminer();
          return { result: k };
        },
        delete: (k: number) => {
          magasin.delete(k);
          terminer();
        },
        openCursor: () => {
          const req: Record<string, any> = {};
          const cles = [...magasin.keys()];
          let i = 0;
          const pas = () => {
            if (i >= cles.length) {
              req.result = null;
              req.onsuccess?.();
              terminer();
              return;
            }
            const k = cles[i++];
            req.result = {
              key: k,
              value: magasin.get(k),
              delete: () => magasin.delete(k),
              continue: () => setTimeout(pas, 0)
            };
            req.onsuccess?.();
          };
          setTimeout(pas, 0);
          return req;
        }
      });
      return tx;
    }
  };
  return {
    magasin,
    indexedDB: {
      open: () => {
        const req: Record<string, any> = { result: db };
        setTimeout(() => {
          if (!cree) {
            cree = true;
            req.onupgradeneeded?.();
          }
          req.onsuccess?.();
        }, 0);
        return req;
      }
    }
  };
}

function worker(windows: any[] = [], idb = fauxIndexedDB()) {
  const handlers: Record<string, (event: any) => void> = {};
  const showNotification = vi.fn().mockResolvedValue(undefined),
    openWindow = vi.fn().mockResolvedValue({});
  const sandbox: Record<string, any> = {
    URL,
    indexedDB: idb.indexedDB,
    clients: { matchAll: async () => windows, openWindow, claim: vi.fn() },
    self: {
      addEventListener: (name: string, fn: any) => {
        handlers[name] = fn;
      },
      registration: { showNotification },
      location: { origin: 'https://brew.example' },
      skipWaiting: vi.fn()
    }
  };
  runInNewContext(source, sandbox);
  const run = async (name: string, value: any) => {
    let promise;
    handlers[name]({
      ...value,
      waitUntil: (p: Promise<unknown>) => {
        promise = p;
      }
    });
    await promise;
  };
  const push = (data: Record<string, unknown>) =>
    run('push', { data: { json: () => ({ data: { title: 'Citra 25 g · en retard de 4 min', batchId: 'LOT-A', at: '123', ...data } }) } });
  const clic = (action: string | undefined, data: unknown) =>
    run('notificationclick', { action, notification: { close: vi.fn(), data } });
  return { sandbox, push, clic, showNotification, openWindow, idb };
}
const fenetre = () => ({ url: 'https://brew.example/', focus: vi.fn(), postMessage: vi.fn() });

describe('F1 — identifier un ajout (page et service worker d\'accord)', () => {
  const cas: Array<[unknown, unknown, string[]]> = [
    [undefined, 'add-hop-0', ['hop-0']],
    [undefined, 'add-hop-0-hop-1', ['hop-0', 'hop-1']],
    [undefined, 'add-grain-2-hop-10', ['grain-2', 'hop-10']],
    [undefined, 'add-hop-0-', []],
    [undefined, 'add-salt-calcium', []], // id à tiret quelconque : ambigu, refusé
    [undefined, 'add-hop-', []],
    [undefined, '3fa9c0d2e1b4a7c8', []], // le tag actuel du serveur est un condensé : rien d'identifié
    [undefined, undefined, []],
    [['hop-0', 'grain-1'], 'ignoré', ['hop-0', 'grain-1']],
    ['["hop-0","salt-calcium"]', undefined, ['hop-0', 'salt-calcium']], // la liste explicite du serveur lève l'ambiguïté
    [['hop-0', 12], undefined, []], // une entrée fausse annule tout
    [['hop 0'], undefined, []],
    ['pas du json', 'add-hop-0', ['hop-0']],
    [[], 'add-hop-0', []]
  ];
  it.each(cas)('additionIds=%j tag=%j → %j', (ids, tag, attendu) => {
    expect(idsAjoutDepuis(ids, tag)).toEqual(attendu);
    const w = worker();
    expect(w.sandbox.brewAdditionIds(ids, tag)).toEqual(attendu);
  });
  it('le tag de la page est celui que le serveur forme', () => {
    expect(tagAjout(['hop-0', 'hop-1'])).toBe('add-hop-0-hop-1');
    expect(idsAjoutDepuis(undefined, tagAjout(['grain-0', 'hop-3']))).toEqual(['grain-0', 'hop-3']);
  });
  it('idsAcocher laisse un ajout déjà coché à son heure', () => {
    expect(idsAcocher(['hop-0', 'hop-1'], { 'hop-0': { doneAt: 5 }, 'hop-1': {} })).toEqual(['hop-1']);
    expect(idsAcocher(['hop-0'], undefined)).toEqual(['hop-0']);
  });
});

describe('F1 — le service worker pose la notification', () => {
  it('« Ajouté » seulement avec un ajout identifié ; jamais « +1 min » sans quelqu\'un pour reporter', async () => {
    const w = worker();
    await w.push({ kind: 'ajout', tag: 'add-hop-0', additionIds: '["hop-0"]' });
    const [titre, o] = w.showNotification.mock.calls[0];
    expect(titre).toBe('Citra 25 g · en retard de 4 min');
    expect(o.actions).toEqual([{ action: 'ajoute', title: 'Ajouté' }]);
    expect(o.data).toEqual({ batchId: 'LOT-A', additionIds: ['hop-0'], tag: 'add-hop-0' });
    expect(o.renotify).toBe(true);
    expect(o.requireInteraction).toBe(true);
  });
  it('« +1 min » quand le serveur sait reporter (snooze), « Ouvrir » étant le corps', async () => {
    const w = worker();
    await w.push({ kind: 'ajout', tag: 'add-hop-0', snooze: 'true' });
    expect(w.showNotification.mock.calls[0][1].actions).toEqual([
      { action: 'ajoute', title: 'Ajouté' },
      { action: 'plus1', title: '+1 min' }
    ]);
  });
  it('sans ajout identifié : ni « Ajouté », ni liste d\'ids ; la notification d\'aujourd\'hui reste telle quelle', async () => {
    const w = worker();
    await w.push({ title: 'Ajout en cuve', tag: 'condensé-opaque' });
    const o = w.showNotification.mock.calls[0][1];
    expect(o.actions).toBeUndefined();
    expect(o.data).toEqual({ batchId: 'LOT-A' });
    expect(o.renotify).toBe(false);
  });
  it('au plus 2 actions (Chrome), même si le serveur en demandait davantage', async () => {
    const w = worker();
    await w.push({ kind: 'ajout', tag: 'add-hop-0', snooze: true });
    expect(w.showNotification.mock.calls[0][1].actions.length).toBeLessThanOrEqual(2);
  });
});

describe('F1 — le service worker reçoit un toucher', () => {
  const data = { batchId: 'LOT-A', additionIds: ['hop-0', 'hop-1'], tag: 'add-hop-0-hop-1' };
  it('« Ajouté », page ouverte : message avec l\'heure du toucher, écrit aussi dans la file', async () => {
    const app = fenetre();
    const w = worker([app]);
    const avant = Date.now();
    await w.clic('ajoute', data);
    const apres = Date.now();
    expect(app.focus).toHaveBeenCalled();
    const [msg] = app.postMessage.mock.calls[0];
    expect(msg).toMatchObject({ kind: 'brew-ajoute', batchId: 'LOT-A', additionIds: ['hop-0', 'hop-1'], key: 1 });
    expect(msg.at).toBeGreaterThanOrEqual(avant);
    expect(msg.at).toBeLessThanOrEqual(apres);
    expect(w.openWindow).not.toHaveBeenCalled();
    expect([...w.idb.magasin.values()]).toEqual([
      { kind: 'ajoute', batchId: 'LOT-A', additionIds: ['hop-0', 'hop-1'], at: msg.at }
    ]);
  });
  it('« Ajouté », appli fermée : ouvre avec l\'heure du toucher et garde le toucher dans la file', async () => {
    const w = worker();
    await w.clic('ajoute', data);
    const url = new URL(w.openWindow.mock.calls[0][0]);
    expect(url.origin).toBe('https://brew.example');
    expect(url.searchParams.get('brewday')).toBe('LOT-A');
    expect(url.searchParams.get('ajoute')).toBe('hop-0,hop-1');
    expect(url.searchParams.get('a')).toMatch(/^\d{13}$/);
    expect(w.idb.magasin.size).toBe(1);
  });
  it('sans ajout identifié, « Ajouté » ne coche rien : il ouvre seulement', async () => {
    const w = worker();
    await w.clic('ajoute', { batchId: 'LOT-A' });
    expect(w.openWindow).toHaveBeenCalledWith('https://brew.example/?brewday=LOT-A');
    expect(w.idb.magasin.size).toBe(0);
    const app = fenetre();
    const w2 = worker([app]);
    await w2.clic('ajoute', { batchId: 'LOT-A', additionIds: ['salt calcium'] });
    expect(app.postMessage).not.toHaveBeenCalled();
    expect(w2.idb.magasin.size).toBe(0);
  });
  it('une action inconnue, ou aucune, ouvre seulement', async () => {
    for (const action of ['pizza', '', undefined]) {
      const app = fenetre();
      const w = worker([app]);
      await w.clic(action, data);
      expect(app.postMessage).not.toHaveBeenCalled();
      expect(w.idb.magasin.size).toBe(0);
      expect(w.openWindow).toHaveBeenCalledWith('https://brew.example/?brewday=LOT-A');
    }
  });
  it('« +1 min » : la page ouverte le tient ; appli fermée il ouvre seulement, sans rien promettre', async () => {
    const app = fenetre();
    const w = worker([app]);
    await w.clic('plus1', data);
    expect(app.postMessage).toHaveBeenCalledWith(expect.objectContaining({ kind: 'brew-report', batchId: 'LOT-A', tag: 'add-hop-0-hop-1', minutes: 1 }));
    expect(w.idb.magasin.size).toBe(0);
    const ferme = worker();
    await ferme.clic('plus1', data);
    expect(ferme.openWindow).toHaveBeenCalledWith('https://brew.example/?brewday=LOT-A');
  });
  it('une notification sans données ne lève rien', async () => {
    const w = worker();
    await expect(w.clic('ajoute', undefined)).resolves.toBeUndefined();
    expect(w.openWindow).not.toHaveBeenCalled();
  });
});

describe('F1 — le texte de la notification (mots de p2c)', () => {
  const alerte: AlerteAjout = {
    batchId: 'LOT-A',
    additionIds: ['hop-0'],
    libelle: 'Citra 25 g',
    detail: '8 Ébullition · ajout 5′',
    dueAt: T(14, 33),
    ensuite: 'Amarillo 43 g · coupure du feu 14 h 38'
  };
  it('« Citra 25 g · en retard de 4 min » et le corps en deux lignes', () => {
    const n = contenuAlerte(alerte, T(14, 37));
    expect(n.title).toBe('Citra 25 g · en retard de 4 min');
    expect(n.options.body).toBe('8 Ébullition · ajout 5′, dû à 14 h 33\nensuite Amarillo 43 g · coupure du feu 14 h 38');
    expect(n.options.actions).toEqual(ACTIONS_AJOUT);
    expect(n.options.actions.map((a) => a.title)).toEqual(['Ajouté', '+1 min']);
    expect(n.options.tag).toBe('add-hop-0');
    expect(n.options.data).toEqual({ batchId: 'LOT-A', additionIds: ['hop-0'], tag: 'add-hop-0', dueAt: T(14, 33) });
    expect(n.options.requireInteraction).toBe(true);
  });
  it('sous la minute « maintenant » ; sans « ensuite » une seule ligne ; au-delà d\'une heure en h', () => {
    expect(contenuAlerte({ ...alerte, ensuite: undefined }, T(14, 33) + 20000)).toMatchObject({
      title: 'Citra 25 g · maintenant',
      options: { body: '8 Ébullition · ajout 5′, dû à 14 h 33' }
    });
    expect(contenuAlerte(alerte, T(15, 38)).title).toBe('Citra 25 g · en retard de 1 h 05');
  });
  it('le texte et la donnée du clic disent le même tag que le service worker lira', () => {
    const n = contenuAlerte({ ...alerte, additionIds: ['hop-0', 'grain-1'] }, T(14, 34));
    expect(idsAjoutDepuis(undefined, n.options.tag)).toEqual(['hop-0', 'grain-1']);
  });
});

describe('F1 — sonnerie, relance et report quand la page tourne', () => {
  const alerte: AlerteAjout = { batchId: 'LOT-A', additionIds: ['hop-0'], libelle: 'Citra 25 g', detail: '8 Ébullition · ajout 5′', dueAt: T(14, 33) };
  function banc(debut: number) {
    let now = debut;
    const files: Array<{ at: number; fn: () => void; id: number }> = [];
    let n = 0;
    const montrees: NotificationAjout[] = [];
    const fermees: string[] = [];
    const r = creerRappelAjout({
      now: () => now,
      show: (s) => void montrees.push(s),
      close: (t) => void fermees.push(t),
      setTimer: (fn, ms) => {
        const id = ++n;
        files.push({ at: now + ms, fn, id });
        return id;
      },
      clearTimer: (h) => {
        const i = files.findIndex((f) => f.id === h);
        if (i >= 0) files.splice(i, 1);
      }
    });
    const avancer = (ms: number) => {
      const fin = now + ms;
      for (;;) {
        files.sort((a, b) => a.at - b.at);
        const f = files[0];
        if (!f || f.at > fin) break;
        files.shift();
        now = f.at;
        f.fn();
      }
      now = fin;
    };
    return { r, montrees, fermees, avancer, files };
  }
  it('pose à l\'heure, puis chaque minute, le retard dit juste', () => {
    const b = banc(T(14, 30));
    expect(b.r.start(alerte)).toBe('add-hop-0');
    b.avancer(3 * 60000 - 1);
    expect(b.montrees).toHaveLength(0);
    b.avancer(1);
    expect(b.montrees.map((m) => m.title)).toEqual(['Citra 25 g · maintenant']);
    b.avancer(RELANCE_MS * 4);
    expect(b.montrees.map((m) => m.title).slice(1)).toEqual([
      'Citra 25 g · en retard de 1 min',
      'Citra 25 g · en retard de 2 min',
      'Citra 25 g · en retard de 3 min',
      'Citra 25 g · en retard de 4 min'
    ]);
  });
  it('s\'arrête quand l\'ajout est coché et retire la notification', () => {
    const b = banc(T(14, 34));
    b.r.start(alerte);
    b.avancer(1);
    expect(b.montrees).toHaveLength(1);
    b.r.done('add-hop-0');
    expect(b.fermees).toEqual(['add-hop-0']);
    b.avancer(RELANCE_MS * 5);
    expect(b.montrees).toHaveLength(1);
    expect(b.r.tags()).toEqual([]);
  });
  it('« +1 min » ferme, puis revient une minute après le toucher (retard compté depuis l\'heure prévue)', () => {
    const b = banc(T(14, 34));
    b.r.start(alerte);
    b.avancer(1);
    b.avancer(30_000);
    b.r.snooze('add-hop-0');
    expect(b.fermees).toEqual(['add-hop-0']);
    b.avancer(59_999);
    expect(b.montrees).toHaveLength(1);
    b.avancer(1);
    expect(b.montrees).toHaveLength(2);
    expect(b.montrees[1].title).toBe('Citra 25 g · en retard de 2 min');
  });
  it('dix relances au plus ; un report repart à zéro ; un tag inconnu ne fait rien', () => {
    const b = banc(T(14, 33));
    b.r.start(alerte);
    b.avancer(RELANCE_MS * 40);
    expect(b.montrees).toHaveLength(RELANCES_MAX);
    b.r.snooze('add-inconnu');
    b.r.done('add-inconnu');
    expect(b.fermees).toEqual([]);
    b.r.snooze('add-hop-0', 2);
    b.avancer(2 * 60000);
    expect(b.montrees).toHaveLength(RELANCES_MAX + 1);
  });
  it('sans heure connue ou sans ajout identifié : rien ne se planifie (l\'inconnu n\'est pas zéro)', () => {
    const b = banc(T(14, 30));
    expect(b.r.start({ ...alerte, dueAt: NaN })).toBeNull();
    expect(b.r.start({ ...alerte, additionIds: [] })).toBeNull();
    expect(b.files).toHaveLength(0);
  });
  it('relancer le même ajout (dose changée) remplace le suivi, il ne le double pas', () => {
    const b = banc(T(14, 30));
    b.r.start(alerte);
    b.r.start({ ...alerte, libelle: 'Citra 30 g' });
    expect(b.files).toHaveLength(1);
    b.avancer(3 * 60000);
    expect(b.montrees.map((m) => m.title)).toEqual(['Citra 30 g · maintenant']);
  });
});

describe('F1 — ce que la page lit du service worker', () => {
  const now = T(14, 40);
  it('un message « Ajouté » valide garde l\'heure du toucher', () => {
    expect(lireMessageSW({ kind: 'brew-ajoute', batchId: 'LOT-A', additionIds: ['hop-0'], at: T(14, 37), key: 4 }, now)).toEqual({
      kind: 'ajoute', batchId: 'LOT-A', additionIds: ['hop-0'], at: T(14, 37), key: 4
    });
  });
  it('rejette un message inconnu, sans ajout, sans lot ou à l\'heure fausse', () => {
    for (const m of [
      null, 'x', {}, { kind: 'open-companion' },
      { kind: 'brew-ajoute', batchId: 'LOT-A', additionIds: [], at: T(14, 37) },
      { kind: 'brew-ajoute', batchId: '', additionIds: ['hop-0'], at: T(14, 37) },
      { kind: 'brew-ajoute', batchId: 'LOT-A', additionIds: ['hop-0'], at: now + 3600_000 },
      { kind: 'brew-ajoute', batchId: 'LOT-A', additionIds: ['hop-0'], at: 'hier' },
      { kind: 'brew-ajoute', batchId: 'LOT-A', additionIds: ['hop-0'] },
      { kind: 'brew-report', batchId: 'LOT-A', at: T(14, 37) },
      { kind: 'inconnu', batchId: 'LOT-A', at: T(14, 37) }
    ])
      expect(lireMessageSW(m, now)).toBeNull();
  });
  it('un report de 1 min', () => {
    expect(lireMessageSW({ kind: 'brew-report', batchId: 'LOT-A', tag: 'add-hop-0', minutes: 1, at: T(14, 37) }, now)).toEqual({
      kind: 'report', batchId: 'LOT-A', tag: 'add-hop-0', minutes: 1, at: T(14, 37)
    });
    expect(lireMessageSW({ kind: 'brew-report', batchId: 'LOT-A', tag: 'add-hop-0', minutes: 9999, at: T(14, 37) }, now)).toMatchObject({ minutes: 1 });
  });
  it('l\'adresse : ids, heure du toucher ; heure fausse → null, jamais 0', () => {
    expect(lireActionUrl(`?brewday=LOT-A&ajoute=hop-0%2Chop-1&a=${T(14, 37)}`, now)).toEqual({
      batchId: 'LOT-A', additionIds: ['hop-0', 'hop-1'], at: T(14, 37)
    });
    expect(lireActionUrl('?brewday=LOT-A&ajoute=hop-0&a=0', now)?.at).toBeNull();
    expect(lireActionUrl(`?brewday=LOT-A&ajoute=hop-0&a=${now + 9e6}`, now)?.at).toBeNull();
    expect(lireActionUrl('?brewday=LOT-A&ajoute=hop-0', now)?.at).toBeNull();
    expect(lireActionUrl('?brewday=LOT-A', now)).toBeNull();
    expect(lireActionUrl('?ajoute=hop-0', now)).toBeNull();
    expect(lireActionUrl('?brewday=LOT-A&ajoute=%3Cscript%3E', now)).toBeNull();
  });
  it('retire ajoute et a de l\'adresse, garde le reste', () => {
    expect(adresseSansAction('?brewday=LOT-A&ajoute=hop-0&a=1700000000000')).toBe('?brewday=LOT-A');
    expect(adresseSansAction('?ajoute=hop-0&a=1')).toBe('');
  });
});

describe('F1 — la file des touchers reçus appli fermée', () => {
  beforeEach(() => {
    (globalThis as any).indexedDB = undefined;
  });
  it('le service worker écrit, la page lit l\'heure du toucher puis acquitte', async () => {
    const idb = fauxIndexedDB();
    (globalThis as any).indexedDB = idb.indexedDB;
    const w = worker([], idb);
    await w.clic('ajoute', { batchId: 'LOT-A', additionIds: ['hop-0'], tag: 'add-hop-0' });
    const lus = await lireFileActions();
    expect(lus).toHaveLength(1);
    expect(lus[0]).toMatchObject({ batchId: 'LOT-A', additionIds: ['hop-0'] });
    expect(Math.abs(lus[0].at - Date.now())).toBeLessThan(5000);
    expect(idb.magasin.size).toBe(1); // lire n'efface pas : la page acquitte quand elle a coché
    await acquitterFileActions(lus.map((l) => l.key));
    expect(idb.magasin.size).toBe(0);
    expect(await lireFileActions()).toEqual([]);
  });
  it('retire sans l\'appliquer un toucher vieux de plus de 48 h ou mal formé', async () => {
    const idb = fauxIndexedDB();
    (globalThis as any).indexedDB = idb.indexedDB;
    idb.magasin.set(1, { kind: 'ajoute', batchId: 'LOT-A', additionIds: ['hop-0'], at: Date.now() - 49 * 3600_000 });
    idb.magasin.set(2, { kind: 'ajoute', batchId: 'LOT-A', additionIds: [], at: Date.now() });
    idb.magasin.set(3, { kind: 'ajoute', batchId: 'LOT-A', additionIds: ['hop-1'], at: Date.now() - 60_000 });
    const lus = await lireFileActions();
    expect(lus.map((l) => l.additionIds)).toEqual([['hop-1']]);
    expect([...idb.magasin.keys()]).toEqual([3]);
  });
  it('sans IndexedDB : liste vide, pas d\'exception', async () => {
    expect(await lireFileActions()).toEqual([]);
    await expect(acquitterFileActions([1])).resolves.toBeUndefined();
  });
});

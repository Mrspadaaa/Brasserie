// @vitest-environment jsdom
// D451 (voie probleme) : le carnet ouvert recomposé (en-tête du genre, barre d'état, options, fil, Résolu, Relecture) sur la fixture du suivi (tout est exemple)
// et sur des cas neufs (fête, assurance, chambre froide). Les gestes appellent les rappels ; rien n'est écrit ici (le domaine est testé ailleurs).
import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CarnetOuvert } from '../../src/ui/carnets/CarnetOuvert';
import { RelectureResolus } from '../../src/ui/carnets/RelectureResolus';
import type { CarnetOuvertProps, RappelsSuivi } from '../../src/ui/carnets/carnetOuvertTypes';
import { AIDES_ETEINTES, type CarnetV } from '../../src/ui/carnets/EtatIA';
import { fixtureSuivi, IDS_SUIVI, OPTIONS_VAPEUR } from '../../src/domain/carnets/fixture';
import { lireCarnets, lireMessage, type CarnetDoc, type MessageDoc } from '../../src/domain/carnets/modele';
import { appliquerEcritures } from '../../src/domain/carnets/operations';
import { fermerParAchat } from '../../src/domain/carnets/suivi';

afterEach(cleanup);

const monde = (items = fixtureSuivi()) => ({ carnets: lireCarnets(items), messages: items.map(lireMessage).filter((m): m is MessageDoc => !!m) });
const resolu = () => {
  const items = fixtureSuivi();
  const r = fermerParAchat(items, { carnetId: IDS_SUIVI.vapeur, le: '2026-11-30T09:00:00.000Z', optionId: OPTIONS_VAPEUR.condB });
  if (!r.ok) throw new Error(r.raison);
  return monde(appliquerEcritures(items, r.ecritures));
};
const props = (m: ReturnType<typeof monde>, id: string, x: Partial<CarnetOuvertProps> = {}): CarnetOuvertProps => ({
  carnet: m.carnets.find(c => c.id === id) as unknown as CarnetV, aides: AIDES_ETEINTES, liens: [], tableau: null, messages: m.messages, carnetsDocs: m.carnets, aujourdhui: '2026-11-24',
  onRetour: vi.fn(), onRenommer: vi.fn(), onSupprimer: vi.fn(), onNote: vi.fn(), onOuvrirArticle: vi.fn(), onComparer: vi.fn(), ...x
});

describe('un problème (Décidé) : barre d\'état, options, fil', () => {
  it('la barre dit les quatre états, l\'actif est écrit ; chaque état se touche dans les deux sens', () => {
    const onEtat = vi.fn();
    render(<CarnetOuvert {...props(monde(), IDS_SUIVI.vapeur, { rappels: { onEtat } })} />);
    const barre = screen.getByRole('group', { name: 'État : Décidé' });
    const mots = within(barre).getAllByRole('button').map(b => b.textContent);
    expect(mots).toEqual(['Noté', 'Je cherche', 'Décidé', 'Résolu']);
    expect(within(barre).getByRole('button', { name: 'Décidé' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(within(barre).getByRole('button', { name: 'Noté' }));
    expect(onEtat).toHaveBeenLastCalledWith('note');
    fireEvent.click(within(barre).getByRole('button', { name: 'Résolu' }));
    expect(onEtat).toHaveBeenLastCalledWith('resolu');
    fireEvent.click(within(barre).getByRole('button', { name: 'Décidé' })); /* déjà là : rien */
    expect(onEtat).toHaveBeenCalledTimes(2);
  });
  it('sans rappel, la barre se lit seulement (aucun bouton qui ne fait rien)', () => {
    render(<CarnetOuvert {...props(monde(), IDS_SUIVI.vapeur)} />);
    expect(within(screen.getByRole('group', { name: 'État : Décidé' })).queryAllByRole('button')).toHaveLength(0);
  });
  it('les options en deux colonnes, noms entiers, un jeton d\'état chacune', () => {
    render(<CarnetOuvert {...props(monde(), IDS_SUIVI.vapeur, { rappels: { onOption: vi.fn() } })} />);
    const grille = screen.getByRole('region', { name: 'Options' });
    expect(within(grille).getAllByRole('listitem')).toHaveLength(4);
    for (const nom of ['Condenseur B', 'Condenseur A', 'Hotte + extracteur', 'Humidificateur']) expect(within(grille).getByText(nom)).toBeTruthy();
    const css = document.querySelector('.cnp-opt-grille') as HTMLElement;
    expect(css.className).toBe('cnp-opt-grille');
  });
  it('un geste d\'option : retenir, piste, veille, et écarter avec sa raison', () => {
    const onOption = vi.fn();
    render(<CarnetOuvert {...props(monde(), IDS_SUIVI.vapeur, { rappels: { onOption } })} />);
    fireEvent.click(screen.getByRole('button', { name: /Condenseur A, piste, changer/ }));
    const gestes = screen.getByRole('group', { name: 'Condenseur A : changer l\'état' });
    fireEvent.click(within(gestes).getByRole('button', { name: 'Retenir' }));
    expect(onOption).toHaveBeenLastCalledWith(OPTIONS_VAPEUR.condA, 'retenue');
    fireEvent.click(screen.getByRole('button', { name: /Hotte \+ extracteur, piste, changer/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Veille' }));
    expect(onOption).toHaveBeenLastCalledWith(OPTIONS_VAPEUR.hotte, 'veille');
    /* (les rappels ne changent pas l'état ici : la case reste « piste » ; le panneau s'est refermé, on le rouvre) */
    fireEvent.click(screen.getByRole('button', { name: /Hotte \+ extracteur, piste, changer/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Écarter' }));
    fireEvent.change(screen.getByLabelText('Raison de l\'écart'), { target: { value: 'trop cher' } });
    fireEvent.click(screen.getByRole('button', { name: /Écarter/ }));
    expect(onOption).toHaveBeenLastCalledWith(OPTIONS_VAPEUR.hotte, 'ecartee', 'trop cher');
  });
  it('écarter sans raison : la raison est absente (jamais une chaîne vide)', () => {
    const onOption = vi.fn();
    render(<CarnetOuvert {...props(monde(), IDS_SUIVI.vapeur, { rappels: { onOption } })} />);
    fireEvent.click(screen.getByRole('button', { name: /Condenseur A, piste, changer/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Écarter' }));
    fireEvent.click(screen.getByRole('button', { name: /Écarter/ }));
    expect(onOption).toHaveBeenLastCalledWith(OPTIONS_VAPEUR.condA, 'ecartee', undefined);
  });
  it('le fil : le jour en pastille, ses bulles, le repli des plus anciennes, « écarté, 2e fois »', () => {
    render(<CarnetOuvert {...props(monde(), IDS_SUIVI.vapeur)} />);
    const fil = screen.getByRole('log', { name: 'Fil du carnet' });
    expect(within(fil).getByText('▴ 3 notes du 3 au 6 nov.')).toBeTruthy();
    expect(within(fil).getByText('8 nov.')).toBeTruthy();
    expect(within(fil).getByText('20 – 22 nov.')).toBeTruthy();
    expect(within(fil).getByText('Humidificateur écarté, 2e fois')).toBeTruthy();
    fireEvent.click(within(fil).getByRole('button', { name: /▴ 3 notes/ }));
    expect(within(fil).getByText(/Trop de buée au plafond/)).toBeTruthy(); /* les anciennes se déplient */
  });
  it('la question honnête : rien à dire quand ses notes disent pourquoi ; sinon « Pourquoi B plutôt que A ? · Ajouter »', () => {
    const m = monde();
    const { unmount } = render(<CarnetOuvert {...props(m, IDS_SUIVI.vapeur, { rappels: { onEcrire: vi.fn() } })} />);
    expect(screen.queryByText(/Tes notes ne le disent pas/)).toBeNull();
    unmount();
    const onEcrire = vi.fn();
    render(<CarnetOuvert {...props({ ...m, messages: [] }, IDS_SUIVI.vapeur, { rappels: { onEcrire } })} />);
    expect(screen.getByText('Pourquoi B plutôt que A ?')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }));
    expect(onEcrire).toHaveBeenCalledWith('Pourquoi B plutôt que A : ');
  });
  it('rien de ce qui disparaît : pas de crayon, pas de « votre lien », pas de « Quand » pour un problème sans date', () => {
    const m = monde();
    render(<CarnetOuvert {...props(m, IDS_SUIVI.vapeur, { onDater: vi.fn() })} />);
    expect(screen.queryByRole('button', { name: 'Renommer' })).toBeNull(); /* le crayon du titre (D451 n° 6) */
    expect(screen.queryByText(/^Quand$/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Plus' }));
    expect(screen.getByRole('menuitem', { name: /Renommer/ })).toBeTruthy(); /* « Renommer » reste au menu ⋯ : aucun geste perdu */
  });
  it('« Articles · collez un lien » ne paraît pas pour un problème sans article', () => {
    render(<CarnetOuvert {...props(monde(), IDS_SUIVI.co2)} />);
    expect(screen.queryByText(/collez un lien/)).toBeNull();
  });
  it('un jeton posé par l\'IA se retire en deux touchers (« Retirer ») ; un jeton écrit par lui ne se retire pas', () => {
    const onRetirerEtiquette = vi.fn();
    render(<CarnetOuvert {...props(monde(), IDS_SUIVI.vapeur, { rappels: { onRetirerEtiquette } })} />);
    const jeton = screen.getAllByRole('button', { name: /^Jeton « 690 CHF »/ })[0];
    fireEvent.click(jeton);
    expect(onRetirerEtiquette).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Retirer le jeton « 690 CHF »/ }));
    expect(onRetirerEtiquette).toHaveBeenCalledWith('ZZ-SV-M4', 1);
  });
  it('« Fermer grâce à l\'achat ? » : seulement si le plan est payé ; Oui appelle le rappel, Annuler la remet à plus tard', () => {
    const m = monde();
    const { unmount } = render(<CarnetOuvert {...props(m, IDS_SUIVI.vapeur, { rappels: { onFermerParAchat: vi.fn() } })} />);
    expect(screen.queryByRole('group', { name: /Fermer grâce à l'achat/ })).toBeNull();
    unmount();
    const payee = { ...m.carnets.find(c => c.id === IDS_SUIVI.vapeur)!, carnet: { ...m.carnets.find(c => c.id === IDS_SUIVI.vapeur)!.carnet, sortie: { le: '2026-11-20T10:00:00.000Z', etat: 'realise' } } } as unknown as CarnetV;
    const onFermerParAchat = vi.fn();
    render(<CarnetOuvert {...props(m, IDS_SUIVI.vapeur, { carnet: payee, rappels: { onFermerParAchat } })} />);
    const carte = screen.getByRole('group', { name: /Fermer grâce à l'achat/ });
    expect(carte.textContent).toContain('de « Condenseur B »');
    fireEvent.click(within(carte).getByRole('button', { name: 'Annuler' }));
    expect(screen.queryByRole('group', { name: /Fermer grâce à l'achat/ })).toBeNull();
    expect(onFermerParAchat).not.toHaveBeenCalled();
  });
  it('« Oui » ferme par l\'option achetée', () => {
    const m = monde();
    const payee = { ...m.carnets.find(c => c.id === IDS_SUIVI.vapeur)!, carnet: { ...m.carnets.find(c => c.id === IDS_SUIVI.vapeur)!.carnet, sortie: { le: '2026-11-20T10:00:00.000Z', etat: 'realise' } } } as unknown as CarnetV;
    const onFermerParAchat = vi.fn();
    render(<CarnetOuvert {...props(m, IDS_SUIVI.vapeur, { carnet: payee, rappels: { onFermerParAchat } })} />);
    fireEvent.click(within(screen.getByRole('group', { name: /Fermer grâce à l'achat/ })).getByRole('button', { name: 'Oui' }));
    expect(onFermerParAchat).toHaveBeenCalledWith(OPTIONS_VAPEUR.condB);
  });
});

describe('Je cherche : la rangée de jetons, la carte « tâche proposée »', () => {
  it('« trouvé 2 · pas trouvé 2 · devis 850 · ≈ 910 CHF » sur une rangée ; rien à 0', () => {
    render(<CarnetOuvert {...props(monde(), IDS_SUIVI.ecoulement)} />);
    const rangee = screen.getByRole('group', { name: 'Où en est le diagnostic' });
    expect(rangee.textContent).toMatch(/trouvé 2/);
    expect(rangee.textContent).toMatch(/pas trouvé 2/);
    expect(rangee.textContent).toMatch(/devis 850/);
    expect(rangee.textContent).toMatch(/≈ 910 CHF/);
    expect(rangee.textContent).not.toMatch(/ 0\b/);
  });
  it('un problème décidé ou noté sans diagnostic : pas de rangée', () => {
    render(<CarnetOuvert {...props(monde(), IDS_SUIVI.vapeur)} />);
    expect(screen.queryByRole('group', { name: 'Où en est le diagnostic' })).toBeNull();
  });
  it('une carte « tâche proposée » : À faire, Plus tard, et Non d\'un toucher ; rien n\'est écrit sans le geste', () => {
    const m = monde();
    const proposee: MessageDoc = JSON.parse(JSON.stringify(m.messages.find(x => x.id === 'ZZ-SE-M5')));
    proposee.carnetMessage.propositionsSuivi = [{ sorte: 'tache', carnetId: IDS_SUIVI.ecoulement, texte: 'Répondre au devis de l\'entreprise X', origine: 'ia' }];
    const onProposition = vi.fn();
    render(<CarnetOuvert {...props({ ...m, messages: [...m.messages.filter(x => x.id !== 'ZZ-SE-M5'), proposee] }, IDS_SUIVI.ecoulement, { rappels: { onProposition } })} />);
    const carte = screen.getByRole('group', { name: 'tâche proposée' });
    expect(carte.textContent).toContain('Répondre au devis de l\'entreprise X');
    fireEvent.click(within(carte).getByRole('button', { name: 'À faire' }));
    expect(onProposition).toHaveBeenLastCalledWith('ZZ-SE-M5', 0, 'ok');
    fireEvent.click(within(carte).getByRole('button', { name: 'Plus tard' }));
    expect(onProposition).toHaveBeenLastCalledWith('ZZ-SE-M5', 0, 'plus-tard');
    fireEvent.click(within(carte).getByRole('button', { name: /Non, écarter/ }));
    expect(onProposition).toHaveBeenLastCalledWith('ZZ-SE-M5', 0, 'non');
  });
  it('une carte « Rattacher à … ? » dit le carnet visé et s\'annule d\'un toucher', () => {
    const m = monde();
    const msg: MessageDoc = JSON.parse(JSON.stringify(m.messages.find(x => x.id === 'ZZ-SE-M2')));
    msg.carnetMessage.propositionsSuivi = [{ sorte: 'deplacer', carnetId: IDS_SUIVI.ecoulement, versCarnetId: IDS_SUIVI.fusible, origine: 'locale' }];
    const onProposition = vi.fn();
    render(<CarnetOuvert {...props({ ...m, messages: [...m.messages.filter(x => x.id !== 'ZZ-SE-M2'), msg] }, IDS_SUIVI.ecoulement, { rappels: { onProposition }, carnetsVers: [{ id: IDS_SUIVI.fusible, titre: 'Fusible du tableau' }] })} />);
    const carte = screen.getByRole('group', { name: 'ailleurs ?' });
    expect(carte.textContent).toContain('Rattacher à Fusible du tableau ?');
    fireEvent.click(within(carte).getByRole('button', { name: 'Non' }));
    expect(onProposition).toHaveBeenCalledWith('ZZ-SE-M2', 0, 'non');
  });
  it('une veille dit « demandée · pas encore relevée » : aucune relève n\'est inventée', () => {
    render(<CarnetOuvert {...props(monde(), IDS_SUIVI.vapeur)} />);
    expect(screen.getAllByText(/veille demandée/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/pas encore relevée/).length).toBeGreaterThan(0);
  });
});

describe('les autres genres et les carnets anciens', () => {
  it('un mémo (assurance) : la puce du genre, pas de barre d\'état ; ses options en grille', () => {
    render(<CarnetOuvert {...props(monde(), IDS_SUIVI.assurance)} />);
    expect(screen.queryByRole('group', { name: /^État/ })).toBeNull();
    expect(screen.getByText('mémo')).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Options' })).toBeTruthy();
  });
  it('une idée (fête) : la puce « idée », « Quand » reste proposé pour une idée', () => {
    render(<CarnetOuvert {...props(monde(), IDS_SUIVI.fete, { onDater: vi.fn() })} />);
    expect(screen.getByText('idée')).toBeTruthy();
  });
  it('un carnet ancien (sans genre posé) garde son en-tête : « ‹ Carnets », sa pastille d\'état ; ni crayon ni citation de lien', () => {
    const m = monde();
    render(<CarnetOuvert {...props(m, IDS_SUIVI.chambreFroide)} />);
    expect(screen.getByRole('button', { name: /Carnets/ }).textContent).toMatch(/Carnets/);
    expect(screen.queryByRole('button', { name: 'Renommer' })).toBeNull();
    expect(screen.queryByRole('group', { name: /^État/ })).toBeNull();
  });
  it('une phrase qui est un lien seul n\'est plus citée « votre lien : « https://… » » (n° 5)', () => {
    const m = monde();
    const c = m.carnets.find(x => x.id === IDS_SUIVI.chambreFroide)!;
    const avecLien = { ...c, carnet: { ...c.carnet, phrase: 'https://exemple.invalid/frigo' } } as unknown as CarnetV;
    render(<CarnetOuvert {...props(m, IDS_SUIVI.chambreFroide, { carnet: avecLien })} />);
    expect(screen.queryByText(/votre lien/)).toBeNull();
    expect(document.body.textContent).not.toContain('https://exemple.invalid/frigo');
  });
  it('une note du Planning est une bulle du fil, plus une carte à part (n° 8)', () => {
    render(<CarnetOuvert {...props(monde(), IDS_SUIVI.planning)} />);
    const fil = screen.getByRole('log', { name: 'Fil du carnet' });
    expect(fil.querySelector('[data-planning]')).not.toBeNull();
    expect(document.querySelector('.cn-note')).toBeNull();
    expect(fil.textContent).toMatch(/À faire du .* nov\.|À faire du/);
    expect(fil.textContent).not.toMatch(/\(Planning/);
  });
});

describe('Résolu', () => {
  const rendu = (x: Partial<CarnetOuvertProps> = {}) => {
    const m = resolu();
    return render(<CarnetOuvert {...props(m, IDS_SUIVI.vapeur, x)} />);
  };
  it('avant / après, tampon « Résolu en 27 jours », fermeture, options fermées, rangé', () => {
    rendu();
    expect(screen.getByRole('group', { name: 'État : Résolu' })).toBeTruthy();
    expect(screen.getByLabelText('Avant et après')).toBeTruthy();
    const tampon = document.querySelector('.cnp-tampon') as HTMLElement;
    expect(tampon.textContent).toMatch(/Résolu\s*en 27 jours/);
    expect(tampon.textContent).toContain('Fermé grâce à l\'achat de « Condenseur B »');
    const fermees = within(screen.getByRole('list', { name: 'Options fermées' }));
    expect(fermees.getByText('Condenseur A').parentElement!.textContent).toMatch(/pas pris/);
    expect(fermees.getByText('Humidificateur').parentElement!.textContent).toMatch(/non, 22 nov\./);
    expect(tampon.textContent).toContain('Rangé : Brasserie › Brassage › Vapeur');
  });
  it('« ira dans Réalisés » seulement si un plan est lié ; Rouvrir appelle le rappel', () => {
    const onRouvrir = vi.fn();
    const { unmount } = rendu({ rappels: { onRouvrir } });
    expect(screen.queryByText('ira dans Réalisés')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Rouvrir/ }));
    expect(onRouvrir).toHaveBeenCalledTimes(1);
    unmount();
    rendu({ liens: [{ sorte: 'a-venir', id: 'P1', libelle: 'Condenseur B', etat: 'present', le: '2026-11-20' }] });
    expect(screen.getByText('ira dans Réalisés')).toBeTruthy();
  });
  it('les tuiles des résolus de l\'année : le dernier en vert, un toucher ouvre un autre résolu', () => {
    const onRelecture = vi.fn();
    rendu({ onRelecture });
    const tuiles = screen.getByRole('region', { name: 'Résolus en 2026' });
    expect(tuiles.textContent).toMatch(/Résolus en 2026\s*3 · le dernier en vert/);
    expect(tuiles.querySelectorAll('[data-dernier]')).toHaveLength(1);
    fireEvent.click(within(tuiles).getByRole('button', { name: /Relire/ }));
    expect(onRelecture).toHaveBeenCalled();
  });
  it('changer la photo d\'avant ou d\'après : le choix passe par onAvantApres', () => {
    const onAvantApres = vi.fn();
    rendu({ rappels: { onAvantApres } });
    fireEvent.click(screen.getByRole('button', { name: 'Changer la photo d\'après' }));
    const choix = screen.getByRole('group', { name: 'Photo d’après' });
    fireEvent.click(within(choix).getAllByRole('button')[0]);
    expect(onAvantApres).toHaveBeenCalledWith(undefined, expect.stringMatching(/^ZZ-SV-M\d+-P$/));
  });
  it('le fil est replié sous « Le fil », les notes y restent', () => {
    rendu();
    expect(screen.queryByRole('log', { name: 'Fil du carnet' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Le fil/ }));
    expect(screen.getByRole('log', { name: 'Fil du carnet' })).toBeTruthy();
  });
  it('sans citation de ses notes, la question honnête s\'affiche aussi dans le résolu', () => {
    const m = resolu();
    render(<CarnetOuvert {...props({ ...m, messages: [] }, IDS_SUIVI.vapeur)} />);
    expect(screen.getByText('Pourquoi B plutôt que A ?')).toBeTruthy();
  });
});

describe('Relecture des résolus', () => {
  it('la fiche vient de ses notes ; « Toujours le bon choix ? » : Oui et Pas sûr', () => {
    const m = resolu();
    const onRelu = vi.fn();
    const onOuvrir = vi.fn();
    render(<RelectureResolus carnets={m.carnets} messages={m.messages} rappels={{ onRelu }} onOuvrir={onOuvrir} />);
    const fiche = screen.getByRole('region', { name: /Fiche : .*Trop de vapeur/ });
    expect(fiche.textContent).toMatch(/problème/);
    expect(fiche.textContent).toMatch(/« Je le prends fin du mois »/);
    expect(fiche.textContent).toMatch(/27 jours/);
    fireEvent.click(within(fiche).getByRole('button', { name: 'Oui' }));
    expect(onRelu).toHaveBeenLastCalledWith(IDS_SUIVI.vapeur, 'oui');
    fireEvent.click(within(fiche).getByRole('button', { name: 'Pas sûr' }));
    expect(onRelu).toHaveBeenLastCalledWith(IDS_SUIVI.vapeur, 'pas-sur');
    fireEvent.click(within(fiche).getByRole('button', { name: /Le fil/ }));
    expect(onOuvrir).toHaveBeenCalledWith(IDS_SUIVI.vapeur);
  });
  it('la recherche filtre ; rien trouvé : le dit ; les autres résolus par catégorie se touchent', () => {
    const m = resolu();
    render(<RelectureResolus carnets={m.carnets} messages={m.messages} />);
    expect(screen.getByRole('region', { name: 'Autres résolus' })).toBeTruthy();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Chercher dans les résolus' }), { target: { value: 'zzzzz' } });
    expect(screen.getByText(/Aucun résolu ne parle de « zzzzz »/)).toBeTruthy();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Chercher dans les résolus' }), { target: { value: 'joint' } });
    expect(screen.getByRole('region', { name: /Fiche : .*Joint de vanne/ })).toBeTruthy();
  });
  it('aucun résolu : une phrase, pas une fiche vide', () => {
    const m = monde();
    render(<RelectureResolus carnets={m.carnets.filter(c => c.carnet.suivi?.etat !== 'resolu' && !c.carnet.archive)} messages={m.messages} />);
    expect(screen.getByText(/Aucun problème résolu/)).toBeTruthy();
  });
  it('« pourquoi » sans citation : « tes notes ne le disent pas », rien d\'inventé', () => {
    const m = resolu();
    render(<RelectureResolus carnets={m.carnets} messages={[]} />);
    expect(screen.getAllByText('tes notes ne le disent pas').length).toBeGreaterThan(0);
  });
  it('un résolu déjà relu garde sa réponse (relu le … : oui)', () => {
    const m = resolu();
    const c = m.carnets.find(x => x.id === IDS_SUIVI.vapeur)!;
    c.carnet.suivi!.relu = { le: '2027-03-14T10:00:00.000Z', reponse: 'pas-sur' };
    render(<RelectureResolus carnets={m.carnets} messages={m.messages} />);
    expect(screen.getByText(/Relu le 14 mars/)).toBeTruthy();
  });
});

describe('typage et saisie', () => {
  it('aucun champ type="number" dans les écrans du suivi (saisie mobile : inputMode)', () => {
    const m = resolu();
    render(<RelectureResolus carnets={m.carnets} messages={m.messages} />);
    render(<CarnetOuvert {...props(monde(), IDS_SUIVI.vapeur, { rappels: { onOption: vi.fn() } as RappelsSuivi })} />);
    fireEvent.click(screen.getByRole('button', { name: /Condenseur A, piste, changer/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Écarter' }));
    expect(document.querySelectorAll('input[type="number"]')).toHaveLength(0);
  });
});
export type { CarnetDoc };

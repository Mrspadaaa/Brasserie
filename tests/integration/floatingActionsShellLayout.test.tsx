import React from 'react';
import { readFileSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BrewerJob } from '../../functions/src/companionTypes';

vi.mock('../../src/services/brewerChat', () => ({
  BrewerChat: { userKey: vi.fn(), history: vi.fn(), activity: vi.fn(async () => []), reset: vi.fn(), submit: vi.fn(), status: vi.fn(), markRead: vi.fn() },
  brewerChatError: () => 'Erreur de connexion.'
}));

import { FloatingActions } from '../../src/ui/FloatingActions';
import { ActionDock, PageShell } from '../../src/pages/PageShell';
import { brewerJobs } from '../../src/services/brewerJobs';

/*
 * Régression du recouvrement du lanceur global (FAB) : à 390 px, le bouton
 * flottant recevait le toucher destiné à un sélecteur passé dessous au défilement.
 *
 * jsdom ne calcule aucune géométrie : ces tests vérifient la LOGIQUE de la zone
 * réservée — le lanceur suit une case hors de toute zone défilante, sur les
 * onglets comme sur une page plein écran, y compris clavier ouvert — et les
 * contrats menu/focus/inert/Escape. Les rectangles positifs et le hit-test
 * (`elementFromPoint`) restent à mesurer dans la vraie App, à 390 et 1280.
 *
 * jsdom applique en revanche `display` depuis une feuille injectée : les cas
 * d'un hôte qui masque l'en-tête du cadre, ou d'une feuille d'écran qui masque
 * le bouton par son nom, se jugent donc ici sur le rendu, pas sur un export.
 */

/** La feuille du lanceur telle qu'elle est livrée (Vitest n'injecte pas le CSS importé). */
function readFloatingActionsCss(testFilePath: string | undefined): string {
  if (!testFilePath || !isAbsolute(testFilePath)) {
    throw new Error('Chemin disque du test indisponible; la feuille du lanceur ne peut pas être lue.');
  }
  const css = readFileSync(resolve(dirname(testFilePath), '../../src/ui/floating-actions.css'), 'utf8');
  if (!css.trim()) throw new Error('Feuille du lanceur vide.');
  return css;
}

beforeEach(() => { brewerJobs.stop(); localStorage.clear(); });
afterEach(() => {
  cleanup(); brewerJobs.stop(); vi.restoreAllMocks(); window.history.replaceState({}, '', '/');
  document.querySelectorAll('style[data-test-host]').forEach(style => style.remove());
});

/** Feuille d'hôte ou d'écran, retirée après chaque test. */
function hostStyle(css: string) {
  const style = document.createElement('style');
  style.setAttribute('data-test-host', '');
  style.textContent = css;
  document.head.append(style);
}

/** Rendu au sens du navigateur : ni l'élément ni un ancêtre en `display: none`. */
function rendered(element: Element) {
  for (let node: Element | null = element; node; node = node.parentElement) {
    if (getComputedStyle(node).display === 'none') return false;
  }
  return true;
}

/**
 * jsdom ne pose aucune boîte. Comme un navigateur, une case rendue reçoit ici une
 * taille (case compacte, 40×32) et une case sous `display: none` une boîte nulle :
 * le lanceur ne se dit docké que sur une case réellement affichée.
 */
function layoutRenderedDocks() {
  const measure = Element.prototype.getBoundingClientRect;
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    if (!this.matches('[data-action-dock]') || !rendered(this)) return measure.call(this);
    return { x: 342, y: 480, left: 342, top: 480, right: 382, bottom: 512, width: 40, height: 32, toJSON: () => ({}) } as DOMRect;
  });
}

const doneJob = (): BrewerJob => ({
  id: '7'.repeat(64), operationId: `operation-${'7'.repeat(20)}`, scope: { kind: 'recipe', id: 'REC-A' },
  generation: 0, question: 'Question 7', label: 'REC-A', status: 'done', stage: 'analysis',
  createdAt: 7, updatedAt: 7, attempt: 1
} as BrewerJob);

const callbacks = () => ({ screen: vi.fn(), invoice: vi.fn(), sale: vi.fn(), recipe: vi.fn(), brew: vi.fn(), closePage: vi.fn() });
type Calls = ReturnType<typeof callbacks>;

/** Même composition que l'App : onglets + barre + case réservée, un seul lanceur, et une page plein écran au-dessus. */
function Shell({ page, footer = false, calls }: { page: boolean; footer?: boolean; calls: Calls }) {
  return <>
    <main data-floating-actions-gap="nav" aria-label="Onglet Matériel">
      <label>Nature du constat<select aria-label="Nature du constat (onglet)"><option>Qualitative</option></select></label>
      <button type="button">Ligne du tableau</button>
    </main>
    <div className="app-bottom-dock">
      <nav aria-label="Navigation principale"><button type="button">Clients</button></nav>
      <div aria-hidden="true" className="app-bottom-dock-cell"><ActionDock kind="nav" /></div>
    </div>
    <FloatingActions action={page ? null : { intent: 'newEquipment', label: 'Nouveau matériel' }} onAction={calls.screen}
      companionLabel={page ? 'Atelier Houblons' : 'Matériel'} anchor={page ? 'page' : 'nav'}
      onInvoice={calls.invoice} onSale={calls.sale} onRecipe={calls.recipe} onBrew={calls.brew} />
    {page && <PageShell title="Atelier Houblons" onClose={calls.closePage}
      footer={footer ? <button type="button">Enregistrer la recette</button> : undefined}>
      <label>Nature du constat<select aria-label="Nature du constat (page)"><option>Qualitative</option><option>Ordinale</option></select></label>
      <label>Conditions déclarées<textarea aria-label="Conditions déclarées" /></label>
    </PageShell>}
  </>;
}

/**
 * Page plein écran seule avec le lanceur, sans case d'onglets : les contre-épreuves sur la source d'avant
 * échouent ici sur le comportement (pas de zone réservée, lanceur absent clavier ouvert), pas sur un export.
 */
function PageOnly({ calls, footer = false, className, compactDock }: { calls: Calls; footer?: boolean; className?: string; compactDock?: boolean }) {
  return <>
    <FloatingActions action={null} onAction={calls.screen} companionLabel="Atelier Houblons" anchor="page"
      onInvoice={calls.invoice} onSale={calls.sale} onRecipe={calls.recipe} onBrew={calls.brew} />
    <PageShell title="Atelier Houblons" onClose={calls.closePage} className={className} compactDock={compactDock}
      footer={footer ? <button type="button">Enregistrer la recette</button> : undefined}>
      <label>Nature du constat<select aria-label="Nature du constat (page)"><option>Qualitative</option></select></label>
      <label>Dimension<select aria-label="Dimension"><option>Libellé libre</option></select></label>
      <label>Conditions déclarées<textarea aria-label="Conditions déclarées" /></label>
    </PageShell>
  </>;
}

const launcherButton = () => screen.getByRole('button', { name: /^Actions rapides/ });
const launcherRoot = () => launcherButton().parentElement as HTMLElement;

/** Téléphone au doigt, clavier virtuel ouvert : `useDensity()` vaut `tight`. */
function phoneWithKeyboard() {
  window.history.replaceState({}, '', '/?keyboard=320');
  return vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
    matches: query === '(pointer: coarse)' || query === '(max-width: 639px)', media: query, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {},
    dispatchEvent: () => false
  }));
}

describe('Lanceur global · case réservée hors de la zone défilante', () => {
  it('réserve, dans une page plein écran, une case du pied hors défilement où le lanceur se pose', () => {
    const calls = callbacks();
    render(<PageOnly calls={calls} />);
    const pageMain = screen.getByRole('main', { name: 'Atelier Houblons' });
    // Avant correction : aucun pied sans contenu de page, le bouton flottait au-dessus du défilement.
    const footer = document.querySelector('footer');
    expect(footer, 'La page réserve une rangée d’action hors de la zone défilante.').not.toBeNull();
    const dock = footer!.querySelector('[data-action-dock="page"]');
    expect(dock).not.toBeNull();
    expect(pageMain.contains(footer)).toBe(false);
    for (const control of [
      screen.getByRole('combobox', { name: 'Nature du constat (page)' }),
      screen.getByRole('combobox', { name: 'Dimension' }),
      screen.getByRole('textbox', { name: 'Conditions déclarées' })
    ]) expect(pageMain.contains(control), 'Les contrôles restent dans le défilement, jamais dans la rangée du lanceur.').toBe(true);
    expect(launcherRoot()).toHaveAttribute('data-floating-actions-dock', 'page');
    expect(pageMain.contains(launcherRoot())).toBe(false);
    expect(launcherRoot().closest('[inert]')).toBeNull();
  });

  it('suit la case de la barre d’onglets, puis celle du pied de page, sans jamais entrer dans un contenu défilant', () => {
    const calls = callbacks();
    const view = render(<Shell page={false} calls={calls} />);
    const button = launcherButton();
    const root = launcherRoot();
    expect(root).toHaveAttribute('data-floating-actions-dock', 'nav');
    const navDock = document.querySelector('[data-action-dock="nav"]')!;
    expect(navDock, 'Les onglets réservent une case au lanceur.').not.toBeNull();
    expect(screen.getByRole('main', { name: 'Onglet Matériel' }).contains(navDock)).toBe(false);

    view.rerender(<Shell page calls={calls} />);
    expect(root).toHaveAttribute('data-floating-actions-dock', 'page');
    const pageDock = document.querySelector('[data-action-dock="page"]')!;
    expect(pageDock, 'La page plein écran réserve sa case au lanceur.').not.toBeNull();
    expect(pageDock.closest('footer'), 'La case est dans le pied, hors du défilement.').not.toBeNull();
    const pageMain = screen.getByRole('main', { name: 'Atelier Houblons' });
    expect(pageMain.contains(pageDock)).toBe(false);
    expect(pageMain.contains(screen.getByRole('combobox', { name: 'Nature du constat (page)' }))).toBe(true);
    expect(pageMain.contains(screen.getByRole('textbox', { name: 'Conditions déclarées' }))).toBe(true);
    expect(pageMain.contains(root)).toBe(false);
    // `data-page-overlay` : le lanceur reste actif au-dessus de la page ; le fond devient inerte.
    expect(root.closest('[inert]')).toBeNull();
    expect(screen.getByRole('button', { name: 'Clients', hidden: true }).closest('[inert]')).not.toBeNull();
    expect(launcherButton(), 'Le même lanceur sert les onglets et la page : pas de remontage.').toBe(button);

    view.rerender(<Shell page={false} calls={calls} />);
    expect(root).toHaveAttribute('data-floating-actions-dock', 'nav');
    expect(document.querySelector('[data-action-dock^="page"]')).toBeNull();
  });

  it('garde le lanceur et ses actions clavier ouvert : la case passe dans l’en-tête, pas au-dessus des champs', () => {
    const calls = callbacks();
    phoneWithKeyboard();
    layoutRenderedDocks();
    render(<PageOnly calls={calls} />);
    // Avant correction, le composant rendait `null` en densité `tight` : plus aucun accès aux actions.
    const button = launcherButton();
    expect(launcherRoot()).toHaveAttribute('data-floating-actions-dock', 'page-compact');
    expect(launcherRoot()).toHaveAttribute('data-floating-actions-docked', 'true');
    const dock = document.querySelector('[data-action-dock="page-compact"]')!;
    expect(dock.closest('header'), 'Clavier ouvert, la case ne prend que de la largeur dans l’en-tête.').not.toBeNull();
    expect(document.querySelector('[data-action-dock="page"]')).toBeNull();
    expect(screen.getByRole('main', { name: 'Atelier Houblons' }).contains(dock)).toBe(false);

    fireEvent.click(button);
    const items = screen.getAllByRole('menuitem');
    expect(document.activeElement).toBe(items[0]);
    expect(items[0]).toHaveTextContent('Compagnon brasseur');
    fireEvent.click(screen.getByRole('menuitem', { name: /Créer une recette/ }));
    expect(calls.recipe).toHaveBeenCalledOnce();
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('clavier ouvert, ne confie pas la case à un en-tête qu’un hôte masque : elle passe au pied, rendue, et le lanceur ne flotte pas', () => {
    const calls = callbacks();
    phoneWithKeyboard();
    layoutRenderedDocks();
    // Un hôte peut masquer l'en-tête du cadre pour poser le sien dans son contenu.
    hostStyle('.cadre-sans-entete > header { display: none; }');
    render(<PageOnly calls={calls} className="cadre-sans-entete" />);
    const header = document.querySelector('[data-page-shell] > header')!;
    expect(rendered(header), 'Garde : la règle d’hôte masque bien l’en-tête dans cet environnement.').toBe(false);
    const docks = document.querySelectorAll<HTMLElement>('[data-action-dock]');
    expect(docks).toHaveLength(1);
    const dock = docks[0];
    // Avant correction : la case restait dans l'en-tête masqué, sans boîte, et le lanceur reprenait son repli flottant.
    expect(header.contains(dock), 'Un en-tête masqué ne reçoit pas la seule case du lanceur.').toBe(false);
    expect(rendered(dock), 'La case attribuée est affichée.').toBe(true);
    expect(dock.closest('footer'), 'Elle passe au pied, hors défilement.').not.toBeNull();
    expect(dock).toHaveAttribute('data-action-dock', 'page-compact');
    const pageMain = screen.getByRole('main', { name: 'Atelier Houblons' });
    expect(pageMain.contains(dock)).toBe(false);
    for (const control of [
      screen.getByRole('combobox', { name: 'Nature du constat (page)' }),
      screen.getByRole('combobox', { name: 'Dimension' }),
      screen.getByRole('textbox', { name: 'Conditions déclarées' })
    ]) expect(pageMain.contains(control)).toBe(true);
    expect(launcherRoot()).toHaveAttribute('data-floating-actions-dock', 'page-compact');
    expect(launcherRoot(), 'Aucun repli flottant au-dessus des champs.').toHaveAttribute('data-floating-actions-docked', 'true');

    fireEvent.click(launcherButton());
    expect(screen.getAllByRole('menuitem')[0]).toHaveFocus();
    fireEvent.click(screen.getByRole('menuitem', { name: /Lancer un brassin/ }));
    expect(calls.brew).toHaveBeenCalledOnce();
  });

  it('reste rendu et actionnable sous une feuille d’écran qui le masquait par son nom, pastille ou non ; seule une vraie modale l’efface', async ({ task }) => {
    const floatingActionsCss = readFloatingActionsCss(task.file?.filepath);
    const calls = callbacks();
    // Règle de W `src/pages/recipe-wizard.css:3` (CSSOM du build QA : bouton présent, 0×0), puis la feuille du lanceur.
    hostStyle(`body:has(.recipe-wizard) button[aria-label='Actions rapides'] { display: none; }\n${floatingActionsCss}`);
    const witness = document.createElement('button');
    witness.setAttribute('aria-label', 'Actions rapides');
    const wizardWitness = document.createElement('div');
    wizardWitness.className = 'recipe-wizard';
    document.body.append(witness, wizardWitness);
    expect(rendered(witness), 'Garde : la règle `:has()` s’applique dans cet environnement.').toBe(false);
    witness.remove(); wizardWitness.remove();

    render(<PageOnly calls={calls} footer className="recipe-wizard" />);
    // Avant correction : la règle masquait le bouton (inaccessible), sa case du pied restait vide.
    const button = launcherButton();
    const root = launcherRoot();
    expect(rendered(button), 'Le lanceur occupe sa case, elle n’est pas vide.').toBe(true);
    expect(root.closest('[inert]')).toBeNull();
    button.focus();
    expect(button).toHaveFocus();
    fireEvent.click(button);
    fireEvent.click(screen.getByRole('menuitem', { name: /Créer une recette/ }));
    expect(calls.recipe).toHaveBeenCalledOnce();

    await act(async () => { brewerJobs.merge([doneJob()]); });
    expect(screen.getByRole('button', { name: 'Actions rapides · 1 réponse du compagnon' })).toBe(button);
    expect(rendered(button), 'La pastille ne change pas la présence du lanceur.').toBe(true);

    const modal = document.createElement('div');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    document.body.append(modal);
    expect(rendered(button), 'Une vraie modale efface toujours le lanceur.').toBe(false);
    modal.remove();
    expect(rendered(button)).toBe(true);
  });

  it('pose le lanceur sans second aplat à côté de l’action principale du pied, et seul quand le pied est vide', () => {
    const calls = callbacks();
    const view = render(<Shell page footer calls={calls} />);
    const footer = screen.getByRole('button', { name: 'Enregistrer la recette' }).closest('footer')!;
    expect(footer.querySelector('[data-action-dock="page"]')).not.toBeNull();
    expect(footer).not.toHaveAttribute('data-action-dock-only');
    expect(launcherRoot()).toHaveAttribute('data-floating-actions-tone', 'quiet');

    view.rerender(<Shell page calls={calls} />);
    const dockOnly = document.querySelector('footer')!;
    expect(dockOnly).toHaveAttribute('data-action-dock-only', 'true');
    expect(launcherRoot()).toHaveAttribute('data-floating-actions-tone', 'primary');
  });

  it('V4 (bande basse) : un pied réduit à la case du lanceur reste compact quand la page le demande, sans changer un pied d’actions', () => {
    const calls = callbacks();
    const view = render(<PageOnly calls={calls} compactDock />);
    const dockOnly = document.querySelector('footer')!;
    expect(dockOnly).toHaveAttribute('data-action-dock-only', 'true');
    expect(dockOnly.querySelector('[data-action-dock="page-compact"]')).not.toBeNull();
    expect(dockOnly.querySelector('[data-action-dock="page"]')).toBeNull();
    expect(launcherRoot()).toHaveAttribute('data-floating-actions-dock', 'page-compact');
    expect(launcherRoot()).toHaveAttribute('data-floating-actions-tone', 'primary');

    // A footer carrying the page's actions keeps the ordinary case beside them.
    view.rerender(<PageOnly calls={calls} compactDock footer />);
    const withActions = screen.getByRole('button', { name: 'Enregistrer la recette' }).closest('footer')!;
    expect(withActions.querySelector('[data-action-dock="page"]')).not.toBeNull();
    expect(launcherRoot()).toHaveAttribute('data-floating-actions-dock', 'page');
  });

  it('ne réserve rien dans une page sans lanceur monté', () => {
    render(<PageShell title="Page isolée" onClose={() => {}}><p>Contenu</p></PageShell>);
    expect(document.querySelector('[data-action-dock]')).toBeNull();
    expect(document.querySelector('footer')).toBeNull();
  });
});

describe('Lanceur global · menu, focus et callbacks conservés', () => {
  it('ouvre toutes les actions, l’action d’écran en premier, et transmet chaque callback une fois', () => {
    const calls = callbacks();
    const companion = vi.fn(), inbox = vi.fn();
    window.addEventListener('brewer-companion-open', companion);
    window.addEventListener('brewer-inbox-open', inbox);
    try {
      render(<Shell page={false} calls={calls} />);
      fireEvent.click(launcherButton());
      expect(screen.getAllByRole('menuitem').map(item => item.textContent)).toEqual([
        'Nouveau matérielSur cet écran',
        'Compagnon brasseurMatériel',
        'Entrer une factureDocument, puis vérification',
        'Encaisser une vente',
        'Créer une recette',
        'Lancer un brassinÀ partir d’une recette existante'
      ]);
      for (const name of [/Nouveau matériel/, /Compagnon brasseur/, /Entrer une facture/, /Encaisser une vente/, /Créer une recette/, /Lancer un brassin/]) {
        if (!screen.queryByRole('menu')) fireEvent.click(launcherButton());
        fireEvent.click(screen.getByRole('menuitem', { name }));
        expect(screen.queryByRole('menu')).toBeNull();
      }
      for (const fn of [calls.screen, calls.invoice, calls.sale, calls.recipe, calls.brew, companion]) expect(fn).toHaveBeenCalledOnce();
      expect(inbox).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener('brewer-companion-open', companion);
      window.removeEventListener('brewer-inbox-open', inbox);
    }
  });

  it('garde flèches, Home/End, Escape vers le lanceur sans fermer la page, Tab et clic extérieur', () => {
    const calls = callbacks();
    render(<Shell page calls={calls} />);
    const button = launcherButton();
    fireEvent.click(button);
    const menu = screen.getByRole('menu', { name: 'Actions rapides' });
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(button.getAttribute('aria-controls')).toBe(menu.id);
    const items = screen.getAllByRole('menuitem');
    expect(items[0]).toHaveFocus();
    fireEvent.keyDown(items[0], { key: 'ArrowDown' }); expect(items[1]).toHaveFocus();
    fireEvent.keyDown(items[1], { key: 'End' }); expect(items.at(-1)).toHaveFocus();
    fireEvent.keyDown(items.at(-1)!, { key: 'Home' }); expect(items[0]).toHaveFocus();
    fireEvent.keyDown(items[0], { key: 'ArrowUp' }); expect(items.at(-1)).toHaveFocus();
    fireEvent.keyDown(items.at(-1)!, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
    expect(button).toHaveFocus();
    expect(calls.closePage, 'Escape dans le menu ne ferme pas la page plein écran.').not.toHaveBeenCalled();

    fireEvent.click(button);
    fireEvent.keyDown(screen.getAllByRole('menuitem')[0], { key: 'Tab' });
    expect(screen.queryByRole('menu')).toBeNull();

    fireEvent.click(button);
    const field = screen.getByRole('textbox', { name: 'Conditions déclarées' });
    const fieldClick = vi.fn();
    field.addEventListener('click', fieldClick);
    fireEvent.pointerDown(field);
    expect(screen.queryByRole('menu')).toBeNull();
    fireEvent.click(field);
    expect(fieldClick).toHaveBeenCalledOnce();
    for (const fn of [calls.screen, calls.invoice, calls.sale, calls.recipe, calls.brew, calls.closePage]) expect(fn).not.toHaveBeenCalled();
  });

  it('garde le compte des réponses du compagnon dans le nom du lanceur ancré', async () => {
    const calls = callbacks();
    render(<Shell page calls={calls} />);
    await act(async () => { brewerJobs.merge([doneJob()]); });
    expect(screen.getByRole('button', { name: 'Actions rapides · 1 réponse du compagnon' })).toBeInTheDocument();
    expect(launcherRoot()).toHaveAttribute('data-floating-actions-dock', 'page');
  });
});

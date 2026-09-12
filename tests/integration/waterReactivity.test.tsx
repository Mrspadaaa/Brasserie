import React, { useState } from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render as testingRender, screen, fireEvent, cleanup, within, act } from '@testing-library/react';
import { SaltSolver, WaterState } from '../../src/ui/SaltSolver';
import { DEFAULT_WATER_SOURCE } from '../../src/domain/water';
import { WaterSource } from '../../src/types';
import { changeWaterRatio, readWaterRatio } from '../helpers/waterRatio';

/**
 * L'atelier de l'eau doit être ENTIÈREMENT dérivé.
 *
 * ⚠️ C'est la classe de panne la plus coûteuse ici, et la plus discrète : un
 * chiffre qui ne se remet pas à jour reste plausible. Les sels se dosent au
 * litre et l'acide sur l'alcalinité résiduelle — si la couleur de la bière, le
 * volume d'eau, l'analyse du réseau ou la part d'osmosée changent sans que les
 * doses suivent, le brasseur verse une correction calculée pour une autre
 * bière, sans qu'aucune alerte ne se déclenche.
 *
 * Chaque test change UNE entrée et vérifie que la sortie a bougé. Aucun ne
 * regarde comment c'est câblé : si le câblage change, ils doivent continuer à
 * décrire ce que le brasseur voit à l'écran.
 */

afterEach(cleanup);

it('Doser respecte les cinq ions d’une cible personnalisée (Angles), puis suit les modifications manuelles', () => {
  const source: WaterSource = { id: 'angles', name: 'Angles', ca: 49, mg: 1.1, na: 1.9, so4: 7.1, cl: 1.3, hco3: 157.4 };
  function Host() {
    const [state, setState] = useState<WaterState>({
      diRatioPct: 0, styleCode: '—', doses: {}, disabled: [], acidId: 'lactique', mashWaterL: 30, spargeWaterL: 0,
      customTarget: { name: 'American Wheat de référence', ions: { ca: 100, mg: 25, na: 15, so4: 100, cl: 111, hco3: 0 } }
    });
    return <SaltSolver source={source} onSourceChange={() => {}} beerEbc={8} beerVolumeL={25} state={state} onChange={setState} noSparge />;
  }
  render(<Host />);
  fireEvent.click(screen.getByRole('button', { name: /Proposer les doses/i }));
  expect((screen.getByLabelText(/Dose de Sel d’Epsom en grammes/) as HTMLInputElement).value).toBe('7,2');
  expect((screen.getByLabelText(/Dose de Sel de table en grammes/) as HTMLInputElement).value).toBe('1');
  expect((screen.getByLabelText(/Dose de Gypse en grammes/) as HTMLInputElement).value).toBe('0');
  const slider = screen.getByRole('slider', { name: 'SO₄ ⇄ Cl' }) as HTMLInputElement;
  const before = readWaterRatio(slider);
  fireEvent.click(screen.getByRole('button', { name: 'Ajouter 0.5 g de Gypse' }));
  expect(readWaterRatio(slider)).toBeGreaterThan(before);
});

const ETAT: WaterState = {
  diRatioPct: 0,
  styleCode: '20C',
  doses: {},
  disabled: [],
  acidId: 'lactique',
  mashWaterL: 20,
  spargeWaterL: 10
};

/** Monte l'atelier avec son état vivant, comme le fait l'assistant. */
function monter(
  overrides: Partial<WaterState> = {},
  ebc: number | null = 80,
  volumeL = 30,
  brew?: React.ComponentProps<typeof SaltSolver>['brew']
) {
  const props: { ebc: number | null; source: WaterSource } = {
    ebc,
    source: DEFAULT_WATER_SOURCE
  };

  const Hote: React.FC = () => {
    const [state, setState] = useState<WaterState>({ ...ETAT, ...overrides });
    const [ebcState, setEbc] = useState(props.ebc);
    const [source, setSource] = useState(props.source);
    /*
     * ⚠️ Couper le rinçage est désormais une DÉCISION explicite, pas la
     * conséquence d'un volume tombé à zéro : vider le champ pour retaper
     * faisait basculer l'onglet en pleine frappe et réécrivait le volume
     * d'empâtage. L'assistant fait exactement ce que fait ce bouton — il pose
     * la décision ET reverse le volume dans la maische.
     */
    const [noSparge, setNoSparge] = useState((overrides.spargeWaterL ?? ETAT.spargeWaterL) <= 0);
    return (
      <>
        <button onClick={() => setEbc(6)}>rendre pâle</button>
        <button onClick={() => setEbc(80)}>rendre noire</button>
        <button
          onClick={() => {
            setNoSparge(true);
            setState((s) => ({ ...s, spargeWaterL: 0 }));
          }}
        >
          supprimer rinçage
        </button>
        <button onClick={() => setState((s) => ({ ...s, acidId: 'phosphorique' }))}>phosphorique</button>
        <button onClick={() => setState((s) => ({ ...s, acidId: 'maltAcidule' }))}>malt acidulé</button>
        <button onClick={() => setState((s) => ({ ...s, diRatioPct: 100 }))}>osmosée pure</button>
        <button onClick={() => setState((s) => ({ ...s, styleCode: '05D' }))}>style Pils</button>
        <button onClick={() => setState((s) => ({ ...s, mashWaterL: 40 }))}>doubler empâtage</button>
        <button onClick={() => setSource({ ...source, hco3: 20, ca: 5, mg: 1 })}>eau douce</button>
        <SaltSolver
          brew={brew}
          source={source}
          onSourceChange={setSource}
          beerEbc={ebcState}
          beerVolumeL={volumeL}
          state={state}
          onChange={setState}
          noSparge={noSparge}
          onNoSpargeChange={(off) => {
            setNoSparge(off);
            setState((s) => ({ ...s, spargeWaterL: off ? 0 : 10 }));
          }}
        />
      </>
    );
  };
  return render(<Hote />);
}

const clic = (nom: string) => fireEvent.click(screen.getByText(nom));

/** La ligne d'un additif dans le tableau des totaux. */
function ligne(nom: string | RegExp): HTMLElement | null {
  const cell = screen.queryAllByRole('rowheader').find((th) => {
    const t = th.textContent ?? '';
    return typeof nom === 'string' ? t.includes(nom) : nom.test(t);
  });
  return cell ? cell.closest('tr') : null;
}

/** Les trois montants d'une ligne : empâtage, rinçage, total. */
function montants(nom: string | RegExp): string[] {
  const tr = ligne(nom);
  if (!tr) return [];
  return within(tr)
    .getAllByRole('cell')
    .map((td) => (td.textContent ?? '').trim());
}

/**
 * L'alcalinité résiduelle de l'eau, telle qu'affichée sur l'onglet Empâtage.
 *
 * ⚠️ Lue par le TEXTE, plus par la position du `<span>` : le panneau porte
 * maintenant une seconde ligne « Après l'acide : … », et un index de span se
 * serait décalé à la première retouche. On prend le PREMIER nombre après la
 * parenthèse du libellé — celui de l'eau, pas celui d'après acide, qui vaut
 * toujours la cible et n'apprend donc rien.
 */
function arAffichee(): number {
  const bloc = screen.getByText(/Alcalinité résiduelle — repère/).closest('div')!;
  const apresLibelle = (bloc.textContent ?? '').split(')').slice(1).join(')');
  return Number((apresLibelle.match(/-?\d+/) ?? [NaN])[0]);
}

function arTraiteeAffichee(): number {
  const label = screen.queryByText('Après l’acide :');
  return label ? Number(label.nextElementSibling!.textContent!.match(/-?\d+/)![0]) : arAffichee();
}

function cibleAffichee(): string {
  return screen.getByText(/Alcalinité résiduelle — repère/).textContent ?? '';
}

/** Le bloc d'alertes, en clair. */
function alertes(): string {
  return screen
    .queryAllByRole('listitem')
    .map((li) => li.textContent ?? '')
    .join(' | ');
}

describe('La couleur de la bière pilote l’alcalinité', () => {
  it('⚠️ changer la couleur déplace la fenêtre d’AR, sans recharger l’écran', () => {
    monter({}, 80);
    expect(cibleAffichee()).toContain('120 à 180');
    expect(cibleAffichee()).toContain('bière noire');

    clic('rendre pâle');
    expect(cibleAffichee()).toContain('-60 à 0');
    expect(cibleAffichee()).toContain('bière pâle');
  });

  it('adapte l’acide aux besoins d’empâtage sans déplacer les bornes du profil', () => {
    monter({}, 80);
    const noire = montants(/(?:Acide|Malt acidulé).*Empâtage/)[0];
    const zone = () => screen.getByRole('img', { name: /Profil ionique/ }).querySelector('[data-ion-target="hco3"]')!.getAttribute('d');
    const avant = zone();
    clic('rendre pâle');
    const pale = montants(/(?:Acide|Malt acidulé).*Empâtage/)[0];

    expect(noire).toBeUndefined(); // Suitable alkaline water: no acid just to centre HCO3.
    expect(pale).toBe('2.9 mL'); // Combined water reaches the compulsory 120 ppm floor.
    expect(screen.getByRole('img', { name: /Profil ionique/ })).toHaveAccessibleName(/Alcalinité.*120 ppm pour 120 à 250/);
    expect(zone()).toBe(avant);
    expect(screen.getByLabelText('Critères du dosage automatique')).toHaveTextContent('repère ajusté à 120 ppm');
  });

  it('l’acide suit encore la couleur lorsque le profil ne demande aucun minimum de HCO₃', () => {
    monter({ styleCode: '—' }, 80);
    const noire = parseFloat(montants(/(?:Acide|Malt acidulé).*Empâtage/)[0]);
    clic('rendre pâle');
    const pale = parseFloat(montants(/(?:Acide|Malt acidulé).*Empâtage/)[0]);
    expect(pale).toBeGreaterThan(noire);
  });
});

describe('Les volumes pilotent les concentrations', () => {
  it('doubler l’eau d’empâtage change l’alcalinité résiduelle de cette eau', () => {
    monter({ doses: { nahco3: 6 } });
    const avant = arAffichee();
    clic('doubler empâtage');
    expect(arAffichee()).not.toBe(avant);
    // Deux fois plus d'eau pour le même bicarbonate : l'alcalinité baisse.
    expect(arAffichee()).toBeLessThan(avant);
  });

  /*
   * ⚠️ BIAB, ou empâtage à volume plein : sans eau de rinçage, l'onglet et la
   * ligne d'acide correspondante n'ont plus d'objet, et TOUS les sels passent
   * dans la maische.
   */
  it('⚠️ supprimer le rinçage retire son onglet, sa ligne d’acide et y verse tous les sels', () => {
    /*
     * ⚠️ On part EXPRÈS en répartition proportionnelle. Depuis l'unification du
     * défaut — absent = tout à l'empâtage —, ne rien poser ferait démarrer le
     * test à l'arrivée : la colonne rinçage serait déjà vide, et le test ne
     * vérifierait plus rien.
     */
    monter({ doses: { gypse: 9 }, allSaltsInMash: false });
    expect(screen.getAllByRole('tab')).toHaveLength(2);
    expect(montants(/Rinçage · cible/)).not.toEqual([]);
    expect(montants('Gypse')[1]).toBe('3.00 g');

    clic('supprimer rinçage');

    expect(screen.getAllByRole('tab')).toHaveLength(1);
    expect(ligne(/Rinçage · cible/)).toBeNull();
    expect(montants('Gypse')[0]).toBe('9.00 g');
    expect(montants('Gypse')[1]).toBe('0.00 g');
  });
});

describe('L’analyse du réseau pilote tout le reste', () => {
  it('⚠️ modifier l’eau de départ recalcule l’AR et l’acide', () => {
    monter({}, 6);
    const dureAr = arAffichee();
    const dureAcide = montants(/(?:Acide|Malt acidulé).*Empâtage/)[0];

    clic('eau douce');

    expect(arAffichee()).toBeLessThan(dureAr);
    expect(montants(/(?:Acide|Malt acidulé).*Empâtage/)[0]).not.toBe(dureAcide);
  });

  it('la part d’osmosée fait tomber l’AR à zéro', () => {
    monter({}, 6);
    expect(arAffichee()).toBeGreaterThan(0);
    clic('osmosée pure');
    expect(arAffichee()).toBe(0);
    expect(montants(/(?:Acide|Malt acidulé).*Empâtage/)).toEqual([]);
    expect(screen.getByText(/Profil non atteint/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Proposer les doses' }));
    expect(screen.getByText('Profil atteint : 6/6 ions dans les plages.')).toBeInTheDocument();
  });
});

describe('L’acidifiant pilote les deux doses', () => {
  it('passer au phosphorique baisse les deux doses d’environ 20 %', () => {
    monter({}, 6);
    const lactiqueEmp = parseFloat(montants(/(?:Acide|Malt acidulé).*Empâtage/)[0]);
    const lactiqueRin = parseFloat(montants(/Rinçage · cible/)[1]);

    clic('phosphorique');

    const phosphoEmp = parseFloat(montants(/(?:Acide|Malt acidulé).*Empâtage/)[0]);
    const phosphoRin = parseFloat(montants(/Rinçage · cible/)[1]);

    expect(phosphoEmp).toBeLessThan(lactiqueEmp);
    expect(phosphoRin).toBeLessThan(lactiqueRin);
    // Compare neutralized mass across BOTH waters. A 0.1 mL grid cannot
    // preserve an exact 1.25 dose ratio on amounts as small as 0.6–0.7 mL.
    const lactiqueMass = (lactiqueEmp + lactiqueRin) * 600;
    const phosphoMass = (phosphoEmp + phosphoRin) * 750;
    expect(Math.abs(lactiqueMass - phosphoMass)).toBeLessThanOrEqual(2 * 0.05 * (600 + 750));
  });

  /* ⚠️ Il n'y a pas de grain au rinçage : le malt acidulé doit y être refusé. */
  it('⚠️ choisir le malt acidulé annule la dose de rinçage et l’explique', () => {
    monter({}, 6);
    expect(parseFloat(montants(/Rinçage · cible/)[1])).toBeGreaterThan(0);

    clic('malt acidulé');

    expect(ligne(/Rinçage · cible/)).toBeNull();
    expect(alertes()).toMatch(/n’a rien à faire au rinçage/);
  });
});

describe('Le style pilote les cibles', () => {
  /*
   * ⚠️ Cadré sur la COMPARAISON, car la fourchette s'écrit à deux endroits :
   * ici, et au coin de la toile sur la feuille des sels. Ce n'est pas un
   * doublon — la toile donne une forme, la comparaison donne des nombres et
   * l'écart départ → corrigé — mais `getByText` en trouve deux.
   *
   * On cible par le NOM ACCESSIBLE de la liste plutôt que par sa structure :
   * ce bloc est déjà passé d'un tableau à une liste de rangs, et le nom, lui,
   * a survécu à la refonte.
   */
  const comparaison = () =>
    screen.getByRole('list', { name: /Eau de départ et eau corrigée/i });

  /*
   * ⚠️ CE TEST LISAIT L'ALCALINITÉ, ET C'EST JUSTEMENT L'AXE QUI A CHANGÉ.
   *
   * Il attendait « 120–250 » puis « 0–40 » : les fourchettes de bicarbonate
   * brutes d'une impériale et d'une Pils. Depuis que l'axe alcalinité se juge
   * sur la fenêtre d'AR retraduite pour le calcium de l'eau, ces deux nombres
   * n'y sont plus — et c'était le but : la toile disait « HCO₃ hors cible »
   * pendant que le panneau disait « après l'acide, dans la cible ».
   *
   * On vérifie donc la même chose sur un ion de GOÛT, qui lui se juge toujours
   * sur le style. Le chlorure sépare bien les deux : 80–160 pour une impériale,
   * 20–50 pour une Pils.
   */
  it('changer de style change la fourchette affichée et la proposition', () => {
    monter({}, 6);
    expect(within(comparaison()).getByText('80–160')).toBeInTheDocument();

    clic('style Pils');

    expect(within(comparaison()).queryByText('80–160')).not.toBeInTheDocument();
    expect(within(comparaison()).getByText('20–50')).toBeInTheDocument();
  });

  it('la cible HCO₃ reste visible et change uniquement avec le profil', () => {
    monter({}, 6);
    expect(within(comparaison()).getByText('120–250')).toBeInTheDocument();
    clic('style Pils');
    expect(within(comparaison()).queryByText('120–250')).not.toBeInTheDocument();
    expect(within(comparaison()).getByText('0–40')).toBeInTheDocument();
  });
});

describe('Les doses saisies pilotent les alertes', () => {
  it('⚠️ l’acide lactique CUMULÉ est signalé quand il se goûtera dans la bière', () => {
    // 20 L d'empâtage et 10 de rinçage sur eau calcaire, dans 6 L de bière :
    // la dose par litre devient forcément perceptible.
    monter({}, 6, 6);
    expect(alertes()).toMatch(/Acide lactique cumulé/);
    expect(alertes()).toMatch(/g par litre de bière/);
  });

  it('le même brassin dans un volume normal ne déclenche rien', () => {
    monter({}, 6, 60);
    expect(alertes()).not.toMatch(/Acide lactique cumulé/);
  });

  it('⚠️ le manque de calcium est signalé, et une seule fois', () => {
    // Osmosée pure et aucun sel : le calcium est à zéro.
    monter({ diRatioPct: 100, doses: {} }, 6);
    const nb = (alertes().match(/Calcium/g) ?? []).length;
    expect(nb).toBe(1);
  });
});

describe('Proposer les doses', () => {
  it('remplit le tableau, et rester idempotent — deux appuis donnent le même plan', () => {
    monter({ diRatioPct: 100 }, 80);
    // Le bouton s'affiche « Doser » ; son NOM, lui, reste entier.
    const bouton = screen.getByRole('button', { name: /Proposer les doses/i });

    fireEvent.click(bouton);
    const premier = montants('Gypse');
    expect(parseFloat(premier[2])).toBeGreaterThan(0);

    fireEvent.click(bouton);
    expect(montants('Gypse')).toEqual(premier);
  });

  /*
   * ⚠️ Les sels alcalins vont ENTIÈREMENT à l'empâtage : leur colonne rinçage
   * doit rester vide, sans quoi l'acide de rinçage rachèterait l'alcalinité
   * qu'on vient d'y verser.
   */
  it('⚠️ les sels alcalins proposés ne partent jamais au rinçage', () => {
    monter({ diRatioPct: 100 }, 80);
    fireEvent.click(screen.getByRole('button', { name: /Proposer les doses/i }));

    ['Bicarbonate de soude', 'Craie', 'Chaux éteinte'].forEach((nom) => {
      const m = montants(nom);
      if (m.length === 0) return; // ce sel n'a pas été proposé
      expect(m[1]).toBe('0.00 g');
      expect(m[0]).toBe(m[2]);
    });
  });
});

describe('Les saisies aberrantes sont bornées', () => {
  /*
   * ⚠️ Trouvé en pilotant l'application : aucun champ de l'atelier ne portait de
   * borne. Un volume d'empâtage de −30 L était accepté et l'écran affichait
   * « Doses totales pour -30 L ». Les gardes du domaine empêchaient le calcul
   * de produire un NaN, mais la recette pouvait être enregistrée ainsi.
   *
   * `NumberInput` sait borner — il fallait le lui demander. Les bornes
   * s'appliquent à la SORTIE du champ, pas à la frappe : avec un minimum de 10,
   * taper « 15 » remonterait sinon « 1 » ramené à 10.
   */
  const sortir = (el: HTMLElement) => fireEvent.blur(el);

  function champVolume(): HTMLInputElement {
    return screen.getByLabelText(/Volume d’eau d’empâtage/i) as HTMLInputElement;
  }

  it('⚠️ un volume d’eau négatif est ramené à zéro', () => {
    monter({}, 6);
    const c = champVolume();
    fireEvent.change(c, { target: { value: '-30' } });
    sortir(c);
    expect(c.value).toBe('0');
  });

  it('un volume normal traverse sans être touché', () => {
    monter({}, 6);
    const c = champVolume();
    fireEvent.change(c, { target: { value: '24,5' } });
    sortir(c);
    expect(c.value).toBe('24,5');
  });

  /*
   * (Le test de bornes du pH mesuré a suivi son champ : le relevé vit dans le
   * jour de brassage, et  le couvre là-bas. Il n’y a plus
   * de pH à borner sur la feuille d’eau — on y planifie, on n’y mesure pas.)
   */

  it('⚠️ une dose de sel négative est ramenée à zéro', () => {
    monter({}, 6);
    const dose = screen.getByLabelText(/Dose de Gypse en grammes/i) as HTMLInputElement;
    fireEvent.change(dose, { target: { value: '-5' } });
    sortir(dose);
    expect(dose.value).toBe('0');
  });
});

describe('Les deux volumes ne se confondent jamais', () => {
  /*
   * ⚠️ La panne signalée mot pour mot : « la quantité d'eau est inversée ».
   *
   * Il n'y avait qu'UN champ de volume, relié à l'onglet actif, et l'onglet
   * Rinçage disparaissait dès que `spargeWaterL` valait 0. Or vider un champ
   * remonte 0 immédiatement : effacer « 10 » pour taper « 18 » faisait
   * disparaître l'onglet EN PLEINE FRAPPE, le champ se reliait à `mashWaterL`,
   * et les caractères suivants écrasaient le volume d'EMPÂTAGE. Le brasseur
   * corrigeait son rinçage et perdait sa maische.
   */
  const champ = (quoi: RegExp) => screen.getByLabelText(quoi) as HTMLInputElement;

  it('⚠️ corriger le rinçage ne touche pas à l’empâtage, même en passant par zéro', () => {
    monter({ mashWaterL: 20, spargeWaterL: 10 });

    const rincage = champ(/Volume d’eau de rinçage/i);
    // On efface pour retaper : c'est le geste exact qui inversait les deux eaux.
    fireEvent.change(rincage, { target: { value: '' } });
    fireEvent.change(rincage, { target: { value: '18' } });
    fireEvent.blur(rincage);

    expect(champ(/Volume d’eau de rinçage/i).value).toBe('18');
    expect(champ(/Volume d’eau d’empâtage/i).value).toBe('20');
  });

  it('les deux champs sont visibles en même temps, chacun sur sa valeur', () => {
    monter({ mashWaterL: 20, spargeWaterL: 10 });
    expect(champ(/Volume d’eau d’empâtage/i).value).toBe('20');
    expect(champ(/Volume d’eau de rinçage/i).value).toBe('10');
  });

  it('sans rinçage, seul le champ d’empâtage reste', () => {
    monter({ mashWaterL: 30, spargeWaterL: 0 });
    expect(champ(/Volume d’eau d’empâtage/i).value).toBe('30');
    expect(screen.queryByLabelText(/Volume d’eau de rinçage/i)).toBeNull();
  });
});

describe('La part d’osmosée se saisit aussi en litres', () => {
  /*
   * ⚠️ « Pour le calcul de l'eau robinet osmosé je veux un litrage. » On ne
   * verse pas un pourcentage dans une cuve : le curseur seul obligeait à faire
   * `0,5 × 20` de tête, deux fois, devant la cuve.
   */
  const litres = () =>
    screen.getAllByLabelText(/Litres d’osmosée/i)[0] as HTMLInputElement;

  it('taper des litres pose le pourcentage', () => {
    monter({ mashWaterL: 20, spargeWaterL: 10, diRatioPct: 0 });
    const c = litres();
    fireEvent.change(c, { target: { value: '15' } });
    fireEvent.blur(c);
    // 15 L sur 20 L d'empâtage : 75 %.
    expect((screen.getByLabelText(/Osmosée — empâtage$/i) as HTMLInputElement).value)
      .toBe('75');
  });

  it('bouger le pourcentage met les litres à jour', () => {
    monter({ mashWaterL: 20, spargeWaterL: 10, diRatioPct: 0 });
    const pct = screen.getByLabelText(/Osmosée — empâtage$/i) as HTMLInputElement;
    fireEvent.change(pct, { target: { value: '50' } });
    fireEvent.blur(pct);
    expect(litres().value).toBe('10');
  });
});

describe('Chaque champ de l’atelier porte un nom', () => {
  /*
   * ⚠️ Trouvé en pilotant l'application : deux étiquettes déclaraient un
   * `htmlFor` vers un identifiant que personne ne portait, et les neuf champs
   * de dose n'avaient aucun nom du tout. Au lecteur d'écran, la correction
   * minérale était neuf fois « champ de saisie ». Cliquer sur l'étiquette ne
   * donnait pas non plus le focus.
   */
  it('⚠️ aucun champ ne reste anonyme', () => {
    const { container } = monter({}, 6);
    const anonymes = [...container.querySelectorAll('input')].filter((i) => {
      const parId = i.id ? container.querySelector(`label[for="${i.id}"]`) : null;
      return !(i.getAttribute('aria-label') || parId);
    });
    expect(anonymes.map((i) => i.className.slice(0, 40))).toEqual([]);
  });

  it('les neuf sels ont chacun leur champ nommé', () => {
    monter({}, 6);
    ['Gypse', 'Chlorure de calcium', 'Sel d’Epsom', 'Chlorure de magnésium', 'Sel de table',
     'Bicarbonate de soude', 'Craie', 'Chaux éteinte', 'Chlorure de potassium'
    ].forEach((sel) => {
      expect(screen.getByLabelText(new RegExp(`Dose de ${sel} en grammes`, 'i'))).toBeInTheDocument();
    });
  });
});

/*
 * ⚠️ Le test des « raccourcis de dilution » a été RETIRÉ, pas réparé : les cinq
 * boutons 0/25/50/75/100 n'existent plus. Ils faisaient doublon avec le curseur
 * qui atteint les mêmes valeurs, et avec le champ litres qui répond seul à la
 * question posée devant la cuve. Gaëtan : « le choix des boutons pour 25, 50,
 * 75 inutile ». Ce que le test garantissait — poser 50 % applique 50 % — reste
 * couvert par « bouger le pourcentage met les litres à jour », juste au-dessus.
 */
describe('Tous les sels à l’empâtage', () => {
  it('le switch Tous les sels à l’empâtage verse la totalité des sels dans la maische', () => {
    monter({ doses: { gypse: 6 }, mashWaterL: 20, spargeWaterL: 10, allSaltsInMash: false });
    // Répartition proportionnelle initiale : 4g mash, 2g sparge
    expect(montants('Gypse')[0]).toBe('4.00 g');
    expect(montants('Gypse')[1]).toBe('2.00 g');

    // Clic sur le switch
    const switchBtn = screen.getByRole('switch', { name: /Tous les sels à l’empâtage/i });
    fireEvent.click(switchBtn);

    // Tous les sels passent à l'empâtage
    expect(montants('Gypse')[0]).toBe('6.00 g');
    expect(montants('Gypse')[1]).toBe('0.00 g');
  });
});

describe('Les boutons ± de la grille des sels', () => {
  /*
   * ⚠️ Signalé mot pour mot : « les boutons + et − semblent pas bien
   * fonctionner », « l'appui prolongé ne fonctionne pas bien ». Les neuf cases
   * portaient un simple `onClick` : il fallait NEUF appuis pour poser 4.5 g de
   * gypse, et garder le doigt appuyé ne faisait rien du tout.
   *
   * Elles partagent désormais `useHoldRepeat` avec le compteur de stock — une
   * seule mécanique, un seul endroit où la corriger.
   */
  const boutonPlus = () =>
    screen.getByRole('button', { name: /Ajouter 0\.5 g de Gypse/i });

  it('un appui simple ajoute un demi-gramme', () => {
    monter({ doses: { gypse: 2 } });
    fireEvent.click(boutonPlus());
    expect((screen.getByLabelText(/Dose de Gypse en grammes/i) as HTMLInputElement).value)
      .toBe('2,5');
  });

  it('⚠️ l’appui long accumule, au lieu de réécrire le même résultat', () => {
    vi.useFakeTimers();
    monter({ doses: { gypse: 0 } });
    const plus = boutonPlus();

    fireEvent.pointerDown(plus, { pointerId: 1 });
    // 400 ms d'attente, puis six tics de 90 ms.
    act(() => {
      vi.advanceTimersByTime(400 + 90 * 6);
    });
    fireEvent.pointerUp(plus, { pointerId: 1 });
    fireEvent.click(plus);

    const dose = Number(
      (screen.getByLabelText(/Dose de Gypse en grammes/i) as HTMLInputElement).value.replace(',', '.')
    );
    // Six tics d'un demi-gramme, et le clic de relâchement ne compte pas en plus.
    expect(dose).toBe(3);
    vi.useRealTimers();
  });

  it('⚠️ le moins ne descend jamais sous zéro', () => {
    monter({ doses: { gypse: 0.5 } });
    const moins = screen.getByRole('button', { name: /Retirer 0\.5 g de Gypse/i });
    fireEvent.click(moins);
    expect((screen.getByLabelText(/Dose de Gypse en grammes/i) as HTMLInputElement).value)
      .toBe('0');
    expect(moins).toBeDisabled();
  });
});

/* ---------------------------------------------------------------------------
 * L'écart départ → corrigé, que la toile ne montre pas
 * ------------------------------------------------------------------------ */

describe('Comparaison départ / corrigé', () => {
  /*
   * ⚠️ CE BLOC A ÉTÉ SUPPRIMÉ PAR ERREUR, puis remis.
   *
   * Je l'avais pris pour un doublon de la toile en faisant une passe de
   * densité. Gaëtan l'a vu immédiatement : « j'ai perdu cette info ». Les deux
   * ne se remplacent pas — la toile donne une FORME (le profil penche-t-il vers
   * le sulfate ou le chlorure), ce bloc donne des NOMBRES et surtout l'ÉCART
   * entre l'eau de départ et l'eau corrigée. Devant la balance, c'est le second
   * qu'on lit : voir 7 → 100, c'est vérifier que les sels font le travail.
   *
   * Ces tests décrivent l'information, pas sa mise en page : elle est déjà
   * passée d'un tableau en colonnes à une liste de rangs, et devra pouvoir
   * changer encore.
   */
  const comparaison = () =>
    screen.getByRole('list', { name: /Eau de départ et eau corrigée/i });

  it('⚠️ montre l’eau de DÉPART à côté de l’eau corrigée, pas seulement le résultat', () => {
    monter({ doses: { gypse: 8 } }, 6);
    const rangs = within(comparaison()).getAllByRole('listitem');
    const calcium = rangs.find((li) => /Ca/.test(li.textContent ?? ''))!;
    // Le gypse monte le calcium : les deux nombres doivent différer, et la
    // flèche relier l'un à l'autre.
    expect(calcium.textContent).toMatch(/→/);
  });

  it('les six ions sont présents — aucun ne tombe hors du bloc', () => {
    monter({}, 6);
    expect(within(comparaison()).getAllByRole('listitem')).toHaveLength(6);
  });

  /*
   * ⚠️ La raison d'être de la refonte en rangs. En colonnes, le sixième ion
   * sortait de l'écran d'un téléphone et le bloc défilait latéralement — le
   * bicarbonate, celui qui décide de l'acidification, était le sacrifié.
   */
  it('⚠️ le bicarbonate est lisible ENTIER, symbole compris', () => {
    monter({}, 6);
    const rangs = within(comparaison()).getAllByRole('listitem');
    const hco3 = rangs.find((li) => /HCO/.test(li.textContent ?? ''))!;
    expect(hco3.textContent).toContain('éq.');
  });

  /*
   * ⚠️ SAUF LE BICARBONATE, et c'est nouveau. Depuis que la comparaison montre
   * l'eau APRÈS acide, le HCO₃ bouge même sans un seul sel : l'acide de rinçage
   * suffit à le faire descendre. Sa flèche est donc juste — c'est l'ancienne
   * absence de flèche qui mentait, en présentant une alcalinité que le plan
   * corrigeait déjà comme si rien ne la touchait.
   */
  it('ne montre pas de flèche sur un ion que RIEN ne touche', () => {
    monter({ doses: {} }, 6);
    within(comparaison())
      .getAllByRole('listitem')
      .filter((li) => !/HCO/.test(li.textContent ?? ''))
      .forEach((li) => expect(li.textContent).not.toMatch(/→/));
  });

  it('⚠️ le bicarbonate, lui, BOUGE — l’acide le fait descendre', () => {
    monter({ doses: {} }, 6);
    const hco3 = within(comparaison())
      .getAllByRole('listitem')
      .find((li) => /HCO/.test(li.textContent ?? ''))!;
    expect(hco3.textContent).toMatch(/→/);
  });
});

/* ---------------------------------------------------------------------------
 * La dose d'acide, là où la question se pose
 * ------------------------------------------------------------------------ */

describe('Dose d’acide sur l’onglet Empâtage', () => {
  /*
   * ⚠️ Signalé ainsi : « j'ai besoin d'un outil pour calculer les ml d'acide à
   * ajouter le jour du brassage à cette étape ». La dose ÉTAIT calculée — mais
   * affichée dans le tableau des additifs, tout en bas de la feuille des sels.
   * Au moment où l'écran annonce « alcalinité 55, cible -60 à 0 », le chiffre
   * qui répond à cette phrase se trouvait à deux écrans de là.
   */
  const ligneAcide = () =>
    screen.getByText(/— à l’empâtage$/).parentElement!.textContent ?? '';

  it('⚠️ affiche les millilitres à côté de l’alcalinité qu’ils corrigent', () => {
    // Eau de réseau non diluée sur une bière pâle : l'AR sort de sa cible.
    monter({ diRatioPct: 0 }, 6);
    expect(arAffichee()).toBeGreaterThan(0);
    expect(ligneAcide()).toMatch(/[\d.]+\s*mL/);
  });

  it('nomme l’acide choisi, pas « acide » en général', () => {
    monter({ diRatioPct: 0, acidId: 'phosphorique' }, 6);
    expect(ligneAcide()).toMatch(/phosphorique/i);
  });

  /*
   * ⚠️ LA COHÉRENCE QUI MANQUAIT. La note du pH disait « c'est là que l'acide
   * sert » pendant que la ligne de dose annonçait « rien à corriger » : les
   * deux ont raison séparément — l'acide se dose sur l'alcalinité résiduelle,
   * jamais sur une estimation de pH à ±0.15 — mais ensemble elles se
   * contredisaient à l'écran. Les notes décrivent désormais, la ligne de dose
   * seule prescrit.
   */
  it('⚠️ ne promet aucun acide quand la cible explicite est déjà atteinte', () => {
    // Exact source-water target, no sparge: no neutralization is required.
    monter({ spargeWaterL: 0, customTarget: { name: 'Eau conservée',
      ions: { ca: 85, mg: 14, na: 8, so4: 28, cl: 22, hco3: 250 } } }, 80);
    expect(ligneAcide()).toMatch(/rien à corriger/);
    // Et aucune phrase de l'écran ne doit réclamer d'acide en même temps.
    expect(screen.queryByText(/c’est là que l’acide sert/)).not.toBeInTheDocument();
  });

});

/* ---------------------------------------------------------------------------
 * Les alertes décrivent l'eau QU'ON A
 * ------------------------------------------------------------------------ */

describe('Alertes du solveur et doses réellement saisies', () => {
  /*
   * ⚠️ LE DÉFAUT, constaté à l'écran. `solveSalts` part toujours de l'eau de
   * départ et propose SON plan : il ne regarde jamais les doses saisies. Ses
   * messages décrivaient donc une proposition non appliquée, pendant que le
   * panneau juste au-dessus affichait l'eau réelle. Deux chiffres pour une
   * seule grandeur, sur le même écran :
   *
   *   doses à la main (gypse 6)  → panneau 26 ppm, alerte « à 53 ppm »
   *   après « Doser »            → panneau 53 ppm, alerte « à 53 ppm »
   *
   * L'écart montait à 27 ppm — de quoi doser l'acide sur le mauvais chiffre.
   */
  const arCitee = (): number | null => {
    const m = alertes().match(/Alcalinité résiduelle à (-?\d+) ppm/);
    return m ? Number(m[1]) : null;
  };

  it('⚠️ aucun message du solveur tant que son plan n’est pas appliqué', () => {
    // Des doses posées à la main, volontairement différentes de la proposition.
    monter({ doses: { gypse: 2, cacl2: 6 }, diRatioPct: 0 }, 6);
    expect(arCitee()).toBeNull();
  });

  /*
   * ⚠️ L'ALERTE D'ALCALINITÉ S'ÉTEINT QUAND L'ACIDE LA TRAITE.
   *
   * Signalé ainsi : « il est dit que la mixture est alcaline et qu'il faut
   * régler ça par les acides ; augmenter les sels semble pas enlever le
   * warning ». Et il ne pouvait pas : les sels ne traitent pas l'alcalinité,
   * c'est l'acide qui le fait — et l'acide était déjà dosé. Une alerte
   * qu'aucun geste n'éteint pousse à en faire de mauvais.
   *
   * Le solveur ne connaît que les sels ; c'est donc l'écran qui retire le
   * reproche quand la dose d'acide ramène l'alcalinité dans sa fenêtre.
   */
  it('signale le conflit avec l’AR des malts sans annuler le profil choisi', () => {
    monter({ doses: { gypse: 2, cacl2: 6 }, diRatioPct: 0 }, 6);
    fireEvent.click(screen.getByRole('button', { name: /Proposer les doses/i }));
    expect(arCitee()).toBe(arTraiteeAffichee());
    expect(alertes()).toMatch(/Le profil HCO₃ choisi est conservé/);
    expect(screen.getByText('Profil atteint : 6/6 ions dans les plages.')).toBeInTheDocument();
    expect(screen.getByText(/Après l’acide/)).toBeInTheDocument();
  });

  /* L'invariant d'origine tient toujours : si l'alerte paraît, elle cite le
     chiffre du panneau, jamais un autre. */
  it('⚠️ si elle paraît malgré tout, elle cite le MÊME chiffre que le panneau', () => {
    monter({ doses: { gypse: 2, cacl2: 6 }, diRatioPct: 0 }, 6);
    fireEvent.click(screen.getByRole('button', { name: /Proposer les doses/i }));
    const citee = arCitee();
    expect(citee).not.toBeNull();
    expect(citee).toBe(arTraiteeAffichee());
  });

  /*
   * Les autres alertes, elles, lisent l'eau RÉELLE (`achievedMash`, les deux
   * acides) : elles doivent rester visibles même sur des doses à la main.
   */
  it('les alertes calculées sur l’eau réelle survivent à une dose manuelle', () => {
    // 6 L de bière : la dose d'acide par litre franchit le seuil de perception.
    monter({ doses: { gypse: 2, cacl2: 6 }, diRatioPct: 0 }, 6, 6);
    expect(alertes()).toMatch(/Acide lactique cumulé/);
  });
});

/* ---------------------------------------------------------------------------
 * Seconde passe : ce que la première correction avait cassé, et le reste
 * ------------------------------------------------------------------------ */

describe('Rien de la PROPOSITION ne se lit comme un fait', () => {
  /*
   * ⚠️ RÉGRESSION CAUSÉE PAR MA PROPRE CORRECTION. `caShort` — le calcium sous
   * le minimum du style, mesuré sur l'eau RÉELLE — se taisait dès que le
   * solveur avait le même reproche, pour ne pas le dire deux fois. Mais depuis
   * que les messages du solveur sont masqués tant que son plan n'est pas
   * appliqué, l'avertissement disparaissait des DEUX côtés : le solveur ne
   * l'affichait plus, et celui-ci se croyait redondant. Un calcium trop bas
   * passait alors totalement sous silence.
   */
  it('⚠️ le calcium réellement trop bas est signalé même sans plan appliqué', () => {
    // Osmosée pure et aucun sel : le calcium tombe à zéro, très sous le minimum.
    monter({ doses: {}, diRatioPct: 100 }, 6);
    expect(alertes()).toMatch(/Calcium à \d+ ppm/);
  });

  /*
   * ⚠️ Le bloc « Juste ce qu'il faut d'osmosée » relance le solveur à chaque
   * taux candidat : ses millilitres décrivaient une dilution SUPPOSÉE avec des
   * doses SUPPOSÉES, et contredisaient les vrais chiffres affichés plus bas.
   * Les passer au conditionnel n'a pas suffi — « le total acide ne représente
   * pas du tout ça ». Ils ont été RETIRÉS : une dose se lit sur la fiche de
   * pesée, et nulle part ailleurs.
   */
  it('⚠️ le bloc de la coupe ne cite AUCUNE dose d’acide', () => {
    monter({ doses: { gypse: 2, cacl2: 6 }, diRatioPct: 0 }, 6, 6);
    const bloc = screen.getByText(/minimum|Imposé par|réseau suffit/).textContent ?? '';
    expect(bloc).not.toMatch(/mL/);
    expect(bloc).not.toMatch(/passe(rait)? à l’acide/);
  });

  /*
   * ⚠️ « N'est plus dynamique comme il faut. » La phrase ne bougeait pas du
   * curseur — normal, le minimum se calcule sur la SOURCE — mais écrite au
   * présent elle devenait fausse : à 90 % d'osmosée elle reprochait encore un
   * calcium que la coupe avait déjà réglé. Elle se situe maintenant par rapport
   * à la coupe en place.
   */
  it('⚠️ la phrase de la coupe se situe par rapport au taux courant', () => {
    // Kölsch sur eau de Fribourg : la coupe minimale n'est pas nulle.
    const { container } = monter({ doses: {}, styleCode: '05B', diRatioPct: 90 }, 6);
    /*
     * Le texte est coupé par l'interpolation JSX du pourcentage : `getByText`
     * ne le voit pas d'un bloc. On lit donc le paragraphe entier.
     */
    const phrase = [...container.querySelectorAll('p')]
      .map((p) => p.textContent ?? '')
      .find((t) => /Coupe en place/.test(t));
    expect(phrase).toMatch(/Coupe en place 90 %/);
    expect(phrase).toMatch(/descendre plus bas buterait sur/);
  });
});

/*
 * (Le bloc « Correction de pH » a été RETIRÉ d’ici avec le champ qu’il testait.
 *  Le rattrapage d’acide sur pH mesuré vit désormais dans le jour de brassage :
 *  voir , qui couvre les mêmes règles —
 *  refus de chiffrer sans rapport eau/grain, silence dans la fenêtre, et le
 *  cadrage aux seules étapes d’empâtage.)
 */

/* ---------------------------------------------------------------------------
 * « Doser » applique la proposition minérale, même vide, et préserve l’acide manuel.
 * ------------------------------------------------------------------------ */

describe('Le bouton Doser applique les sels proposés et conserve les acides manuels', () => {
  /*
   * ⚠️ Signalé ainsi : « le bouton doser fonctionne très mal ».
   *
   * Quand le solveur ne peut rien proposer, il rend un plan VIDE — et le bouton
   * l'appliquait : les doses posées à la main disparaissaient d'un appui, sans
   * avertissement ni retour arrière. Un bouton qui promet de doser et qui remet
   * tout à zéro est pire qu'un bouton absent.
   *
   * ⚠️ Le cas de départ était un Kölsch sur eau de Fribourg, dont le calcium
   * plafonne. Il ne sert plus : depuis que le KCl entre en dernier recours sous
   * son seuil de potassium, le solveur y trouve une proposition — c'était bien
   * le but. On force donc le plan vide par le seul moyen qui le garantisse :
   * écarter tous les sels.
   */
  const doser = () => screen.getByRole('button', { name: /Proposer les doses/i });
  const TOUS = ['gypse','cacl2','epsom','mgcl2','nacl','nahco3','caco3','chaux','kcl'] as never;

  it('permet d’appliquer une proposition sans sels', () => {
    monter({ doses: { gypse: 2, cacl2: 6 }, disabled: TOUS }, 6);
    expect(doser()).toBeEnabled();
  });

  it('retire les anciens sels quand ils ont tous été écartés', () => {
    monter({ doses: { gypse: 2, cacl2: 6 }, disabled: TOUS }, 6);
    fireEvent.click(doser());
    expect((screen.getByLabelText(/Dose de Gypse en grammes/) as HTMLInputElement).value).toBe('0');
  });

  it('dit que la cause est l’écartement des sels, pas un ion au plafond', () => {
    monter({ doses: { gypse: 2 }, disabled: TOUS }, 6);
    expect(screen.getByText(/tous les sels sont écartés/i)).toBeInTheDocument();
  });

  it('préserve un acide manuel quand la proposition minérale est vide', () => {
    monter({ doses: { gypse: 2 }, disabled: TOUS, acidOverride: { mash: 15 } }, 6);
    expect(doser()).toBeEnabled();
    fireEvent.click(doser());
    expect((screen.getByLabelText(/Dose d’acide lactique.*à l’empâtage/) as HTMLInputElement).value).toBe('15');
    expect((screen.getByLabelText(/Dose de Gypse en grammes/) as HTMLInputElement).value).toBe('0');
  });

  /*
   * ⚠️ La preuve que la correction du KCl sert : sur ce même Kölsch depuis
   * Fribourg, le bouton était bloqué et le chlorure restait 17 ppm sous son
   * minimum. Il propose maintenant.
   */
  it('⚠️ propose bien quelque chose là où il refusait — Kölsch sur eau dure', () => {
    monter({ doses: {}, styleCode: '05B', diRatioPct: 40 }, 6);
    expect(doser()).not.toBeDisabled();
  });
});

/* ---------------------------------------------------------------------------
 * L'alcalinité : ce que l'acide en fait, et ce que « Doser » en fait
 * ------------------------------------------------------------------------ */

describe('Alcalinité, acide et bouton Doser', () => {
  const champAcide = () =>
    screen.getByLabelText(/à l’empâtage, en mL/i) as HTMLInputElement;

  /*
   * ⚠️ « On a aucun visuel, vraie info là-dessus. » Le panneau montrait
   * l'alcalinité en ambre et la dose d'acide en dessous, sans jamais relier les
   * deux. La ligne « Après l'acide » dit où la dose amène l'eau.
   */
  it('⚠️ montre où l’acide amène l’alcalinité', () => {
    monter({ doses: {}, diRatioPct: 0 }, 6);
    expect(screen.getByText(/Après l’acide/)).toBeInTheDocument();
  });

  /*
   * ⚠️ LE SUR-ACIDIFIAGE, rendu possible par les doses modifiables. Le test ne
   * regardait que la borne HAUTE : une maische à -78 ppm pour une fenêtre
   * -60 à 0 s'annonçait « dans la cible ». Un pH tombé trop bas ne se rattrape
   * pas.
   */
  it('⚠️ dit quand la dose posée à la main descend SOUS la cible', () => {
    monter({ doses: {}, diRatioPct: 0, acidOverride: { mash: 15 } }, 6);
    expect(screen.getByText(/sous le repère des malts/)).toBeInTheDocument();
  });

  it('ne crie pas au sur-acidifiage sur une dose calculée', () => {
    monter({ doses: {}, diRatioPct: 0 }, 6);
    expect(screen.queryByText(/sous le repère des malts/)).not.toBeInTheDocument();
  });

  // A manual dose survives Doser. Resetting acid clears that intent while
  // preserving weighed salts; a new Doser can remove their compensation.
  it('Doser préserve l’acide manuel jusqu’au retour explicite au calcul', () => {
    monter({ doses: {}, diRatioPct: 0, acidOverride: { mash: 15 } }, 6);
    expect(champAcide().value).toBe('15');

    fireEvent.click(screen.getByRole('button', { name: /Proposer les doses/i }));

    expect(champAcide().value).toBe('15');
    fireEvent.click(screen.getByRole('button', { name: 'Revenir aux doses d’acide calculées' }));
    expect(screen.queryByRole('button', { name: 'Revenir aux doses d’acide calculées' })).not.toBeInTheDocument();
    expect(screen.queryByRole('status', { name: 'Acide manuel à l’empâtage' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Proposer les doses/i }));
    expect(champAcide().value).not.toBe('15');
  });

  /*
   * ⚠️ LES ± DE L'ACIDE, AU DOIGT. « Pour les acides je veux pouvoir sur mobile
   * les modifier sans devoir avoir à ouvrir le clavier. » Le champ seul faisait
   * monter le clavier, qui recouvrait la toile — c'est-à-dire exactement ce
   * qu'on regardait en poussant la dose.
   */
  it('⚠️ la dose d’acide se règle sans clavier, et le ± ne se confond pas avec le champ', () => {
    monter({ doses: {}, diRatioPct: 0, acidOverride: { mash: 3 } }, 6);

    /* Le champ reste seul à porter son nom : trois commandes de la même rangée
       ne doivent pas répondre à la même recherche. */
    expect(champAcide().value).toBe('3');

    /* Virgule, pas point : le champ affiche à la française — c'est ce que le
       brasseur lit sur sa pipette, et ce que `NumberInput` écrit. */
    fireEvent.click(screen.getByRole('button', { name: /Ajouter 0\.5 mL — empâtage/i }));
    expect(champAcide().value).toBe('3,5');

    fireEvent.click(screen.getByRole('button', { name: /Retirer 0\.5 mL — empâtage/i }));
    expect(champAcide().value).toBe('3');
  });
});

/* ---------------------------------------------------------------------------
 * Le bicarbonate d'une bière noire sur eau osmosée
 * ------------------------------------------------------------------------ */

describe('Une noire sur osmosée reçoit du bicarbonate, et l’écran dit jusqu’où', () => {
  /* Une vraie facture de stout : c'est elle qui plafonnait tout, en silence. */
  const STOUT = {
    grist: [
      { name: 'Pale Ale', weightKg: 4.2, colorEbc: 6 },
      { name: 'Orge torréfié', weightKg: 0.5, colorEbc: 1200 },
      { name: 'Flocons d’orge', weightKg: 0.6, colorEbc: 4 }
    ],
    totalGristKg: 5.3
  };

  /*
   * ⚠️ « Pour une stout ou une impériale, avec de l'eau très osmosée, Doser
   * n'ajoute pas de HCO₃. » Le plafond de facture visait le MILIEU de la
   * fenêtre de pH et sortait à −103 ppm : le solveur se donnait cette cible-là
   * sur une bière dont le style demande +120, ne versait rien, et n'en disait
   * pas un mot.
   */
  it('⚠️ Doser verse du bicarbonate sur une stout à l’osmosée', () => {
    monter({ doses: {}, diRatioPct: 100 }, 80, 30, STOUT);
    fireEvent.click(screen.getByRole('button', { name: /Proposer les doses/i }));

    const alcalin = ['Bicarbonate de soude', 'Chaux éteinte', 'Craie'].some((nom) => {
      const champ = screen.queryByLabelText(new RegExp(`Dose de ${nom} en grammes`)) as HTMLInputElement | null;
      return champ != null && parseFloat((champ.value || '0').replace(',', '.')) > 0;
    });
    expect(alcalin).toBe(true);
  });

  /*
   * L'autre moitié du défaut : le silence. La toile allume l'alarme du HCO₃
   * parce qu'elle compare au STYLE ; si l'app s'arrête volontairement avant,
   * elle doit le dire, sinon l'écart se lit comme une panne.
   */
  it('respecte le profil et distingue le contrôle du pH', () => {
    monter({ doses: {}, diRatioPct: 100 }, 80, 30, STOUT);
    fireEvent.click(screen.getByRole('button', { name: /Proposer les doses/i }));
    expect(screen.getByLabelText('Objectif du bicarbonate')).toHaveTextContent('Le profil d’eau choisi commande les doses');
    expect(screen.getByLabelText('Objectif du bicarbonate')).toHaveTextContent('Le respect du profil ne garantit pas le pH d’empâtage');
    expect(screen.getByText('Profil atteint : 6/6 ions dans les plages.')).toBeInTheDocument();
    expect(alertes()).not.toMatch(/la facture limite l’objectif/);
  });

  /* Sans facture, la couleur commande seule : rien ne doit plafonner. */
  it('sans facture de grain, aucun message de plafond', () => {
    monter({ doses: {}, diRatioPct: 100 }, 80);
    fireEvent.click(screen.getByRole('button', { name: /Proposer les doses/i }));
    expect(alertes()).not.toMatch(/la facture limite l’objectif/);
  });
});

/* ---------------------------------------------------------------------------
 * Les seuils ne parlent qu'au seuil
 * ------------------------------------------------------------------------ */

describe('Les avertissements de seuil, à l’écran', () => {
  const texte = () => document.body.textContent ?? '';

  it('⚠️ le seuil de sodium se tait sur une pincée de sel de table', () => {
    monter({ doses: { nacl: 0.3 } });
    expect(texte()).not.toMatch(/le goût devient franchement salé/);
  });

  it('⚠️ et il parle quand le sodium y arrive vraiment', () => {
    monter({ doses: { nacl: 10 } });
    expect(texte()).toMatch(/Sodium à \d+ ppm — repère de 150 ppm dépassé ou proche/);
  });

  /* Un fait de manipulation n'a pas de seuil : il vaut dès le premier gramme. */
  it('l’hydratation du CaCl₂ se dit dès le premier gramme', () => {
    monter({ doses: { cacl2: 0.5 } });
    expect(texte()).toMatch(/dihydrate/);
  });

  /*
   * ⚠️ « Son goût commence à se percevoir vers 0.3 g » s'affichait en
   * permanence, y compris huit fois sous le seuil.
   */
  it('⚠️ le seuil de goût de l’acide ne s’invite pas quand on en est loin', () => {
    monter({ doses: {}, diRatioPct: 100 });
    expect(texte()).toMatch(/Le plus courant/);
    expect(texte()).not.toMatch(/commence à se percevoir/);
  });
});

/* ---------------------------------------------------------------------------
 * Le curseur SO₄ ⇄ Cl dit l'eau qu'on a
 * ------------------------------------------------------------------------ */

describe('Le curseur suit les sels, et pas seulement la consigne', () => {
  const curseur = () =>
    screen.getByRole('slider', { name: /SO₄ ⇄ Cl/i }) as HTMLInputElement;
  const pouce = () => readWaterRatio(curseur());

  /*
   * ⚠️ « Je veux que le slider de ratio bouge aussi quand je change
   * manuellement les sels. »
   *
   * Il était fixé sur la consigne : pousser un gramme de gypse à la main
   * déplaçait le rapport réel sans que la poignée ne bouge d'un pixel. Encore
   * la même faute que le panneau d'alcalinité qui montrait le plan du solveur
   * au lieu de l'eau — un chiffre affiché qui ne décrit pas l'état.
   */
  it('⚠️ ajouter du gypse à la main pousse la poignée vers l’amer', () => {
    monter({ doses: { gypse: 2, cacl2: 6 }, diRatioPct: 100 });
    const avant = pouce();

    fireEvent.click(screen.getByRole('button', { name: /Ajouter 0\.5 g de Gypse/i }));
    fireEvent.click(screen.getByRole('button', { name: /Ajouter 0\.5 g de Gypse/i }));

    expect(pouce()).toBeGreaterThan(avant);
  });

  it('⚠️ et ajouter du chlorure de calcium la ramène vers le malté', () => {
    monter({ doses: { gypse: 6, cacl2: 2 }, diRatioPct: 100 });
    const avant = pouce();

    fireEvent.click(screen.getByRole('button', { name: /Ajouter 0\.5 g de Chlorure de calcium/i }));
    fireEvent.click(screen.getByRole('button', { name: /Ajouter 0\.5 g de Chlorure de calcium/i }));

    expect(pouce()).toBeLessThan(avant);
  });

  /*
   * L'autre sens ne doit pas en souffrir : tirer le curseur repose le plan, et
   * la poignée reste exactement où le doigt l'a laissée. Sans quoi elle
   * s'accrocherait à la valeur atteignable et fuirait sous le doigt.
   */
  it('tirer le curseur reste fluide — la poignée ne fuit pas', () => {
    monter({ doses: {}, diRatioPct: 100 });
    for (const v of [1, 1.5, 2, 2.5, 3]) {
      changeWaterRatio(curseur(), v);
      expect(pouce()).toBeCloseTo(v, 1);
    }
  });

  /* Et il redescend sur le réel dès qu'on retouche un sel après l'avoir tiré. */
  it('⚠️ après un glissement, une retouche à la main reprend la poignée', () => {
    monter({ doses: {}, diRatioPct: 100 });
    changeWaterRatio(curseur(), 3);
    expect(pouce()).toBeCloseTo(3, 1);

    for (let i = 0; i < 6; i += 1) {
      fireEvent.click(screen.getByRole('button', { name: /Ajouter 0\.5 g de Chlorure de calcium/i }));
    }
    expect(pouce()).toBeLessThan(3);
  });
});

// These chemistry regressions exercise the advanced controls explicitly. Compact defaults have their own interaction tests.
function render(...args:Parameters<typeof testingRender>){const view=testingRender(...args);
  for(const el of view.container.querySelectorAll('summary'))fireEvent.click(el);
  const unused=screen.queryByRole('button',{name:'Sels autorisés et inutilisés'});if(unused)fireEvent.click(unused);
  return view;
}

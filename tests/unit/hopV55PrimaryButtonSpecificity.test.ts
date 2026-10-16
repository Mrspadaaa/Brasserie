import { readdirSync, readFileSync } from 'node:fs';
import postcss, { type AtRule } from 'postcss';
import { describe, expect, it } from 'vitest';

// Le shell Page (`page.css`) habille tout `.hop-v55 button` en blanc. Un bouton d'action principale qui déclare son fond
// foncé dans sa propre feuille doit l'emporter quel que soit l'ordre de chargement des feuilles : sinon il devient
// blanc sur blanc hors survol (constat B1, #76/#77 : « Préparer l'essai » à 1,01:1).
const PRIMARY_BUTTON_CLASSES = ['hop-v55-explorer__compose', 'hv-context__primary', 'hv-doc-primary', 'hv-qualified-button'];
const SHELL_BUTTON = '.hop-v55 button';
const directory = new URL('../../src/ui/hopV55/', import.meta.url);

type Specificity = [number, number, number];
type SelectorRule = { file: string; line: number; selector: string; media: string; specificity: Specificity };

function specificity(selector: string): Specificity {
  const result: Specificity = [0, 0, 0];
  let rest = selector.replace(/:(not|is|has|where)\(([^()]*)\)/g, (_, name: string, inner: string) => {
    if (name !== 'where') {
      const highest = inner.split(',').map(part => specificity(part.trim())).reduce((a, b) => (compare(a, b) >= 0 ? a : b));
      highest.forEach((value, index) => { result[index] += value; });
    }
    return ' ';
  });
  const count = (pattern: RegExp, index: number) => { rest = rest.replace(pattern, () => { result[index] += 1; return ' '; }); };
  count(/\[[^\]]*\]/g, 1);
  count(/::[\w-]+/g, 2);
  count(/:[\w-]+(\([^)]*\))?/g, 1);
  count(/#[\w-]+/g, 0);
  count(/\.[\w-]+/g, 1);
  result[2] += rest.replace(/[>+~*]/g, ' ').split(/\s+/).filter(Boolean).length;
  return result;
}

function compare(a: Specificity, b: Specificity): number {
  return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
}

function subject(selector: string): string {
  return selector.trim().split(/\s*[>+~]\s*|\s+/).pop() ?? '';
}

function hopV55Rules(): SelectorRule[] {
  return readdirSync(directory).filter(file => file.endsWith('.css')).flatMap(file => {
    const rules: SelectorRule[] = [];
    postcss.parse(readFileSync(new URL(file, directory), 'utf8')).walkRules(rule => {
      const media = rule.parent?.type === 'atrule' ? `@${(rule.parent as AtRule).name} ${(rule.parent as AtRule).params}` : '';
      for (const selector of rule.selectors) {
        rules.push({ file, line: rule.source?.start?.line ?? 0, selector, media, specificity: specificity(selector) });
      }
    });
    return rules;
  });
}

const describeRule = (rule: SelectorRule) =>
  `${rule.file}:${rule.line} ${rule.media ? `${rule.media} ` : ''}${rule.selector} (${rule.specificity.join(',')})`;

describe('boutons principaux Houblons V5.5 face au shell `.hop-v55 button`', () => {
  const rules = hopV55Rules();
  const shell = rules.find(rule => rule.file === 'page.css' && rule.selector === SHELL_BUTTON);
  // Les modificateurs BEM (`--quiet`) comptent comme des variantes du bouton.
  const primaryRules = (className: string) =>
    rules.filter(rule => new RegExp(`\\.${className}(?:--[\\w-]+)?(?![\\w-])`).test(subject(rule.selector)));

  it('mesure la spécificité comme le navigateur', () => {
    expect(specificity(SHELL_BUTTON)).toEqual([0, 1, 1]);
    expect(specificity('.hv-context__primary:hover:not(:disabled)')).toEqual([0, 3, 0]);
    expect(specificity('.hv-context__lens > .hv-context__secondary')).toEqual([0, 2, 0]);
    expect(specificity('button[aria-pressed=true]::before')).toEqual([0, 1, 2]);
  });

  it('chaque règle d’un bouton principal l’emporte sur le shell quel que soit l’ordre des feuilles', () => {
    expect(shell, `${SHELL_BUTTON} introuvable dans page.css`).toBeDefined();
    expect(PRIMARY_BUTTON_CLASSES.filter(className => !primaryRules(className).length), 'classes introuvables').toEqual([]);
    const losing = PRIMARY_BUTTON_CLASSES.flatMap(primaryRules)
      .filter(rule => compare(rule.specificity, shell!.specificity) <= 0).map(describeRule);
    expect(losing, `règles battues par ${SHELL_BUTTON} (${shell!.specificity.join(',')})`).toEqual([]);
  });

  it('les variantes (survol, désactivé, modificateur, media) ne perdent pas contre la règle de base de leur bouton', () => {
    const isBase = (rule: SelectorRule) => !rule.media && !/:|--/.test(subject(rule.selector));
    const weaker = PRIMARY_BUTTON_CLASSES.flatMap(className => {
      const own = primaryRules(className);
      return [...new Set(own.map(rule => rule.file))].flatMap(file => {
        const inFile = own.filter(rule => rule.file === file);
        const base = inFile.filter(isBase).map(rule => rule.specificity).reduce((a, b) => (compare(a, b) >= 0 ? a : b), [0, 0, 0] as Specificity);
        return inFile.filter(rule => !isBase(rule) && compare(rule.specificity, base) < 0)
          .map(rule => `${describeRule(rule)} < base ${base.join(',')}`);
      });
    });
    expect(weaker, 'variantes plus faibles que la règle de base de leur bouton').toEqual([]);
  });
});

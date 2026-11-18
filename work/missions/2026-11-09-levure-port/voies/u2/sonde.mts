import { levure } from '../../../../../src/domain/levure/index';
import { yeastReferences } from '../../../../../src/domain/yeastReferences';
const y = yeastReferences([], { includeCatalogue: true }).find((x) => /1056/.test(x.name))!;
console.log(y.form, levure.contexte.fiche(y).forme, JSON.stringify(y.catalogue?.facts.filter((f) => /form|packag|liquid/i.test(f.key + f.reported)).map((f) => [f.key, f.reported]).slice(0, 5)));

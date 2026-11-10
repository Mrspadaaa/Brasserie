// Édition par remplacement exact, tolérante aux fins de ligne CRLF (les fichiers de src/ui/water sont en CRLF).
const fs = require('fs');
const path = require('path');
const base = path.resolve(__dirname, '../../../../../src/ui/water');
function edit(f, pairs) {
  const p = path.join(base, f);
  let s = fs.readFileSync(p, 'utf8');
  const crlf = s.includes('\r\n');
  for (let [a, b] of pairs) {
    if (crlf) { a = a.split('\n').join('\r\n'); b = b.split('\n').join('\r\n'); }
    const n = s.split(a).length - 1;
    if (n !== 1) throw new Error(f + ' occurrences=' + n + ' : ' + a.slice(0, 80));
    s = s.replace(a, () => b);
  }
  fs.writeFileSync(p, s);
}
edit('SaltDoseControl.tsx', [
  ['import { NumberInput } from "../NumberInput";\nimport { useHoldRepeat } from "../numericInput";', 'import { NumberInput } from "../NumberInput";\nimport { messageRefus, useHoldRepeat } from "../numericInput";'],
  ["            if (r.saisi > SEL_DOSE_MAX_G) { onDose(avant.current); setRefus(actualQuantityProblem(r.saisi, 0, \"g\", avant.current)); }",
    "            if (r.saisi > SEL_DOSE_MAX_G) { onDose(avant.current); setRefus(actualQuantityProblem(r.saisi, 0, \"g\", avant.current)); }\n            // BR-85 : « −1 g » ramené à 0 sans un mot. La dose d'avant est rendue et la phrase le dit.\n            else if (r.saisi < 0) { onDose(avant.current); setRefus(messageRefus(r.saisi, avant.current, { min: 0, unite: \"g\" })); }"],
]);
edit('AcidDoseControl.tsx', [
  ['import React from "react";', 'import React, { useState } from "react";'],
  ['import { useHoldRepeat, formatDecimal } from "../numericInput";', 'import { useHoldRepeat, formatDecimal, messageRefus } from "../numericInput";'],
  ["  const doseStatus = status ?? (force ? \"manual\" : \"calculated\");", "  const doseStatus = status ?? (force ? \"manual\" : \"calculated\");\n  // BR-85 : une dose négative est refusée et dite (« −1 mL : une valeur négative n’existe pas ici. La valeur précédente … »).\n  const [refus, setRefus] = useState<string | null>(null);"],
  ["          min={0}\n          value={amount}\n          disabled={disabled}\n          onValue={onDose}\n          pad",
    "          min={0}\n          rejeter\n          onRefus={(r) => setRefus(r ? messageRefus(r.saisi, r.retenu, { min: 0, unite: unit }) : null)}\n          value={amount}\n          disabled={disabled}\n          onValue={onDose}\n          pad"],
  ["      {hco3 != null && <p aria-label", '      {refus && <p role="alert" data-role="refus" className="mt-0.5 text-xs leading-4 text-alert-strong">{refus}</p>}\n      {hco3 != null && <p aria-label'],
]);
edit('WaterDilution.tsx', [
  ['import { NumberInput } from "../NumberInput";\nimport { formatDecimal } from "../numericInput";', 'import { useState } from "react";\nimport { NumberInput } from "../NumberInput";\nimport { formatDecimal, messageRefus } from "../numericInput";'],
  ["}: Props) {\n  return (", "}: Props) {\n  // BR-80 : une borne (1000 L) appliquée pendant la frappe laissait « 10009 » dans le champ ; la saisie hors bornes est refusée et dite.\n  const [refusRo, setRefusRo] = useState<string | null>(null);\n  return ("],
  ["                min={0}\n                max={1000}\n                emptyValue={undefined}", "                min={0}\n                max={1000}\n                rejeter\n                onRefus={(r) => setRefusRo(r ? messageRefus(r.saisi, r.retenu, { min: 0, max: 1000, unite: \"L\" }) : null)}\n                emptyValue={undefined}"],
  ["            </label>\n            <p className=\"text-cave-400\">\n              Empâtage et rinçage réunis.", "            </label>\n            {refusRo && <p role=\"alert\" data-role=\"refus\" className=\"text-xs text-alert-strong\">{refusRo}</p>}\n            <p className=\"text-cave-400\">\n              Empâtage et rinçage réunis."],
]);
edit('WaterVolumes.tsx', [
  ["import { InlineNum } from \"../FormNav\";\nimport { NumberInput } from '../NumberInput';", "import { useState } from \"react\";\nimport { InlineNum } from \"../FormNav\";\nimport { NumberInput } from '../NumberInput';\nimport { messageRefus } from \"../numericInput\";"],
  ["  const litres = (n: number) =>", "  // BR-84 : « 2,5 » tapé revenait « 2,51 » (recalculé depuis le volume arrondi au dixième). Le nombre tapé reste affiché tant que\n  // le volume qu'il donne (ratio × grain, au dixième) est celui du plan ; BR-85 : « −1 L/kg » est refusé et dit.\n  const [ratioSaisi, setRatioSaisi] = useState<number | null>(null);\n  const [refusRatio, setRefusRatio] = useState<string | null>(null);\n  const litres = (n: number) =>"],
  ["  const ratioMax = Math.max(", "  const ratioAffiche = ratioSaisi !== null && Number.isFinite(state.mashWaterL) && grainKg > 0 && r1(ratioSaisi * grainKg) === r1(state.mashWaterL)\n    ? ratioSaisi\n    : Number(mashRatioLPerKg.toPrecision(15));\n  const ratioMax = Math.max("],
  ["value={Number(mashRatioLPerKg.toPrecision(15))} fractionDigits={2} onValue={onMashRatioChange} min={0.1} className", "value={ratioAffiche} fractionDigits={2} onValue={(v) => { setRatioSaisi(v); onMashRatioChange(v); }} min={0.1} rejeter onRefus={(r) => setRefusRatio(r ? messageRefus(r.saisi, r.retenu, { min: 0.1, unite: \"L/kg\" }) : null)} className"],
  ["            <input\n              id=\"w-mash-ratio\"", "            {refusRatio && <p role=\"alert\" data-role=\"refus\" className=\"text-xs text-alert-strong\">{refusRatio}</p>}\n            <input\n              id=\"w-mash-ratio\""],
  ["onChange={(e) => onMashRatioChange(parseFloat(e.target.value))}", "onChange={(e) => { setRatioSaisi(null); onMashRatioChange(parseFloat(e.target.value)); }}"],
]);
console.log('ok');

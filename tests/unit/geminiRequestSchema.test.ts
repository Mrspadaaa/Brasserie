import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { brewerCatalogueToolDeclarations } from '../../functions/src/brewerCatalogueTools';
import { investmentTool } from '../../functions/src/brewerFinanceTools';
import { BREWER_HOP_ADVICE_SEMANTIC_FINISH_DECLARATION_V5 } from '../../functions/src/brewerHopAdviceSemanticV3';
import { brewerHopAdviceFinishDeclaration } from '../../functions/src/brewerHopAdviceProposal';
import { brewerScenarioStoreToolDeclarations } from '../../functions/src/brewerScenarioTools';
import {
  encodeGeminiFunctionDeclarationForRest,
  encodeGeminiToolsForRest,
} from '../../functions/src/geminiRequestSchema';

type Schema = Record<string, any>;
type JsonRecord = Record<string, unknown>;
const LEGACY_CAPTURE = {
  // Archived provider body receipt; only the old finish schema digest is embedded as a test input.
  requestSha256: 'cea6f132fee64b4a7fb63acf7a116bc88c76fcba3f1e6457ae5981a062049c60',
  requestBytes: 38860,
  functionDeclarations: 15,
  finishSchemaSha256: '761c7dc483dfb7fff884ca67471b21d26c77ad5626fdde538e89ebffce6da6cc',
};

function countKey(value: unknown, key: string): number {
  if (Array.isArray(value)) return value.reduce((sum, child) => sum + countKey(child, key), 0);
  if (!value || typeof value !== 'object') return 0;
  const record = value as Record<string, unknown>;
  return Object.entries(record).reduce((sum, [childKey, child]) =>
    sum + Number(childKey === key) + countKey(child, key), 0);
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical((value as Record<string, unknown>)[key])]));
  }
  return value;
}

function canonicalHash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
}

function schemaTypes(value: unknown): unknown[] {
  if (Array.isArray(value)) return value.flatMap(schemaTypes);
  if (!value || typeof value !== 'object') return [];
  const record = value as Record<string, unknown>;
  return Object.entries(record).flatMap(([key, child]) => [
    ...(key === 'type' ? Array.isArray(child) ? child : [child] : []),
    ...schemaTypes(child),
  ]);
}

const hasOwn = (value: object, key: string) => Object.prototype.hasOwnProperty.call(value, key);
const typeMatches = (value: unknown, type: string) => {
  switch (type) {
    case 'OBJECT': case 'object': return value !== null && typeof value === 'object' && !Array.isArray(value);
    case 'ARRAY': case 'array': return Array.isArray(value);
    case 'STRING': case 'string': return typeof value === 'string';
    case 'NUMBER': case 'number': return typeof value === 'number' && Number.isFinite(value);
    case 'INTEGER': case 'integer': return typeof value === 'number' && Number.isSafeInteger(value);
    case 'BOOLEAN': case 'boolean': return typeof value === 'boolean';
    case 'NULL': case 'null': return value === null;
    default: return false;
  }
};

function enumContains(values: unknown[], value: unknown): boolean {
  return values.some((candidate) => Object.is(candidate, value));
}

/** Tiny independent evaluator for the subset used in the parity fixture below. */
function acceptsSchema(schema: Schema, value: unknown, dialect: 'gemini' | 'json'): boolean {
  if (Array.isArray(schema.anyOf) && !schema.anyOf.some((branch: Schema) => acceptsSchema(branch, value, dialect))) return false;
  const types = Array.isArray(schema.type) ? schema.type : [schema.type];
  if (schema.type !== undefined && !types.some((type: string) => typeMatches(value, type))) {
    if (!(dialect === 'gemini' && schema.nullable === true && value === null)) return false;
  }
  if (Array.isArray(schema.enum) && !(dialect === 'gemini' && value === null) && !enumContains(schema.enum, value)) return false;
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) return false;
    if (schema.maxLength !== undefined && value.length > schema.maxLength) return false;
  }
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) return false;
    if (schema.maximum !== undefined && value > schema.maximum) return false;
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) return false;
    if (schema.maxItems !== undefined && value.length > schema.maxItems) return false;
    if (schema.items && !value.every((item) => acceptsSchema(schema.items, item, dialect))) return false;
  }
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as JsonRecord;
    if (Array.isArray(schema.required) && !schema.required.every((key: string) => hasOwn(record, key))) return false;
    const properties = schema.properties && typeof schema.properties === 'object' ? schema.properties as Record<string, Schema> : {};
    if (schema.additionalProperties === false && Object.keys(record).some((key) => !hasOwn(properties, key))) return false;
    for (const [key, childSchema] of Object.entries(properties)) {
      if (hasOwn(record, key) && !acceptsSchema(childSchema, record[key], dialect)) return false;
    }
  }
  return true;
}

describe('FunctionDeclaration -> GenerateContent REST JSON Schema', () => {
  it('converts the real V5 finish schema without losing its closed objects, nullable enums, or bounds', () => {
    const before = structuredClone(BREWER_HOP_ADVICE_SEMANTIC_FINISH_DECLARATION_V5);
    const encoded = encodeGeminiFunctionDeclarationForRest(BREWER_HOP_ADVICE_SEMANTIC_FINISH_DECLARATION_V5);
    const schema = encoded.parametersJsonSchema as Schema;

    expect(BREWER_HOP_ADVICE_SEMANTIC_FINISH_DECLARATION_V5).toEqual(before);
    expect(encoded.name).toBe(BREWER_HOP_ADVICE_SEMANTIC_FINISH_DECLARATION_V5.name);
    expect(encoded.description).toBe(BREWER_HOP_ADVICE_SEMANTIC_FINISH_DECLARATION_V5.description);
    expect(encoded).not.toHaveProperty('parameters');
    expect(schema.type).toBe('object');
    expect(countKey(schema, 'additionalProperties')).toBe(26);
    expect(countKey(schema, 'additionalProperties')).toBe(countKey(BREWER_HOP_ADVICE_SEMANTIC_FINISH_DECLARATION_V5.parameters, 'additionalProperties'));
    expect(schemaTypes(schema).every((type) => typeof type === 'string' && type === type.toLowerCase())).toBe(true);

    const intent = schema.properties.propertyIntentProposals.items.properties.intent;
    expect(intent.properties.qualification.anyOf).toEqual([{ type: 'string' }, { type: 'null' }]);
    expect(intent.properties.subject.properties.materialId.anyOf).toEqual([{ type: 'string' }, { type: 'null' }]);
    const direction = schema.properties.semanticRevisionProposals.items.properties.proposedFields.properties.direction;
    expect(direction.anyOf).toEqual([
      { type: 'string', enum: ['increase', 'decrease', 'keep', 'exclude', 'investigate'] },
      { type: 'null' },
    ]);
    const sourceDirection = (BREWER_HOP_ADVICE_SEMANTIC_FINISH_DECLARATION_V5.parameters as Schema)
      .properties.semanticRevisionProposals.items.properties.proposedFields.properties.direction;
    for (const [value, accepted] of [[null, true], ['increase', true], ['other', false]] as const) {
      expect(acceptsSchema(sourceDirection, value, 'gemini')).toBe(accepted);
      expect(acceptsSchema(direction, value, 'json')).toBe(accepted);
    }
    expect(schema.properties.propertyIntentProposals.maxItems).toBe(12);
    expect(schema.properties.semanticRevisionProposals.items.properties.sourceSpans.minItems).toBe(1);
    expect(schema.properties.semanticRevisionProposals.items.properties.sourceSpans.maxItems).toBe(10);
    expect(schema.properties.answer.properties.options.minItems).toBeUndefined();
  });

  it('preserves acceptance and rejection for nullable, required, closed-object, and exact numeric bounds', () => {
    const declaration = {
      name: 'check_schema_parity',
      description: 'Fixture locale de parité.',
      parameters: {
        type: 'OBJECT', additionalProperties: false, required: ['name', 'shade', 'rows'], properties: {
          name: { type: 'STRING', minLength: 2, maxLength: 8 },
          shade: { type: 'STRING', nullable: true, enum: ['light', 'dark'] },
          rows: { type: 'ARRAY', minItems: 1, maxItems: 2, items: { type: 'INTEGER', minimum: 2, maximum: 4 } },
        },
      },
    };
    const encoded = encodeGeminiFunctionDeclarationForRest(declaration).parametersJsonSchema as Schema;
    expect(encoded.properties.shade.anyOf).toEqual([
      { type: 'string', enum: ['light', 'dark'] },
      { type: 'null' },
    ]);
    const cases: Array<[string, unknown, boolean]> = [
      ['valeur complète avec null nullable', { name: 'März', shade: null, rows: [2, 4] }, true],
      ['valeur enum de chaîne', { name: 'Lager', shade: 'light', rows: [3] }, true],
      ['clé requise absente', { name: 'Lager', shade: null }, false],
      ['valeur nullable absente', { name: 'Lager', rows: [3] }, false],
      ['clé supplémentaire refusée', { name: 'Lager', shade: null, rows: [3], extra: true }, false],
      ['enum inconnue refusée', { name: 'Lager', shade: 'ambre', rows: [3] }, false],
      ['type non nullable refusé', { name: 'Lager', shade: 4, rows: [3] }, false],
      ['minItems conservé', { name: 'Lager', shade: null, rows: [] }, false],
      ['maxItems conservé', { name: 'Lager', shade: null, rows: [2, 3, 4] }, false],
      ['minimum conservé', { name: 'Lager', shade: null, rows: [1] }, false],
      ['maximum conservé', { name: 'Lager', shade: null, rows: [5] }, false],
      ['minLength conservé', { name: 'A', shade: null, rows: [3] }, false],
      ['maxLength conservé', { name: '123456789', shade: null, rows: [3] }, false],
    ];

    for (const [label, value, expected] of cases) {
      expect(acceptsSchema(declaration.parameters, value, 'gemini'), label).toBe(expected);
      expect(acceptsSchema(encoded, value, 'json'), label).toBe(expected);
    }
  });

  it('encodes catalogue, scenario, and finance declarations while retaining their names and parameter constraints', () => {
    const declarations = [...brewerCatalogueToolDeclarations, ...brewerScenarioStoreToolDeclarations, investmentTool];
    const before = structuredClone(declarations);
    const encoded = declarations.map(encodeGeminiFunctionDeclarationForRest);

    expect(declarations).toEqual(before);
    expect(encoded.map((item) => item.name)).toEqual(declarations.map((item) => item.name));
    expect(encoded.map((item) => item.description)).toEqual(declarations.map((item) => item.description));
    expect(encoded.every((item) => !Object.hasOwn(item, 'parameters') && (item.parametersJsonSchema as Schema).type === 'object')).toBe(true);
    const lookup = encoded.find((item) => item.name === 'lookup_brewing_catalogue')!.parametersJsonSchema as Schema;
    expect(lookup.properties.kind.enum).toEqual(['hopVariety', 'yeastStrain', 'brewingStyle']);
    const investment = encoded.find((item) => item.name === 'simulate_brewery_investment')!.parametersJsonSchema as Schema;
    expect(investment.properties.purchaseCents.minimum).toBe(0);
    expect(investment.properties.purchaseCents.maximum).toBe(100_000_000);
    expect(investment.properties.annualSavingsCents.minimum).toBe(0);
    expect(investment.properties.annualSavingsCents.maximum).toBe(100_000_000);
  });

  it('keeps a legacy V4 declaration without adding unsupported keywords', () => {
    const legacy = structuredClone(brewerHopAdviceFinishDeclaration);
    expect(canonicalHash(legacy.parameters)).toBe(LEGACY_CAPTURE.finishSchemaSha256);
    expect(countKey(legacy.parameters, 'additionalProperties')).toBe(0);
    const encoded = encodeGeminiFunctionDeclarationForRest(legacy);
    expect(countKey(encoded.parametersJsonSchema, 'additionalProperties')).toBe(0);
    expect(encoded.name).toBe(legacy.name);
    expect(encoded.description).toBe(legacy.description);
    expect(encoded).not.toHaveProperty('parameters');
  });

  it('does not recode explicit JSON Schema and rejects mutually exclusive or nonrepresentable source schemas', () => {
    const explicit = {
      name: 'already_json_schema',
      description: 'Déjà en JSON Schema.',
      behavior: 'BLOCKING',
      parametersJsonSchema: {
        type: 'object', additionalProperties: false, required: ['maybe'],
        properties: { maybe: { type: ['string', 'null'], anyOf: [{ type: 'string', minLength: 3 }, { type: 'null' }] } },
      },
      responseJsonSchema: { type: 'object', properties: { status: { type: 'string' } } },
    };
    const before = structuredClone(explicit);
    const encoded = encodeGeminiFunctionDeclarationForRest(explicit);
    expect(encoded).toEqual(before);
    expect(encoded.parametersJsonSchema).not.toBe(explicit.parametersJsonSchema);
    expect(explicit).toEqual(before);

    expect(() => encodeGeminiFunctionDeclarationForRest({
      name: 'both', parameters: { type: 'OBJECT' }, parametersJsonSchema: { type: 'object' },
    })).toThrow(/exclusifs/u);
    expect(() => encodeGeminiFunctionDeclarationForRest({
      name: 'unknown', parameters: { type: 'OBJECT', properties: { x: { type: 'STRING', unsupportedConstraint: 1 } } },
    })).toThrow(/unsupportedConstraint/u);
    expect(() => encodeGeminiFunctionDeclarationForRest({
      name: 'example', parameters: { type: 'OBJECT', example: { x: 'y' } },
    })).toThrow(/example/u);
    expect(() => encodeGeminiFunctionDeclarationForRest({
      name: 'unsafe_bound', parameters: { type: 'OBJECT', properties: { rows: { type: 'ARRAY', maxItems: 9_007_199_254_740_992 } } },
    })).toThrow(/exacte/u);
    expect(() => encodeGeminiFunctionDeclarationForRest({
      name: 'json_in_openapi_slot', parameters: { type: 'object', properties: {} },
    })).toThrow(/parametersJsonSchema/u);
    const noParameters = {
      name: 'no_parameters', description: 'Aucun argument.', behavior: 'BLOCKING',
      response: { type: 'OBJECT', properties: { status: { type: 'STRING' } } },
    };
    expect(encodeGeminiFunctionDeclarationForRest(noParameters)).toEqual(noParameters);
  });

  it('encodes only FunctionDeclarations and leaves the rest of a fake request body untouched', () => {
    const body = {
      systemInstruction: { parts: [{ text: 'Faux contexte de test.' }] },
      contents: [{ role: 'user', parts: [{ text: 'Question fixture.' }] }],
      toolConfig: { functionCallingConfig: { mode: 'ANY' } },
      generationConfig: { temperature: 0.2, maxOutputTokens: 4000, thinkingConfig: { thinkingLevel: 'low' } },
      tools: [
        { functionDeclarations: [BREWER_HOP_ADVICE_SEMANTIC_FINISH_DECLARATION_V5], description: 'tool-metadata' },
        { googleSearch: {}, regionHint: 'test-only' },
      ],
    };
    const before = structuredClone(body);
    const encodedBody = { ...body, tools: encodeGeminiToolsForRest(body.tools) };

    expect(body).toEqual(before);
    expect(encodedBody.systemInstruction).toEqual(body.systemInstruction);
    expect(encodedBody.contents).toEqual(body.contents);
    expect(encodedBody.toolConfig).toEqual(body.toolConfig);
    expect(encodedBody.generationConfig).toEqual(body.generationConfig);
    const firstTool = encodedBody.tools[0] as { description: string; functionDeclarations: Array<Record<string, unknown>> };
    expect(firstTool).toMatchObject({ description: 'tool-metadata' });
    expect(firstTool.functionDeclarations[0]).toMatchObject({
      name: BREWER_HOP_ADVICE_SEMANTIC_FINISH_DECLARATION_V5.name,
      description: BREWER_HOP_ADVICE_SEMANTIC_FINISH_DECLARATION_V5.description,
    });
    expect(firstTool.functionDeclarations[0]).toHaveProperty('parametersJsonSchema');
    expect(encodedBody.tools[1]).toEqual(body.tools[1]);
  });
});

type GeminiSchemaType = 'OBJECT' | 'ARRAY' | 'STRING' | 'NUMBER' | 'INTEGER' | 'BOOLEAN' | 'NULL';
type JsonSchemaType = 'object' | 'array' | 'string' | 'number' | 'integer' | 'boolean' | 'null';
type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
type RecordValue = Record<string, unknown>;

const JSON_SCHEMA_TYPE: Record<GeminiSchemaType, JsonSchemaType> = {
  OBJECT: 'object', ARRAY: 'array', STRING: 'string', NUMBER: 'number',
  INTEGER: 'integer', BOOLEAN: 'boolean', NULL: 'null',
};

const GEMINI_SCHEMA_KEYS = new Set([
  'type', 'format', 'title', 'description', 'nullable', 'enum',
  'maxItems', 'minItems', 'properties', 'required', 'minProperties', 'maxProperties',
  'minLength', 'maxLength', 'pattern', 'example', 'anyOf', 'propertyOrdering', 'default',
  'items', 'minimum', 'maximum',
  // These fields belong to JSON Schema, not Gemini Schema; the V5 declaration uses
  // additionalProperties and must move intact into parametersJsonSchema.
  'additionalProperties',
]);

function fail(path: string, reason: string): never {
  throw new TypeError(`Gemini FunctionDeclaration non convertible (${path}): ${reason}`);
}

function isRecord(value: unknown): value is RecordValue {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/** Clone only values JSON can actually send; never let JSON.stringify silently drop fields. */
function cloneJson(value: unknown, path: string, ancestors = new Set<object>()): JsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (Array.isArray(value)) {
    if (ancestors.has(value)) return fail(path, 'référence cyclique');
    ancestors.add(value);
    const result = value.map((entry, index) => cloneJson(entry, `${path}[${index}]`, ancestors));
    ancestors.delete(value);
    return result;
  }
  if (isRecord(value)) {
    if (ancestors.has(value)) return fail(path, 'référence cyclique');
    ancestors.add(value);
    const result = Object.fromEntries(Object.entries(value).map(([key, entry]) => [
      key, cloneJson(entry, `${path}.${key}`, ancestors),
    ]));
    ancestors.delete(value);
    return result;
  }
  return fail(path, 'valeur non JSON (undefined, BigInt, fonction ou objet spécial)');
}

function schemaRecord(value: unknown, path: string): RecordValue {
  if (!isRecord(value)) return fail(path, 'un objet Schema est requis');
  for (const key of Object.keys(value)) {
    if (!GEMINI_SCHEMA_KEYS.has(key)) fail(`${path}.${key}`, 'clé Schema inconnue ou non représentable');
  }
  return value;
}

function stringArray(value: unknown, path: string): string[] {
  if (!Array.isArray(value) || !value.every((entry) => typeof entry === 'string')) {
    return fail(path, 'un tableau de chaînes est requis');
  }
  return [...value];
}

function integerLimit(value: unknown, path: string): number {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) return value;
  if (typeof value === 'string' && /^(0|[1-9]\d*)$/u.test(value)) {
    const parsed = Number(value);
    if (Number.isSafeInteger(parsed)) return parsed;
  }
  return fail(path, 'la borne entière doit rester exacte et sûre en JSON');
}

function geminiTypes(value: unknown, path: string): GeminiSchemaType[] {
  const values = Array.isArray(value) ? value : [value];
  if (values.length === 0 || !values.every((entry) => typeof entry === 'string' && Object.hasOwn(JSON_SCHEMA_TYPE, entry))) {
    return fail(`${path}.type`, 'type OpenAPI Gemini inconnu; place un schéma JSON existant dans parametersJsonSchema');
  }
  if (new Set(values).size !== values.length) return fail(`${path}.type`, 'types dupliqués');
  return values as GeminiSchemaType[];
}

function encodeSchema(value: unknown, path: string): RecordValue {
  const source = schemaRecord(value, path);
  if (!Object.hasOwn(source, 'type')) return fail(`${path}.type`, 'type requis');
  const types = geminiTypes(source.type, path);
  const nullable = Object.hasOwn(source, 'nullable') ? source.nullable : false;
  if (typeof nullable !== 'boolean') return fail(`${path}.nullable`, 'booléen requis');
  if (nullable && !types.includes('NULL')) types.push('NULL');
  const enumValues = Object.hasOwn(source, 'enum') ? source.enum : undefined;
  if (enumValues !== undefined) {
    if (!Array.isArray(enumValues) || !enumValues.every((entry) => typeof entry === 'string' || entry === null)) {
      return fail(`${path}.enum`, 'enum Gemini doit contenir des chaînes (et null seulement si nullable/type NULL l’autorise)');
    }
    if (enumValues.includes(null) && !types.includes('NULL')) {
      return fail(`${path}.enum`, 'enum contient null sans type NULL ou nullable');
    }
    if (enumValues.some((entry) => typeof entry === 'string') && !types.includes('STRING')) {
      return fail(`${path}.enum`, 'enum de chaînes sans branche STRING');
    }
  }

  const output: RecordValue = {};
  for (const [key, item] of Object.entries(source)) {
    if (key === 'type' || key === 'nullable' || key === 'enum') continue;
    const itemPath = `${path}.${key}`;
    switch (key) {
      case 'properties': {
        if (!isRecord(item)) return fail(itemPath, 'objet properties requis');
        output.properties = Object.fromEntries(Object.entries(item).map(([name, child]) => [
          name, encodeSchema(child, `${itemPath}.${name}`),
        ]));
        break;
      }
      case 'items':
        output.items = encodeSchema(item, itemPath);
        break;
      case 'anyOf': {
        if (!Array.isArray(item) || item.length === 0) return fail(itemPath, 'anyOf non vide requis');
        output.anyOf = item.map((child, index) => encodeSchema(child, `${itemPath}[${index}]`));
        break;
      }
      case 'additionalProperties':
        output.additionalProperties = typeof item === 'boolean' ? item : encodeSchema(item, itemPath);
        break;
      case 'required':
      case 'propertyOrdering':
        output[key] = stringArray(item, itemPath);
        break;
      case 'minItems': case 'maxItems': case 'minProperties': case 'maxProperties':
      case 'minLength': case 'maxLength':
        output[key] = integerLimit(item, itemPath);
        break;
      case 'minimum': case 'maximum':
        if (typeof item !== 'number' || !Number.isFinite(item)) return fail(itemPath, 'borne numérique finie requise');
        output[key] = item;
        break;
      case 'format': case 'title': case 'description': case 'pattern':
        if (typeof item !== 'string') return fail(itemPath, 'chaîne requise');
        output[key] = item;
        break;
      case 'default':
        output.default = cloneJson(item, itemPath);
        break;
      default:
        // example is a Gemini Schema field without an equivalent supported by this JSON Schema wire.
        return fail(itemPath, 'champ connu dans Gemini Schema mais non représentable dans parametersJsonSchema');
    }
  }

  if (types.length === 1) {
    output.type = JSON_SCHEMA_TYPE[types[0]];
    if (enumValues !== undefined) output.enum = enumValues.map((entry, index) => cloneJson(entry, `${path}.enum[${index}]`));
    return output;
  }

  // Gemini Schema.enum constrains STRING values. Its nullable/NULL type remains
  // independently valid, so split the union before using JSON Schema's global enum.
  const branches = types.map((type) => {
    const branch = cloneJson(output, `${path}.branch.${type}`) as RecordValue;
    branch.type = JSON_SCHEMA_TYPE[type];
    if (type === 'STRING' && enumValues !== undefined) {
      branch.enum = enumValues.filter((entry) => typeof entry === 'string');
    }
    return branch;
  });
  return { anyOf: branches };
}

/** Convert the OpenAPI-style `parameters` field into Gemini's explicit JSON Schema wire field. */
function encodeParameters(parameters: unknown): RecordValue {
  const root = schemaRecord(parameters, 'parameters');
  if (root.type !== 'OBJECT') {
    return fail('parameters.type', 'la racine FunctionDeclaration doit être OBJECT; le JSON Schema doit utiliser parametersJsonSchema');
  }
  const result = encodeSchema(root, 'parameters');
  if (result.type !== 'object') return fail('parameters.type', 'la racine encodée doit rester object');
  return result;
}

/**
 * Encode one declaration for GenerateContent REST without changing its domain value.
 * Explicit parametersJsonSchema is cloned byte-for-byte semantically, never recoded.
 */
export function encodeGeminiFunctionDeclarationForRest(declaration: unknown): Record<string, unknown> {
  if (!isRecord(declaration)) return fail('functionDeclaration', 'un objet est requis');
  const hasParameters = Object.hasOwn(declaration, 'parameters');
  const hasJsonSchema = Object.hasOwn(declaration, 'parametersJsonSchema');
  if (hasParameters && hasJsonSchema) return fail('functionDeclaration', 'parameters et parametersJsonSchema sont exclusifs');

  const encoded = cloneJson(declaration, 'functionDeclaration') as Record<string, unknown>;
  if (hasJsonSchema) {
    if (!isRecord(declaration.parametersJsonSchema)) return fail('parametersJsonSchema', 'objet JSON Schema requis');
    return encoded;
  }
  if (hasParameters) {
    encoded.parametersJsonSchema = encodeParameters(declaration.parameters);
    delete encoded.parameters;
  }
  return encoded;
}

/** Map only FunctionDeclaration members; other Gemini Tool fields and order are preserved. */
export function encodeGeminiToolsForRest(tools: readonly unknown[]): unknown[] {
  if (!Array.isArray(tools)) return fail('tools', 'tableau d’outils requis');
  return tools.map((tool, toolIndex) => {
    if (!isRecord(tool)) return fail(`tools[${toolIndex}]`, 'objet Tool requis');
    const encoded = cloneJson(tool, `tools[${toolIndex}]`) as Record<string, unknown>;
    if (!Object.hasOwn(tool, 'functionDeclarations')) return encoded;
    if (!Array.isArray(tool.functionDeclarations)) return fail(`tools[${toolIndex}].functionDeclarations`, 'tableau requis');
    encoded.functionDeclarations = tool.functionDeclarations.map((declaration, index) =>
      encodeGeminiFunctionDeclarationForRest(declaration));
    return encoded;
  });
}

export enum Type {
  ObjectId = 'ObjectId',
  Date = 'date',
  Boolean = 'boolean',

  Number = 'number',
  Integer = 'integer',
  String = 'string',
  Text = 'text',

  Object = 'object',
  Array = 'array',
  Primitives =  'primitives',
  Binary = 'binary'
}

export interface Metadata {
  name?: string;
  attributes: any;
  source?: string;
  model?: any;
  schema?: any;
}

export interface Attribute {
  name: string;
  field: string;
  type: Type;
  key?: boolean;
  ignored?: boolean;
  typeof?: Metadata;
}

export interface MetaModel {
  model: Metadata;
  attributeName?: string;
  keys?: string[];
  dateFields?: string[];
  objectFields?: MetaModel[];
  arrayFields?: MetaModel[];
}

export function build(model: Metadata): MetaModel {
  if (model && !model.source) {
    model.source = model.name;
  }
  const primaryKeys: string[] = new Array<string>();
  const dateFields = new Array<string>();
  const objectFields = new Array<MetaModel>();
  const arrayFields = new Array<MetaModel>();
  const keys: string[] = Object.keys(model.attributes);
  for (const key of keys) {
    const attr: Attribute = model.attributes[key];
    if (attr) {
      attr.name = key;
      if (attr.ignored !== true) {
        if (attr.key === true) {
          primaryKeys.push(attr.name);
        }
      }

      switch (attr.type) {
        case Type.Date: {
          dateFields.push(attr.name);
          break;
        }
        case Type.Object: {
          if (attr.typeof) {
            const x = this.build(attr.typeof);
            x.attributeName = key;
            objectFields.push(x);
          }
          break;
        }
        case Type.Array: {
          if (attr.typeof) {
            const y = this.build(attr.typeof);
            y.attributeName = key;
            arrayFields.push(y);
          }
          break;
        }
        default:
          break;
      }
    }
  }
  const metadata: MetaModel = {model};
  if (primaryKeys.length > 0) {
    metadata.keys = primaryKeys;
  }
  if (dateFields.length > 0) {
    metadata.dateFields = dateFields;
  }
  if (objectFields.length > 0) {
    metadata.objectFields = objectFields;
  }
  if (arrayFields.length > 0) {
    metadata.arrayFields = arrayFields;
  }
  return metadata;
}

export function keys(model: Metadata): string[] {
  const keys: string[] = Object.keys(model.attributes);
  const primaryKeys: string[] = [];
  for (const key of keys) {
    const attr: Attribute = model.attributes[key];
    if (attr && attr.ignored !== true && attr.key === true && attr.name && attr.name.length > 0) {
      primaryKeys.push(attr.name);
    }
  }
  return primaryKeys;
}

const _datereg = '/Date(';
const _re = /-?\d+/;

function jsonToDate(obj, fields: string[]) {
  if (!obj || !fields) {
    return obj;
  }
  if (!Array.isArray(obj)) {
    for (const field of fields) {
      const val = obj[field];
      if (val && !(val instanceof Date)) {
        obj[field] = toDate(val);
      }
    }
  }
}

function toDate(v: any): Date {
  if (!v || v === '') {
    return null;
  }
  if (v instanceof Date) {
    return v;
  } else if (typeof v === 'number') {
    return new Date(v);
  }
  const i = v.indexOf(_datereg);
  if (i >= 0) {
    const m = _re.exec(v);
    const d = parseInt(m[0], null);
    return new Date(d);
  } else {
    if (isNaN(v)) {
      return new Date(v);
    } else {
      const d = parseInt(v, null);
      return new Date(d);
    }
  }
}

export function json(obj: any, meta: MetaModel): void {
  jsonToDate(obj, meta.dateFields);
  if (meta.objectFields) {
    for (const objectField of meta.objectFields) {
      if (obj[objectField.attributeName]) {
        json(obj[objectField.attributeName], objectField);
      }
    }
  }
  if (meta.arrayFields) {
    for (const arrayField of meta.arrayFields) {
      if (obj[arrayField.attributeName]) {
        const arr = obj[arrayField.attributeName];
        if (Array.isArray(arr)) {
          for (const a of arr) {
            json(a, arrayField);
          }
        }
      }
    }
  }
}
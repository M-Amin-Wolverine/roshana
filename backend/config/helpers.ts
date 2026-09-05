/**
 * Roshana Enterprise Configuration System Helpers
 */

export function deepFreeze<T extends object>(obj: T): T {
  Object.freeze(obj);
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const value = (obj as any)[prop];
    if (
      value !== null &&
      (typeof value === 'object' || typeof value === 'function') &&
      !Object.isFrozen(value)
    ) {
      deepFreeze(value);
    }
  });
  return obj;
}

export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(deepClone) as any;
  }
  const clone = {} as any;
  for (const key of Object.keys(obj as object)) {
    clone[key] = deepClone((obj as any)[key]);
  }
  return clone;
}

export function mergeDeep<T extends Record<string, any>>(target: T, ...sources: Array<Record<string, any>>): T {
  if (!sources.length) return target;
  const source = sources.shift();
  const targetObj = target as any;

  if (source !== undefined) {
    Object.keys(source).forEach((key) => {
      const targetValue = targetObj[key];
      const sourceValue = source[key];

      if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
        targetObj[key] = Array.from(new Set([...targetValue, ...sourceValue])) as any;
      } else if (
        targetValue &&
        typeof targetValue === 'object' &&
        sourceValue &&
        typeof sourceValue === 'object'
      ) {
        targetObj[key] = mergeDeep({ ...targetValue }, sourceValue);
      } else {
        targetObj[key] = sourceValue;
      }
    });
  }

  return mergeDeep(targetObj, ...sources);
}

export function getNestedValue(obj: any, pathStr: string, defaultValue: any = null): any {
  const keys = pathStr.split('.');
  let current = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return defaultValue;
    }
  }

  return current !== undefined ? current : defaultValue;
}

export function castValue(value: any, type: string): any {
  if (value === undefined || value === null) {
    return null;
  }

  switch (type) {
    case 'number': {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? null : parsed;
    }
    case 'boolean': {
      return ['true', '1', 'yes', 'on', true].includes(value);
    }
    case 'array': {
      if (Array.isArray(value)) {
        return value;
      }
      return String(value)
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
    }
    case 'string':
      return String(value);
    default:
      return value;
  }
}

export function sanitizeConfig(config: any, schema: any): any {
  const cloned = deepClone(config);

  const traverse = (data: any, rules: any) => {
    if (!data || typeof data !== 'object') return;

    for (const key of Object.keys(rules)) {
      const rule = rules[key];
      if (!rule) continue;

      if (rule.sensitive && data[key] !== undefined && data[key] !== '') {
        data[key] = '••••••••';
      }

      // Check nested schema fields
      if (rule.fields && data[key] && typeof data[key] === 'object') {
        traverse(data[key], rule.fields);
      }
    }
  };

  traverse(cloned, schema);
  return cloned;
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function parseBytes(input: any): number {
  if (typeof input === 'number') {
    return input;
  }

  const units: Record<string, number> = {
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };

  const match = String(input)
    .toLowerCase()
    .match(/^(\d+)(kb|mb|gb)$/);

  if (!match) {
    const num = Number(input);
    return Number.isNaN(num) ? 0 : num;
  }

  return Number(match[1]) * units[match[2]];
}

export function isJsonPropsValue(value: unknown, seen = new Set<object>()): boolean {
  if (value === null) return true;

  switch (typeof value) {
    case 'string':
    case 'boolean':
      return true;
    case 'number':
      return Number.isFinite(value);
    case 'object':
      break;
    default:
      return false;
  }

  if (seen.has(value)) return false;
  seen.add(value);

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      if (!(index in value)) return false;
      if (!isJsonPropsValue(value[index], seen)) return false;
    }
    seen.delete(value);
    return true;
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  if (Object.getOwnPropertySymbols(value).length > 0) return false;

  for (const key of Object.keys(value)) {
    if (!isJsonPropsValue((value as Record<string, unknown>)[key], seen)) return false;
  }

  seen.delete(value);
  return true;
}

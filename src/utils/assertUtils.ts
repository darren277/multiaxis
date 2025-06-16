// Simple invariant that also serves as a TS control-flow-analysis helper
export function assert(
  condition: unknown,
  message = 'Assertion failed'
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

// Convenience guards
export function assertString(
  value: unknown,
  label: string
): asserts value is string {
  assert(
    typeof value === 'string',
    `[${label}] expected string, got ${typeof value}`
  );
}

export function assertObject<T extends Record<string, unknown>>(
  value: unknown,
  label: string
): asserts value is T {
  assert(
    value !== null && typeof value === 'object',
    `[${label}] expected object, got ${value === null ? 'null' : typeof value}`
  );
}

export function assertCustomType<T>(
  value: unknown,
  typeCheck: (value: unknown) => value is T,
  label: string
): asserts value is T {
  assert(
    typeCheck(value),
    `[${label}] expected custom type, got ${typeof value}`
  );
}

export function debugLog(stage: string, value: unknown): void {
  /* eslint-disable no-console */
  console.debug(`${stage}:`, value);
}

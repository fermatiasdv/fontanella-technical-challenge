/**
 * Supabase query-builder mock factory.
 *
 * The Supabase client uses a chainable PromiseLike builder — every intermediate
 * method returns the same builder, and the builder itself is awaitable.
 * This helper creates a lightweight stand-in that satisfies that contract.
 */

export type QueryResult = { data: unknown; error: unknown };

/**
 * Creates a chainable mock object that is also a PromiseLike.
 * All chaining methods (select, order, eq, …) return the same object.
 * Awaiting the chain resolves to the given `result`.
 *
 * To change the resolved value between tests, call `chain.setResult(…)`.
 */
export function makeQueryChain(initial: QueryResult = { data: null, error: null }) {
  let current = initial;

  const chain: Record<string, unknown> & PromiseLike<QueryResult> = {
    then: (
      resolve: (value: QueryResult) => unknown,
      reject?: (reason: unknown) => unknown,
    ) => Promise.resolve(current).then(resolve, reject),

    setResult: (result: QueryResult) => {
      current = result;
    },
  } as unknown as Record<string, unknown> & PromiseLike<QueryResult>;

  for (const method of [
    'select', 'order', 'eq', 'neq', 'lt', 'gt',
    'single', 'insert', 'update', 'delete', 'upsert', 'range',
  ]) {
    (chain as Record<string, unknown>)[method] = jest.fn().mockReturnValue(chain);
  }

  return chain as typeof chain & { setResult: (r: QueryResult) => void } & Record<string, jest.Mock>;
}

/**
 * Creates a full mock Supabase client whose `.from()` always returns the
 * same `chain`.  Use `mock.chain.setResult(…)` to control query outcomes.
 */
export function makeSupabaseMock(initial: QueryResult = { data: null, error: null }) {
  const chain = makeQueryChain(initial);
  const client = { from: jest.fn().mockReturnValue(chain) };
  return { client, chain };
}

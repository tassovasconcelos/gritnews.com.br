export function readWithDeadline<T>(operation: PromiseLike<T>, timeoutMs?: number): Promise<T>;
export function createReadScope(): { begin(): () => boolean; cancel(): void };

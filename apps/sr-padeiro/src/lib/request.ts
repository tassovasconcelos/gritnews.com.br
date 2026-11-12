/** A timeout never means a write failed. Callers must reconcile pending writes. */
export async function withDeadline<T>(task: PromiseLike<T>, ms = 15000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([Promise.resolve(task), new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('A resposta demorou. Confira a conexão e consulte a confirmação antes de repetir.')), ms);
    })]);
  } finally { clearTimeout(timer); }
}

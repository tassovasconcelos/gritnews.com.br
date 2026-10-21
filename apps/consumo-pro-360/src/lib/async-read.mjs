// Read operations may time out without changing server data. Never retry writes here.
export function readWithDeadline(operation, timeoutMs = 20000) {
  let timer;
  return Promise.race([
    Promise.resolve(operation),
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error("A conexão demorou para responder. Verifique sua internet e tente atualizar novamente.")), timeoutMs);
    }),
  ]).finally(() => clearTimeout(timer));
}

export function createReadScope() {
  let generation = 0;
  return {
    begin() {
      const current = ++generation;
      return () => current === generation;
    },
    cancel() { generation++; },
  };
}

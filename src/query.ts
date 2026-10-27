// Only read queries retry; playback and library writes retain their existing semantics.
export async function queryWithRetry<T>(
  operation: () => Promise<T>,
  isCurrent: () => boolean,
  onRetry: (attempt: number) => void = () => {},
): Promise<T | undefined> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    if (!isCurrent()) return;
    try {
      const result = await operation();
      return isCurrent() ? result : undefined;
    } catch (error) {
      if (!isCurrent()) return;
      if (attempt === 3) throw error;
      onRetry(attempt + 1);
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
}

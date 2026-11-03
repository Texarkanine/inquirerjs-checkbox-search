/**
 * Line diff of two normalized VHS text records.
 *
 * Equal records return an empty string. A changed line is prefixed with
 * `-` on the base side and `+` on the head side. An unchanged line is
 * not listed as both.
 */
export function formatTextDiff(baseText: string, headText: string): string {
  if (baseText === headText) {
    return '';
  }
  const baseLines = baseText.split('\n');
  const headLines = headText.split('\n');
  const baseCount = baseLines.length;
  const headCount = headLines.length;
  const lcs: number[][] = Array.from({ length: baseCount + 1 }, () =>
    Array<number>(headCount + 1).fill(0),
  );
  for (let baseIndex = baseCount - 1; baseIndex >= 0; baseIndex -= 1) {
    for (let headIndex = headCount - 1; headIndex >= 0; headIndex -= 1) {
      lcs[baseIndex][headIndex] =
        baseLines[baseIndex] === headLines[headIndex]
          ? lcs[baseIndex + 1][headIndex + 1] + 1
          : Math.max(
              lcs[baseIndex + 1][headIndex],
              lcs[baseIndex][headIndex + 1],
            );
    }
  }

  const lines: string[] = [];
  let baseIndex = 0;
  let headIndex = 0;
  while (baseIndex < baseCount && headIndex < headCount) {
    if (baseLines[baseIndex] === headLines[headIndex]) {
      lines.push(` ${baseLines[baseIndex]}`);
      baseIndex += 1;
      headIndex += 1;
    } else if (lcs[baseIndex + 1][headIndex] >= lcs[baseIndex][headIndex + 1]) {
      lines.push(`-${baseLines[baseIndex]}`);
      baseIndex += 1;
    } else {
      lines.push(`+${headLines[headIndex]}`);
      headIndex += 1;
    }
  }
  while (baseIndex < baseCount) {
    lines.push(`-${baseLines[baseIndex]}`);
    baseIndex += 1;
  }
  while (headIndex < headCount) {
    lines.push(`+${headLines[headIndex]}`);
    headIndex += 1;
  }
  return lines.join('\n');
}

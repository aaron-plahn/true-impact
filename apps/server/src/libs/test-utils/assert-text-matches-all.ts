export const assertTextMatchesAll = (text: string, ...patterns: string[]) => {
  for (const p of patterns) {
    expect(text).toMatch(p);
  }
};

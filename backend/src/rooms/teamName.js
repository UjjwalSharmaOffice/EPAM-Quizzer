export function normalizeTeamName(name) {
  if (!name) return name;
  
  // Handle function-like names with empty parentheses (e.g., "attackOnTitans()")
  // Strip the empty parentheses and return just the name
  if (/\(\s*\)$/.test(name)) {
    return name.replace(/\s*\(\s*\)$/, '').trim();
  }
  
  // Handle valid team format: "name (team)"
  const match = name.match(/^(.+?)\s*\((.+?)\)$/);
  if (!match) return name;
  const person = match[1];
  const team = match[2];
  return `${person} (${team.toUpperCase()})`;
}

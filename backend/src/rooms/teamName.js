export function normalizeTeamName(name) {
  if (!name) return name;
  const match = name.match(/^(.+?)\s*\((.+?)\)$/);
  if (!match) return name;
  const person = match[1];
  const team = match[2];
  return `${person} (${team.toUpperCase()})`;
}

// Shared geometry keeps server collisions and TV scenery on the same course.
export function riverBanks(distance, y) {
  const z = distance + 560 - y;
  const width = 600 + Math.sin(z / 700) * 90;
  const desiredCenter = 500 + Math.sin(z / 500) * 130 + Math.sin(z / 1700) * 70;
  const center = Math.max(width / 2 + 50, Math.min(950 - width / 2, desiredCenter));
  return { left: center - width / 2, right: center + width / 2 };
}

export const TEAM_COLORS = ['#89c7f4', '#f5a7bb'];
export const TEAM_NAMES = ['Mavi takım', 'Mercan takım'];

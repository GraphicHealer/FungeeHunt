export function toSafePlayer(player: any) {
  return {
    id: player.id,
    displayName: player.displayName,
    type: player.type,
    hasCar: player.hasCar,
    teamId: player.teamId,
  };
}

export function toSafeTeam(team: any) {
  return {
    ...team,
    manager: team.manager ? toSafePlayer(team.manager) : null,
    members: team.members ? team.members.map(toSafePlayer) : undefined,
  };
}

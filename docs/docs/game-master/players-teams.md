---
sidebar_position: 4
---

# Players & Teams

## Players

`/gm/{gameId}/players` lists everyone who has joined. Each row shows the display name, the player type (`APP` for people who joined on their phone, `OFFLINE` for people you added), a car icon if they said they can drive, and their team once assigned.

![Players page](/img/gm-players.png)

- The pencil icon edits a player's name and **Has a car available to drive** flag.
- The trash icon deletes a player. A player who is currently a Team Captain cannot be deleted until another captain is chosen.
- **+ ADD OFFLINE PLAYER** adds someone without a phone so they can still be counted on a team. Offline players can be members but never captains, because the captain's phone is what submits proof.

![Add offline player](/img/gm-players-add-offline.png)

## Teams

`/gm/{gameId}/teams` shows each team with its Team Captain and member count.

![Teams page](/img/gm-teams.png)

### AUTO-CREATE

The fastest way to build teams. Enter the **Number of teams** and the app splits all *unassigned* players:

- one `APP` player per team becomes **Team Captain** (drivers are preferred);
- every team gets at least one driver;
- everyone else is shuffled and dealt out round-robin so team sizes are balanced.

Auto-create refuses to run if there aren't enough unassigned players, app players or drivers for the requested count.

![Auto-create teams](/img/gm-teams-auto-create.png)

### + ADD TEAM / editing a team

Create or edit a team by hand: give it a **Team Name** (optional — teams default to *Team 1*, *Team 2*, …), pick the **Team Captain** from the app players, and tick the **Members**. A player can only be captain of one team.

Players who are not on a team stay on the **GAME PENDING** lobby screen ("Waiting for the Game Master to assign you to a team…") until you assign them; they move to their team page automatically once you do.

---
sidebar_position: 6
---

# Bonuses, Rules & Settings

## Bonuses

`/gm/{gameId}/bonuses` shows three cards — **Return Time Bonus**, **Bonus Task** and **Food Drive**. Each shows its current values (or *"… is not enabled for this game."*); click a card to edit it. Anything you enabled in the [creation wizard](./create-game.md) can be changed here, and anything you skipped can be turned on.

![Bonuses page](/img/gm-bonuses.png)

- **Return Time Bonus** — **Window Start Time**, **Window Length (minutes)**, **Points**, plus **RANDOMIZE**. Teams are marked back from the dashboard's *Return Bonus* panel.
- **Bonus Task** — a limited-time task shown to captains with a ★ *Limited Time Bonus Task!* banner and countdown. Set the **Window Start** / **Window End**, then choose the **Task Source**: **Built-in** (pick from the default library) or **Custom** (**Title**, **Description**, **Points**, **Proof Type**, optional **Number of Photos**).
- **Food Drive** — **Points Per Item**, **Permissible Items**, **Suggested Items**. Item counts are entered per team from the dashboard's *Food Drive* panel.

## Rules

`/gm/{gameId}/rules` holds the rules shown to players on their **Rules** tab and on the printable sheet. The game starts with the default rule sections from **Admin → System Settings**.

![Rules page](/img/gm-rules.png)

Click a section to open **Edit Section** (**Title**, **Body**, **SAVE SECTION**, **REMOVE**); use **+ ADD SECTION** for a new one.

## Settings

`/gm/{gameId}/settings` lets you change the game after it was created:

- **Schedule** — **Start Time** and **End Time**. If the return bonus is enabled, moving the end time shifts the bonus window with it so it stays the same distance from the end.
- **Review** — switch between **Automatic Approval** and **Game Master Approval**.

Press **SAVE SETTINGS**.

![Game settings](/img/gm-settings.png)

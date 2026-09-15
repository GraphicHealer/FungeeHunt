---
sidebar_position: 3
---

# Tasks

`/gm/{gameId}/tasks` lists every task in the game in play order. Each row shows the order number, title, points, proof type and description. Click a row to edit it; drag rows to reorder them.

![Tasks page](/img/gm-tasks.png)

## Adding tasks

**+ ADD TASK** opens a menu with three sources:

![Add task menu](/img/gm-tasks-add-menu.png)

### Select task

Pick one or more tasks from the default library (maintained under **Admin → System Settings**). Tasks already in the game are hidden.

![Select tasks from the library](/img/gm-tasks-select-library.png)

### Custom task

Write a task for this game only:

| Field | Meaning |
| --- | --- |
| **Title**, **Description** | Shown to players. |
| **Points** | Awarded when the submission is approved. |
| **Proof Type** | **Photo** (one photo), **Video** (one clip) or **Photos** (several photos). |
| **Number of Photos** | For **Photos** tasks: a fixed number of slots. Leave blank to let the captain add as many as they like with **+ Add Photo**. |
| **Delay this task after game start** / **Delay (minutes)** | Hide the task until *n* minutes after **START**. Captains see "You must wait … before you can do this task" instead of the upload button. |
| **Order** | Position in the list. |

**Save to Database** also adds the task to the default library so future games can select it.

![Custom task form](/img/gm-tasks-custom.png)

### Import from CSV

Click **Download Template**, fill it in, then upload the file. Columns: `title, description, points, proofType, photoCount, category`. `proofType` is `PHOTO`, `VIDEO` or `PHOTOS`.

![Import from CSV](/img/gm-tasks-import-csv.png)

## Bulk actions

The checkbox button next to **+ ADD TASK** turns on bulk mode. Tick tasks (or select all), then **Set Points** to give them all the same value or **Delete** to remove them. **Done** leaves bulk mode.

:::note
The limited-time **Bonus Task** is not part of this list — it is configured on the [Bonuses](./bonuses-rules-settings.md) page.
:::

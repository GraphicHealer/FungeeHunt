---
sidebar_position: 1
---

# Players

Everything a player needs is in their phone's browser — there is no app to install.

## Joining a game

1. Open the site and type the six-character **game code** the Game Master shares, then tap **JOIN GAME**.
2. Enter **What's your name?** and answer **Will you have a car available to drive?** — the Game Master uses the car answer to make sure every team has a driver. Tap **CONTINUE**.
3. You land on the **GAME PENDING** lobby. Until the Game Master puts you on a team it says *Waiting for the Game Master to assign you to a team…*; once assigned it shows your team name and members.

<div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
  <img src="/img/player-01-enter-code.png" alt="Enter game code" width="300" />
  <img src="/img/player-02-name.png" alt="Enter your name" width="300" />
  <img src="/img/player-03-lobby-waiting.png" alt="Lobby, waiting for a team" width="300" />
</div>

Your player identity is saved in the browser, so reopening the join link brings you straight back to your team.

## Once the game starts

Your team page has three tabs at the bottom: **Tasks**, **Team** and **Rules**, plus a chat bubble.

### Tasks

The task list shows every task with its points, proof type and status:

| Status | Meaning |
| --- | --- |
| **Available** | Not done yet. Captains can submit. |
| **PENDING** | Submitted, waiting for the Game Master (Game Master Approval mode). |
| **COMPLETED** | Approved and points awarded. |
| **REJECTED** | The Game Master rejected it; the **Reason** is shown and the captain can try again. |
| *You must wait … before you can do this task* | A delayed task that unlocks a set time after the start. |

A ★ **Limited Time Bonus Task!** banner with a countdown appears while a bonus task window is open, and a **FOOD DRIVE** card lists the permissible and suggested items if the game has one. Tapping a task expands its description.

<div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
  <img src="/img/player-task-list.png" alt="Task list" width="300" />
  <img src="/img/player-task-expanded.png" alt="Expanded task (non-captain)" width="300" />
</div>

Team members who are not the captain can read everything but have no upload buttons.

### Team and Rules

**Team** shows the Team Captain and members. **Rules** shows the rule sections the Game Master published.

<div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
  <img src="/img/player-team.png" alt="Team tab" width="300" />
  <img src="/img/player-rules.png" alt="Rules tab" width="300" />
</div>

### Chat and announcements

The chat bubble opens a message thread between your team and the Game Master. Game Master **announcements** pop up over the page for everyone; **GOT IT** dismisses them.

## Submitting proof (Team Captains)

One player per team is the **Team Captain**; only their phone can submit. When the game starts, captains see a **You are the Team Captain** popup and are offered browser notifications (for new bonus tasks and rejected submissions).

<div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
  <img src="/img/captain-01-instructions-popup.png" alt="Team Captain popup" width="300" />
  <img src="/img/captain-02-task-list.png" alt="Captain's task list" width="300" />
</div>

To submit a task:

1. Tap the task to expand it.
2. Tap **Take Photo…** (or **Take Video…** / **Take Photos…** depending on the task). Your phone's camera or gallery opens and the preview appears in the card.
3. Tap **Submit**. The status changes to **PENDING** (or straight to **COMPLETED** in Automatic Approval mode).

<div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
  <img src="/img/captain-task-expanded.png" alt="Expanded task with upload button" width="300" />
  <img src="/img/captain-photo-loaded.png" alt="Photo attached, ready to submit" width="300" />
  <img src="/img/captain-after-submit.png" alt="Task pending review" width="300" />
</div>

**Multi-photo tasks** show one slot per required photo; if the Game Master didn't fix a count, **+ Add Photo** adds another slot. A rejected task shows the Game Master's reason and lets you submit a new photo.

<div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
  <img src="/img/captain-multi-photo-task.png" alt="Multi-photo task" width="300" />
  <img src="/img/captain-task-rejected.png" alt="Rejected task with reason" width="300" />
</div>

When the Game Master ends the game the list is locked with *Game finished — submissions are closed*, and `/play/{code}` turns into a public archive where anyone can download each team's photos and videos.

## Offline players

People without a phone can still be counted: the Game Master adds them from **Players → + ADD OFFLINE PLAYER**. Offline players appear on team rosters but can't be captains.

# Fungee-Hunt — Team Member UI

## Role

The Team Member is a participant on a Fungee-Hunt team.

There is one Team Manager per team. Team Members participate in the hunt but do not have the ability to submit proof or manage the team.

Team Members can:

- Join the game themselves using the Game Code, join link, or QR code, and choose a display name — the same Kahoot-style flow used by Managers. This requires the mobile app.
- Alternatively, be added to a team by the Game Master as an **Offline** player if they don't have a phone with them. Offline players don't have their own login and appear on the team roster like any other Member.
- View the team's current score and progress.
- View all game tasks.
- Open task cards to read their title, description, point value, and status.
- View submitted photo/video proof for completed tasks.
- View the game rules.
- View the team's members and identify the Team Manager.
- View the Food Drive reference when the Food Drive Bonus is enabled.

Team Members cannot:

- Submit photo or video proof.
- Complete tasks.
- Modify the team.
- Add or report food-drive items.
- Modify game settings or rules.

---

# Joining the Game

Team Members who have a phone join the same way as everyone else — entering the Game Code, following a join link, or scanning a QR code.

```text
JOIN FUNGEE-HUNT

Enter Game Code

[  7 4 K J P 2  ]

[ JOIN ]
```

```text
WHAT'S YOUR NAME?

[ Sarah ]

[ CONTINUE ]
```

```text
YOU'RE IN!

Waiting for the Game Master to assign
you to a team...
```

## Members Without a Phone

Not every Team Member will have a phone with them during the hunt. Anyone in that situation doesn't need to join at all — the Game Master adds them directly as an **Offline** player when building teams.

Offline players:

- Have no app login of their own.
- Appear on the team roster like any other Member, with an "Offline" label.
- Are represented by the Manager, who submits proof on the whole team's behalf regardless of who is or isn't carrying a phone.

---

## Main Navigation

The Team Member interface uses three primary sections:

- **Tasks** — Default landing screen and primary game interface.
- **Rules** — The rules for the current game, provided by the Game Master.
- **Team** — The current team's members and Manager.

---

# Tasks Screen

The Tasks screen should prominently display:

- Game name: **Fungee-Hunt**
- Team name
- Current team score
- Remaining game time
- Task completion progress, such as `11 / 15`
- Progress bar
- List of tasks

Each task should display:

- Proof type icon:
  - Photo
  - Video
  - Photo / Video
- Task title
- Point value
- Current status

Task statuses:

- **Available**
- **Submitted**
- **Under Review**
- **Incomplete — Try Again**

## Important

The Team Member interface should **not** display the Return Time Bonus window or countdown.

The return window is intentionally only discoverable by reading the game rules.

The Team Member interface should also **not** display the Food Drive Bonus as a score/counter/gameplay element.

If the Food Drive Bonus is enabled, players can access the permissible and suggested food-item information through the Food Drive Reference at the bottom of the task list.

---

# Task Card

Tapping a task opens a task card, presented as a mobile-friendly bottom sheet/modal.

The card contains:

1. Proof type
2. Task title
3. Point value
4. Task description
5. If submitted, the submitted proof
6. Submission date/time
7. If applicable, the current review status or Game Master feedback

## Available Task

An available task card contains only the task information.

There should be **no disabled button, placeholder action, "Manager only" message, or reserved action area** for Team Members.

The card should simply end after the task description.

Example:

```text
┌─────────────────────────────────────────────┐
│                                             │
│ 📷 PHOTO CHALLENGE                          │
│                                             │
│ Take a photo with a statue                  │
│                                             │
│ +150 POINTS                                 │
│                                             │
│ Take a photo of your entire team standing   │
│ next to a statue. Everyone must be visible. │
│                                             │
└─────────────────────────────────────────────┘
```

## Submitted Task

A normally completed task displays:

- Completion indicator
- Proof type
- Task title
- Point value
- Submitted photo or video
- `Submitted on`
- Submission date/time

Example:

```text
✓ TAKE A PHOTO WITH A STATUE

+150 POINTS

[ submitted photo ]

Submitted on
August 22, 2026 · 5:42 PM
```

For video proof, display a thumbnail with a play control.

Do not display `Submitted by`. The team has one Manager, so the useful information is when the proof was submitted.

---

# Under Review

A submission may be placed **Under Review** by the Game Master.

This can happen when:

- The game uses manual submission approval.
- The Game Master chooses to review an automatically accepted submission.

The Team Member should see a clearly distinct visual state, such as a yellow/amber indicator.

Example:

```text
⚠ TAKE A PHOTO WITH A STATUE

+150 POINTS

UNDER REVIEW

The Game Master is reviewing this
submission.

Submitted on
August 22, 2026 · 5:42 PM
```

The Team Member cannot take action while the task is under review.

---

# Incomplete — Try Again

If the Game Master determines that a submission does not satisfy the task requirements, the task becomes incomplete.

It should be visually distinct from a normal available task, using a noticeable outline and status indicator.

Example:

```text
┌═════════════════════════════════════════════┐
║ ○ TAKE A PHOTO WITH A STATUE      +150     ║
║                                             ║
║ INCOMPLETE — TRY AGAIN                      ║
└═════════════════════════════════════════════┘
```

If the Game Master provides a reason, show it on the task card:

```text
INCOMPLETE — TRY AGAIN

The entire team must be visible in the photo.
Please retake the photo with everyone in frame.
```

The Team Member does not submit the replacement proof. The Manager is responsible for capturing and submitting the new proof.

---

# Rules

Rules are specific to the current Fungee-Hunt game.

The Rules screen is read-only for Team Members.

The Game Master controls the contents of the rules.

Rules may contain sections such as:

- How to Play
- Rules
- Scoring
- Proof Requirements
- Time Limits
- Safety
- Food Drive Bonus
- Return Time Bonus
- Special Rules

## Return Time Bonus

If enabled, the exact return window is displayed in the rules.

The Return Time Bonus should **not** appear on the task screen, main game timer, or anywhere else in the Team Member interface.

Example:

```text
RETURN TIME BONUS

Teams that return to the finish between
5:30 PM and 6:00 PM will receive an
additional 500 points.

The Game Master must confirm your team's
return to receive the bonus.
```

The rules are intentionally the only player-facing location for this information.

## Food Drive Bonus

If enabled, the Food Drive Bonus should be explained clearly in the rules.

Example:

```text
FOOD DRIVE BONUS

Teams can earn additional points by collecting
canned and non-perishable food items during
the hunt.

Each eligible item is worth 10 points.

All collected items must be presented to the
Game Master at the end of the game for counting.
```

The rules should also provide or reference the permissible and suggested items.

---

# Food Drive Reference

When the Food Drive Bonus is enabled, a **Food Drive Reference** should appear at the bottom of the Tasks screen.

It should not appear as a task and should not show the team's collected item count or score.

Example:

```text
─────────────────────────────────────────────

FOOD DRIVE REFERENCE

Permissible & Suggested Items                         VIEW ›

─────────────────────────────────────────────
```

Tapping it opens a read-only reference card.

Example:

```text
┌─────────────────────────────────────────────┐
│                                             │
│ PERMISSIBLE & SUGGESTED ITEMS               │
│                                             │
│ Permissible                                │
│                                             │
│ Unopened, non-expired, non-perishable       │
│ food items.                                 │
│                                             │
│ Suggested                                  │
│                                             │
│ • Canned vegetables                         │
│ • Canned fruit                              │
│ • Canned soup                               │
│ • Canned meat                               │
│ • Pasta                                     │
│ • Rice                                      │
│ • Dry beans                                 │
│ • Peanut butter                             │
│ • Cereal                                    │
│                                             │
│ When in doubt, ask the Game Master.         │
│                                             │
└─────────────────────────────────────────────┘
```

The actual permissible and suggested item lists are configured by the Game Master for the specific game.

Team Members cannot add, edit, or report food-drive items through the application.

---

# Team

The Team screen displays the current team's members.

The Team Manager should be visually identified.

Example:

```text
THE FUNGI FRIENDS

★ Garrett
  Team Manager

  Sarah
  Mike
  Jessica  ○ Offline
```

Team Members cannot modify the team.

The Game Master is responsible for adding, removing, or changing team members and assigning the Team Manager.

---

# Team Score

The Team Member should always be able to see the team's current score.

The score includes points that have actually been awarded.

Food Drive points should **not** appear until the Game Master has entered and awarded the team's final food-item count.

Return Time Bonus points should **not** appear until the Game Master has awarded the bonus.

Example:

```text
THE FUNGI FRIENDS

1,450 POINTS
```

After bonuses are awarded:

```text
THE FUNGI FRIENDS

2,190 POINTS
```

No separate Food Drive or Return Bonus countdown/counter is required on the player interface.

---

# Design Principles

- Mobile-first.
- The Tasks screen is the primary experience.
- Keep the interface focused on the team's shared progress.
- Team Members should never feel like they are looking at a disabled Manager interface.
- Do not show controls that Team Members cannot use.
- Completed proof should be visible to the entire team.
- The Manager and Team Member views should look almost identical, with the primary difference being that Managers receive proof-submission controls.
- Every task requires photo or video proof.
- The Manager is responsible for all proof submissions.
- Team Members are read-only observers of task submissions.
- Use `Submitted on` rather than `Submitted by`.
- Under Review should be visually distinct, with a yellow/amber indicator.
- Incomplete tasks should be visually distinct and clearly communicate that the team needs to try again.
- The Return Time Bonus window is available to players only through the game rules and should never be shown alongside the main timer.
- The Food Drive Bonus is not a task and should not appear as a gameplay counter or score tracker.
- The Food Drive Reference is informational only.
- Only the Game Master can enter or modify the team's food-item count.
- Joining uses a Kahoot-style Game Code, join link, or QR code, followed by choosing a display name.
- Team Members without a phone don't need to join — the Game Master adds them as Offline players, who appear on the roster but have no app access of their own.

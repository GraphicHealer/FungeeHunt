# Fungee-Hunt — Team Manager UI

## Role

The Team Manager is a participant on a Fungee-Hunt team.

There is exactly **one Manager per team**.

The Manager:

- Joins the game using the Game Code, join link, or QR code shared by the Game Master, and chooses a display name — a Kahoot-style join flow.
- Must have the mobile app to join and to be assigned as Manager. Only players who joined via the app can be selected as a team's Manager.
- Names the team once the Game Master has assigned them as Manager, if the Game Master has not already set a name.
- Participates in the hunt like every other team member.
- Views the team's current score and progress.
- Views all game tasks.
- Opens task cards to read challenge details.
- Captures photo or video proof for tasks.
- Submits proof for the team.
- Views submitted proof and submission times.
- Views the game rules.
- Views the team's members.
- Views the Food Drive reference when the Food Drive Bonus is enabled.

The Manager does **not** manage the game itself.

The Game Master is responsible for:

- Creating the game.
- Creating tasks.
- Creating and managing teams.
- Assigning Managers.
- Setting the game rules.
- Configuring game bonuses.
- Managing the overall game.
- Entering Food Drive item counts.
- Awarding Return Time Bonuses.

---

# Joining the Game

Managers join Fungee-Hunt the same way every player does — by entering the Game Code, following a join link, or scanning a QR code.

```text
JOIN FUNGEE-HUNT

Enter Game Code

[  7 4 K J P 2  ]

[ JOIN ]
```

After entering the code, the player chooses a display name:

```text
WHAT'S YOUR NAME?

[ Garrett ]

[ CONTINUE ]
```

The player then waits in a lobby until the Game Master assigns them to a team:

```text
YOU'RE IN!

Waiting for the Game Master to assign
you to a team...
```

The mobile app is required to join and to be selected as a team's Manager, since the Manager is responsible for capturing and submitting proof throughout the hunt.

---

# Naming the Team

If the Game Master did not already set a name when creating the team, the newly assigned Manager is prompted to name it:

```text
NAME YOUR TEAM

[ The Fungi Friends ]

[ SAVE ]
```

Once set, the team name appears throughout the app for the Manager and Team Members. The Manager can rename the team from the Team screen; the Game Master can also rename it at any time.

```text
THE FUNGI FRIENDS

[ RENAME TEAM ]
```

---

# Main Navigation

The Manager interface uses three primary sections:

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

The Manager interface should **not** display the Return Time Bonus window or countdown.

The return window is intentionally only discoverable by reading the game rules.

The Manager interface should also **not** display a Food Drive counter, food-item entry controls, or Food Drive score tracker.

The Manager may view the Food Drive Reference at the bottom of the task list when the Food Drive Bonus is enabled, but cannot enter or report the team's item count.

---

# Task Card

Tapping a task opens a task card, presented as a mobile-friendly bottom sheet/modal.

The card contains:

1. Proof type
2. Task title
3. Point value
4. Task description
5. Contextual proof controls when the task is available or needs to be redone
6. If submitted, the submitted proof
7. Submission date/time
8. If applicable, the current review status or Game Master feedback

---

# Available Task

An available task displays the challenge and the appropriate proof control.

## Photo Task

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
│              [ TAKE PHOTO ]                 │
│                                             │
└─────────────────────────────────────────────┘
```

## Video Task

```text
┌─────────────────────────────────────────────┐
│                                             │
│ 🎥 VIDEO CHALLENGE                          │
│                                             │
│ Get a stranger to sing                      │
│                                             │
│ +200 POINTS                                 │
│                                             │
│ Record a video of a stranger singing        │
│ "Happy Birthday."                           │
│                                             │
│             [ RECORD VIDEO ]                │
│                                             │
└─────────────────────────────────────────────┘
```

## Photo or Video Task

If either proof type is accepted:

```text
┌─────────────────────────────────────────────┐
│                                             │
│ 📷 / 🎥 PROOF CHALLENGE                     │
│                                             │
│ Complete the challenge                      │
│                                             │
│ +200 POINTS                                 │
│                                             │
│ Task description...                         │
│                                             │
│ [ TAKE PHOTO ]   [ RECORD VIDEO ]           │
│                                             │
└─────────────────────────────────────────────┘
```

---

# Proof Submission Flow

Every task requires photo or video proof.

The Manager's submission workflow is:

**Available → Capture Proof → Review Proof → Submit → Submitted**

If a submitted task is later marked incomplete:

**Incomplete → Capture New Proof → Review Proof → Submit → Submitted**

## Capture

The appropriate native/device camera experience should be used where practical.

For photos:

- Open camera.
- Capture image.
- Allow retake.

For videos:

- Open video recorder.
- Record video.
- Allow retake/review.

## Review

After capture, show a proof preview.

```text
REVIEW PROOF

[ proof preview ]

[ RETAKE ]      [ SUBMIT PROOF ]
```

The Manager must explicitly submit the proof.

## Submit

Submitting proof is the completion action.

There should **not** be a separate `Mark Complete` action.

The way the submission is handled depends on the game's configured **Submission Review** mode:

### Automatic Approval

The submitted proof immediately completes the task and awards its points.

```text
Capture
  ↓
Review
  ↓
Submit
  ↓
COMPLETED
```

### Game Master Approval

The submitted proof enters the Under Review state.

```text
Capture
  ↓
Review
  ↓
Submit
  ↓
UNDER REVIEW
  ↓
Game Master approves or rejects
```

---

# Submitted Task

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

Do not display `Submitted by`.

The Manager is the designated submitter for the team, so the useful information is when the proof was submitted.

---

# Under Review

A submission may be placed **Under Review** when:

- The game uses Game Master approval.
- The Game Master chooses to manually review an automatically accepted submission.

The task should display a clearly distinct visual state, using a yellow/amber indicator.

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

The Manager cannot submit another proof or otherwise modify the task while it is under review.

---

# Incomplete — Try Again

If the Game Master determines that a submission does not satisfy the task requirements, the task becomes incomplete.

The task should be visually distinct from a normal Available task, using a noticeable outline and status indicator.

Example:

```text
┌═════════════════════════════════════════════┐
║ ○ TAKE A PHOTO WITH A STATUE      +150     ║
║                                             ║
║ INCOMPLETE — TRY AGAIN                      ║
└═════════════════════════════════════════════┘
```

If the Game Master provides a reason, display it:

```text
INCOMPLETE — TRY AGAIN

The entire team must be visible in the photo.
Please retake the photo with everyone in frame.

[ TAKE PHOTO ]
```

The Manager can then capture and submit new proof.

The previous submission should remain available to the Game Master as part of the submission history.

---

# Rules

Rules are specific to the current Fungee-Hunt game.

The Rules screen is read-only for Managers.

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

---

# Return Time Bonus

The Return Time Bonus is configured by the Game Master when creating or editing the game.

The configured return window is **not displayed anywhere on the Manager's normal game interface**.

The Manager can discover the window by reading the Rules.

Example:

```text
RETURN TIME BONUS

Teams that return to the finish between
5:30 PM and 6:00 PM will receive an
additional 500 points.

The Game Master must confirm your team's
return to receive the bonus.
```

The Manager does not have a Return Bonus button.

The Game Master determines when the team has returned and awards the bonus.

---

# Food Drive Bonus

The Food Drive Bonus is configured by the Game Master when creating or editing the game.

The Manager does **not** enter the number of food items collected.

The Manager also does not see a Food Drive counter or separate Food Drive score on the game screen.

The rules explain the mechanic:

```text
FOOD DRIVE BONUS

Teams can earn additional points by collecting
canned and non-perishable food items during
the hunt.

Each eligible item is worth 10 points.

All collected items must be presented to the
Game Master at the end of the game for counting.
```

The Game Master enters the final item count for the team after the game.

The system calculates:

```text
ITEM COUNT × POINTS PER ITEM = FOOD DRIVE BONUS
```

---

# Food Drive Reference

When the Food Drive Bonus is enabled, a **Food Drive Reference** appears at the bottom of the Tasks screen.

It is informational only.

Example:

```text
─────────────────────────────────────────────

FOOD DRIVE REFERENCE

Permissible & Suggested Items                         VIEW ›

─────────────────────────────────────────────
```

Tapping it opens a read-only reference card containing the permissible and suggested items configured by the Game Master.

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

The Manager cannot add, edit, count, or report food-drive items through the application.

---

# Team

The Team screen displays the current team's members.

The Manager should be visually identified.

Example:

```text
THE FUNGI FRIENDS

★ Garrett
  Team Manager

  Sarah
  Mike
  Jessica
```

The Manager does not have team-management controls.

The Game Master is responsible for adding, removing, or changing team members and assigning the Team Manager.

---

# Team Score

The Manager should always be able to see the team's current score.

The score includes points that have actually been awarded.

Food Drive points should not appear until the Game Master has entered and awarded the team's final food-item count.

Return Time Bonus points should not appear until the Game Master has awarded the bonus.

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

No separate Food Drive counter or Return Time Bonus countdown is required on the Manager interface.

---

# Design Principles

- Mobile-first.
- The Tasks screen is the primary experience.
- The Manager is a player, not an administrator.
- Keep the Manager and Team Member interfaces visually consistent.
- The Manager's primary additional capability is submitting proof.
- Every task requires photo or video proof.
- Do not provide a separate `Mark Complete` action.
- Proof submission is the completion action unless the game uses manual Game Master approval.
- Keep the capture → review → submit workflow fast and easy to use while moving around during the hunt.
- Completed proof should remain visible to the team.
- Use `Submitted on` rather than `Submitted by`.
- Under Review should be visually distinct, with a yellow/amber indicator.
- Incomplete tasks should be visually distinct and clearly communicate that the team needs to try again.
- The Return Time Bonus window is available to players through the game rules but should never be displayed alongside the main timer.
- The Food Drive Bonus is not a task and should not appear as a gameplay counter or score tracker.
- The Food Drive Reference is informational only.
- Only the Game Master can enter or modify the team's food-item count.
- Only the Game Master can determine whether a team has returned and award the Return Time Bonus.
- Joining uses a Kahoot-style Game Code, join link, or QR code, followed by choosing a display name.
- The mobile app is required to join as a Manager — Managers cannot be assigned from Offline (no-phone) players.
- The Manager names the team once assigned, unless the Game Master has already set a name; either can rename it afterward.

# Fungee-Hunt — Game Master UI

## Role

The Game Master runs and controls the entire Fungee-Hunt game.

Unlike the Team Manager and Team Member interfaces, the Game Master interface is a management and control panel rather than a player interface.

The Game Master can:

* Create and edit games.
* Configure game settings.
* Create, edit, and organize tasks.
* Create and manage teams.
* Assign one Manager per team.
* Manage players.
* Configure game rules.
* Configure submission review behavior.
* Configure game bonuses.
* Monitor task submissions.
* Review submissions.
* Mark automatically completed tasks **Under Review**.
* Mark submissions **Incomplete** and require a team to try again.
* Confirm teams returning to the finish.
* Award Return Time Bonuses.
* Enter Food Drive item counts.
* Monitor scores and game progress.
* End the game and finalize results.
* Generate the Game Code and join link used by Managers and Members to join the game.
* Manually add players who do not have the mobile app ("Offline" players).

---

# Player Join Flow (Game Code)

Fungee-Hunt uses a Kahoot-style join flow. Once a game is created, the Game Master receives a **Game Code** and a matching **join URL/QR code** that players use to enter the game.

```text
JOIN FUNGEE-HUNT 2026

GAME CODE

  7 4 K J P 2

Share this code, the join link, or the QR
code with your players.

[ COPY LINK ]        [ SHOW QR CODE ]
```

## How Players Join

* A player opens the app, enters the Game Code (or follows the join link/QR code), and chooses a display name — the same pattern as Kahoot.
* After joining, the player lands in a **Lobby**, waiting to be assigned to a team by the Game Master.
* Joining does **not** assign a role. The Game Master assigns each joined player as either a Manager or a Member when building teams.

## App vs. Offline Players

Not every participant will have a phone with them. Fungee-Hunt supports two player types:

* **App** — Joined themselves using the Game Code and have the app on their phone. Required for anyone who will submit proof.
* **Offline** — Added directly by the Game Master, without going through the Game Code join flow. Used for players who don't have a phone on them during the hunt.

**Only App players can be assigned as a team's Manager**, since the Manager is responsible for capturing and submitting proof. Offline players can only be assigned as Members.

Offline players do not have their own login or app access. They appear on the team roster like any other Member, and their team's Manager submits proof on their behalf.

## Lobby

While the game is Not Started, the Game Master can see who has joined:

```text
LOBBY

12 PLAYERS JOINED · UNASSIGNED

Garrett Jones      📱 App
Sarah Smith        📱 App
Mike Smith         📱 App
Jessica Smith      ○  Offline

[ + ADD OFFLINE PLAYER ]        [ ASSIGN TO TEAMS ]
```

Players remain in the Lobby, unassigned to any team, until the Game Master builds teams from the joined (and manually added) players.

---

# Main Navigation

The Game Master control panel should use a desktop/tablet-friendly navigation layout.

Primary sections:

* **Dashboard**
* **Tasks**
* **Teams**
* **Players**
* **Submissions**
* **Rules**
* **Settings**

Game-wide status and controls should remain visible in the interface, particularly while the game is active.

---

# Dashboard

The Dashboard is the Game Master's control room.

It should provide an at-a-glance view of:

* Game status
* Game start/end time
* Remaining game time while active
* Number of teams
* Number of players
* Number of tasks
* Overall leaderboard
* Tasks requiring attention
* Active Return Time Bonus status
* Food Drive scoring status when applicable

## Before the Game

```text
FUNGEE-HUNT 2026

● NOT STARTED

Starts:
August 22, 2026 · 10:00 AM

Ends:
August 22, 2026 · 4:00 PM

8 TEAMS
37 PLAYERS
15 TASKS

[ START GAME ]
```

## During the Game

```text
FUNGEE-HUNT 2026

● LIVE

01:42:37 REMAINING

8 TEAMS       37 PLAYERS       15 TASKS

LEADERBOARD

1   THE FUNGI FRIENDS       1,450
2   SPORE LOSERS            1,250
3   MUSHROOM KINGDOM        1,100
4   MOREL SUPPORT             950
```

The Game Master should be able to quickly identify teams that:

* Have completed many tasks.
* Have tasks Under Review.
* Have Incomplete tasks requiring another submission.
* Are eligible for a Return Time Bonus.
* Still need Food Drive scoring after the game.

## After the Game

```text
FUNGEE-HUNT 2026

✓ COMPLETED

Final results are available.

[ VIEW RESULTS ]
```

If Food Drive scoring has not yet been finalized:

```text
GAME COMPLETE

Food Drive counts still need to be entered.

[ ENTER FOOD DRIVE COUNTS ]
```

---

# Game Status

The game should have clear states:

* **Not Started**
* **Live**
* **Completed**

The Game Master controls transitions between these states.

The main game timer is visible to the Game Master.

The Return Time Bonus window is also visible to the Game Master when enabled.

---

# Tasks

The Tasks section is where the Game Master creates and manages the challenges.

Example:

```text
TASKS

15 TASKS

[ + CREATE TASK ]

┌──────────────────────────────────────────────────────────────┐
│ 📷  Take a photo with a statue                 150 POINTS   │
│     Photo                                             ⋮     │
├──────────────────────────────────────────────────────────────┤
│ 🎥  Get a stranger to sing                     200 POINTS   │
│     Video                                             ⋮     │
├──────────────────────────────────────────────────────────────┤
│ 📷  Find something unusual                     100 POINTS   │
│     Photo                                             ⋮     │
└──────────────────────────────────────────────────────────────┘
```

Tasks should support:

* Title
* Description
* Point value
* Proof type
* Ordering/position in the task list
* Editing
* Deletion

Every task requires proof.

There is no separate `Proof Required` setting.

## Proof Types

A task can require:

* **Photo**
* **Video**
* **Photo or Video**

---

# Create/Edit Task

Example:

```text
CREATE TASK

Title
[ Take a photo with a statue ]

Description
[ Take a photo of your entire team standing
  next to a statue. Everyone must be visible. ]

Points
[ 150 ]

Proof Type

(●) Photo
( ) Video
( ) Photo or Video

[ CANCEL ]                  [ SAVE TASK ]
```

The Game Master should be able to edit a task before or during the game according to whatever restrictions the application establishes for active games.

---

# Teams

The Teams section manages team composition.

Example:

```text
TEAMS

8 TEAMS

[ + CREATE TEAM ]

┌──────────────────────────────────────────────────────────────┐
│ THE FUNGI FRIENDS                                            │
│                                                              │
│ ★ Manager: Garrett                                           │
│ 3 Members                                                    │
│                                                              │
│ Score: 1,450                         11 / 15 COMPLETE        │
│                                                              │
│                                      [ VIEW TEAM ]           │
└──────────────────────────────────────────────────────────────┘
```

## Team Rules

* Each team has exactly one Manager.
* Team Members can belong to the same team as the Manager.
* The Game Master controls team membership.
* The Manager is a player on the team, not an administrator.
* Team Members cannot modify team composition.
* Only **App** players can be assigned as Manager. **Offline** players can only be assigned as Members.
* The Game Master builds teams from players in the Lobby (both App and Offline).

## Create Team

The Game Master assigns a Manager and Members. The Manager's dropdown only lists players who joined with the app.

Team Name is optional at creation — if left blank, the team's Manager will be prompted to name the team once assigned. The Game Master can also set or change the name directly at any time.

```text
CREATE TEAM

Team Name (optional)
[ Leave blank to let the Manager name it ]

Manager
[ Garrett Jones ▼ ]        (App players only)

Members
[ + ADD MEMBERS ]           (App or Offline)

[ CANCEL ]                 [ CREATE TEAM ]
```

Until a name is set, an unnamed team is shown as a placeholder, e.g. `TEAM (UNNAMED)`, in the Game Master's Teams list and Dashboard leaderboard.

The Game Master can change at any time:

* Team name
* Team members
* Team Manager

---

# Players

The Players section manages participants.

Most players arrive here by joining with the Game Code. The Game Master can also add players manually for anyone without a phone.

Example:

```text
PLAYERS

37 PLAYERS · 34 APP · 3 OFFLINE

[ + ADD OFFLINE PLAYER ]

NAME                 TEAM                 ROLE       JOINED
─────────────────────────────────────────────────────────────
Garrett Jones        Fungi Friends       Manager     📱 App
Sarah Smith          Fungi Friends       Member      📱 App
Mike Smith           Fungi Friends       Member      📱 App
Jessica Smith        Fungi Friends       Member      ○  Offline

John Doe             Spore Losers        Manager     📱 App
Jane Doe             Spore Losers        Member      📱 App
```

The Game Master can manage:

* Team assignment
* Manager assignment
* Player access
* Removing a player or converting an Offline player to App once they join with the Game Code

A player's display name is chosen by the player when they join with the Game Code. Offline players' names are entered by the Game Master when adding them.

A player should not be assigned as Manager for more than one team.

Only players with **App** status can be assigned as a Manager. Offline players are not selectable in the Manager field when creating or editing a team.

---

# Submissions

The Submissions section provides the Game Master with a central view of submitted proof.

Example:

```text
SUBMISSIONS

ALL    PENDING    UNDER REVIEW    INCOMPLETE

┌────────────────────────────────────────────────────────────┐
│ THE FUNGI FRIENDS                                          │
│ Take a photo with a statue                                 │
│                                                            │
│ [ PHOTO PREVIEW ]                                          │
│                                                            │
│ Submitted on                                               │
│ August 22, 2026 · 5:42 PM                                 │
│                                                            │
│ Status: COMPLETED                                          │
│                                                            │
│ [ REVIEW ]                                                 │
└────────────────────────────────────────────────────────────┘
```

For video submissions, display a thumbnail with a play control.

The Game Master should be able to filter submissions by:

* Team
* Task
* Status
* Submission time

---

# Submission Review Modes

Submission handling is configured per game.

The setting should be called **Submission Review**.

Options:

```text
SUBMISSION REVIEW

○ Automatic Approval
  Submitted proof immediately completes the task
  and awards its points.

○ Game Master Approval
  Submitted proof must be reviewed before the
  task is completed and points are awarded.
```

The Manager always submits proof.

This setting determines what happens after submission.

---

# Automatic Approval

Normal flow:

```text
AVAILABLE
    ↓
MANAGER SUBMITS PROOF
    ↓
COMPLETED
    ↓
POINTS AWARDED
```

The Game Master does not need to approve normal submissions.

However, the Game Master can manually intervene after a task has automatically completed.

---

# Game Master Manual Review in Automatic Mode

The Game Master can choose **Review Submission** on an already completed task.

Example:

```text
THE FUNGI FRIENDS

Take a photo with a statue

✓ COMPLETED
150 POINTS

[ PHOTO ]

Submitted on
August 22, 2026 · 5:42 PM

[ REVIEW SUBMISSION ]
```

Selecting review allows the Game Master to place the submission **Under Review**.

```text
REVIEW SUBMISSION

THE FUNGI FRIENDS
Take a photo with a statue

[ PHOTO ]

Submitted on
August 22, 2026 · 5:42 PM

[ MARK UNDER REVIEW ]
```

The task then becomes Under Review for the entire team.

---

# Manual Approval Mode

When Game Master Approval is enabled:

```text
AVAILABLE
    ↓
MANAGER SUBMITS PROOF
    ↓
UNDER REVIEW
    ↓
    ├── APPROVE → COMPLETED → POINTS AWARDED
    │
    └── MARK INCOMPLETE → INCOMPLETE → TRY AGAIN
```

The Game Master should have clear controls:

```text
[ APPROVE SUBMISSION ]

[ MARK INCOMPLETE ]
```

---

# Under Review

Under Review is a distinct task state.

The Game Master should see it clearly in submission lists and team views.

Example:

```text
THE FUNGI FRIENDS
Take a photo with a statue

⚠ UNDER REVIEW

Submitted on
August 22, 2026 · 5:42 PM

[ APPROVE ]
[ MARK INCOMPLETE ]
```

Under Review should use a yellow/amber visual treatment.

While Under Review:

* The task should not award additional points.
* The Manager should not be able to submit another proof.
* The team should see that the submission is being reviewed.

---

# Mark Incomplete

If the submitted proof does not satisfy the task requirements, the Game Master can mark it Incomplete.

The Game Master should have the option to provide a reason.

Example:

```text
MARK TASK INCOMPLETE

Reason

┌─────────────────────────────────────────────┐
│ The entire team must be visible in the     │
│ photo. Please retake the photo with        │
│ everyone in frame.                          │
└─────────────────────────────────────────────┘

[ CANCEL ]          [ MARK INCOMPLETE ]
```

The task then becomes:

**INCOMPLETE — TRY AGAIN**

The team can submit new proof.

The previous submission should remain in the Game Master's submission history.

---

# Submission History

The Game Master should retain a history of submissions and review actions.

Example:

```text
THE FUNGI FRIENDS
Take a photo with a statue

Submission 1
Submitted: 5:42 PM
Status: Incomplete
Reason:
"The entire team must be visible."

Submission 2
Submitted: 5:49 PM
Status: Completed
```

This provides an audit trail without cluttering the Manager or Member interface.

---

# Rules

The Rules section allows the Game Master to define the rules displayed to players.

Rules are game-specific.

Example:

```text
GAME RULES

HOW TO PLAY

[ Work together as a team to complete as many
  challenges as possible before time expires. ]

RULES

[ Every completed challenge must include photo
  or video proof. ]

SCORING

[ Each task is worth the number of points
  displayed on the task. ]

[ + ADD SECTION ]

[ SAVE RULES ]
```

---

# Automatic Rule Sections

Some game mechanics should automatically add appropriate information to the rules when enabled.

These sections can be edited by the Game Master after being generated.

Examples:

* Food Drive Bonus
* Return Time Bonus
* Submission Review information

The rules remain the authoritative player-facing source for these mechanics.

---

# Return Time Bonus

The Return Time Bonus is a Game Master-controlled scoring mechanic.

It is configured when creating or editing the game.

```text
RETURN TIME BONUS

Enable Return Time Bonus

[ ✓ ]

Return Window

Start: [ 5:30 PM ]
End:   [ 6:00 PM ]

Bonus

[ 500 ] POINTS
```

The configured return window is **not displayed on the Manager or Team Member game interface**.

It is made public through the game rules.

When enabled, the system can automatically add a rules section such as:

```text
RETURN TIME BONUS

Teams that return to the finish between
5:30 PM and 6:00 PM will receive an
additional 500 points.

The Game Master must confirm your team's
return to receive the bonus.
```

---

# Return Time Bonus Controls

The Game Master is responsible for determining when a team has physically returned.

The return timestamp should be recorded by the system when the Game Master marks the team as returned.

## Before the Window

```text
RETURN TIME BONUS

Window:
5:30 PM – 6:00 PM

Status:
NOT YET ACTIVE
```

No award control should be available yet.

## During the Window

```text
RETURN TIME BONUS

Window:
5:30 PM – 6:00 PM

Status:
ACTIVE

THE FUNGI FRIENDS

[ MARK RETURNED ]

SPORE LOSERS

[ MARK RETURNED ]
```

When the Game Master marks a team returned:

```text
THE FUNGI FRIENDS

Returned:
5:42:18 PM

✓ ELIGIBLE

[ AWARD +500 ]
```

## After Awarding

```text
THE FUNGI FRIENDS

Returned:
5:42:18 PM

✓ +500 AWARDED
```

## After the Window

```text
RETURN TIME BONUS

Window:
5:30 PM – 6:00 PM

Status:
CLOSED
```

Teams that were not marked returned during the eligible window are not eligible.

The recorded return timestamp should be immutable after the Game Master confirms the team's return.

The Return Time Bonus is a one-time bonus per team.

---

# Food Drive Bonus

The Food Drive Bonus is another Game Master-controlled scoring mechanic.

It is configured when creating or editing the game.

```text
FOOD DRIVE BONUS

Enable Food Drive Bonus

[ ✓ ]

Points Per Item

[ 10 ] POINTS

Permissible Items

[ Unopened, non-expired,
  non-perishable food items. ]

Suggested Items

[ Canned vegetables             ]
[ Canned fruit                  ]
[ Canned soup                   ]
[ Canned meat                   ]
[ Pasta                         ]
[ Rice                          ]
[ Dry beans                     ]
[ Peanut butter                 ]
[ Cereal                        ]

[ + ADD ITEM ]
```

The permissible and suggested item information is automatically available to players through:

* The game rules.
* The Food Drive Reference at the bottom of the task list.

The Food Drive Bonus itself should not appear as a task.

Managers and Members cannot enter food counts.

Only the Game Master can enter and modify the final count.

---

# Food Drive Rules

When enabled, the system should automatically add a clear Food Drive section to the game rules.

Example:

```text
FOOD DRIVE BONUS

Teams can earn additional points by collecting
canned and non-perishable food items during
the hunt.

Each eligible item is worth 10 points.

All collected items must be presented to the
Game Master at the end of the game for counting.

See "Permissible & Suggested Items" for examples
of eligible items.
```

The Game Master can edit the generated rules if necessary.

---

# Food Drive Reference

When enabled, the player task list should display a small reference option at the bottom:

```text
FOOD DRIVE REFERENCE

Permissible & Suggested Items                         VIEW ›
```

The reference contains the lists configured by the Game Master.

Players can read the reference but cannot modify it.

---

# Food Drive Scoring

Food Drive scoring occurs at the end of the game.

The Game Master enters the number of eligible items collected by each team.

Example:

```text
FOOD DRIVE

10 POINTS PER ITEM

Enter the number of eligible items collected
by each team.

┌──────────────────────────────────────────────┐
│ TEAM                         ITEMS     BONUS │
├──────────────────────────────────────────────┤
│ The Fungi Friends            [ 24 ]    +240 │
│ Spore Losers                 [ 17 ]    +170 │
│ Mushroom Kingdom             [ 31 ]    +310 │
│ Morel Support                [ 12 ]    +120 │
└──────────────────────────────────────────────┘

[ SAVE COUNTS ]
```

The system automatically calculates:

```text
ITEM COUNT × POINTS PER ITEM = FOOD DRIVE BONUS
```

The Game Master is the only person who can enter or modify these counts.

---

# Food Drive Confirmation

Before finalizing a team's Food Drive score:

```text
THE FUNGI FRIENDS

Food Items
24

Food Drive Bonus
+240 POINTS

[ EDIT COUNT ]       [ CONFIRM ]
```

After confirmation:

```text
✓ FOOD DRIVE BONUS CONFIRMED

The Fungi Friends

24 items × 10 points

+240 POINTS
```

The bonus is then added to the team's score.

The Game Master should retain the confirmed item count as part of the game's scoring history.

---

# Score Breakdown

The Game Master should be able to view the scoring components for each team.

Example:

```text
THE FUNGI FRIENDS

TASK POINTS
1,450

FOOD DRIVE
24 items × 10
+240

RETURN TIME BONUS
+500

────────────────────

FINAL SCORE
2,190
```

This breakdown should make it clear exactly how the final score was calculated.

---

# Leaderboard

The Dashboard should provide a live leaderboard while the game is active.

Example:

```text
LEADERBOARD

1   THE FUNGI FRIENDS       1,450
2   SPORE LOSERS            1,250
3   MUSHROOM KINGDOM        1,100
4   MOREL SUPPORT             950
```

Food Drive points should not be included until the Game Master enters and confirms them.

Return Time Bonus points should not be included until the Game Master awards them.

---

# Final Results

After the game ends and all scoring has been finalized, the Game Master should be able to view final results.

Example:

```text
FINAL RESULTS

1   THE FUNGI FRIENDS       2,190
2   SPORE LOSERS            1,920
3   MUSHROOM KINGDOM        1,850
4   MOREL SUPPORT           1,640
```

Selecting a team shows the complete scoring breakdown.

---

# Settings

Settings control the configuration of the game itself.

Sections:

## Game Information

* Game name
* Description
* Game image/logo

## Schedule

* Start date/time
* End date/time

## Submission Review

* Automatic Approval
* Game Master Approval

## Game Bonuses

* Return Time Bonus
* Food Drive Bonus

## Gameplay

Configurable gameplay options:

* Whether teams can see other teams' scores.
* Whether submitted proof is visible to other teams.
* Other game-specific behavior.

## Game State

The Game Master should have controls for:

* Start Game
* End Game
* Finalize Results

Destructive actions such as ending or resetting a game should require confirmation.

---

# Game Creation Flow

Creating a new game should guide the Game Master through the core configuration.

Flow:

```text
CREATE GAME

1. Game Information
       ↓
2. Schedule
       ↓
3. Tasks
       ↓
4. Share Game Code & Build Teams
       ↓
5. Rules
       ↓
6. Submission Review
       ↓
7. Game Bonuses
       ↓
8. Review & Create
```

The Game Master should be able to return to previous steps and edit the configuration before starting the game.

---

# Game Creation — Review

Before creating the game, provide a summary:

```text
REVIEW GAME

FUNGEE-HUNT 2026

Schedule
August 22, 2026
10:00 AM – 4:00 PM

8 Teams
37 Players
15 Tasks

Submission Review
Automatic Approval

Bonuses
✓ Food Drive — 10 points/item
✓ Return Time Bonus — 500 points
   5:30 PM – 6:00 PM

[ BACK ]                [ CREATE GAME ]
```

---

# Design Principles

* The Game Master interface is a management/control panel, not a player interface.
* Desktop and tablet layouts should be supported.
* The Dashboard should provide a useful control-room overview.
* Tasks, Teams, Players, Submissions, Rules, and Settings should have clear separation.
* Every task requires photo or video proof.
* Submission handling is configurable per game.
* Automatic Approval should require no normal Game Master intervention.
* Game Master Approval places submissions Under Review until approved or marked Incomplete.
* Even in Automatic Approval mode, the Game Master can manually review an already completed task.
* Under Review should use a yellow/amber visual treatment.
* Incomplete tasks should clearly communicate that the team must try again.
* Rejected/incomplete submissions should support a Game Master-provided reason.
* Submission history should be retained for auditing.
* The Return Time Bonus is controlled entirely by the Game Master.
* The Return Time Bonus window is visible to players through the game rules, but not on the Manager or Member game screen.
* The Game Master records a team's return time by explicitly marking the team as returned.
* Return timestamps should be immutable once recorded.
* Return Time Bonus is awarded once per team.
* The Food Drive Bonus is controlled entirely by the Game Master.
* Only the Game Master can enter or modify Food Drive item counts.
* Food Drive scoring is performed after the game ends.
* Food Drive points are calculated automatically from the configured points-per-item value.
* Permissible and Suggested Food Drive items are configured by the Game Master.
* Food Drive information is made visible to players through the rules and Food Drive Reference, not through a game-screen counter.
* Final scores should provide a transparent breakdown of task points and all awarded bonuses.
* Players join using a Kahoot-style Game Code, join link, or QR code, then choose their own display name.
* Joining does not assign a team or role — the Game Master assigns joined players to teams and designates each team's Manager.
* Only App players (joined via the Game Code) can be assigned as a Manager, since the Manager must be able to capture and submit proof.
* Offline players, added manually by the Game Master, can only be assigned as Members and have no app access of their own.
* A team's name can be left unset by the Game Master at creation; the assigned Manager is then prompted to name the team. The Game Master retains the ability to set or change a team's name at any time.

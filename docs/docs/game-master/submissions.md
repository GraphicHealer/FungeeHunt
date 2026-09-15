---
sidebar_position: 5
---

# Submissions

`/gm/{gameId}/submissions` lists every photo/video a Team Captain has sent in, newest first, with the team, task title, status and a thumbnail. New submissions appear in real time.

![Submissions page](/img/gm-submissions.png)

Statuses:

| Status | Meaning |
| --- | --- |
| `SUBMITTED` | Waiting for review (Game Master Approval mode only). |
| `COMPLETED` | Approved — the task's points have been awarded and the photo can appear on the spectator screen. |
| `INCOMPLETE` | Rejected. The captain sees **REJECTED** with your reason and can submit again. |

If the game was created with **Automatic Approval**, everything arrives as `COMPLETED`; you can still open a submission and reject it afterwards.

## Reviewing

Click a row (or a card in the dashboard **Submission Feed**) to open **Review Submission**. It shows the team, task, status and the full-size photo(s) or video. Videos are transcoded on upload, so a fresh one may briefly say *Video is being processed for review…*.

![Review submission](/img/gm-submission-review.png)

- **APPROVE** marks it `COMPLETED` and awards the points.
- **REJECT** asks for a **Reason for rejecting (required)** and then marks it `INCOMPLETE`. The reason is shown to the captain under the task.
- **CLOSE** leaves it unchanged.

![Reject with a reason](/img/gm-submission-reject.png)

Points on the leaderboard, the public viewer and the captain's task list all update immediately after a review.

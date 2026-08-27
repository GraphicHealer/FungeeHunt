# Recap Video Audio Assets

Place licensed or original audio files in these folders. The recap renderer picks a random file from the correct folder for each section, plays it under the clips, and fades the music out at the end of the section.

## Folder List

| Folder | Used by | Vibe / Tone |
| --- | --- | --- |
| `cold-open/` | Cold open / Highlights | Fast, punchy, high-energy; staccato brass or driving EDM that builds anticipation. |
| `people/` | People category | Friendly, warm, upbeat pop or acoustic; social and positive. |
| `memories/` | Memories category | Nostalgic, gentle; soft synth or piano with a warm, sentimental feel. |
| `history/` | History category | Triumphant and grand; orchestral strings, snare, or marching band energy. |
| `music/` | Music category | Groovy and rhythmic; karaoke or performance-style fun. |
| `pranks/` | Pranks category | Mischievous and cartoonish; xylophone, pizzicato, or sneaky woodwinds. |
| `animals/` | Animals category | Light and bouncy; nature-doc cute, playful. |
| `games/` | Games category | Competitive and playful; arcade chiptune or sports-arena energy. |
| `vehicles/` | Vehicles category | Driving and fast; rock or electronic, propulsive. |
| `art/` | Art category | Creative and quirky; jazzy, ukulele, or colorful indie. |
| `nature/` | Nature category | Calm and ambient; acoustic guitar, piano, outdoor serenity. |
| `team-photo/` | Team Photo closer reveal | Celebratory and uplifting; the payoff moment for the winner. |
| `winners/` | "And the winner is..." montage | Suspenseful, rising; building drums and tension. |
| `tie/` | Tie closer | Dramatic and comedic; a record-scratch or tense beat for the tie reveal. |
| `thanks-for-playing/` | Scrapbook outro | Warm, sentimental, credit-roll energy; a final thank-you sendoff. |
| `general/` | Fallback / General category | Neutral, all-purpose montage music. |

## Audio Rules

- Each folder can hold any number of `.mp3` files.
- The renderer picks a random track from the matching folder for each section.
- Tracks should be **loopable** within a section, or long enough to fill it.
- The renderer applies a **fade out at the end of the section** using FFmpeg (`afade`).
- Provide files in `.mp3` format at 44.1kHz / 16-bit stereo.
- Do not commit copyrighted material you do not have permission to use.

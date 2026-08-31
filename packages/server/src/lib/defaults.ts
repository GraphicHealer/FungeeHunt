import { db } from '../db/client';
import { logger } from './logger';

const defaultTasks = [
  {
    title: `Welcome to the Landmark`,
    description: `Take a photo of your entire team together with a well-known local landmark clearly visible in the background.`,
    points: 150,
    proofType: 'PHOTO',
    category: 'Team Photo',

  },
  {
    title: `Retiree Royale`,
    description: `All team members must fist bump a retired public servant.`,
    points: 100,
    proofType: 'VIDEO',
    category: 'People',

  },
  {
    title: `The Civil Handshake`,
    description: `Everyone on your team must shake hands with the same civil servant or community helper.`,
    points: 100,
    proofType: 'VIDEO',
    category: 'People',

  },
  {
    title: `Baby Got Back... Then`,
    description: `Take a picture of a team member's face next to a physical copy of their baby picture (under one year old).`,
    points: 75,
    proofType: 'PHOTO',
    category: 'Memories',

  },
  {
    title: `History in the Making`,
    description: `Three members of your team must read a historical marker aloud, taking turns one word at a time.`,
    points: 50,
    proofType: 'VIDEO',
    category: 'History',

  },
  {
    title: `Just Keep Rowing`,
    description: `All team members must touch a boat and sing "Row, Row, Row Your Boat" twice.`,
    points: 100,
    proofType: 'VIDEO',
    category: 'Music',

  },
  {
    title: `Mission: Impossible to Speak`,
    description: `The entire team must enter a store, walk to the back and touch the wall, then exit without speaking. You may speak only after exiting.`,
    points: 100,
    proofType: 'VIDEO',
    category: 'Pranks',

  },
  {
    title: `The Dog Ate My Homework`,
    description: `A member of your team must read two pages of a children's book to a live dog.`,
    points: 125,
    proofType: 'VIDEO',
    category: 'Animals',

  },
  {
    title: `It's Fun to Stay at the...`,
    description: `A complete stranger must join three team members in singing the chorus of YMCA with the motions.`,
    points: 150,
    proofType: 'VIDEO',
    category: 'Music',

  },
  {
    title: `Going Bananas`,
    description: `Have a grocery store clerk sign a banana. (You do not have to purchase said banana.)`,
    points: 100,
    proofType: 'PHOTO',
    category: 'Pranks',

  },
  {
    title: `O Say, Can You Sing?`,
    description: `As a whole team, stand around a flagpole and sing a lesser-known verse of The Star-Spangled Banner.`,
    points: 150,
    proofType: 'VIDEO',
    category: 'Music',

  },
  {
    title: `Carol of the Stranger`,
    description: `Ask a stranger to sing a Christmas carol to your team.`,
    points: 150,
    proofType: 'VIDEO',
    category: 'Music',

  },
  {
    title: `Hop, Skip, and a Trip`,
    description: `Using sidewalk chalk, draw a hopscotch course with at least 7 squares; a team member must complete it there and back.`,
    points: 50,
    proofType: 'VIDEO',
    category: 'Games',

  },
  {
    title: `Keeping Up with the Teams`,
    description: `Collect a photo of each of the other teams' vehicles or gathering spots.`,
    points: 50,
    proofType: 'PHOTOS',
    delayMinutes: 15,
    category: 'Vehicles',

  },
  {
    title: `Under Pressure`,
    description: `Ask a police officer the tire pressure of their vehicle's driver-side rear tire.`,
    points: 150,
    proofType: 'PHOTO',
    category: 'Vehicles',

  },
  {
    title: `I'm a Little Teapot`,
    description: `At least 2 members must sing "I'm a Little Teapot" (with motions) along with one or more firefighters or EMTs.`,
    points: 200,
    proofType: 'VIDEO',
    category: 'Music',

  },
  {
    title: `15 Minutes of High Fame`,
    description: `A member of your team must get 15 high fives from 15 different people in less than 30 seconds. (excluding team members)`,
    points: 125,
    proofType: 'VIDEO',
    category: 'Games',

  },
  {
    title: `The Art of the Steal`,
    description: `Physically recreate a famous painting using non-traditional art materials.`,
    points: 100,
    proofType: 'PHOTO',
    category: 'Art',

  },
  {
    title: `The World's Smallest Order`,
    description: `A team member must go into a restaurant and order one single sesame seed.`,
    points: 125,
    proofType: 'VIDEO',
    category: 'Pranks',

  },
  {
    title: `Groot's Got Nothing on Us`,
    description: `As a team, group hug a tree.`,
    points: 50,
    proofType: 'PHOTO',
    category: 'Nature',

  },
  {
    title: `A Flower for the Forgotten`,
    description: `Lay a flower on the tombstone of someone born in the 1800s. Respect the site.`,
    points: 75,
    proofType: 'PHOTO',
    category: 'History',

  },
  {
    title: `Employee of the Month`,
    description: `Take a photo of your entire team together with one employee of a school, office, or business you visit (nametag, uniform, or badge should confirm they work there).`,
    points: 150,
    proofType: 'PHOTO',
    category: 'Team Photo',

  },
  {
    title: `Strike a Pose`,
    description: `Find a statue or monument, then have your entire team strike the same pose the statue(s) are in. Both your team and the statue(s) must be visible in the same photo.`,
    points: 150,
    proofType: 'PHOTO',
    category: 'Team Photo',

  },
  {
    title: `How Yellow Is Your Yellow?`,
    description: `Find a yellow paint sample card and hold it next to a yellow vehicle or object so the card, your face, and the color are all visible.`,
    points: 100,
    proofType: 'PHOTO',
    category: 'Art',

  },
  {
    title: `Miles Ahead`,
    description: `A team member must read a car's mileage aloud while standing next to that physical car. (Cannot be your team\'s car.)`,
    points: 75,
    proofType: 'VIDEO',
    category: 'Vehicles',

  },
  {
    title: `State of the Plate`,
    description: `Take a picture of a license plate from a state or province other than the one you are playing in.`,
    points: 50,
    proofType: 'PHOTO',
    category: 'Vehicles',

  },
  {
    title: `Gerbil? I Hardly Know Her!`,
    description: `At a pet store, ask "Do you have a bulk discount on gerbils, and how much meat is on a gerbil anyway?" You cannot explain until after they answer.`,
    points: 200,
    proofType: 'VIDEO',
    category: 'Pranks',

  },
  {
    title: `The Elbow Has It`,
    description: `Ask a stranger to take a picture of a team member\'s left elbow. You must record the process.`,
    points: 100,
    proofType: 'VIDEO',
    category: 'Art',

  },
  {
    title: `Cart Blanche`,
    description: `Help a stranger put their groceries into their car. (you must ask)`,
    points: 100,
    proofType: 'VIDEO',
    category: 'People',

  },
  {
    title: `I Can See Clearly Now`,
    description: `Go to an auto parts store and ask for a can of "halogen fluid for headlights." (do not explain till after they answer)`,
    points: 175,
    proofType: 'VIDEO',
    category: 'Pranks',

  },
  {
    title: `Elmo's World: The Interview`,
    description: `Find an Elmo item (toy, plush, or picture). One team member must interview "Elmo" about his early days, while a second team member plays the part of Elmo.`,
    points: 175,
    proofType: 'VIDEO',
    category: 'Pranks',

  },
  {
    title: `Do or Do Not... Sing Christmas`,
    description: `Knock on the door of someone not on your team and sing a full verse of a Christmas song in Yoda fashion.`,
    points: 200,
    proofType: 'VIDEO',
    category: 'Music',

  },
  {
    title: `To Clerk, or Not to Clerk`,
    description: `Find a store clerk willing to recite part of a Shakespearean sonnet with you. Reading from a phone is allowed.`,
    points: 150,
    proofType: 'VIDEO',
    category: 'Pranks',

  },
  {
    title: `Lost in Translation`,
    description: `Get a stranger to teach you a phrase in a foreign language. A team member who does not speak the language must repeat it.`,
    points: 100,
    proofType: 'VIDEO',
    category: 'People',

  },
  {
    title: `Put Your Whole Self In`,
    description: `At least two team members must dance the Hokey Pokey in a public place with a bystander. Complete left arm, right arm, left leg, right leg, head, and whole self.`,
    points: 125,
    proofType: 'VIDEO',
    category: 'Music',

  },
  {
    title: `Don't Blink`,
    description: `Convince a passerby to participate in a staring contest with a team member for at least 30 seconds.`,
    points: 100,
    proofType: 'VIDEO',
    category: 'Games',

  },
  {
    title: `Draw Me Like You See Me`,
    description: `Ask a stranger to draw a caricature of you or a team member.`,
    points: 100,
    proofType: 'PHOTO',
    category: 'Art',

  },
  {
    title: `Build a People Pyramid`,
    description: `Create a human pyramid with at least one passerby who agrees to join in.`,
    points: 150,
    proofType: 'PHOTO',
    category: 'Games',

  },
  {
    title: `Simon Says... You Do It`,
    description: `Get a passerby to play Simon Says led by a team member. At least 3 people including the stranger must play.`,
    points: 125,
    proofType: 'VIDEO',
    category: 'Games',

  },
  {
    title: `Rock, Paper, Stranger`,
    description: `Get a stranger to join a team member in a spontaneous game of rock-paper-scissors.`,
    points: 75,
    proofType: 'VIDEO',
    category: 'Games',

  },
  {
    title: `See the World Through Their Eyes`,
    description: `Approach someone wearing sunglasses and ask if you can try them on to "see the world through their eyes."`,
    points: 100,
    proofType: 'VIDEO',
    category: 'Pranks',

  },
  {
    title: `Conga Where You Are`,
    description: `Start a conga line with at least three other non-team members in a public area.`,
    points: 125,
    proofType: 'VIDEO',
    category: 'Music',

  },
  {
    title: `Stranger\u2019s Got Talent`,
    description: `Find someone with a unique talent and ask them to perform for the team.`,
    points: 100,
    proofType: 'VIDEO',
    category: 'People',

  },
  {
    title: `Thumbs Up, Stranger`,
    description: `Challenge a stranger to a thumb war.`,
    points: 75,
    proofType: 'VIDEO',
    category: 'Games',

  },
  {
    title: `Tag, You're It!`,
    description: `In a public park, challenge three people not on your team to a game of tag.`,
    points: 125,
    proofType: 'VIDEO',
    category: 'Games',

  },
  {
    title: `Behold! Your Tour Guide`,
    description: `Locate a local landmark and offer to give a brief impromptu tour to anyone passing by.`,
    points: 100,
    proofType: 'VIDEO',
    category: 'History',

  },
  {
    title: `Laugh, Actually`,
    description: `Recite a short joke or pun to a stranger and get them to laugh.`,
    points: 75,
    proofType: 'VIDEO',
    category: 'People',

  },
  {
    title: `Call Me Maybe`,
    description: `Convince a stranger to let you borrow their phone to make a quick call, then call your own phone and answer it.`,
    points: 175,
    proofType: 'VIDEO',
    category: 'Pranks',

  },
  {
    title: `To Protect and Selfie`,
    description: `Take a selfie with a police officer or security guard.`,
    points: 100,
    proofType: 'PHOTO',
    category: 'People',

  },
  {
    title: `Where in the World Is...`,
    description: `Approach a stranger with a map and ask for directions to a fictional location, then thank them sincerely.`,
    points: 150,
    proofType: 'VIDEO',
    category: 'Pranks',

  },
  {
    title: `Honey, I Shrunk the Building`,
    description: `Discover a street with unique architecture and take a photo of your team pretending to lift one of the buildings.`,
    points: 50,
    proofType: 'PHOTO',
    category: 'Art',

  },
  {
    title: `Those Who Ignore History...`,
    description: `Find a local historical site and take a video of your team reenacting a part of that history.`,
    points: 75,
    proofType: 'VIDEO',
    category: 'History',

  },
  {
    title: `Dance Like Nobody's Playing Music`,
    description: `Start a spontaneous flash mob with no music and dance in unison for at least 20 seconds.`,
    points: 150,
    proofType: 'VIDEO',
    category: 'Music',

  },
  {
    title: `Hot Ones: Local Edition`,
    description: `Drink a serving of the spiciest hot sauce a nearby restaurant offers.`,
    points: 125,
    proofType: 'VIDEO',
    category: 'Games',

  },
  {
    title: `Trolling for Answers`,
    description: `Answer a riddle under a bridge. The riddle must be one the team has not heard before; you can look it up.`,
    points: 50,
    proofType: 'VIDEO',
    category: 'Games',

  },
  {
    title: `Hide-and-Seek: Store Edition`,
    description: `Play a game of hide-and-seek in a large store.`,
    points: 100,
    proofType: 'VIDEO',
    category: 'Games',

  },
  {
    title: `One Team's Trash...`,
    description: `The Team must collect at least 20 pieces of trash or recycling from a public area and dispose of it properly.`,
    points: 150,
    proofType: 'PHOTO',
    category: 'People',

  },
  {
    title: `The Skipping Stones`,
    description: `Skip a stone at a local lake or pond. The rock must skip at least three times.`,
    points: 50,
    proofType: 'VIDEO',
    category: 'Nature',

  },
  {
    title: `Goose Encounter`,
    description: `Talk to a goose and introduce yourself. If it hisses or honks aggressively more than three times, find a new goose.`,
    points: 100,
    proofType: 'VIDEO',
    category: 'Animals',

  },
  {
    title: `Shoe Fly, Don't Drop`,
    description: `Form a circle and toss one team member\'s left shoe around the full circle five times without dropping it.`,
    points: 75,
    proofType: 'VIDEO',
    category: 'Games',

  },
  {
    title: `The Campaign Trail`,
    description: `Put on a tie and give a speech in front of a government building about becoming mayor while your team hums the national anthem.`,
    points: 175,
    proofType: 'VIDEO',
    category: 'Pranks',

  },
  {
    title: `Animal Planet`,
    description: `Find three different species of living, non-bug, non-bird, non-human animals and capture them clearly on camera.`,
    points: 75,
    proofType: 'PHOTOS',
    category: 'Animals',

  },
  {
    title: `Bird Watchers' Blitz`,
    description: `Photograph as many different birds as possible in 5 minutes, using only one camera.`,
    points: 100,
    proofType: 'PHOTOS',
    category: 'Animals',

  },
  {
    title: `Pimp My Ride: Team Edition`,
    description: `Find the car you think is the coolest one nearby (your call — sports car, classic car, wild paint job, etc.) and take a photo of your entire team standing next to it.`,
    points: 150,
    proofType: 'PHOTO',
    category: 'Team Photo',

  },
  {
    title: `Hollywood Charades`,
    description: `Pick an item at a convenience store and get a stranger to guess it while you describe it using only movie quotes.`,
    points: 100,
    proofType: 'VIDEO',
    category: 'Games',

  },
  {
    title: `The Senior Citizen's Last Stand`,
    description: `Arm wrestle someone 70 or older and lose, but put up a valiant effort.`,
    points: 125,
    proofType: 'VIDEO',
    category: 'People',

  },
  {
    title: `Yodeling... Is an ART!!!`,
    description: `Have one team member yodel at the base of a water tower, a second team member must play the part of the echo.`,
    points: 100,
    proofType: 'VIDEO',
    category: 'Music',

  },
  {
    title: "When the Chips are Down...",
    description: "Gather your entire team around a cow patty and sing \"Home on the Range\" together.",
    points: 100,
    proofType: "VIDEO",
    category: "Music"
  },
  {
    title: "Apartment Gothic",
    description: "Recreate the famous American Gothic painting using a boat paddle or oar, with an apartment building in the background.",
    points: 125,
    proofType: "PHOTO",
    category: "Art"
  },
  {
    title: "A Very Important Meeting",
    description: "Have your entire team sit together somewhere public and conduct a completely serious 30-second business meeting about an obviously ridiculous subject.",
    points: 100,
    proofType: "VIDEO",
    category: "Pranks",
  },
  {
    title: "Name That Tune",
    description: "Hum a recognizable song to a stranger and have them correctly identify the song. You may not sing any lyrics.",
    points: 100,
    proofType: "VIDEO",
    category: "Music",
  },
  {
    title: "Ship-Shape Directions",
    description: "Have one team member give another team member turn-by-turn directions to a nearby location with at least 7 turns, using only nautical terminology. They may use terms such as port, starboard, bow, stern, ahead, astern, and abaft, but may not use the words left, right, north, south, east, or west. No gesturing or pointing allowed.",
    points: 100,
    proofType: "VIDEO",
    category: "Games",
  },
  {
    title: "And the winner by an antenne...",
    description: "Find two bugs already moving along a public sidewalk and cheer them on as they race toward a finish line of your choosing. Do not touch, move, block, or otherwise interfere with the bugs.",
    points: 100,
    proofType: "VIDEO",
    category: "Animals",
  },
  {
    title: "Raising the Bar",
    description: "Choose two different brands of candy bar and have two team members hold a 30-second public debate arguing which candy bar is superior. The debate must be conducted in a public place where others can hear it.",
    points: 100,
    proofType: "VIDEO",
    category: "Pranks",
  },
  {
    title: "Saltine Serenade",
    description: "A team member must eat three saltine crackers, then whistle the tune of \"Whistle While You Work\" from start to finish.",
    points: 100,
    proofType: "VIDEO",
    category: "Music",
  },
];

const defaultRules = [
  {
    title: 'HOW TO PLAY',
    body: 'Work together as a team to complete as many challenges as possible before time expires. Each challenge must include the required photo or video proof, and the Team Captain is responsible for submitting it through the Hunt app.',
  },
  {
    title: 'SCORING',
    body: 'Each task is worth the number of points displayed on the task.',
  },
  {
    title: 'Obey the Law',
    body: 'All participants must obey all applicable federal, state, and local laws and regulations while participating in the Hunt. Do not trespass, break laws, damage property, harass people, or otherwise violate the rules of a location in order to complete a Challenge.',
  },
  {
    title: 'Drivers',
    body: 'No reckless driving. Also, obey speed limits. See "Obey the Law."',
  },
  {
    title: 'Respect People and Places',
    body: 'Respect other people, businesses, properties, and public spaces. If the way you are planning to complete a Challenge is likely to cause problems or unnecessary friction, find another way to complete it. When a Challenge involves another person, be respectful and obtain their permission when appropriate. Do not pressure someone into participating.',
  },
  {
    title: 'Stay Safe',
    body: 'Unless a Challenge specifically states otherwise, participants should not put themselves, other people, or property at unnecessary risk in an attempt to complete a Challenge.',
  },
  {
    title: 'Teams',
    body: 'No participant may change teams without permission from the Game Master. Teams may not sabotage another team, interfere with another team’s progress, or intentionally prevent another team from completing a Challenge. A team does not have to complete every Challenge, so think strategically about which Challenges are worth pursuing. Pay attention to the number of participants a Challenge requires and make sure the required participants are actually involved.',
  },
  {
    title: 'No Purchases Required',
    body: 'Challenges are intended to be completed without requiring participants to purchase anything. Think creatively and use what is available to you.',
  },
  {
    title: 'Proof Requirements',
    body: 'A Challenge is completed by fulfilling all of its listed requirements. Photo or video proof must clearly demonstrate that the Challenge was completed. The required type of proof is specified by each Challenge, and if a Challenge has specific requirements, all of those requirements must be met to receive its points.',
  },
  {
    title: 'Game Master Authority',
    body: 'The Game Master reviews submitted Challenges and has the final authority to accept or reject a submission. A submission may be rejected if the Challenge requirements were not met, the proof is insufficient, or the submission otherwise violates the rules. The Game Master has final authority to interpret the rules, resolve disputes, and make decisions when the rules or Challenge wording are unclear.',
  },
  {
    title: 'Have Fun',
    body: 'Most importantly: have fun, be creative, and see what ridiculous, clever, and unexpected things your team can accomplish!',
  },
  {
    title: 'RETURN TIME BONUS',
    body: 'Teams that return to the finish during the return window will receive the return bonus points. The Game Master must confirm your return. No team may hinder another team from returning on time.',
  },
];

export const defaultStyleProfiles = [
  { category: 'Team Photo', musicPath: 'packages/server/assets/audio/team-photo', transitions: ['fade', 'wipeleft'], photoHold: 2.5, energy: 'medium', font: 'Arial', textColor: '#ffffff', overlay: 'lower_third' },
  { category: 'People', musicPath: 'packages/server/assets/audio/people', transitions: ['wipeleft', 'zoomin', 'dissolve'], photoHold: 2.0, energy: 'high', font: 'Arial', textColor: '#ffffff', overlay: 'lower_third' },
  { category: 'Memories', musicPath: 'packages/server/assets/audio/memories', transitions: ['fade', 'fade', 'wipeup'], photoHold: 3.0, energy: 'medium', font: 'Arial', textColor: '#ffffff', overlay: 'lower_third' },
  { category: 'History', musicPath: 'packages/server/assets/audio/history', transitions: ['wipeleft', 'wipeup', 'fade'], photoHold: 2.5, energy: 'medium', font: 'Arial', textColor: '#ffffff', overlay: 'lower_third' },
  { category: 'Music', musicPath: 'packages/server/assets/audio/music', transitions: ['zoomin', 'wipeleft', 'dissolve'], photoHold: 1.8, energy: 'high', font: 'Arial', textColor: '#ffffff', overlay: 'lower_third' },
  { category: 'Pranks', musicPath: 'packages/server/assets/audio/pranks', transitions: ['zoomin', 'wipeleft', 'dissolve'], photoHold: 1.8, energy: 'high', font: 'Arial', textColor: '#ffffff', overlay: 'lower_third' },
  { category: 'Animals', musicPath: 'packages/server/assets/audio/animals', transitions: ['fade', 'wipeup', 'fade'], photoHold: 2.5, energy: 'medium', font: 'Arial', textColor: '#ffffff', overlay: 'lower_third' },
  { category: 'Games', musicPath: 'packages/server/assets/audio/games', transitions: ['wipeleft', 'zoomin', 'dissolve'], photoHold: 2.0, energy: 'high', font: 'Arial', textColor: '#ffffff', overlay: 'lower_third' },
  { category: 'Vehicles', musicPath: 'packages/server/assets/audio/vehicles', transitions: ['wipeleft', 'zoomin', 'dissolve'], photoHold: 2.0, energy: 'high', font: 'Arial', textColor: '#ffffff', overlay: 'lower_third' },
  { category: 'Art', musicPath: 'packages/server/assets/audio/art', transitions: ['fade', 'wipeup', 'fade'], photoHold: 3.0, energy: 'medium', font: 'Arial', textColor: '#ffffff', overlay: 'lower_third' },
  { category: 'Nature', musicPath: 'packages/server/assets/audio/nature', transitions: ['fade', 'wipeup', 'fade'], photoHold: 3.0, energy: 'medium', font: 'Arial', textColor: '#ffffff', overlay: 'lower_third' },
  { category: 'General', musicPath: 'packages/server/assets/audio/general', transitions: ['fade', 'wipeleft', 'fade'], photoHold: 2.5, energy: 'medium', font: 'Arial', textColor: '#ffffff', overlay: 'lower_third' },
];

export const defaultSystemSettings = {
  foodDriveEnabled: true,
  foodDrivePointsPerItem: 25,
  foodDrivePermissible: 'canned goods, boxed pasta, rice, peanut butter',
  foodDriveSuggested: 'soup, canned vegetables, cereal, diapers',
  captainCanUpdateFoodDrive: true,
  returnBonusEnabled: true,
  returnBonusWindowMinutes: 10,
  returnBonusPoints: 100,
  randomizeReturnBonus: true,
  welcomeShown: false,
  tourStep: 0,
  tourDone: false,
  defaultRules: JSON.stringify(defaultRules),
  defaultTasks: JSON.stringify(defaultTasks),
  taskCategories: JSON.stringify([
    'Team Photo',
    'People',
    'Memories',
    'History',
    'Music',
    'Pranks',
    'Animals',
    'Games',
    'Vehicles',
    'Art',
    'Nature',
  ]),
};

export async function seedSystemSettings() {
  try {
    const existing = await db.systemSettings.findFirst();
    if (!existing) {
      await db.systemSettings.create({ data: defaultSystemSettings });
      logger.info('Seeded default system settings');
    }
  } catch (err) {
    logger.error('Could not seed system settings', err);
  }
}

export async function seedStyleProfiles() {
  try {
    const existing = await db.styleProfile.count();
    if (!existing) {
      await db.styleProfile.createMany({ data: defaultStyleProfiles, skipDuplicates: true });
      logger.info('Seeded default style profiles');
    }
  } catch (err) {
    logger.error('Could not seed style profiles', err);
  }
}

export async function getSystemSettings() {
  let settings = await db.systemSettings.findFirst();
  if (!settings) {
    settings = await db.systemSettings.create({ data: defaultSystemSettings });
  }
  return settings;
}

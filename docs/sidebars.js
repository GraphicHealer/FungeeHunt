// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docsSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Game Master',
      items: [
        'game-master/create-game',
        'game-master/dashboard',
        'game-master/tasks',
        'game-master/players-teams',
        'game-master/submissions',
        'game-master/bonuses-rules-settings',
        'game-master/ending',
      ],
    },
    {
      type: 'category',
      label: 'Gameplay',
      items: ['gameplay/players', 'gameplay/teams', 'gameplay/spectator'],
    },
    {
      type: 'category',
      label: 'Administration',
      items: ['admin/dashboard', 'admin/settings', 'admin/email'],
    },
    {
      type: 'category',
      label: 'Deployment',
      items: ['deployment/docker', 'deployment/unraid', 'deployment/env'],
    },
  ],
};

module.exports = sidebars;

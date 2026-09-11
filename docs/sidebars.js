// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docsSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Administration',
      items: ['admin/email', 'admin/settings'],
    },
    {
      type: 'category',
      label: 'Gameplay',
      items: ['gameplay/players', 'gameplay/teams', 'gameplay/spectator'],
    },
    {
      type: 'category',
      label: 'Deployment',
      items: ['deployment/docker', 'deployment/unraid'],
    },
  ],
};

module.exports = sidebars;

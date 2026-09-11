// @ts-check
// @ts-check
// @ts-check
/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Fungee-Hunt',
  tagline: 'Self-hosted scavenger-hunt platform documentation',

  url: 'https://docs.fungeehunt.com',
  baseUrl: '/',

  organizationName: 'GraphicHealer',
  projectName: 'FungeeHunt',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          editUrl: 'https://github.com/GraphicHealer/FungeeHunt/tree/main/docs/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'Fungee-Hunt',
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'docsSidebar',
            position: 'left',
            label: 'Docs',
          },
          {
            href: 'https://github.com/GraphicHealer/FungeeHunt',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              { label: 'Getting Started', to: '/docs/intro' },
            ],
          },
          {
            title: 'Project',
            items: [
              { label: 'GitHub', href: 'https://github.com/GraphicHealer/FungeeHunt' },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Fungee-Hunt. Built with Docusaurus.`,
      },
      prism: {
        theme: require('prism-react-renderer').themes.github,
        darkTheme: require('prism-react-renderer').themes.dracula,
      },
    }),
};

module.exports = config;

/* global chrome */
/// <reference path='../../node_modules/@types/chrome/index.d.ts'/>
"../../node_modules/@types/chrome/index.d.ts";

chrome.options.opts.about = `
  <p>
    Proudly created by <a href="https://github.com/alexweininger">Alex Weininger</a> and <a href="https://github.com/alexweininger/recent-pdf/graphs/contributors">many others</a> on <a href="https://github.com/alexweininger/recent-pdf">GitHub</a>.
  </p>

  <p>
    For any questions, feature requests, or feedback please open an issue <a href="https://github.com/alexweininger/recent-pdf/issues">here</a>.
  </p>
`;

chrome.options.addTab('General', [
  {
    name: 'defaultTab',
    type: 'select',
    desc: 'Tab that is selected when RecentPDF is first opened.',
    options: [
      'Online files', 'Local files'
    ]
  },
  {
    name: 'syncOnlineFiles',
    type: 'checkbox',
    desc: 'Sync my recently visited online PDF links wherever you log in to Google Chrome.',
    default: true
  },
  {
    name: 'maxFilesToStore',
    type: 'text',
    desc: 'Maximum number of recently visited online PDF links to store either locally, or synced.',
    default: 100,
    validate: function (value) {
      try {
        const valueInt = parseInt(value);
        const isValid = Number.isInteger(valueInt) && valueInt > 0 && valueInt <= 1000;
        return isValid;
      } catch (error) {
        console.log(`Error parsing input value: ${error}`);
      }
    }
  },
  {
    name: 'daysToRemember',
    type: 'text',
    desc: 'Maximum number of days since you visited the online PDF link to keep in storage.',
    default: 60,
    validate: function (value) {
      try {
        const valueInt = parseInt(value);
        const isValid = Number.isInteger(valueInt) && valueInt > 0 && valueInt <= 1000;
        return isValid;
      } catch (error) {
        console.log(`Error parsing input value: ${error}`);
      }
    }
  },
  {
    name: 'maxFilesToShow',
    type: 'text',
    desc: 'Maximum number of files to display',
    default: 30,
    validate: function (value) {
      try {
        const valueInt = parseInt(value);
        const isValid = Number.isInteger(valueInt) && valueInt > 0 && valueInt <= maxFilesToShowLimit;
        return isValid;
      } catch (error) {
        console.log(`Error parsing input value: ${error}`);
      }
    }
  },
  {
    name: 'colorTheme',
    type: 'select',
    desc: 'Color theme for the RecentPDF UI.',
    options: ['Light', 'Dark']
  },
]);

/* global chrome */
/// <reference path='../../node_modules/@types/chrome/index.d.ts'/>
"../../node_modules/@types/chrome/index.d.ts";

chrome.options.opts.about = `
  <p>This is my about page :)</p>
  <p>
    See how this demo's options are structured
    in the <a href="options.js">options.js</a> file
  </p>
`;

chrome.options.addTab('General', [
  {
    name: 'defaultTab',
    type: 'select',
    desc: 'Default tab',
    options: [
      'Online files', 'Local files'
    ]
  },
  {
    name: 'colorTheme',
    type: 'select',
    desc: 'Which color theme you would like to use',
    options: ['Light', 'Dark']
  }
])
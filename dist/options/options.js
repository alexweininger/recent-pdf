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

const maxFilesToShowLimit = 1000

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
  },
  {
    name: 'maxFilesToShow',
    type: 'text',
    desc: 'Maximum number of files to display',
    default: 30,
    validate: function (value) {
      try {
        const valueInt = parseInt(value)
        const isValid = Number.isInteger(valueInt) && valueInt > 0 && valueInt <= maxFilesToShowLimit
        return isValid
      } catch (error) {
        console.log(`Error parsing input value: ${error}`)
      }
    }
  }
])
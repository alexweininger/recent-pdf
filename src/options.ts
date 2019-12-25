/// <reference path='../node_modules/@types/chrome/index.d.ts'/>
'../node_modules/@types/chrome/index.d.ts';
/// <reference path='./web-ext/index.d.ts'/>

import {
  ApplicationInsights,
  IMetricTelemetry,
  IEventTelemetry,
} from '@microsoft/applicationinsights-web';

const appInsights = new ApplicationInsights({
  config: {
    instrumentationKey: '5d1d3647-64de-49ec-9cd1-c11e1d658d78',
  },
});

appInsights.loadAppInsights();
appInsights.trackPageView(); // Manually call trackPageView to establish the current user/session/pagevie

window.browser = (function() {
  return window.browser || window.chrome;
})();

// Saves options to chrome.storage
function save_options(): any {
  var defaultTab: HTMLCollectionOf<HTMLOptionElement> = (<HTMLSelectElement>(
    document.getElementById('default-tab')
  )).selectedOptions;
  console.log(defaultTab[0].value);

  window.browser.storage.sync.set(
    {
      defaultTab: defaultTab[0].value,
    },
    function() {
      // Update status to let user know options were saved.
      var status = document.getElementById('status');
      status.textContent = 'Options saved.';
    },
  );
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  window.browser.storage.sync.get(
    {
      defaultTab: 'local',
    },
    function(items) {},
  );
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', (event) => {
  event.preventDefault();
  save_options();
});

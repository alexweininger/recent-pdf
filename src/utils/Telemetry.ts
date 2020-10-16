import { ApplicationInsights } from '@microsoft/applicationinsights-web';

export namespace Telemetry {
  export const extensionVerson: string = chrome.runtime.getManifest().version;

  export let appInsights = initAppInsights();

  function initAppInsights() {
    let telemetry = new ApplicationInsights({
      config: {
        instrumentationKey: '5d1d3647-64de-49ec-9cd1-c11e1d658d78',
      },
    });

    telemetry.loadAppInsights();
    telemetry.context.application.ver = extensionVerson;

    return telemetry;
  }
}

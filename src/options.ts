/// <reference path='../node_modules/@types/chrome/index.d.ts'/>
'../node_modules/@types/chrome/index.d.ts';
// Saves options to chrome.storage
function save_options(): void {
   var defaultTab: HTMLCollectionOf<HTMLOptionElement> = (<HTMLSelectElement>document.getElementById('default-tab')).selectedOptions;
   console.log(defaultTab[0].value);

   chrome.storage.sync.set(
      {
         defaultTab: defaultTab[0].value
      },
      () => {
         // Update status to let user know options were saved.
         const status = document.getElementById('status');
         status.textContent = 'Options saved.';
      }
   );
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options(): void {
   // Use default value color = 'red' and likesColor = true.
   chrome.storage.sync.get({
    //@ts-ignore
      defaultTab: 'local'
   });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', event => {
   event.preventDefault();
   save_options();
});

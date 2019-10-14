/**
 * Create new folder for grouping elements
 * @param folderName Name to display for the folder 
 * @param headerClick Click listener for the folder header
 */
export function createFolder(folderName: string, headerClick: (event: MouseEvent) => any): HTMLDivElement {
  const folderWrapper = document.createElement('div');
  folderWrapper.classList.add('folder-wrapper');
  // Section with icon and folder title
  const folderInfo = document.createElement('div');
  folderInfo.classList.add('folder-info');
  folderInfo.addEventListener('click', headerClick);
  folderWrapper.appendChild(folderInfo);
  // Create folder icon
  const folderIcon = document.createElement('img');
  folderIcon.classList.add('folder-icon')
  folderIcon.setAttribute('src', '../../assets/folder-flat.svg');
  folderIcon.setAttribute('alt', 'Folder');
  folderInfo.appendChild(folderIcon);
  // Create folder title
  const folderTitle = document.createElement('p');
  folderTitle.textContent = folderName;
  folderTitle.classList.add('folder-title');
  folderInfo.appendChild(folderTitle);
  return folderWrapper;
}

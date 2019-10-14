export function createFolder(domain: string, headerClick: (event: MouseEvent) => any): HTMLDivElement {
  const folderWrapper = document.createElement('div');
  folderWrapper.classList.add('folder-wrapper');
  const folderInfo = document.createElement('div');
  folderInfo.classList.add('folder-info');
  folderInfo.addEventListener('click', headerClick);
  folderWrapper.appendChild(folderInfo);
  const folderIcon = document.createElement('img');
  folderIcon.classList.add('folder-icon')
  folderIcon.setAttribute('src', '../../assets/folder-flat.svg');
  folderIcon.setAttribute('alt', 'Folder');
  folderInfo.appendChild(folderIcon);
  const folderTitle = document.createElement('p');
  folderTitle.textContent = domain;
  folderTitle.classList.add('folder-title');
  folderInfo.appendChild(folderTitle);
  return folderWrapper;
}

export function appendFile(): void {
  
}
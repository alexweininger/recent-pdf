import { File, FileAction } from './File';
import { OnlineFile } from './OnlineFile';
import { LocalFile } from './LocalFile';

export interface SortType<T> {
  name: string;
  compareFunc: (a: T, b: T) => number;
}

function getAccessTimeFromFile(file: File) {
  return (file as OnlineFile).lastVisitTime || (file as LocalFile).startTime;
}

export abstract class FileList {
  name: string;
  description: string;
  files: File[];
  parent: HTMLDivElement;
  browser: typeof chrome;
  actions: FileAction[];
  currentSearchTerm: string = '';
  currentSortType: string;

  sortTypes: SortType<File>[] = [
    {
      name: 'Recently viewed',
      compareFunc: (a: File, b: File) => {
        if (getAccessTimeFromFile(a) < getAccessTimeFromFile(b)) {
          return 1;
        } else {
          return -1;
        }
      },
    },
    {
      name: 'Alphabetical',
      compareFunc: (a: File, b: File) => {
        if (a.title > b.title) {
          return 1;
        } else {
          return -1;
        }
      },
    },
    {
      name: 'Reverse alpha',
      compareFunc: (a: File, b: File) => {
        if (a.title > b.title) {
          return -1;
        } else {
          return 1;
        }
      },
    },
  ];

  abstract updateFileList: (this: FileList) => void;

  search = (text: string) => this.renderFileList(text.toLowerCase());

  sort = (text: string) => {
    console.log('sort', text);

    this.sortTypes.forEach((sortType: SortType<File>) => {
      if (sortType.name == text) {
        this.files.sort(sortType.compareFunc);
        this.renderFileList();
      }
    });
  };

  renderFileList = function(
    this: FileList,
    searchTerm: string = '',
    sortTypeText: string = this.sortTypes[0].name,
  ) {
    this.parent.innerHTML = '';

    let pinnedFileListElement: HTMLUListElement = document.querySelector(
      '#pinned-list' + this.name,
    );

    if (!pinnedFileListElement) {
      pinnedFileListElement = document.createElement('ul');
      pinnedFileListElement.id = '#pinned-list' + this.name;
      pinnedFileListElement.classList.add('file-list');
      this.parent.appendChild(pinnedFileListElement);
    }

    let pinnedFileListHeader = document.createElement('p');
    pinnedFileListHeader.innerHTML = 'Pinned Files';
    pinnedFileListElement.classList.add('file-list-header');

    let fileListHeader = document.createElement('p');
    fileListHeader.innerHTML = 'Local Files';

    let fileListElement: HTMLUListElement = document.querySelector(
      '#list-' + this.name,
    );

    if (!fileListElement) {
      fileListElement = document.createElement('ul');
      fileListElement.id = 'list-' + this.name;
      fileListElement.classList.add('file-list');
      this.parent.appendChild(fileListElement);
    }

    pinnedFileListElement.innerHTML = '';
    fileListElement.innerHTML = '';

    this.sortTypes.forEach((sortType: SortType<File>) => {
      if (sortType.name == sortTypeText) {
        this.files.sort(sortType.compareFunc);
      }
    });

    this.files.forEach((file) => {
      if (file.title.toLowerCase().indexOf(searchTerm) > -1) {
        if (file.pinned) {
          // @ts-ignore
          pinnedFileListElement.prepend(pinnedFileListHeader);
          pinnedFileListElement.appendChild(file.renderFile());
        } else {
          fileListElement.appendChild(file.renderFile());
        }
      }
    });
  };

  constructor(
    name: string,
    description: string,
    files: File[],
    parent: HTMLDivElement,
    browser: typeof chrome,
  ) {
    this.name = name;
    this.description = description;
    this.files = files;
    this.parent = parent;
    this.browser = browser;
  }
}

/// <reference path='../node_modules/@types/chrome/index.d.ts'/>
/// <reference path='./web-ext/index.d.ts'/>

import { File, FileAction } from './File';

export let tabs: FileList[];

export abstract class FileList {
	name: string;
	description: string;
	files: File[];
	parent: HTMLDivElement;
	browser: typeof chrome;
	actions: FileAction[];

	abstract updateFileList: (this: FileList) => void;

	search = (text: string) => this.renderFileList(text.toLowerCase());

	renderFileList = function(this: FileList, searchTerm: string='') {

		this.parent.innerHTML = '';

		let pinnedFileListElement = document.querySelector('#pinned-list' + this.name);

		if (!pinnedFileListElement) {
			pinnedFileListElement = document.createElement('ul');
			pinnedFileListElement.id = '#pinned-list' + this.name;
			pinnedFileListElement.classList.add('file-list');
			this.parent.appendChild(pinnedFileListElement);
		}

		let pinnedFileListHeader = document.createElement('p');
		pinnedFileListHeader.innerHTML = 'Pinned Files';

		let fileListHeader = document.createElement('p');
		fileListHeader.innerHTML = 'Local Files';

		let fileListElement = document.querySelector('#list-' + this.name);

		if (!fileListElement) {
			fileListElement = document.createElement('ul');
			fileListElement.id = 'list-' + this.name;
			fileListElement.classList.add('file-list');
			this.parent.appendChild(fileListElement);
		}

		pinnedFileListElement.innerHTML = '';
		fileListElement.innerHTML = '';

		this.files.forEach(file => {
			if (file.title.toLowerCase().indexOf(searchTerm) > -1) {
				if (file.pinned) {
					pinnedFileListElement.prepend(pinnedFileListHeader);
					pinnedFileListElement.appendChild(file.renderFile());
				} else {
					fileListElement.appendChild(file.renderFile());
				}
			}
		});
	};

	constructor(name: string, description: string, files: File[], parent: HTMLDivElement, browser: typeof chrome) {
		this.name = name;
		this.description = description;
		this.files = files;
		this.parent = parent;
		this.browser = browser;
	}
}

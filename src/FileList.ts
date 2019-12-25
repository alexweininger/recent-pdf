/// <reference path='../node_modules/@types/chrome/index.d.ts'/>
/// <reference path='./web-ext/index.d.ts'/>

import { File, FileAction } from './File';

export let tabs: FileList[];

export interface SortType<T> {
	name: string,
	compareFunc: (a: T, b: T) => number;
}

export abstract class FileList {
	name: string;
	description: string;
	files: File[];
	parent: HTMLDivElement;
	browser: typeof chrome;
	actions: FileAction[];
	sortTypes: SortType<File>[] = [
		{
			name: 'Alphabetical',
			compareFunc: (a: File, b: File) => {
				if (a.title > b.title) {
					return 1;
				} else {
					return -1;
				}
			}
		},
		{
			name: 'Reverse alpha',
			compareFunc: (a: File, b: File) => {
				if (a.title > b.title) {
					return -1;
				} else {
					return 1;
				}
			}
		}
	]

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
	}

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
		pinnedFileListElement.classList.add('file-list-header');


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

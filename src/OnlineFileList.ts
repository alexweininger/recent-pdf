/// <reference path='../node_modules/@types/chrome/index.d.ts'/>
/// <reference path='./web-ext/index.d.ts'/>

import { FileList } from './FileList';
import { LocalFile } from './LocalFile';
import { IMetricTelemetry } from '@microsoft/applicationinsights-web';
import { Telemetry } from './Telemetry';
import { File } from './File';
import { options } from './OptionsProvider';
import { OnlineFile } from './OnlineFile';

interface OnlineFiles {
	[url: string]: chrome.history.HistoryItem;
}

export class OnlineFileList extends FileList {
	onlineFiles: OnlineFiles = {};

	updateFileList = async function(this: OnlineFileList): Promise<void> {
		let updateFiles = (value: any) => {

			if (!this.onlineFiles) {
				this.onlineFiles = {};
			}

			window.browser.history.search(
				{
					text: '.pdf',
					startTime: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).getMilliseconds(),
					maxResults: 1000
				},
				(data: chrome.history.HistoryItem[]) => {
					data.forEach((page: chrome.history.HistoryItem) => {
						if (page.url.endsWith('.pdf') || page.url.endsWith('.PDF')) {
							if (!page.url.startsWith('file:')) {
								this.onlineFiles[page.url] = page;
								let onlineFile: OnlineFile = new OnlineFile(page);
								onlineFile.onPropertyChanged = () => this.renderFileList();
								this.files.push(onlineFile);
							}
						}
					});



					this.renderFileList();
				}
			);
		};

		updateFiles(undefined);
	};

	constructor(name: string, description: string, files: File[], parent: HTMLDivElement, browser: typeof chrome) {
		super(name, description, files, parent, browser);
	}
}

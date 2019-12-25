import { Utils } from './Utils';
import { IEventTelemetry } from '@microsoft/applicationinsights-web';
import { Telemetry } from './Telemetry';
import { File, FileAction } from './File';

export class LocalFile extends File implements chrome.downloads.DownloadItem {
	readonly title: string;
	readonly url: string;
	readonly iconPath = `../../test-icons/icons8-globe-48.png`;

	public pinned: boolean;

	readonly bytesReceived: number;
	readonly danger: string;
	readonly totalBytes: number;
	readonly filename: string;
	readonly paused: boolean;
	readonly state: string;
	readonly mime: string;
	readonly fileSize: number;
	readonly startTime: string;
	readonly error?: string;
	readonly endTime?: string;
	readonly id: number;
	readonly incognito: boolean;
	readonly referrer: string;
	readonly estimatedEndTime?: string;
	readonly canResume: boolean;
	readonly exists: boolean;
	readonly byExtensionId?: string;
	readonly byExtensionName?: string;

	constructor(downloadItem: chrome.downloads.DownloadItem, pinned: boolean = false) {
		super();
		this.bytesReceived = downloadItem.bytesReceived;
		this.danger = downloadItem.danger;
		this.totalBytes = downloadItem.totalBytes;
		this.filename = downloadItem.filename;
		this.paused = downloadItem.paused;
		this.state = downloadItem.state;
		this.mime = downloadItem.mime;
		this.fileSize = downloadItem.fileSize;
		this.startTime = downloadItem.startTime;
		this.error = downloadItem.error;
		this.endTime = downloadItem.endTime;
		this.id = downloadItem.id;
		this.incognito = downloadItem.incognito;
		this.referrer = downloadItem.referrer;
		this.estimatedEndTime = downloadItem.estimatedEndTime;
		this.canResume = downloadItem.canResume;
		this.exists = downloadItem.exists;
		this.byExtensionId = downloadItem.byExtensionId;
		this.byExtensionName = downloadItem.byExtensionName;

		this.pinned = pinned;
		this.title = this.getTitle();
	}

	getTitle = function(this: LocalFile): string {
		return this.filename.substring(this.filename.lastIndexOf(Utils.slashType) + 1, this.filename.length - 4);
	};

	getPrettyUrl = function(this: LocalFile): string {
		let value = this.filename.replace(this.filename, '');
		if (value.endsWith('\\')) {
			value = value.substring(0, value.length - 1);
		}
		return value;
	};

	renderFile = function(this: LocalFile): HTMLLIElement {
		let actionContainer = document.createElement('div');
		this.renderActions(actionContainer);

		let leftDiv: HTMLDivElement = document.createElement('div');
		let rightDiv: HTMLDivElement = document.createElement('div');
		leftDiv.classList.add('list-div', 'left');
		rightDiv.classList.add('list-div', 'right');

		let fileItem: HTMLLIElement = document.createElement('li');
		fileItem.classList.add('list-item', 'file-item');

		let icon: HTMLImageElement = document.createElement('img');
		icon.classList.add('link-thumb');
		icon.src = this.iconPath;

		let title: HTMLParagraphElement = document.createElement('p');
		title.classList.add('link-title', 'local-title');

		title.innerText = this.title;

		title.onclick = () => {
			let openLocalFileEvent: IEventTelemetry = {
				name: 'openLocalFile'
			};

			Telemetry.appInsights.trackEvent(openLocalFileEvent);
			Telemetry.appInsights.flush();
			window.browser.downloads.open(this.id);
		};

		let linkUrl: HTMLParagraphElement = document.createElement('p');
		linkUrl.classList.add('link-url');

		if (this.filename.length - this.title.length > 60) {
			linkUrl.title = this.filename;
		}
		linkUrl.innerHTML = this.getPrettyUrl();

		leftDiv.appendChild(icon);
		leftDiv.appendChild(title);
		leftDiv.appendChild(linkUrl);
		leftDiv.appendChild(actionContainer);
		fileItem.appendChild(leftDiv);
		fileItem.appendChild(rightDiv);

		return fileItem;
	};

	actions: FileAction[] = [
		{
			name: 'Open file',
			description: 'Open PDF in default PDF viewer.',
			enabled: () => true, // add checks to see if file exists, etc.
			execute: () => {
				let openLocalFileEvent: IEventTelemetry = {
					name: 'openLocalFile'
				};

				Telemetry.appInsights.trackEvent(openLocalFileEvent);
				Telemetry.appInsights.flush();

				chrome.downloads.open(this.id);
			}
		},
		{
			name: 'Show in folder',
			description: 'Show PDF in the default file browser.',
			enabled: () => true, // add checks to see if file exists, etc.
			execute: () => {
				let showLocalFileEvent: IEventTelemetry = {
					name: 'showLocalFile'
				};

				Telemetry.appInsights.trackEvent(showLocalFileEvent);
				Telemetry.appInsights.flush();

				chrome.downloads.show(this.id);
			}
		},
		{
			name: 'Pin file',
			description: 'Pin file to the top of the list.',
			enabled: () => !this.pinned,
			execute: () => {
				this.pinned = true;

				let pinLocalFileEvent: IEventTelemetry = {
					name: 'pinLocalFile'
				};

				this.onPropertyChanged();

				Telemetry.appInsights.trackEvent(pinLocalFileEvent);
				Telemetry.appInsights.flush();
			}
		},
		{
			name: 'Unpin file',
			description: 'Unpin file and return it to its normal position in the list.',
			enabled: () => this.pinned,
			execute: () => {
				this.pinned = false;

				this.onPropertyChanged();

				let unpinLocalFileEvent: IEventTelemetry = {
					name: 'unpinLocalFile'
				};

				Telemetry.appInsights.trackEvent(unpinLocalFileEvent);
				Telemetry.appInsights.flush();
			}
		}
	];
}

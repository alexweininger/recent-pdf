import { IEventTelemetry } from '@microsoft/applicationinsights-web';
import { File, FileAction } from './File';
import { Telemetry } from '../utils/Telemetry';

export class OnlineFile extends File implements chrome.history.HistoryItem {
	readonly typedCount?: number;
	readonly lastVisitTime?: number;
	readonly visitCount?: number;
	readonly id: string;
	readonly prettyUrl: string;
	readonly title: string;
	readonly iconPath = '../../test-icons/icons8-file-50.png';

	constructor(historyItem: chrome.history.HistoryItem) {
		super();
		this.id = historyItem.id;
		this.lastVisitTime = historyItem.lastVisitTime;
		this.typedCount = historyItem.typedCount;
		this.visitCount = historyItem.visitCount;
		this.url = historyItem.url;

		this.title = this.getTitle();
		this.prettyUrl = this.getPrettyUrl();
	}

	renderFile = function(this: OnlineFile): HTMLLIElement {
		let actionContainer = document.createElement('div');
		this.renderActions(actionContainer);

		let listItem: HTMLLIElement = document.createElement('li');
		listItem.classList.add('list-item');

		let leftDiv: HTMLDivElement = document.createElement('div');
		leftDiv.classList.add('list-div', 'left');

		let title: HTMLParagraphElement = document.createElement('p');
		title.classList.add('link-title', 'local-title');
		title.innerText = this.title;

		let linkUrl: HTMLParagraphElement = document.createElement('p');
		linkUrl.classList.add('link-url');
		linkUrl.innerHTML = this.prettyUrl;

		let icon: HTMLImageElement = document.createElement('img');
		icon.classList.add('link-thumb');
		icon.src = this.iconPath;

		leftDiv.appendChild(icon);
		leftDiv.appendChild(title);
		leftDiv.appendChild(linkUrl);
		leftDiv.appendChild(actionContainer);

		title.addEventListener('click', () => {
			let openOnlineFileEvent: IEventTelemetry = {
				name: 'openOnlineFile',
				properties: {
					visitCount: this.visitCount,
					typedCount: this.typedCount,
					lastVisitTime: this.lastVisitTime
				}
			};
			Telemetry.appInsights.trackEvent(openOnlineFileEvent);
			Telemetry.appInsights.flush();

			window.open(this.url);
		});

		listItem.appendChild(leftDiv);

		return listItem;
	};

	getTitle = function(this: OnlineFile): string {
		let URI = decodeURI(this.url);
		return URI.substring(URI.lastIndexOf('/') + 1, this.url.length - 4);
	};

	getPrettyUrl = function(this: OnlineFile): string {
		return decodeURI(this.url).replace(' ', '');
	};

	actions: FileAction[] = [
		{
			name: 'Open file',
			description: 'Open file in a new tab.',
			enabled: () => true,
			execute: (file: OnlineFile) => {
				window.open(file.url);
			}
		},
		{
			name: 'Pin file',
			description: 'Pin file to the top of the list.',
			enabled: () => !this.pinned,
			execute: () => {
				this.pinned = true;
				this.onPropertyChanged();
			}
		},
		{
			name: 'Unpin file',
			description: 'Unpin file and return it to its normal position in the list.',
			enabled: () => this.pinned,
			execute: () => {
				this.pinned = false;
				this.onPropertyChanged();
			}
		}
	];
}

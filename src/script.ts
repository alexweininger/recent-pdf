/// <reference path='../node_modules/@types/chrome/index.d.ts'/>
/// <reference path='./web-ext/index.d.ts'/>

import { ApplicationInsights, IMetricTelemetry, IEventTelemetry } from '@microsoft/applicationinsights-web';

const extensionVerson: string = chrome.runtime.getManifest().version;

const appInsights = new ApplicationInsights({
	config: {
		instrumentationKey: '5d1d3647-64de-49ec-9cd1-c11e1d658d78'
	}
});

appInsights.loadAppInsights();
appInsights.context.application.ver = extensionVerson;

let onlineList: HTMLUListElement = <HTMLUListElement>document.getElementById('link-list'); // online file list
let fileElement: HTMLUListElement = <HTMLUListElement>document.getElementById('file-list'); // offline (local) file list
let onlineTabLink: HTMLButtonElement = <HTMLButtonElement>document.getElementById('online-tab-link');
let localTabLink: HTMLButtonElement = <HTMLButtonElement>document.getElementById('local-tab-link');
let settingsTabLink: HTMLButtonElement = <HTMLButtonElement>document.getElementById('settings-link');
let head = document.getElementsByTagName('HEAD')[0];
let currentTab: Tab;
let syncOnlineFiles: boolean = true;
let maxFilesToStore: number = 1000;
let daysToRemeber: number = 60;

appInsights.trackPageView({
	name: 'popupView'
}); // Manually call trackPageView to establish the current user/session/pageview

enum Tab {
	Local = 'local',
	Online = 'online'
}

window.browser = (function() {
	return window.browser || window.chrome;
})();

if (onlineTabLink) {
	// event handlers for tab buttons
	onlineTabLink.addEventListener('click', function(event: Event) {
		onlineFooter(onlinePdfCount);
		openTab(event, Tab.Online);
		currentTab = Tab.Online;
	});
} else {
	console.error('onlineTabLink is null');
}

// click listener for local pdf tab
if (localTabLink) {
	localTabLink.addEventListener('click', function(event: Event) {
		localFooter(localPdfCount);
		openTab(event, Tab.Local);
		currentTab = Tab.Local;
	});
} else {
	console.error('localTabLink is null');
}

// in the future, we should give the users the option to sync/not sync their online pdf list
function onOnlineFilesChanged(data: any): void {
	onlinePdfCount = 0;

	console.log('onOnlineFilesChanged', data);

	onlineList.innerHTML = ''; // clear list

	for (const key in data) {
		if (data.hasOwnProperty(key)) {
			const page: chrome.history.HistoryItem = data[key];
			onlinePdfCount++;

			if (onlinePdfCount > maxFilesToStore) {
				break;
			}

			let listItem: HTMLLIElement = document.createElement('li');
			listItem.classList.add('list-item');

			let leftDiv: HTMLDivElement = document.createElement('div');
			let rightDiv: HTMLDivElement = document.createElement('div');
			leftDiv.classList.add('list-div', 'left');
			rightDiv.classList.add('list-div', 'right');

			// make title element
			let title: HTMLParagraphElement = document.createElement('p');
			title.classList.add('link-title');
			title.classList.add('local-title');
			let URI = decodeURI(page.url);
			title.innerText = URI.substring(URI.lastIndexOf('/') + 1, page.url.length - 4);

			// make url element
			let linkUrl: HTMLParagraphElement = document.createElement('p');
			linkUrl.classList.add('link-url');
			linkUrl.innerHTML = decodeURI(page.url)
				.substring(0, 50)
				.replace(' ', '');

			// make icon element
			let icon: HTMLImageElement = document.createElement('img');
			icon.classList.add('link-thumb');
			icon.src = `chrome://favicon/${page.url}`;

			// append elements to left div
			leftDiv.appendChild(icon);
			leftDiv.appendChild(title);
			leftDiv.appendChild(linkUrl);

			// on click listener
			leftDiv.addEventListener('click', function() {

				let openOnlineFileEvent: IEventTelemetry = {
					name: 'openOnlineFile',
					properties: {
						visitCount: page.visitCount,
						typedCount: page.typedCount,
						lastVisitTime: page.lastVisitTime
					}
				};
				appInsights.trackEvent(openOnlineFileEvent);
				appInsights.flush();

				window.open(page.url);
			});

			// append to list item
			listItem.appendChild(leftDiv);
			listItem.appendChild(rightDiv);

			// append list item to online list
			onlineList.appendChild(listItem);
		}
	}

	let onlineFileCountMetric: IMetricTelemetry = {
		name: 'onlineFilesCount',
		average: onlinePdfCount
	};

	appInsights.trackMetric(onlineFileCountMetric, { maxFilesToShow: getMaxFilesValue() });
	updateFooter();
}

interface OnlineFiles {
	[url: string]: chrome.history.HistoryItem;
}

let onlineFiles: OnlineFiles = {};

let numDaysBetween = function(d1: Date, d2: Date): number {
	let diff = Math.abs(d1.getTime() - d2.getTime());
	return diff / (1000 * 60 * 60 * 24);
};

function pruneOnlineFiles(data: OnlineFiles) {
	for (const key in data) {
		if (data.hasOwnProperty(key)) {
			const page: chrome.history.HistoryItem = data[key];

			let lastVisited: Date = new Date(page.lastVisitTime);

			if (numDaysBetween(lastVisited, new Date()) > (daysToRemeber | 60)) {
				console.log('pruning', key);
				delete data[key];
			}
		}
	}
}

function fetchAndUpdateOnlineFiles() {
	let updateFiles = (value: any) => {
		onlineFiles = value['onlineFiles'];

		if (!onlineFiles) {
			onlineFiles = {};
		}

		window.browser.history.search(
			{
				text: '.pdf', // search for .pdf
				maxResults: 10000
			},
			function(data: chrome.history.HistoryItem[]) {
				// for each result
				data.forEach(function(page: chrome.history.HistoryItem) {
					// check if page is a .pdf
					if (page.url.endsWith('.pdf') || page.url.endsWith('.PDF')) {
						if (!page.url.startsWith('file:')) {
							if (onlineFiles) {
								onlineFiles[page.url] = page;
							}
						}
					}
				});

				onOnlineFilesChanged(onlineFiles);

				if (syncOnlineFiles) {
					chrome.storage.sync.set({ onlineFiles: onlineFiles }, () => {});
				} else {
					chrome.storage.local.set({ onlineFiles: onlineFiles }, () => {});
				}

				pruneOnlineFiles(onlineFiles);
			}
		);
	};

	if (syncOnlineFiles) {
		chrome.storage.sync.get(['onlineFiles'], value => updateFiles(value));
	} else {
		chrome.storage.local.get(['onlineFiles'], value => updateFiles(value));
	}
}

let onlinePdfCount: number = 0; // number of online pdf files
let localFiles: any[] = [];
let localPdfCount: number = 0; // number of local pdf files
const maxFilesDefaultValue: number = 30; // default number of files to show in case of missing/invalid setting

/**
 * searchDownloads() - searches downloads with chrome.downloads api for local pdf files
 */
function searchDownloads() {
	window.browser.downloads.search(
		{
			limit: 0,
			orderBy: ['-startTime'],
			filenameRegex: '^(.(.*.pdf$))*$'
		},
		async function(data: chrome.downloads.DownloadItem[]) {
			if (data.length == 0) {
				searchDownloads();
				return;
			}
			const maxFilesToShow = await getMaxFilesValue();

			// for x-plat
			let winos = navigator.appVersion.indexOf('Win');
			let slashType = winos !== -1 ? '\\' : '/';

			let numberOfDuplicateFiles: number = 0;

			data.forEach(function(file: chrome.downloads.DownloadItem, i: number) {
				// for each result
				if (file.filename.endsWith('.pdf') || file.filename.endsWith('.PDF')) {
					// check if file ends with .pdf or .PDF
					if (localFiles.indexOf(file.filename) === -1 && localPdfCount < maxFilesToShow) {
						// check for duplicated and maxFilesToShow value
						localFiles.push(file.filename);
						localPdfCount++;

						let leftDiv: HTMLDivElement = document.createElement('div');
						let rightDiv: HTMLDivElement = document.createElement('div');
						leftDiv.classList.add('list-div', 'left');
						rightDiv.classList.add('list-div', 'right');

						// create local file list item
						let fileItem: HTMLLIElement = document.createElement('li');
						fileItem.classList.add('list-item', 'file-item');

						// create icon element
						let icon: HTMLImageElement = document.createElement('img');
						icon.classList.add('link-thumb');
						window.browser.downloads.getFileIcon(file.id, { size: 16 }, iconUrl => {
							icon.src = iconUrl;
						});

						// create title element
						let title: HTMLParagraphElement = document.createElement('p');
						title.classList.add('link-title');
						title.classList.add('local-title');
						title.innerText = file.filename.substring(file.filename.lastIndexOf(slashType) + 1, file.filename.length - 4);

						// create file url element
						let linkUrl: HTMLParagraphElement = document.createElement('p');
						linkUrl.classList.add('link-url');
						linkUrl.innerHTML = file.filename.substring(0, 50);

						// append elements to div
						leftDiv.appendChild(icon);
						leftDiv.appendChild(title);
						leftDiv.appendChild(linkUrl);

						// on click listener
						leftDiv.addEventListener('click', function() {

							let openLocalFileEvent: IEventTelemetry = {
								name: 'openLocalFile'
							};

							appInsights.trackEvent(openLocalFileEvent);
							appInsights.flush();

							window.browser.downloads.open(file.id);
						});

						// open in file explorer button
						let more: HTMLImageElement = document.createElement('img');
						more.id = 'more_icon';
						more.src = '../../assets/More.png';
						more.addEventListener('click', function() {
							window.browser.downloads.show(file.id);

							let showLocalFileEvent: IEventTelemetry = {
								name: 'showLocalFile'
							};

							appInsights.trackEvent(showLocalFileEvent);
						});

						rightDiv.appendChild(more);
						fileItem.appendChild(leftDiv);
						fileItem.appendChild(rightDiv);
						fileElement.appendChild(fileItem);
					} else {
						numberOfDuplicateFiles++;
					}
				}
			});

			let skippedDuplicateFileCountMetric: IMetricTelemetry = {
				name: 'skippedDuplicateFileCount',
				average: numberOfDuplicateFiles
			};

			appInsights.trackMetric(skippedDuplicateFileCountMetric);

			let localFileCountMetric: IMetricTelemetry = {
				name: 'localFilesCount',
				average: localPdfCount
			};

			appInsights.trackMetric(localFileCountMetric, { maxFilesToShow: maxFilesToShow });

			updateFooter();
		}
	);
}

function updateFooter() {
	if (currentTab == Tab.Local) {
		localFooter(localPdfCount);
	} else {
		onlineFooter(onlinePdfCount);
	}
}

// load and create the online pdf footer
function onlineFooter(count: number) {
	let plural: string = count != 1 ? 's' : '';
	let countDisplay: HTMLParagraphElement = <HTMLParagraphElement>document.getElementById('count-display');
	countDisplay.innerHTML = `Showing ${count} online PDF${plural}.`;
}

// load and create the local file footer
function localFooter(count: number) {
	let plural: string = count != 1 ? 's' : '';
	let countDisplay: HTMLParagraphElement = <HTMLParagraphElement>document.getElementById('count-display');
	countDisplay.innerHTML = `Showing ${count} local PDF${plural}.`;
}

// function that handles switching between tabs
function openTab(evt: any, tab: Tab) {
	// Find active elements and remove active class from elements
	const activeElements: NodeListOf<Element> = <NodeListOf<Element>>document.querySelectorAll('.active');
	activeElements.forEach(function(elem: HTMLElement) {
		elem.classList.remove('active');
	});

	// Add active class to tab and pressed button
	const tabContent: HTMLElement = <HTMLElement>document.querySelector(`.tabcontent#${tab}`);
	if (tabContent) {
		tabContent.classList.add('active');
	}
	evt.currentTarget.classList.add('active');
	currentTab = tab;
}

async function getOption(name: string): Promise<any> {
	return new Promise((resolve, reject) => {
		window.browser.storage.sync.get(name, (result: any) => {
			if (result) {
				resolve(result);
			}
			reject(`Error in loading option ${name}`);
		});
	});
}

async function getMaxFilesValue() {
	const result = await getOption('general.maxFilesToShow');
	let maxFilesValue = result['general.maxFilesToShow'];
	if (maxFilesValue && Number.isInteger(parseInt(maxFilesValue))) {
		return parseInt(maxFilesValue);
	}
	return maxFilesDefaultValue;
}

async function fetchOption(name: string, defaultValue: any) {
	let option: any = await getOption(name);
	return option[name] || defaultValue;
}

async function loadOptions() {
	syncOnlineFiles = await fetchOption('general.syncOnlineFiles', true);
	maxFilesToStore = await fetchOption('general.maxFilesToStore', 100);
	daysToRemeber = await fetchOption('general.daysToRemember', 60);

	let maxFilesValue = await fetchOption('general.defaultTab', 30);

	let defaultTab: string = await fetchOption('general.defaultTab', 'Online files');

	console.log('defaultTab', defaultTab);

	if (defaultTab) {
		if (defaultTab == 'Online files') {
			onlineTabLink.click();
		} else if (defaultTab == 'Local files') {
			localTabLink.click();
		} else {
			localTabLink.click();
		}
	} else {
		localTabLink.click();

		let defaultTabSettingUndefinedError: Error = {
			name: 'defaultTabSettingUndefined',
			message: 'defaultTab settings is undefined'
		};

		appInsights.trackException({ id: 'defaultTabSettingUndefined', exception: defaultTabSettingUndefinedError });
	}

	let colorTheme: string = await fetchOption('general.colorTheme', 'Light');

	var link = document.createElement('link');
	link.rel = 'stylesheet';
	link.type = 'text/css';
	if (colorTheme) {
		if (colorTheme == 'Light') {
			link.href = 'style.css';
		} else if (colorTheme == 'Dark') {
			link.href = 'style_dark_mode.css';
		} else {
			link.href = 'style.css';
		}
	} else {
		link.href = 'style.css';
	}
	head.appendChild(link);

	let loadSettingsEvent: IEventTelemetry = {
		name: 'loadSettingsEvent',
		properties: {
			syncOnlineFiles: syncOnlineFiles,
			colorTheme: colorTheme,
			defaultTab: defaultTab as string,
			maxFilesToStore: maxFilesToStore,
			daysToRemeber: daysToRemeber as number,
			maxFilesToShow: maxFilesValue
		}
	};

	appInsights.trackEvent(loadSettingsEvent);
}

document.addEventListener('DOMContentLoaded', function() {
	onlineList = <HTMLUListElement>document.getElementById('link-list'); // online file list
	fileElement = <HTMLUListElement>document.getElementById('file-list'); // offline (local) file list
	onlineTabLink = <HTMLButtonElement>document.getElementById('online-tab-link');
	localTabLink = <HTMLButtonElement>document.getElementById('local-tab-link');
	settingsTabLink = <HTMLButtonElement>document.getElementById('settings-link');
	head = document.getElementsByTagName('HEAD')[0];

	loadOptions().then(() => {
		// settings click listener
		settingsTabLink.addEventListener('click', function() {
			window.browser.runtime.openOptionsPage();

			appInsights.trackEvent({ name: 'clickSettingsIcon' });
		});

		fetchAndUpdateOnlineFiles();
		searchDownloads();
	});
});

window.addEventListener('beforeunload', (ev: BeforeUnloadEvent) => {
	appInsights.flush();
});
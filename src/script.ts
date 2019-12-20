/// <reference path='../node_modules/@types/chrome/index.d.ts'/>
/// <reference path='./web-ext/index.d.ts'/>

import { ApplicationInsights, IMetricTelemetry, IEventTelemetry } from '@microsoft/applicationinsights-web';
import { OptionsProvider, IOptions, ColorThemes, Tabs } from './OptionsProvider';
import { numDaysBetween } from './Utils';

enum Tab {
	Local = 'local',
	Online = 'online'
}

interface OnlineFiles {
	[url: string]: chrome.history.HistoryItem;
}

const extensionVerson: string = chrome.runtime.getManifest().version;

const appInsights = new ApplicationInsights({
	config: {
		instrumentationKey: '5d1d3647-64de-49ec-9cd1-c11e1d658d78'
	}
});

appInsights.loadAppInsights();
appInsights.context.application.ver = extensionVerson;

appInsights.trackPageView({
	name: 'popupView'
});

let options: IOptions;

let onlineList: HTMLUListElement = <HTMLUListElement>document.getElementById('link-list'); // online file list
let fileElement: HTMLUListElement = <HTMLUListElement>document.getElementById('file-list'); // offline (local) file list
let onlineTabLink: HTMLLinkElement = <HTMLLinkElement>document.getElementById('online-tab-link');
let localTabLink: HTMLLinkElement = <HTMLLinkElement>document.getElementById('local-tab-link');
let settingsTabLink: HTMLButtonElement = <HTMLButtonElement>document.getElementById('settings-link');
let currentTab: Tab;
let syncOnlineFiles: boolean = true;
let maxFilesToStore: number = 1000;
let daysToRemeber: number = 60;
let onlinePdfCount: number = 0; // number of online pdf files
let localFiles: any[] = [];
let localPdfCount: number = 0; // number of local pdf files
let onlineFiles: OnlineFiles = {};

// for x-browser support
window.browser = (() => {
	return window.browser || window.chrome;
})();


document.addEventListener('DOMContentLoaded', () => {
	onlineList = <HTMLUListElement>document.getElementById('link-list'); // online file list
	fileElement = <HTMLUListElement>document.getElementById('file-list'); // offline (local) file list
	onlineTabLink = <HTMLLinkElement>document.getElementById('online-tab-link');
	localTabLink = <HTMLLinkElement>document.getElementById('local-tab-link');
	settingsTabLink = <HTMLButtonElement>document.getElementById('settings-link');

	let btn = document.querySelectorAll('.wave');
	let indicator: HTMLDivElement = document.querySelector('.indicator');
	let indi: number = 0;

	indicator.style.marginLeft = indi + 'px';

	for (var i = 0; i < btn.length; i++) {
		const btnI: HTMLButtonElement = <HTMLButtonElement>btn[i];
		btnI.addEventListener('click', function(e) {
			var newRound = document.createElement('div'),
				x,
				y;

			newRound.className = 'cercle';
			btnI.appendChild(newRound);

			x = e.pageX - btnI.offsetLeft;
			y = e.pageY - btnI.offsetTop;

			newRound.style.left = x + 'px';
			newRound.style.top = y + 'px';
			newRound.className += ' anim';

			indicator.style.marginLeft = indi + (parseInt(btnI.dataset.num) - 1) * 200 + 'px';

			if (parseInt(btnI.dataset.num) == 1) {
				openTab(null, Tab.Online);
			} else {
				openTab(null, Tab.Local);
			}

			setTimeout(function() {
				newRound.remove();
			}, 1200);
		});
	}

	loadOptions().then(() => {
		settingsTabLink.addEventListener('click', function() {
			window.browser.runtime.openOptionsPage();

			appInsights.trackEvent({ name: 'clickSettingsIcon' });
		});

		fetchAndUpdateOnlineFiles();
		searchDownloads();

		let searchBox: HTMLInputElement = document.querySelector('.search');

		searchBox.addEventListener('keyup', (event: KeyboardEvent) => {
			let searchText: string = searchBox.value.toLocaleLowerCase();

			if (searchText == '') {
				let clearSearch: HTMLButtonElement = document.querySelector('#clear-search');
				clearSearch.style.display = 'none';
			} else {
				let clearSearch: HTMLButtonElement = document.querySelector('#clear-search');
				clearSearch.style.display = '';
			}

			let listItems: NodeListOf<HTMLLIElement>;

			if (currentTab == Tab.Local) {
				listItems = document.querySelectorAll('#file-list > li');
			} else {
				listItems = document.querySelectorAll('#link-list > li');
			}

			// filter items
			listItems.forEach((listItem: HTMLLIElement) => {
				if (listItem.getAttribute('data-search-term').indexOf(searchText) > -1) {
					listItem.style.display = '';
				} else {
					listItem.style.display = 'none';
				}
			});
		});

		let clearSearch: HTMLButtonElement = document.querySelector('#clear-search');
		clearSearch.addEventListener('click', (event: MouseEvent) => {
			searchBox.value = '';
			searchBox.dispatchEvent(new Event('keyup'));
		});
	});
});

window.addEventListener('beforeunload', (ev: BeforeUnloadEvent) => {
	appInsights.flush();
});

// function that handles switching between tabs
function openTab(evt: any, tab: Tab): void {
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

	currentTab = tab;

	let searchBox: HTMLInputElement = document.querySelector('.search');
	searchBox.value = '';
	searchBox.dispatchEvent(new Event('keyup'));
}

function updateFooter(): void {
	if (currentTab == Tab.Local) {
		localFooter(localPdfCount);
	} else {
		onlineFooter(onlinePdfCount);
	}
}

// load and create the online pdf footer
function onlineFooter(count: number): void {
	let plural: string = count != 1 ? 's' : '';
	let countDisplay: HTMLParagraphElement = <HTMLParagraphElement>document.getElementById('count-display');
	countDisplay.innerHTML = `Showing ${count} link${plural}`;
}

// load and create the local file footer
function localFooter(count: number): void {
	let plural: string = count != 1 ? 's' : '';
	let countDisplay: HTMLParagraphElement = <HTMLParagraphElement>document.getElementById('count-display');
	countDisplay.innerHTML = `Showing ${count} file${plural}`;
}

async function loadOptions() {
	options = await OptionsProvider.fetchOptions();

	if (options.general.defaultTab == Tabs.Online) {
		onlineTabLink.click();
	} else {
		localTabLink.click();
	}

	if (options.general.colorTheme == ColorThemes.Light) {
		const root: HTMLElement = document.documentElement;

		root.style.setProperty('--main-bg-color', '#ededed');
		root.style.setProperty('--item-bg-color', 'white');
		root.style.setProperty('--link-color', 'rgb(26, 115, 232)');
		root.style.setProperty('--main-font-color', 'rgb(26, 115, 232)');
		root.style.setProperty('--sub-font-color', '#494949');
		root.style.setProperty('--imp-font-color', 'black');
		root.style.setProperty('--inactive-tab-color', '#ededed');
		root.style.setProperty('--tab-hover-color', 'rgb(154, 160, 166)');
		root.style.setProperty('--scrollbar-color', '#eee');
		root.style.setProperty('--shadow-color', '#d9d9d9');
		root.style.setProperty('--border-color', '#eee');
		root.style.setProperty('--header-color', 'white');
		root.style.setProperty('--tab-font-color', '#494949');
	}

	const loadSettingsEvent: IEventTelemetry = {
		name: 'loadSettingsEvent',
		properties: options
	};

	appInsights.trackEvent(loadSettingsEvent);
}

// in the future, we should give the users the option to sync/not sync their online pdf list
function onOnlineFilesChanged(data: any): void {
	onlinePdfCount = 0;

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
			leftDiv.classList.add('list-div', 'left');

			// make title element
			let title: HTMLParagraphElement = document.createElement('p');
			title.classList.add('link-title');
			title.classList.add('local-title');
			let URI = decodeURI(page.url);
			title.innerText = URI.substring(URI.lastIndexOf('/') + 1, page.url.length - 4);

			// make url element
			let linkUrl: HTMLParagraphElement = document.createElement('p');
			linkUrl.classList.add('link-url');
			linkUrl.innerHTML = decodeURI(page.url).replace(' ', '');

			// make icon element
			let icon: HTMLImageElement = document.createElement('img');
			icon.classList.add('link-thumb');
			icon.src = `../../test-icons/icons8-globe-48.png`;

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

			listItem.setAttribute('data-search-term', page.url.toLocaleLowerCase());

			// append to list item
			listItem.appendChild(leftDiv);

			// append list item to online list
			onlineList.appendChild(listItem);
		}
	}

	let onlineFileCountMetric: IMetricTelemetry = {
		name: 'onlineFilesCount',
		average: onlinePdfCount
	};

	appInsights.trackMetric(onlineFileCountMetric, { maxFilesToShow: options.general.maxFilesToShow });
	updateFooter();
}

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

			// for x-plat
			let winos = navigator.appVersion.indexOf('Win');
			let slashType = winos !== -1 ? '\\' : '/';

			let numberOfDuplicateFiles: number = 0;

			data.forEach(function(file: chrome.downloads.DownloadItem, i: number) {
				// for each result
				if (file.filename.endsWith('.pdf') || file.filename.endsWith('.PDF')) {
					// check if file ends with .pdf or .PDF
					if (localFiles.indexOf(file.filename) === -1 && localPdfCount < options.general.maxFilesToShow) {
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
						window.browser.downloads.getFileIcon(file.id, { size: 32 }, iconUrl => {
							icon.src = iconUrl;
							icon.src = '../../test-icons/icons8-file-50.png';
						});

						// create title element
						let title: HTMLParagraphElement = document.createElement('p');
						title.classList.add('link-title');
						title.classList.add('local-title');
						let titleText: string = file.filename.substring(file.filename.lastIndexOf(slashType) + 1, file.filename.length - 4);
						title.innerText = titleText;

						title.onclick = function() {
							let openLocalFileEvent: IEventTelemetry = {
								name: 'openLocalFile'
							};

							appInsights.trackEvent(openLocalFileEvent);
							appInsights.flush();
							window.browser.downloads.open(file.id);
						};

						let filename = file.filename.substring(file.filename.lastIndexOf(slashType) + 1);

						// create file url element
						let linkUrl: HTMLParagraphElement = document.createElement('p');
						linkUrl.classList.add('link-url');
						if (file.filename.length - filename.length > 60) {
							linkUrl.title = file.filename;
						}
						let linkUrlText = file.filename.replace(filename, '');
						if (linkUrlText.endsWith('\\')) {
							linkUrlText = linkUrlText.substring(0, linkUrlText.length - 1);
						}
						linkUrl.innerHTML = linkUrlText;

						// append elements to div
						leftDiv.appendChild(icon);
						leftDiv.appendChild(title);
						leftDiv.appendChild(linkUrl);

						let openFileButton = document.createElement('a');
						openFileButton.classList.add('action-link');
						openFileButton.href = '#';
						openFileButton.innerText = 'Open file';
						openFileButton.onclick = (ev: MouseEvent) => {
							window.browser.downloads.open(file.id);
						};

						let expander = document.createElement('div');

						expander.appendChild(openFileButton);

						let revealInExplorer = document.createElement('a');
						revealInExplorer.classList.add('action-link');
						revealInExplorer.innerText = 'Show in folder';
						revealInExplorer.id = 'revealInExplorer_icon';
						revealInExplorer.addEventListener('click', function() {
							window.browser.downloads.show(file.id);

							let showLocalFileEvent: IEventTelemetry = {
								name: 'showLocalFile'
							};

							appInsights.trackEvent(showLocalFileEvent);
						});

						expander.appendChild(revealInExplorer);

						leftDiv.appendChild(expander);

						fileItem.setAttribute('data-search-term', filename.toLocaleLowerCase());

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

			appInsights.trackMetric(localFileCountMetric, { maxFilesToShow: options.general.maxFilesToShow });

			updateFooter();
		}
	);
}

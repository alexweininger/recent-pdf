/// <reference path='../node_modules/@types/chrome/index.d.ts'/>
/// <reference path='./web-ext/index.d.ts'/>

import { IMetricTelemetry, IEventTelemetry } from '@microsoft/applicationinsights-web';
import { OptionsProvider, IOptions, ColorThemes, Tabs, options } from './OptionsProvider';
import { numDaysBetween, Utils } from './Utils';
import { Telemetry } from './Telemetry';
import { LocalFile } from './LocalFile';
import { OnlineFile } from './OnlineFile';
import { LocalFileList } from './LocalFileList';
import { OnlineFileList } from './OnlineFileList';

enum Tab {
	Local = 'local',
	Online = 'online'
}

interface OnlineFiles {
	[url: string]: chrome.history.HistoryItem;
}

const extensionVerson: string = chrome.runtime.getManifest().version;

Telemetry.appInsights.trackPageView({
	name: 'popupView'
});

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
	let onlineDiv = <HTMLDivElement>document.getElementById('link-div'); // online file list
	let localDiv = <HTMLDivElement>document.getElementById('local-div'); // online file list
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
			Telemetry.appInsights.trackEvent({ name: 'clickSettingsIcon' });
		});

		let localFileList: LocalFileList = new LocalFileList('Local File List', 'local files', [], localDiv, window.browser);

		localFileList.updateFileList();

		let onlineFileList: OnlineFileList = new OnlineFileList('Online File List', 'online pdf links', [], onlineDiv, window.browser);

		onlineFileList.updateFileList();

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

			if (currentTab == Tab.Local) {
				localFileList.search(searchText);
			} else {
				onlineFileList.search(searchText);
			}
		});

		let clearSearch: HTMLButtonElement = document.querySelector('#clear-search');
		clearSearch.addEventListener('click', (event: MouseEvent) => {
			searchBox.value = '';
			searchBox.dispatchEvent(new Event('keyup'));
		});
	});
});

window.addEventListener('beforeunload', (ev: BeforeUnloadEvent) => {
	Telemetry.appInsights.flush();
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
	let optionsProvider = new OptionsProvider();

	await optionsProvider.fetchOptions();

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

	Telemetry.appInsights.trackEvent(loadSettingsEvent);
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

			let onlineFile: OnlineFile = new OnlineFile(page);

			// append list item to online list
			onlineList.appendChild(onlineFile.renderFile());
		}
	}

	let onlineFileCountMetric: IMetricTelemetry = {
		name: 'onlineFilesCount',
		average: onlinePdfCount
	};

	Telemetry.appInsights.trackMetric(onlineFileCountMetric, { maxFilesToShow: options.general.maxFilesToShow });
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

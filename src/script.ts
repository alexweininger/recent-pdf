/// <reference path='../node_modules/@types/chrome/index.d.ts'/>
/// <reference path='./web-ext/index.d.ts'/>

import { IEventTelemetry } from '@microsoft/applicationinsights-web';
import { LocalFileList } from './files/LocalFileList';
import { OnlineFileList } from './files/OnlineFileList';
import { ColorThemes, OptionsProvider, Tabs, IOptions } from './options/OptionsProvider';
import { Telemetry } from './utils/Telemetry';

enum Tab {
	Local = 'local',
	Online = 'online'
}

Telemetry.appInsights.trackPageView({
	name: 'popupView'
});

let onlineTabLink: HTMLLinkElement = <HTMLLinkElement>document.getElementById('online-tab-link');
let localTabLink: HTMLLinkElement = <HTMLLinkElement>document.getElementById('local-tab-link');
let settingsButton: HTMLButtonElement = <HTMLButtonElement>document.getElementById('settings-link');
let sortSelector: HTMLSelectElement = <HTMLSelectElement>document.getElementById('sort-selector');

let onlinePdfCount: number = 0;
let localPdfCount: number = 0;

let currentTab: Tab;

let localFileList: LocalFileList;
let onlineFileList: OnlineFileList;

// for x-browser support
window.browser = (() => {
	return window.browser || window.chrome;
})();

document.addEventListener('DOMContentLoaded', () => {
	let onlineDiv = <HTMLDivElement>document.getElementById('link-div'); // online file list
	let localDiv = <HTMLDivElement>document.getElementById('local-div'); // online file list
	let searchBox: HTMLInputElement = document.querySelector('.search');

	onlineTabLink = <HTMLLinkElement>document.getElementById('online-tab-link');
	localTabLink = <HTMLLinkElement>document.getElementById('local-tab-link');
	settingsButton = <HTMLButtonElement>document.getElementById('settings-link');
	sortSelector = document.querySelector('#sort-select');

	sortSelector.onchange = () => {
		if (currentTab == Tab.Local) {
			localFileList.renderFileList(searchBox.value.toLocaleLowerCase(), sortSelector.value);
		} else {
			onlineFileList.renderFileList(searchBox.value.toLocaleLowerCase(), sortSelector.value);
		}
	};

	let btn = document.querySelectorAll('.wave');
	let indicator: HTMLDivElement = document.querySelector('.indicator');
	let indi: number = 0;

	indicator.style.marginLeft = indi + 'px';

	for (let i = 0; i < btn.length; i++) {
		const btnI: HTMLButtonElement = <HTMLButtonElement>btn[i];
		btnI.addEventListener('click', function(e) {
			let newRound: HTMLDivElement = document.createElement('div');
			let x: number;
			let y: number;

			newRound.className = 'circle';
			btnI.appendChild(newRound);

			x = e.pageX - btnI.offsetLeft;
			y = e.pageY - btnI.offsetTop;

			newRound.style.left = x + 'px';
			newRound.style.top = y + 'px';
			newRound.className += ' anim';

			let tabWidth: number = window.document.body.clientWidth / btn.length;
			indicator.style.marginLeft = indi + (parseInt(btnI.dataset.num) - 1) * tabWidth + 'px';

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

	let optionsProvider = new OptionsProvider();
	optionsProvider.fetchOptions().then((options: IOptions) => {
		applyOptions(options);
		settingsButton.addEventListener('click', function() {
			window.browser.runtime.openOptionsPage();
			Telemetry.appInsights.trackEvent({ name: 'clickSettingsIcon' });
		});

		localFileList = new LocalFileList('Local File List', 'local files', [], localDiv, window.browser);
		localFileList.updateFileList();

		onlineFileList = new OnlineFileList('Online File List', 'online pdf links', [], onlineDiv, window.browser);
		onlineFileList.updateFileList();

		if (currentTab == Tab.Local) {
			sortSelector.innerHTML = '';
			localFileList.sortTypes.forEach(sortType => {
				let option: HTMLOptionElement = document.createElement('option');
				option.text = sortType.name;
				option.value = sortType.name;
				sortSelector.appendChild(option);
			});
		} else {
			sortSelector.innerHTML = '';
			onlineFileList.sortTypes.forEach(sortType => {
				let option: HTMLOptionElement = document.createElement('option');
				option.text = sortType.name;
				option.value = sortType.name;
				sortSelector.appendChild(option);
			});
		}

		searchBox.addEventListener('keyup', (event: KeyboardEvent) => {
			if (searchBox.value == '') {
				let clearSearch: HTMLButtonElement = document.querySelector('#clear-search');
				clearSearch.style.display = 'none';
			} else {
				let clearSearch: HTMLButtonElement = document.querySelector('#clear-search');
				clearSearch.style.display = '';
			}

			if (currentTab == Tab.Local) {
				localFileList.renderFileList(searchBox.value.toLocaleLowerCase(), sortSelector.value);
			} else {
				onlineFileList.renderFileList(searchBox.value.toLocaleLowerCase(), sortSelector.value);
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

	if (sortSelector && localFileList) {
		if (currentTab == Tab.Local) {
			sortSelector.innerHTML = '';
			localFileList.sortTypes.forEach(sortType => {
				let option: HTMLOptionElement = document.createElement('option');
				option.text = sortType.name;
				option.value = sortType.name;
				sortSelector.appendChild(option);
			});
		} else {
			sortSelector.innerHTML = '';
			onlineFileList.sortTypes.forEach(sortType => {
				let option: HTMLOptionElement = document.createElement('option');
				option.text = sortType.name;
				option.value = sortType.name;
				sortSelector.appendChild(option);
			});
		}
	}

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

function applyOptions(options: IOptions) {

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

	Telemetry.appInsights.trackEvent({
		name: 'loadSettingsEvent',
		properties: options
	});
}

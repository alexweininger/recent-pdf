export enum Tabs {
	Local = 'Local files',
	Online = 'Online files'
}

export enum ColorThemes {
	Dark = 'Dark',
	Light = 'Light'
}

export interface IOptions {
	general: {
		defaultTab: Tabs,
		colorTheme: ColorThemes,
		daysToRemember: number,
		maxFilesToShow: number,
		maxFilesToStore: number,
		syncOnlineFiles: boolean
	}
}

export class OptionsProvider {
	constructor() {}

	public static async fetchOptions() {

		const defaults = {
			'general.defaultTab': Tabs.Local,
			'general.colorTheme': ColorThemes.Light,
			'general.daysToRemember': 60,
			'general.maxFilesToShow': 30,
			'general.maxFilesToStore': 100,
			'general.syncOnlineFiles': true
		};

		let optionsValues: any = defaults;

		for (let option in optionsValues) {
			const value = await OptionsProvider.fetchOption(option, optionsValues[option]);
			if (value) {
			 optionsValues[option] = value;
			} else {
				console.error(`Error loading option: ${option}, got ${value}.`);
			}
		}

		const options: IOptions = {
			general: {
				defaultTab: optionsValues['general.defaultTab'],
				colorTheme: optionsValues['general.colorTheme'],
				daysToRemember:  parseInt(optionsValues['general.daysToRemember']),
				maxFilesToShow: parseInt(optionsValues['general.maxFilesToShow']),
				maxFilesToStore: parseInt(optionsValues['general.maxFilesToStore']),
				syncOnlineFiles: optionsValues['general.syncOnlineFiles']
			}
		}

		return options;
	}

	private static async fetchOption<T>(name: string, defaultValue: T): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			try {
				window.browser.storage.sync.get(name, (result: any) => {
					let value: T = result[name];
					if (value) {
						resolve(value);
					} else {
						resolve(defaultValue);
					}
				});
			} catch (e) {
				throw e;
			}
		});
	}

	public getOption(option: string) {}
}

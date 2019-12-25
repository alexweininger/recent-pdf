import { IEventTelemetry, Exception } from '@microsoft/applicationinsights-web';
import { Telemetry } from '../utils/Telemetry';

export interface FileAction {
	name: string;
	description: string;
	enabled: (file: File) => boolean;
	execute: (file: File) => void;
}

export abstract class File {
	title: string;
	url: string;
	iconPath: string;
	pinned: boolean;
	abstract actions: FileAction[];
	onPropertyChanged = ():void => {
		throw new Error('onPropertyChanged never set');
	};

	abstract getTitle: (this: File) => string;
	abstract getPrettyUrl: (this: File) => string;

	abstract renderFile: (this: File) => HTMLLIElement;

	renderActions = (parent: HTMLDivElement) => {
		this.actions.forEach((action: FileAction) => {
			if (action.enabled(this)) {
				let actionLink = document.createElement('a');
				actionLink.classList.add('action-link');
				actionLink.innerText = action.name;

				actionLink.addEventListener('click', (e: MouseEvent) => {

					action.execute(this);

					let actionEvent: IEventTelemetry = {
						name: action.name
					};

					Telemetry.appInsights.trackEvent(actionEvent);
				});

				parent.appendChild(actionLink);
			}
		});
	};
}

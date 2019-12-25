import { FileList } from './FileList';
import { LocalFile } from './LocalFile';
import { IMetricTelemetry } from '@microsoft/applicationinsights-web';
import { Telemetry } from '../utils/Telemetry';
import { File } from './File';
import { OptionsProvider } from '../options/OptionsProvider';

export class LocalFileList extends FileList {

	updateFileList = async function(this: LocalFileList): Promise<void> {
		this.browser.downloads.search(
			{
				limit: 0,
				orderBy: ['-startTime'],
				filenameRegex: '^(.(.*.pdf$))*$'
			},
			async (data: chrome.downloads.DownloadItem[]) => {
				console.log(data.length);

				if (data.length == 0) {
					this.updateFileList();
					return;
				}

				let numberOfDuplicateFiles: number = 0;

				data.forEach((file: chrome.downloads.DownloadItem, i: number) => {
					// for each result
					if (file.filename.endsWith('.pdf') || file.filename.endsWith('.PDF')) {
						let localFile: LocalFile = new LocalFile(file);

						localFile.onPropertyChanged = () => this.renderFileList();

						// check if file ends with .pdf or .PDF
						if (this.files.indexOf(localFile) === -1) {
							// check for duplicated and maxFilesToShow value
							this.files.push(localFile);
						} else {
							numberOfDuplicateFiles++;
						}
					}
				});

				let skippedDuplicateFileCountMetric: IMetricTelemetry = {
					name: 'skippedDuplicateFileCount',
					average: numberOfDuplicateFiles
				};

				Telemetry.appInsights.trackMetric(skippedDuplicateFileCountMetric);

				let localFileCountMetric: IMetricTelemetry = {
					name: 'localFilesCount',
					average: this.files.length
				};

				Telemetry.appInsights.trackMetric(localFileCountMetric);

				console.log(this.files);

				// updateFooter();
				this.renderFileList();
			}
		);
	};

	localPdfCount: number = 0;

	constructor(name: string, description: string, files: File[], parent: HTMLDivElement, browser: typeof chrome) {
		super(name, description, files, parent, browser);
	}
}

let template = `<label>
		<input type="checkbox" id="saved-tab"> Enable saved tab
		<br>
		<input type="number" id="files-per-page"> max number of files to show at a time (1-11)
	</label>
	<br>
	<div id="status"></div>
	<button id="save">Save</button>`

document.querySelector('#page-settings').innerHTML = template;
define((
	require,
	exports,
	module
) => {
	'use strict';

	const Jupyter = require('base/js/namespace'),
	      Dialog  = require('../shared/ui/dialog');

	const initialize = function() {
		patch_selection_changed();
		add_file_buttons();
	};

	const patch_selection_changed = function() {
		const original_selection_changed = Jupyter.notebook_list._selection_changed;

		Jupyter.notebook_list._selection_changed = function _selection_changed() {
			original_selection_changed.apply(this);

			// includes type (notebook, file, directory) if needed
			const selected_files = Jupyter.notebook_list.selected;

			toggle_button('vcs-share-button', selected_files.length >= 1);
			toggle_button('vcs-restore-version-button', selected_files.length === 1);
		};
	};

	const toggle_button = function(id, condition) {
		const button = document.getElementById(id);

		if (!button) {
			return undefined;
		}

		if (condition) {
			button.style.display = 'inline-block';
		} else {
			button.style.display = 'none';
		}
	};

	const add_file_buttons = function() {
		const share_button = create_file_button('Share', 'Share files via your version control', 'vcs-share-button', () => pass_files_to(Dialog.share_changes_dialog));
		const restore_version_button = create_file_button('Restore Version', 'Restore files to a previous version', 'vcs-restore-version-button', () => pass_files_to(Dialog.restore_file_version_dialog));

		add_file_button_group(share_button, restore_version_button);
	};

	const create_file_button = function(name, title, id, callback) {
		if (document.getElementById(id)) {
			return undefined;
		}

		const file_button = document.createElement('button');
		file_button.className = 'btn btn-default btn-xs';
		file_button.innerHTML = name;
		file_button.title = title;
		file_button.id = id;
		file_button.onclick = callback;
		file_button.style.display = 'none';

		return file_button;
	};

	const add_file_button_group = function(...file_buttons) {
		const file_buttons_container = document.getElementsByClassName('dynamic-buttons')[0];
		const vcs_file_button_group = document.createElement('div');
		vcs_file_button_group.className = 'btn-group';
		vcs_file_button_group.id = 'vcs-file-buttons';

		file_buttons.forEach((button) => {
			if (button) {
				vcs_file_button_group.appendChild(button);
			}
		});

		file_buttons_container.appendChild(vcs_file_button_group);
	};

	const pass_files_to = function(callback) {
		const selected_file_objects = Jupyter.notebook_list.selected;
		const selected_files = selected_file_objects.map((file_object) => file_object.name);

		callback(selected_files);
	};

	const remove_file_buttons = function() {
		const file_buttons = document.getElementById('vcs-file-buttons');

		file_buttons.parentNode.removeChild(file_buttons);
	};


	module.exports = {
		initialize
	};
});

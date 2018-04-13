define((
	require,
	exports,
	module
) => {
	'use strict';

	const Dialog = require('../shared/ui/dialog');

	let vcs = undefined;

	const initialize = function(file_status, current_folder, passed_vcs) {
		vcs = passed_vcs;
		if (file_status) {
			update_file_status(file_status);
		}

		init_work_tree(current_folder);
	};

	const update_file_status = function(file_status) {
		file_status.forEach((file_object) => {
			mark_file_status(file_object.file, file_object.status);
		});
	};

	const mark_file_status = function(file, status) {
		const file_span = document.querySelector(`#notebook_list > div.list_item.row a[href$="${file}"] > span`);

		// File is not visible in the tree (e.g. dot-files)
		if (!file_span) {
			return undefined;
		}

		// There was an update (e.g. modified -> added)
		if (file_span.className.includes('vcs-status')) {
			const class_extract_regex = /(\s|^)vcs-status-\S*/;
			const existing_vcs_status = class_extract_regex.exec(file_span.className)[1];
			file_span.classList.remove(existing_vcs_status);
		}

		file_span.classList.add(`vcs-status-${status}`);
		file_span.title = `${file} ${status} in VCS`;

		return undefined;
	};
	
	const init_work_tree = async function(current_folder) {
		const is_init = await vcs.is_repo_initialized(current_folder);
		const using_work_trees = await vcs.using_work_trees(current_folder);
		
		console.log(is_init);
		console.log(using_work_trees);
	
		if (is_init && !using_work_trees) {
			Dialog.create_info_dialog('Initializing worktrees', 'Currently initializing worktrees, window will automatically reload when done (5-10 seconds)');
			const work_tree_init = await vcs.init_work_trees(current_folder);
			
			if (work_tree_init) {
				window.location.reload();
			} else {
				console.log('F*ck');
			}
		}
	}

	module.exports = {
		initialize
	};
});

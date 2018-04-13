define((
	require,
	exports,
	module
) => {
	'use strict';

	const events         = require('base/js/events'),
	      Logger         = require('../shared/logger'),
	      Dialog         = require('../shared/ui/dialog'),
	      Utils          = require('../shared/utils'),
	      environment_check = require('../shared/environment_check'),
	      file_tree      = require('./file_tree'),
	      file_buttons   = require('./file_buttons'),
	      tree_buttons   = require('./tree_buttons'),
	      tour           = require('../shared/ui/tour'),
	      tab            = require('./tab');

	let vcs = undefined;

	const initialize = async function(passed_vcs) {
		vcs = passed_vcs;

		const environment_valid = await check_environment();

		if (environment_valid) {
			add_ui();
			bind_events();
			load_css();
		}
	};

	const check_environment = async function() {
		const current_folder = Utils.get_current_folder();
		const [environment_valid, error_dialog] = await environment_check.check_environment(vcs);

		if (!environment_valid) {
			Dialog.initialize(vcs);
			Dialog.create_error_output_dialog(error_dialog.dialog, error_dialog.error_output);
			return false;
		}

		return true;
	}

	// As browser completely refreshes, this will be evaluated every time -> no need for event
	const add_ui = async function() {
		const current_folder = Utils.get_current_folder();
		const file_status = await vcs.get_file_status(current_folder);
		const is_repo_initialized = await vcs.is_repo_initialized(current_folder);

		file_tree.initialize(file_status, current_folder, vcs);
		file_buttons.initialize();
		tree_buttons.initialize(is_repo_initialized, vcs);
		tab.initialize(is_repo_initialized);
		tour.initialize(is_repo_initialized);
		Dialog.initialize(vcs);

		return undefined;
	};

	const bind_events = function() {
		events.on('draw_notebook_list.NotebookList', add_ui);
		events.on('sessions_loaded.Dashboard', hide_vcs_session);
	};

	const unbind_events = function() {
		events.off('draw_notebook_list.NotebookList', add_ui);
		events.off('sessions_loaded.Dashboard', hide_vcs_session);
	};

	const hide_vcs_session = function(event, sessions) {
		const vcs_session_name = 'VCS (do not shutdown)';
		if (Object.prototype.hasOwnProperty.call(sessions, vcs_session_name)) {
			const vcs_session = document.querySelector('#running_list a[href^="/notebooks/VCS"');
			const vcs_session_list_element = vcs_session.parentNode.parentNode;
			vcs_session_list_element.parentNode.removeChild(vcs_session_list_element);
		}
	};

	const load_css = function() {
		const link = document.createElement('link');
		link.type = 'text/css';
		link.rel = 'stylesheet';
		link.href = require.toUrl('./vcs_integration.css');
		document.getElementsByTagName('head')[0].appendChild(link);
	};


	module.exports = {
		initialize
	};
});

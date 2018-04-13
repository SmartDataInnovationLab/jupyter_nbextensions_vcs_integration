define((
	require,
	exports,
	module
) => {
	'use strict';

	const events     = require('base/js/events'),
	      base_utils = require('base/js/utils'),
	      configmod  = require('services/config'),
	      ui         = require('./ui'),
	      Utils      = require('../shared/utils'),
	      Dialog     = require('../shared/ui/dialog'),
	      Logger     = require('../shared/logger'),
	      Patcher    = require('./patcher'),
	      environment_check = require('../shared/environment_check'),
	      vcs        = require('../shared/git');

	/**
	 * Loads the extension
	 * Creates menu entries to interact with the VCS if the chosen VCS is detected
	 */
	const load_extension = function() {
		Logger.set_log_level('log');
		Logger.info('Init');

		const options_promise = Options.load_options();
		options_promise.then((options) => {
			vcs.initialize();
			events.on('kernel_ready.VCS_Kernel', () => initialize(options));
		});
	};

	const initialize = async function(options) {
		const [environment_valid, error_dialog] = await environment_check.check_environment(vcs);

		if (environment_valid) {
			const current_folder = Utils.get_current_folder();
			const repository_initialized = await vcs.is_repo_initialized(current_folder);
			if (repository_initialized) {
				Logger.info('Init UI');
				ui.initialize(options, vcs);

				if (options.hot_patching) {
					Patcher.initialize();
				}
			}
		} else {
			Dialog.initialize(vcs);
			Dialog.create_error_output_dialog(error_dialog.dialog, error_dialog.error_output);
		}
	};


	const Options = {
		load_options() {
			let options = {
				vcs:                            'git',
				visualize_cell_changes:         true,
				visualize_cell_content_changes: true,
				reminder_commit:                true,
				hot_patching:                   true,
				toggle_deleted_cells_shortcut:  'Shift-D',
				restore_deleted_cell_shortcut:  'Shift-R'
			},
			user_config = new configmod.ConfigSection('notebook', {
				base_url: base_utils.get_body_data('base-url')
			});

			user_config.load();
			return user_config.loaded.then(() => this.overwrite_options_with_user_config(user_config, options));
		},
		overwrite_options_with_user_config(user_config, options) {
			for (const key in options) {
				if (Object.prototype.hasOwnProperty.call(user_config.data, key)) {
					options[key] = user_config.data[key];
				}
			}

			return options;
		}
	};

	module.exports = {
		load_ipython_extension: load_extension,
		load_jupyter_extension: load_extension
	};
});

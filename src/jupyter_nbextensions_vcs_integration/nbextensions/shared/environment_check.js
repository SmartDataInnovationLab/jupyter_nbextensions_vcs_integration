define((
	require,
	exports,
	module
) => {
	'use strict';

	const Utils = require('./utils');

	let vcs = {};

	const check_environment = async function(passed_vcs) {
		vcs = passed_vcs;
		try {
			await check_vcs_installed();
			await check_repository();
			return [true, {}];
		} catch(error) {
			const error_dialog = create_error_dialog(error);
			return [false, error_dialog];
		}
	};

	const check_vcs_installed = async function() {
		const is_vcs_installed = await vcs.is_vcs_installed();
		if (is_vcs_installed) {
			return true;
		} else {
			throw new Error('Your selected VCS is not installed');
		}
	};

	const check_repository = async function() {
		const current_folder = Utils.get_current_folder();
		const is_repo_initialized = await vcs.is_repo_initialized(current_folder);

		if (is_repo_initialized) {
			// When error thrown catched in check_environment
			await check_repository_sanity(current_folder);
		}

		return true;
	};

	const check_repository_sanity = async function(folder) {
		const [repository_sane, error_log] = await vcs.repository_sanity_checks(folder);

		if (!repository_sane) {
			throw new Error(error_log);
		}

		return true;
	};

	const create_error_dialog = function(error_log) {
		const dialog = {
			modal: {
				heading:     'Environment Check failed',
				description: 'Something is wrong with the environment'
			}
		};

		const error_output = {
			log: error_log
		};

		const error_dialog = {dialog, error_output};
		return error_dialog;
	}

	module.exports = {
		check_environment
	};
});

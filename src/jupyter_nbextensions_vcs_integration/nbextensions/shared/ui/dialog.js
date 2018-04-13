define((
	require,
	exports,
	module
) => {
	'use strict';

	const Jupyter      = require('base/js/namespace'),
	      base_dialog  = require('base/js/dialog'),
	      events       = require('base/js/events'),
	      base_utils   = require('base/js/utils'),
	      $            = require('jquery'),
	      bootstrap    = require('bootstrap'),
	      Utils        = require('../utils');

	let vcs = undefined,
	    current_folder = undefined;

	const initialize = function(passed_vcs, passed_folder) {
		vcs = passed_vcs;
		current_folder = passed_folder;
	};

	/*
	 * @param {Object} dialog
	 * 	@param {string} dialog.modal.heading Heading of the modal
	 *	@param {string} dialog.modal.description Description of the functionality
	 *  @param {string} dialog.input.type Type of the input
	 *  @param {string} dialog.input.validation_pattern
	 *	@param {string} dialog.input.placeholder Placeholder for the input
	 *  @param {Object Array} dialog.parameters
	 * @param {function} callback This callback is triggered when the user clicks on the action button
	 * @param {Object} callback_options
	 *  @param {Object} callback_options.parameters Will be fusioned with dialog.parameters and passed to callback
	 */
	const create_input_dialog = function(dialog, callback, callback_options) {
		const input = create_input(dialog.input, 'vcs-form-input');

		const form = document.createElement('form');
		form.id = 'vcs-input-form';
		form.appendChild(input);

		if (Array.isArray(dialog.parameters) && dialog.parameters.length >= 1) {
			append_parameters_to_dialog_form(form, dialog.parameters);
		}

		const button_callback = create_input_dialog_callback(callback, callback_options);
		const form_buttons = create_form_buttons(button_callback);
		form.appendChild(form_buttons);

		const body = create_modal_body(dialog.modal.description);
		body.appendChild(form);

		create_modal_dialog(dialog.modal.heading, body);
	};

	const create_input = function(options, id) {
		const input_container = document.createElement('div');
		input_container.className = 'form-group';

		// TODO?: support multiple inputs (WARNING: callback must be dynamic to check get inputs of all)

		const input = document.createElement('input');
		input.type = options.type;
		input.id = id;
		input.className = 'form-control';
		input.placeholder = options.placeholder;
		input.required = true;

		if (options.type === 'text') {
			input.pattern = options.pattern
		} else if (options.type === 'number') {
			input.min = options.min;
			input.max = options.max;
		}

		input.pattern = options.pattern;
		input.title = options.title;
		input.value = options.value;
		input.autocomplete = 'off';

		input_container.appendChild(input);

		return input_container;
	};

	const create_form_buttons = function(callback_success) {
		const button_container = document.createElement('div');
		button_container.className = 'form-group pull-right';

		const button_success = document.createElement('button');
		button_success.type = 'submit';
		button_success.className = 'btn btn-primary';
		button_success.onclick = callback_success;
		button_success.innerHTML = 'Submit';

		button_container.appendChild(button_success);

		return button_container;
	};

	const append_parameters_to_dialog_form = function(form, parameters) {
		const fieldset = document.createElement('fieldset');
		fieldset.className = 'form-group';
		fieldset.id = 'vcs-options';

		const legend = document.createElement('legend');
		legend.innerHTML = 'Options';
		fieldset.appendChild(legend);

		parameters.forEach((parameter) => {
			const container = document.createElement('div');
			container.className = 'form-check';

			const label = document.createElement('label');
			label.className = 'form-check-label';
			label.innerHTML = parameter.label;
			label.htmlFor = parameter.value;
			container.appendChild(label);

			const input_element = document.createElement('input');
			input_element.type = parameter.type;
			input_element.className = 'form-check-input';
			input_element.name = 'vcs-option-element';
			input_element.value = parameter.value;
			input_element.id = parameter.value;

			if (parameter.checked) {
				input_element.checked = true;
			}

			container.appendChild(input_element);
			fieldset.appendChild(container);
		});

		form.appendChild(fieldset);
	};

	const create_modal_body = function(description) {
		const body = document.createElement('div');
		const description_element = document.createElement('h4');
		description_element.innerHTML = description;
		body.appendChild(description_element);

		return body;
	};

	const create_input_dialog_callback = function(callback, callback_options) {
		return function dialog_callback(event) {
			event.preventDefault();
			const form = document.getElementById('vcs-input-form');

			if (!form.reportValidity()) {
				console.log('Form is invalid');
				return undefined;
			}

			const input = document.getElementById('vcs-form-input').value;
			// TODO: allow checkboxes -> handle when multiple options are selected
			let checked_parameter = document.querySelector('input[name=vcs-option-element]:checked');

			let dialog_parameters = {};
			if (checked_parameter) {
				const [parameter_type, parameter_name] = checked_parameter.value.split('.');
				dialog_parameters[parameter_type] = {};
				dialog_parameters[parameter_type][parameter_name]= true;
			}

			if (!callback_options || callback_options.parameters) {
				callback_options = {};
			}

			const options = $.extend(true, dialog_parameters, callback_options.parameters);
			callback(current_folder, input, options)
				.then((output) => {
				// TODO: handle output = errors

				})
				.catch((error) => {
					console.log(error);
				});

			// because of Event.preventDefault modal needs to be closed manually
			// TODO: find a way to do it without jQuery
			$('.modal').modal('hide');
		};
	};

	const create_modal_dialog = function(title, body, buttons) {
		base_dialog.modal({
			title,
			body,
			buttons,
			notebook:         Jupyter.notebook,
			keyboard_manager: Jupyter.keyboard_manager
		});
	};

	const create_error_output_dialog = function(dialog, error_output) {
		const body = create_modal_body(dialog.modal.description);

		if (error_output.log) {
			const log_panel = create_error_panel('danger', 'Log', error_output.log);
			body.appendChild(log_panel);
		}

		if (error_output.traceback) {
			const traceback_panel = create_error_panel('info', 'Traceback', error_output.traceback);
			body.appendChild(traceback_panel);
		}

		const button_callback = () => {
			console.log('reported');
		};

		create_modal_dialog(dialog.modal.heading, body, button_callback);
	};

	const create_error_panel = function(panel_type, heading, text) {
		const panel = document.createElement('div');
		panel.className = `panel panel-${panel_type}`;

		const panel_heading = document.createElement('div');
		panel_heading.className = 'panel-heading';
		panel_heading.innerHTML = heading;

		const panel_body = document.createElement('div');
		panel_body.className = 'panel-body';

		const output = document.createElement('pre');
		output.innerHTML = text;

		panel_body.appendChild(output);
		panel.appendChild(panel_heading);
		panel.appendChild(panel_body);

		return panel;
	};

	const create_info_dialog = function(heading, description) {
		const body = create_modal_body(description);

		const buttons = {
			Close: {
				class: 'btn-primary'
			}
		};

		create_modal_dialog(heading, body, buttons);
	};

	const share_changes_dialog = function(files) {
		// Files passed -> from tree view
		let parameters = null;
		if (!files) {
			parameters = [
				{
					type:    'radio',
					label:   'This notebook',
					value:   `add_parameters.notebook`,
					checked: true
				},
				{
					type:  'radio',
					label: 'All updated files',
					value: `add_parameters.updated`
				}
			];
		}

		if (files === 'all') {
			parameters = [
				{
					type:  'radio',
					label: 'All updated files',
					value: `add_parameters.updated`,
					checked: true
				}
			];
		}

		// TODO: show which files will be shared

		const dialog = {
			modal: {
				heading:     'Share changes',
				description: 'Please provide a commit message:'
			},
			input: {
				type:        'text',
				placeholder: 'Commit message',
				pattern:     '.{10,}',
				title:       'Enter at least 10 characters',
				value:       ''
			},
			parameters
		};
		const callback = vcs.share_changes;

		let callback_options = undefined;

		if (files !== 'all') {
			let callback_options = {
				parameters: {
					notebook:       Jupyter.notebook.notebook_path,
					add_parameters: {
						files
					}
				}
			}
		}

		create_input_dialog(dialog, callback, callback_options);
	};

	// TODO: parameters: also add all current files and commit?
	const initialize_repository_dialog = function() {
		const dialog = {
			modal: {
				heading:     'Initialize Repository',
				description: 'Please provide the URL of the remote repository:'
			},
			input: {
				type:        'text',
				placeholder: 'Remote repository',
				pattern:     '(?:git|ssh|https?|git@[-\w.]+):(\/\/)?(.*?)(\.git)(\/?|\#[-\d\w._]+?)$|^\/([A-Za-z\s]+\/?)+\/',
				title:       'Please enter a valid URL to remote repository',
				value:       ''
			}
		};
		const callback = vcs.initialize_repository;

		create_input_dialog(dialog, callback);
	};

	const clone_repository_dialog = function() {
		const dialog = {
			modal: {
				heading:     'Clone remote repository',
				description: 'Please provide the URL of the remote repository:'
			},
			input: {
				type:        'text',
				placeholder: 'Remote repository',
				pattern:     '(?:git|ssh|https?|git@[-\w.]+):(\/\/)?(.*?)(\.git)(\/?|\#[-\d\w._]+?)$|^\/([A-Za-z\s]+\/?)+\/',
				title:       'Please enter a valid URL to remote repository',
				value:       ''
			}
		};
		const callback = vcs.clone_repostiory;

		create_input_dialog(dialog, callback);
	};

	const work_on_task_dialog = function() {
		// Currently working on a task?
		if (vcs.work_on_task_state.task_name) {
			// Allow per share changes + work_on_task to share the changes
			vcs.work_on_task_finish();
		} else {
			const dialog = {
				modal: {
					heading:     'Work on Task',
					description: 'Please provide the goal you are working on'
				},
				input: {
					type:        'text',
					placeholder: 'Goal',
					pattern:     '.{10,}',
					title:       'Please enter at least 10 characters',
					value:       ''
				}
			};
			const callback = vcs.work_on_task;

			create_input_dialog(dialog, callback);
		}
	};

	const create_branch_dialog = function() {
		const dialog = {
			modal: {
				heading:     'Create new working directory',
				description: 'Please provide the name for the new working directory:'
			},
			input: {
				type:        'text',
				placeholder: 'Name of the working directory',
				// https://www.kernel.org/pub/software/scm/git/docs/git-check-ref-format.html, https://stackoverflow.com/questions/12093748/how-do-i-check-for-valid-git-branch-names/12093994#12093994
				//pattern:     '^(?!@$|build-|/|.*([/.].|//|@\{|\\))[^\\000-\\037\\177 ~^:?*[]+/[^\\000-\\037\\177 ~^:?*[]+(?<!.lock|[/.])$',
				pattern:     '.{5,}',
				//title:       'Please enter a valid branch name (try to avoid dots(.) and slashes(/))',
				title:       'Please enter at least 5 characters',
				value:       ''
			}
		};
		const callback = vcs.create_branch;

		create_input_dialog(dialog, callback);
	};

	const restore_file_version_dialog = async function(files) {
		const file = files[0];
		const file_version_messages = await vcs.get_file_version_messages(current_folder, file);

		if (file_version_messages === null) {
			const heading = 'Restore file version failed';
			const description = 'There is no older file version available';

			create_info_dialog(heading, description);
			return undefined;
		}

		let messages = ''

		file_version_messages.map((message, index) => {
			if (index >= 5) {
				return undefined;
			}

			messages += `${index + 1}: ${message} <br/>`;
		});

		const dialog = {
			modal: {
				heading:     'Restore file version',
				description: `Please provide which version you would like to restore. <br/> Most recent versions: <br/> ${messages}`
			},
			input: {
				type:        'number',
				placeholder: '(1 = previous state)',
				min:         1,
				max:         file_version_messages.length,
				title:       `Enter a number between 1 - ${file_version_messages.length}`,
				value:       ''
			}
		};
		const callback = vcs.restore_file_versions;
		const callback_parameters = {
			parameters: {
				files
			}
		};

		create_input_dialog(dialog, callback, callback_parameters);
	};


	// unused for now (does not support git revisions...)
	const run_nbdime_tool = function(tool, base, remote) {
		// No need for isgit and checkpoint-difftool
		const nbdime_tools = ['difftool', 'git-difftool', 'diff'];

		if (!nbdime_tools.includes(tool)) {
			console.log(`Unsupported nbdime tool: ${tool}`);
			return undefined;
		}

		const url = `${window.location.origin}/nbdime/${tool}?base=${base}&remote=${remote}`;
		window.open(url);
	};

	const compare_dialog = function() {
		const dialog = {
			modal: {
				heading:     'Compare to which worktree',
				description: 'Please provide the name for the worktree:'
			},
			input: {
				type:        'text',
				placeholder: 'Name of the worktree',
				pattern:     '.{1,}',
				title:       'Please enter a valid branch name (try to avoid dots(.) and slashes(/))',
				value:       ''
			}
		};
		const callback = vcs.compare;

		create_input_dialog(dialog, callback);
	};

	const merge_dialog = function() {
		const dialog = {
			modal: {
				heading:     'Merge with which worktree',
				description: 'Please provide the name for the worktree:'
			},
			input: {
				type:        'text',
				placeholder: 'Name of the worktree',
				pattern:     '.{1,}',
				title:       'Please enter a valid branch name (try to avoid dots(.) and slashes(/))',
				value:       ''
			}
		};

		const callback = vcs.merge;

		create_input_dialog(dialog, callback);
	};

	module.exports = {
		initialize,
		share_changes_dialog,
		initialize_repository_dialog,
		clone_repository_dialog,
		work_on_task_dialog,
		compare_dialog,
		merge_dialog,
		create_branch_dialog,
		create_error_output_dialog,
		restore_file_version_dialog,
		create_info_dialog
	};
});

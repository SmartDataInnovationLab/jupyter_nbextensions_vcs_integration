define((
	require,
	exports,
	module
) => {
	'use strict';

	const Jupyter    = require('base/js/namespace'),
	      sessions   = require('services/sessions/session'),
	      base_utils = require('base/js/utils'),
	      events     = require('base/js/events'),
	      logger     = require('./logger');

	const Executor = function(executor_options = {}, kernel_options = {}) {
		this.PROMISE_TIMEOUT = executor_options.timeout || 5000;
		this.session_starting = undefined;
		this.kernel_session = undefined;
		this.kernel = undefined;
		this.create_kernel_session(kernel_options);
		this.has_output_timeout = [];
	};

	Executor.prototype.create_kernel_session = function create_kernel_session(kernel_options) {
		if (this.session_starting) {
			logger.error('Session already starting');
			return;
		}

		this.session_starting = true;

		const dummy_events = {
			on:      () => {},
			trigger: () => {},
			off:     () => {}
		};

		const default_notebook = {
			// No events otherwise as it also emits kernel_ready, ...
			events: dummy_events
		};

		const options = {
			base_url:      kernel_options.base_url || base_utils.get_body_data("baseUrl"),
			ws_url:        kernel_options.ws_url || '',
			notebook_path: kernel_options.notebook_path || '/',
			notebook_name: kernel_options.notebook_name || 'vcs',

			// TODO: find default kernel name
			kernel_name: kernel_options.kernel_name || 'python3',
			notebook:    default_notebook
		};

		const on_success = () => {
			this._kernel_start_success();
		};
		const on_failure = () => {
			this._kernel_start_failed();
		};

		if (this.kernel_session && this.kernel_session.kernel) {
			this.session.restart(options, on_success, on_failure);
		} else {
			this.kernel_session = new sessions.Session(options);
			this.kernel_session.start(on_success, on_failure);
		}
	};

	Executor.prototype._kernel_start_success = function _kernel_start_success() {
		this.session_starting = false;
		this.kernel = this.kernel_session.kernel;

		// Kernel hard-binds events to base/js/events, even though we give sessions events
		this.kernel.events = {
			on:      () => {},
			trigger: (event, callback) => {
				// We don't want to pollute the log / ... -> use our own 'Event Namespace'
				events.trigger(event.replace('Kernel', 'VCS_Kernel'), callback);
			},
			off: (event) => {
				events.off(event);
			}
		};
	};

	Executor.prototype._kernel_start_failed = function _kernel_start_failed(jqxhr, status, error) {
		this.session_starting = false;
		base_utils.log_ajax_error(jqxhr, status, error);
	};

	Executor.prototype.get_kernel_status = function get_kernel_status() {
		return this.kernel !== undefined;
	};

	Executor.prototype.get_output_of_command = function get_output_of_command(command, timeout) {
		let promise_timeout = timeout || this.PROMISE_TIMEOUT;

		if (this.session_starting || !this.kernel) {
			logger.log('Session still starting');
			return;
		}

		return new Promise((resolve, reject) => {
			this.execution_duration_timeout = setTimeout(() => {
				reject(new Error(`Promise for ${command} timed out after ${promise_timeout} ms`));
			}, promise_timeout);


			const msg_id = this.kernel.execute(command, {
				iopub: {
					output: this._resolve_promise_with_output.bind(this, resolve)
				}
			});

			// Event gets fired after the output handler if there was output -> handle case if there is no output
			events.on('finished_iopub.VCS_Kernel', this._resolve_promise_no_output.bind(this, resolve, msg_id));
		});
	};


	Executor.prototype._resolve_promise_no_output = function _resolve_promise_no_output(resolve, msg_id, event, kernel_message) {
		if (kernel_message.msg_id === msg_id) {
			// Give output time to be processed, otherwise there was no output
			this.has_output_timeout[msg_id] = setTimeout(() => {
				resolve(null);
			}, 1000);
			events.off('finished_iopub.VCS_Kernel', this._resolve_promise_no_output);
		}
	};

	Executor.prototype._resolve_promise_with_output = function _resolve_promise_with_output(resolve, kernel_message) {
		// If there was output, clear the timer for 'no output'
		if (this.has_output_timeout[kernel_message.msg_id]) {
			clearTimeout(this.has_output_timeout[kernel_message.msg_id]);
		}
		events.off('finished_iopub.VCS_Kernel', this._resolve_promise_no_output);
		resolve(kernel_message.content.text);
	};

	module.exports = {
		Executor
	};
});

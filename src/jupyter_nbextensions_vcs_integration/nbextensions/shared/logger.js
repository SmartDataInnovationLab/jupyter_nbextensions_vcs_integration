define((
	require,
	exports,
	module
) => {
	'use strict';

	let log_prefix = '[VCS Integration]';
	let current_log_level = 'log';
	const LOG_LEVELS = [
		'log', 'info', 'warn', 'error'
	];

	const set_log_level = function(new_log_level) {
		if (LOG_LEVELS.includes(new_log_level)) {
			current_log_level = new_log_level;
		} else {
			error(`The new log level has to be one of these: ${LOG_LEVELS}`);
		}
	};

	const log = function(message) {
		print_to_console('log', message);
	};

	const info = function(message) {
		print_to_console('info', message);
	};

	const warning = function(message) {
		print_to_console('warn', message);
	};

	const error = function(message) {
		print_to_console('error', message);
	};

	const print_to_console = function(log_level, message) {
		const origin = get_origin_of_log();

		if (LOG_LEVELS.indexOf(current_log_level) <= LOG_LEVELS.indexOf(log_level)) {
			console[log_level](`${log_prefix}(${origin.file}:${origin.method}) ${message}`);
		}
	};

	const get_origin_of_log = function() {
		let stack = (new Error()).stack
			                     .split('\n')
			                     .splice(3);

		// https://github.com/v8/v8/wiki/Stack%20Trace%20API#appendix-stack-trace-format
		const stack_regex_chrome = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/i;

		// Example: load_extension@http://localhost:8888/static/notebook/js/main.min.js?v=6a166b31c5a20f809e44ec2d50e40412:12408:41
		// For each 'layer' a </ gets added before the @ but we need the first one in this case
		const stack_regex_firefox = /(.*?)@(.*):(\d*):(\d*)/i;
		let file   = '?';
		let method = '?';

		let parsed_stack = stack_regex_chrome.exec(stack[1]);
		if (!parsed_stack) {
			parsed_stack = stack_regex_firefox.exec(stack[0]);
		}

		if (parsed_stack && parsed_stack.length === 5) {
			method = parsed_stack[1].split('.')[1];
			file = parsed_stack[2].split(/[\\/]/)
				                  .pop()
				                  .split('.')[0];
		}

		return {
			method,
			// Path:   parsed_stack[2],
			file
			// Line:   parsed_stack[3],
			// Pos:    parsed_stack[4]
		};
	};

	module.exports = {
		set_log_level,
		log,
		info,
		warning,
		error
	};
});

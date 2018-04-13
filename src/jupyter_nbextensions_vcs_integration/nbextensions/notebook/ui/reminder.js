define((
	require,
	exports,
	module
) => {
	'use strict';

	const initialize = function() {
		register_unload_handler();
	};

	const register_unload_handler = function() {
		const notebook_onbeforeunload = window.onbeforeunload;

		/* Window.onunload = function(event) {
				event.returnValue = 'hi';
				return 'hi';
			}*/
	};

	module.exports = {
		initialize
	};
});

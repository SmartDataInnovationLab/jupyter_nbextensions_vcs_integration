define((
	require,
	exports,
	module
) => {
	'use strict';

	const Jupyter  = require('base/js/namespace'),
		  executor = require('../shared/executor'),
		  events   = require('base/js/events');

	const initialize = function() {
		bind_events();
	};

	const bind_events = function() {
		// events.on('pull.VCS', patch);

		// events.on('notebook_saved.Notebook', patch);
	};

	const patch = async function() {
		// Nbdiff file output in json just works files and not git refs?!
		// Const diff = await executor.get_output_of_command('!nbdiff -s HEAD HEAD^');
	};

	/* Operations (see nbdime/diff_format line 44-49)
	 * ADD = "add"
     * REMOVE = "remove"
     * REPLACE = "replace"
     * ADDRANGE = "addrange"
     * REMOVERANGE = "removerange"
     * PATCH = "patch"
	 */

	module.exports = {
		initialize
	};
});

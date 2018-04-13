define((
	require,
	exports,
	module
) => {
	'use strict';

	const Jupyter = require('base/js/namespace'),
	      events  = require('base/js/events'),
	      ui      = require('./ui'),
	      vcs     = require('../shared/git'),
	      Logger  = require('../shared/logger');

	const load_extension = function() {
		Logger.log('Init');

		if (!Jupyter.notebook_list) {
			return;
		}

		vcs.initialize();
		events.on('kernel_ready.VCS_Kernel', initialize);
	};

	const initialize = async function() {
		ui.initialize(vcs);
	};

	module.exports = {
		load_ipython_extension: load_extension,
		load_jupyter_extension: load_extension
	};
});

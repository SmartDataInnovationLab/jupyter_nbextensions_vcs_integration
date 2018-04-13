define((
	require,
	exports,
	module
) => {
	'use strict';

	const Utils         = require('../shared/utils'),
	      Cell_Marker   = require('./ui/cell_marker'),
	      Line_Marker   = require('./ui/line_marker'),
	      CellRestorer  = require('./ui/cell_restorer'),
	      Reminder      = require('./ui/reminder'),
	      Actions       = require('./ui/actions'),
	      Dialogs       = require('../shared/ui/dialog'),
	      Notifications = require('./ui/notifications'),
	      Tour          = require('../shared/ui/tour'),
	      Menu          = require('./ui/menu');

	// TODO: have to require all possible vcs beforehand... for now it is just git anyway
	let vcs = undefined;

	const initialize = function(options, passed_vcs) {
		vcs = passed_vcs;
		initialize_ui_parts(options);
	};

	const initialize_ui_parts = function(options) {
		if (options.visualize_cell_changes) {
			Cell_Marker.initialize();
		}

		if (options.visualize_cell_content_changes) {
			Line_Marker.initialize();
		}

		if (options.reminder_commit) {
			Reminder.initialize();
		}
		const current_folder = Utils.get_current_folder();
		CellRestorer.initialize();
		Menu.initialize(vcs, current_folder);
		Actions.initialize(options);
		Dialogs.initialize(vcs, current_folder);
		Tour.initialize();
		Notifications.initialize();
	};

	module.exports = {
		initialize
	};
});

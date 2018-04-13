define((
	require,
	exports,
	module
) => {
	'use strict';

	const Jupyter       = require('base/js/namespace'),
		    CellRestorer  = require('./cell_restorer');

	const initialize = function(options) {
		register_actions(options);
	};

	const register_actions = function(options) {
		const toggle_deleted_cells_action = Jupyter.keyboard_manager.actions.register(toggle_deleted_cells, 'toggle showing deleted cells');
		Jupyter.keyboard_manager.command_shortcuts.add_shortcut(options.toggle_deleted_cells_shortcut, toggle_deleted_cells_action);

		const restore_deleted_cell_action = Jupyter.keyboard_manager.actions.register(restore_deleted_cell, 'restore deleted cell');
		Jupyter.keyboard_manager.command_shortcuts.add_shortcut(options.restore_deleted_cell_shortcut, restore_deleted_cell_action);
	};

	const toggle_deleted_cells =  {
		help:       'toggle deleted cells since last commit',
		icon:       'align_left',
		help_index: '',
		handler(env) {
			CellRestorer.toggle_deleted_cells();
		}
	};

	const restore_deleted_cell = {
		help:       'restore deleted cell',
		icon:       'align_left',
		help_index: '',
		handler(env) {
			const selected_cell = env.notebook.get_selected_cell();
			const selected_cell_index = env.notebook.get_selected_cells_indices()[0];
			CellRestorer.restore_deleted_cell(selected_cell, selected_cell_index);
		}
	};

	module.exports = {
		initialize
	};
});

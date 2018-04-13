define((
	require,
	exports,
	module
) => {
	'use strict';

	const Jupyter     = require('base/js/namespace'),
	      events      = require('base/js/events'),
		    Cell_Marker = require('./cell_marker');

	const STATE = {
		showing_deleted_cells: false,
		hiding_deleted_cells:  false,
		deleted_cells_visible: false,
	};

	const initialize = function() {
		bind_events();
	};

	const bind_events = function() {
		events.on('delete.Cell', add_deleted_cell);
	};

	const add_deleted_cell = function(event, cell_object) {
		if (STATE.showing_deleted_cells) {
			return undefined;
		}

		const serialized_cell = cell_object.cell.toJSON();
		Jupyter.notebook.metadata.changes.deleted_cells.push({
			id:    cell_object.cell._metadata.uuid,
			index: cell_object.index,
			cell:  serialized_cell
		});
	};

	const toggle_deleted_cells = function(cell, index) {
		STATE.deleted_cells_visible = !STATE.deleted_cells_visible;

		if (STATE.deleted_cells_visible) {
			show_deleted_cells();
		} else {
			hide_deleted_cells();
		}
	};

	const hide_deleted_cells = function() {
		if (!Jupyter.notebook.metadata.changes
								|| !Jupyter.notebook.metadata.changes.deleted_cells
									|| Jupyter.notebook.metadata.changes.deleted_cells.length === 0) {
			return undefined;
		}

		STATE.hiding_deleted_cells = true;
		const cells = Jupyter.notebook.get_cells();
		const deleted_cells_indices = [];
		cells.forEach((cell, cell_index) => {
			if (cell._metadata.deleted) {
				deleted_cells_indices.push(cell_index);
			}
		});
		STATE.hiding_deleted_cells = false;

		Jupyter.notebook.delete_cells(deleted_cells_indices);
	};

	const show_deleted_cells = function() {
		if (!Jupyter.notebook.metadata.changes
								|| !Jupyter.notebook.metadata.changes.deleted_cells
									|| Jupyter.notebook.metadata.changes.deleted_cells.length === 0) {
			return undefined;
		}
		const deleted_cells = Jupyter.notebook.metadata.changes.deleted_cells;
		STATE.showing_deleted_cells = true;
		deleted_cells.forEach((cell_object) => {
			const reconstructed_cell = Jupyter.notebook.insert_cell_at_index(cell_object.cell.cell_type, cell_object.index);

			/* If (cell.metadata.changes && cell.metadata.changes.cell_mark) {
        delete cell.metadata.changes.cell_mark;
      }*/
			cell_object.cell.metadata.deleted = true;
			cell_object.cell.metadata.editable = false;
			reconstructed_cell.fromJSON(cell_object.cell);

			Cell_Marker.mark_cell(cell_object.index, 'vcs-deleted-cell');
		});
		STATE.showing_deleted_cells = false;
	};

	const restore_deleted_cell = function(cell, index) {
		if (!cell._metadata.deleted) {
			return undefined;
		}
		delete cell._metadata.deleted;
		delete cell._metadata.editable;

		Jupyter.notebook.metadata.changes.deleted_cells.forEach((cell_object) => {
			if (cell_object.index === index) {
				Jupyter.notebook.metadata.changes.deleted_cells.splice(index, 1);
			}
		});
	};

	module.exports = {
		initialize,
		toggle_deleted_cells,
		restore_deleted_cell,
		STATE
	};
});

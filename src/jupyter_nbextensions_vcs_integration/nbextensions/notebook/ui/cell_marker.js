define((
	require,
	exports,
	module
) => {
	'use strict';

	const Jupyter      = require('base/js/namespace'),
	      events       = require('base/js/events'),
	      CellRestorer = require('./cell_restorer');

	const initialize = function() {
		load_css();
		bind_events();
		restore_marks();
	};

	const load_css = function() {
		const link = document.createElement('link');
		link.type = 'text/css';
		link.rel = 'stylesheet';
		link.href = require.toUrl('./vcs_integration.css');
		document.getElementsByTagName('head')[0].appendChild(link);
	};

	const bind_events = function() {
		events.on('create.Cell', mark_new_cell);

		// TODO: find another event, as it fires every keypress (maybe command_mode.Notebook but then need to save state on edit_mode.Notebook)
		events.on('change.Cell', mark_modified_cell);
		events.on('delete.Cell', mark_deleted_cell);
		events.on('commit.VCS', unmark_cells);
	};

	const restore_marks = function() {
		const cells = Jupyter.notebook.get_cells();

		cells.forEach((cell, cell_index) => {
			if (cell._metadata.changes && cell._metadata.changes.cell_mark) {
				mark_cell(cell_index, cell._metadata.changes.cell_mark);
			}
		});
	};

	const mark_cell = function(cell_index, css_class) {
		const selector = `#notebook-container > div:nth-child(${cell_index + 1}) > div.input`;

		if (document.querySelector(`${selector} > div.vcs-marker`)) {
			return undefined;
		}

		const cell_input_div = document.querySelector(selector);
		const cell_marker = document.createElement('div');
		cell_marker.className = `vcs-marker ${css_class}`;
		cell_input_div.appendChild(cell_marker);

		// TODO: use before_save.Notebook to backup all at once?
		backup_cell_mark(cell_index, css_class);
		return undefined;
	};

	const mark_new_cell = function(event, cell_object) {
		// Also gets called when recreating a deleted cell
		if (CellRestorer.STATE.howing_deleted_cells) {
			return undefined;
		}
		mark_cell(cell_object.index, 'vcs-new-cell');
	};

	const mark_modified_cell = function(event, cell_change) {
		// Also gets fired when deleting cells with origin setValue
		if (cell_change.change.origin === '+input' || cell_change.change.origin === '+delete') {
			const cell_index = Jupyter.notebook.find_cell_index(cell_change.cell);
			mark_cell(cell_index, 'vcs-modified-cell');
		}
	};

	const mark_deleted_cell = function(event, cell_object) {
		// TODO: Catch STATE from deleted_cells
		if (!Jupyter.notebook.metadata.changes) {
			Jupyter.notebook.metadata.changes = {};
			Jupyter.notebook.metadata.changes.deleted_cells = [];
		}

		// Check if divider exists
		// If yes, update counter
		// Create divider under index
	};

	const backup_cell_mark = function(cell_index, css_class) {
		const cell = Jupyter.notebook.get_cell(cell_index);

		if (!cell._metadata.changes) {
			cell._metadata.changes = {};
		}

		cell._metadata.changes.cell_mark = css_class;
	};

	const unmark_cells = function(event) {
		const selector = `#notebook-container > div.cell > div.input > div.vcs-marker`;
		const marked_cells = document.querySelectorAll(selector);

		marked_cells.forEach((cell) => {
			cell.parentNode.removeChild(cell);
		});

		const cells = Jupyter.notebook.get_cells();

		cells.forEach((cell) => {
			if (cell._metadata.changes.cell_mark) {
				delete cell._metadata.changes.cell_mark;
			}
		});

		Jupyter.notebook.save_notebook(false);
	};


	module.exports = {
		initialize,
		mark_cell
	};
});

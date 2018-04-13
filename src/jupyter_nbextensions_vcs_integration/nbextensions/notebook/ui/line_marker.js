define((
	require,
	exports,
	module
) => {
	'use strict';

	const Jupyter = require('base/js/namespace'),
		    events  = require('base/js/events');


	const initialize = function() {
		require('codemirror/lib/codemirror');
		load_code_mirror_option();
		load_css();
		bind_events();
	};

	const load_code_mirror_option = function() {
		require('./lib/changes_gutter');

		const cells = Jupyter.notebook.get_cells();
		cells.forEach((cell) => {
			activate_line_marker(cell);
		});
	};

	const activate_line_marker = function(cell) {
		const cm = cell.code_mirror;
		let gutters = cm.getOption('gutters')
		                .slice();

		if (!gutters.includes('CodeMirror-changes-gutter')) {
			gutters.push('CodeMirror-changes-gutter');
			cm.setOption('gutters', gutters);
		}

		if (cell._metadata.changes && cell._metadata.changes.marked_lines) {
			const marked_lines = JSON.parse(cell._metadata.changes.marked_lines);
			cell.code_mirror.setOption('changes', marked_lines);
		} else {
			cell.code_mirror.setOption('changes', 'init');
		}

		// need to update (so text behind gutter is visible)
		// problem: isn't handled by Jupyter and .refresh() doesn't work
		// handled by codemirror: updateLineGutter (which is not accessible)
		// from CodeMirror::updateGutterSpace (cannot be directly called), fixes that letters are behind the gutter
		// setTimeout(() => {cm.display.sizer.marginLeft = cm.display.gutters.offsetWidth + 'px'; console.log(cm.display.gutters.offsetWidth)}, 3000);
	};

	const load_css = function() {
		const link = document.createElement('link');
		link.type = 'text/css';
		link.rel = 'stylesheet';
		link.id = 'changes-gutter';
		link.href = require.toUrl('./lib/changes_gutter.css');
		document.getElementsByTagName('head')[0].appendChild(link);
	};

	const bind_events = function() {
		events.on('create.Cell', activate_line_marker_new_cell);
		events.on('commit.VCS', unmark_cells);
		events.on('before_save.Notebook', backup_line_marker);
	};

	const activate_line_marker_new_cell = function(event, cell_object) {
		const cell = cell_object.cell;
		activate_line_marker(cell);
	};

	const unmark_cells = function() {
		const cells = Jupyter.notebook.get_cells();

		cells.forEach((cell) => {
			cell.code_mirror.deleteChangeMarker();

			if (cell._metadata.changes.marked_lines) {
				delete cell._metadata.changes.marked_lines;
			}
		});

		Jupyter.notebook.save_notebook(false);
	};

	const backup_line_marker = function() {
	   const cells = Jupyter.notebook.get_cells();

		cells.forEach((cell) => {
			const marked_lines = cell.code_mirror.getMarkedLines();

			if (!cell._metadata.changes) {
				cell._metadata.changes = {
				};
			}

			cell._metadata.changes.marked_lines = JSON.stringify(marked_lines);
		});
	};

	module.exports = {
		initialize
	};
});

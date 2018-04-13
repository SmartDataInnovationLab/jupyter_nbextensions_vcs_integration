(function(mod) {
	if (typeof exports == "object" && typeof module == "object") { // CommonJS
		mod(require("codemirror/lib/codemirror"));
	} else if (typeof define == "function" && define.amd) { // AMD
		define(["codemirror/lib/codemirror"], mod);
  	} else { // Plain browser env
    mod(CodeMirror);
    }
})(function(CodeMirror) {
	"use strict";
	
	const GUTTER_ID = "CodeMirror-changes-gutter";
	const MARKER_PREFIX = 'CodeMirror-changes-marker';
	
	const updateChangeMarker = function(cm, changes) {		
		let marker_type = undefined;
		let line = changes.from.line;
		if (changes.removed.length === 2 && changes.removed[0] === '' && changes.removed[1] === '') {
			marker_type = 'deleted';
		} else if (changes.text.length === 2 && changes.text[0] === '' && changes.text[1] === '') {
			marker_type = 'new';

			// left a line blank
			if (!cm.lineInfo(changes.from.line).text === '') {
				line++;
			}
		} else if (changes.from.line === changes.to.line) {
			// started editing a new line
			if (cm.lineInfo(changes.from.line).text === changes.text[0]) {
				marker_type = 'new';
			} else {
				marker_type = 'modified';
			}
		} else {
			console.log('[Change_Gutter] Not catched change event');
			console.log(changes);
		}

		if (marker_type && !lineHasMarker(cm, line)) {
			addChangeMarker(cm, line, marker_type);
		}

		// TODO?
		/*if (marker_type === 'deleted' && lineHasDeletedMarker) {
			increaseDeletedCounter(cm, line);
		}*/
	}

	const addChangeMarker = function(cm, line, type) {
		const marker = createMarker(type);
		const state = cm.state.changes;
		state.marked_lines.push({
			line,
			type
		});

		cm.setGutterMarker(line, GUTTER_ID, marker);
	}
	
	const lineHasMarker = function(cm, line) {
		const gutterMarkers = cm.lineInfo(line).gutterMarkers;
		
		return gutterMarkers !== undefined && gutterMarkers[GUTTER_ID] !== undefined
	};

	/*
	const lineHasDeletedMarker = function(cm, line) {
		if (lineHasMarker) {
			console.log(cm.lineInfo(line));
			return cm.lineInfo(line).gutterMarkers[GUTTER_ID] = 'deleted';
		}

		return false;
	};*/
	
	const ChangesState = function(cm, options, hasGutter) {
		this.marked_lines = [];
		this.options = options;
		this.hasGutter = hasGutter;
	}
	
	const deleteChangeMarker = function(cm) {
		const state = cm.state.changes;
    	
    	if (state.hasGutter) {
    		cm.clearGutter(GUTTER_ID);
    	}
    	
    	state.marked_lines = [];
	}
	
	const createMarker = function(type) {
		const marker = document.createElement('i');
		let icon;
		if (type === 'new') {
			icon = 'fa-plus';
		} else if (type === 'modified') {
			icon = 'fa-pencil';
		} else if (type === 'deleted') {
			icon = 'fa-minus';
		}
		
		marker.className = `fa ${icon}`;
		
		return marker;
	};
	
	// TODO: maybe add more from the state, currently just the marked lines
	const restoreState = function(cm, marked_lines) {
		marked_lines.forEach((marked_line) => {
			addChangeMarker(cm, marked_line.line, marked_line.type);
		});
	}

	CodeMirror.defineOption("changes", false, function(cm, value, old) {
		const gutters = cm.getOption('gutters');
			
		let hasGutter = false;
		gutters.forEach((gutter) => {
			if (gutter === GUTTER_ID) {
				hasGutter = true;
			}
		});
		
		cm.state.changes = new ChangesState(cm, {}, hasGutter);		

		if (Array.isArray(value) && value.length >= 1) {
			restoreState(cm, value);
		}
				
		cm.on('change', updateChangeMarker);
		
		if (old && old != CodeMirror.Init) {
			clearMarks(cm);
		}  
	});

	CodeMirror.defineExtension('deleteChangeMarker', function() {
		deleteChangeMarker(this);
	});
	
	CodeMirror.defineExtension('getMarkedLines', function() {
		const state = this.state.changes;
		
		return state.marked_lines;
	});
});

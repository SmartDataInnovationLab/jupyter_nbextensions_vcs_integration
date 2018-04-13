define((
	require,
	exports,
	module
) => {
	'use strict';

	const load_css = function(css_file) {
	
	};

	const get_current_folder = function() {
		const path_name = window.location.pathname;
		
		if (path_name.startsWith('/tree')) {
			return get_current_folder_tree_view(path_name);
		} else if (path_name.startsWith('/notebooks')) {
			return get_current_folder_notebook_view(path_name);
		} else if (path_name.startsWith('/user')) {
			const path = `/${path_name.split('/').slice(3).join('/')}`
			return get_current_folder_tree_view(path);
		} else {
			console.error('Unknown path name');
		}
		
	};
	
	const get_current_folder_tree_view = function(path_name) {
		if (path_name === '/tree' || (path_name === '/tree/')) {
			return '.';
		}
		return path_name.substring('/tree/'.length).replace("%20", " ");
	};
	
	const get_current_folder_notebook_view = function(path_name) {
		const path_with_file = path_name.substring('/notebooks/'.length);

		if (!path_with_file.includes('/')) {
			return '.';
		} else {
			return path_with_file.substring(0, path_with_file.lastIndexOf('/')).replace("%20", " ");
		}
	};

	module.exports = {
		load_css,
		get_current_folder
	};
});

define((
	require,
	exports,
	module
) => {
	'use strict';

	const initialize = function(is_repo_initialized) {
		if (is_repo_initialized) {
			add_tab();
			add_tab_content();
		}
	};

	const add_tab = function() {
		if (document.getElementById('vcs-tab')) {
			return undefined;
		}

		const vcs_tab = create_tab();

		const tabs = document.getElementById('tabs');
		tabs.appendChild(vcs_tab);

		return undefined;
	};

	const create_tab = function() {
		const vcs_tab_list_element = document.createElement('li');
		const vcs_tab_link = document.createElement('a');
		vcs_tab_link.id = 'vcs-tab';
		vcs_tab_link.setAttribute('data-toggle', 'tab');
		vcs_tab_link.href = '#vcs';
		vcs_tab_link.innerHTML = 'Version Control';

		vcs_tab_list_element.appendChild(vcs_tab_link);

		return vcs_tab_list_element;
	};

	const add_tab_content = function() {
		const tab_content = document.getElementsByClassName('tab-content')[0];
		const cvs_tab_content = document.createElement('div');
		cvs_tab_content.className = 'tab-pane';
		cvs_tab_content.id = 'vcs';

		tab_content.appendChild(cvs_tab_content);
	};

	const build_page = function() {
	};

	module.exports = {
		initialize,
		build_page
	};
});

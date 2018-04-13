define((
	require,
	exports,
	module
) => {
	'use strict';

	const Jupyter = require('base/js/namespace'),
	      Tour    = require('bootstraptour');

	const tour_shared = {
		step_duration: 0,
		template:      '<div class="popover tour">\n'
		+ '<div class="arrow"></div>\n'
		+ '<div style="position:absolute; top:10px; right: 10px">\n'
		+	'<button class="btn btn-default btn-sm fa fa-times" data-role="end"></button>\n'
		+ '</div><h3 class="popover-title"></h3>\n'
		+ '<div class="popover-content"></div>\n'
		+ '<div class="popover-navigation">\n'
		+	'<button class="btn btn-default fa fa-step-backward" data-role="prev"></button>\n'
		+	'<button class="btn btn-default fa fa-step-forward pull-right" data-role="next"></button>\n'
		+	'<button id="tour-pause" class="btn btn-sm btn-default fa fa-pause" data-resume-text="" data-pause-text="" data-role="pause-resume"></button>\n'
		+ '</div>\n'
		+ '</div>',
		apply_function_to_elements(selector, func) {
			const elements = document.querySelectorAll(selector);

			elements.forEach((element) => {
				func(element);
			});
		},
		open_dropdown_menu(selector) {
			tour_shared.apply_function_to_elements(selector, (element) => element.classList.add('open'));
		},
		close_dropdown_menu(selector) {
			tour_shared.apply_function_to_elements(selector, (element) => element.classList.remove('open'));
		},
		highlight(selector) {
			tour_shared.apply_function_to_elements(selector, (element) => element.classList.add('pulse'));
		},
		unhighlight(selector) {
			tour_shared.apply_function_to_elements(selector, (element) => element.classList.remove('pulse'));
		},
		switch_tab(tab_target) {
			const new_tab             = document.querySelector(`#tabs a[href='#${tab_target}']`).parentNode;
			const new_tab_content     = document.querySelector(`#tab_content > div.tab-content > #${tab_target}`);
			const current_tab         = document.querySelector('#tabs li.active');
			const current_tab_content = document.querySelector('#tab_content > div.tab-content > div.active');

			current_tab.classList.remove('active');
			current_tab_content.classList.remove('active');
			new_tab_content.classList.add('active');
			new_tab.classList.add('active');
		}
	};


	// ATTENTION: cannot create two 'orphans' in a row
	const notebook_tour = {
		steps: [
			{
				title:     'Welcome to the VCS Notebook Extension Tour',
				placement: 'bottom',
				orphan:    true,
				content:   'You can use the left and right arrow keys to go backwards and forwards.'
			},
			{
				title:     'General',
				placement: 'bottom',
				element:   '#version-control-menu ~ #working-tree-menu',
				content:   'The extension provides these two menus, which are only shown when the VCS is initialized',
				onShow:    () => {
					tour_shared.highlight('#version-control-menu');
					tour_shared.highlight('#working-tree-menu');
				},
				onHide: () => {
					tour_shared.unhighlight('#version-control-menu');
					tour_shared.unhighlight('#working-tree-menu');
				}
			},
			{
				title:     'Version Control Menu',
				placement: 'left',
				element:   '#version-control-menu',
				content:   'This menu allows you the interact with the VCS',
				onShow:    () => {
					tour_shared.highlight('#version-control-menu');
					tour_shared.open_dropdown_menu('#version-control-menu');
				},
				onHide: () => {
					tour_shared.unhighlight('#version-control-menu');
				}
			},
			{
				title:     'Share Changes',
				placement: 'left',
				element:   '#version-control-menu-share-changes',
				content:   'This allows you to share your changes with others',
				onShow:    () => {
					tour_shared.highlight('#version-control-menu-share-changes');
				},
				onHide: () => {
					tour_shared.unhighlight('#version-control-menu-share-changes');
				}
			},
			{
				title:     'Get Changes',
				placement: 'left',
				element:   '#version-control-menu-get-changes',
				content:   'This allows you to get the changes from others',
				onShow:    () => {
					tour_shared.highlight('#version-control-menu-get-changes');
				},
				onHide: () => {
					tour_shared.unhighlight('#version-control-menu-get-changes');
				}
			},
			{
				title:     'Work on Task',
				placement: 'left',
				element:   '#version-control-menu-work-on-task',
				content:   'This allows you to work on task while continuously sharing your changes',
				onShow:    () => {
					tour_shared.highlight('#version-control-menu-work-on-task');
				},
				onHide: () => {
					tour_shared.unhighlight('#version-control-menu-work-on-task');
					tour_shared.close_dropdown_menu('#version-control-menu');
				}
			},
			{
				title:     'Working Tree Menu',
				placement: 'left',
				element:   '#working-tree-menu',
				content:   'This menu allows you to change and add working trees',
				onShow:    () => {
					tour_shared.highlight('#working-tree-menu');
					tour_shared.open_dropdown_menu('#working-tree-menu');
				},
				onHide: () => {
					tour_shared.unhighlight('#working-tree-menu');
				}
			},
			{
				title:     'Working Trees',
				placement: 'left',
				element:   '#working-tree-menu li:not(:last-child)',
				content:   'These represent the available working trees. Click on them to change into them. Long click to modify (remove, rename) them.',
				onShow:    () => {
					tour_shared.highlight('#working-tree-menu li:not(:last-child)');
				},
				onHide: () => {
					tour_shared.unhighlight('#working-tree-menu li:not(:last-child)');
				}
			},
			{
				title:     'Add Working Tree',
				placement: 'left',
				element:   '#working-tree-menu-add-working-tree',
				content:   'This allows you to add a working tree and change into it',
				onShow:    () => {
					tour_shared.highlight('#working-tree-menu-add-working-tree');
				},
				onHide: () => {
					tour_shared.unhighlight('#vworking-tree-menu-add-working-tree');
					tour_shared.close_dropdown_menu('#working-tree-menu');
				}
			},
			{
				title:     'Tour finished',
				placement: 'bottom',
				orphan:    true,
				content:   'This concludes this tour.'
			}
		]
	};


	// TODO: need to fake some stuff (e.g. vcs is not initialized, ...) for it to work
	const tree_tour = {
		steps: [
			{
				title:     'Welcome to the VCS Tree Extension Tour',
				placement: 'bottom',
				orphan:    true,
				content:   'You can use the left and right arrow keys to go backwards and forwards.'
			},
			{
				title:     'Version Control Tab',
				placement: 'bottom',
				element:   '#vcs',
				content:   'You currently see the version control tab which shows you different types of information'
			},
			{
				title:     'History',
				placement: 'bottom',
				orphan:    true,
				content:   'TODO when there is actual content'
			},
			{

				title:     'File Tree View',
				placement: 'left',
				element:   '#tabs > li:nth-child(1) > a',
				content:   'Besides the Version Control tab, it also adds functionality to the file tree view',
				onShow:    () => {
					tour_shared.switch_tab('notebooks');
				}
			},
			{
				title:     'Notebook List',
				placement: 'left',
				element:   '#notebook_list',
				content:   'The files are now color coded: \n green: new \n yellow: modified \n purple: unknown to VCS \n grey: ignored'
			},
			{
				title:     'File Buttons',
				placement: 'bottom',
				element:   'div.dynamic-buttons',
				content:   'Based on your selection various functions operating on the selected files are shown (e.g. share)'
			},
			{
				title:     'Folder Buttons',
				placement: 'bottom',
				element:   'span.btn-upload',
				content:   'Based on the VCS status different buttons are shown here'
			},
			{
				title:     'Tour finished',
				placement: 'bottom',
				orphan:    true,
				content:   'This concludes this tour.'
			}
		]
	};

	const initialize = function(is_repo_initialized) {
		if (Jupyter.notebook_list) {
			if (is_repo_initialized) {
				inject_link_in_tab();
			}
		} else {
			inject_help_menu_entry();
		}
	};

	// TODO: needs to be updated as soon as there is real content in the tab
	const inject_link_in_tab = function() {
		if (document.getElementById('vcs-tour-button')) {
			return undefined;
		}

		const vcs_tab_content = document.querySelector('.tab-content > #vcs');

		const tour_button = document.createElement('button');
		tour_button.innerHTML = 'Start Tour';
		tour_button.className = 'btn btn-default';
		tour_button.id = 'vcs-tour-button';
		tour_button.onclick = start_tree_tour;

		vcs_tab_content.appendChild(tour_button);
	};

	const inject_help_menu_entry = function() {
		const notebook_tour_element = document.getElementById('notebook_tour');
		const help_menu = notebook_tour_element.parentNode;
		const vcs_tour = create_menu_entry('VCS Extension Notebook Tour', start_notebook_tour);
		help_menu.insertBefore(vcs_tour, notebook_tour_element.nextSibling);
	};

	const create_menu_entry = function(label, callback) {
		const menu_entry = document.createElement('li');
		menu_entry.onclick = callback;

		const menu_entry_link = document.createElement('a');
		menu_entry_link.href = '#';
		menu_entry_link.innerHTML = label;

		menu_entry.appendChild(menu_entry_link);

		return menu_entry;
	};


	const start_notebook_tour = function() {
		const tour = new Tour({
			storage:   false,
			debug:     true,
			reflex:    false,
			animation: false,
			duration:  tour_shared.duration,
			steps:     notebook_tour.steps,
			template:  tour_shared.template,
			orphan:    true
		});


		start_tour(tour);
	};

	const start_tree_tour = function() {
		const tour = new Tour({
			storage:   false,
			debug:     true,
			reflex:    true,
			animation: false,
			duration:  0,
			steps:     tree_tour.steps,
			template:  tour_shared.template,
			orphan:    true
		});

		start_tour(tour);
	};

	const start_tour = function(tour) {
		tour.init();
		tour.start();
		if (tour.ended()) {
			tour.restart();
		}
	};


	module.exports = {
		initialize
	};
});

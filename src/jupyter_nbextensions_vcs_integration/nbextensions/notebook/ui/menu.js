define((
	require,
	exports,
	module
) => {
	'use strict';

	const events  = require('base/js/events'),
	      Dialog  = require('../../shared/ui/dialog'),
	      Logger  = require('../../shared/logger');

	let vcs = undefined,
	    current_folder = undefined,
	    using_work_trees = undefined;

	const initialize = async function(passed_vcs, folder) {
		vcs = passed_vcs;
		current_folder = folder;
		using_work_trees = await vcs.using_work_trees(current_folder);
		add_menu();
		bind_events();
	};

	const create_menu = function(name, list) {
		const normalized_menu_name = `${name.toLowerCase()
			.replace(' ', '-')}-menu`;
		const existing_menus = document.querySelector('#menus > div > div > ul');
		const menu = document.createElement('li');
		menu.id = normalized_menu_name;
		menu.className = 'dropdown';

		const menu_link = document.createElement('a');
		menu_link.href = '#';
		menu_link.className = 'dropdown-toggle';
		menu_link.dataset.toggle = 'dropdown';
		menu_link.innerHTML = name;
		menu.appendChild(menu_link);
		existing_menus.appendChild(menu);

		const menu_list = document.createElement('ul');
		menu_list.id = `${normalized_menu_name}-menu-list`;
		menu_list.className = 'dropdown-menu';

		list.forEach((entry) => {
			const menu_entry = create_menu_entry(normalized_menu_name, entry);
			menu_list.appendChild(menu_entry);
		});
		menu.appendChild(menu_list);
	};

	const create_menu_entry = function(menu_name, entry) {
		const normalized_label = entry.label.toLowerCase()
		                                    .split(' ')
			.join('-');
		const id = `${menu_name}-${normalized_label}`;

		const menu_entry = document.createElement('li');
		menu_entry.id = id;
		menu_entry.onclick = entry.callback;

		const menu_entry_link = document.createElement('a');
		menu_entry_link.href = '#';
		menu_entry_link.innerHTML = `&nbsp; ${entry.label}`;

		const menu_entry_icon = document.createElement('i');
		menu_entry_icon.className = `fa ${entry.icon}`;

		menu_entry_link.insertBefore(menu_entry_icon, menu_entry_link.childNodes[0]);
		menu_entry.appendChild(menu_entry_link);

		return menu_entry;
	};


	const add_menu = function() {
		add_menu_version_control();
		add_menu_branches();
	};

	const add_menu_version_control = async function() {
		create_menu('Version Control', [
			{
				label:    'Share Changes',
				icon:     'fa-cloud-upload',
				callback: () => Dialog.share_changes_dialog(undefined)
			},
			{
				label:    'Get Changes',
				icon:     'fa-cloud-download',
				callback: () => vcs.get_changes(current_folder)
			},
			{
				label:    'Restore previous version',
				icon:     'fa-undo',
				callback: () => Dialog.restore_version_dialog(undefined)
			},
			/*{
				label:    'Work on Task',
				icon:     'fa-tasks',
				callback: Dialog.work_on_task_dialog
			},*/
			{
				label:    'Compare',
				icon:     'fa-adjust',
				callback: Dialog.compare_dialog
			},
			{
				label:    'Merge',
				icon:     'fa-code-fork',
				callback: Dialog.merge_dialog
			},/*
			{
				label:    'Store current changes',
				icon:     'fa-archive',
				callback: Dialog.store_changes
			},
			{
				label:    'Lookup TODOs',
				icon:     'fa-inbox',
				callback: () => {}
			}*/
		]);

		disable_items_menu_version_control();
	};

	const disable_items_menu_version_control = async function() {
		const is_nbdime_installed = await vcs.is_nbdime_installed();

		if (is_nbdime_installed) {
			return undefined;
		}

		disable_menu_item('version-control-menu-compare', 'Needs nbdime to be installed');
		disable_menu_item('version-control-menu-merge', 'Needs nbdime to be installed');
	};

	const disable_menu_item = function(id, description) {
		const menu_item = document.getElementById(id);
		menu_item.classList.add('disabled');
		menu_item.onclick = undefined;
		menu_item.title = description;
	};

	const add_menu_branches = async function() {
		const branches = await vcs.get_branches(current_folder);
		const current_branch = await vcs.get_current_branch(current_folder);

		let branches_menu_list_entries = create_branch_menu_entries(branches);
		branches_menu_list_entries = branches_menu_list_entries.concat(create_branch_modifier_menu_entries());
		create_menu(`Working Tree`, branches_menu_list_entries);
		update_branch_menu(current_branch);
	};

	const create_branch_menu_entries = function(branches) {
		let branches_menu_list_entries = [];

		branches.forEach((branch) => {
			branches_menu_list_entries.push(create_branch_menu_entry(branch));
		});

		return branches_menu_list_entries;
	};

	const create_branch_menu_entry = function(branch) {
		return {
			label:    branch,
			icon:     'fa-code-fork',
			callback: (event) => {
				const new_branch = event.path[1].id.replace('working-tree-menu-', '');

				if (using_work_trees) {
					const branch_menu_label = document.querySelector('#working-tree-menu > a').innerHTML
					const current_branch = branch_menu_label.substring(branch_menu_label.indexOf("(") + 1, branch_menu_label.lastIndexOf(")"));;
					const url = `${window.origin}${window.location.pathname.replace(current_branch, new_branch)}`;
					const win = window.open(url, '_blank');
					if (win) {
						win.focus();
					}
				} else {
					// TODO: id is toLowerCased, but branch names should be lowercase anyway?
					vcs.switch_branch(current_folder, new_branch);
				}
			}
		};
	};

	const create_branch_modifier_menu_entries = function() {
		return [
			{
				label:    'Add working tree',
				icon:     'fa-plus',
				callback: Dialog.create_branch_dialog
			}
		];
	};

	const bind_events = function() {
		events.on('branch_changed.VCS', (event, branch) => update_branch_menu(branch));
	};

	const update_branch_menu = function(new_branch) {
		update_current_branch(new_branch);
		disable_menu_item(`working-tree-menu-${new_branch}`, 'Cannot switch to current branch');
	};

	const update_current_branch = function(branch) {
		const branch_menu = document.querySelector('#working-tree-menu > a');
		branch_menu.innerHTML = `Working Tree (${branch})`;
	};

	module.exports = {
		initialize,
		add_menu
	};
});

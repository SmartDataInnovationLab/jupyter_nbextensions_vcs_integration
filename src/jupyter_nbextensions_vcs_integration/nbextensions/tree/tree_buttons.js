define((
	require,
	exports,
	module
) => {
	'use strict';

	const Jupyter = require('base/js/namespace'),
	      Dialog  = require('../shared/ui/dialog'),
	      Utils   = require('../shared/utils');
	      
	let vcs = undefined,
	    current_folder = Utils.get_current_folder();

	const initialize = function(is_repo_initialized, passed_vcs) {
		vcs = passed_vcs;
		// no need for remove functions as the site completely gets reloaded
		if (is_repo_initialized) {
			add_vcs_tree_buttons();
		} else {
			add_vcs_init_buttons();
		}
	};

	const add_vcs_tree_buttons = async function() {
		const is_update_available = await vcs.is_update_available();

		if (is_update_available) {
			const pull_button = create_tree_button('Update available', 'primary', () => vcs.get_changes(current_folder));
			add_tree_button(pull_button);
		}

		const create_worktree_button = {
			label:    'Create',
			title:    'Create worktrees for each branch',
			callback: () => vcs.init_work_trees(current_folder)
		};

		const update_worktree_button = {
			label:    'Update',
			title:    'Update all worktrees',
			callback: () => vcs.update_work_trees(current_folder)
		};

		const delete_worktree_button = {
			label:    'Delete All',
			title:    'Delete all worktrees',
			callback: () => vcs.undo_work_trees(current_folder)
		};

		const worktree_buttons = create_tree_button_dropdown('Worktrees', create_worktree_button, update_worktree_button, delete_worktree_button);
		add_tree_button(worktree_buttons);

		const share_all_button = create_tree_button('Share All Changes', 'default', () => Dialog.share_changes_dialog('all'));
		add_tree_button(share_all_button);
	};


	const create_tree_button = function(button_name, button_type, callback) {
		const id = `vcs-${button_name.toLowerCase().replace(' ', '-')}-button`;

		if (document.getElementById(id)) {
			return undefined;
		}

		const tree_button = document.createElement('button');
		tree_button.className = `btn btn-${button_type} btn-xs`;
		tree_button.id = id;
		tree_button.type = 'button';
		tree_button.innerHTML = button_name;
		tree_button.onclick = callback;

		return tree_button;
	};

	const add_tree_button = function(tree_button) {
		if (tree_button) {
			const tree_button_group = document.querySelector('.tree-buttons > .pull-right');
			tree_button_group.insertBefore(tree_button, tree_button_group.firstChild);
		}
	};

	const create_tree_button_dropdown = function(button_label, ...buttons) {
		const dropdown_container = document.createElement('div');
		dropdown_container.classList = 'btn-group';
		dropdown_container.id = `${button_label.toLowerCase()}-buttons`;

		if (document.getElementById(dropdown_container.id)) {
			return undefined;
		}

		const button_dropdown = document.createElement('button');
		button_dropdown.classList = 'dropdown-toggle btn btn-default btn-xs';
		button_dropdown.dataset.toggle = 'dropdown';

		const button_dropdown_label = document.createElement('span');
		button_dropdown_label.innerHTML = button_label;

		const button_dropdown_caret = document.createElement('span');
		button_dropdown_caret.classList = 'caret';

		button_dropdown.appendChild(button_dropdown_label);
		button_dropdown.appendChild(button_dropdown_caret);
		dropdown_container.appendChild(button_dropdown);

		const dropdown_list = document.createElement('ul');
		dropdown_list.classList = 'dropdown-menu';

		buttons.forEach((button) => {
			const dropdown_list_entry = document.createElement('li');
			dropdown_list_entry.onclick = button.callback;

			const dropdown_list_link = document.createElement('a');
			dropdown_list_link.href = '#';
			dropdown_list_link.title = button.title;
			dropdown_list_link.innerHTML = button.label;

			dropdown_list_entry.appendChild(dropdown_list_link);
			dropdown_list.appendChild(dropdown_list_entry);
		});

		dropdown_container.appendChild(dropdown_list);

		return dropdown_container;
	};

	const add_vcs_init_buttons = function() {
		const init_button = create_tree_button('Initialize VCS', 'default', Dialog.initialize_repository_dialog);
		const clone_button = create_tree_button('Clone', 'default', Dialog.clone_repository_dialog);

		add_tree_button_group(init_button, clone_button);
	};

	const add_tree_button_group = function(...tree_buttons) {
		const tree_buttons_container = document.querySelector('.tree-buttons > .pull-right');
		const button_group = document.createElement('div');
		button_group.className = 'btn-group';

		tree_buttons.forEach((button) => {
			if (button) {
				button_group.appendChild(button);
			}
		});

		tree_buttons_container.insertBefore(button_group, tree_buttons_container.firstChild);
	};

	module.exports = {
		initialize
	};
});

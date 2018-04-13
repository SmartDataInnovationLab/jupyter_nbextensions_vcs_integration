define((
	require,
	exports,
	module
) => {
	'use strict';

	const events   = require('base/js/events'),
	      Logger   = require('./logger'),
	      Dialog     = require('../shared/ui/dialog'),
	      Executor = require('./executor');

	// TODO: make sure nbdime is setup

	// TODO: must be persisted in some way (especially work_on_task)
	const STATE = {
		work_on_task:            {},
		previous_variable_value: {}
	};

	let executor = null;

	const check_output = function(message_if_error, lines){
		if(!lines){
			return false;
		}
		let has_error = false
		lines.forEach((line) =>{
			if (line.startsWith("error:")|| line.startsWith("fatal:") )
				has_error = true;
		});

		if(has_error){
			//TODO: Throw Error and let caller handle it
			Dialog.create_error_output_dialog({
				modal: {
					heading:     "VCS Error",
					description: message_if_error
				}
			}, {
				log: lines.join("\n")
			});
			throw new Error("git output contains error. Message: "+ message_if_error+ "\nOutput:\n " + lines.join("\n"));
		}
	}

	const initialize = function() {
		const executor_options = {};
		const kernel_options = {
			// Will be the visible name
			// notebook_path: 'VCS (do not shutdown)',
			notebook_name: 'vcs'
		};

		executor = new Executor.Executor(executor_options, kernel_options);
	};

	const run_command = async function(command, folder) {
		if (folder) {
			// automatically switches back to kernel initialization folder after command
			command = `cd ${folder}; ${command}`
		}
	
	
		const command_output = await executor.get_output_of_command(`!${command}`);

		return parse_command_output(command_output)
	};

	const run_git_command = async function(folder, command) {
		const command_output = await run_command(`git -C "${folder}" ${command}`);

		return command_output;
	};

	const parse_command_output = function(output) {
		if (output === null) {
			return null;
		} else {
			const output_lines = output.split('\r\n');
			output_lines.pop();

			return output_lines;
		}
	};

	const shell_escape_path = function(path) {
		return path.split(' ')
		           .join(' \\');
	};

	const is_vcs_installed = async function() {
		const version_output = await run_git_command('.', '--version');
		return version_output[0].startsWith('git version');
	};


	const is_repo_initialized = async function(folder = '.', recurse = true) {
		const rev_parse_output = await run_git_command(folder, 'rev-parse --is-inside-work-tree');
		let is_repo_init = rev_parse_output[0].startsWith('true');

		// If worktrees are used and current folder contains the worktrees
		if (!is_repo_init && recurse) {
			return is_repo_initialized(`${folder}/master`, false);
		}

		return is_repo_init;
	};

	const repository_sanity_checks = async function(folder = '.') {
		try {
			await has_at_least_one_branch(folder);
			await has_at_least_one_remote(folder);
			return [true, {}];
		} catch (error) {
			return [false, error];
		}
	};

	const has_at_least_one_branch = async function(folder = '.') {
		const branch_output = await run_git_command(folder, 'branch');

		if (branch_output === null) {
			throw new Error('Repository has no branches');
		}

		return true;
	};

	const has_at_least_one_remote = async function(folder) {
		const remote_output = await run_git_command(folder, 'remote -v');

		if (remote_output === null) {
			throw new Error('Repository has no remotes');
		}

		return true;
	};

	const get_git_relative_path = async function(folder, path) {
		const git_root = await get_git_root(folder);
		const pwd_output = await run_command('pwd', folder);
		const pwd = pwd_output[0];

		const server_relative_path = git_root.replace(`${pwd}/`, '');
		const git_relative_path = path.replace(`${server_relative_path}/`, '');

		return git_relative_path;
	};


	const share_changes = async function(folder = '.', commit_message, options) {
		// TODO: add error handling
		// TODO: maybe use add --all to also propagate the deletions?

		let add_parameters = await parse_add_parameters(folder, options);
		let commit_parameters = parse_commit_parameters(options);

		events.trigger('before_commit.VCS');
		let out_add = await run_git_command(folder, `add ${add_parameters}`);
		console.log(add_parameters);
		check_output("Could not add file", out_add);

		let out_com = await run_git_command(folder, `commit -m "${commit_message}" ${commit_parameters}`);
		check_output("Could not commit", out_com);
		console.log(out_com);
		events.trigger('commit.VCS');
		let out_push = await run_git_command(folder, 'push --all');
		check_output("Could not push", out_push);
	};

	const parse_add_parameters = async function(folder, options) {
		console.log(options);
		if (!options.add_parameters) {
			return '';
		}

		let add_parameters = '';

		if (options.add_parameters.files) {
			add_parameters = options.add_parameters.files.join(' ');
		} else if (options.add_parameters.updated) {
			add_parameters = '--update';
		} else if (options.add_parameters.all) {
			add_parameters = '--all';
		} else if (options.add_parameters.notebook) {
			add_parameters = await get_git_relative_path(folder, options.notebook);
		} else {
			// TODO: throw error
		}

		return add_parameters;
	};

	const parse_commit_parameters = function(options) {
		if (!options.commit_parameters) {
			return '';
		}

		let commit_parameters = '';
		if (options.commit_parameters.fixup && options.commit_parameters.commit_reference) {
			commit_parameters = `--fixup ${options.commit_parameters.commit_reference}`;
		} else if (options.commit_parameters.squash && options.commit_parameters.commit_reference) {
			commit_parameters = `--squash ${options.commit_parameters.commit_reference}`;
		} else {
			// TODO: throw error
		}

		return commit_parameters;
	};

	let get_changes = async function(folder = '.') {
		events.trigger('before_pull.VCS');
		// update all references and check them out locally (so they will also be pulled)
		let out_fetch = await run_git_command(folder, 'fetch --all');
		check_output("Could not fetch", out_fetch);
		//await run_git_command(folder, 'for remote in `git branch -r`; do git branch --track ${remote#origin/} $remote; done');

		let out_pull = await run_git_command(folder, 'pull --all');
		check_output("Could not pull", out_pull);

		events.trigger('pull.VCS');

		// recognize merge conflict and resolve here
	};

	const initialize_repository = async function(folder = '.', remote_repository) {
		await run_git_command(folder, 'init');
		await run_git_command(folder, `remote add origin ${remote_repository}`);
		events.trigger('init_repo.VCS');
	/*
		const options = {
			add_parameters: 'all'
		};

		await share_changes(folder, 'Initial Commit', options);
		await init_work_trees(folder);
		
		
		window.location.href += '/master';
	*/
	};

	const clone_repository = async function(folder = '.', remote_repository) {
		await run_git_command(folder, `clone ${remote_repository}`);
		events.trigger('repo_cloned.VCS');
	};

	// TODO: make it work with folders
	const work_on_task_start = function(task_name) {
		STATE.work_on_task.current_task = task_name;
		STATE.work_on_task.iteration = 1;

		// TODO: error if on master
		events.on('notebook_saved.Notebook', work_on_task_update);
		events.on('commit.VCS', work_on_task_finish);
	};

	const work_on_task_update = async function() {
		const share_options = {
			add_parameters:    'updated',
			commit_parameters: {
				squash:           true,
				reference_commit: `HEAD^${STATE.work_on_task.iteration}`
			}
		};

		// Autosquash only usable when interactive
		// By setting the editor to : it gets bypassed and 'auto-approved' without interaction
		set_vcs_variable('core.editor', ':');
		await share_changes(`${STATE.work_on_task.current_task} (WIP ${STATE.work_on_task.iteration})`, share_options);
		reset_vcs_variable('core.editor');
		STATE.work_on_task.iteration += 1;
	};

	const work_on_task_finish = function() {
		STATE.work_on_task.current_task = '';
		STATE.work_on_task.task_iteration = 1;
		events.off('notebook_saved.Notebook', work_on_task_update);
		events.off('commit.VCS', work_on_task_finish);

		const rebase_options = {
			interactive:      true,
			autosquash:       true,
			reference_commit: `HEAD^${STATE.work_on_task.iteration}`
		};

		rebase(rebase_options);
	};

	const rebase = async function(folder = '.', options) {
		const rebase_options = parse_rebase_options(options);

		if (!rebase_options) {
			Logger.error('Rebase called with wrong options');
		}

		await run_git_command(folder, `rebase ${rebase_options}`);
	};

	const parse_rebase_options = function(options) {
		let rebase_options = '';

		if (options.interactive) {
			rebase_options += '--interactive';
		}

		// Autosquash only works with interactive
		if (options.autosquash && options.interactive) {
			rebase_options += ' --autosquash';
		}

		if (options.reference_commit) {
			rebase_options += ` ${options.reference_commit}`;
		} else {
			// Rebase requires it
			return undefined;
		}

		return rebase_options;
	};

	const get_file_status = async function(folder = '.') {
		const git_status = await run_git_command(folder, 'status --porcelain --ignored');

		if (git_status === null) {
			return [];
		}

		const file_status = parse_file_status(git_status);

		return file_status;
	};

	const parse_file_status = function(status) {
		let file_status = [];

		status.forEach((status_line) => {
			// https://git-scm.com/docs/git-status
			// TODO: maybe porcelain format version 2 (but is currently unneeded)
			let status = status_line.substring(0, 2);
			const file   = status_line.substring(3);

			// Hidden files are not shown in file listings, so we filter them
			if (file.startsWith('.')) {
				return undefined;
			}

			if (status[0] === 'A') {
				status = 'added';
			} else if (status[0] === 'M' || status[1] === 'M') {
				status = 'modified';
			} else if (status[0] === '?') {
				status = 'untracked';
			} else if (status[0] === '!') {
				status = 'ignored';
			} else {
				return undefined;
			}

			file_status.push({
				file,
				status
			});
		});

		return file_status;
	};

	const is_update_available = async function(folder = '.') {
		const fetch_output = await run_git_command(folder, 'fetch origin --dry-run');
		let update_available = false;

		if (fetch_output !== null && !fetch_output[0].startsWith('fatal')) {
			update_available = true;
		}

		return update_available;
	};

	const get_branches = async function(folder = '.') {
		const branches_output = await run_git_command(folder, 'for-each-ref --format="%(refname:short)" refs/heads/');

		return branches_output;
	};

	const get_current_branch = async function(folder = '.') {
		const branches_output = await run_git_command(folder, 'rev-parse --abbrev-ref HEAD');

		return branches_output[0];
	};

	const switch_branch = async function(folder = '.', branch) {
		const branches = await get_branches(folder);
		if (!branches.includes(branch)) {
			return undefined;
		}

		await run_git_command(folder, `checkout ${branch}`);
		events.trigger('branch_changed.VCS', branch);
		reload_notebook();
	};

	const create_branch = async function(folder = '.', branch) {
		const branches = await get_branches(folder);

		if (branches.includes(branch)) {
			return undefined;
		}

		await run_git_command(folder, `checkout -b ${branch}`);
		reload_notebook();
	};

	const restore_file_versions = async function(folder = '.', relative_version, options) {
		const files = options.files;

		files.forEach(async (file) => {
			await restore_file_version(folder, file, relative_version);
		});
	}

	const restore_file_version = async function(folder = '.', file, relative_version) {
		const file_versions = await get_file_versions(folder, file);

		if (file_versions === null || file_versions.length < relative_version) {
			console.error("Can't go to far back");
		}

		let file_version = relative_version;

		/*if (!await is_current_commit(folder, file_versions[file_version])) {
			file_version += 1;
		}*/

		const wanted_file_version = file_versions[file_version];
		await run_git_command(folder, `checkout ${wanted_file_version} -- ${file}`);
	};

	const get_file_versions = async function(folder = '.', file) {
		const log_output = await run_git_command(folder, `log --pretty=oneline --no-color ${file}`);

		if (log_output === null) {
			return null;
		}

		const commits = log_output.map((log_line) => log_line.substring(0, log_line.indexOf(' ')));

		return commits;
	};

	const get_file_version_messages = async function(folder = '.', file) {
		const log_output = await run_git_command(folder, `log --pretty=oneline --no-decorate --no-color ${file}`);

		// no file versions available
		if (log_output === null) {
			return null;
		}

		const messages = log_output.map((log_line) => log_line.substring(log_line.indexOf(' ') + 1));

		return messages;
	};


	const is_current_commit = async function(folder = '.', commit) {
		const log_output = await run_git_command(folder, 'log --pretty=oneline -n 1');
		const current_commit = log_output[0].substring(0, log_output.indexOf(' '));

		return current_commit === commit;
	};

	const get_vcs_variable = async function(folder, variable) {
		const variable_value = await run_git_command(folder, `var -l | ${variable}`);

		return variable_value[0];
	};

	const set_vcs_variable = async function(folder, variable, value) {
		const current_value = await get_vcs_variable(variable);
		STATE.previous_variable_value[value] = current_value;

		await run_git_command(folder, `config --local ${variable} ${value}`);
	};

	const reset_vcs_variable = async function(folder, variable) {
		await run_git_command(folder, `config --local ${variable} ${STATE.previous_variable_value.variable}`);
	};

	const reload_notebook = function() {
		// Doesn't work, need to debug
		// Jupyter.notebook.load_notebook(Jupyter.notebook.notebook_path);
		window.location.reload();
	};

	const using_work_trees = async function(folder = '.') {
		const test_git_output = await run_git_command(folder, 'status');
		const outside_repo = test_git_output[0] === 'fatal: Not a git repository (or any parent up to mount point /)';
		const branches = await get_branches(`${folder}/master`);

		if (outside_repo && branches[0].startsWith('fatal:')) {
			// master folder does not exist
			return false;
		}

		const worktree_list = await run_git_command(folder, 'worktree list');
		
		if (worktree_list.length === 1) {
			// do not initialize if I am not in git root
			const worktree_folder = worktree_list[0].split(' ')[0];
			const pwd = await run_command('pwd', folder);

			return pwd[0] !== worktree_folder;
		}
		
		return worktree_list.length >= 2;
	};

	const init_work_trees = async function(folder) {
		return false;
		const in_git_root = await is_in_git_root(folder);

		if (!in_git_root) {
			console.log('currently unsupported (must be in git root)');
			return false;
		}

		// 'main worktree' should be on master
		await switch_branch(folder, 'master');

		// move 'main worktree' into master folder
		await run_command('mkdir master', folder);

		// throws 'error' that 'master' cannot be copied into itself, but works
		await run_command('mv {*,.[^.]*} master/', folder);

		// delete all current worktrees
		//delete_work_trees('master');

		create_work_tree_per_branch(`${folder}/master`);
		return true;
	};

	const get_current_work_directory = async function(folder) {
		// '.' is relative, need to make it absolute
		let absolute_folder = folder;
		if (folder === '.') {
			absolute_folder = '';
		} else {
			absolute_folder = `/${folder}`;
		}
		// VCS kernel is initialized at server root
		const server_root_path = await run_command('pwd', folder);
		const cwd = `${server_root_path[0]}${absolute_folder}`;

		return cwd;
	};

	const get_git_root = async function(folder = '.') {
		const git_root_output = await run_git_command(folder, 'rev-parse --show-toplevel');
		const git_root = git_root_output[0];

		return git_root;
	};

	const is_in_git_root = async function(folder = '.') {
		const cwd = await get_current_work_directory(folder);
		const git_root = await get_git_root(folder);

		return cwd === git_root;
	};

	const create_work_tree_per_branch = async function(folder) {
		const branches = await get_branches(folder);

		branches.forEach(async (branch) => {
			if (branch === 'master') {
				return undefined;
			}

			await create_work_tree('master', '../', branch);
		});
	};

	const create_work_tree = async function(folder, path, branch) {
		await run_git_command(folder, `worktree add ${path}${branch} ${branch}`);
	};


	// when branch is deleted -> worktree still exists but has no tracking info -> easiest way: delete all, get all branches -> recreate
	const update_work_trees = async function(folder) {
		await delete_work_trees(folder);
		await create_work_tree_per_branch(folder);
	};

	const delete_work_trees = async function(folder) {
		const worktree_list = await run_git_command(folder, 'worktree list');

		const worktree_paths = worktree_list.map((worktree_line) => worktree_line.split(' ')[0]);

		worktree_paths.forEach(async (worktree_path) => {
			if (worktree_path.includes('master')) {
				return undefined;
			}

			await run_command(`rm -rf ${worktree_path}`);
		});

		await run_git_command(folder, 'worktree prune');
	};

	const undo_work_trees = async function(folder) {
		const files = await list_files(folder);

		if (!files.includes('master')) {
			console.log('You should be in the main project folder');
			return undefined;
		}

		delete_work_trees(folder);

		await run_command(`mv master/{*,.[^.]*} ${folder}`, folder);
		await run_command('rmdir master', folder);
	};


	const is_nbdime_installed = async function() {
		const version_output = await run_command('nbdime --version');

		let is_nbdime_installed = true;

		if (version_output[0] === '/usr/bin/sh: nbdime: command not found') {
			is_nbdime_installed = false;
		}

		return is_nbdime_installed;
	};

	const merge = async function(folder, branch) {
		const current_branch = await get_current_branch();

		if (current_branch !== 'master') {
			console.log('Can only merge into master');
			return undefined;
		}

		await run_git_command(folder, `merge ${branch}`);
		const unmerged_files_output = await run_git_command(folder, 'ls-files -u');

		if (unmerged_files_output) {
			// Format: ModeBits ObjectName StageNumber File
			const unmerged_files = unmerged_files_output.map((line) => line.split(/\b(\s)/)[6]);
			const unmerged_files_unique = Array.from(new Set(unmerged_files));

			unmerged_files_unique.forEach((file) => {
				run_git_command(folder, `mergetool ${file}`);
			});
		} else {
			console.log('No files need to be merged');
		}
	};

	const compare = async function(folder, branch) {
		const current_branch = await get_current_branch();
		console.log(`Comparing ${current_branch} ${branch}`);
		await run_command(`nbdiff-web ${current_branch} ${branch}`, folder);
	};

	return {
		initialize,
		is_vcs_installed,
		is_repo_initialized,
		share_changes,
		get_changes,
		work_on_task_start,
		work_on_task_update,
		work_on_task_finish,
		initialize_repository,
		clone_repository,
		get_file_status,
		is_update_available,
		get_branches,
		get_current_branch,
		switch_branch,
		create_branch,
		restore_file_versions,
		get_file_version_messages,
		repository_sanity_checks,
		create_work_tree_per_branch,
		init_work_trees,
		undo_work_trees,
		update_work_trees,
		using_work_trees,
		is_nbdime_installed,
		merge,
		compare
	};
});

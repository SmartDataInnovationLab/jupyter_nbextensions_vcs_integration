define((
	require,
	exports,
	module
) => {
	'use strict';

	const Jupyter = require('base/js/namespace'),
	      events  = require('base/js/events'),
	      NotificationWidget = require('base/js/notificationwidget').NotificationWidget;


	let vcs_notification_widget = undefined;

	const initialize = function() {
		create_notification_widget();
		bind_events();
	};

	const create_notification_widget = function() {
		Jupyter.notification_area.new_notification_widget('vcs');
		vcs_notification_widget = new NotificationWidget('#notification_vcs');
	};

	const bind_events = function() {
		events.on('commit.VCS', on_commit);
		events.on('pull.VCS', on_pull);
	};

	const on_commit = function() {
		vcs_notification_widget.info('Successfully committed changes');
	};

	const on_pull = function() {
		vcs_notification_widget.info('Successfully pulled changes');
	};

	module.exports = {
		initialize
	};
});

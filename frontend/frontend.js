function ghRequest(url, callback) {
	'use strict';
	var req = new XMLHttpRequest();
	req.addEventListener('error', function reqFailed() {
		callback(new Error('Unable to connect to search service'));
	});
	req.onreadystatechange = function onreadystatechange() {
		if (this.readyState === 4 && this.status === 200) {
			var res;

			try {
				res = JSON.parse(req.response);
			} catch (e) {
				return callback(new Error('Unable to read response'));
			}

			callback(null, res);
		}
	};
	req.open('GET', url);
	req.send();
}

function htmlEscape(text) {
	'use strict';
	var entityMap = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		'\'': '&#39;',
		'/': '&#x2F;',
		'`': '&#x60;',
		'=': '&#x3D;'
	};

	return String(text).replace(/[&<>"'`=/]/g, function (s) {
		return entityMap[s];
	});
}

/* eslint-disable no-unused-vars */
function ghostHunterFrontend/* eslint-enable no-unused-vars */(input, options) {
	'use strict';
	function format(t, d) {
		return t.replace(/{{([^{}]*)}}/g, function (a, b) {
			var r = d[b];
			return typeof r === 'string' || typeof r === 'number' ? r : a;
		});
	}

	/* Begin data processing */

	if (typeof input === 'string') {
		input = document.querySelector(input);
	}

	if (typeof options.results === 'string') {
		options.results = document.querySelector(options.results);
	}

	var requiredOpts = ['endpoint', 'results'];
	var defaults = {
		/* eslint-disable camelcase */
		result_template: '<a href="{{link}}"><p><h2>{{title}}</h2><strong>{{pubDate}}</strong></p></a>',
		info_template: '<p>Number of posts found: {{amount}}</p>',
		/* eslint-enable camelcase */
		displaySearchInfo: true,
		zeroResultsInfo: true,
		before: false,
		onComplete: false,
		endpoint: '',
		results: ''
	};
	var i;

	for (i = 0; i < requiredOpts.length; i++) {
		if (!options[requiredOpts[i]]) {
			throw new Error('Missing required field: ' + requiredOpts[i]);
		}
	}

	this.options = {};
	var opts = Object.keys(defaults);

	for (i = 0; i < opts.length; i++) {
		var opt = opts[i];
		this.options[opt] = options[opt] || defaults[opt];
	}

	// Force trailing slash
	this.endpoint = this.options.endpoint.replace(/\/$/, '') + '/';

	/* End data processing */

	this.input = input;

	// Get target and search on submit
	this.target = this.input.closest('form');
	this.target.onsubmit = (function deprecatedSearch(event) {
		// Only act on scripted calls
		if (!event.isTrusted) {
			console.warn('GhostHunter-Server:Frontend - element.onsubmit is deprecated. Please use instance.onsubmit. See https://git.io/fbprc');
			this.search(this.input.value);
		}
	}).bind(this);

	this.submitted = function submitted(event) {
		event.preventDefault();
		this.search(this.input.value);
	};

	this.target.addEventListener('submit', this.submitted.bind(this));

	// Begin act of searching
	this._search = function (err, items) {
		var resultNode = this.options.results;

		if (this.options.before) {
			this.options.before();
		}

		if (err) {
			resultNode.textContent = 'An unexpected error occurred: ' + (err.message || err);
			return;
		}

		if (items.errors && items.errors.length > 0) {
			resultNode.textContent = items.errors[0].details;
		}

		resultNode.innerHTML = '';

		if (this.options.displaySearchInfo && (this.options.zeroResultsInfo || items.meta.count > 0)) {
			resultNode.innerHTML = format(this.options.info_template, {
				amount: items.meta.count,
				plural: items.meta.count === 1 ? '' : 's',
				search: htmlEscape(this.input.value)
			});
		}

		var html = resultNode.innerHTML;

		for (i = 0; i < items.data.length; i++) {
			html += format(this.options.result_template, items.data[i]);
		}

		resultNode.innerHTML = html;

		if (this.onComplete) {
			this.onComplete(items.data);
		}
	};

	this.search = function (value) {
		var url = this.endpoint + encodeURIComponent(value);
		ghRequest(url, this._search.bind(this));
	};
}

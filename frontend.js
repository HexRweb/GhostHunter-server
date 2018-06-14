'use strict';

function ghRequest(url, callback) {
	if ('fetch' in window) {
		return fetch(url)
			.then(res => res.json())
			.then(res => callback(null, res))
			.catch(callback)
	}

	var req = new XMLHttpRequest();
	req.addEventListener('error', function reqFailed() {
		callback(new Error('Unable to connect to search service'));
	});
	req.onreadystatechange = function stateChange() {
		if (this.readyState === 4 && this.status === 200) {
			var res;

			try {
				res = JSON.parse(req.response);
			} catch (e) {
				return callback(new Error('Unable to read response'));
			}

			callback(null, res);
		}
	}
	req.open("GET", url);
	req.send();
}

function ghostHunterFrontend(input, options) {
	function format(t, d) {
		return t.replace(/{{([^{}]*)}}/g, function (a, b) {
			var r = d[b];
			return typeof r === 'string' || typeof r === 'number' ? r : a;
		});
	}

	/* Begin data processing */

	if (typeof input === "string") {
		input = document.querySelector(input);
	}

	var required_params = ['endpoint', 'results'];
	var defaults = {
		resultsData: false,
		onPageLoad: true,
		onKeyUp: false,
		result_template: "<a href='{{link}}'><p><h2>{{title}}</h2><strong>{{pubDate}}</strong></p></a>",
		info_template: "<p>Number of posts found: {{amount}}</p>",
		displaySearchInfo: true,
		zeroResultsInfo: true,
		before: false,
		onComplete: false,
		endpoint: '',
		results: ''
	}

	for (var i = 0; i < required_params.length; i++) {
		if (!options[required_params[i]]) {
			throw new Error('Missing required field: ' + required_params[i]);
		}
	}

	this.options = {};
	var opts = Object.keys(defaults);

	for (var i = 0; i < opts.length; i++) {
		var opt = opts[i];
		this.options[opt] = options[opt] || defaults[opt];
	}

	// Force trailing slash
	this.endpoint = this.options.endpoint.replace(/\/$/,'') + '/';

	/* End data processing */

	this.input = input;

	// Get target and search on submit
	this.target = this.input.closest('form');
	this.target.onsubmit = (function search(event) {
		event.preventDefault();
		this.search(this.input.value)
	}).bind(this)

	/* Begin act of searching */
	this._search = function(err, items) {
		var resultNode = document.querySelector(this.options.results);

		if (this.options.before) {
			this.options.before();
		}

		if (err) {
			resultNode.textContent = 'An unexpected error occurred: ' + (err.message || err);
		}

		if (items.errors && items.errors.length) {
			resultNode.textContent = items.errors[0].details;
		}

		if(this.options.displaySearchInfo && (this.options.zeroResultsInfo || items.meta.count > 0)) {
			resultNode.innerHTML = format(this.info_template, {amount: items.meta.count});
		}

		let html = '';

		for (var i = 0; i < items.data.length; i++) {
			html += format(this.result_template, items.data[i]);
		}

		resultNode.innerHTML = html;

		if (this.onComplete) {
			this.onComplete(items.data);
		}
	}

	this.search = function(value) {
		var url = this.endpoint + encodeURIComponent(value);
		ghRequest(url, this._search);
	}
}
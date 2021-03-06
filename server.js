const http = require('http');
const GhostHunter = require('./lib/ghost-hunter');
const serveResponse = require('./lib/response');

/* eslint-disable unicorn/no-process-exit */
function errorAndExit(error) {
	console.error(error);
	console.log('An unrecoverable error has occurred');
	process.exit(1);
}
/* eslint-enable unicorn/no-process-exit */

module.exports = function startServer(options) {
	this.options = Object.assign({
		port: 3000,
		path: '/',
		ghostHunter: {},
		refreshInterval: 1000 * 60 * 60 * 6, // Refresh the index every 6 hours
		allowedOrigins: []
	}, options);
	this.indexer = new GhostHunter(options.ghostHunter);
	console.log('[Index] Creating initial index');
	this.indexer.createIndex()
		.then(() => console.log('[Index] Initial population done - server is ready'))
		.catch(errorAndExit);

	if (this.options.refreshInterval) {
		this.refreshID = setInterval(() => {
			console.log('[Index] Refreshing');
			this.indexer.createIndex(true)
				.then(() => console.log('[Index] refreshed'))
				// @todo: fallback to old index???
				.catch(errorAndExit);
		}, this.options.refreshInterval);
	} else {
		this.refreshID = null;
	}

	this.server = http.createServer(serveResponse.bind(this));
	this.server.listen({
		host: this.options.host,
		port: this.options.port
	});

	return this;
};

const Server = require('./server');

// Basic server example!
const server = new Server({
	path: '/',
	ghostHunter: {
		// Update your config here!
		instance: {
			url: 'https://yoursite.com/blog/',
			/* eslint-disable camelcase */
			client_id: 'ghost-search',
			client_secret: 'c57de3xq3c2h'
			/* eslint-enable camelcase */
		}
	}
});

module.exports = server;

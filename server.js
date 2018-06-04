const http = require('http');
const GhostHunter = require('./lib/ghost-hunter');
const serveResponse = require('./lib/response');

module.exports = function startServer(options) {
    this.options = Object.assign({
        port: 3000,
        path: '/',
        ghostHunter: {}
    }, options);
    this.indexer = new GhostHunter(options.ghostHunter);
    this.indexer.createIndex()
        .then(() => console.log('server ready'))
        .catch(e => console.error(e));

    this.server = http.createServer(serveResponse.bind(this));
    this.server.listen({
        host: this.options.host,
        port: this.options.port,
        path: this.options.path
    });

    return this;
};
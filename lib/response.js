const _url = require('url');
function error(details, code) {
    return JSON.stringify({
        data: 'An error occurred',
        errors: [{
            details,
            code
        }]
    });
}

module.exports = function sendResponse(req, res) {
    let { method, url, headers } = req;
    console.log(`${method.toUpperCase()} ${url}`);

    res.setHeader('content-type', 'application/json');

    if (this.options.allowedOrigins &&
        this.options.allowedOrigins.length &&
        headers['origin']
    ) {
        const origin = _url.parse(headers['origin']);
        if (this.options.allowedOrigins.includes(origin.hostname)) {
            res.setHeader('Vary', 'origin');
            res.setHeader('Access-Control-Allow-Origin', headers['origin']);
        } else {
            res.statusCode = 403;
            res.write(error(`Origin ${origin} is not allowed to access this resource`, 'CORS_BLOCKED'));
            res.end();
            return;
        }
    } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }

    if (method.toLowerCase() !== 'get') {
        res.statusCode = 405;
        res.write(error(`The ${method} HTTP verb is not supported`, 'VERB_NOT_SUPPORTED'));
        res.end();
        return;
    }

    if (url.indexOf(this.options.path) !== 0) {
        res.statusCode = 404;
        res.write(error(`The requested resource does not exist`, 'PAGE_NOT_FOUND'));
        res.end();
        return;
    }

    const search = unescape(url.split('/').pop() || '');
    const dataToSend = this.indexer.find(search);

    if (dataToSend.errors) {
        res.statusCode = 500;
    }

    res.write(JSON.stringify(dataToSend));
    res.end();
}

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
    let { method, url } = req;
    console.log(`${method.toUpperCase()} ${url}`);

    res.setHeader('content-type', 'application/json');

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
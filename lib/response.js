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

module.exports = function sendResponse(request, response) {
	const {method, url, headers} = request;
	console.log(`${method.toUpperCase()} ${url}`);

	response.setHeader('content-type', 'application/json');

	if (this.options.allowedOrigins &&
		this.options.allowedOrigins.length > 0 &&
		headers.origin
	) {
		// eslint-disable-next-line node/no-deprecated-api
		const origin = _url.parse(headers.origin);
		if (this.options.allowedOrigins.includes(origin.hostname)) {
			response.setHeader('Vary', 'origin');
			response.setHeader('Access-Control-Allow-Origin', headers.origin);
		} else {
			response.statusCode = 403;
			response.write(error(`Origin ${origin} is not allowed to access this resource`, 'CORS_BLOCKED'));
			response.end();
			return;
		}
	} else {
		response.setHeader('Access-Control-Allow-Origin', '*');
	}

	if (method.toLowerCase() !== 'get') {
		response.statusCode = 405;
		response.write(error(`The ${method} HTTP verb is not supported`, 'VERB_NOT_SUPPORTED'));
		response.end();
		return;
	}

	if (url.indexOf(this.options.path) !== 0) {
		response.statusCode = 404;
		response.write(error('The requested resource does not exist', 'PAGE_NOT_FOUND'));
		response.end();
		return;
	}

	const search = unescape(url.split('/').pop() || '');
	// eslint-disable-next-line unicorn/no-fn-reference-in-iterator
	const dataToSend = this.indexer.find(search);

	if (dataToSend.errors) {
		response.statusCode = 500;
	}

	response.write(JSON.stringify(dataToSend));
	response.end();
};

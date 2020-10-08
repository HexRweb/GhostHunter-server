/*
 * Modified version of ghostHunter 0.0.4
*/

const assert = require('assert');
// eslint-disable-next-line node/no-deprecated-api
const {resolve} = require('url');
const lunr = require('lunr');
const got = require('got');

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function normalizeURL(url) {
	// Disallow trailing slash
	url = url.replace(/\/$/, '/');

	if (url.indexOf('/ghost') > 0) {
		url = url.replace(/\/ghost.*$/, '/ghost/api/v0.1');
	} else {
		url = `${url}/ghost/api/v0.1`;
	}

	return url;
}

function prettyDate(date) {
	const d = new Date(date);
	return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

class GhostHunter {
	constructor(_options = {}) {
		const options = Object.assign({
			instance: {},
			includePages: false,
			absolute: true
		}, _options);

		this.initialized = false;
		this.blogData = {};
		this.includePages = options.includePages;
		this.instance = options.instance;
		this.absolute = options.absolute;

		[['client_id', 'clientID'], ['client_secret', 'clientSecret']].forEach(([deprecatedInstanceParameter, normalParameter]) => {
			if (this.instance[deprecatedInstanceParameter]) {
				console.warn(`[deprecation] - ${deprecatedInstanceParameter} is no longer supported. Please use ${normalParameter} instead. See https://git.io/f4dV9`);
				this.instance[normalParameter] = this.instance[deprecatedInstanceParameter];
				this.instance[deprecatedInstanceParameter] = undefined;
			}
		});

		['clientID', 'clientSecret', 'url'].forEach(requiredInstanceParameter => {
			assert.ok(this.instance[requiredInstanceParameter]);
		});

		this.instance.url = normalizeURL(this.instance.url);
	}

	createIndex(refresh = false) {
		if (this.initialized && !refresh) {
			return false;
		}

		// Load all of the blog posts to the index.
		const parameters = {
			limit: 'all',
			include: 'tags',
			formats: ['plaintext']
		};

		if (this.includePages) {
			parameters.filter = '(page:true,page:false)';
		}

		return got(this.url('posts', parameters)).then(response => {
			const posts = JSON.parse(response.body).posts.map(post => {
				let tags = post.tags.map(tag => tag.name).join(', ');
				if (tags.length === 0) {
					tags = 'undefined';
				}

				/* eslint-disable camelcase */
				if (post.meta_description === null) {
					post.meta_description = '';
				}
				/* eslint-enable camelcase */

				const parsedData = {
					id: String(post.id),
					title: String(post.title),
					description: String(post.meta_description),
					plaintext: String(post.plaintext),
					pubDate: String(post.created_at),
					tag: tags,
					featureImage: String(post.feature_image),
					// We don't want this to be an absolute url because it's of no use to the index
					link: String(post.url)
				};
				parsedData.prettyPubDate = prettyDate(parsedData.pubDate);

				this.blogData[post.id] = {
					title: post.title,
					description: post.meta_description,
					pubDate: parsedData.prettyPubDate,
					featureImage: post.feature_image,
					link: this.absolute ? resolve(this.instance.url.replace('/ghost/api/v0.1', ''),
						post.url.replace(/^\//, '')) : post.url
				};
				return parsedData;
			});

			// This is where we'll build the index for later searching. It's not a big deal to build it on every load as it takes almost no space without data
			this.index = lunr(function initializeLunr() {
				this.field('title', {boost: 10});
				this.field('description');
				this.field('link');
				this.field('plaintext', {boost: 5});
				this.field('pubDate');
				this.field('tag');
				this.ref('id');

				posts.forEach(post => this.add(post));
			});
			this.initialized = true;
		}).catch(error => {
			throw error;
		});
	}

	url(location, parameters) {
		const qs = require('querystring').encode;
		Object.assign(parameters, {
			/* eslint-disable camelcase */
			client_id: this.instance.clientID,
			client_secret: this.instance.clientSecret
			/* eslint-enable camelcase */
		});
		return `${this.instance.url}/${location}/?${qs(parameters)}`;
	}

	find(value) {
		console.log(`[index] searching for "${value}"`);
		if (!this.index) {
			return {
				data: 'An error occurred',
				errors: [{
					details: 'Unable to search at this time. Please try again later',
					code: 'NO_INDEX'
				}]
			};
		}

		if (value === '') {
			return {
				meta: {
					count: 0
				},
				data: []
			};
		}

		const results = this.index.search(value);
		return {
			meta: {
				count: results.length
			},
			data: results.map(result => this.blogData[result.ref])
		};
	}
}

module.exports = GhostHunter;

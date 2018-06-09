/*
 * Modified version of ghostHunter 0.0.4
*/

const lunr = require('lunr');
const got = require('got')
const assert = require('assert');
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function normalizeURL(url) {
    // disallow trailing slash
    url = url.replace(/\/$/, '/');

    if (url.indexOf('/ghost') > 0) {
        url = url.replace(/\/ghost.*$/, '/ghost/api/v0.1');
    } else {
        url = `${url}/ghost/api/v0.1`
    }

    return url;
}

function prettyDate(date) {
    const d = new Date(date);
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

class GhostHunter {
    constructor(_options = {}) {
        const options = Object.assign({
            instance: {},
            includePages: false,
        }, _options);

        this.initialized = false;
        this.blogData = {};
        this.includePages = options.includePages;
        this.instance = options.instance;

        ['client_id', 'client_secret', 'url'].forEach(requiredInstanceParam => {
            assert.ok(this.instance[requiredInstanceParam]);
        });

        this.instance.url = normalizeURL(this.instance.url);
    }

    createIndex(refresh = false) {
        if (this.initialized && !refresh) return false;

        /*	Load all of the blog posts to the index.*/
        const params = {
            limit: "all",
            include: "tags",
            formats: ["plaintext"]
        };

        if (this.includePages) {
            obj.filter = "(page:true,page:false)";
        }

        return got(this.url('posts', params)).then(response => {
            const posts = JSON.parse(response.body).posts.map(post => {
                let tags = post.tags.map(tag => tag.name).join(', ');
                if (tags.length < 1) {
                    tags = "undefined";
                }

                if (post.meta_description === null) {
                    post.meta_description = ''
                };

                const parsedData = {
                    id: String(post.id),
                    title: String(post.title),
                    description: String(post.meta_description),
                    plaintext: String(post.plaintext),
                    pubDate: String(post.created_at),
                    tag: tags,
                    featureImage: String(post.feature_image),
                    link: String(post.url),
                };
                parsedData.prettyPubDate = prettyDate(parsedData.pubDate);

                this.blogData[post.id] = {
                    title: post.title,
                    description: post.meta_description,
                    pubDate: parsedData.prettyPubDate,
                    featureImage: post.feature_image,
                    link: post.url
                };
                return parsedData;
            });

            //This is where we'll build the index for later searching. It's not a big deal to build it on every load as it takes almost no space without data
            this.index = lunr(function () {
                this.field('title', { boost: 10 });
                this.field('description');
                this.field('link');
                this.field('plaintext', { boost: 5 });
                this.field('pubDate');
                this.field('tag');
                this.ref('id');

                posts.forEach(post => this.add(post));
            });
            this.initialized = true;
        }).catch(error => {throw error});
    }

    url(location, params) {
        const qs = require('querystring').encode;
        params.client_id = this.instance.client_id;
        params.client_secret = this.instance.client_secret;
        return `${this.instance.url}/${location}/?${qs(params)}`;
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
            }
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
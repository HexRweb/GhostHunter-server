# GhostHunter Server

_Don't like the documentation? Help us make it better by emailing us (hello@hexr.org), [creating an issue](https://github.com/hexrweb/ghosthunter-server/issues/new) or [creating a pull request](https://github.com/hexrweb/ghosthunter-server/compare)_

A serverside implementation of [GhostHunter](https://github.com/jamalneufeld/ghostHunter) for larger blogs

GhostHunter is the easiest drop-in for search with Ghost blogs, but as your blog grows, the index can grow large. The OG GhostHunter relies on the browsers localstorage for the index, and localstorage has an effective limit of 5MB.

GhostHunter Server, as the name suggests is GhostHunter which runs on node (serverside javascript), which means there isn't really an effective storage limit. It's a very simplistic implementation of GhostHunter coupled with an API endpoint which executes the search using GhostHunter's backend ([lunr](https://github.com/olivernn/lunr.js#installation)) and proxies the results as a JSON response

# Installation

## 1. Add dependency

```bash
  npm install --save ghosthunter-server
```

  or if you prefer yarn

```bash
  yarn add ghosthunter-server
```

## 2. Configure

When you `require('ghosthunter-server')`, you get an object with 2 properties - an uninitialized GhostHunter class, and an easy-to-use server drop-in.


### GhostHunter initialization

There isn't a whole lot to customize the GhostHunter backend, although there is some required data which relates to accessing your Ghost data.

The required options are wrapped in the `instance` key of the options object. You need to provide:

 - Instance URL (`url`) - the HTTP url of your blog instance
   - :warning: the url passed is expected to be a _valid_ HTTP url; GhostHunter-Server doesn't do any additional validation to ensure it is - this url will be [normalized](https://github.com/HexRweb/GhostHunter-server/blob/master/lib/ghost-hunter.js#L10-L21) and directly passed to [got](https://github.com/sindresorhus/got) (the request library we use)
 - Client ID (`client_id`) - The Client ID for read requests via the [Ghost API](https://api.ghost.org/)
   - This isn't used in the normal GhostHunter since Ghost provides a convenience API for this
   - While you're free to use the default Client ID provided by Ghost (`ghost-frontend`), we strongly recommend you [create a new one](https://api.ghost.org/docs/ajax-calls-from-an-external-website#section-how-to-edit-the-database) for better security and tracking
 - Client Secret (`client_secret`) - The Client Secret used to authenticate `client_id` (this is how oAuth works) via the [Ghost API](https://api.ghost.org/)

 There is one optional parameter, `includePages`, which is defaulted to `false`. Setting this option to anything truthy will add blog pages to the index

 #### Example

 ```js
const {GhostHunter} = require('ghosthunter-server');

const myInstance = new GhostHunter({
  instance: {
    // example data, doesn't work!
    url: 'https://demo.ghost.io/',
    client_id: 'ghost-search',
    client_secret: 'abcd1ef2gh3'
  },
  includePages: true
});
 ```

### Server drop-in initialization

While the GhostHunter class provides the logic for searching, the server function creates a fully functioning API to search using the GhostHunter class. It supports a variety of options:

 - Port (`port`) - the port for the server to listen on. Defaults to `3000`
 - Path (`path`) - the subpath to respond to search requests. Defaults to `/`
   - For example, you can use NGINX to proxy `/search` to GhostHunter-Server and everything else to your Ghost Instance. In that case, you would need to set your path to `/search`
   - :warning: There is no validation on this. Make sure you include a prefixed `/` and take any necessary precautions
 - Host (`host`) - the host to listen on. Does not have a default, which means it will listen on `::` or `0.0.0.0`
 - GhostHunter Class Options (`ghostHunter`) - An object containing options to proxy to the GhostHunter Class upon initialization. Defaults to an empty object
 - Refresh Interval (`refreshInterval`) - How often to refresh the index. Will not refresh if a falsy value is provided. Defaults to 6 hours

#### Example

```js

const {Server} = require('ghosthunter-server');

const searchInstance = new Server({
  port: 3000,
  path: '/feature/search',
  host: '127.0.0.1',
  ghostHunter: {
    instance: {
      // example data, doesn't work!
      url: 'https://demo.ghost.io/',
      client_id: 'ghost-search',
      client_secret: 'abcd1ef2gh3'
    },
    includePages: true
  }
});

// Close the server after 100 seconds
setTimeout(() => searchInstance.server.close(), 100000);
```

## 3. Profit :sunglasses:

# Properties

Both the initialized GhostHunter Class and server drop-in have properties bound to their respective instance

## GhostHunter

`initialized` - Whether or not `createIndex` has been successfully run once

`blogData` - An object with keys (determined by Post ID) mapping to post data. Used by original GhostHunter

`includePages` - Whether or not pages should be included in the index

`instance` - The instance properties you need to provide for GhostHunter to request data

`index` (not always present) - The lunr index of posts (and possibly pages)

## Server

`options` - The options that were passed upon initialization

`index` - GhostHunter instance

`refreshID` (not always present) - Timer ID for refresh interval

`server` - the node HTTP Server instance

# GhostHunter Methods

Here are the methods available to be called on a GhostHunter Instance. Note: initialized Server instances don't have any methods which can be run

`createIndex` - Parameters: (optional) refresh

  - Creates an index of posts by calling the Ghost API.
  - Only does this once, unless the index is being refreshed (determined by the refresh parameter)

`url` - (internal method) - Properly encodes the URL to access the Ghost Instance's API

`find` - Parameters: (required) value

  - Searches the index and returns a list of Posts related to `value`
  - Always returns a JSON Object
    - If there was an issue, the `errors` property will be set
    - Otherwise, the `meta.count` and `data` properties will be set
        - Data will be an array of Blog Posts containing the post title, description, published date as pubDate, featureImage, and link
        - Meta.count will list the length of the data array

# Issues and Support

Feel free to create an issue if you have any questions, feature requests or found a bug. As of now, there's no specific template, but if this gets too much traction, something will be put in place. If you want to contact us directly, shoot us an email - hello@hexr.org

# Contributing

Feel free to create a Pull Request if you think any changes should be made. You don't have to explain yourself, but be able to if requested.
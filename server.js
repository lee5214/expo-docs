const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const LATEST_VERSION = 'v' + require('./package.json').version;
const { WORKFLOW, DISTRIBUTION, EXPOKIT } = require('./transition/sections');

const aliases = [
  { path: 'workflow', files: WORKFLOW },
  { path: 'distribution', files: DISTRIBUTION },
  { path: 'expokit', files: EXPOKIT },
];

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    let { pathname, query } = parsedUrl;

    if (pathname.endsWith('.html')) {
      pathname = pathname.replace('.html', '');
    }

    if (pathname.endsWith('/') && pathname.length > 1) {
      pathname = pathname.slice(0, -1);
    }

    // `latest` URLs should render the latest version
    const splitPath = pathname.split('/');
    if (splitPath[2] === 'latest') {
      splitPath[2] = LATEST_VERSION;
      req.originalPath = parsedUrl;
      app.render(req, res, splitPath.join('/'), query);
    } else {
      // Alias old URLs to new ones
      for (let i = 0; i < aliases.length; i++) {
        let alias = aliases[i];
        if (splitPath[3] === 'guides' && alias.files.indexOf(splitPath[4]) > -1) {
          splitPath[3] = alias.path;
          req.originalPath = parsedUrl;
          app.render(req, res, splitPath.join('/'), query);
          return;
        }
      }

      req.originalPath = parsedUrl;
      app.render(req, res, pathname, query);
    }
  }).listen(3000, err => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
});

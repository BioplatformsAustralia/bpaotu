const proxy = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(proxy('/private/', { target: 'http://localhost:8000/' }));
  app.use(proxy('/ingest/', { target: 'http://localhost:8000/' }));
  app.use(proxy('/static/bpa-logos/', { target: 'http://localhost:8000/' }));
  app.use(proxy('/static/bpaotu/', { target: 'http://localhost:8000/' }));
};

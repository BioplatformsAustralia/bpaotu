const proxy = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(proxy('/api/', { target: 'http://localhost:8000/' }));
  app.use(proxy('/private/', { target: 'http://localhost:8000/' }));
  app.use(proxy('/admin/', { target: 'http://localhost:8000/' }));
  app.use(proxy('/static/bpa-logos/', { target: 'http://localhost:8000/' }));
  app.use(proxy('/static/bpaotu/', { target: 'http://localhost:8000/' }));
  app.use(proxy('/static/admin/', { target: 'http://localhost:8000/' }));
  app.use(proxy('/static/debug_toolbar/', { target: 'http://localhost:8000/' }));
};

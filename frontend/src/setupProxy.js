const proxy = require('http-proxy-middleware')

module.exports = function (app) {
  app.use(proxy('/private/', { target: 'http://runserver:8080/' }))
  app.use(proxy('/oidc/', { target: 'http://runserver:8080/' }))
  app.use(proxy('/ingest/', { target: 'http://runserver:8080/' }))
}

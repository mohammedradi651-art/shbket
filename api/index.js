const { app } = require('../server/dist/server/src/app.js');

module.exports = (req, res) => {
  return app(req, res);
};

const { error } = require('../utils/response');

module.exports = (err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  error(res, status, status === 500 ? 'Internal server error' : err.message);
};

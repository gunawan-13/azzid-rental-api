const r = require('express').Router();
const c = require('../controllers/vehicleController');
const { requireAuth, requireRole } = require('../middleware/auth');

r.get('/', c.list);
r.get('/:id', c.get);
r.post('/', requireAuth, requireRole('admin'), c.create);
r.put('/:id', requireAuth, requireRole('admin'), c.update);
r.delete('/:id', requireAuth, requireRole('admin'), c.remove);

module.exports = r;

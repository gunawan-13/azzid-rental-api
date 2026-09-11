const router = require('express').Router();
const controller = require('../controllers/userController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/', requireAuth, requireRole('admin'), controller.list);
router.patch('/me/password', requireAuth, controller.changePassword);
router.get('/:id', requireAuth, controller.get);
router.patch('/:id/role-status', requireAuth, requireRole('admin'), controller.updateRoleStatus);

module.exports = router;

const r=require('express').Router(),c=require('../controllers/settingsController'); const {requireAuth,requireRole}=require('../middleware/auth');
r.get('/public',c.public); r.get('/payments/public',c.paymentPublic);
r.get('/',requireAuth,requireRole('admin'),c.get); r.put('/',requireAuth,requireRole('admin'),c.update);
r.get('/payments',requireAuth,requireRole('admin'),c.paymentList); r.post('/payments',requireAuth,requireRole('admin'),c.paymentUpsert); r.delete('/payments/:id',requireAuth,requireRole('admin'),c.paymentDelete);
module.exports=r;

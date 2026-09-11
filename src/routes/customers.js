const r=require('express').Router(),c=require('../controllers/customerController');r.get('/',c.list);r.get('/:id',c.get);r.post('/',c.create);module.exports=r;

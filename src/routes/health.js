const router=require('express').Router(); const c=require('../controllers/healthController'); router.get('/',c.health); module.exports=router;

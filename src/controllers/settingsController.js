
const { pool } = require('../config/db');
const { ok,error } = require('../utils/response');

exports.public = async(req,res)=>{
 try{const [r]=await pool.query('SELECT * FROM business_settings WHERE id=1 LIMIT 1');ok(res,r[0]||null);}
 catch(e){error(res,500,'Gagal mengambil pengaturan website');}
};
exports.get = exports.public;
exports.update = async(req,res)=>{
 try{
  const x=req.body||{};
  await pool.query(`INSERT INTO business_settings(id,business_name,email,phone,whatsapp,address,hero_title,hero_subtitle,announcement)
   VALUES(1,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE business_name=VALUES(business_name),email=VALUES(email),phone=VALUES(phone),whatsapp=VALUES(whatsapp),address=VALUES(address),hero_title=VALUES(hero_title),hero_subtitle=VALUES(hero_subtitle),announcement=VALUES(announcement)`,
   [x.business_name||'',x.email||null,x.phone||null,x.whatsapp||null,x.address||null,x.hero_title||null,x.hero_subtitle||null,x.announcement||null]);
  const [r]=await pool.query('SELECT * FROM business_settings WHERE id=1');ok(res,r[0],'Pengaturan tersimpan');
 }catch(e){console.error(e);error(res,500,'Gagal menyimpan pengaturan');}
};
exports.paymentList=async(req,res)=>{try{const [r]=await pool.query('SELECT * FROM payment_accounts ORDER BY active DESC,id DESC');ok(res,r);}catch(e){error(res,500,'Gagal mengambil rekening pembayaran');}};
exports.paymentPublic=async(req,res)=>{try{const [r]=await pool.query('SELECT id,method,provider,account_name,account_number,instructions FROM payment_accounts WHERE active=1 ORDER BY id');ok(res,r);}catch(e){error(res,500,'Gagal mengambil metode pembayaran');}};
exports.paymentUpsert=async(req,res)=>{try{
 const x=req.body||{}; if(!x.method)return error(res,400,'Metode pembayaran wajib diisi');
 if(x.id){await pool.query('UPDATE payment_accounts SET method=?,provider=?,account_name=?,account_number=?,instructions=?,active=? WHERE id=?',[x.method,x.provider||null,x.account_name||null,x.account_number||null,x.instructions||null,x.active?1:0,x.id]);}
 else {await pool.query('INSERT INTO payment_accounts(method,provider,account_name,account_number,instructions,active) VALUES(?,?,?,?,?,?)',[x.method,x.provider||null,x.account_name||null,x.account_number||null,x.instructions||null,x.active===false?0:1]);}
 const [r]=await pool.query('SELECT * FROM payment_accounts ORDER BY id DESC');ok(res,r,'Rekening pembayaran tersimpan');
}catch(e){console.error(e);error(res,500,'Gagal menyimpan rekening pembayaran');}};
exports.paymentDelete=async(req,res)=>{try{const [r]=await pool.query('DELETE FROM payment_accounts WHERE id=?',[req.params.id]);if(!r.affectedRows)return error(res,404,'Rekening tidak ditemukan');ok(res,null,'Rekening dihapus');}catch(e){error(res,500,'Gagal menghapus rekening');}};

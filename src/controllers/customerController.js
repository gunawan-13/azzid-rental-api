
const { pool } = require('../config/db');
const { ok, created, error } = require('../utils/response');

const selectCustomer = `SELECT id,name,email,phone,address,ktp_number,birth_date,purpose,notes,created_at,updated_at FROM customers`;

exports.list = async (req,res) => {
  try { const [rows] = await pool.query(`${selectCustomer} ORDER BY id DESC`); ok(res,rows); }
  catch(e){ console.error('customers.list:',e); error(res,500,'Gagal mengambil data customer'); }
};
exports.get = async (req,res) => {
  try { const [rows]=await pool.query(`${selectCustomer} WHERE id=?`,[req.params.id]); if(!rows.length)return error(res,404,'Customer tidak ditemukan'); ok(res,rows[0]); }
  catch(e){ console.error('customers.get:',e); error(res,500,'Gagal mengambil customer'); }
};
exports.upsert = async (req,res) => {
  try {
    const {name,email,phone,address,ktp_number,birth_date,purpose,notes}=req.body||{};
    if(!name||!phone)return error(res,400,'name dan phone wajib diisi');
    let rows=[];
    if(email){ [rows]=await pool.query('SELECT id FROM customers WHERE email=? LIMIT 1',[String(email).trim().toLowerCase()]); }
    if(!rows.length){ [rows]=await pool.query('SELECT id FROM customers WHERE phone=? LIMIT 1',[String(phone).trim()]); }
    let id;
    if(rows.length){
      id=rows[0].id;
      await pool.query(`UPDATE customers SET name=?,email=?,phone=?,address=?,ktp_number=?,birth_date=?,purpose=?,notes=? WHERE id=?`,
        [name,String(email||'').trim().toLowerCase()||null,phone,address||null,ktp_number||null,birth_date||null,purpose||null,notes||null,id]);
    } else {
      const [r]=await pool.query(`INSERT INTO customers(name,email,phone,address,ktp_number,birth_date,purpose,notes) VALUES(?,?,?,?,?,?,?,?)`,
        [name,String(email||'').trim().toLowerCase()||null,phone,address||null,ktp_number||null,birth_date||null,purpose||null,notes||null]);
      id=r.insertId;
    }
    [rows]=await pool.query(`${selectCustomer} WHERE id=?`,[id]); ok(res,rows[0],'Data customer tersimpan');
  } catch(e){ console.error('customers.upsert:',e); error(res,500,'Gagal menyimpan customer'); }
};
exports.create = exports.upsert;

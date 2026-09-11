const { pool } = require('../config/db');
const { ok, created, error } = require('../utils/response');
exports.list=async(req,res)=>{const [r]=await pool.query('SELECT * FROM customers ORDER BY id DESC');ok(res,r);};
exports.get=async(req,res)=>{const [r]=await pool.query('SELECT * FROM customers WHERE id=?',[req.params.id]);if(!r.length)return error(res,404,'Customer tidak ditemukan');ok(res,r[0]);};
exports.create=async(req,res)=>{const {name,email,phone,address}=req.body;if(!name||!phone)return error(res,400,'name dan phone wajib diisi');const [x]=await pool.query('INSERT INTO customers(name,email,phone,address) VALUES(?,?,?,?)',[name,email||null,phone,address||null]);const [r]=await pool.query('SELECT * FROM customers WHERE id=?',[x.insertId]);created(res,r[0]);};

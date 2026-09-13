
const { pool } = require('../config/db');
const { ok, created, error } = require('../utils/response');

const SELECT = `SELECT b.*,v.name vehicle_name,c.name customer_name,c.phone customer_phone,d.name driver_name
 FROM bookings b LEFT JOIN vehicles v ON v.id=b.vehicle_id LEFT JOIN customers c ON c.id=b.customer_id
 LEFT JOIN drivers d ON d.id=b.driver_id`;

function normalizePayment(s){ return ({Paid:'PAID',Unpaid:'UNPAID',Partial:'PENDING',Refunded:'REFUNDED'}[s] || String(s||'UNPAID').toUpperCase()); }
function format(row){
  return {...row, id:row.booking_code, cust:row.customer_name||'—', veh:row.vehicle_id, driver:row.driver_id,
    pay:{m:row.payment_method||'Manual / Kantor',s:normalizePayment(row.payment_status),tx:row.transaction_id||'—',at:row.paid_at||null},
    sub:Number(row.subtotal ?? row.total_amount ?? 0), drv:Number(row.driver_amount||0), disc:Number(row.discount_amount||0), total:Number(row.total_amount||0),
    pickup:row.pickup_location||'', drop:row.dropoff_location||'', user:row.user_email||null};
}
exports.list=async(req,res)=>{try{const [r]=await pool.query(`${SELECT} ORDER BY b.id DESC`);ok(res,r.map(format));}catch(e){console.error(e);error(res,500,'Gagal mengambil booking');}};
exports.get=async(req,res)=>{try{const [r]=await pool.query(`${SELECT} WHERE b.id=? OR b.booking_code=? LIMIT 1`,[req.params.id,req.params.id]);if(!r.length)return error(res,404,'Booking tidak ditemukan');ok(res,format(r[0]));}catch(e){error(res,500,'Gagal mengambil booking');}};
exports.track=async(req,res)=>{try{const [r]=await pool.query(`${SELECT} WHERE b.booking_code=? LIMIT 1`,[req.params.code]);if(!r.length)return error(res,404,'Booking tidak ditemukan');const b=format(r[0]);ok(res,{id:b.id,vehicle_name:r[0].vehicle_name,start_date:b.start_date,end_date:b.end_date,status:b.status,payment_status:b.payment_status,total_amount:b.total_amount});}catch(e){error(res,500,'Gagal melacak booking');}};
exports.create=async(req,res)=>{try{
 const x=req.body||{}; if(!x.vehicle_id||!x.start_date||!x.end_date)return error(res,400,'vehicle_id, start_date dan end_date wajib diisi');
 const [conflicts]=await pool.query(`SELECT id FROM bookings WHERE vehicle_id=? AND status IN ('Pending','Confirmed','Ongoing') AND start_date < ? AND end_date > ? LIMIT 1`,[x.vehicle_id,x.end_date,x.start_date]);
 if(conflicts.length)return error(res,409,'Mobil sudah memiliki booking pada rentang tanggal tersebut');
 const code=x.booking_code||`AZZ-${Date.now()}`;
 const [r]=await pool.query(`INSERT INTO bookings(booking_code,vehicle_id,customer_id,driver_id,start_date,end_date,rental_type,pickup_location,dropoff_location,subtotal,driver_amount,discount_amount,total_amount,status,payment_status,payment_method,transaction_id,user_email,notes)
 VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
 [code,x.vehicle_id,x.customer_id||null,x.driver_id||null,x.start_date,x.end_date,x.rental_type||'Lepas Kunci',x.pickup_location||null,x.dropoff_location||null,
  Number(x.subtotal||x.total_amount||0),Number(x.driver_amount||0),Number(x.discount_amount||0),Number(x.total_amount||0),x.status||'Pending',x.payment_status||'Unpaid',x.payment_method||null,x.transaction_id||null,x.user_email||null,x.notes||null]);
 const [rows]=await pool.query(`${SELECT} WHERE b.id=?`,[r.insertId]);created(res,format(rows[0]),'Booking berhasil dibuat');
}catch(e){console.error('bookings.create:',e);error(res,500,'Gagal membuat booking');}};
exports.update=async(req,res)=>{try{
 const allowed=['start_date','end_date','rental_type','pickup_location','dropoff_location','total_amount','subtotal','driver_amount','discount_amount','status','payment_status','driver_id','payment_method','transaction_id','paid_at','notes'];
 const f=allowed.filter(k=>req.body[k]!==undefined); if(!f.length)return error(res,400,'Tidak ada data untuk diperbarui');
 const [x]=await pool.query(`UPDATE bookings SET ${f.map(k=>`${k}=?`).join(',')} WHERE id=? OR booking_code=?`,[...f.map(k=>req.body[k]),req.params.id,req.params.id]);
 if(!x.affectedRows)return error(res,404,'Booking tidak ditemukan'); const [r]=await pool.query(`${SELECT} WHERE b.id=? OR b.booking_code=? LIMIT 1`,[req.params.id,req.params.id]);ok(res,format(r[0]),'Booking diperbarui');
}catch(e){console.error(e);error(res,500,'Gagal memperbarui booking');}};
exports.remove=async(req,res)=>{try{const [x]=await pool.query('DELETE FROM bookings WHERE id=? OR booking_code=?',[req.params.id,req.params.id]);if(!x.affectedRows)return error(res,404,'Booking tidak ditemukan');ok(res,null,'Booking dihapus');}catch(e){error(res,500,'Gagal menghapus booking');}};

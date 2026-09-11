const { pool } = require('../config/db');
const { ok, created, error } = require('../utils/response');

/*
  FRONTEND STATUS → DATABASE STATUS
  available   → Available
  rented      → Booked
  maintenance → Maintenance
  inactive    → Inactive
*/
function normalizeStatus(status) {
  if (!status) return 'Available';

  const map = {
    available: 'Available',
    rented: 'Booked',
    maintenance: 'Maintenance',
    inactive: 'Inactive',

    Available: 'Available',
    Booked: 'Booked',
    Maintenance: 'Maintenance',
    Inactive: 'Inactive'
  };

  return map[status] || 'Available';
}

/*
  DATABASE STATUS → FRONTEND STATUS
*/
function frontendStatus(status) {
  const map = {
    Available: 'available',
    Booked: 'rented',
    Maintenance: 'maintenance',
    Inactive: 'inactive'
  };

  return map[status] || 'available';
}

/*
  Ubah data database menjadi format yang mudah dipakai frontend.
*/
function formatVehicle(row) {
  if (!row) return null;

  let feats = [];

  if (row.features) {
    try {
      feats = JSON.parse(row.features);
    } catch (e) {
      feats = row.features
        .split(',')
        .map(x => x.trim())
        .filter(Boolean);
    }
  }

  return {
    // ID
    id: row.id,

    // Data kendaraan
    name: row.name,
    brand: row.brand,
    model: row.model,
    type: row.type,
    cat: row.type,
    year: row.year,
    plate: row.plate,

    // Spesifikasi
    trans: row.transmission,
    transmission: row.transmission,
    seats: row.seats,
    fuel: row.fuel,
    color: row.color,
    doors: row.doors,
    bag: row.bag,

    // Harga
    priceLK: Number(row.price_lk),
    priceDrv: row.price_driver != null
      ? Number(row.price_driver)
      : null,

    // Foto
    img: row.image,
    image: row.image,

    // Fitur & deskripsi
    feats: feats,
    features: feats,
    desc: row.description,
    description: row.description,

    // Status
    status: frontendStatus(row.status),

    // Tetap sertakan field database
    price_lk: row.price_lk,
    price_driver: row.price_driver,

    created_at: row.created_at,
    updated_at: row.updated_at
  };
}


/* ============================================================
   GET ALL VEHICLES
   GET /api/vehicles
   ============================================================ */
exports.list = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM vehicles ORDER BY id DESC'
    );

    ok(res, rows.map(formatVehicle));
  } catch (err) {
    console.error('vehicle.list:', err);
    error(res, 500, 'Gagal mengambil data mobil');
  }
};


/* ============================================================
   GET VEHICLE BY ID
   GET /api/vehicles/:id
   ============================================================ */
exports.get = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM vehicles WHERE id=?',
      [req.params.id]
    );

    if (!rows.length) {
      return error(res, 404, 'Mobil tidak ditemukan');
    }

    ok(res, formatVehicle(rows[0]));
  } catch (err) {
    console.error('vehicle.get:', err);
    error(res, 500, 'Gagal mengambil data mobil');
  }
};


/* ============================================================
   CREATE VEHICLE
   POST /api/vehicles
   ============================================================ */
exports.create = async (req, res) => {
  try {
    /*
      Mendukung nama field frontend maupun backend.
    */

    const name = req.body.name;
    const brand = req.body.brand ?? null;
    const model = req.body.model ?? null;

    // Frontend menggunakan "cat"
    // Database menggunakan "type"
    const type = req.body.type ?? req.body.cat ?? null;

    const year = req.body.year ?? null;
    const plate = req.body.plate ?? null;

    // Frontend menggunakan "trans"
    // Database menggunakan "transmission"
    const transmission =
      req.body.transmission ??
      req.body.trans ??
      null;

    const seats = req.body.seats ?? null;
    const fuel = req.body.fuel ?? null;
    const color = req.body.color ?? null;
    const doors = req.body.doors ?? null;
    const bag = req.body.bag ?? null;

    // Frontend menggunakan priceLK / priceDrv
    // Database menggunakan price_lk / price_driver
    const price_lk =
      req.body.price_lk ??
      req.body.priceLK;

    const price_driver =
      req.body.price_driver ??
      req.body.priceDrv ??
      null;

    // Frontend menggunakan img
    // Database menggunakan image
    const image =
      req.body.image ??
      req.body.img ??
      null;

    const features =
      req.body.features ??
      req.body.feats ??
      null;

    const description =
      req.body.description ??
      req.body.desc ??
      null;

    const status = normalizeStatus(req.body.status);


    if (!name || price_lk == null) {
      return error(
        res,
        400,
        'name dan price_lk wajib diisi'
      );
    }


    /*
      Simpan features sebagai JSON.
    */
    let featuresValue = null;

    if (Array.isArray(features)) {
      featuresValue = JSON.stringify(features);
    } else if (features) {
      featuresValue = String(features);
    }


    const [result] = await pool.query(
      `
      INSERT INTO vehicles
      (
        name,
        brand,
        model,
        type,
        year,
        plate,
        transmission,
        seats,
        fuel,
        color,
        doors,
        bag,
        price_lk,
        price_driver,
        image,
        features,
        description,
        status
      )
      VALUES
      (
        ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
      )
      `,
      [
        name,
        brand,
        model,
        type,
        year,
        plate,
        transmission,
        seats,
        fuel,
        color,
        doors,
        bag,
        price_lk,
        price_driver,
        image,
        featuresValue,
        description,
        status
      ]
    );


    const [rows] = await pool.query(
      'SELECT * FROM vehicles WHERE id=?',
      [result.insertId]
    );

    created(res, formatVehicle(rows[0]));

  } catch (err) {
    console.error('vehicle.create:', err);
    error(res, 500, 'Gagal menambahkan mobil');
  }
};


/* ============================================================
   UPDATE VEHICLE
   PUT /api/vehicles/:id
   ============================================================ */
exports.update = async (req, res) => {
  try {

    const fieldMap = {
      name: 'name',
      brand: 'brand',
      model: 'model',

      type: 'type',
      cat: 'type',

      year: 'year',
      plate: 'plate',

      transmission: 'transmission',
      trans: 'transmission',

      seats: 'seats',
      fuel: 'fuel',
      color: 'color',
      doors: 'doors',
      bag: 'bag',

      price_lk: 'price_lk',
      priceLK: 'price_lk',

      price_driver: 'price_driver',
      priceDrv: 'price_driver',

      image: 'image',
      img: 'image',

      features: 'features',
      feats: 'features',

      description: 'description',
      desc: 'description',

      status: 'status'
    };


    const updates = [];
    const values = [];


    for (const frontendField in fieldMap) {

      if (req.body[frontendField] === undefined) {
        continue;
      }

      const dbField = fieldMap[frontendField];

      /*
        Hindari memasukkan field yang sama dua kali.
      */
      if (updates.includes(dbField)) {
        continue;
      }


      let value = req.body[frontendField];


      /*
        Status frontend → database
      */
      if (dbField === 'status') {
        value = normalizeStatus(value);
      }


      /*
        features array → JSON
      */
      if (dbField === 'features' && Array.isArray(value)) {
        value = JSON.stringify(value);
      }


      updates.push(`${dbField}=?`);
      values.push(value);
    }


    if (!updates.length) {
      return error(
        res,
        400,
        'Tidak ada data untuk diperbarui'
      );
    }


    values.push(req.params.id);


    const sql = `
      UPDATE vehicles
      SET ${updates.join(', ')}
      WHERE id=?
    `;


    const [result] = await pool.query(
      sql,
      values
    );


    if (!result.affectedRows) {
      return error(
        res,
        404,
        'Mobil tidak ditemukan'
      );
    }


    const [rows] = await pool.query(
      'SELECT * FROM vehicles WHERE id=?',
      [req.params.id]
    );


    ok(
      res,
      formatVehicle(rows[0])
    );

  } catch (err) {
    console.error('vehicle.update:', err);
    error(res, 500, 'Gagal memperbarui mobil');
  }
};


/* ============================================================
   DELETE VEHICLE
   DELETE /api/vehicles/:id
   ============================================================ */
exports.remove = async (req, res) => {
  try {

    const [result] = await pool.query(
      'DELETE FROM vehicles WHERE id=?',
      [req.params.id]
    );


    if (!result.affectedRows) {
      return error(
        res,
        404,
        'Mobil tidak ditemukan'
      );
    }


    ok(
      res,
      null,
      'Mobil dihapus'
    );

  } catch (err) {
    console.error('vehicle.remove:', err);
    error(res, 500, 'Gagal menghapus mobil');
  }
};
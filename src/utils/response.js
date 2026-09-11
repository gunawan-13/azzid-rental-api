exports.ok = (res, data, message = 'OK') => res.json({ success: true, message, data });
exports.created = (res, data, message = 'Data berhasil dibuat') => res.status(201).json({ success: true, message, data });
exports.error = (res, status, message, details = undefined) => res.status(status).json({ success: false, message, ...(details ? { details } : {}) });

const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, "numbers.json");
const API_KEY = "dbdanzxd"; // API Key untuk keamanan
const NOT_FOUND_PAGE = path.join(__dirname, "404z.html"); // Path halaman 404

app.use(express.json());

// Middleware untuk validasi API Key
const validateApiKey = (req, res, next) => {
    if (req.query.apikey !== API_KEY) {
        return res.status(403).json({ 
            status: 403, 
            error: "API Key tidak valid", 
            creator: "zakkiXD-Developer" 
        });
    }
    next();
};

// Fungsi untuk membaca database
const readDatabase = () => {
    if (!fs.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATA_FILE));
};

// Fungsi untuk menulis database
const writeDatabase = (data) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// Endpoint untuk menambahkan nomor
app.get("/add", validateApiKey, (req, res) => {
    const { nomor, nama, hari } = req.query;
    if (!nomor || !nama || !hari) {
        return res.status(400).json({
            status: 400,
            error: "Nomor, nama, dan hari wajib diisi",
            creator: "zakkiXD-Developer"
        });
    }

    let db = readDatabase();

    // Gunakan nomor apa adanya tanpa formatting
    const plainNomor = nomor;

    // Cek apakah nomor sudah ada
    if (db.some(entry => entry.nomor === plainNomor)) {
        return res.status(400).json({
            status: 400,
            error: "Nomor sudah terdaftar",
            creator: "zakkiXD-Developer"
        });
    }

    const expiredAt = Date.now() + parseInt(hari) * 24 * 60 * 60 * 1000;

    db.push({ nomor: plainNomor, nama, expiredAt });
    writeDatabase(db);

    res.status(201).json({
        status: 201,
        success: true,
        message: "Akses Premium berhasil ditambahkan",
        nomor: plainNomor,
        nama,
        expiredAt,
        creator: "zakkiXD-Developer"
    });
});

// Endpoint untuk menghapus nomor
app.get("/delete", validateApiKey, (req, res) => {
    const { nomor } = req.query;
    if (!nomor) {
        return res.status(400).json({ 
            status: 400, 
            error: "Nomor wajib diisi", 
            creator: "zakkiXD-Developer" 
        });
    }

    let db = readDatabase();

    // Tidak gunakan formatNomor, langsung pakai input
    const plainNomor = nomor;
    const newDb = db.filter(entry => entry.nomor !== plainNomor);

    if (db.length === newDb.length) {
        return res.status(404).json({ 
            status: 404, 
            error: "Nomor tidak ditemukan", 
            creator: "zakkiXD-Developer" 
        });
    }

    writeDatabase(newDb);
    res.json({ 
        status: 200, 
        success: true, 
        message: "Nomor berhasil dihapus", 
        nomor: plainNomor,
        creator: "zakkiXD-Developer" 
    });
});

// Endpoint untuk melihat daftar nomor
app.get("/list", (req, res) => {
    const db = readDatabase();
    res.json({ 
        status: 200, 
        success: true, 
        data: db, 
        creator: "zakkiXD-Developer" 
    });
});

// Fungsi untuk menghapus nomor yang expired
const autoDeleteExpired = () => {
    let db = readDatabase();
    const now = Date.now();
    const newDb = db.filter(entry => entry.expiredAt > now);

    if (newDb.length !== db.length) {
        writeDatabase(newDb);
        console.log("Nomor expired dihapus otomatis.");
    }
};

// Jalankan auto-check setiap 1 jam
setInterval(autoDeleteExpired, 60 * 60 * 1000);

// Middleware untuk menangani halaman 404
app.use((req, res) => {
    if (fs.existsSync(NOT_FOUND_PAGE)) {
        res.status(404).sendFile(NOT_FOUND_PAGE);
    } else {
        res.status(404).json({ 
            status: 404, 
            error: "Halaman tidak ditemukan", 
            creator: "zakkiXD-Developer" 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});
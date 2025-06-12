const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require("multer");
const fs = require('fs');
const path = require("path");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads')
    },
    filename: function (req, file, cb) {
        const uniqueString = Date.now() + '-' + Math.round(Math.random() * 1E9)
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueString + ext)
    }
})

const upload = multer({ storage: storage })

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());


const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Could not open database', err);
    } else {
        console.log('Connected to SQLite database');
    }
});



// app.get('/blog', (req, res) => {
//     const load = parseInt(req.query.load) || 10;
//     const skip = parseInt(req.query.skip) || 0

//     const paginatedPosts = postData.slice(skip, skip + load);

//     res.send(paginatedPosts);
// })

app.get('/blog', (req, res) => {
    const load = parseInt(req.query.load) || 10;
    const skip = parseInt(req.query.skip) || 0
    // const paginatedPosts = postData.slice(skip, skip + load);

    const sql = 'SELECT * FROM posts ORDER BY id DESC LIMIT ? OFFSET ?';
    db.all(sql, [load, skip], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    })
})

// app.post('/post', (req, res) => {
//     const { title, text, img_url } = req.body;
//     const sql = 'INSERT INTO posts (title, text, img_url) VALUES (?, ?, ?)';
//     db.run(sql, [title, text, img_url], (err) => {
//         if (err) {
//             res.status(500).json({ error: err.message });
//             return;
//         }
//         res.json({ message: "Post added", title });


//     })
// })

// app.post("/upload", upload.single("file"), (req, res) => {
//     console.log("File received:", req.file);
//     console.log(req.file.path);
//     res.json({ message: "Upload successful", file: req.file });
// });

app.post('/post', upload.single("file"), (req, res) => {
    // const title = req.file.title;
    // const text = req.file.text;
    const { title, text } = req.body;
    const filePath = req.file.path;
    console.log(title, text);

    const sql = 'INSERT INTO posts (title, text, img_url) VALUES (?, ?, ?)';
    db.run(sql, [title, text, filePath], (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: "Post added", title });


    })
})

app.delete('/delete', (req, res) => {
    const id = parseInt(req.query.id) || -1;

    const sql = 'SELECT img_url FROM posts where id=?';
    db.get(sql, [id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        const img_url = row.img_url;
        fs.unlink(img_url, function (err) {
            if (err) throw err;
            console.log('File deleted!');
        });

    })


    const query = 'DELETE FROM posts where id=?';
    db.run(query, [id], (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: `post ${id} deleted` });
    })
})

app.listen(3000, () => {
    console.log('app is running on http://localhost:3000');
});

const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();


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

    const sql = 'SELECT * FROM posts LIMIT ? OFFSET ?';
    db.all(sql, [load, skip], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    })
})

app.post('/post', (req, res) => {
    const { title, text, img_url } = req.body;


    const sql = 'INSERT INTO posts (title, text, img_url) VALUES (?, ?, ?)';
    db.run(sql, [title, text, img_url], (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: "Post added", title });


    })
})

app.listen(3000, () => {
    console.log('app is running on http://localhost:3000');
});

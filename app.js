const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require("multer");
const fs = require('fs');
const path = require("path");
const { S3Client, ListObjectsV2Command, PutObjectCommand } = require("@aws-sdk/client-s3");


const REGION = "eu-west-2"; // e.g. "us-east-1"
const BUCKET_NAME = "muaythai-site-uploads";

const s3 = new S3Client({ region: REGION });

async function listBucketObjects() {
    try {
        const command = new ListObjectsV2Command({ Bucket: BUCKET_NAME });
        const response = await s3.send(command);
        console.log("Objects in bucket:", response.Contents);
    } catch (err) {
        console.error("Error listing objects:", err);
    }
}

// listBucketObjects();



const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads')
    },
    filename: function (req, file, cb) {
        const uniqueString = Date.now() + '-' + Math.round(Math.random() * 1E9)
        const ext = path.extname(file.originalname);
        // cb(null, file.fieldname + '-' + uniqueString + ext)
        cb(null, file.originalname)
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

// app.post('/post', upload.single("file"), (req, res) => {
//     const { title, text } = req.body;
//     const filePath = req.file.path;
//     console.log(title, text);

//     const sql = 'INSERT INTO posts (title, text, img_url) VALUES (?, ?, ?)';
//     db.run(sql, [title, text, filePath], (err) => {
//         if (err) {
//             res.status(500).json({ error: err.message });
//             return;
//         }
//         res.json({ message: "Post added", title });
//     })
// })

app.post('/post', upload.single("file"), (req, res) => {
    const { title, text } = req.body;
    const file = req.file.path;
    const fileName = req.file.filename;
    // const filePath = req.file.path;
    const img_url = `https://muaythai-site-uploads.s3.eu-west-2.amazonaws.com/${fileName}`;
    uploadFile(file, fileName);
    console.log(title, text, img_url);
    // console.log();

    const sql = 'INSERT INTO posts (title, text, img_url) VALUES (?, ?, ?)';
    db.run(sql, [title, text, img_url], (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: "Post added", title });
    })
})

app.post('/postrandom', (req, res) => {
    const { title, text, img_url } = req.body;
    console.log(title, text);
    const sql = 'INSERT INTO posts (title, text, img_url) VALUES (?, ?, ?)';
    db.run(sql, [title, text, img_url], (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: "Post added", title });
    })
})

app.delete('/delete', (req, res) => {
    const id = parseInt(req.query.id) || -1;

    //first retrieve and delete the actual image
    //need to add validation to check wether the image at the specified url exists
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

    //use id to delete the whole row with that id
    const query = 'DELETE FROM posts where id=?';
    db.run(query, [id], (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: `post ${id} deleted` });
    })
})




async function uploadFile(filePath, key) {
    const fileStream = fs.createReadStream(filePath);

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileStream,
        ContentType: "image/jpeg", // adjust as needed
    });

    try {
        const response = await s3.send(command);
        console.log("Upload successful:", response);
        console.log(`URL: https://${BUCKET_NAME}.s3.${s3.config.region}.amazonaws.com/${key}`);
    } catch (err) {
        console.error("Upload error:", err);
    }
}

// Example usage:
// uploadFile("./uploads/crow.jpg", "crow.jpg");


app.listen(3000, () => {
    console.log('app is running on http://localhost:3000');
});

const express = require('express');
const cors = require('cors');
const postData = require('./post.json');


const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());



app.get('/blog', (req, res) => {
    const load = parseInt(req.query.load) || 10;
    const skip = parseInt(req.query.skip) || 0

    const paginatedPosts = postData.slice(skip, skip + load);

    res.send(paginatedPosts);
})

app.listen(3000, () => {
    console.log('app is running on http://localhost:3000');
});

const mainBody = document.getElementById('main-body');
let skip = 0;
const load = 10;  // load 10 posts at a time
const loadMoreBtn = document.getElementById('load-more');
const addPostBtn = document.getElementById('post');
const createPostButton = document.getElementById('createPostButton');
const createPostForm = document.getElementById('createPostForm');
const activateBtn = document.getElementById('activate');
let loading = false;

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !loading) {
            // When last post comes into view, load more posts
            loadPosts();
        }
    });
}, {
    rootMargin: '100px',  // start loading a bit before the element fully appears
});



function displayBlogFronend() {
    fetch('./post.json')
        .then(res => res.json())
        .then(data => {
            data.forEach(post => {
                mainBody.insertAdjacentHTML('beforeend',
                    `<div> 
                <h2>${post.title}</h2>
                <img src="${post.img}" alt="${post.title}">
                <p>${post.text}</p>
                </div>`);
            });
        });
}

// DisplayBlog();


// function loadPosts() {
//     fetch(`http://localhost:3000/blog`)
//         .then(res => res.json())
//         .then(data => {
//             console.log(data);
//             data.forEach(post => {
//                 const div = document.createElement('div');
//                 div.className = "post";

//                 const title = document.createElement('h2');
//                 title.textContent = post.title;

//                 const img = document.createElement('img');
//                 img.src = post.img_url;
//                 img.alt = post.title;

//                 const text = document.createElement('p');
//                 text.textContent = post.text;

//                 div.appendChild(title);
//                 div.appendChild(img);
//                 div.appendChild(text);

//                 mainBody.appendChild(div);
//             });
//         })
//         .catch(err => {
//             console.log('error fetching posts', err);
//         })
// }

function loadPosts() {
    if (loading) return;
    loading = true;

    fetch(`http://127.0.0.1:3000/blog?load=${load}&skip=${skip}`, {
        method: "GET"
    })
        .then(res => res.json())
        .then(data => {
            if (data.length === 0) {
                // No more posts

                observer.disconnect();

                if (loadMoreBtn) {
                    loadMoreBtn.disabled = true;
                    loadMoreBtn.textContent = "No more posts";
                }
                loading = false;
                return;
            }

            data.forEach(post => {
                const div = document.createElement('div');
                div.className = "post";
                div.id = `post-${post.id}`

                const title = document.createElement('h2');
                title.textContent = post.title;

                const img = document.createElement('img');
                img.src = post.img_url;
                img.alt = post.title;

                const text = document.createElement('p');
                text.textContent = post.text;

                const deletePostButton = document.createElement('button');
                deletePostButton.textContent = "X";

                div.appendChild(title);
                div.appendChild(img);
                div.appendChild(text);
                div.appendChild(deletePostButton);

                mainBody.appendChild(div);
                deletePostButton.addEventListener('click', () => {
                    // console.log(div.id);
                    deletePost(post.id);

                })
            });

            skip += load;

            observer.disconnect();
            // Observe the new last post
            const posts = document.querySelectorAll('.post');
            const lastPost = posts[posts.length - 1];
            if (lastPost) {
                observer.observe(lastPost);
            }

            loading = false;
        })
        .catch(err => {
            console.error('Failed to fetch blog data:', err);
        });
};

function addPost() {
    let title = document.getElementById('createPostTitleInput').value;
    let text = document.getElementById('createPostTextInput').value;
    const randomInt = Math.floor(Math.random() * (210 - 190 + 1)) + 190;
    let img_url = `https://picsum.photos/${randomInt}`;

    fetch(`http://localhost:3000/post`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title,
            text,
            img_url
        })
    })
        .then(res => res.json())
        .then(data => {
            console.log(data);
        })
};

// Load initial posts
loadPosts();

// Button to load more posts
loadMoreBtn.addEventListener('click', () => {
    loadPosts();
})



addPostBtn.addEventListener('click', () => {
    addPost();
})


createPostForm.addEventListener('submit', function (event) {
    event.preventDefault();
    let title = document.getElementById('createPostTitleInput').value;
    let text = document.getElementById('createPostTextInput').value;
    console.log(title, text);
    addPost();
})

document.getElementById('uploadImgForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const fileInput = document.getElementById('uploadImg');
    const file = fileInput.files[0];

    const formData = new FormData();
    formData.append("file", file);


    const response = await fetch("http://localhost:3000/upload", {
        method: "POST",
        body: formData,
    });

    const result = await response.json();
    console.log("Upload result:", result);

})


// const postsDivs = document.querySelectorAll('[id^="post-"]');
// const postOne = document.getElementById("post-1");
// console.log(postOne.id);

function deletePost(id) {
    console.log('post-' + id);

    fetch(`http://localhost:3000/delete?id=${id}`, {
        method: "DELETE"
    })
        .then(res => {
            if (!res.ok) {
                throw new Error('network response not ok');
            }
            return response.json;
        })
        .then(data => {
            console.log('delete successful:', data);
        })
        .catch(error => {
            console.error('delete failed:', error);
        })
}



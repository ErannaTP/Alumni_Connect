const API_BASE = "http://localhost:4000/api";

const feedContainer = document.getElementById("postFeed");
const loadingEl = document.getElementById("loading");

let skip = 0;
const take = 10;
let isLoading = false;

let currentHashtag = null;
let currentDomain = null;
let searchText = "";

let notifications = [];

// -----------------------
// RENDER POST
// -----------------------
function renderPost(post) {
  const div = document.createElement("div");
  div.className =
    "post-card bg-white p-6 rounded-lg shadow-md border border-gray-300";

  const userName = post.user?.name || "Unknown User";
  const initial = userName.charAt(0).toUpperCase();

  const domain = post.domain || "General";
  const badgeClass =
    domain === "New Hiring Opportunity"
      ? "hiring"
      : domain === "General" || domain === "Success Story"
      ? "general"
      : "domain";

  const hashtagsHtml = (post.hashtags || [])
    .map(t => `<span class="hashtag" onclick="searchByHashtag('#${t}')">#${t}</span>`)
    .join("");

  const createdAt = new Date(post.createdAt).toLocaleString();

  let imageHtml = "";
  if (post.imageUrls?.length > 0) {
    imageHtml = `
      <img src="${post.imageUrls[0]}" 
           class="w-40 h-40 object-cover rounded-lg mb-4 border border-gray-300" 
           alt="Post Image" />
    `;
  }

  div.innerHTML = `
    <div class="flex items-center gap-4 mb-4">
      <div class="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-900 font-medium">
        ${initial}
      </div>
      <div>
        <div class="font-semibold text-gray-800">
          ${userName}
          <span class="user-badge ml-2">Alumni</span>
        </div>
        <div class="text-sm text-gray-500">
          <span class="domain-tag ${badgeClass}">${domain}</span>
          • ${createdAt}
          ${hashtagsHtml ? `<span class="ml-2 inline-flex gap-1">${hashtagsHtml}</span>` : ""}
        </div>
      </div>
    </div>

    <p class="text-gray-700 mb-2 font-medium">${post.title || "Untitled Post"}</p>

    <p class="text-gray-600 mb-4">${convertHashtags(post.content || "")}</p>

    ${imageHtml}

    <div class="flex gap-4 mb-4">
      <button class="flex items-center gap-1 text-gray-600 hover:text-red-500"
              onclick="toggleLike('${post.id}', this)">
        ❤️ Appreciate (<span id="${post.id}-likes">${post.likesCount}</span>)
      </button>

      <button class="flex items-center gap-1 text-gray-600 hover:text-indigo-500"
              onclick="openComments('${post.id}')">
        💬 Answer (<span id="${post.id}-comments">${post.commentsCount}</span>)
      </button>
    </div>

    <div id="comments-${post.id}" 
         class="hidden mt-3 pt-3 border-t border-gray-200 bg-gray-50 rounded-md">
      <div id="comments-list-${post.id}" class="mb-3"></div>

      <textarea id="comment-input-${post.id}"
                class="w-full p-2 border border-gray-300 rounded-lg mb-2"
                placeholder="Type your answer..." rows="2"></textarea>

      <button class="button-primary" onclick="submitComment('${post.id}')">
        Submit Answer
      </button>
    </div>
  `;

  feedContainer.appendChild(div);
}

// -----------------------
// LOAD FEED
// -----------------------
async function loadFeed() {
  if (isLoading) return;
  isLoading = true;
  loadingEl.style.display = "block";

  try {
    let url = `${API_BASE}/posts?skip=${skip}&take=${take}`;

    if (currentDomain) url += `&domain=${encodeURIComponent(currentDomain)}`;
    if (currentHashtag) url += `&hashtag=${encodeURIComponent(currentHashtag)}`;

    const res = await fetch(url);
    const posts = await res.json();

    posts.forEach(renderPost);

    skip += posts.length;

    if (posts.length < take) loadingEl.textContent = "No more posts.";
  } catch (err) {
    console.error(err);
    loadingEl.textContent = "Failed to load posts.";
  }

  isLoading = false;
  loadingEl.style.display = "none";
}

loadFeed();

window.addEventListener("scroll", () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
    loadFeed();
  }
});

// -----------------------
// LIKE
// -----------------------
async function toggleLike(postId, btnEl) {
  try {
    const res = await fetch(`${API_BASE}/posts/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId })
    });

    const data = await res.json();

    document.getElementById(`${postId}-likes`).textContent = data.likesCount;
    btnEl.style.color = data.liked ? "#dc2626" : "#4b5563";

  } catch (err) {
    console.error(err);
  }
}

// -----------------------
// CREATE POST
// -----------------------
async function uploadPost() {
  const title = document.getElementById("postTitle").value;
  const content = document.getElementById("postContent").value;
  const rawTags = document.getElementById("postHashtags").value;
  const domain = document.getElementById("postDomain").value;
  const imageInput = document.getElementById("postImage");

  if (!content) return alert("Content required");
  if (!domain) return alert("Select a domain");

  let hashtags = [];
  if (rawTags.trim()) {
    hashtags = rawTags
      .split(/[,\s]+/)
      .map(t => t.replace("#", "").trim())
      .filter(Boolean);
  }

  let imageUrls = [];
  if (imageInput.files.length > 0) {
    const form = new FormData();
    form.append("image", imageInput.files[0]);

    const res = await fetch(`${API_BASE}/posts/upload-image`, {
      method: "POST",
      body: form
    });

    const data = await res.json();
    imageUrls.push(data.url);
  }

  const res = await fetch(`${API_BASE}/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      content,
      domain,
      hashtags,
      imageUrls
    })
  });

  if (!res.ok) return alert("Failed to post");

  // Reset
  document.getElementById("postTitle").value = "";
  document.getElementById("postContent").value = "";
  document.getElementById("postHashtags").value = "";
  document.getElementById("postDomain").value = "";
  document.getElementById("postImage").value = "";

  // Reload
  feedContainer.innerHTML = "";
  skip = 0;
  loadFeed();
}

// -----------------------
// COMMENTS
// -----------------------
async function openComments(postId) {
  const box = document.getElementById(`comments-${postId}`);
  box.classList.toggle("hidden");

  if (box.classList.contains("hidden")) return;

  const res = await fetch(`${API_BASE}/posts/comments?postId=${postId}`);
  const comments = await res.json();

  const div = document.getElementById(`comments-list-${postId}`);
  div.innerHTML = "";

  comments.forEach(c => {
    div.innerHTML += `
      <div class="mb-2 p-2 bg-white border rounded">
        <div class="font-semibold">${c.user.name}</div>
        <p>${c.text}</p>
        <p class="text-xs text-gray-500">${new Date(c.createdAt).toLocaleString()}</p>
      </div>
    `;
  });
}

async function submitComment(postId) {
  const input = document.getElementById(`comment-input-${postId}`);
  const text = input.value.trim();
  if (!text) return alert("Empty comment");

  const res = await fetch(`${API_BASE}/posts/comment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ postId, text })
  });

  if (!res.ok) {
    return alert("Failed to add comment");
  }

  // Clear box
  input.value = "";

  // 🔥 Refresh comments list without closing
  openComments(postId);

  // 🔥 Manually increment visible comment count
  const countEl = document.getElementById(`${postId}-comments`);
  countEl.textContent = Number(countEl.textContent) + 1;
}

// -----------------------
// HASHTAGS
// -----------------------
function convertHashtags(text) {
  return text.replace(/#(\w+)/g, (m, t) => {
    return `<span class="hashtag" onclick="searchByHashtag('#${t}')">#${t}</span>`;
  });
}

function searchByHashtag(hash) {
  currentHashtag = hash.replace("#", "");
  feedContainer.innerHTML = "";
  skip = 0;
  loadFeed();
}

function filterPosts() {
  currentDomain = document.getElementById("domainFilter").value;
  feedContainer.innerHTML = "";
  skip = 0;
  loadFeed();
}

function searchPosts() {
  searchText = document.getElementById("searchBar").value.toLowerCase();
  feedContainer.innerHTML = "";
  skip = 0;
  loadFeed();
}

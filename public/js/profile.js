// public/js/profile.js

const API_BASE = "http://localhost:4000/api/user";

document.addEventListener("DOMContentLoaded", () => {
  renderDomainCheckboxes();
  loadProfile();
});

let availableDomains = [
  "Cybersecurity",
  "Data Science",
  "Artificial Intelligence",
  "Software Engineering",
  "Machine Learning",
  "Database Systems",
  "Web Development",
  "Mobile App Development",
  "Cloud Computing",
  "Networking",
  "General",
  "Success Story",
  "New Hiring Opportunity"
];

function renderDomainCheckboxes() {
  const boxContainer = document.getElementById("profile-domains-checkboxes");
  boxContainer.innerHTML = "";

  availableDomains.forEach(d => {
    boxContainer.innerHTML += `
      <label class="domain-checkbox-label">
        <input type="checkbox" name="profile-domains" value="${d}" class="mr-2" disabled />${d}
      </label>
    `;
  });
}

async function loadProfile() {
  try {
    const res = await fetch(`${API_BASE}/profile`);
    const user = await res.json();

    if (!user) throw new Error("User not found");

    // Avatar + display name
    document.getElementById("profile-avatar").textContent =
      (user.name || "U")[0].toUpperCase();

    document.getElementById("profile-name-display").innerHTML =
      `${user.name} <span class="user-badge ml-2">Alumni</span>`;

    // Form fields
    document.getElementById("profile-name").value = user.name || "";
    document.getElementById("profile-bio").value = user.bio || "";
    document.getElementById("profile-company").value = user.company || "";
    document.getElementById("profile-position").value = user.position || "";
    document.getElementById("profile-batch").value = user.batchYear || "";

    // Domain chips
    const domainChips = document.getElementById("profile-domains");
    domainChips.innerHTML = (user.domains || [])
      .map(d => `<span class="domain-tag">${d}</span>`)
      .join("");

    // Check checkboxes
    const boxes = document.querySelectorAll('input[name="profile-domains"]');
    boxes.forEach(box => {
      box.checked = user.domains.includes(box.value);
    });

  } catch (err) {
    console.error(err);
    alert("Error loading profile");
  }
}

function toggleEditProfile() {
  const fields = [
    "profile-name",
    "profile-bio",
    "profile-company",
    "profile-position",
    "profile-batch"
  ];

  fields.forEach(id => {
    document.getElementById(id).disabled = false;
  });

  document.querySelectorAll('input[name="profile-domains"]').forEach(box => {
    box.disabled = false;
  });

  document.getElementById("edit-profile-btn").classList.add("hidden");
  document.getElementById("save-profile-btn").classList.remove("hidden");
}

async function saveProfile() {
  const name = document.getElementById("profile-name").value.trim();
  const bio = document.getElementById("profile-bio").value.trim();
  const company = document.getElementById("profile-company").value.trim();
  const position = document.getElementById("profile-position").value.trim();
  const batchYear = document.getElementById("profile-batch").value.trim();

  const domains = Array.from(
    document.querySelectorAll('input[name="profile-domains"]:checked')
  ).map(b => b.value);

  if (!name || !bio || domains.length === 0) {
    alert("Name, bio & at least one domain are required.");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        bio,
        company,
        position,
        batchYear,
        domains
      })
    });

    if (!res.ok) throw new Error("Save error");
    alert("Profile updated!");
    window.location.href = "/pages/feed.html";

  } catch (err) {
    alert("Failed to save profile");
  }
}

window.toggleEditProfile = toggleEditProfile;
window.saveProfile = saveProfile;

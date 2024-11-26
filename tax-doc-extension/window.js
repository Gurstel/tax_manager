// window.js

const loginForm = document.getElementById("login-form");
const uploadSection = document.getElementById("upload-section");
let accessToken = "";

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("http://localhost:5001/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error("Login failed.");
    }

    const data = await response.json();
    accessToken = data.accessToken;
    chrome.storage.local.set({ accessToken });

    alert("Login successful!");
    loginForm.style.display = "none";
    uploadSection.style.display = "block";

    // Attach event listeners for drag and drop
    setupDragAndDrop();
  } catch (error) {
    console.error("Error logging in:", error);
    alert("Login failed.");
  }
});

function setupDragAndDrop() {
  const dropZone = document.getElementById("drop-zone");

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    const files = e.dataTransfer.files;
    uploadFiles(files);
  });
}

async function uploadFiles(files) {
  chrome.storage.local.get(["accessToken"], async (result) => {
    if (!result.accessToken) {
      alert("Please log in first.");
      return;
    }

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("documents", files[i]);
    }

    try {
      const response = await fetch("http://localhost:5001/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${result.accessToken}`,
        },
        body: formData,
      });

      if (response.ok) {
        alert("Files uploaded successfully!");
      } else {
        throw new Error("Upload failed.");
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("File upload failed.");
    }
  });
}

document.getElementById("upload-button").addEventListener("click", () => {
  const files = document.getElementById("file-input").files;
  if (files.length === 0) {
    alert("Please select at least one file.");
    return;
  }
  uploadFiles(files);
});

function uploadFiles(files) {
  // For simplicity, use a prompt to get the JWT token
  const token = prompt("Enter your access token:");

  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append("documents", files[i]);
  }

  fetch("http://localhost:5001/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })
    .then((response) => response.text())
    .then((data) => {
      alert("Files uploaded successfully!");
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("File upload failed.");
    });
}

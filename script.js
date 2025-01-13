document.addEventListener("DOMContentLoaded", function () {
  const photoItems = document.querySelectorAll(".photo-item");
  const resetBtn = document.getElementById("reset-btn");
  const downloadBtn = document.getElementById("download-btn");

  function setupUploadInput(input, item) {
    input.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
          const img = document.createElement("img");
          img.src = event.target.result;
          img.classList.add("uploaded-image");

          img.onload = function () {
            item.innerHTML = "";
            item.appendChild(img);

            const deleteBtn = document.createElement("button");
            deleteBtn.innerText = "Hapus";
            deleteBtn.classList.add("delete-btn");
            item.appendChild(deleteBtn);

            deleteBtn.addEventListener("click", function () {
              resetPhotoItem(item);
            });
          };
        };
        reader.readAsDataURL(file);
      }
    });
  }

  function resetPhotoItem(item) {
    const index = item.dataset.index;
    item.innerHTML = `
      <input type="file" accept="image/*" class="upload-input" id="upload-input-${index}">
      <label for="upload-input-${index}" class="upload-label">Upload Foto ${index}</label>
    `;
    const newInput = item.querySelector(".upload-input");
    setupUploadInput(newInput, item);
  }

  photoItems.forEach((item) => {
    const input = item.querySelector(".upload-input");
    if (input) {
      setupUploadInput(input, item);
    }
  });

  resetBtn.addEventListener("click", function () {
    photoItems.forEach(resetPhotoItem);
  });

  downloadBtn.addEventListener("click", function () {
    const templateContainer = document.querySelector(".template-container");
    templateContainer.classList.add("downloading");

    // Add hidden class to empty boxes before download
    const photoItems = document.querySelectorAll(".photo-item");
    photoItems.forEach(item => {
      const hasImage = item.querySelector(".uploaded-image");
      if (!hasImage) {
        item.classList.add("hidden-for-download");
      }
    });

    const options = {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: true,
      onclone: function (clonedDoc) {
        const clonedContainer = clonedDoc.querySelector(".template-container");
        Array.from(clonedContainer.querySelectorAll(".delete-btn")).forEach((btn) => {
          btn.style.display = "none";
        });
        
        // Hide empty boxes in cloned document
        Array.from(clonedContainer.querySelectorAll(".photo-item")).forEach((item) => {
          const hasImage = item.querySelector(".uploaded-image");
          if (!hasImage) {
            item.style.display = "none";
          }
        });
      },
    };

    html2canvas(templateContainer, options)
      .then((canvas) => {
        const link = document.createElement("a");
        link.download = "riwantoro-kolase.png";
        link.href = canvas.toDataURL("image/png", 1.0);
        link.click();
      })
      .catch((error) => {
        console.error("Error generating canvas:", error);
      })
      .finally(() => {
        // Remove hidden class after download completes
        photoItems.forEach(item => {
          item.classList.remove("hidden-for-download");
        });
        templateContainer.classList.remove("downloading");
      });
  });

  const photoGrid = document.querySelector(".photo-grid");
  new Sortable(photoGrid, {
    animation: 150,
    ghostClass: "ghost",
    onEnd: function (evt) {
      const items = photoGrid.querySelectorAll(".photo-item");
      items.forEach((item, index) => {
        item.dataset.index = index + 1;
      });
    },
  });
});
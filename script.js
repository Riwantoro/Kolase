document.addEventListener("DOMContentLoaded", function () {
  const photoItems = document.querySelectorAll(".photo-item");
  const resetBtn = document.getElementById("reset-btn");
  const downloadBtn = document.getElementById("download-btn");
  const footerTextInput = document.getElementById("footer-text-input");
  const footerTextDisplay = document.getElementById("footer-text-display");
  const photoGrid = document.querySelector(".photo-grid");
  const MAX_IMAGE_DIMENSION = 1600;
  const JPEG_QUALITY = 0.9;

  // Fungsi untuk menghitung jumlah foto yang diunggah
  function countUploadedPhotos() {
    let count = 0;
    photoItems.forEach((item) => {
      if (item.querySelector(".uploaded-image")) {
        count++;
      }
    });
    return count;
  }

  // Fungsi untuk mengupdate jumlah baris pada grid
  function updateGridRows() {
    const uploadedCount = countUploadedPhotos();
    let rows = 1;

    if (uploadedCount >= 3 && uploadedCount <= 4) {
      rows = 2;
    } else if (uploadedCount >= 5 && uploadedCount <= 6) {
      rows = 3;
    } else if (uploadedCount >= 7 && uploadedCount <= 8) {
      rows = 4;
    }

    // Hapus semua class rows sebelumnya
    photoGrid.classList.remove("rows-1", "rows-2", "rows-3", "rows-4");
    // Tambahkan class rows yang sesuai
    photoGrid.classList.add(`rows-${rows}`);

    // Layout khusus saat ada 5 foto: 2 - 1 (melebar) - 2
    photoGrid.classList.toggle("layout-5", uploadedCount === 5);
  }

  function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(img);
      };
      img.onerror = (error) => {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      };
      img.src = objectUrl;
      img.decoding = "async";
    });
  }

  async function downscaleImage(file) {
    const img = await loadImageFromFile(file);
    const longestSide = Math.max(img.naturalWidth, img.naturalHeight);
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / longestSide);
    const targetWidth = Math.round(img.naturalWidth * scale);
    const targetHeight = Math.round(img.naturalHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext("2d", { alpha: false });
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    const isPng = file.type === "image/png";
    const mimeType = isPng ? "image/png" : "image/jpeg";
    const quality = isPng ? 1.0 : JPEG_QUALITY;

    return canvas.toDataURL(mimeType, quality);
  }

  function setupUploadInput(input, item) {
    input.addEventListener("change", async function (e) {
      const file = e.target.files[0];
      if (!file) {
        return;
      }

      try {
        const dataUrl = await downscaleImage(file);
        const img = document.createElement("img");
        img.src = dataUrl;
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
            updateGridRows(); // Update grid setelah menghapus foto
          });

          updateGridRows(); // Update grid setelah mengunggah foto
        };
      } catch (error) {
        console.error("Error processing image:", error);
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
    updateGridRows(); // Update grid setelah reset
  });

  downloadBtn.addEventListener("click", function () {
    const templateContainer = document.querySelector(".template-container");
    templateContainer.classList.add("downloading");

    // Add hidden class to empty boxes before download
    const photoItems = document.querySelectorAll(".photo-item");
    photoItems.forEach((item) => {
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
        photoItems.forEach((item) => {
          item.classList.remove("hidden-for-download");
        });
        templateContainer.classList.remove("downloading");
      });
  });

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

  footerTextInput.addEventListener("input", function () {
    footerTextDisplay.textContent = footerTextInput.value.toUpperCase();
  });
});

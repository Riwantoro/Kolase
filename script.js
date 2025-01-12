document.addEventListener("DOMContentLoaded", function () {
  const photoItems = document.querySelectorAll(".photo-item");
  const resetBtn = document.getElementById("reset-btn");
  const downloadBtn = document.getElementById("download-btn");

  // Fungsi untuk menangani upload foto
  function setupUploadInput(input, item) {
    input.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
          const img = document.createElement("img");
          img.src = event.target.result;
          img.classList.add("uploaded-image");
          item.innerHTML = ""; // Kosongkan item sebelum menambahkan gambar
          item.appendChild(img);

          // Tambahkan tombol hapus
          const deleteBtn = document.createElement("button");
          deleteBtn.innerText = "Hapus";
          deleteBtn.classList.add("delete-btn");
          item.appendChild(deleteBtn);

          // Event listener untuk tombol hapus
          deleteBtn.addEventListener("click", function () {
            item.innerHTML = `
              <input type="file" accept="image/*" class="upload-input" id="${input.id}">
              <label for="${input.id}" class="upload-label">Upload Foto ${item.dataset.index}</label>
            `;
            // Setup ulang event listener untuk input file yang baru
            const newInput = item.querySelector(".upload-input");
            setupUploadInput(newInput, item);
          });
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Inisialisasi event listener untuk semua input file
  photoItems.forEach((item) => {
    const input = item.querySelector(".upload-input");
    if (input) {
      setupUploadInput(input, item);
    }
  });

  // Fungsi reset
  resetBtn.addEventListener("click", function () {
    photoItems.forEach((item) => {
      item.innerHTML = `
        <input type="file" accept="image/*" class="upload-input" id="upload-input-${item.dataset.index}">
        <label for="upload-input-${item.dataset.index}" class="upload-label">Upload Foto ${item.dataset.index}</label>
      `;
      // Setup ulang event listener untuk input file yang baru
      const newInput = item.querySelector(".upload-input");
      setupUploadInput(newInput, item);
    });
  });

  // Fungsi download kolase
  downloadBtn.addEventListener("click", function () {
    const templateContainer = document.querySelector(".template-container");
    html2canvas(templateContainer).then(canvas => {
      const link = document.createElement("a");
      link.download = "riwantoro-kolase.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  });

  // Inisialisasi SortableJS untuk drag-and-drop
  const photoGrid = document.querySelector(".photo-grid");
  new Sortable(photoGrid, {
    animation: 150,
    ghostClass: "ghost",
    onEnd: function (evt) {
      console.log("Item dipindahkan:", evt.item);
    },
  });
});
document.addEventListener("DOMContentLoaded", function () {
  const photoItems = document.querySelectorAll(".photo-item");
  const resetBtn = document.getElementById("reset-btn");
  const downloadBtn = document.getElementById("download-btn");
  const footerTextInput = document.getElementById("footer-text-input");
  const footerMeta = document.getElementById("footer-meta");
  const reportTitle = document.getElementById("report-title");
  const photoGrid = document.querySelector(".photo-grid");
  const MAX_IMAGE_DIMENSION = 1600;
  const JPEG_QUALITY = 0.9;
  const LAPAS_CENTER = { latitude: -8.67349, longitude: 115.16952 };
  const LAPAS_RADIUS_METERS = 2000;
  const LAPAS_NAME = "Lapas Kelas IIA Kerobokan, Kerobokan Kelod, Kuta Utara";
  const BASE_REPORT_TITLE = "LAPORAN ATENSI KEGIATAN";

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
    photoGrid.classList.toggle("layout-2", uploadedCount === 2);
  }

  function formatReportTime() {
    const value = new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: "Asia/Makassar",
    }).format(new Date());

    return `${value.replace(" pukul ", " (")} WITA)`;
  }

  function distanceInMeters(latitude, longitude) {
    const toRadians = (degrees) => (degrees * Math.PI) / 180;
    const latDelta = toRadians(latitude - LAPAS_CENTER.latitude);
    const lonDelta = toRadians(longitude - LAPAS_CENTER.longitude);
    const a = Math.sin(latDelta / 2) ** 2
      + Math.cos(toRadians(LAPAS_CENTER.latitude)) * Math.cos(toRadians(latitude)) * Math.sin(lonDelta / 2) ** 2;

    return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function getCurrentLocation() {
    if (!navigator.geolocation) {
      return Promise.resolve({ label: "📍 Lokasi tidak didukung perangkat" });
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const distance = distanceInMeters(coords.latitude, coords.longitude);
          resolve({
            label: distance <= LAPAS_RADIUS_METERS
              ? `📍 Lokasi: ${LAPAS_NAME}`
              : `📍 Lokasi: ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)} (Google Maps)`,
          });
        },
        () => resolve({ label: "📍 Lokasi tidak tersedia" }),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }

  async function updateReportMeta() {
    footerMeta.textContent = `🕒 Dibuat: ${formatReportTime()}\n📍 Mengambil lokasi...`;
    const location = await getCurrentLocation();
    footerMeta.textContent = `🕒 Dibuat: ${formatReportTime()}\n${location.label}`;
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
            item.classList.add("has-image");
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
    item.classList.remove("has-image");
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

  downloadBtn.addEventListener("click", async function () {
    await updateReportMeta();
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
        link.download = `laporan-atensi-${Date.now()}.png`;
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
    const unit = footerTextInput.value.trim().toUpperCase();
    reportTitle.textContent = unit ? `${BASE_REPORT_TITLE} ${unit}` : BASE_REPORT_TITLE;
  });
});

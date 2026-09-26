const URL_PRODUCTS = "https://dummyjson.com/products?limit=0";
const GAMBAR_FALLBACK = "wowo.png";

const DAFTAR_KATEGORI = [
  { label: "Semua", value: "" },
  { label: "Beauty", value: "beauty" },
  { label: "Fragrances", value: "fragrances" },
  { label: "Furniture", value: "furniture" },
  { label: "Groceries", value: "groceries" },
  { label: "Home Decoration", value: "home-decoration" },
  { label: "Kitchen Accessories", value: "kitchen-accessories" },
  { label: "Laptops", value: "laptops" },
  { label: "Mens Shirts", value: "mens-shirts" },
  { label: "Mens Shoes", value: "mens-shoes" },
  { label: "Mens Watches", value: "mens-watches" },
  { label: "Mobile Accessories", value: "mobile-accessories" },
  { label: "Motorcycle", value: "motorcycle" },
  { label: "Skin Care", value: "skin-care" },
  { label: "Smartphones", value: "smartphones" },
  { label: "Sports Accessories", value: "sports-accessories" },
  { label: "Sunglasses", value: "sunglasses" },
  { label: "Tablets", value: "tablets" },
  { label: "Tops", value: "tops" },
  { label: "Vehicle", value: "vehicle" },
  { label: "Womens Bags", value: "womens-bags" },
  { label: "Womens Dresses", value: "womens-dresses" },
  { label: "Womens Jewellery", value: "womens-jewellery" },
  { label: "Womens Shoes", value: "womens-shoes" },
  { label: "Womens Watches", value: "womens-watches" },
];

// ---------- Elemen DOM ----------
const loadingOverlay = document.getElementById("loading-overlay");
const userGreeting = document.getElementById("user-greeting");
const btnLogout = document.getElementById("btn-logout");
const btnBack = document.getElementById("btn-back");
const inputSearch = document.getElementById("input-search");
const btnFilter = document.getElementById("btn-filter");
const categoriesBar = document.getElementById("categories-bar");
const productGrid = document.getElementById("product-grid");
const emptyState = document.getElementById("empty-state");

const popupOverlay = document.getElementById("popup-overlay");
const btnPopupBack = document.getElementById("btn-popup-back");
const selectHarga = document.getElementById("select-harga");
const ratingTombolGrup = document.getElementById("rating-tombol-grup");
const btnTerapkan = document.getElementById("btn-terapkan");

// ---------- State ----------
let semuaProduk = [];
let hasilTerfilter = [];
let kategoriAktif = "";
let kataKunciCari = "";
let urutanHarga = "";
let ratingMinimum = null;

// ============================================================
// 0. Cek sesi login. Kalau tidak ada, balik ke halaman login.
// ============================================================
function cekSesi() {
  const firstName = localStorage.getItem("firstName");
  if (!firstName) {
    window.location.replace("login.html");
    return null;
  }
  userGreeting.textContent = `Selamat datang, ${firstName}!`;
  return firstName;
}

btnLogout.addEventListener("click", () => {
  localStorage.removeItem("firstName");
  window.location.assign("login.html");
});

// ============================================================
// 1. Closure + debounce untuk pencarian
// ============================================================
function buatDebounce(fungsi, jeda) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fungsi.apply(this, args);
    }, jeda);
  };
}

function jalankanPencarian(kataKunci) {
  kataKunciCari = kataKunci.trim().toLowerCase();
  terapkanFilterDasar();
}

const pencarianDenganDebounce = buatDebounce(jalankanPencarian, 250);

inputSearch.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    pencarianDenganDebounce(inputSearch.value);
  }
});

// Kalau kolom pencarian dikosongkan lagi, langsung tampilkan ulang semua
inputSearch.addEventListener("input", () => {
  if (inputSearch.value.trim() === "" && kataKunciCari !== "") {
    kataKunciCari = "";
    terapkanFilterDasar();
  }
});

// ============================================================
// 2. Render blok kategori
// ============================================================
function renderKategori() {
  categoriesBar.innerHTML = "";
  DAFTAR_KATEGORI.forEach((kategori) => {
    const tombol = document.createElement("button");
    tombol.type = "button";
    tombol.className = "kategori-blok" + (kategori.value === kategoriAktif ? " aktif" : "");
    tombol.textContent = kategori.label;
    tombol.addEventListener("click", () => {
      kategoriAktif = kategori.value;
      renderKategori();
      terapkanFilterDasar();
    });
    categoriesBar.appendChild(tombol);
  });
}

// ============================================================
// 3. Pipeline filter: kategori + pencarian, lalu rating + urutan harga
// ============================================================
function terapkanFilterDasar() {
  let hasil = semuaProduk;

  if (kategoriAktif) {
    hasil = hasil.filter((p) => p.category === kategoriAktif);
  }

  if (kataKunciCari) {
    hasil = hasil.filter((p) => p.title.toLowerCase().includes(kataKunciCari));
  }

  hasilTerfilter = hasil;
  terapkanUrutanDanRating();
}

function terapkanUrutanDanRating() {
  let hasil = [...hasilTerfilter];

  if (ratingMinimum) {
    hasil = hasil.filter((p) => p.rating >= ratingMinimum);
  }

  if (urutanHarga === "asc") {
    hasil.sort((a, b) => a.price - b.price);
  } else if (urutanHarga === "desc") {
    hasil.sort((a, b) => b.price - a.price);
  }

  renderProduk(hasil);
}

// ============================================================
// 4. Render kartu produk
// ============================================================
function buatKartuProduk(produk) {
  const kartu = document.createElement("div");
  kartu.className = "kartu-produk";

  const diskon = produk.discountPercentage ? produk.discountPercentage.toFixed(2) : "0.00";

  kartu.innerHTML = `
    <span class="badge-diskon">-${diskon}%</span>
    <div class="gambar-produk-wrapper">
      <img src="${produk.thumbnail}" alt="${produk.title}" loading="lazy">
    </div>
    <div class="info-produk">
      <span class="kategori-produk">${produk.category}</span>
      <span class="judul-produk">${produk.title}</span>
      <div class="baris-bawah-produk">
        <span class="harga-produk">$${produk.price}</span>
        <span class="rating-produk"><span class="bintang">&#9733;</span> ${produk.rating}</span>
      </div>
    </div>
  `;

  const gambar = kartu.querySelector("img");
  gambar.addEventListener("error", function handler() {
    gambar.removeEventListener("error", handler);
    gambar.src = GAMBAR_FALLBACK;
  });

  return kartu;
}

function renderProduk(daftarProduk) {
  productGrid.innerHTML = "";

  if (daftarProduk.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  const fragment = document.createDocumentFragment();
  daftarProduk.forEach((produk) => {
    fragment.appendChild(buatKartuProduk(produk));
  });
  productGrid.appendChild(fragment);
}

// ============================================================
// 5. Tombol kembali ke tampilan produk lengkap
// ============================================================
btnBack.addEventListener("click", () => {
  kategoriAktif = "";
  kataKunciCari = "";
  urutanHarga = "";
  ratingMinimum = null;

  inputSearch.value = "";
  selectHarga.value = "";
  document.querySelectorAll(".rating-tombol").forEach((btn) => btn.classList.remove("aktif"));

  renderKategori();
  hasilTerfilter = semuaProduk;
  terapkanUrutanDanRating();
});

// ============================================================
// 6. Popup urutkan / filter
// ============================================================
btnFilter.addEventListener("click", () => {
  popupOverlay.classList.remove("hidden");
});

btnPopupBack.addEventListener("click", () => {
  popupOverlay.classList.add("hidden");
});

ratingTombolGrup.addEventListener("click", (e) => {
  const tombol = e.target.closest(".rating-tombol");
  if (!tombol) return;

  const nilai = Number(tombol.dataset.rating);
  const sedangAktif = tombol.classList.contains("aktif");

  document.querySelectorAll(".rating-tombol").forEach((btn) => btn.classList.remove("aktif"));

  if (sedangAktif) {
    ratingMinimum = null;
  } else {
    tombol.classList.add("aktif");
    ratingMinimum = nilai;
  }
});

btnTerapkan.addEventListener("click", () => {
  urutanHarga = selectHarga.value;
  terapkanUrutanDanRating();
  popupOverlay.classList.add("hidden");
});

// ============================================================
// 7. Ambil data produk dari API
// ============================================================
async function ambilProduk() {
  try {
    const respon = await fetch(URL_PRODUCTS);

    if (!respon.ok) {
      throw new Error(`Gagal memuat produk! Status: ${respon.status}`);
    }

    const data = await respon.json();
    semuaProduk = data.products || [];
    hasilTerfilter = semuaProduk;

    renderKategori();
    terapkanUrutanDanRating();
  } catch (error) {
    console.error("Terjadi kesalahan saat mengambil produk:", error);
    productGrid.innerHTML = "";
    emptyState.classList.remove("hidden");
    emptyState.querySelector("h3").textContent = "Gagal memuat produk";
    emptyState.querySelector("p").textContent =
      "Periksa koneksi internetmu, lalu muat ulang halaman ini.";
  } finally {
    loadingOverlay.classList.add("hidden");
  }
}

// ============================================================
// Inisialisasi
// ============================================================
(function init() {
  const firstName = cekSesi();
  if (!firstName) return;

  ambilProduk();
})();

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

const btnMuatLagi = document.getElementById("btn-muat-lagi");

const btnKeranjang = document.getElementById("btn-keranjang");
const badgeKeranjang = document.getElementById("badge-keranjang");
const keranjangOverlay = document.getElementById("keranjang-overlay");
const btnKeranjangBack = document.getElementById("btn-keranjang-back");
const daftarKeranjangEl = document.getElementById("daftar-keranjang");
const totalKeranjangHargaEl = document.getElementById("total-keranjang-harga");

const detailOverlay = document.getElementById("detail-overlay");
const btnDetailBack = document.getElementById("btn-detail-back");
const detailGambar = document.getElementById("detail-gambar");
const detailKategori = document.getElementById("detail-kategori");
const detailJudul = document.getElementById("detail-judul");
const detailBrand = document.getElementById("detail-brand");
const detailHarga = document.getElementById("detail-harga");
const detailStok = document.getElementById("detail-stok");
const detailDeskripsi = document.getElementById("detail-deskripsi");
const btnDetailTambah = document.getElementById("btn-detail-tambah");

// ---------- State ----------
let semuaProduk = [];
let hasilTerfilter = [];
let kategoriAktif = "";
let kataKunciCari = "";
let urutanHarga = "";
let ratingMinimum = null;

const JUMLAH_PER_HALAMAN = 8;
let hasilSaatIni = [];
let jumlahDitampilkan = JUMLAH_PER_HALAMAN;

const KUNCI_KERANJANG = "keranjang";

// 0. Cek sesi login. Kalau tidak ada, balik ke halaman login.
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

// 1. Closure + debounce untuk pencarian
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

// 2. Render blok kategori
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

// 3. Pipeline filter: kategori + pencarian, lalu rating + urutan harga
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

  hasilSaatIni = hasil;
  jumlahDitampilkan = JUMLAH_PER_HALAMAN;
  renderHalamanSaatIni();
}

// 4. Render kartu produk
function buatKartuProduk(produk) {
  const kartu = document.createElement("div");
  kartu.className = "kartu-produk";
  kartu.dataset.id = produk.id;

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
      <button class="btn-tambah-keranjang" title="Tambah ke Keranjang">+ Keranjang</button>
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

// 4b. Load More (array slicing atas hasilSaatIni)
function renderHalamanSaatIni() {
  renderProduk(hasilSaatIni.slice(0, jumlahDitampilkan));

  if (jumlahDitampilkan >= hasilSaatIni.length) {
    btnMuatLagi.classList.add("hidden");
  } else {
    btnMuatLagi.classList.remove("hidden");
  }
}

btnMuatLagi.addEventListener("click", () => {
  jumlahDitampilkan += JUMLAH_PER_HALAMAN;
  renderHalamanSaatIni();
});

// 5. Tombol kembali ke tampilan produk lengkap
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

// 6. Popup urutkan / filter
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

// 7. Ambil data produk dari API
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

// 8. Keranjang (Local Storage CRUD)
function ambilKeranjang() {
  const data = localStorage.getItem(KUNCI_KERANJANG);
  return data ? JSON.parse(data) : [];
}

function simpanKeranjang(keranjang) {
  if (keranjang.length === 0) {
    localStorage.removeItem(KUNCI_KERANJANG);
  } else {
    localStorage.setItem(KUNCI_KERANJANG, JSON.stringify(keranjang));
  }
}

function tambahKeKeranjang(id) {
  const produk = semuaProduk.find((p) => p.id === id);
  if (!produk) return;

  const keranjang = ambilKeranjang();
  const itemAda = keranjang.find((item) => item.id === id);

  if (itemAda) {
    itemAda.jumlah += 1;
  } else {
    keranjang.push({
      id: produk.id,
      judul: produk.title,
      harga: produk.price,
      gambar: produk.thumbnail,
      jumlah: 1,
    });
  }

  simpanKeranjang(keranjang);
  perbaruiTampilanKeranjang();
}

function hapusDariKeranjang(id) {
  const keranjang = ambilKeranjang().filter((item) => item.id !== id);
  simpanKeranjang(keranjang);
  perbaruiTampilanKeranjang();
}

function perbaruiTampilanKeranjang() {
  const keranjang = ambilKeranjang();

  const totalJumlah = keranjang.reduce((total, item) => total + item.jumlah, 0);
  badgeKeranjang.textContent = totalJumlah;
  badgeKeranjang.classList.toggle("hidden", totalJumlah === 0);

  const totalHarga = keranjang.reduce((total, item) => total + item.harga * item.jumlah, 0);
  totalKeranjangHargaEl.textContent = `$${totalHarga.toFixed(2)}`;

  if (keranjang.length === 0) {
    daftarKeranjangEl.innerHTML = "<p class='keranjang-kosong'>Keranjang masih kosong.</p>";
    return;
  }

  daftarKeranjangEl.innerHTML = keranjang
    .map(
      (item) => `
        <div class="item-keranjang" data-id="${item.id}">
          <img src="${item.gambar}" alt="${item.judul}">
          <div class="info-item-keranjang">
            <span class="judul-item-keranjang">${item.judul}</span>
            <span class="harga-item-keranjang">${item.jumlah} x $${item.harga}</span>
          </div>
          <button class="btn-hapus-item" title="Hapus">&times;</button>
        </div>
      `
    )
    .join("");
}

// Event delegation untuk tombol hapus item di dalam panel keranjang
daftarKeranjangEl.addEventListener("click", (e) => {
  const tombolHapus = e.target.closest(".btn-hapus-item");
  if (!tombolHapus) return;
  const id = Number(tombolHapus.closest(".item-keranjang").dataset.id);
  hapusDariKeranjang(id);
});

btnKeranjang.addEventListener("click", () => {
  keranjangOverlay.classList.remove("hidden");
});

btnKeranjangBack.addEventListener("click", () => {
  keranjangOverlay.classList.add("hidden");
});

// 9. Modal Detail Produk (Event Delegation)
function bukaDetailProduk(id) {
  const produk = semuaProduk.find((p) => p.id === id);
  if (!produk) return;

  detailGambar.src = produk.thumbnail;
  detailGambar.alt = produk.title;
  detailKategori.textContent = produk.category;
  detailJudul.textContent = produk.title;
  detailBrand.textContent = produk.brand ? `Brand: ${produk.brand}` : "";
  detailHarga.textContent = `$${produk.price}`;
  detailStok.textContent = `Stok: ${produk.stock}`;
  detailDeskripsi.textContent = produk.description;
  btnDetailTambah.dataset.id = produk.id;

  detailOverlay.classList.remove("hidden");
}

btnDetailBack.addEventListener("click", () => {
  detailOverlay.classList.add("hidden");
});

btnDetailTambah.addEventListener("click", () => {
  tambahKeKeranjang(Number(btnDetailTambah.dataset.id));
  detailOverlay.classList.add("hidden");
});

// Satu listener untuk seluruh grid: menangani klik tombol "+ Keranjang"
// maupun klik kartu (buka detail). Otomatis berlaku juga untuk kartu baru
// yang muncul lewat "Muat Lebih Banyak", tanpa perlu addEventListener lagi.
productGrid.addEventListener("click", (e) => {
  const kartu = e.target.closest(".kartu-produk");
  if (!kartu) return;
  const id = Number(kartu.dataset.id);

  if (e.target.closest(".btn-tambah-keranjang")) {
    tambahKeKeranjang(id);
    return;
  }

  bukaDetailProduk(id);
});

// Inisialisasi
(function init() {
  const firstName = cekSesi();
  if (!firstName) return;

  perbaruiTampilanKeranjang();
  ambilProduk();
})();

const URL_USERS = "https://dummyjson.com/users?limit=0";

const formLogin = document.getElementById("form-login");
const inputUsername = document.getElementById("input-username");
const inputPassword = document.getElementById("input-password");
const tombolMasuk = document.getElementById("tombol-masuk");
const statusLogin = document.getElementById("status-login");

function tampilLoading() {
  statusLogin.innerHTML =
    "<div class='pesan loading'><span class='spinner'></span>Memverifikasi akun...</div>";
  tombolMasuk.disabled = true;
  tombolMasuk.textContent = "Memeriksa...";
}

function tampilError(pesan) {
  statusLogin.innerHTML = `<div class='pesan error'>${pesan}</div>`;
  tombolMasuk.disabled = false;
  tombolMasuk.textContent = "Masuk";
}

function bersihkanStatus() {
  statusLogin.innerHTML = "";
}

async function prosesLogin(username, password) {
  tampilLoading();
  try {
    const respon = await fetch(URL_USERS);

    if (!respon.ok) {
      throw new Error(`Gagal memuat data pengguna! Status: ${respon.status}`);
    }

    const data = await respon.json();
    const daftarUser = data.users || [];

    // 1. Cek apakah username terdaftar di API
    const userDitemukan = daftarUser.find((user) => user.username === username);

    if (!userDitemukan) {
      tampilError("Username invalid!");
      return;
    }

    // 2. Cek apakah password sesuai dengan username tersebut
    if (userDitemukan.password !== password) {
      tampilError("Password incorrect!");
      return;
    }

    // 3. Jika sesuai, simpan sesi dan arahkan ke catalog.html
    bersihkanStatus();
    localStorage.setItem("firstName", userDitemukan.firstName);
    window.location.assign("catalog.html");
  } catch (error) {
    console.error("Terjadi kesalahan:", error);
    tampilError("Gagal terhubung ke server. Periksa koneksi internetmu lalu coba lagi.");
  }
}

formLogin.addEventListener("submit", (e) => {
  e.preventDefault();

  const username = inputUsername.value.trim();
  const password = inputPassword.value;

  if (username === "" || password === "") {
    tampilError("Username dan password wajib diisi.");
    return;
  }

  prosesLogin(username, password);
});

// Kalau sudah pernah login (ada sesi tersimpan), langsung arahkan ke katalog
if (localStorage.getItem("firstName")) {
  window.location.replace("catalog.html");
}

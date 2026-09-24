const URL_USERS = "https://dummyjson.com/users?limit=0";

const formLogin = document.getElementById("form-login");
const inputUsername = document.getElementById("input-username");
const inputPassword = document.getElementById("input-password");
const tombolMasuk = document.getElementById("tombol-masuk");
const statusLogin = document.getElementById("status-login");

function tampilLoading() {
  statusLogin.innerHTML = "<div class='pesan loading'><span class='spinner'></span>Memverifikasi akun...</div>";
  tombolMasuk.disabled = true;
  tombolMasuk.textContent = "Memeriksa...";
}

function tampilError(pesan) {
  statusLogin.innerHTML = `<div class='pesan error'>${pesan}</div>`;
  tombolMasuk.disabled = false;
  tombolMasuk.textContent = "Masuk";
}

async function prosesLogin(username, password) {
  tampilLoading();

  try {
    const respon = await fetch(URL_USERS);
    if (!respon.ok) {
      throw new Error(`Gagal memuat data pengguna! Status: ${respon.status}`);
    }

    const data = await respon.json();

    const userCocok = data.users.filter(
      (user) => user.username === username && user.password === password
    );

    if (userCocok.length === 0) {
      tampilError("Username atau password salah. Periksa lagi lalu coba masuk kembali.");
      return;
    }

    localStorage.setItem("firstName", userCocok[0].firstName);
    window.location.href = "index.html";
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
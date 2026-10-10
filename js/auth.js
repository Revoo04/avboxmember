// Mengambil database dari memori browser (localStorage)
let members = JSON.parse(localStorage.getItem('avbox_db')) || [];

// Jika database kosong, buatkan 1 akun Admin bawaan agar bisa dipakai
if (!members.find(m => m.role === 'admin')) {
  members.push({ id: 'ADMIN-01', nama: 'Admin', phone: 'admin', pass: 'admin123', poin: 0, role: 'admin', lastTrx: 0, photo: '', joinDate: new Date().getTime() });
  localStorage.setItem('avbox_db', JSON.stringify(members));
}

// Cek apakah ada user yang sedang login. Jika ada, langsung pindah halaman.
let activeUser = JSON.parse(localStorage.getItem('avbox_active'));
if (activeUser) {
  window.location.href = activeUser.role === 'admin' ? 'admin.html' : 'member.html';
}

// Fungsi untuk ganti tampilan antara Login dan Daftar
function toggleView(id) {
  document.getElementById('view-login').classList.add('d-none');
  document.getElementById('view-register').classList.add('d-none');
  document.getElementById(id).classList.remove('d-none');
}

// ---------------- PROSES LOGIN ----------------
document.getElementById('loginForm').addEventListener('submit', (e) => {
  e.preventDefault(); // Mencegah web me-refresh
  let idInput = document.getElementById('logIdentitas').value.toLowerCase().trim();
  let pass = document.getElementById('logPass').value;
  
  // Fitur Login Fleksibel (Bisa pakai WA, Nama, atau ID)
  let user = members.find(m => (m.phone === idInput || m.nama.toLowerCase() === idInput || m.id.toLowerCase() === idInput) && m.pass === pass);
  
  if(user) {
    localStorage.setItem('avbox_active', JSON.stringify(user));
    window.location.href = user.role === 'admin' ? 'admin.html' : 'member.html';
  } else { 
    alert('Login gagal! Cek kembali data dan password Anda.'); 
  }
});

// ---------------- FITUR KOMPRESI FOTO (AGAR MEMORI TIDAK PENUH) ----------------
function compressImage(file, callback) {
  if(!file) return callback('');
  let reader = new FileReader();
  reader.onload = function(e) {
    let img = new Image();
    img.onload = function() {
      let canvas = document.createElement('canvas'); 
      let ctx = canvas.getContext('2d');
      // Memperkecil gambar maksimal lebar 200px
      let scale = 200 / img.width; 
      if (scale >= 1) scale = 1; 
      canvas.width = img.width * scale; 
      canvas.height = img.height * scale;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      callback(canvas.toDataURL('image/jpeg', 0.7)); // Kualitas foto 70%
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ---------------- PROSES DAFTAR MEMBER ----------------
document.getElementById('regForm').addEventListener('submit', (e) => {
  e.preventDefault();
  let btn = document.getElementById('btnDaftar');
  btn.innerText = 'Memproses Foto...'; 
  btn.disabled = true;

  let namaInput = document.getElementById('regName').value.trim();
  let hpInput = document.getElementById('regPhone').value.trim();
  let passInput = document.getElementById('regPass').value;
  let photoFile = document.getElementById('regPhoto').files[0];

  // 1. Regex Validasi Keamanan
  if(!/^[a-zA-Z0-9\s]{1,30}$/.test(namaInput)) return alert("Nama max 30 karakter!");
  if(!/^(08|628)[0-9]{6,11}$/.test(hpInput)) return alert("No WA harus format Indonesia (08/628) dan 8-13 digit!");
  if(passInput.length < 8) return alert("Password minimal 8 digit!");
  if(members.find(m => m.phone === hpInput)) return alert('Nomor WhatsApp sudah terdaftar!');

  // 2. Generate ID Anti Duplikat
  let maxIdNum = 0;
  members.filter(m => m.role === 'member').forEach(m => {
    let num = parseInt(m.id.replace('AVB', '')); 
    if(num > maxIdNum) maxIdNum = num;
  });
  let idBaru = 'AVB' + String(maxIdNum + 1).padStart(3, '0');
  
  // 3. Catat Tanggal Daftar Saat Ini
  let tglDaftar = new Date().getTime();

  // 4. Kompres Foto lalu Simpan Data
  compressImage(photoFile, (base64Img) => {
    members.push({ 
      id: idBaru, nama: namaInput, phone: hpInput, pass: passInput, 
      poin: 0, role: 'member', lastTrx: 0, photo: base64Img, joinDate: tglDaftar 
    });
    localStorage.setItem('avbox_db', JSON.stringify(members)); // Simpan ke Database
    
    alert('Pendaftaran Berhasil! Silakan Login.');
    btn.innerText = 'Daftar & Proses Kartu'; btn.disabled = false;
    document.getElementById('regForm').reset(); 
    toggleView('view-login'); // Lempar ke form login
  });
});
let members = JSON.parse(localStorage.getItem('avbox_db')) || [];
let activeUser = JSON.parse(localStorage.getItem('avbox_active'));
let appSettings = JSON.parse(localStorage.getItem('avbox_settings')) || { silver: 7, gold: 10 };

// Gambar Profil Kosong Lokal
const blankPhoto = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Crect width='60' height='60' fill='%23cccccc'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='12' fill='%23666666'%3EFOTO%3C/text%3E%3C/svg%3E";

if (!activeUser || activeUser.role !== 'admin') window.location.href = 'index.html';
document.getElementById('navUserName').innerText = activeUser.nama;

function cekLevel(poin) {
  if (poin >= 1500) return { nama: 'GOLD', class: 'tier-gold', diskon: appSettings.gold, badge: 'bg-warning text-dark' };
  if (poin >= 500)  return { nama: 'SILVER', class: 'tier-silver', diskon: appSettings.silver, badge: 'bg-secondary text-white' };
  return { nama: 'BRONZE', class: 'tier-bronze', diskon: 0, badge: 'bg-dark text-white' };
}

function formatDateOnly(timestamp) {
  let d = timestamp ? new Date(timestamp) : new Date();
  let tgl = String(d.getDate()).padStart(2, '0');
  let bln = String(d.getMonth() + 1).padStart(2, '0');
  let thn = d.getFullYear();
  return `${tgl}/${bln}/${thn}`;
}

function toggleMenu(id) {
  document.querySelectorAll('.view').forEach(v => v.classList.add('d-none'));
  document.getElementById(id).classList.remove('d-none');
  if(id === 'view-data') renderTabelMember();
}

// ---------------- TABEL ADMIN (FIX WARNA LEVEL BADGE) ----------------
function renderTabelMember() {
  const tbody = document.getElementById('tableMembersBody');
  tbody.innerHTML = '';
  let custOnly = members.filter(m => m.role === 'member').reverse();
  
  if(custOnly.length === 0) return tbody.innerHTML = '<tr><td colspan="6" class="text-center">Belum ada pelanggan.</td></tr>';

  custOnly.forEach(m => {
    let tier = cekLevel(m.poin);
    let userPhoto = m.photo ? `<img src="${m.photo}" class="profile-img-sm me-2">` : `<img src="${blankPhoto}" class="profile-img-sm me-2">`;
    tbody.innerHTML += `
      <tr>
        <td class="ps-4 fw-bold text-secondary">${m.id}</td>
        <td><div class="d-flex align-items-center">${userPhoto}<span class="fw-bold">${m.nama}</span></div></td>
        <td>${m.phone}</td>
        <td class="text-danger fw-bold">${m.poin} Pts</td>
        
        <!-- FIX: Menggunakan ${tier.badge} agar tulisan level terbaca jelas -->
        <td><span class="badge ${tier.badge} border">${tier.nama}</span></td>
        
        <td class="text-center">
          <button class="btn btn-sm btn-dark" onclick="lihatKartuAdmin('${m.id}')">Kartu</button>
          <button class="btn btn-sm btn-primary" onclick="editDataUtama('${m.id}')">Edit</button>
          <button class="btn btn-sm btn-success" onclick="editPoin('${m.id}')">Poin</button>
          <button class="btn btn-sm btn-danger" onclick="hapusMember('${m.id}')">Hapus</button>
        </td>
      </tr>
    `;
  });
}

function aturDiskonLevel() {
  let s = prompt("Persentase Diskon SILVER (%):", appSettings.silver); if (s === null) return;
  let g = prompt("Persentase Diskon GOLD (%):", appSettings.gold); if (g === null) return;
  appSettings.silver = parseFloat(s) || 0; appSettings.gold = parseFloat(g) || 0;
  localStorage.setItem('avbox_settings', JSON.stringify(appSettings)); renderTabelMember();
}

function editDataUtama(id) {
  let userIndex = members.findIndex(m => m.id === id);
  let user = members[userIndex];
  
  let newId = prompt("Ubah ID Pelanggan:", user.id); if(newId === null) return;
  if(newId !== user.id && members.find(m => m.id === newId)) return alert("Gagal: ID sudah dipakai!");
  
  let newName = prompt("Ubah Nama:", user.nama); if(newName === null) return;
  let newPhone = prompt("Ubah No WhatsApp:", user.phone); if(newPhone === null) return;

  if(!/^[a-zA-Z0-9\s]{1,30}$/.test(newName)) return alert("Nama max 30 karakter!");
  if(!/^(08|628)[0-9]{6,11}$/.test(newPhone)) return alert("WA format Indonesia 8-13 digit!");

  members[userIndex].id = newId.trim(); 
  members[userIndex].nama = newName.trim(); 
  members[userIndex].phone = newPhone.trim();
  localStorage.setItem('avbox_db', JSON.stringify(members)); 
  renderTabelMember(); 
}

function editPoin(id) {
  let userIndex = members.findIndex(m => m.id === id);
  let poinBaru = prompt(`Ubah Total Poin untuk ${members[userIndex].nama}:`, members[userIndex].poin);
  if(poinBaru !== null && !isNaN(poinBaru)) {
    members[userIndex].poin = parseInt(poinBaru); localStorage.setItem('avbox_db', JSON.stringify(members)); renderTabelMember();
  }
}

function hapusMember(id) {
  if(confirm(`Yakin menghapus data?`)) { members = members.filter(m => m.id !== id); localStorage.setItem('avbox_db', JSON.stringify(members)); renderTabelMember(); }
}

function lihatKartuAdmin(id) {
  let user = members.find(m => m.id === id);
  let tier = cekLevel(user.poin);
  
  document.getElementById('modalAdminNama').innerText = user.nama;
  document.getElementById('modalAdminId').innerHTML = `${user.id}<p class="av-join-date">Member Sejak: ${formatDateOnly(user.joinDate)}</p>`;
  
  let badgeEl = document.getElementById('modalAdminLevel');
  badgeEl.innerText = tier.nama;
  badgeEl.className = `badge mt-1 ${tier.badge}`;

  document.getElementById('modalAdminPhoto').src = user.photo || blankPhoto;
  
  JsBarcode("#modalAdminBarcode", user.id, { format: "CODE128", width: 2, height: 35, displayValue: false, margin: 0 });

  new bootstrap.Modal(document.getElementById('modalKartuAdmin')).show();
}

function unduhKartuUtuh() {
  let elem = document.getElementById('adminCardPreview');
  let btn = document.getElementById('btnUnduh');
  btn.innerText = 'Memproses...'; btn.disabled = true;

  html2canvas(elem, { scale: 3, useCORS: true, backgroundColor: null }).then(canvas => {
    try {
      let link = document.createElement('a'); 
      link.download = `AVBOX_${document.getElementById('modalAdminNama').innerText}.png`; 
      link.href = canvas.toDataURL("image/png"); 
      
      document.body.appendChild(link);
      link.click(); 
      document.body.removeChild(link);
      
      btn.innerText = '⬇️ Unduh Gambar Kartu Resolusi Tinggi'; 
      btn.disabled = false;
    } catch (err) {
      alert("Sistem diblokir browser. Pastikan tidak ada ekstensi yang menghalangi.");
      btn.innerText = '⬇️ Unduh Gambar Kartu Resolusi Tinggi'; 
      btn.disabled = false;
    }
  }).catch(err => {
    alert("Proses gambar gagal. Coba muat ulang halaman.");
    btn.innerText = '⬇️ Unduh Gambar Kartu Resolusi Tinggi'; 
    btn.disabled = false;
  });
}

// ---------------- FITUR POS (KASIR) ----------------
let kasirMemberAktif = null;
function prosesScan() {
  let id = document.getElementById('scanId').value.toUpperCase();
  kasirMemberAktif = members.find(m => m.id === id && m.role === 'member');
  if(!kasirMemberAktif) return alert('Member tidak ditemukan!');
  
  let tier = cekLevel(kasirMemberAktif.poin);
  document.getElementById('posArea').style.opacity = '1'; document.getElementById('posArea').style.pointerEvents = 'auto'; 
  
  document.getElementById('posName').innerText = kasirMemberAktif.nama;
  document.getElementById('posId').innerText = kasirMemberAktif.id;
  document.getElementById('posLevel').innerText = tier.nama;
  
  let diskonNominal = 45000 * (tier.diskon / 100);
  document.getElementById('posDiskonPersen').innerText = tier.diskon;
  document.getElementById('posDiskonNominal').innerText = diskonNominal.toLocaleString('id-ID');
  document.getElementById('posTotalBayar').innerText = (45000 - diskonNominal).toLocaleString('id-ID');
}

function selesaikanTransaksi() {
  if(!kasirMemberAktif) return;
  
  let basePoin = Math.floor(Math.random() * (80 - 50 + 1)) + 50; 
  let now = new Date().getTime();
  let bonus = (kasirMemberAktif.lastTrx !== 0 && (now - kasirMemberAktif.lastTrx)/(1000*3600*24) <= 7) ? Math.floor(Math.random() * 21) + 20 : 0;
  
  let userIndex = members.findIndex(m => m.id === kasirMemberAktif.id);
  members[userIndex].poin += (basePoin + bonus);
  members[userIndex].lastTrx = now; 
  localStorage.setItem('avbox_db', JSON.stringify(members)); 
  
  alert(`Selesai! Poin Didapat: +${basePoin + bonus} Pts`);
  
  document.getElementById('posArea').style.opacity = '0.5'; document.getElementById('posArea').style.pointerEvents = 'none';
  document.getElementById('scanId').value = '';
}

let html5QrCode = null; let isScanning = false;
function toggleScanner() {
  if (isScanning) { 
    html5QrCode.stop().then(() => { isScanning = false; document.getElementById('reader').style.display = 'none'; }); 
  } else { 
    document.getElementById('reader').style.display = 'block'; isScanning = true;
    if (!html5QrCode) html5QrCode = new Html5Qrcode("reader");
    html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 100 } }, (text) => { document.getElementById('scanId').value = text; toggleScanner(); prosesScan(); }, () => {});
  }
}

function logout() { localStorage.removeItem('avbox_active'); window.location.href = 'index.html'; }
renderTabelMember();
let members = JSON.parse(localStorage.getItem('avbox_db')) || [];
let activeUser = JSON.parse(localStorage.getItem('avbox_active'));
let appSettings = JSON.parse(localStorage.getItem('avbox_settings')) || { silver: 7, gold: 10 };

// Gambar Foto Kosong Lokal
const blankPhoto = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Crect width='60' height='60' fill='%23cccccc'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='12' fill='%23666666'%3EFOTO%3C/text%3E%3C/svg%3E";

if (!activeUser || activeUser.role !== 'member') {
  window.location.href = 'index.html';
}
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

function initData() {
  let user = members.find(m => m.id === activeUser.id);
  let tier = cekLevel(user.poin);
  
  document.getElementById('cardNameDisplay').innerText = user.nama;
  document.getElementById('cardIdDisplay').innerHTML = `${user.id}<p class="av-join-date">Member Sejak: ${formatDateOnly(user.joinDate)}</p>`;
  
  let badgeEl = document.getElementById('cardLevelDisplay');
  badgeEl.innerText = tier.nama;
  badgeEl.className = `badge mt-1 ${tier.badge}`;
  
  document.getElementById('cardPhotoDisplay').src = user.photo || blankPhoto;
  document.getElementById('custPoints').innerText = user.poin;
  document.getElementById('custDiscount').innerText = tier.diskon;
  
  JsBarcode("#custBarcode", user.id, { format: "CODE128", width: 2, height: 35, displayValue: false, margin: 0 });

  document.getElementById('benefitList').innerHTML = `
    <li class="list-group-item"><strong style="color: #cd7f32;">BRONZE (0 - 499 Poin)</strong><br><small class="text-muted">Dapatkan poin acak.</small></li>
    <li class="list-group-item"><strong style="color: #757575;">SILVER (500 - 1499 Poin)</strong><br><small class="text-muted">Diskon ${appSettings.silver}% setiap transaksi.</small></li>
    <li class="list-group-item"><strong style="color: #b8860b;">GOLD (1500+ Poin)</strong><br><small class="text-muted">Diskon eksklusif ${appSettings.gold}%.</small></li>
  `;
}

function uploadPhoto(event) {
  let file = event.target.files[0];
  if(!file) return;
  
  let reader = new FileReader();
  reader.onload = function(e) {
    let img = new Image();
    img.onload = function() {
      let canvas = document.createElement('canvas'); 
      let ctx = canvas.getContext('2d');
      let scale = 200 / img.width; if (scale >= 1) scale = 1; 
      canvas.width = img.width * scale; canvas.height = img.height * scale;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      let base64String = canvas.toDataURL('image/jpeg', 0.7); 
      
      let userIndex = members.findIndex(m => m.id === activeUser.id);
      members[userIndex].photo = base64String;
      localStorage.setItem('avbox_db', JSON.stringify(members));
      activeUser.photo = base64String;
      localStorage.setItem('avbox_active', JSON.stringify(activeUser));
      initData(); 
      alert('Foto profil berhasil diperbarui!');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// FUNGSI BARU: UNDUH KARTU UNTUK PELANGGAN
function unduhKartuUtuh() {
  let elem = document.getElementById('custCard');
  let btn = document.getElementById('btnUnduhCust');
  btn.innerText = 'Memproses...'; btn.disabled = true;

  html2canvas(elem, { scale: 3, useCORS: true, backgroundColor: null }).then(canvas => {
    try {
      let link = document.createElement('a'); 
      link.download = `MemberCard_${activeUser.nama}.png`; 
      link.href = canvas.toDataURL("image/png"); 
      
      document.body.appendChild(link);
      link.click(); 
      document.body.removeChild(link);
      
      btn.innerText = '⬇️ Unduh Kartu'; 
      btn.disabled = false;
    } catch (err) {
      alert("Sistem diblokir browser. Pastikan tidak ada ekstensi yang menghalangi.");
      btn.innerText = '⬇️ Unduh Kartu'; btn.disabled = false;
    }
  }).catch(err => {
    alert("Proses gambar gagal. Coba muat ulang halaman.");
    btn.innerText = '⬇️ Unduh Kartu'; btn.disabled = false;
  });
}

function logout() { 
  localStorage.removeItem('avbox_active'); 
  window.location.href = 'index.html'; 
}

initData();
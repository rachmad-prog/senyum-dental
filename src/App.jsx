import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Edit3,
  Home,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Phone,
  Plus,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  Trash2,
  Upload,
  UserCog,
  Users,
  X
} from "lucide-react";
import { api } from "./lib/api.js";
import { businessProfile } from "./data/businessProfile.js";

const fallbackPhotos = [
  "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1400&q=82",
  "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?auto=format&fit=crop&w=1200&q=82",
  "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&q=82"
];

const initialSite = {
  ...businessProfile,
  services: [
    { title: "Smile Reset", description: "Scaling, polishing, dan edukasi kebersihan mulut dengan pendekatan nyaman." },
    { title: "Aesthetic Fill", description: "Tambalan warna gigi dengan kontur natural untuk hasil yang rapi." },
    { title: "Ortho Journey", description: "Konsultasi behel dan aligner dengan rencana progres yang transparan." },
    { title: "Root Care", description: "Perawatan saluran akar terarah untuk mempertahankan gigi alami." },
    { title: "Bright Studio", description: "Whitening dan veneer dengan simulasi warna senyum." },
    { title: "Kids Calm", description: "Perawatan anak dengan alur kunjungan yang lembut dan tidak menakutkan." }
  ],
  photos: fallbackPhotos
};

function toDatetimeLocalValue(value) {
  const date = value ? new Date(value) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function App() {
  const [route, setRoute] = useState(() => window.location.pathname);
  const [site, setSite] = useState(initialSite);
  const [menuOpen, setMenuOpen] = useState(false);
  const [booking, setBooking] = useState({ name: "", phone: "", service: initialSite.services[0].title, date: "", message: "" });
  const [contact, setContact] = useState({ name: "", email: "", message: "" });
  const [notice, setNotice] = useState("");
  const [errorNotice, setErrorNotice] = useState("");
  const [login, setLogin] = useState({ email: "", password: "" });
  const [session, setSession] = useState(() => {
    const raw = localStorage.getItem("sd_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [dashboard, setDashboard] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [adminNotice, setAdminNotice] = useState("");
  const [toast, setToast] = useState(null);
  const [userForm, setUserForm] = useState({ id: "", name: "", email: "", password: "", role: "admin" });
  const [siteForm, setSiteForm] = useState(null);
  const [license, setLicense] = useState(null);
  const [licenseForm, setLicenseForm] = useState({ token: "", expiresAt: toDatetimeLocalValue() });

  const photos = site.photos?.length ? site.photos : fallbackPhotos;
  const whatsappUrl = useMemo(() => {
    const text = encodeURIComponent(`Halo ${site.name}, saya ingin membuat janji konsultasi gigi.`);
    return `https://wa.me/${site.whatsapp}?text=${text}`;
  }, [site.name, site.whatsapp]);

  useEffect(() => {
    const onPopState = () => setRoute(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    api("/site").then((payload) => {
      if (payload.license) setLicense(payload.license);
      if (payload.site) {
        const nextSite = { ...initialSite, ...payload.site };
        setSite(nextSite);
        setBooking((current) => ({
          ...current,
          service: nextSite.services?.some((service) => service.title === current.service)
            ? current.service
            : nextSite.services?.[0]?.title || current.service
        }));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (route === "/login" && session) {
      loadDashboard();
    }
  }, [route, session?.id]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!license?.expiresAt) return;
    setLicenseForm((current) => ({
      ...current,
      expiresAt: toDatetimeLocalValue(license.expiresAt)
    }));
  }, [license?.expiresAt]);

  function navigate(path) {
    window.history.pushState({}, "", path);
    setRoute(path);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetUserForm() {
    setUserForm({ id: "", name: "", email: "", password: "", role: "admin" });
  }

  function syncSiteForm(nextSite) {
    setSiteForm({
      name: nextSite.name || "",
      tagline: nextSite.tagline || "",
      address: nextSite.address || "",
      phone: nextSite.phone || "",
      whatsapp: nextSite.whatsapp || "",
      email: nextSite.email || "",
      rating: nextSite.rating || "",
      reviewCount: nextSite.reviewCount || "",
      mapsUrl: nextSite.mapsUrl || "",
      hours: (nextSite.hours || []).map(([day, time]) => ({ day, time })),
      services: (nextSite.services || []).map((service) => ({ title: service.title || "", description: service.description || "" })),
      photos: (nextSite.photos || []).map((url) => ({ url }))
    });
  }

  function showToast(type, message) {
    setToast({ type, message });
  }

  function updateSiteField(field, value) {
    setSiteForm((current) => ({ ...current, [field]: value }));
  }

  function updateNestedList(listName, index, field, value) {
    setSiteForm((current) => ({
      ...current,
      [listName]: current[listName].map((item, itemIndex) => (
        itemIndex === index ? { ...item, [field]: value } : item
      ))
    }));
  }

  function addNestedItem(listName, item) {
    setSiteForm((current) => ({ ...current, [listName]: [...current[listName], item] }));
  }

  function removeNestedItem(listName, index) {
    setSiteForm((current) => ({
      ...current,
      [listName]: current[listName].filter((_, itemIndex) => itemIndex !== index)
    }));
  }

  function handlePhotoUpload(index, file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("error", "File harus berupa gambar.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => updateNestedList("photos", index, "url", reader.result);
    reader.onerror = () => showToast("error", "Gambar gagal dibaca.");
    reader.readAsDataURL(file);
  }

  async function submitBooking(event) {
    event.preventDefault();
    setErrorNotice("");
    try {
      const payload = await api("/appointments", { method: "POST", body: JSON.stringify(booking) });
      setNotice(payload.message);
      setBooking({ name: "", phone: "", service: site.services?.[0]?.title || initialSite.services[0].title, date: "", message: "" });
    } catch (error) {
      setErrorNotice(error.message);
    }
  }

  async function submitContact(event) {
    event.preventDefault();
    setErrorNotice("");
    try {
      const payload = await api("/contact", { method: "POST", body: JSON.stringify(contact) });
      setNotice(payload.message);
      setContact({ name: "", email: "", message: "" });
    } catch (error) {
      setErrorNotice(error.message);
    }
  }

  async function submitLogin(event) {
    event.preventDefault();
    setErrorNotice("");
    try {
      const payload = await api("/auth/login", { method: "POST", body: JSON.stringify(login) });
      localStorage.setItem("sd_token", payload.token);
      localStorage.setItem("sd_user", JSON.stringify(payload.user));
      setSession(payload.user);
      setLogin({ email: "", password: "" });
      setAdminNotice("");
    } catch (error) {
      setErrorNotice(error.message);
    }
  }

  async function loadDashboard() {
    setErrorNotice("");
    try {
      const adminData = await api("/admin/overview");
      setDashboard(adminData);
      setLicense(adminData.license || null);
      if (adminData.site) {
        const merged = { ...initialSite, ...adminData.site };
        setSite(merged);
        syncSiteForm(merged);
      }
    } catch (error) {
      setErrorNotice(error.message);
    }
  }

  async function saveSite(event) {
    event.preventDefault();
    const payload = {
      name: siteForm.name,
      tagline: siteForm.tagline,
      address: siteForm.address,
      phone: siteForm.phone,
      whatsapp: siteForm.whatsapp,
      email: siteForm.email,
      rating: siteForm.rating,
      reviewCount: siteForm.reviewCount,
      mapsUrl: siteForm.mapsUrl,
      hours: siteForm.hours.map((item) => [item.day.trim(), item.time.trim()]).filter(([day, time]) => day && time),
      services: siteForm.services.map((service) => ({
        title: service.title.trim(),
        description: service.description.trim()
      })).filter((service) => service.title && service.description),
      photos: siteForm.photos.map((photo) => photo.url.trim()).filter(Boolean)
    };
    try {
      const result = await api("/admin/site", { method: "PUT", body: JSON.stringify(payload) });
      setSite({ ...initialSite, ...result.site });
      syncSiteForm(result.site);
      setAdminNotice("Tampilan halaman berhasil diperbarui.");
      setErrorNotice("");
      showToast("success", "Tampilan halaman berhasil diperbarui.");
    } catch (error) {
      setErrorNotice(error.message);
      showToast("error", error.message);
    }
  }

  async function saveUser(event) {
    event.preventDefault();
    try {
      const payload = { ...userForm };
      if (!payload.password) delete payload.password;
      const path = userForm.id ? `/admin/users/${userForm.id}` : "/admin/users";
      const method = userForm.id ? "PUT" : "POST";
      await api(path, { method, body: JSON.stringify(payload) });
      resetUserForm();
      setAdminNotice(userForm.id ? "User berhasil diupdate." : "User baru berhasil dibuat.");
      setErrorNotice("");
      showToast("success", userForm.id ? "User berhasil diupdate." : "User baru berhasil dibuat.");
      await loadDashboard();
    } catch (error) {
      setErrorNotice(error.message);
      showToast("error", error.message);
    }
  }

  async function saveLicense(event) {
    event.preventDefault();
    try {
      const result = await api("/admin/license", {
        method: "PUT",
        body: JSON.stringify({
          token: licenseForm.token.trim() || undefined,
          expiresAt: new Date(licenseForm.expiresAt).toISOString()
        })
      });
      setLicense(result.license);
      setLicenseForm({ token: "", expiresAt: toDatetimeLocalValue(result.license.expiresAt) });
      setAdminNotice(result.message);
      setErrorNotice("");
      showToast("success", result.message);
      await loadDashboard();
    } catch (error) {
      setErrorNotice(error.message);
      showToast("error", error.message);
    }
  }

  async function editUser(user) {
    setUserForm({ id: user.id, name: user.name, email: user.email, password: "", role: user.role });
    setActiveTab("users");
  }

  async function deleteUser(id) {
    try {
      await api(`/admin/users/${id}`, { method: "DELETE" });
      setAdminNotice("User berhasil dihapus.");
      setErrorNotice("");
      showToast("success", "User berhasil dihapus.");
      await loadDashboard();
    } catch (error) {
      setErrorNotice(error.message);
      showToast("error", error.message);
    }
  }

  async function updateAppointment(id, status) {
    try {
      await api(`/admin/appointments/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      showToast("success", "Status reservasi berhasil diperbarui.");
      await loadDashboard();
    } catch (error) {
      setErrorNotice(error.message);
      showToast("error", error.message);
    }
  }

  async function deleteAppointment(id) {
    try {
      await api(`/admin/appointments/${id}`, { method: "DELETE" });
      setAdminNotice("Reservasi dihapus.");
      setErrorNotice("");
      showToast("success", "Reservasi berhasil dihapus.");
      await loadDashboard();
    } catch (error) {
      setErrorNotice(error.message);
      showToast("error", error.message);
    }
  }

  async function deleteMessage(id) {
    try {
      await api(`/admin/messages/${id}`, { method: "DELETE" });
      setAdminNotice("Pesan dihapus.");
      setErrorNotice("");
      showToast("success", "Pesan berhasil dihapus.");
      await loadDashboard();
    } catch (error) {
      setErrorNotice(error.message);
      showToast("error", error.message);
    }
  }

  function logout() {
    localStorage.removeItem("sd_token");
    localStorage.removeItem("sd_user");
    setSession(null);
    setDashboard(null);
    setSiteForm(null);
  }

  function renderDashboard() {
    const tabs = [
      ["overview", LayoutDashboard, "Ringkasan"],
      ["appointments", CalendarDays, "Reservasi"],
      ["messages", Mail, "Pesan"],
      ...(session.role === "owner" ? [["users", Users, "User"], ["license", ShieldCheck, "License"]] : []),
      ["site", Settings, "Tampilan"]
    ];
    const licenseExpired = license && !license.active;

    return (
      <section className="admin-shell">
        <aside className="admin-sidebar">
          <div>
            <p className="eyebrow"><UserCog size={16} /> Dashboard</p>
            <h2>Management Klinik</h2>
            {session.role === "owner" && license && (
              <p className={license.active ? "license-pill active" : "license-pill expired"}>
                License {license.active ? "aktif" : "expired"}
              </p>
            )}
            <p>{session.name} · {session.role}</p>
          </div>
          <div className="admin-tabs">
            {tabs.map(([id, Icon, label]) => (
              <button className={activeTab === id ? "admin-tab active" : "admin-tab"} key={id} onClick={() => setActiveTab(id)}>
                <Icon size={18} /> {label}
              </button>
            ))}
          </div>
          <button className="secondary-button" onClick={loadDashboard}>Refresh Data</button>
          <button className="secondary-button" onClick={logout}><LogOut size={18} /> Keluar</button>
        </aside>

        <section className="admin-workspace">
          {errorNotice && <div className="error-notice">{errorNotice}</div>}
          {adminNotice && <div className="admin-notice">{adminNotice}</div>}
          {licenseExpired && session.role === "owner" && activeTab !== "license" && (
            <div className="error-notice">Token license sudah habis. Buka tab License untuk memperbarui akses halaman.</div>
          )}
          {activeTab === "overview" && (
            <>
              <div className="metric-grid">
                <div><span>Reservasi</span><strong>{dashboard?.counts?.appointments ?? "-"}</strong></div>
                <div><span>Pesan Masuk</span><strong>{dashboard?.counts?.messages ?? "-"}</strong></div>
                {session.role === "owner" && <div><span>User</span><strong>{dashboard?.counts?.users ?? "-"}</strong></div>}
              </div>
              <div className="admin-card">
                <h3>Reservasi terbaru</h3>
                <AdminTable rows={dashboard?.latestAppointments || []} columns={["name", "phone", "service", "status"]} />
              </div>
            </>
          )}

          {activeTab === "appointments" && (
            <div className="admin-card">
              <h3>Management Reservasi</h3>
              <div className="record-list">
                {(dashboard?.latestAppointments || []).map((item) => (
                  <article key={item.id} className="record-row">
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.phone} · {item.service}</span>
                      <small>{new Date(item.requested_at).toLocaleString("id-ID")} · {item.message || "Tanpa catatan"}</small>
                    </div>
                    <select value={item.status} onChange={(e) => updateAppointment(item.id, e.target.value)}>
                      <option value="new">New</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="done">Done</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <button className="danger-button" onClick={() => deleteAppointment(item.id)}><Trash2 size={16} /></button>
                  </article>
                ))}
              </div>
            </div>
          )}

          {activeTab === "messages" && (
            <div className="admin-card">
              <h3>Pesan Kontak</h3>
              <div className="record-list">
                {(dashboard?.latestMessages || []).map((item) => (
                  <article key={item.id} className="record-row">
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.email}</span>
                      <small>{item.message}</small>
                    </div>
                    <button className="danger-button" onClick={() => deleteMessage(item.id)}><Trash2 size={16} /></button>
                  </article>
                ))}
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="admin-grid">
              <form className="admin-card" onSubmit={saveUser}>
                <h3>{userForm.id ? "Edit User" : "Tambah User"}</h3>
                <input required placeholder="Nama" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} disabled={session.role !== "owner"} />
                <input required type="email" placeholder="Email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} disabled={session.role !== "owner"} />
                <input type="password" placeholder={userForm.id ? "Password baru opsional" : "Password"} value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} disabled={session.role !== "owner"} required={!userForm.id} />
                <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })} disabled={session.role !== "owner"}>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
                <button className="primary-button" disabled={session.role !== "owner"}><Plus size={18} /> Simpan User</button>
                {userForm.id && <button type="button" className="secondary-button" onClick={resetUserForm}>Batal Edit</button>}
                {session.role !== "owner" && <p className="login-hint">Hanya owner yang bisa membuat, mengubah, dan menghapus user.</p>}
              </form>

              <div className="admin-card">
                <h3>Daftar User</h3>
                <div className="record-list">
                  {(dashboard?.users || []).map((user) => (
                    <article key={user.id} className="record-row compact">
                      <div>
                        <strong>{user.name}</strong>
                        <span>{user.email} · {user.role}</span>
                      </div>
                      <button className="icon-button" onClick={() => editUser(user)} disabled={session.role !== "owner"}><Edit3 size={16} /></button>
                      <button className="danger-button" onClick={() => deleteUser(user.id)} disabled={session.role !== "owner" || user.id === session.id}><Trash2 size={16} /></button>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "license" && session.role === "owner" && (
            <div className="admin-grid">
              <form className="admin-card" onSubmit={saveLicense}>
                <h3>Token License</h3>
                <input placeholder="Token baru opsional" value={licenseForm.token} onChange={(e) => setLicenseForm({ ...licenseForm, token: e.target.value })} />
                <input required type="datetime-local" placeholder="Tanggal dan jam expired" value={licenseForm.expiresAt} onChange={(e) => setLicenseForm({ ...licenseForm, expiresAt: e.target.value })} />
                <button className="primary-button"><ShieldCheck size={18} /> Perbarui License</button>
                <p className="login-hint">Pilih tanggal dan jam expired license. Jika token dikosongkan, sistem akan membuat token baru otomatis.</p>
              </form>

              <div className="admin-card license-card">
                <h3>Status License</h3>
                <div className={license?.active ? "license-status active" : "license-status expired"}>
                  <strong>{license?.active ? "Aktif" : "Expired"}</strong>
                  <span>{license?.expiresAt ? `Berlaku sampai ${new Date(license.expiresAt).toLocaleString("id-ID")}` : "Belum ada license aktif"}</span>
                </div>
                {license?.token && <code className="license-token">{license.token}</code>}
              </div>
            </div>
          )}

          {activeTab === "site" && siteForm && (
            <form className="site-editor section-editor" onSubmit={saveSite}>
              <div className="editor-heading">
                <div>
                  <p className="eyebrow"><Settings size={16} /> Tampilan website</p>
                  <h3>Management Tampilan Halaman</h3>
                </div>
                <button className="primary-button editor-save"><Save size={18} /> Simpan Semua</button>
              </div>

              <section className="editor-section">
                <div className="editor-section-title">
                  <span>01</span>
                  <div>
                    <h4>Hero dan identitas</h4>
                    <p>Nama klinik, headline, rating, dan angka review pada bagian pertama website.</p>
                  </div>
                </div>
                <div className="form-grid">
                  <input required placeholder="Nama klinik" value={siteForm.name} onChange={(e) => updateSiteField("name", e.target.value)} />
                  <input required placeholder="Tagline" value={siteForm.tagline} onChange={(e) => updateSiteField("tagline", e.target.value)} />
                  <input required placeholder="Rating" value={siteForm.rating} onChange={(e) => updateSiteField("rating", e.target.value)} />
                  <input required placeholder="Jumlah review" value={siteForm.reviewCount} onChange={(e) => updateSiteField("reviewCount", e.target.value)} />
                </div>
              </section>

              <section className="editor-section">
                <div className="editor-section-title">
                  <span>02</span>
                  <div>
                    <h4>Kontak dan lokasi</h4>
                    <p>Informasi yang tampil di strip kontak, tombol WhatsApp, footer, dan link Maps.</p>
                  </div>
                </div>
                <div className="form-grid">
                  <input required placeholder="Alamat" value={siteForm.address} onChange={(e) => updateSiteField("address", e.target.value)} />
                  <input required placeholder="Telepon" value={siteForm.phone} onChange={(e) => updateSiteField("phone", e.target.value)} />
                  <input required placeholder="WhatsApp angka saja" value={siteForm.whatsapp} onChange={(e) => updateSiteField("whatsapp", e.target.value)} />
                  <input required type="email" placeholder="Email" value={siteForm.email} onChange={(e) => updateSiteField("email", e.target.value)} />
                </div>
                <input required placeholder="Google Maps URL" value={siteForm.mapsUrl} onChange={(e) => updateSiteField("mapsUrl", e.target.value)} />
              </section>

              <section className="editor-section">
                <div className="editor-section-title">
                  <span>03</span>
                  <div>
                    <h4>Layanan</h4>
                    <p>Kartu layanan di section layanan klinik.</p>
                  </div>
                </div>
                <div className="stack-list">
                  {siteForm.services.map((service, index) => (
                    <div className="editable-row two-line" key={`service-${index}`}>
                      <input required placeholder="Judul layanan" value={service.title} onChange={(e) => updateNestedList("services", index, "title", e.target.value)} />
                      <textarea required placeholder="Deskripsi layanan" value={service.description} onChange={(e) => updateNestedList("services", index, "description", e.target.value)} />
                      <button type="button" className="danger-button" onClick={() => removeNestedItem("services", index)} disabled={siteForm.services.length === 1}><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
                <button type="button" className="secondary-button inline-action" onClick={() => addNestedItem("services", { title: "", description: "" })}><Plus size={18} /> Tambah Layanan</button>
              </section>

              <section className="editor-section">
                <div className="editor-section-title">
                  <span>04</span>
                  <div>
                    <h4>Jam operasional</h4>
                    <p>Daftar hari dan jam pada section pengalaman klinik.</p>
                  </div>
                </div>
                <div className="stack-list">
                  {siteForm.hours.map((hour, index) => (
                    <div className="editable-row" key={`hour-${index}`}>
                      <input required placeholder="Hari" value={hour.day} onChange={(e) => updateNestedList("hours", index, "day", e.target.value)} />
                      <input required placeholder="Jam" value={hour.time} onChange={(e) => updateNestedList("hours", index, "time", e.target.value)} />
                      <button type="button" className="danger-button" onClick={() => removeNestedItem("hours", index)} disabled={siteForm.hours.length === 1}><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
                <button type="button" className="secondary-button inline-action" onClick={() => addNestedItem("hours", { day: "", time: "" })}><Plus size={18} /> Tambah Jam</button>
              </section>

              <section className="editor-section">
                <div className="editor-section-title">
                  <span>05</span>
                  <div>
                    <h4>Gambar per section</h4>
                    <p>Foto pertama untuk hero, foto kedua untuk login, foto ketiga untuk pengalaman, dan semuanya tampil di galeri.</p>
                  </div>
                </div>
                <div className="photo-editor-grid">
                  {siteForm.photos.map((photo, index) => (
                    <div className="photo-editor-item" key={`photo-${index}`}>
                      <div className="photo-preview">
                        {photo.url ? <img src={photo.url} alt={`Preview gambar section ${index + 1}`} /> : <span>Preview</span>}
                      </div>
                      <label>{["Hero", "Login", "Pengalaman"][index] || `Galeri ${index + 1}`}</label>
                      <input required placeholder="URL gambar" value={photo.url} onChange={(e) => updateNestedList("photos", index, "url", e.target.value)} />
                      <label className="upload-button">
                        <Upload size={17} /> Upload gambar
                        <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(index, e.target.files?.[0])} />
                      </label>
                      <button type="button" className="danger-button wide-button" onClick={() => removeNestedItem("photos", index)} disabled={siteForm.photos.length === 1}><Trash2 size={16} /> Hapus Gambar</button>
                    </div>
                  ))}
                </div>
                <button type="button" className="secondary-button inline-action" onClick={() => addNestedItem("photos", { url: "" })}><Plus size={18} /> Tambah Gambar</button>
              </section>

              <button className="primary-button bottom-save"><Save size={18} /> Update Tampilan Website</button>
            </form>
          )}
        </section>
      </section>
    );
  }

  if (route === "/login") {
    return (
      <main>
        {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
        <header className="site-header">
          <button className="brand brand-button" onClick={() => navigate("/")} aria-label={site.name}>
            <span className="brand-mark"><Sparkles size={22} /></span>
            <span>{site.name}</span>
          </button>
          <nav className="nav">
            <button className="text-link with-icon" onClick={() => navigate("/")}><Home size={17} /> Beranda</button>
            <a className="nav-cta" href={whatsappUrl}>WhatsApp</a>
          </nav>
        </header>

        {!session ? (
          <section className="login-page">
            <div className="login-photo">
              <img src={photos[1] || photos[0]} alt="Dokter gigi merawat pasien di klinik" />
              <div>
                <p className="eyebrow"><UserCog size={16} /> Owner dan admin</p>
                <h1>Panel klinik untuk tim internal.</h1>
                <p>Masuk untuk memantau reservasi, pesan pasien, user, dan tampilan website.</p>
              </div>
            </div>

            <form className="login-box login-page-box" onSubmit={submitLogin}>
              <Lock />
              <h2>Login</h2>
              <input required type="email" placeholder="Email admin/owner" value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} />
              <input required type="password" placeholder="Password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} />
              <button className="primary-button" type="submit">Masuk</button>
              {errorNotice && <p className="form-error">{errorNotice}</p>}
              <p className="login-hint">Owner: owner@senyumdental.test / ChangeMe123!</p>
              <p className="login-hint">Admin: admin@senyumdental.test / Admin12345!</p>
            </form>
          </section>
        ) : renderDashboard()}
      </main>
    );
  }

  if (license && !license.active) {
    return (
      <main>
        <header className="site-header">
          <button className="brand brand-button" onClick={() => navigate("/login")} aria-label={site.name}>
            <span className="brand-mark"><Sparkles size={22} /></span>
            <span>{site.name}</span>
          </button>
          <nav className="nav">
            <button className="text-link with-icon" onClick={() => navigate("/login")}><Lock size={17} /> Login</button>
          </nav>
        </header>
        <section className="license-block-page">
          <ShieldCheck size={42} />
          <h1>Token license sudah habis.</h1>
          <p>Seluruh halaman dikunci sementara. Silakan login sebagai owner untuk memperbarui token license.</p>
          <button className="primary-button" onClick={() => navigate("/login")}><Lock size={18} /> Login Owner</button>
        </section>
      </main>
    );
  }

  return (
    <main>
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      <header className="site-header">
        <a className="brand" href="#home" aria-label={site.name}>
          <span className="brand-mark"><Sparkles size={22} /></span>
          <span>{site.name}</span>
        </a>
        <button className="icon-button mobile-only" onClick={() => setMenuOpen(!menuOpen)} aria-label="Buka menu">
          {menuOpen ? <X /> : <Menu />}
        </button>
        <nav className={menuOpen ? "nav open" : "nav"}>
          <a href="#services">Layanan</a>
          <a href="#experience">Pengalaman</a>
          <a href="#booking">Reservasi</a>
          <button className="text-link" onClick={() => navigate("/login")}>Login</button>
          <a className="nav-cta" href={whatsappUrl}>WhatsApp</a>
        </nav>
      </header>

      <section id="home" className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><Star size={16} /> Terhubung Google Business Listing</p>
          <h1>{site.name}</h1>
          <p>{site.tagline}</p>
          <div className="hero-actions">
            <a className="primary-button" href="#booking"><CalendarDays size={18} /> Buat Janji</a>
            <a className="secondary-button" href={site.mapsUrl} target="_blank" rel="noreferrer"><MapPin size={18} /> Lihat Maps</a>
          </div>
          <div className="stats-row">
            {[["15 menit", "respon reservasi"], [site.rating, "rating listing"], [site.reviewCount, "ulasan pasien"]].map(([value, label]) => (
              <div key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="hero-visual photo-hero" aria-label="Foto klinik gigi modern">
          <img src={photos[0]} alt="Ruang perawatan gigi modern" />
          <div className="hero-badge">
            <Star size={18} />
            <span>Suasana klinik modern dan higienis</span>
          </div>
        </div>
      </section>

      <section className="info-strip" aria-label="Informasi klinik">
        <div><MapPin /><span>{site.address}</span></div>
        <div><Phone /><span>{site.phone}</span></div>
        <div><Mail /><span>{site.email}</span></div>
      </section>

      <section id="services" className="section">
        <div className="section-heading">
          <p className="eyebrow"><Stethoscope size={16} /> Layanan klinik</p>
          <h2>Perawatan lengkap dengan alur yang terasa personal.</h2>
        </div>
        <div className="service-grid">
          {(site.services || []).map((service) => (
            <article className="service-card" key={service.title}>
              <CheckCircle2 />
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="experience" className="split-section">
        <img src={photos[2] || photos[0]} alt="Konsultasi dokter gigi dengan pasien" />
        <div>
          <p className="eyebrow"><ShieldCheck size={16} /> Standar profesional</p>
          <h2>Ruang perawatan dibuat tenang, higienis, dan mudah dipercaya.</h2>
          <p>Klinik dirancang untuk pasien keluarga, pekerja sibuk, dan pasien estetik yang ingin keputusan perawatan jelas sejak konsultasi pertama.</p>
          <div className="hours">
            {(site.hours || []).map(([day, time]) => (
              <div key={day}><span>{day}</span><strong>{time}</strong></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section photo-section">
        <div className="section-heading">
          <p className="eyebrow"><Sparkles size={16} /> Foto referensi</p>
          <h2>Visual klinik yang terasa nyata dan dipercaya.</h2>
        </div>
        <div className="photo-grid">
          {photos.slice(0, 3).map((photo, index) => (
            <figure key={photo}>
              <img src={photo} alt={`Foto klinik ${index + 1}`} />
              <figcaption>{["Ruang Perawatan", "Perawatan Pasien", "Konsultasi"][index] || "Klinik"}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section id="booking" className="booking-section">
        <form className="panel" onSubmit={submitBooking}>
          <p className="eyebrow"><ClipboardList size={16} /> Reservasi</p>
          <h2>Jadwalkan kunjungan</h2>
          <input required placeholder="Nama lengkap" value={booking.name} onChange={(e) => setBooking({ ...booking, name: e.target.value })} />
          <input required placeholder="Nomor WhatsApp" value={booking.phone} onChange={(e) => setBooking({ ...booking, phone: e.target.value })} />
          <select value={booking.service} onChange={(e) => setBooking({ ...booking, service: e.target.value })}>
            {(site.services || []).map((service) => <option key={service.title}>{service.title}</option>)}
          </select>
          <input required type="datetime-local" value={booking.date} onChange={(e) => setBooking({ ...booking, date: e.target.value })} />
          <textarea placeholder="Keluhan atau catatan singkat" value={booking.message} onChange={(e) => setBooking({ ...booking, message: e.target.value })} />
          <button className="primary-button" type="submit"><CalendarDays size={18} /> Kirim Reservasi</button>
          {notice && <p className="success-notice">{notice}</p>}
          {errorNotice && <p className="form-error">{errorNotice}</p>}
        </form>

        <form className="panel dark-panel" onSubmit={submitContact}>
          <p className="eyebrow"><Mail size={16} /> Email klinik</p>
          <h2>Kirim pertanyaan</h2>
          <input required placeholder="Nama" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} />
          <input required type="email" placeholder="Email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
          <textarea required placeholder="Pesan" value={contact.message} onChange={(e) => setContact({ ...contact, message: e.target.value })} />
          <button className="secondary-button light" type="submit"><Mail size={18} /> Kirim Email</button>
          {notice && <p className="notice">{notice}</p>}
          {errorNotice && <p className="notice error-text">{errorNotice}</p>}
        </form>
      </section>

      <footer>
        <strong>{site.name}</strong>
        <span>Data listing: <a href={site.mapsUrl} target="_blank" rel="noreferrer">Google Maps</a></span>
      </footer>
    </main>
  );
}

function Toast({ toast, onClose }) {
  return (
    <div className={toast.type === "error" ? "toast-popup error" : "toast-popup success"} role="status">
      <div>
        <strong>{toast.type === "error" ? "Gagal" : "Berhasil"}</strong>
        <span>{toast.message}</span>
      </div>
      <button type="button" onClick={onClose} aria-label="Tutup notifikasi"><X size={16} /></button>
    </div>
  );
}

function AdminTable({ rows, columns }) {
  if (!rows.length) return <p>Belum ada data.</p>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => <td key={column}>{row[column]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;

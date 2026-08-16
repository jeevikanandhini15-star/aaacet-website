// api.js — shared frontend helper to talk to the real backend
const API = "";

function getToken(){ return localStorage.getItem("aaacet_token"); }
function getRole(){ return localStorage.getItem("aaacet_role"); }
function getUser(){ try{ return JSON.parse(localStorage.getItem("aaacet_user")||"null"); }catch{ return null; } }
function setSession(token, role, user){
  localStorage.setItem("aaacet_token", token);
  localStorage.setItem("aaacet_role", role);
  localStorage.setItem("aaacet_user", JSON.stringify(user));
}
function clearSession(){
  localStorage.removeItem("aaacet_token");
  localStorage.removeItem("aaacet_role");
  localStorage.removeItem("aaacet_user");
}
function logout(){ clearSession(); window.location.href = "index.html"; }

async function apiFetch(path, opts = {}){
  const headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
  const token = getToken();
  if (token) headers["Authorization"] = "Bearer " + token;
  const res = await fetch(API + path, Object.assign({}, opts, { headers }));
  let data = null;
  try { data = await res.json(); } catch { /* no body */ }
  if (!res.ok) throw new Error((data && data.error) || "Something went wrong. Please try again.");
  return data;
}

function requireRole(role, loginPage){
  if (getRole() !== role) { window.location.href = loginPage; }
}

function qs(sel, ctx=document){ return ctx.querySelector(sel); }
function qsa(sel, ctx=document){ return [...ctx.querySelectorAll(sel)]; }
function getParam(name){ return new URLSearchParams(location.search).get(name); }

function renderQR(targetEl, text){
  if(!targetEl) return;
  targetEl.innerHTML = "";
  if (window.QRCode) {
    new QRCode(targetEl, { text, width: 170, height: 170, colorDark: "#181316", colorLight: "#ffffff" });
  } else {
    targetEl.textContent = text;
  }
}

function bannerFor(type){
  const map = { Symposium:"bg1", Workshop:"bg2", Sports:"bg3", Cultural:"bg4" };
  return map[type] || "bg1";
}

document.addEventListener("DOMContentLoaded", () => {
  const path = location.pathname.split("/").pop() || "index.html";
  qsa(".nav-links a").forEach(a => { if (a.getAttribute("href") === path) a.classList.add("active"); });

  // update nav login buttons if already logged in
  const role = getRole(), user = getUser();
  const navCta = qs(".nav-cta");
  if (navCta && role === "student" && user) {
    navCta.innerHTML = `<a href="student-dashboard.html" class="btn btn-maroon">👤 ${user.name.split(" ")[0]}</a><a href="#" onclick="logout();return false;" class="btn btn-outline">Logout</a>`;
  }
});

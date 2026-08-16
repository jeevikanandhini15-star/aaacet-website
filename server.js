// server.js — AAACET Event Management full backend
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "aaacet_dev_secret_change_this_in_production";

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ---------- Helpers ----------
function sign(payload) { return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" }); }
function auth(roles = []) {
  return (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Login required." });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (roles.length && !roles.includes(decoded.role)) return res.status(403).json({ error: "Not authorized." });
      req.user = decoded;
      next();
    } catch {
      return res.status(401).json({ error: "Invalid or expired session. Please login again." });
    }
  };
}
function genPassId(eventId, registerNo) {
  return `EVT${eventId}-${registerNo}`.toUpperCase();
}
function genSeat() {
  return "B-" + Math.floor(100 + Math.random() * 899);
}

// =========================================================
// AUTH — STUDENT
// =========================================================
app.post("/api/auth/student/register", (req, res) => {
  const { name, register_no, department, year, section, gender, mobile, email, password } = req.body;
  if (!name || !register_no || !department || !year || !mobile || !email || !password) {
    return res.status(400).json({ error: "Please fill all required fields." });
  }
  const dup = db.prepare("SELECT id FROM students WHERE register_no=? OR email=?").get(register_no, email);
  if (dup) return res.status(409).json({ error: "Register number or email already registered." });

  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare(`INSERT INTO students (name,register_no,department,year,section,gender,mobile,email,password_hash)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(name, register_no, department, year, section || "", gender || "", mobile, email, hash);

  const token = sign({ id: info.lastInsertRowid, role: "student", name, register_no });
  res.json({ token, user: { id: info.lastInsertRowid, name, register_no, department, year, email } });
});

app.post("/api/auth/student/login", (req, res) => {
  const { register_no, email, password } = req.body;
  const student = db.prepare("SELECT * FROM students WHERE register_no=? OR email=?").get(register_no || "", email || "");
  if (!student || !bcrypt.compareSync(password || "", student.password_hash)) {
    return res.status(401).json({ error: "Invalid credentials." });
  }
  const token = sign({ id: student.id, role: "student", name: student.name, register_no: student.register_no });
  res.json({ token, user: { id: student.id, name: student.name, register_no: student.register_no, department: student.department, year: student.year, email: student.email } });
});

// =========================================================
// AUTH — STAFF
// =========================================================
app.post("/api/auth/staff/login", (req, res) => {
  const { staff_id, email, password } = req.body;
  const staff = db.prepare("SELECT * FROM staff WHERE staff_id=? AND email=?").get(staff_id || "", email || "");
  if (!staff || !bcrypt.compareSync(password || "", staff.password_hash)) {
    return res.status(401).json({ error: "Invalid staff credentials." });
  }
  const token = sign({ id: staff.id, role: "staff", name: staff.name, staff_id: staff.staff_id, department: staff.department });
  res.json({ token, user: { id: staff.id, name: staff.name, staff_id: staff.staff_id, department: staff.department, designation: staff.designation } });
});

// =========================================================
// AUTH — ADMIN
// =========================================================
app.post("/api/auth/admin/login", (req, res) => {
  const { username, password } = req.body;
  const admin = db.prepare("SELECT * FROM admins WHERE username=?").get(username || "");
  if (!admin || !bcrypt.compareSync(password || "", admin.password_hash)) {
    return res.status(401).json({ error: "Invalid admin credentials." });
  }
  const token = sign({ id: admin.id, role: "admin", username: admin.username });
  res.json({ token, user: { username: admin.username } });
});

// =========================================================
// EVENTS
// =========================================================
app.get("/api/events", (req, res) => {
  const events = db.prepare("SELECT * FROM events ORDER BY event_date").all();
  res.json(events);
});

app.get("/api/events/:id", (req, res) => {
  const event = db.prepare("SELECT * FROM events WHERE id=?").get(req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found." });
  res.json(event);
});

app.post("/api/events", auth(["staff", "admin"]), (req, res) => {
  const b = req.body;
  if (!b.name || !b.department || !b.type || !b.event_date) return res.status(400).json({ error: "Missing required fields." });
  const info = db.prepare(`INSERT INTO events (name,department,type,event_date,event_time,venue,fee,seats_total,about,last_date,banner,created_by_staff_id)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    b.name, b.department, b.type, b.event_date, b.event_time || "", b.venue || "", b.fee || 0,
    b.seats_total || 100, b.about || "", b.last_date || "", b.banner || "bg1",
    req.user.role === "staff" ? req.user.id : null
  );
  res.json({ id: info.lastInsertRowid });
});

app.put("/api/events/:id", auth(["staff", "admin"]), (req, res) => {
  const b = req.body;
  db.prepare(`UPDATE events SET name=?,department=?,type=?,event_date=?,event_time=?,venue=?,fee=?,seats_total=?,about=?,last_date=?,banner=?,status=? WHERE id=?`)
    .run(b.name, b.department, b.type, b.event_date, b.event_time, b.venue, b.fee, b.seats_total, b.about, b.last_date, b.banner, b.status || "upcoming", req.params.id);
  res.json({ ok: true });
});

app.delete("/api/events/:id", auth(["admin"]), (req, res) => {
  db.prepare("DELETE FROM events WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

// =========================================================
// REGISTRATIONS (student registers for an event)
// =========================================================
app.post("/api/registrations", auth(["student"]), (req, res) => {
  const { event_id } = req.body;
  const event = db.prepare("SELECT * FROM events WHERE id=?").get(event_id);
  if (!event) return res.status(404).json({ error: "Event not found." });
  if (event.seats_taken >= event.seats_total) return res.status(400).json({ error: "No seats available." });

  const already = db.prepare("SELECT id FROM registrations WHERE student_id=? AND event_id=? AND status!='cancelled'").get(req.user.id, event_id);
  if (already) return res.status(409).json({ error: "You have already registered for this event." });

  const info = db.prepare("INSERT INTO registrations (student_id,event_id,status) VALUES (?,?,'pending_payment')").run(req.user.id, event_id);
  res.json({ registration_id: info.lastInsertRowid, event });
});

app.get("/api/registrations/me", auth(["student"]), (req, res) => {
  const rows = db.prepare(`
    SELECT r.*, e.name as event_name, e.fee, e.department, e.event_date, e.event_time, e.venue,
           p.txn_id, p.status as payment_status
    FROM registrations r
    JOIN events e ON e.id=r.event_id
    LEFT JOIN payments p ON p.registration_id=r.id
    WHERE r.student_id=? ORDER BY r.id DESC`).all(req.user.id);
  res.json(rows);
});

app.get("/api/registrations/:id", auth(["student", "staff", "admin"]), (req, res) => {
  const row = db.prepare(`
    SELECT r.*, e.name as event_name, e.fee, e.department, e.type, e.event_date, e.event_time, e.venue,
           s.name as student_name, s.register_no, s.department as student_department, s.year, s.mobile, s.email,
           p.txn_id, p.status as payment_status
    FROM registrations r
    JOIN events e ON e.id=r.event_id
    JOIN students s ON s.id=r.student_id
    LEFT JOIN payments p ON p.registration_id=r.id
    WHERE r.id=?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: "Registration not found." });
  if (req.user.role === "student" && row.student_id !== req.user.id) return res.status(403).json({ error: "Not authorized." });
  res.json(row);
});

// Staff/Admin: list all registrations (optionally filter by event)
app.get("/api/registrations", auth(["staff", "admin"]), (req, res) => {
  const { event_id } = req.query;
  let sql = `
    SELECT r.*, e.name as event_name, s.name as student_name, s.register_no, s.department as student_department,
           p.txn_id, p.status as payment_status, p.amount
    FROM registrations r
    JOIN events e ON e.id=r.event_id
    JOIN students s ON s.id=r.student_id
    LEFT JOIN payments p ON p.registration_id=r.id`;
  const params = [];
  if (event_id) { sql += " WHERE r.event_id=?"; params.push(event_id); }
  sql += " ORDER BY r.id DESC";
  res.json(db.prepare(sql).all(...params));
});

// =========================================================
// PAYMENTS
// =========================================================
app.post("/api/registrations/:id/payment", auth(["student"]), (req, res) => {
  const { txn_id, amount, payment_date, payment_time } = req.body;
  const reg = db.prepare("SELECT * FROM registrations WHERE id=?").get(req.params.id);
  if (!reg || reg.student_id !== req.user.id) return res.status(404).json({ error: "Registration not found." });
  if (!txn_id) return res.status(400).json({ error: "Transaction ID is required." });

  db.prepare("INSERT INTO payments (registration_id,txn_id,amount,payment_date,payment_time,status) VALUES (?,?,?,?,?,'pending')")
    .run(req.params.id, txn_id, amount, payment_date || "", payment_time || "");
  db.prepare("UPDATE registrations SET status='pending_verification' WHERE id=?").run(req.params.id);
  res.json({ ok: true, message: "Payment submitted. Waiting for admin/staff verification." });
});

// Staff/Admin verifies a payment -> confirms registration + generates QR pass
app.post("/api/registrations/:id/verify", auth(["staff", "admin"]), (req, res) => {
  const reg = db.prepare("SELECT * FROM registrations WHERE id=?").get(req.params.id);
  if (!reg) return res.status(404).json({ error: "Registration not found." });
  const student = db.prepare("SELECT * FROM students WHERE id=?").get(reg.student_id);
  const event = db.prepare("SELECT * FROM events WHERE id=?").get(reg.event_id);

  const passId = genPassId(event.id, student.register_no);
  const seat = genSeat();
  db.prepare("UPDATE registrations SET status='verified', seat_no=?, pass_id=? WHERE id=?").run(seat, passId, reg.id);
  db.prepare("UPDATE payments SET status='verified', verified_by=? WHERE registration_id=?").run(req.user.name || req.user.username, reg.id);
  db.prepare("UPDATE events SET seats_taken = seats_taken + 1 WHERE id=?").run(event.id);

  res.json({ ok: true, pass_id: passId, seat_no: seat });
});

app.post("/api/registrations/:id/reject", auth(["staff", "admin"]), (req, res) => {
  db.prepare("UPDATE payments SET status='rejected' WHERE registration_id=?").run(req.params.id);
  db.prepare("UPDATE registrations SET status='pending_payment' WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

// =========================================================
// ADMIN — dashboard stats & management
// =========================================================
app.get("/api/admin/stats", auth(["admin"]), (req, res) => {
  const totalStudents = db.prepare("SELECT COUNT(*) c FROM students").get().c;
  const totalStaff = db.prepare("SELECT COUNT(*) c FROM staff").get().c;
  const totalEvents = db.prepare("SELECT COUNT(*) c FROM events").get().c;
  const totalRegs = db.prepare("SELECT COUNT(*) c FROM registrations WHERE status='verified'").get().c;
  const pendingVerification = db.prepare("SELECT COUNT(*) c FROM registrations WHERE status='pending_verification'").get().c;
  const totalPayments = db.prepare("SELECT COALESCE(SUM(amount),0) s FROM payments WHERE status='verified'").get().s;
  const pendingPayments = db.prepare("SELECT COALESCE(SUM(amount),0) s FROM payments WHERE status='pending'").get().s;
  res.json({ totalStudents, totalStaff, totalEvents, totalRegs, pendingVerification, totalPayments, pendingPayments });
});

app.get("/api/admin/students", auth(["admin"]), (req, res) => {
  res.json(db.prepare("SELECT id,name,register_no,department,year,mobile,email,created_at FROM students ORDER BY id DESC").all());
});
app.get("/api/admin/staff", auth(["admin"]), (req, res) => {
  res.json(db.prepare("SELECT id,staff_id,name,department,designation,email FROM staff ORDER BY id DESC").all());
});
app.post("/api/admin/staff", auth(["admin"]), (req, res) => {
  const { staff_id, name, department, designation, email, password } = req.body;
  if (!staff_id || !name || !department || !email || !password) return res.status(400).json({ error: "Missing fields." });
  const hash = bcrypt.hashSync(password, 10);
  try {
    const info = db.prepare("INSERT INTO staff (staff_id,name,department,designation,email,password_hash) VALUES (?,?,?,?,?,?)")
      .run(staff_id, name, department, designation || "", email, hash);
    res.json({ id: info.lastInsertRowid });
  } catch {
    res.status(409).json({ error: "Staff ID or email already exists." });
  }
});

// Notifications
app.get("/api/notifications", (req, res) => {
  res.json(db.prepare("SELECT * FROM notifications ORDER BY id DESC LIMIT 20").all());
});
app.post("/api/notifications", auth(["staff", "admin"]), (req, res) => {
  const { title, message, audience } = req.body;
  db.prepare("INSERT INTO notifications (audience,title,message) VALUES (?,?,?)").run(audience || "all", title, message || "");
  res.json({ ok: true });
});

// Fallback to index.html for direct page loads
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(__dirname, "public", req.path === "/" ? "index.html" : req.path), (err) => {
    if (err) res.status(404).sendFile(path.join(__dirname, "public", "index.html"));
  });
});

app.listen(PORT, () => {
  console.log(`\n✅ AAACET server running at http://localhost:${PORT}`);
  console.log(`   Admin login:  admin / admin123`);
  console.log(`   Staff login:  STAFF1025 / karthik.r@aaacet.ac.in / staff123\n`);
});

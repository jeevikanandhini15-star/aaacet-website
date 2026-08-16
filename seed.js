// seed.js — run once with `npm run seed` to create default admin/staff/events
const db = require("./db");
const bcrypt = require("bcryptjs");

function upsertAdmin(username, password) {
  const exists = db.prepare("SELECT id FROM admins WHERE username=?").get(username);
  if (!exists) {
    db.prepare("INSERT INTO admins (username, password_hash) VALUES (?,?)")
      .run(username, bcrypt.hashSync(password, 10));
    console.log(`Admin created -> username: ${username} / password: ${password}`);
  } else {
    console.log("Admin already exists:", username);
  }
}

function upsertStaff(staffId, name, department, designation, email, password) {
  const exists = db.prepare("SELECT id FROM staff WHERE staff_id=?").get(staffId);
  if (!exists) {
    db.prepare(`INSERT INTO staff (staff_id,name,department,designation,email,password_hash)
      VALUES (?,?,?,?,?,?)`).run(staffId, name, department, designation, email, bcrypt.hashSync(password, 10));
    console.log(`Staff created -> ${staffId} / ${email} / password: ${password}`);
  }
}

function upsertEvent(e) {
  const exists = db.prepare("SELECT id FROM events WHERE name=?").get(e.name);
  if (!exists) {
    db.prepare(`INSERT INTO events (name,department,type,event_date,event_time,venue,fee,seats_total,about,last_date,banner)
      VALUES (@name,@department,@type,@event_date,@event_time,@venue,@fee,@seats_total,@about,@last_date,@banner)`).run(e);
    console.log("Event created:", e.name);
  }
}

upsertAdmin("admin", "admin123");
upsertStaff("STAFF1025", "Dr. R. Karthik", "Computer Science and Engineering", "Associate Professor", "karthik.r@aaacet.ac.in", "staff123");

upsertEvent({
  name: "TechX Symposium 2026", department: "Department of Computer Science and Engineering", type: "Symposium",
  event_date: "15 March 2026", event_time: "09:00 AM - 04:00 PM", venue: "Main Auditorium, AAACET",
  fee: 200, seats_total: 300, about: "National level technical symposium with competitions, workshops and expert talks.",
  last_date: "10 March 2026", banner: "bg1"
});
upsertEvent({
  name: "AI Workshop", department: "Department of AIDS", type: "Workshop",
  event_date: "25 February 2026", event_time: "10:00 AM - 01:00 PM", venue: "Computer Lab 1",
  fee: 150, seats_total: 80, about: "Hands-on workshop on AI/ML fundamentals with live demos.",
  last_date: "20 February 2026", banner: "bg2"
});
upsertEvent({
  name: "Annual Sports Day", department: "Physical Education Department", type: "Sports",
  event_date: "05 May 2026", event_time: "08:00 AM - 05:00 PM", venue: "College Ground",
  fee: 100, seats_total: 500, about: "Athletics, track & field and team sports events for all departments.",
  last_date: "28 April 2026", banner: "bg3"
});
upsertEvent({
  name: "Annual Day 2026", department: "Cultural Committee", type: "Cultural",
  event_date: "20 April 2026", event_time: "05:00 PM - 09:00 PM", venue: "Auditorium",
  fee: 250, seats_total: 600, about: "Aarohan - Annual Day celebration with performances and awards.",
  last_date: "15 April 2026", banner: "bg4"
});

console.log("\nSeed complete. Default admin login: admin / admin123");
console.log("Default staff login: STAFF1025 / karthik.r@aaacet.ac.in / staff123");

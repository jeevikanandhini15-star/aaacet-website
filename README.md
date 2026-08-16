# AAA College of Engineering and Technology — Event Management System

Idhu oru **real, working website** — demo illa. Node.js backend + SQLite database vachu build panniruken. Students real ah account create pannalam, events ku register pannalam, payment submit pannalam, admin/staff verify pannuvanga, appuram QR pass automatic ah kedaikum.

---

## 🚀 Run panna eppadi (Local Computer la)

### Step 1: Node.js install pannunga (illana)
https://nodejs.org — LTS version download pannunga (idhu free).

### Step 2: Terminal open pannunga, indha folder ku poyi:
```
cd college-site-full
```

### Step 3: Dependencies install pannunga:
```
npm install
```

### Step 4: Database ready pannunga (admin, staff, sample events create aagum):
```
npm run seed
```

### Step 5: Server start pannunga:
```
npm start
```

Terminal la ippadi varum:
```
✅ AAACET server running at http://localhost:3000
```

### Step 6: Browser la open pannunga:
```
http://localhost:3000
```

Ready! Ippo website work aaguthu real database kooda.

---

## 🔑 Default Login Details

| Role | Username/ID | Email | Password |
|---|---|---|---|
| **Admin** | admin | — | admin123 |
| **Staff** | STAFF1025 | karthik.r@aaacet.ac.in | staff123 |
| **Student** | — | Puthusa "Register Now" panni account create pannunga | — |

⚠️ **Production ku podradhukku munnadi** — `admin123` mathiri default passwords ah maathidunga (`seed.js` file la edit pannalam).

---

## 🌍 Yellarum use pannanumna (Internet la host pannanum)

Ippo idhu `localhost` la mattum run aaguthu — **unga computer mattum** access pannum. College students/staff ellarum use pannanumna, idha oru server la **deploy** pannanum. Free options:

1. **Render.com** (recommended, free tier irukku)
2. **Railway.app**
3. Unga college itself oru server/hosting kudutha, adhula run pannalam

Deploy panna: `college-site-full` folder muzhusa upload pannunga (GitHub la push pannitu Render/Railway kooda connect pannalam), `npm install && npm run seed && npm start` run aagum madhiri configure pannunga.

Idha eppadi deploy pandradhu nu step-by-step venumna, sollunga — naan help pannuren.

---

## 📁 What's inside

```
college-site-full/
  server.js         → Backend API (Express)
  db.js              → Database schema (SQLite)
  seed.js            → Creates default admin/staff/events
  package.json       → Dependencies
  aaacet.db          → Your database file (auto-created, DON'T delete once you have real data!)
  public/            → All website pages (HTML/CSS/JS)
    index.html, events.html, event-details.html
    student-register.html, student-login.html, student-dashboard.html
    staff-login.html, staff-dashboard.html
    admin-login.html, admin-dashboard.html
    registration.html, payment.html, success.html
    gallery.html
```

---

## ✅ Eppadi Work Aaguthu (Flow)

1. **Student** → "Register Now" → account create pannuvanga (real DB la save aagum)
2. **Login** → Events page → event select pannunga → Register
3. **Payment page** → UPI QR + Transaction ID submit pannunga → status: "Waiting for Verification"
4. **Staff/Admin login** → Dashboard la pending payments list therium → "Verify" click pannunga
5. **Student** → dashboard refresh pannina → QR Entry Pass ready!

Ella data-um (students, events, registrations, payments) **`aaacet.db`** file la permanent ah save aagum. Server restart pannalum data poidathu.

---

## ⚠️ Important Notes

- Idhu **real payment gateway illa** — UPI QR scan pannitu manual ah pay pannanum, transaction ID admin verify pannanum (mock/manual verification system).
- Real production site ku, `server.js` la irukra `JWT_SECRET` maathanum, HTTPS setup pannanum, `.env` file la secrets vekkanum.
- Konjam features (certificates, email notifications, attendance QR scanning) inaiku illa — venumna sollunga, add pannuren.

---

Doubt edhachum irundha, illa innum features venumna kelunga! 🎓

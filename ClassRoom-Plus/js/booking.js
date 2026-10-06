const classrooms = [
    { id: "101", name: "Classroom CS6", capacity: 100, facilities: ["Projector"] },
    { id: "102", name: "Classroom CS7", capacity: 100, facilities: ["Projector"] },
    { id: "103", name: "Classroom CS8", capacity: 100, facilities: ["Projector"] },
    { id: "104", name: "Classroom CS9", capacity: 100, facilities: ["Smart Board"] },
    { id: "105", name: "Classroom TT86", capacity: 65, facilities: ["Smart Board"] },
    { id: "201", name: "BCA Computer Lab", capacity: 40, facilities: ["Projector", "Computer"] },
    { id: "202", name: "Msc Computer Lab", capacity: 30, facilities: ["Computer", "Projector"] },
    { id: "203", name: "Electronics Lab", capacity: 30, facilities: ["Computer", "Projector"] },
    { id: "204", name: "Mathematics Lab", capacity: 30, facilities: ["Computer", "Projector"] }
];

const timeSlots = [
    "08:00 AM - 09:00 AM",
    "09:00 AM - 10:00 AM",
    "10:00 AM - 11:00 AM",
    "11:00 AM - 12:00 PM",
    "12:00 PM - 01:00 PM",
    "02:00 PM - 03:00 PM",
    "03:00 PM - 04:00 PM"
];

function getBookings() {
    try { return JSON.parse(localStorage.getItem("classroomBookings")) || []; } catch (e) { return []; }
}

function saveBookings(bookings) {
    localStorage.setItem("classroomBookings", JSON.stringify(bookings));
}

function searchClassrooms() {
    const search = document.getElementById("roomSearch").value.toLowerCase();
    const capacity = document.getElementById("capacityFilter").value;
    const facility = document.getElementById("facilityFilter").value;
    const list = document.getElementById("roomList");
    const noRooms = document.getElementById("noRooms");

    const filtered = classrooms.filter(room =>
        room.name.toLowerCase().includes(search) &&
        (capacity === "" || room.capacity >= Number(capacity)) &&
        (facility === "" || room.facilities.includes(facility))
    );

    list.innerHTML = "";

    filtered.forEach(room => {
        list.innerHTML += `
        <div class="col-4">
            <div class="room-card">
                <div class="room-icon"><i class="bi bi-door-open"></i></div>
                <div class="room-body">
                    <div class="d-flex justify-content-between">
                        <h5 class="fw-bold">${room.name}</h5>
                        <span class="badge text-bg-light">${room.capacity} seats</span>
                    </div>
                    <p class="text-muted small">Suitable for lectures, meetings and academic activities.</p>
                    <div>${room.facilities.map(f => `<span class="facility">${f}</span>`).join("")}</div>
                    <a href="slots.html?room=${room.id}" class="btn btn-primary btn-sm mt-3">View Slots</a>
                </div>
            </div>
        </div>`;
    });

    noRooms.classList.toggle("d-none", filtered.length !== 0);
}

function populateRoomSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = '<option value="">Select classroom</option>';
    classrooms.forEach(room => {
        select.innerHTML += `<option value="${room.id}">${room.name} (${room.capacity} seats)</option>`;
    });
}

function populateSlotSelect(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = '<option value="">Select time slot</option>';
    timeSlots.forEach(slot => {
        select.innerHTML += `<option value="${slot}">${slot}</option>`;
    });
}

function isBooked(roomId, date, slot) {
    return getBookings().some(b =>
        b.roomId === roomId && b.date === date && b.slot === slot
    );
}

function hasEnded(date, slot) {
    const today = localDate();
    if (date !== today) return date < today;
    const [t, ap] = slot.split(" - ")[1].split(" ");
    let [h, m] = t.split(":").map(Number);
    if (ap === "PM" && h !== 12) h += 12;
    if (ap === "AM" && h === 12) h = 0;
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes() >= h * 60 + m;
}

function setCount(id, n) {
    const el = document.getElementById(id);
    if (!el) return;
    el.dataset.count = n;
    el.textContent = n;
    el.dispatchEvent(new CustomEvent("ux:count", { bubbles: true }));
}

function refreshSlotOptions() {
    const room = document.getElementById("bookingRoom").value;
    const date = document.getElementById("bookingDate").value;
    const sel = document.getElementById("bookingSlot");
    [...sel.options].forEach(o => {
        if (!o.value) return;
        const past = date && hasEnded(date, o.value);
        const bad = past || (date && room && isBooked(room, date, o.value));
        o.disabled = !!bad;
        o.textContent = o.value + (bad ? (past ? " (Passed)" : " (Booked)") : "");
    });
    if (sel.selectedOptions[0] && sel.selectedOptions[0].disabled) sel.value = "";
}

function fail(box, text, ids) {
    $(box).hide().html('<div class="alert alert-danger">' + text + "</div>").slideDown(250);
    document.querySelectorAll(".is-invalid").forEach(e => e.classList.remove("is-invalid"));
    (ids || []).forEach(id => { const e = document.getElementById(id); if (e && !e.value.trim()) e.classList.add("is-invalid"); });
    const f = document.querySelector(".form-card");
    f.classList.remove("shake"); void f.offsetWidth; f.classList.add("shake");
    UI.toast(text, "err");
}

function sortedBookings(list) {
    const up = [], done = [];
    list.forEach(b => (hasEnded(b.date, b.slot) ? done : up).push(b));
    const k = b => b.date + timeSlots.indexOf(b.slot);
    return up.sort((a, b) => k(a).localeCompare(k(b))).concat(done.sort((a, b) => k(b).localeCompare(k(a))));
}

function showSlots() {
    const date = document.getElementById("slotDate").value;
    const roomId = document.getElementById("slotRoom").value;
    const list = document.getElementById("slotList");

    if (!date || !roomId) {
        list.innerHTML = '<div class="col-12"><div class="alert alert-info">Select a date and classroom to view available slots.</div></div>';
        return;
    }

    list.innerHTML = "";
    let free = 0;
    timeSlots.forEach(slot => {
        const past = hasEnded(date, slot);
        const booked = past || isBooked(roomId, date, slot);
        if (!booked) free++;
        list.innerHTML += `
        <div class="col-4">
            <div class="slot-card ${booked ? "booked" : "available"}">
                <div class="d-flex justify-content-between align-items-center">
                    <strong>${slot}</strong>
                    <span class="badge ${booked ? "text-bg-danger" : "text-bg-success"}">${past ? "Passed" : booked ? "Booked" : "Available"}</span>
                </div>
                ${booked ? `<p class="text-muted small mt-2 mb-0">${past ? "This slot has already passed." : "This slot is already reserved."}</p>`
                    : `<a href="booking.html?room=${roomId}&date=${date}&slot=${encodeURIComponent(slot)}" class="btn btn-outline-primary btn-sm mt-3">Book This Slot</a>`}
            </div>
        </div>`;
    });
    const sm = document.getElementById("slotSummary");
    if (sm) sm.textContent = free + " of " + timeSlots.length + " slots available";
}

function validateBooking(event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const date = document.getElementById("bookingDate").value;
    const roomId = document.getElementById("bookingRoom").value;
    const slot = document.getElementById("bookingSlot").value;
    const purpose = document.getElementById("purpose").value;
    const message = document.getElementById("formMessage");

    if (name === "" || email === "" || date === "" || roomId === "" || slot === "" || purpose === "") {
        fail(message, "Please fill all required fields.", ["name", "email", "bookingDate", "bookingRoom", "bookingSlot", "purpose"]);
        return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        fail(message, "Please enter a valid email address.", []);
        document.getElementById("email").classList.add("is-invalid");
        return false;
    }

    if (hasEnded(date, slot)) {
        fail(message, "This time slot has already passed.", []);
        return false;
    }

    if (isBooked(roomId, date, slot)) {
        fail(message, "This classroom is already booked for the selected slot.", []);
        return false;
    }

    const booking = {
        id: Date.now(),
        name,
        email,
        date,
        roomId,
        room: classrooms.find(r => r.id === roomId).name,
        slot,
        purpose,
        description: document.getElementById("description").value.trim(),
        status: "Confirmed"
    };

    const btn = document.querySelector("#bookingForm button[type=submit]");
    if (btn.disabled) return false;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Booking...';
    setTimeout(() => {
        const bookings = getBookings();
        bookings.push(booking);
        saveBookings(bookings);
        $(message).hide().html('<div class="alert alert-success"><i class="bi bi-check-circle-fill pop"></i> <strong>Booking successful!</strong> Taking you to your bookings...</div>').slideDown(250);
        UI.toast("Booking confirmed!");
        document.getElementById("bookingForm").reset();
        setTimeout(() => window.location.href = "bookings.html", 1400);
    }, 700);
    return false;
}

function loadBookings() {
    const list = document.getElementById("bookingList");
    if (!list) return;

    const bookings = getBookings();

    if (bookings.length === 0) {
        list.innerHTML = `
        <div class="empty-state">
            <i class="bi bi-calendar-x"></i>
            <h4>No bookings yet</h4>
            <p>Your confirmed classroom bookings will appear here.</p>
            <a href="booking.html" class="btn btn-primary">Book a Classroom</a>
        </div>`;
        return;
    }

    list.innerHTML = sortedBookings(bookings).map(b => `
        <div class="booking-card" id="bk${b.id}">
            <div class="row align-items-center g-3">
                <div class="col-3"><small class="text-muted">Classroom</small><h5 class="fw-bold mb-0">${b.room}</h5></div>
                <div class="col-2"><small class="text-muted">Date</small><div>${b.date}</div></div>
                <div class="col-3"><small class="text-muted">Time</small><div>${b.slot}</div></div>
                <div class="col-2"><small class="text-muted">Purpose</small><div>${esc(b.purpose)}</div></div>
                <div class="col-2 text-end">${hasEnded(b.date, b.slot) ? '<span class="badge text-bg-secondary">Completed</span>' : '<span class="badge text-bg-success mb-2">' + b.status + '</span><br><button class="btn btn-sm btn-outline-danger" onclick="cancelBooking(' + b.id + ')">Cancel</button>'}</div>
            </div>
        </div>
    `).join("");
}

function cancelBooking(id) {
    UI.confirm("Cancel this booking?", "The slot will become available for others.").then(ok => {
        if (!ok) return;
        saveBookings(getBookings().filter(b => b.id !== id));
        $("#bk" + id).slideUp(350, loadBookings);
        UI.toast("Booking cancelled", "err");
    });
}

function loadAdminBookings() {
    const table = document.getElementById("adminBookingTable");
    const total = document.getElementById("totalBookings");
    if (!table) return;

    const bookings = getBookings();
    setCount("totalBookings", bookings.length);
    setCount("totalRooms", classrooms.length);
    const today = localDate();
    let free = 0;
    classrooms.forEach(r => timeSlots.forEach(sl => { if (!hasEnded(today, sl) && !isBooked(r.id, today, sl)) free++; }));
    setCount("availableToday", free);

    if (bookings.length === 0) {
        table.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No bookings available.</td></tr>';
        return;
    }

    table.innerHTML = bookings.slice().reverse().map(b => `
        <tr>
            <td>${esc(b.name)}</td><td>${b.room}</td><td>${b.date}</td><td>${b.slot}</td>
            <td>${esc(b.purpose)}</td><td><span class="badge text-bg-success">${b.status}</span></td>
        </tr>
    `).join("");
}

function clearAllBookings() {
    UI.confirm("Clear all bookings?", "This removes every demo booking.").then(ok => {
        if (!ok) return;
        localStorage.removeItem("classroomBookings");
        loadAdminBookings();
        UI.toast("All bookings cleared", "err");
    });
}

document.addEventListener("DOMContentLoaded", function () {
    // Classroom page
    if (document.getElementById("roomList")) searchClassrooms();

    // Availability page
    if (document.getElementById("slotRoom")) {
        populateRoomSelect("slotRoom");
        setToday("slotDate");
        const params = new URLSearchParams(window.location.search);
        if (params.get("room")) document.getElementById("slotRoom").value = params.get("room");
        showSlots();
    }

    // Booking page
    if (document.getElementById("bookingRoom")) {
        populateRoomSelect("bookingRoom");
        populateSlotSelect("bookingSlot");
        setToday("bookingDate");

        const params = new URLSearchParams(window.location.search);
        if (params.get("room")) document.getElementById("bookingRoom").value = params.get("room");
        if (params.get("date")) document.getElementById("bookingDate").value = params.get("date");
        if (params.get("slot")) document.getElementById("bookingSlot").value = params.get("slot");
    }

    // My bookings
    loadBookings();

    // Admin
    loadAdminBookings();
});

document.addEventListener("DOMContentLoaded", function () {
    $("#roomSearch").on("input", searchClassrooms);
    $("#capacityFilter,#facilityFilter").on("change", searchClassrooms);
    $("#slotDate,#slotRoom").on("change", showSlots);
    $("#bookingDate,#bookingRoom").on("change", refreshSlotOptions);
    if (document.getElementById("bookingSlot")) refreshSlotOptions();
    $(document).on("input change", ".is-invalid", function () { this.classList.remove("is-invalid"); });

    // Home page: live stats + live hero schedule
    const today = localDate();
    setCount("statRooms", classrooms.length);
    setCount("statSlots", classrooms.length * timeSlots.length);
    setCount("statBookings", getBookings().filter(b => b.date >= today).length);
    $(".schedule-item[data-room]").each(function () {
        const busy = isBooked(this.dataset.room, today, this.dataset.slot);
        $(this).find(".status").toggleClass("booked", busy).toggleClass("available", !busy).text(busy ? "Booked" : "Available");
    });
});

// Keep pages in sync when bookings change in another tab
window.addEventListener("storage", function () {
    loadBookings();
    loadAdminBookings();
    if (document.getElementById("slotRoom")) showSlots();
});

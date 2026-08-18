// FF Code Radar
// Main browser controller

const toggleBtn = document.getElementById("toggleBtn");
const notifyBtn = document.getElementById("notifyBtn");
const testBtn = document.getElementById("testBtn");

const status = document.getElementById("status");
const monitorState = document.getElementById("monitorState");

const codesBox = document.getElementById("codes");
const logBox = document.getElementById("log");

const regionSelect = document.getElementById("region");
const intervalSelect = document.getElementById("interval");

let monitoring = false;
let monitorTimer = null;
let knownCodes = new Set();


// ================================
// LOGGING
// ================================

function log(message) {
    const time = new Date().toLocaleTimeString();

    console.log(`[FF Code Radar] ${message}`);

    if (logBox) {
        logBox.textContent =
            `[${time}] ${message}\n` +
            logBox.textContent;
    }
}


// ================================
// UPDATE MONITOR UI
// ================================

function updateMonitorUI() {

    if (monitoring) {

        status.textContent = "MONITOR ONLINE";
        status.classList.remove("offline");
        status.classList.add("online");

        monitorState.textContent = "ON";

        toggleBtn.textContent = "Stop Monitor";

        log("Monitor is ONLINE.");

    } else {

        status.textContent = "MONITOR OFFLINE";
        status.classList.remove("online");
        status.classList.add("offline");

        monitorState.textContent = "OFF";

        toggleBtn.textContent = "Start Monitor";

        log("Monitor is OFFLINE.");
    }
}


// ================================
// NOTIFICATIONS
// ================================

async function enableNotifications() {

    if (!("Notification" in window)) {
        log("This browser does not support notifications.");
        return false;
    }

    if (Notification.permission === "granted") {
        log("Notifications are already enabled.");
        return true;
    }

    if (Notification.permission === "denied") {
        log("Notifications are blocked in browser settings.");
        return false;
    }

    const permission =
        await Notification.requestPermission();

    if (permission === "granted") {
        log("Browser notifications enabled.");

        notifyBtn.textContent = "Notifications Enabled";

        return true;
    }

    log("Notification permission was not granted.");

    return false;
}


// ================================
// SEND NOTIFICATION
// ================================

function sendNotification(code) {

    if (!("Notification" in window)) {
        return;
    }

    if (Notification.permission !== "granted") {
        return;
    }

    try {

        new Notification("🔥 FF Code Radar", {
            body: `New redeem code detected: ${code}`,
            icon: "icon-192.png"
        });

    } catch (error) {

        console.error(
            "Notification error:",
            error
        );
    }
}


// ================================
// VALIDATE CODE
// ================================

function isValidCode(code) {

    if (!code) {
        return false;
    }

    const clean =
        String(code)
            .trim()
            .toUpperCase();

    return /^[A-Z0-9]{10,16}$/.test(clean);
}


// ================================
// DISPLAY CODE
// ================================

function addCode(code) {

    const clean =
        String(code)
            .trim()
            .toUpperCase();

    if (!isValidCode(clean)) {
        return;
    }

    if (knownCodes.has(clean)) {
        return;
    }

    knownCodes.add(clean);

    // Remove "No newly detected codes yet."
    const empty =
        codesBox.querySelector(".empty");

    if (empty) {
        empty.remove();
    }

    const item =
        document.createElement("div");

    item.className = "code";

    item.innerHTML = `
        <div>
            <strong>${clean}</strong>
            <div class="meta">
                Detected ${new Date().toLocaleTimeString()}
            </div>
        </div>

        <button class="ghost">Copy</button>
    `;

    const copyButton =
        item.querySelector("button");

    copyButton.addEventListener(
        "click",
        async () => {

            try {

                await navigator.clipboard.writeText(clean);

                copyButton.textContent =
                    "Copied!";

                setTimeout(() => {

                    copyButton.textContent =
                        "Copy";

                }, 1500);

            } catch (error) {

                log("Could not copy code.");
            }
        }
    );

    codesBox.prepend(item);

    log(`NEW CODE DETECTED: ${clean}`);

    sendNotification(clean);
}


// ================================
// SCAN
// ================================

async function scan() {

    if (!monitoring) {
        return;
    }

    const region =
        regionSelect
            ? regionSelect.value
            : "MEA / Africa";

    log(`Scanning ${region}...`);

    /*
      This endpoint must exist on your backend
      before real public feeds can be monitored.

      Example:

      /api/codes

      The browser itself cannot magically obtain
      live redeem codes without a connected source.
    */

    try {

        const response =
            await fetch("/api/codes", {
                method: "GET",
                cache: "no-store"
            });

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }

        const data =
            await response.json();

        if (Array.isArray(data)) {

            data.forEach(addCode);

        } else if (
            data &&
            Array.isArray(data.codes)
        ) {

            data.codes.forEach(addCode);

        } else if (
            data &&
            data.code
        ) {

            addCode(data.code);
        }

    } catch (error) {

        /*
          A failed scan should NOT turn
          the monitor offline.

          The monitor remains ON and tries again
          on the next interval.
        */

        console.warn(
            "Scan source unavailable:",
            error
        );

        log(
            "No connected code feed yet. Monitor remains ONLINE."
        );
    }
}


// ================================
// START MONITOR
// ================================

async function startMonitor() {

    if (monitoring) {
        return;
    }

    log("Starting monitor...");

    monitoring = true;

    updateMonitorUI();

    await enableNotifications();

    // Scan immediately
    await scan();

    const seconds =
        Number(intervalSelect.value) || 60;

    log(
        `Automatic scanning every ${seconds} seconds.`
    );

    monitorTimer =
        setInterval(
            scan,
            seconds * 1000
        );
}


// ================================
// STOP MONITOR
// ================================

function stopMonitor() {

    if (!monitoring) {
        return;
    }

    monitoring = false;

    if (monitorTimer) {

        clearInterval(
            monitorTimer
        );

        monitorTimer = null;
    }

    updateMonitorUI();

    log("Monitor stopped.");
}


// ================================
// TOGGLE BUTTON
// ================================

toggleBtn.addEventListener(
    "click",
    () => {

        if (monitoring) {

            stopMonitor();

        } else {

            startMonitor();
        }
    }
);


// ================================
// NOTIFICATION BUTTON
// ================================

notifyBtn.addEventListener(
    "click",
    enableNotifications
);


// ================================
// TEST ALERT
// ================================

testBtn.addEventListener(
    "click",
    async () => {

        log("Testing notification system...");

        const allowed =
            await enableNotifications();

        if (!allowed) {
            log(
                "Test failed: notifications are not enabled."
            );

            return;
        }

        sendNotification(
            "TEST-CODE-1234"
        );

        log(
            "Test notification sent."
        );
    }
);


// ================================
// REGION CHANGE
// ================================

regionSelect.addEventListener(
    "change",
    () => {

        log(
            `Region changed to ${regionSelect.value}.`
        );

        if (monitoring) {
            log(
                "New region will be used on the next scan."
            );
        }
    }
);


// ================================
// INTERVAL CHANGE
// ================================

intervalSelect.addEventListener(
    "change",
    () => {

        const seconds =
            Number(intervalSelect.value);

        log(
            `Scan interval changed to ${seconds} seconds.`
        );

        if (monitoring) {

            clearInterval(
                monitorTimer
            );

            monitorTimer =
                setInterval(
                    scan,
                    seconds * 1000
                );
        }
    }
);


// ================================
// SERVICE WORKER
// ================================

async function registerServiceWorker() {

    if (!("serviceWorker" in navigator)) {

        log(
            "Service workers are not supported."
        );

        return;
    }

    try {

        await navigator.serviceWorker.register(
            "./service-worker.js"
        );

        log(
            "Service worker connected."
        );

    } catch (error) {

        console.error(
            "Service worker error:",
            error
        );

        log(
            "Service worker connection failed."
        );
    }
}


// ================================
// STARTUP
// ================================

async function initialize() {

    log(
        "FF Code Radar loaded."
    );

    updateMonitorUI();

    await registerServiceWorker();

    log(
        "System ready."
    );
}


initialize();

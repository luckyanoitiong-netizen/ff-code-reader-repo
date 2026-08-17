const $ = id => document.getElementById(id);

let running = false;
let timer = null;

// Activity log
function log(message) {
  const time = new Date().toLocaleTimeString();

  if ($("log")) {
    $("log").textContent =
      `[${time}] ${message}\n` + $("log").textContent;
  }
}

// Browser notification
async function notify(title, body) {
  if (!("Notification" in window)) {
    log("This browser does not support notifications.");
    return;
  }

  if (Notification.permission === "granted") {
    new Notification(title, {
      body: body,
      icon: "icon.png"
    });
  }
}

// Request notification permission
if ($("notifyBtn")) {
  $("notifyBtn").onclick = async () => {
    if (!("Notification" in window)) {
      alert("Your browser does not support notifications.");
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      log("✅ Notifications enabled.");
      alert("Notifications are now enabled.");
    } else {
      log("❌ Notification permission was not granted.");
    }
  };
}

// Add a detected code to the dashboard
function addCode(code, source = "Public source", region = "Unknown") {

  // Basic Free Fire-style code validation
  if (!/^[A-Z0-9]{10,20}$/.test(code)) {
    log(`Rejected invalid code: ${code}`);
    return;
  }

  const codesBox = $("codes");

  if (!codesBox) return;

  // Remove empty message
  const empty = codesBox.querySelector(".empty");

  if (empty) {
    empty.remove();
  }

  // Prevent duplicates
  const existingCodes = [...codesBox.querySelectorAll("strong")]
    .map(element => element.textContent);

  if (existingCodes.includes(code)) {
    log(`Duplicate ignored: ${code}`);
    return;
  }

  const row = document.createElement("div");

  row.className = "code";

  row.innerHTML = `
    <div>
      <strong>${code}</strong>
      <div class="meta">
        ${source} • ${region} • ${new Date().toLocaleString()}
      </div>
    </div>

    <button class="copy-code">
      Copy
    </button>
  `;

  const copyButton = row.querySelector(".copy-code");

  copyButton.addEventListener("click", async () => {

    try {
      await navigator.clipboard.writeText(code);

      copyButton.textContent = "Copied!";
      log(`📋 Code copied: ${code}`);

      setTimeout(() => {
        copyButton.textContent = "Copy";
      }, 1500);

    } catch (error) {
      log("Could not copy code automatically.");
    }
  });

  codesBox.prepend(row);

  // Alert the user
  notify(
    "🚨 NEW FREE FIRE CODE",
    `${code} has been detected.`
  );

  log(`🚨 NEW CODE: ${code}`);
}

// Test notification
if ($("testBtn")) {

  $("testBtn").onclick = () => {

    addCode(
      "AB12CD34EF56",
      "Test Alert",
      $("region")?.value || "MEA / Africa"
    );

  };

}

// Scan public sources
async function scan() {

  log("🔎 Checking configured sources...");

  /*
    IMPORTANT:

    This is where the LIVE backend will eventually connect.

    The browser itself cannot magically discover secret
    Garena codes before they are publicly released.

    Your backend should monitor legitimate public/official
    sources and return newly discovered codes.

    Example response:

    [
      {
        "code": "XXXXXXXXXXXX",
        "source": "Official Garena",
        "region": "MEA"
      }
    ]
  */

  try {

    /*
      When the backend is ready, this can become:

      const response = await fetch("/api/codes");
      const data = await response.json();

      data.forEach(item => {
        addCode(
          item.code,
          item.source,
          item.region
        );
      });
    */

    log("✅ Scan completed. No new codes detected.");

  } catch (error) {

    log("⚠️ Could not connect to monitoring server.");

  }
}

// Start / stop monitor
if ($("toggleBtn")) {

  $("toggleBtn").onclick = () => {

    running = !running;

    if (running) {

      $("monitorState").textContent = "ON";

      $("toggleBtn").textContent = "Stop Monitor";

      $("status").textContent = "MONITOR ACTIVE";

      $("status").className = "pill online";

      log("🟢 Monitoring started.");

      scan();

      const seconds =
        Number($("interval")?.value || 60);

      timer = setInterval(
        scan,
        seconds * 1000
      );

    } else {

      $("monitorState").textContent = "OFF";

      $("toggleBtn").textContent = "Start Monitor";

      $("status").textContent = "MONITOR OFFLINE";

      $("status").className = "pill offline";

      clearInterval(timer);

      timer = null;

      log("🔴 Monitoring stopped.");

    }

  };

}

// Change scanning interval
if ($("interval")) {

  $("interval").addEventListener("change", () => {

    if (!running) return;

    clearInterval(timer);

    const seconds =
      Number($("interval").value || 60);

    timer = setInterval(
      scan,
      seconds * 1000
    );

    log(`⏱️ Scan interval changed to ${seconds} seconds.`);

  });

}

// Region change
if ($("region")) {

  $("region").addEventListener("change", () => {

    log(
      `🌍 Region set to ${$("region").value}.`
    );

  });

}

// Initial system message
window.addEventListener("load", () => {

  log("⚡ FF Code Radar loaded.");

  log("Waiting for monitoring to start.");

});

const APP_URL = "/ff-code-reader/";

self.addEventListener("install", event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", event => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch (_) {}

  const title = data.title || "🚨 FF Code Radar";
  const body =
    data.body ||
    "A new Free Fire redeem code has been detected.";

  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      tag: data.code || "ff-code-radar",
      renotify: true,
      data: {
        url: data.url || APP_URL,
        code: data.code || ""
      }
    })
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();

  const target =
    event.notification.data?.url || APP_URL;

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then(clientList => {

      for (const client of clientList) {
        if ("focus" in client) {
          return client.focus();
        }
      }

      return clients.openWindow(target);
    })
  );
});

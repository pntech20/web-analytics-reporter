function initGA4(measurementId, options) {
  if (!measurementId) throw new Error("initGA4 requires a measurement ID.");

  var config = options || {};
  var script = document.createElement("script");

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };

  window.gtag("js", new Date());
  window.gtag("config", measurementId, config.gtagConfig || {});

  script.async = true;
  script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(measurementId);

  var firstScript = document.getElementsByTagName("script")[0];
  firstScript.parentNode.insertBefore(script, firstScript);
}

function trackEvent(eventName, properties) {
  if (typeof window.gtag !== "function") return false;
  window.gtag("event", eventName, properties || {});
  return true;
}

function defaultLinkLocation(anchor) {
  if (anchor.closest("header")) return "header";
  if (anchor.closest("footer")) return "footer";
  if (anchor.closest(".hero")) return "hero";
  if (anchor.closest(".download-section")) return "download_section";
  return "content";
}

function safeLinkPath(url) {
  if (url.protocol === "mailto:") return "mailto_contact";
  if (url.origin === window.location.origin) return url.pathname || "/";
  return url.hostname;
}

function installLinkEventTracking(options) {
  var config = options || {};
  var resolveEventName = config.resolveEventName;
  if (typeof resolveEventName !== "function") throw new Error("installLinkEventTracking requires resolveEventName.");

  document.addEventListener(
    "click",
    function (event) {
      var target = event.target;
      if (!target || !target.closest) return;

      var anchor = target.closest("a[href]");
      if (!anchor) return;

      var rawHref = anchor.getAttribute("href") || "";
      var url;
      try {
        url = new URL(rawHref, window.location.href);
      } catch (_) {
        return;
      }

      var eventName = resolveEventName({ anchor: anchor, rawHref: rawHref, url: url });
      if (!eventName) return;

      trackEvent(eventName, {
        link_path: safeLinkPath(url),
        link_location: config.linkLocation ? config.linkLocation(anchor) : defaultLinkLocation(anchor),
        page_path: window.location.pathname || "/"
      });
    },
    true
  );
}

if (typeof window !== "undefined") {
  window.WebAnalyticsReporter = {
    initGA4: initGA4,
    installLinkEventTracking: installLinkEventTracking,
    trackEvent: trackEvent
  };
}

if (typeof module !== "undefined") {
  module.exports = {
    initGA4,
    installLinkEventTracking,
    safeLinkPath,
    trackEvent
  };
}

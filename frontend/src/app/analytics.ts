import Analytics from "analytics";
import mixpanelPlugin from "@analytics/mixpanel";
import CookieConsent, { Cookies, getCookieConsentValue } from "react-cookie-consent";

const analyticsConfig =
  process.env.NODE_ENV === "production"
    ? document.location.hostname === "data.bioplatforms.com"
      ? {
          app: "bpaotu",
          mixpanelToken: process.env.REACT_APP_MIXPANEL_TOKEN,
        }
      : {
          app: "bpaotu-staging",
          mixpanelToken: process.env.REACT_APP_MIXPANEL_TOKEN_STAGING,
        }
    : {
        app: "bpaotu-dev",
        mixpanelToken: process.env.REACT_APP_MIXPANEL_TOKEN_DEV,
      };

const analytics = Analytics({
  app: analyticsConfig.app,
  plugins: [
    // disable all plugins by default; they will be enabled in App component if:
    // - user agrees to cookie consent
    // - user has previously agreed to cookie consent
    mixpanelPlugin({
      token: analyticsConfig.mixpanelToken,
      enabled: false,
    })
  ],
});

// this needs to be kept in sync with the plugins defined for Analytics
export const pluginsList = ['mixpanel'];

export const triggerHashedIdentify = async (email) => {
  let hashSalt = 'd260c5eb-055b-4640-966d-1f657aec34b4';

  // convert the email to a sha256 hash and use this as the analytics userId so as to not send PII to GA
  // we don't retain a record of this to examine for our own purposes since we don't care who the user is
  // just that their interactions are associated with them across different devices and sessions
  if (email && window.crypto && window.crypto.subtle) {
    window.crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(email.toLowerCase() + hashSalt)
    ).then(hashed => {
      const hashedEmail = [].map.call(
        new Uint8Array(hashed),
        b => ('00' + b.toString(16)).slice(-2)
      ).join('');

      // rather than awaiting the promise elsewhere and then firing an identify just send it here
      analytics.identify(hashedEmail, {
        uid: hashedEmail
      })
    })

    return true;
  } else {
    return null
  }
}

export default analytics;

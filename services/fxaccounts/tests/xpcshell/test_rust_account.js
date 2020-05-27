/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

"use strict";

const ROOT_URL = "https://accounts.firefox.com";
const FX_OAUTH_CLIENT_ID = "5882386c6d801776";
const FX_OAUTH_WEBCHANNEL_REDIRECT =
  "urn:ietf:wg:oauth:2.0:oob:oauth-redirect-webchannel";
const PROFILE_SCOPE = "profile";

const { RustFxAccount } = ChromeUtils.import(
  "resource://gre/modules/RustFxAccount.js"
);

add_task(async function test_begin_oauth_flow() {
  let bridge = new RustFxAccount({
    fxaServer: ROOT_URL,
    clientId: FX_OAUTH_CLIENT_ID,
    redirectUri: FX_OAUTH_WEBCHANNEL_REDIRECT,
  });
  let flow = await bridge.beginOAuthFlow([PROFILE_SCOPE]);
  Assert.ok(flow);
});

/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

"use strict";

const BLOCKED_PAGE =
  "http://example.org:8000/browser/browser/base/content/test/about/xfo_iframe.sjs";

add_task(async function test_xfo_iframe() {
  let { iframePageTab, blockedPageTab } = await setupPage(
    "iframe_page_xfo.html",
    BLOCKED_PAGE
  );

  let xfoBrowser = gBrowser.selectedTab.linkedBrowser;

  // The blocked page opened in a new window/tab
  await SpecialPowers.spawn(xfoBrowser, [BLOCKED_PAGE], async function(
    xfoBlockedPage
  ) {
    let cookieHeader = content.document.getElementById("strictCookie");
    let location = content.document.location.href;

    Assert.ok(
      cookieHeader.textContent.includes("No same site strict cookie header"),
      "Same site strict cookie has not been set"
    );
    Assert.equal(location, xfoBlockedPage, "Location of new page is correct!");
  });

  Services.cookies.removeAll();
  BrowserTestUtils.removeTab(iframePageTab);
  BrowserTestUtils.removeTab(blockedPageTab);
  BrowserTestUtils.removeTab(gBrowser.selectedTab);
});

async function setupPage(htmlPageName, blockedPage) {
  let iFramePage =
    getRootDirectory(gTestPath).replace(
      "chrome://mochitests/content",
      "http://example.com"
    ) + htmlPageName;

  // Opening the blocked page once in a new tab
  let blockedPageTab = await BrowserTestUtils.openNewForegroundTab(
    gBrowser,
    blockedPage
  );
  let blockedPageBrowser = blockedPageTab.linkedBrowser;

  let cookies = Services.cookies.getCookiesFromHost(
    "example.org",
    blockedPageBrowser.contentPrincipal.originAttributes
  );
  let strictCookie = cookies[0];

  is(
    strictCookie.value,
    "creamy",
    "Same site strict cookie has the expected value"
  );

  is(strictCookie.sameSite, 2, "The cookie is a same site strict cookie");

  // Opening the page containing the iframe
  let tab = await BrowserTestUtils.openNewForegroundTab(gBrowser, iFramePage);
  let browser = tab.linkedBrowser;

  await SpecialPowers.spawn(browser, [blockedPage], async function(
    xfoBlockedPage
  ) {
    let iframe = content.document.getElementById("theIframe");

    await ContentTaskUtils.waitForCondition(() =>
      iframe.contentDocument.body.classList.contains("neterror")
    );
  });

  let frameContext = browser.browsingContext.children[0];
  let loaded = BrowserTestUtils.waitForNewTab(gBrowser, null, true);

  // In the iframe, we see the correct error page and click on the button
  // to open the blocked page in a new window/tab
  await SpecialPowers.spawn(frameContext, [], async function() {
    let doc = content.document;
    let textLongDescription = doc.getElementById("errorLongDesc").textContent;
    Assert.ok(
      textLongDescription.includes(
        "To see this page, you need to open it in a new window."
      ),
      "Correct error message found"
    );

    let button = doc.getElementById("openInNewWindowButton");
    Assert.ok(
      button.textContent.includes("Open Site in New Window"),
      "We see the correct button to open the site in a new window"
    );
    // We click on the button
    await EventUtils.synthesizeMouseAtCenter(button, {}, content);
  });
  // We wait for the new tab to load
  await loaded;

  let iframePageTab = tab;
  return {
    iframePageTab,
    blockedPageTab,
  };
}

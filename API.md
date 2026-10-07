## Controlling the Form Builder from an independent web page using JavaScript

##### Important: For this to work, make sure that the browser settings are not blocking the display of popup windows.

The form builder web application can be invoked using JavaScript from another
web page. It can be opened in a new page/tab (sometimes referred to as the child
window). The choice of a new page or a new tab depends on the browser settings or
preferences. The newly opened form builder can be loaded with an initial
questionnaire. The parent page (sometimes referred to as the parent window) can listen
to real-time changes in the form builder as the user makes the changes to the
questionnaire. When the user clicks `Save & Close` button in the form builder page, or
close button on the browser tab, the parent window will receive a closed message with
the final modifications to the questionnaire, and the form builder window is closed.
When the user clicks the `cancel` button in the form builder page, the form builder
window is closed and the parent window will receive a canceled message.

### Important: the form builder now redirects to a different origin
While `https://formbuilder.nlm.nih.gov` remains a supported address, the requests are
now **redirected** to 
`https://lhncbc.nlm.nih.gov/formbuilder`. You can keep opening
`https://formbuilder.nlm.nih.gov`, but because the redirect lands on a different
<a href="https://developer.mozilla.org/docs/Glossary/Origin">origin</a>,
application developers must adjust the `window-open` messaging code:

* **The messages come from the redirected origin.** After the redirect the form
  builder window runs on `https://lhncbc.nlm.nih.gov`, so the messages it posts
  back arrive with `event.origin === 'https://lhncbc.nlm.nih.gov'`, not
  `https://formbuilder.nlm.nih.gov`. The `targetOrigin` you pass to `postMessage()`
  when replying must match that same origin, or the browser silently drops the
  message. (An origin is only the scheme, host, and port — never a path — so it is
  `https://lhncbc.nlm.nih.gov`, not the full `.../formbuilder` URL.)
* **Capture the origin from the first message; don't hardcode it.** Instead of
  assuming a fixed origin, read `event.origin` from the first message the form
  builder sends (`initialized`) and reuse that value as the `targetOrigin` for
  everything you post back. To trust that first message, confirm it came from the
  window you opened by comparing `event.source` with the handle returned by
  `window.open()`. This keeps working even if the redirect target changes later.

### Set up event listener
Before opening the form builder window, add an event listener to the parent
window. The form builder sends five types of messages, namely `initialized`,
`updateQuestionnaire`, `closed`, `canceled`, and `aborted`. It can also receive a message with type
`initialQuestionnaire`. The data object exchanged with the form builder consists
of two fields, `type` and `questionnaire`. The `type` is one of the above-defined
message types. The `questionnaire` is the associated questionnaire for
that message type. For the `initialized`, `canceled`, and `aborted` messages this field is undefined.
The `aborted` message has an `error` field instead (see
[Questionnaires that cannot be converted to the requested version](#questionnaires-that-cannot-be-converted-to-the-requested-version)).
Here is a code snippet to add an event listener.

```
window.addEventListener('message', handleFormBuilderMessages, true);
```

### Handle form builder events
A <a href="https://developer.mozilla.org/docs/Web/API/Window/message_event">
window event listener</a> is a callback function attached to the parent window
listening to `message` events. The callback receives an event object, where
`event.data` is the data object sent by the message emitter, in this case the
form builder. The form builder defines its own messages with `'initialized'`,
`'updateQuestionnaire'`, and `'closed'` types. The message type is in
`event.data.type`. Here is a typical handler to receive the messages from the
form builder.

```
// Address to open. https://formbuilder.nlm.nih.gov is still supported; it now
// redirects to https://lhncbc.nlm.nih.gov/formbuilder.
const fbUrl = 'https://formbuilder.nlm.nih.gov';
// The form builder's origin. It is captured from the first message it sends (see
// the 'initialized' case) rather than hardcoded, so it follows the redirect
// automatically.
let fbOrigin = null;

/**
Event handler to handle messages from form builder window.

@param: event - MessageEvent object. Read event.data.event to identify the form
  builder's message type, and expect event.data.questionnaire to contain the
  latest questionnaire from the form builder. For the 'initialized' event, the
  event.data.questionnaire is undefined.
*/
function handleFormBuilderMessages(event) {
  // Accept messages only from the window we opened. event.source refers to that
  // window and is unaffected by the redirect, so it is the reliable check — we do
  // not know the form builder's post-redirect origin until it first messages us.
  if(event.source === fbWin) {
    // Handling only form builder events.
    const eventType = event.data.type;
    
    // Receiving message: 'initialized' || 'updateQuestionnaire' || 'closed'
    switch (eventType) {
      case 'initialized':
        /*
         This is the first message from the child window.
         It indicates that the form builder is initialized and ready to
         receive the initial questionnaire. Use 'initialQuestionnaire' message to
         send the initial questionnaire.
        */

        // Capture the form builder's (possibly redirected) origin from this first
        // message, and reuse it as the targetOrigin whenever we post back.
        fbOrigin = event.origin;
        // fbWin is the object reference returned by window.open().
        fbWin.postMessage({type: 'initialQuestionnaire', questionnaire: initialQ}, fbOrigin);
        break;

      case 'updateQuestionnaire':
        // Use this to get continuous updates. The message is triggered by every
        // change in the form builder with about 0.5 second debounce.

        // Prints updated questionnaire.
        console.log(`${JSON.stringify(formBuilderMessage.questionnaire, null, 2)}`);
            
        // ...
        // Do something with formBuilderMessage.questionnaire.
        // ...

        break;

      case 'closed':
        // Triggered when the form builder window is closed.
        // Use this to get final updated questionnaire
        // ...
        // Do something with formBuilderMessage.questionnaire or any cleanup
        // ...

        break;

      case 'canceled':
        // Triggered when the user on the form builder window clicks the Cancel button.
        // Use this to discard any changes the user made to the form in this session
        // along with any cleanup.
        // ...

        break;

      case 'aborted':
        // Triggered when the user closes the form builder window while the questionnaire
        // cannot be converted to the requested fhirVersion. event.data.error has the reason.
        // The final questionnaire is not available; the last 'updateQuestionnaire' message
        // has the last questionnaire that could be sent.
        // ...

        break;

    }
  }
} 
```

### Open form builder window
After setting up the message event handler, open the form builder in a new
window. Use the <a href="https://developer.mozilla.org/docs/Web/API/Window/open">
`window.open()`</a> method of the DOM Window interface. The form builder uses the
parent window's location url to send the messages. Cross-origin (CORS) restrictions
prevent accessing the information, so the caller needs to provide the
`window.location.href` as a`referrer` parameter in the url to establish the
communication. The pathname to provide the url parameter is `/window-open`.
The `referrer` must be an absolute `http` or `https` URL. Otherwise, the form
builder ignores it, as if it was missing, and runs as a standalone application
without the window-open messages, `Save & Close`, and `Cancel`.

A new http parameter `fhirVersion` is introduced to request a particular version of
the questionnaire. The permitted values are `STU3`, `R4`, and `R5`. Any unrecognized
versions will be ignored. The default output is `R4`.

Here is an example:

```
const fbWin = window.open(fbUrl+'/window-open?referrer='+encodeURIComponent(window.location.href)+'&fhirVersion=R5', 'formBuilderWindow');
```

Opening `https://formbuilder.nlm.nih.gov/window-open?...` continues to work; the
browser follows the redirect to
`https://lhncbc.nlm.nih.gov/formbuilder/window-open?...`. Because the form
builder then runs on the `https://lhncbc.nlm.nih.gov` origin, reply with the
origin captured from its first message (`fbOrigin`) as the `postMessage`
targetOrigin — see the handler above — rather than assuming `fbUrl`.

Use `fbWin.postMessage` to send the `initialQuestionnaire` message to the child
window, as described above.

The form builder accepts messages only from the window that opened it, and only
if their origin is exactly the origin of the `referrer` URL. Send them from the
page that opened the form builder. The form builder also sends its messages
only to that origin.

### Loading with an initial questionnaire
You can load a form builder with an existing FHIR questionnaire resource. You
want to wait for the `initialized` message after opening the form builder window,
before sending the message to the form builder.

```
// fbWin is the object reference returned by window.open().
// Use 'initialQuestionnaire' message. Post to fbOrigin — the origin captured from
// the form builder's first message — so the browser delivers the message.
fbWin.postMessage({type: 'initialQuestionnaire', questionnaire: initialQ}, fbOrigin);

```

There is a working example in `/tests/window-open-test.html` on how to invoke
the application and listen to the updates. It also shows how to embed the form
builder in an iframe (see below).

### Questionnaires that cannot be converted to the requested version
If the questionnaire cannot be converted to the requested `fhirVersion`, for
example because it uses the R5-only Quantity comparator `ad` while
`fhirVersion` is `R4`, the form builder does not send it and shows an error
instead. In that case `Save & Close` shows the error again and keeps the form
builder open, so that the user can correct the questionnaire. No `closed`
message is sent until it can be converted. If the user closes the form builder
window instead (`window.open()` only), the form builder sends an `aborted`
message with the conversion error in its `error` field, and no questionnaire:

```
{type: 'aborted', error: 'Quantity comparator "ad" is supported only in FHIR R5. ...'}
```

The last `updateQuestionnaire` message has the last questionnaire that could be
sent. Like `closed`, this message is also sent when the user reloads the window,
after which the form builder sends `initialized` again.

### Embedding the form builder in an iframe
Instead of a new window, the same `/window-open` URL can be loaded in an
`<iframe>` of the parent page. The messages are the same as above, with these
differences:

* The form builder sends its messages to `window.parent`, and accepts messages
  only from `window.parent`. In the handler, compare `event.source` with
  `iframe.contentWindow` instead of the `window.open()` handle, and post the
  `initialQuestionnaire` message to `iframe.contentWindow`.
* `Save & Close` and `Cancel` send the `closed` and `canceled` messages, but the
  form builder cannot close itself. The parent page should remove or hide the
  iframe when it receives one of these messages. These messages end the
  session: the form builder sends nothing more, not even a pending
  `updateQuestionnaire` of the last edit, and ignores incoming messages. To
  start a new session, reload the iframe (set its `src` again) or replace it.
  The `aborted` message is not sent, because the form builder in an iframe is
  not closed by the user, but by the parent page.
* The notice "This page is sending changes back to the page that opened it" is
  not shown. This is deliberate: the form builder is displayed as part of the
  parent page, which the user sees as the application they are using. The form
  builder sends its messages only to the origin of the `referrer` URL, so the
  browser does not deliver them to a parent page of another origin. The parent
  page is responsible for informing its users that the form builder sends the
  questionnaire to it.
* The browser only displays the form builder in an iframe if its server allows
  framing by the parent page (`X-Frame-Options` / `Content-Security-Policy:
  frame-ancestors`). The public instance at `https://lhncbc.nlm.nih.gov/formbuilder`
  only allows the same origin, so this mode requires hosting the form builder
  yourself, e.g. on the same origin as the parent page.
* If the form builder and the parent page are on different sites, the form
  builder is a third-party iframe, so its browser storage depends on the
  browser settings. If the browser blocks third-party storage (e.g. with
  "Block third-party cookies"), the form builder still works, but does not
  remember the accepted terms of use (they are asked each time it loads) and
  does not auto save the questionnaire. Otherwise, browsers keep the storage
  of a third-party iframe separate for each site embedding it, so the accepted
  terms and the auto saved questionnaire are not shared with the form builder
  opened directly or embedded by another site. Hosting the form builder on the
  same site as the parent page avoids both.

```
const iframe = document.getElementById('formBuilderFrame');
iframe.src = fbUrl + '/window-open?referrer=' + encodeURIComponent(window.location.href) + '&fhirVersion=R4';
window.addEventListener('message', (event) => {
  if(event.source !== iframe.contentWindow) {
    return;
  }
  switch(event.data.type) {
    case 'initialized':
      iframe.contentWindow.postMessage({type: 'initialQuestionnaire', questionnaire: initialQ}, event.origin);
      break;
    case 'closed':   // event.data.questionnaire is the final questionnaire
    case 'canceled':
      iframe.remove();
      break;
  }
});
```

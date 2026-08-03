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
`https://lhncbc.nlm.nih.gov/lhcformbuilder`. You can keep opening
`https://formbuilder.nlm.nih.gov`, but because the redirect lands on a different
<a href="https://developer.mozilla.org/docs/Glossary/Origin">origin</a>,
application developers must adjust the `window-open` messaging code:

* **The messages come from the redirected origin.** After the redirect the form
  builder window runs on `https://lhncbc.nlm.nih.gov`, so the messages it posts
  back arrive with `event.origin === 'https://lhncbc.nlm.nih.gov'`, not
  `https://formbuilder.nlm.nih.gov`. The `targetOrigin` you pass to `postMessage()`
  when replying must match that same origin, or the browser silently drops the
  message. (An origin is only the scheme, host, and port — never a path — so it is
  `https://lhncbc.nlm.nih.gov`, not the full `.../lhcformbuilder` URL.)
* **Capture the origin from the first message; don't hardcode it.** Instead of
  assuming a fixed origin, read `event.origin` from the first message the form
  builder sends (`initialized`) and reuse that value as the `targetOrigin` for
  everything you post back. To trust that first message, confirm it came from the
  window you opened by comparing `event.source` with the handle returned by
  `window.open()`. This keeps working even if the redirect target changes later.

### Set up event listener
Before opening the form builder window, add an event listener to the parent
window. The form builder sends four types of messages, namely `initialized`,
`updateQuestionnaire`, `closed`, and `canceled`. It can also receive a message with type
`initialQuestionnaire`. The data object exchanged with the form builder consists
of two fields, `type` and `questionnaire`. The `type` is one of the above-defined
message types. The `questionnaire` is the associated questionnaire for
that message type. For the `initialized` and `canceled` messages this field is undefined.
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
// redirects to https://lhncbc.nlm.nih.gov/lhcformbuilder.
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

A new http parameter `fhirVersion` is introduced to request a particular version of
the questionnaire. The permitted values are `STU3`, `R4`, and `R5`. Any unrecognized
versions will be ignored. The default output is `R4`.

Here is an example:

```
const fbWin = window.open(fbUrl+'/window-open?referrer='+encodeURIComponent(window.location.href)+'&fhirVersion=R5', 'formBuilderWindow');
```

Opening `https://formbuilder.nlm.nih.gov/window-open?...` continues to work; the
browser follows the redirect to
`https://lhncbc.nlm.nih.gov/lhcformbuilder/window-open?...`. Because the form
builder then runs on the `https://lhncbc.nlm.nih.gov` origin, reply with the
origin captured from its first message (`fbOrigin`) as the `postMessage`
targetOrigin — see the handler above — rather than assuming `fbUrl`.

Use `fbWin.postMessage` to send the `initialQuestionnaire` message to the child
window, as described above.

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
the application and listen to the updates.

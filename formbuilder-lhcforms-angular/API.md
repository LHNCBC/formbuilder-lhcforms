## Controlling the Form Builder from an independent web page using JavaScript

##### Important: For this to work, make sure that the browser settings are not blocking the display of popup windows.

The form builder web application can be invoked using JavaScript from another
web page. It can be opened in a new page/tab (sometimes referred as child
window). The choice of new page or a new tab depends on the browser settings or
preferences. The newly opened form builder can be loaded with an initial
questionnaire. The parent page (sometimes referred as parent window) can listen
to real time changes in the form builder as the user makes the changes to the
questionnaire. When the user clicks `Save & Close` button in the form builder page, or
close button on browser tab, the parent window will receive a closed message with
the final modifications to the questionnaire and the form builder window is closed.
When the user clicks the `cancel` button in the form builder page, the form builder
window is closed and the parent window will receive a canceled message.

### Set up event listener
Before opening the form builder window, add an event listener to the parent
window. The form builder sends four types of messages, namely `initialized`,
`updateQuestionnaire`, `closed`, and `canceled`. It can also receive a message with type
`initialQuestionnaire`. The data object exchanged with the form builder consists
of two fields, `type` and `questionnaire`. The `type` is one of the above
defined message types. The `questionnaire` is the associated questionnaire for
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
const fbUrl = 'https://formbuilder.nlm.nih.gov';

/**
Event handler to handle messages from form builder window.

@param: event - MessageEvent object. Read event.data.event to identify the form
  builder's message type, and expect event.data.questionnaire to contain the
  latest questionnaire from the form builder. For the 'initialized' event, the
  event.data.questionnaire is undefined.
*/
function handleFormBuilderMessages(event) {
  if(event.origin === fbUrl) {
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

        // fbWin is the object reference returned by window.open().
        fbWin.postMessage({type: 'initialQuestionnaire', questionnaire: initialQ}, fbUrl);
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

Here is an example:

```
const fbWin = window.open(fbUrl+'/window-open?referrer='+encodeURIComponent(window.location.href), 'formBuilderWindow');
```

Use `fbWin.postMessage` to send the `initialQuestionnaire` message to the child
window, as described above.

### Loading with an initial questionnaire
You can load a form builder with an existing FHIR questionnaire resource. You
want to wait for the `initialized` message after opening the form builder window,
before sending the message to the form builder.

```
// fbWin is the object reference returned by window.open().
// Use 'initialQuestionnaire' message.
fbWin.postMessage({type: 'initialQuestionnaire', questionnaire: initialQ}, fbUrl);

```

There is a working example in `/tests/window-open-test.html` on how to invoke
the application and listen to the updates.

## Interacting with Form Builder application from an independent web page using javascript.

##### Important: For this to work, make sure that the browser settings are not blocking the display of popup window.

The form builder web application can be invoked using javascript from another web page. It can be opened in a new page/tab (sometimes referred as child window). The choice of new page or a new tab depends on the browser settings or preferences. The newly opened form builder can be loaded with an initial questionnaire. The parent page (sometimes referred as parent window) can listen to real time changes in the form builder as the user makes the changes to the questionnaire. 

### Set up event listener.
Before opening the form builder window, add an event listener to the parent window. Form builder sends three types of messages, namely `initialized`, `updateQuestionnaire`, and `closed`. It can also receive a message with type `initialQuestionnaire`. The data object exchanged with form builder consists of two fields, `type` and `questionnaire`. The `type` is one of the above defined message types. The `questionnaire` is associated questionnaire for that message type. For `initialized` message this field is null. Here is a code snippet to add an event listener.

```
let fbWin = null;
const fbUrl = 'https://formbuilder.nlm.nih.gov';
window.addEventListener('message', handleFormBuilderMessages, true);
```

### Handle form builder events.
A <a href="https://developer.mozilla.org/docs/Web/API/Window/message_event">window event listener</a> is a callback function attached to the parent window listening to `message` events. The callback receives an event object, where `event.data` is the data object sent by the message emitter, in this case the form builder. The form builder defines its own messages into `'initialized'`, `'updateQuestionnaire'`, and `'closed'` types. The message type is in `event.data.type`. Here is a typical handler to receive the messages from the form builder.

```
/**
Event handler to handle messages from form builder window.

@param: event - MessageEvent object. Read event.data.event to identify form builder's message type, and expect event.data.questionnaire to contain the latest questionnaire from the form builder. For 'initialized' event, the event.data.questionnaire is null.
*/
function handleFormBuilderMessages(event) {
  if(event.origin === fbUrl) {
    // Handling form builder events.
    const eventType = event.data.type; // Parent receiving events: 'closed' || 'updateQuestionnaire' || 'closed'

    switch (eventType) {
      case 'initialized':
        // This is the first message from child window.
        // It indicates that form builder is initialized and ready to
        // receive initial questionnaire.
        // Wait for the child window to be ready, before sending initial questionnaire.
        // fbWin is the object reference returned by window.open().
        // Use 'initialQuestionnaire' event.
        fbWin.postMessage({type: 'initialQuestionnaire', questionnaire: initialQ}, fbUrl);
        break;

      case 'updateQuestionnaire':
        // Use this to get continuous updates. The message is triggered by every change in
        // the form builder with about 0.5 second debounce.

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

    }
  }
} 
```

### Open form builder window.
After setting up the message event handler, open the form builder in a new window. Use <a href="https://developer.mozilla.org/docs/Web/API/Window/open">`window.open()`</a> method of DOM Window interface.

```
fbWin = window.open(fbUrl, 'formBuilderWindow');
```

Use `fbWin` in subsequent communication with the child window.

### Loading with an initial questionnaire.
You can load a form builder with an existing FHIR questionnaire resource. You want to wait for `initialized` message after opening the form builder window, to send any message to form builder.

```
// fbWin is the object reference returned by window.open().
// Use 'initialQuestionnaire' message.
fbWin.postMessage({type: 'initialQuestionnaire', questionnaire: initialQ}, fbUrl);

```

There is a working example in `/tests/window-open-test.html` on how to invoke the application and listen to the updates.
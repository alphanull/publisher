![License](https://img.shields.io/github/license/alphanull/publisher)
![Version](https://img.shields.io/badge/version-1.5.0-blue)
[![JSDoc](https://img.shields.io/badge/docs-JSDoc-blue)](./docs/publisher.md)
![Size](https://img.shields.io/badge/gzipped~2kb-brightgreen)

# @alphanull/publisher

Publisher is a JavaScript Publish/Subscribe (Pub/Sub) library crafted to handle event-driven communication. Provides pub/sub functionality with extensive wildcard support, async/sync publishing, priority and invocation options, content based filtering & more.

The heart of Publisher lies in its uniquely optimized hierarchical data structure, providing fast subscriber matching even with extensive subscription sets. Unlike traditional flat Pub/Sub systems, Publisher allows you to easily organize events into structured topics and leverage wildcard subscriptions for additional flexibility.

Whether you're building scalable web applications or complex front-end architectures, Publisher ensures your events and notifications are handled gracefully and reliably, delivering ease of use combined with powerful features.

## Features

- **Topic Hierarchy & Wildcards**: Manage event complexity with a structured hierarchy and wildcard topic matching.
- **Persisted Messages**: Ensure subscribers never miss critical events, delivering persistent messages immediately upon subscribing.
- **Priority & Invocations**: Gain fine-grained control over execution order and limit subscription triggers, improving predictability and efficiency.
- **Async & Exception Handling**: Dispatch events asynchronously or synchronously with built-in exception handling.
- **Conditional Execution**: Execute subscriptions only when specific conditions are met.
- **Global Configuration**: Configure default behavior globally for asynchronous dispatch, error handling, and unsubscribing behavior.

---

## Installation


### via NPM

**ATTN: Package is not on npm yet due to namespace clearance!**

```bash
npm install @alphanull/publisher <<< not here yet!
```

### via CDN

**Also, no CDN (yet)**

[Download latest version](https://??????) from ????????

### via GitHub

[Download release](https://github.com/alphanull/publisher/releases) from GitHub

------

## Usage

### 1. Initialization

publisher can be used as ES6 module (recommended) but also via `require` in NodeJS or with direct access to a global variable:

#### ES6

```javascript
import { publish, subscribe, unsubscribe } from '@alphanull/publisher';
```

#### CommonJS

```javascript
const { publish, subscribe, unsubscribe } = require('@alphanull/publisher');
```

#### Global Variable

```html
<script src="path/to/publisher.min.cjs"></script>
```

```javascript
const { publish, subscribe, unsubscribe } = publisher;
```

------

### 2. Basic Usage

Quickly set up a simple Pub/Sub interaction:

```javascript
import { publish, subscribe, unsubscribe } from '@alphanull/publisher';

const handler = data => {
      console.log(`User logged in: ${data.username}`);
}

// Receiver: subscribe to a specific topic
const token = subscribe('login', handler);

// Sender: publish an event
publish('login', { username: 'Alice' });

// Receiver: unsubscribe using the token (recommended)
unsubscribe(token);

// Receiver: alternatively, unsubscribe using topic and handler
unsubscribe('login', handler);
```

---

### 3. Hierarchy and Wildcards

By utilizing topic hierarchies and wildcards, you can subscribe to multiple events. A hierachy is created by using the `/` delimiter to create topic segments, while a `*` is used to match any topic segment:

```javascript
// Subscribe to ALL topics
subscribe('*', (data, topic) => {
    console.log(`Event ${topic} received:`, data);
});

// Subscribe to all "user"-related topics, INCLUDING "user"
subscribe('user', (data, topic) => {
    console.log(`Event ${topic} received:`, data);
});

// Subscribe to all "user"-related topics, EXCLUDING "user"
subscribe('user/*', (data, topic) => {
    console.log(`Event ${topic} received:`, data);
});

// Matching multiple topics with wildcards
subscribe('app/*/update', (data, topic) => {
    console.log(`Update from ${topic}:`, data);
});

publish('user/logout', { username: 'Bob' }); // triggers first, second & third subscriber
publish('app/profile/update', { username: 'Charlie' }); // triggers first and fourth subscribers
publish('app/settings/update', { theme: 'dark' }); // triggers first and fourth subscribers
```

---

### 4. Advanced Unsubscribe: Multiple Tokens, Lenient Unsubscribe

You can also use an array of tokens to quickly unsubscribe multiple handlers. In addition, adding `true` to the second argument (or the third, in case you use topic/handler for unsubscribe) does not fail with an error if the matching token was not found.

```javascript
const tokens = [
    subscribe('topic/1', handler),
    subscribe('topic/2', handler)
];

// Batch unsubscribe
unsubscribe(tokens);

// Lenient unsubscribe, silently ignores non-existing tokens
unsubscribe(9999, true);
```

---

### 5. Async and Sync Usage, Cancellation

By default, all events are sent asynchronously. You can override this behavior globally (see 10.) or with individual `publish` actions by using `async: false` as an option. In addition, when using synchronous `publish`, any subscriber is able to cancel an event, so that subsequent subscribers are not notified anymore. So basically, this works similar to the cancellation of DOM Events.

```javascript
// return false in a handler cancels the chain
subscribe('sync/event', () => false); 

// Synchronous event publishing can be canceled 
publish('sync/event', {}, { async: false, cancelable: true });
```

---

### 6. Priority

Usually, subscribers are notifed in the order they subscribed, i.e. the first subscriber is receiving the first message. You can change this behavior adding a `priority` option, where higher numbers are executed first, with `0` being the default. 

```javascript
// Control subscriber order with priorities
subscribe('priority/event', () => console.log('second'), { priority: 1 });
subscribe('priority/event', () => console.log('first'), { priority: 2 });

publish('priority/event');
```

---

### 7. Invocations

It is also possible to limit the number of handler invocations by adding the `invocations` option, this being a positive number counting down when the handler is called. Once the counter reaches `0` the handler is automatically unsubscribed. For example, the following code executes the handler only on the first `publish` occurence:

```javascript
// Limit subscription invocations
subscribe('limited/event', () => console.log('I only execute once'), { invocations: 1 });

publish('limited/event'); // triggers handler
publish('limited/event'); // not triggered anymore, handler was unsubscribed
```

---

### 8. Conditional Execution

Run subscriptions based on conditional logic, so that the handler is only invoked if the function specified by the `condition` option returns true:

```javascript
subscribe('data/event', data => {
    console.log('Condition met:', data);
}, {
    condition: data => data.status === 'success'
});

publish('data/event', { status: 'success' }); // triggers subscriber
publish('data/event', { status: 'error' }); // ignored
```

---

### 9. Persistency

Ensure certain messages are received even when the subscription is done after the actual message was already sent. For this to happen, _both_ `publish` and `subscribe` have to use the `persist: true` option. It is also possible to remove a perssitent message later on using `removePersistentMessage`.

```javascript
import { publish, subscribe, removePersistentMessage } from './publisher.js';

// make message persistent
publish('app/ready', { status: 'ready' }, { persist: true });

// Subscribers immediately receive persistent messages upon subscription
subscribe('app/ready', data => console.log('Persistently received:', data), { persist: true });

// after removing, later subscriber don't receive the event anymore
removePersistentMessage('app/ready');
```

---

### 10. Error Handling

By default, if a handler throws an Error, it is caught by the publisher so that subsequent subscribers are still being executed. Instead the error is output to the console (if possible). This behavior can be changed globally, or per `publish` so that exceptions are not caught anymore.

```javascript
subscribe('error/event', () => {
    throw new Error('Subscriber error!');
});

subscribe('error/event', () => {
    console.log('I still might be executed');
});

// Errors caught internally, other subscribers remain unaffected
publish('error/event', data , { handleExceptions: true });

// Throws an error, publishing is halted
publish('error/event', data , { handleExceptions: false });
```

---

### 11. Global Configuration

Configure Publisher.js globally to tailor its behavior. All subsequent actions will use the newly set option(s), unless locally overidden.

```javascript
import { configure } from './publisher.js';

// Equivalent to the default configuration
configure({
    async: true,                  // Global async dispatch
    handleExceptions: true,       // Global error handling
    lenientUnsubscribe: true      // No errors on unsubscribing non-existent subscribers
});
```

---

## Docs

For more detailed docs, see [JSDoc Documentation](docs/publisher.md)

## License

[MIT](https://opensource.org/license/MIT) 

Copyright © 2015-present Frank Kudermann @ alphanull.de
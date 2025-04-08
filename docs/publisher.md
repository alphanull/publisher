# Publisher.js Docs

<a name="module_publisher"></a>

## publisher
The publisher module. Provides pub/sub functionality with extensive wildcard support, async/sync publishing, priority and invocation options, content based filtering & more.

**See**: https://github.com/alphanull/publisher  
**Version**: 1.5.0  
**Author**: Frank Kudermann @ alphanull  

* [publisher](#module_publisher)
    * _static_
        * [.tokenCounter](#module_publisher.tokenCounter) : <code>Number</code> ℗
        * [.globalOptions](#module_publisher.globalOptions) : [<code>globalOptions</code>](#module_publisher..globalOptions) ℗
        * [.subscrs](#module_publisher.subscrs) : [<code>Object.&lt;subscriberObject&gt;</code>](#module_publisher..subscriberObject) ℗
        * [.subsTree](#module_publisher.subsTree) : <code>Object.&lt;Object&gt;</code> ℗
        * [.persistentMessages](#module_publisher.persistentMessages) : <code>Object.&lt;Object&gt;</code> ℗
        * [.exports.configure(options)](#module_publisher.exports.configure)
        * [.exports.publish(topic, [data], [options])](#module_publisher.exports.publish)
        * [.exports.subscribe(topic, handler, [options])](#module_publisher.exports.subscribe) ⇒ <code>number</code>
        * [.exports.unsubscribe(topicOrToken, [handler], [lenientUnsubscribe])](#module_publisher.exports.unsubscribe)
        * [.exports.removePersistentMessage(topic)](#module_publisher.exports.removePersistentMessage)
        * [.executeHandler(handler, topic, data, options)](#module_publisher.executeHandler) ⇒ <code>function</code> ℗
        * [.findSubscribers(topicArray, data, options, subscriptions, originalTopic)](#module_publisher.findSubscribers) ⇒ [<code>Array.&lt;subscriberObject&gt;</code>](#module_publisher..subscriberObject) ℗
        * [.addSubscription(topicArray, subscriber, subscriptions)](#module_publisher.addSubscription) ℗
        * [.removeSubscription(topicArray, subscriber, subscriptions)](#module_publisher.removeSubscription) ℗
    * _inner_
        * [~globalOptions](#module_publisher..globalOptions) : <code>Object</code>
        * [~subscriberObject](#module_publisher..subscriberObject) : <code>Object</code>
        * [~subscriberOptions](#module_publisher..subscriberOptions) : <code>Object</code>


* * *

<a name="module_publisher.tokenCounter"></a>

### publisher.tokenCounter : <code>Number</code> ℗
Internal value to create unique tokens. This is increased everytime you subscribe.

**Kind**: static property of [<code>publisher</code>](#module_publisher)  
**Access**: private  

* * *

<a name="module_publisher.globalOptions"></a>

### publisher.globalOptions : [<code>globalOptions</code>](#module_publisher..globalOptions) ℗
Global options for the publisher, can be changed by the setOptions method.

**Kind**: static constant of [<code>publisher</code>](#module_publisher)  
**Access**: private  

* * *

<a name="module_publisher.subscrs"></a>

### publisher.subscrs : [<code>Object.&lt;subscriberObject&gt;</code>](#module_publisher..subscriberObject) ℗
Object which contains all subscribers, using the token as key.

**Kind**: static constant of [<code>publisher</code>](#module_publisher)  
**Access**: private  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| subscriberObject | [<code>subscriberObject</code>](#module_publisher..subscriberObject) | The Subscriber Object |


* * *

<a name="module_publisher.subsTree"></a>

### publisher.subsTree : <code>Object.&lt;Object&gt;</code> ℗
Object which contains a tree graph of all subscriptions

**Kind**: static constant of [<code>publisher</code>](#module_publisher)  
**Access**: private  

* * *

<a name="module_publisher.persistentMessages"></a>

### publisher.persistentMessages : <code>Object.&lt;Object&gt;</code> ℗
Object which contains persistent messages (published with the "persist" option)

**Kind**: static constant of [<code>publisher</code>](#module_publisher)  
**Access**: private  

* * *

<a name="module_publisher.exports.configure"></a>

### publisher.exports.configure(options)
Sets global options for the publisher. All subsequent actions use these options.

**Kind**: static method of [<code>publisher</code>](#module_publisher)  

| Param | Type | Description |
| --- | --- | --- |
| options | [<code>Object.&lt;globalOptions&gt;</code>](#module_publisher..globalOptions) | An object containing various options. |


* * *

<a name="module_publisher.exports.publish"></a>

### publisher.exports.publish(topic, [data], [options])
Publishes a message to all matching subscribers.

**Kind**: static method of [<code>publisher</code>](#module_publisher)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| topic | <code>string</code> |  | The topic of this message, may be separated with '/' for subtopics. |
| [data] | <code>Object</code> |  | The data that should be sent along with the event. Can be basically any javascript object. |
| [options] | <code>Object</code> | <code>{}</code> | Additional options |
| [options.async] | <code>boolean</code> |  | Specify if we should deliver this  message directly or with a timeout. Overrides the global setting. |
| [options.handleExceptions] | <code>boolean</code> |  | Specify if we should catch any exceptions while sending this message. Overrides the global setting. |
| [options.persist] | <code>boolean</code> |  | If true, the message is saved for later subscribers who want to be notified of persistent messages |
| [options.cancelable] | <code>boolean</code> | <code>true</code> | If false, this message cannot be canceled (when sending synchronously). |


* * *

<a name="module_publisher.exports.subscribe"></a>

### publisher.exports.subscribe(topic, handler, [options]) ⇒ <code>number</code>
Subscribes to certain message(s).

**Kind**: static method of [<code>publisher</code>](#module_publisher)  
**Returns**: <code>number</code> - The internal token of the new subscriber. Can be used for later unsubscribing.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| topic | <code>string</code> |  | The topic in which the subscriber is interested. Note that you can use wildcards, ie. the topic "*" will subscribe to all messages. |
| handler | <code>function</code> |  | The handler to execute when a matching message is found. |
| [options] | <code>Object</code> | <code>{}</code> | Additional options |
| [options.handleExceptions] | <code>boolean</code> |  | Specify if we should catch any exceptions while sending this message. Overrides the global setting. |
| [options.persist] | <code>boolean</code> |  | If this is set to true, the subscriber is notified of any former, persistent messages. |
| [options.condition] | <code>function</code> |  | A function which receives this topic and data just before execution, if present. If this returns anything but true, the message is not delivered. |
| [options.priority] | <code>number</code> | <code>0</code> | Specifies with which priority the handler should be executed. The higher the number, the higher the priority. Default is "0", negative values are allowed. |
| [options.invocations] | <code>number</code> |  | Specifies how many times the subscriptions should be executed after a matching event. If this value reaches "0", the handler is automatically unsubscribed |


* * *

<a name="module_publisher.exports.unsubscribe"></a>

### publisher.exports.unsubscribe(topicOrToken, [handler], [lenientUnsubscribe])
Unsubscribes one or more subscribers. Note that here, the second argument can mean either a handler or the "lenient" option.

**Kind**: static method of [<code>publisher</code>](#module_publisher)  

| Param | Type | Description |
| --- | --- | --- |
| topicOrToken | <code>number</code> \| <code>string</code> \| <code>Array</code> | The token or the topic to unsubscribe. In the first case, these also can be in an Array to support multiple unsubscriptions. |
| [handler] | <code>function</code> | If specified, the message is only unsubscribed if the handler also matches. |
| [lenientUnsubscribe] | <code>boolean</code> | If set to true, unsubscribe won't throw an error if the handler or token is not found |


* * *

<a name="module_publisher.exports.removePersistentMessage"></a>

### publisher.exports.removePersistentMessage(topic)
Removes a previously added persistent message

**Kind**: static method of [<code>publisher</code>](#module_publisher)  

| Param | Type | Description |
| --- | --- | --- |
| topic | <code>string</code> | The topic of the message to remove |


* * *

<a name="module_publisher.executeHandler"></a>

### publisher.executeHandler(handler, topic, data, options) ⇒ <code>function</code> ℗
This method actually executes the message handler

**Kind**: static method of [<code>publisher</code>](#module_publisher)  
**Returns**: <code>function</code> - Returns the handlers result  
**Access**: private  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| handler | <code>function</code> |  | The actual handler |
| topic | <code>string</code> |  | The topic |
| data | <code>Object</code> |  | The message data which should be passed to the handler |
| options | <code>Object</code> | <code>{}</code> | Object which holds the publish options |


* * *

<a name="module_publisher.findSubscribers"></a>

### publisher.findSubscribers(topicArray, data, options, subscriptions, originalTopic) ⇒ [<code>Array.&lt;subscriberObject&gt;</code>](#module_publisher..subscriberObject) ℗
Internal Function to recursively walk the subscription graph according to the current topic scope. Any found subscribers are added to the return array.

**Kind**: static method of [<code>publisher</code>](#module_publisher)  
**Returns**: [<code>Array.&lt;subscriberObject&gt;</code>](#module_publisher..subscriberObject) - Array with matching subscribers  
**Access**: private  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| topicArray | <code>Array.&lt;String&gt;</code> |  | Hold eachs segments of the topic in an array, also reflecting the current scope. |
| data | <code>Object</code> |  | The current data which was sent along the message. |
| options | <code>Object</code> | <code>{}</code> | Current publishing options. |
| subscriptions | <code>Object</code> |  | Part of the subscriptions tree, reflecting the current scope |
| originalTopic | <code>String</code> |  | Original message topic |


* * *

<a name="module_publisher.addSubscription"></a>

### publisher.addSubscription(topicArray, subscriber, subscriptions) ℗
Internal function to add a subscription to the subscriptions graph.

**Kind**: static method of [<code>publisher</code>](#module_publisher)  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| topicArray | <code>Array.&lt;String&gt;</code> | Hold eachs segments of the topic in an array, also reflecting the current scope. |
| subscriber | [<code>Object.&lt;subscriberObject&gt;</code>](#module_publisher..subscriberObject) | The subscriber to add. |
| subscriptions | <code>Object</code> | Part of the subscription graph, reflecting the current scope. |


* * *

<a name="module_publisher.removeSubscription"></a>

### publisher.removeSubscription(topicArray, subscriber, subscriptions) ℗
Internal Function to recursively walk the subscription graph according to the current topic scope. Uses the executeHandlers method to execute any handlers found on it's way.

**Kind**: static method of [<code>publisher</code>](#module_publisher)  
**Access**: private  

| Param | Type | Description |
| --- | --- | --- |
| topicArray | <code>Array.&lt;String&gt;</code> | Hold eachs segments of the topic in an array, also reflecting the current scope. |
| subscriber | [<code>Object.&lt;subscriberObject&gt;</code>](#module_publisher..subscriberObject) | The subscriber to remove. |
| subscriptions | <code>Object</code> | Part of the subscriptions tree, reflecting the current scope |


* * *

<a name="module_publisher..globalOptions"></a>

### publisher~globalOptions : <code>Object</code>
Options for the publisher. These can be changed globally by the configure() method.

**Kind**: inner typedef of [<code>publisher</code>](#module_publisher)  
**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| async | <code>boolean</code> | <code>true</code> | If false, messages are sent synchronously; otherwise, they're sent asynchronously (with a timeout). |
| handleExceptions | <code>boolean</code> | <code>false</code> | If true, exceptions are caught, preventing a faulty handler from disrupting subsequent publishing. |
| lenientUnsubscribe | <code>boolean</code> | <code>false</code> | If true, unsubscribing a non-existent subscription or handler will not throw an error. |


* * *

<a name="module_publisher..subscriberObject"></a>

### publisher~subscriberObject : <code>Object</code>
Structure of a single subscriber

**Kind**: inner typedef of [<code>publisher</code>](#module_publisher)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| token | <code>number</code> | Unique token identifying this subscriber. |
| topic | <code>string</code> | The topic this subscriber listens to. |
| handler | <code>function</code> | The function executed when a matching publish event occurs. |
| [timeOutId] | <code>number</code> | Timeout ID when publishing asynchronously. Used for cleanup upon unsubscribe (if the handler is still waiting). |
| options | [<code>subscriberOptions</code>](#module_publisher..subscriberOptions) | Subscriber-specific options. |


* * *

<a name="module_publisher..subscriberOptions"></a>

### publisher~subscriberOptions : <code>Object</code>
Options for the subscriber. These can be used by publish or subscribe commands.

**Kind**: inner typedef of [<code>publisher</code>](#module_publisher)  
**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| [async] | <code>boolean</code> |  | If false, messages are sent synchronously to this subscriber; otherwise, asynchronously. |
| [handleExceptions] | <code>boolean</code> |  | If true, exceptions within handlers are caught, preventing disruption of further publishing. |
| [condition] | <code>function</code> |  | A function evaluated before executing a matching subscriber. Must return true to continue. |
| [persist] | <code>boolean</code> |  | If true, the message is saved for future subscribers who request persistent messages. |
| [priority] | <code>number</code> | <code>0</code> | (Subscribe only) Defines handler execution priority. Higher numbers execute first. Negative values allowed. |
| [invocations] | <code>number</code> |  | Number of times the subscription is executed before automatic unsubscription. Default is unlimited. |


* * *


 * * *

&copy; 2014-present [Frank Kudermann](https://alphanull.de), [https://alphanull.de](https://alphanull.de) <[info@alphanull.de](mailto:info@alphanull.de)>

Documentation is generated by [JSDoc](https://github.com/jsdoc3/jsdoc) and [jsdoc-to-markdown](https://github.com/jsdoc2md/jsdoc-to-markdown).

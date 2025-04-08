/**
 * The publisher module. Provides pub/sub functionality with extensive wildcard support, async/sync publishing, priority and invocation options, content based filtering & more.
 * @author Frank Kudermann @ alphanull
 * @version 1.5.0
 * @module publisher
 * @see https://github.com/alphanull/publisher
 */

/* TYPE DEFINITIONS */

/**
 * @typedef {Object} module:publisher~globalOptions  Options for the publisher. These can be changed globally by the configure() method.
 * @property {boolean} async=true                If false, messages are sent synchronously; otherwise, they're sent asynchronously (with a timeout).
 * @property {boolean} handleExceptions=false    If true, exceptions are caught, preventing a faulty handler from disrupting subsequent publishing.
 * @property {boolean} lenientUnsubscribe=false  If true, unsubscribing a non-existent subscription or handler will not throw an error.
 */

/**
 * @typedef {Object} module:publisher~subscriberObject Structure of a single subscriber
 * @property {number} token               Unique token identifying this subscriber.
 * @property {string} topic               The topic this subscriber listens to.
 * @property {function} handler           The function executed when a matching publish event occurs.
 * @property {number} [timeOutId]         Timeout ID when publishing asynchronously. Used for cleanup upon unsubscribe (if the handler is still waiting).
 * @property {module:publisher~subscriberOptions} options Subscriber-specific options.
 */

/**
 * @typedef {Object} module:publisher~subscriberOptions   Options for the subscriber. These can be used by publish or subscribe commands.
 * @property {boolean}  [async]              If false, messages are sent synchronously to this subscriber; otherwise, asynchronously.
 * @property {boolean}  [handleExceptions]   If true, exceptions within handlers are caught, preventing disruption of further publishing.
 * @property {function} [condition]          A function evaluated before executing a matching subscriber. Must return true to continue.
 * @property {boolean}  [persist]            If true, the message is saved for future subscribers who request persistent messages.
 * @property {number}   [priority=0]         (Subscribe only) Defines handler execution priority. Higher numbers execute first. Negative values allowed.
 * @property {number}   [invocations]        Number of times the subscription is executed before automatic unsubscription. Default is unlimited.
 */

/* INTERNAL PROPERTIES */

/**
 * Global options for the publisher, can be changed by the setOptions method.
 * @memberOf module:publisher
 * @private
 * @type     {module:publisher~globalOptions}
 */
const globalOptions = {
    async: true,
    handleExceptions: false,
    lenientUnsubscribe: false
};

/**
 * Object which contains all subscribers, using the token as key.
 * @memberOf module:publisher
 * @private
 * @type     {Object<module:publisher~subscriberObject>}
 * @property {module:publisher~subscriberObject} subscriberObject The Subscriber Object
 */
const subscrs = new Map();

/**
 * Object which contains a tree graph of all subscriptions
 * @memberOf module:publisher
 * @private
 * @type     {Object<Object>}
 */
const subsTree = new Map();

/**
 * Object which contains persistent messages (published with the "persist" option)
 * @memberOf module:publisher
 * @private
 * @type     {Object<Object>}
 */
const persistentMessages = new Map();

/**
 * Internal value to create unique tokens. This is increased everytime you subscribe.
 * @memberOf module:publisher
 * @private
 * @type {Number}
 */
let tokenCounter = -1;

/* PUBLIC API */

/**
 * Sets global options for the publisher. All subsequent actions use these options.
 * @memberOf module:publisher
 * @param    {Object<module:publisher~globalOptions>} options        An object containing various options.
 */
export function configure(options) {

    if (options) {
        if (typeof options.async !== 'undefined') globalOptions.async = options.async;
        if (typeof options.handleExceptions !== 'undefined') globalOptions.handleExceptions = options.handleExceptions;
        if (typeof options.lenientUnsubscribe !== 'undefined') globalOptions.lenientUnsubscribe = options.lenientUnsubscribe;
    } else {
        throw new Error('Publisher configure: no options specified');
    }

}

/**
 * Publishes a message to all matching subscribers.
 * @memberOf module:publisher
 * @param {string}   topic                       The topic of this message, may be separated with '/' for subtopics.
 * @param {Object}   [data]                      The data that should be sent along with the event. Can be basically any javascript object.
 * @param {Object}   [options={}]                Additional options
 * @param {boolean}  [options.async]             Specify if we should deliver this  message directly or with a timeout. Overrides the global setting.
 * @param {boolean}  [options.handleExceptions]  Specify if we should catch any exceptions while sending this message. Overrides the global setting.
 * @param {boolean}  [options.persist]           If true, the message is saved for later subscribers who want to be notified of persistent messages
 * @param {boolean}  [options.cancelable=true]   If false, this message cannot be canceled (when sending synchronously).
 */
export function publish(topic, data, options = {}) {

    // check if this message is persistent and must be saved for later use
    if (options.persist === true) {
        persistentMessages.set(topic, { data, options });
    }

    if (topic.indexOf('*') > -1) throw new Error('Publish topic cannot contain any wildcards.');

    // find subscribers
    const matchedSubscribers = findSubscribers(topic.split('/'), data, options, subsTree, topic);

    // sort handlers by priority
    matchedSubscribers.sort((a, b) => {
        if (a.priority === b.priority) return a.position - b.position; // emulate stable sort
        if (a.priority > b.priority) return -1;
        return 1;
    });

    // finally, execute them
    let subscriber;

    const async = typeof options.async === 'undefined'
        ? globalOptions.async
        : options.async;

    while ((subscriber = matchedSubscribers.shift())) {

        if (async) {
            setTimeout(executeHandler.bind(null, subscriber, topic, data, options), 0);
        } else if (executeHandler(subscriber, topic, data, options) === false && options.cancelable !== false) {
            return false;
        }

    }

}

/**
 * Subscribes to certain message(s).
 * @memberOf module:publisher
 * @param   {string}   topic                       The topic in which the subscriber is interested. Note that you can use wildcards, ie. the topic "*" will subscribe to all messages.
 * @param   {function} handler                     The handler to execute when a matching message is found.
 * @param   {Object}   [options={}]                Additional options
 * @param   {boolean}  [options.handleExceptions]  Specify if we should catch any exceptions while sending this message. Overrides the global setting.
 * @param   {boolean}  [options.persist]           If this is set to true, the subscriber is notified of any former, persistent messages.
 * @param   {function} [options.condition]         A function which receives this topic and data just before execution, if present. If this returns anything but true, the message is not delivered.
 * @param   {number}   [options.priority=0]        Specifies with which priority the handler should be executed. The higher the number, the higher the priority. Default is "0", negative values are allowed.
 * @param   {number}   [options.invocations]       Specifies how many times the subscriptions should be executed after a matching event. If this value reaches "0", the handler is automatically unsubscribed
 * @returns {number}                               The internal token of the new subscriber. Can be used for later unsubscribing.
 */
export function subscribe(topic, handler, options = {}) {

    const token = tokenCounter += 1;

    if (typeof topic === 'undefined') {
        throw new Error('Subscribe failed - "undefined" Topic.');
    }

    if (topic.includes('undefined')) {
        throw new Error(`Subscribe for '${topic}' failed - found 'undefined' in topic, this is almost always an error: ${token}`);
    }

    if (typeof handler === 'undefined') {
        throw new Error(`Subscribe for '${topic}' failed - "undefined" Handler`);
    }

    // Add to Subscribers Object
    const subscriber = {
        token,
        topic,
        handler,
        options
    };

    subscrs.set(token, subscriber);
    addSubscription(topic.split('/'), subscriber, subsTree); // build Graph

    if (options.persist !== true) return token; // return the token (as Number)

    const regex = new RegExp(`^${topic.replace('*', '(.+)')}(/.+)?$`);

    // Check persistent messages for matching topic
    for (const [key, persistentMessage] of persistentMessages) {

        const match = key.match(regex);

        if (match) {

            const async = typeof persistentMessage.options.async === 'undefined' ? globalOptions.async : persistentMessage.options.async;

            if (async) {
                setTimeout(executeHandler.bind(null, subscriber, key, persistentMessage.data, options), 0);
            } else if (executeHandler(subscriber, key, persistentMessage.data, options) === false && options.cancelable === true) {
                break;
            }

        }

    }

    return token; // return the token (as Number)

}

/**
 * Unsubscribes one or more subscribers. Note that here, the second argument can mean either a handler or the "lenient" option.
 * @memberOf module:publisher
 * @param   {number|string|Array}   topicOrToken           The token or the topic to unsubscribe. In the first case, these also can be in an Array to support multiple unsubscriptions.
 * @param   {function}              [handler]              If specified, the message is only unsubscribed if the handler also matches.
 * @param   {boolean}               [lenientUnsubscribe]   If set to true, unsubscribe won't throw an error if the handler or token is not found
 */
export function unsubscribe(topicOrToken, handler, lenientUnsubscribe) {

    const lenientArg = handler === Boolean(handler) ? handler : lenientUnsubscribe,
          lenient = typeof lenientArg === 'undefined' ? globalOptions.lenientUnsubscribe : lenientArg;

    const unsubscribeToken = token => {

        const subscriber = subscrs.get(token);

        if (typeof subscriber === 'undefined') {
            if (lenient === true) return;
            throw new Error(`Unsubscribe failed. Did not find subscriber for token: ${token}`);
        }

        removeSubscription(subscriber.topic.split('/'), subscriber, subsTree);
        subscrs.delete(token);

    };

    if (typeof topicOrToken === 'undefined') {
        if (lenient === true) return;
        throw new Error('Unsubscribe failed. No Arguments specified.');
    }

    // check for unsubscribe type
    if (Array.isArray(topicOrToken)) { // array of tokens, so iterate over it

        topicOrToken.forEach(topic => unsubscribeToken(topic));

    } else if (!isNaN(parseFloat(topicOrToken)) && isFinite(topicOrToken)) { // it's a Number, so it is a single token

        unsubscribeToken(topicOrToken);

    } else {

        // assume topic & handler based unsubscribe
        // check for existing handler first
        if (typeof handler === 'undefined') {
            if (lenient === true) return;
            throw new Error(`Unsubscribe failed. No handler for topic based unsubscribe specified ${topicOrToken}`);
        }

        // TODO: not really efficient,
        // consider walking the topic tree instead
        for (const [, subscriber] of subscrs) {
            if (subscriber.handler === handler && subscriber.topic === topicOrToken) {
                removeSubscription(topicOrToken.split('/'), subscriber, subsTree);
                subscrs.delete(subscriber.token);
                break;
            }
        }
    }

}

/**
 * Removes a previously added persistent message
 * @memberOf module:publisher
 * @param  {string} topic The topic of the message to remove
 */
export function removePersistentMessage(topic) {

    persistentMessages.delete(topic);

}

/** ******** PRIVATE METHODS ************* */

/**
 * This method actually executes the message handler
 * @memberOf module:publisher
 * @private
 * @param  {function} handler       The actual handler
 * @param  {string} topic           The topic
 * @param  {Object} data            The message data which should be passed to the handler
 * @param  {Object} options={}      Object which holds the publish options
 * @return {function}               Returns the handlers result
 */
function executeHandler(subscriber, topic, data, options = {}) {

    // prevent async handler to be called when subscriber has been removed meanwhile
    if (!subscrs.has(subscriber.token)) return;

    if (subscriber.options.invocations > 0) {
        subscriber.options.invocations -= 1;
        if (subscriber.options.invocations <= 0) unsubscribe(subscriber.token);
    }

    const { handler } = subscriber;

    if (options.handleExceptions !== true && globalOptions.handleExceptions !== true) {
        return handler(data, topic);
    }

    try {
        return handler(data, topic);
    } catch (e) {
        if (window.console && window.console.error) {
            window.console.error('Exception while executing publish handler: ', e);
        }
    }

}

/**
 * Internal Function to recursively walk the subscription graph according to the current topic scope. Any found subscribers are added to the return array.
 * @memberOf module:publisher
 * @private
 * @param   {String[]} topicArray      Hold eachs segments of the topic in an array, also reflecting the current scope.
 * @param   {Object}   data            The current data which was sent along the message.
 * @param   {Object}   options={}      Current publishing options.
 * @param   {Object}   subscriptions   Part of the subscriptions tree, reflecting the current scope
 * @param   {String}   originalTopic   Original message topic
 * @returns {module:publisher~subscriberObject[]} Array with matching subscribers
 */
function findSubscribers(topicArray, data, options = {}, subscriptions, originalTopic, handlerArray = []) { // eslint-disable-line default-param-last, max-params

    const subscribers = subscriptions.get('subscribers') || new Map(),
          topics = subscriptions.get('topics');

    for (const [, subscriber] of subscribers) {

        const { condition } = subscriber.options; // condition for content based publishing

        if (typeof condition === 'undefined' || Object.prototype.toString.call(condition) === '[object Function]' && condition(data, originalTopic) === true) {
            // last but not least, check if there are any additional conditions set
            subscriber.position = handlerArray.push(subscriber);
            subscriber.priority = subscriber.options.priority || 0;
            subscriber.async = Boolean(options.async || subscriber.options.async || globalOptions.async);

        }

    }

    if (topicArray.length && topics) {

        const subscription = topics.get(topicArray[0]),
              subscriptionWild = topics.get('*');

        if (typeof subscriptionWild !== 'undefined' || typeof subscription !== 'undefined') {

            // if there are further subscriptions on this node, recurse
            if (typeof subscriptionWild !== 'undefined') {
                findSubscribers(topicArray.slice(1, topicArray.length), data, options, subscriptionWild, originalTopic, handlerArray);
            }

            if (typeof subscription !== 'undefined') {
                findSubscribers(topicArray.slice(1, topicArray.length), data, options, subscription, originalTopic, handlerArray);
            }

            topicArray.shift();

        }

    }

    return handlerArray;

}

/**
 * Internal function to add a subscription to the subscriptions graph.
 * @memberOf module:publisher
 * @private
 * @param {String[]} topicArray  Hold eachs segments of the topic in an array, also reflecting the current scope.
 * @param {Object<module:publisher~subscriberObject>}   subscriber    The subscriber to add.
 * @param {Object}   subscriptions Part of the subscription graph, reflecting the current scope.
 */
function addSubscription(topicArray, subscriber, subscriptions) {

    const [topic] = topicArray;

    if (typeof subscriptions.get('topics') === 'undefined') {
        subscriptions.set('topics', new Map());
    }

    const subTopic = subscriptions.get('topics');

    let subscription = subTopic.get(topic);

    if (typeof subscription === 'undefined') {
        subscription = new Map();
        subTopic.set(topic, subscription);
    }

    if (topicArray.length < 2) {

        // last segment, add subscriber
        if (typeof subscription.get('subscribers') === 'undefined') {
            subscription.set('subscribers', new Map());
        }

        subscription.get('subscribers').set(subscriber.token, subscriber);

    } else {

        // recurse
        topicArray.shift();
        addSubscription(topicArray, subscriber, subscription);

    }

}

/**
 * Internal Function to recursively walk the subscription graph according to the current topic scope. Uses the executeHandlers method to execute any handlers found on it's way.
 * @memberOf module:publisher
 * @private
 * @param   {String[]} topicArray      Hold eachs segments of the topic in an array, also reflecting the current scope.
 * @param   {Object<module:publisher~subscriberObject>}   subscriber      The subscriber to remove.
 * @param   {Object}   subscriptions   Part of the subscriptions tree, reflecting the current scope
 */
function removeSubscription(topicArray, subscriber, subscriptions) {

    const [topic] = topicArray,
          topics = subscriptions.get('topics'),
          subTopic = topics.get(topic),
          subscribers = subTopic.get('subscribers');

    if (topicArray.length < 2) {
        // last segment, remove subscriber
        subscribers.delete(subscriber.token);
        if (subscribers.size === 0) subTopic.delete('subscribers');
    } else {
        // recurse
        topicArray.shift();
        removeSubscription(topicArray, subscriber, subTopic);
    }

    // cleanup any empty graph elements
    if (subTopic.has('topics') && subTopic.get('topics').size === 0) subTopic.delete('topics');
    if (topics.get(topic).size === 0) topics.delete(topic);

}

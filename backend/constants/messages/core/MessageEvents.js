const EventEmitter = require('events');

class MessageEvents extends EventEmitter {}

module.exports = new MessageEvents();
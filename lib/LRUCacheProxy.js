var uuid = require('node-uuid');
var pending = {};

process.on('message', function onWorkerMessage(msg) {
	var incoming = pending[msg.id];

	incoming.callback(msg);

	delete pending[msg.id];
});

function send(namespace, cmd) {
	var callback = arguments[arguments.length - 1];
	var msg = { id: uuid.v4(), cmd: cmd, source: 'lru-cache-cluster', namespace: namespace, arguments: [].slice.call(arguments, 2, arguments.length - 1), callback: callback };

	pending[msg.id] = msg;
	process.send(msg);
}

var LRUCacheProxy = function LRUCacheProxy(options) {
	if (!(this instanceof LRUCacheProxy))
		return new LRUCacheProxy(options);

	this.namespace = options.namespace || 'default';

	send(this.namespace, 'constructor', options, function() {});
};

LRUCacheProxy.prototype.get = function(key, callback) {
	send(this.namespace, 'get', key, function(result) {
		callback(result.value);
	});
}

LRUCacheProxy.prototype.set = function(key, value) {
	send(this.namespace, 'set', key, value, function() {});
}

Object.defineProperty(LRUCacheProxy.prototype, 'pendingMessages', { get : function () { return Object.keys(pending).length; }, enumerable : true });

module.exports = LRUCacheProxy;

var LRUCache = require('./lru-cache-extensions');
var cluster = require('cluster');
var uuid = require('node-uuid');
var pending = {};

process.on('message', function onWorkerMessage(msg) {
	if (msg.source !== 'lru-cache-cluster') return;
	
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
	if (!(this instanceof LRUCacheProxy)) {
		if(cluster.isMaster) {

			var lru = new LRUCache(options);

			var methodCtor = function( baseMethod ) {
				return function( ) {
					var cb;
					if ( typeof ( cb = arguments[ arguments.length - 1 ] ) !== "function" ) {
						cb = undefined; }
					var value = baseMethod.apply( this, arguments );
					cb && cb( value ); 
					return value; }; }

			for( var p in { "get": 1, "count": 1, "complete": 1} ) {
				lru[ p ] = methodCtor( LRUCache.prototype[ p ] ); }

			return lru;
		}

		return new LRUCacheProxy(options);
	}

	this.namespace = options.namespace || 'default';

	send(this.namespace, 'constructor', options, function() {});
};

LRUCacheProxy.prototype.get = function(key, callback) {
	var failSafe = setTimeout(function() { failSafe = undefined; callback&&callback(undefined); }, 100);

	send(this.namespace, 'get', key, function(result) {
		if(!failSafe) return;

		clearTimeout(failSafe);

		callback&&callback(result.value);
	});
}

LRUCacheProxy.prototype.set = function(key, value) {
	send(this.namespace, 'set', key, value, function() {});
}


LRUCacheProxy.prototype.complete = function( key, seq, total, partialData, callback ) {
	var failSafe = setTimeout(function() { failSafe = undefined; callback&&callback(undefined); }, 100);
	send(this.namespace, 'complete', key, seq, total, partialData, function(result) {
		if(!failSafe) return;

		clearTimeout(failSafe);

		callback&&callback(result.value);
	});
}

LRUCacheProxy.prototype.count = function( key, inc, callback ) {
	var failSafe = setTimeout(function() { failSafe = undefined; callback&&callback(undefined); }, 100);
	send(this.namespace, 'count', key, inc, function(result) {
		if(!failSafe) return;

		clearTimeout(failSafe);

		callback&&callback(result.value);
	});
}

Object.defineProperty(LRUCacheProxy.prototype, 'pendingMessages', { get : function () { return Object.keys(pending).length; }, enumerable : true });

module.exports = LRUCacheProxy;

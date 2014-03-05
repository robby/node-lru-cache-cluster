var cluster = require('cluster');
var LRUCache = require('lru-cache');
var caches = {};

if (cluster.isMaster) {
	cluster.on('fork', function(worker) {
		worker.on('message', function(msg) {
			if (msg.source !== 'lru-cache-cluster') return;

			var lru = caches[msg.namespace];

			function send(cmd, data){
				data.source = 'lru-cache-cluster';
				data.cmd = cmd;
				data.namespace = lru.namespace;
				data.id = msg.id;

				worker.send(data);
			}

			var switcheroo = {
				max: function () {},
				lengthCalculator: function () {},
				length: function () {},
				itemCount: function () {},
				forEach: function () {},
				keys: function () {},
				values: function () {},
				reset: function () {},
				dump: function () {},
				dumpLru: function () {},
				set: function (args) {
					lru.set(args[0], args[1]);
					
					send('setResponse', {});
				},
				has: function () {},
				get: function (args) {
					var value = lru.get(args[0]);

					send('getResponse', { value: value });
				},
				peek: function () {},
				pop: function () {},
				del: function () {},
				constructor: function(args) {
					lru = caches[msg.namespace] = LRUCache(args[0]);
					lru.namespace = msg.namespace;

					send('constructorResponse', {});
				}
			};

			msg.cmd && switcheroo[msg.cmd] && switcheroo[msg.cmd](msg.arguments);
		});
	});
}

module.exports = require('./LRUCacheProxy');
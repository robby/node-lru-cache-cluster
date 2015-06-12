var cluster = require('cluster');
var LRUCache = require('lru-cache');
var caches = {}, messages = 0, ts;

if (cluster.isMaster) {
	cluster.on('fork', function(worker) {

		var lru, f;

		var send = function(cmd, data, msg){
			data.source = 'lru-cache-cluster';
			data.cmd = cmd;
			data.namespace = lru.namespace;
			data.id = msg.id;
			worker.send( data ); };

		var nop = function () {};
		var set = function ( args, msg ) {
					lru.set( args[0], args[1] );
					send( 'setResponse', {}, msg ); };
		var get = function ( args, msg ) {
					var value = lru.get(args[0]);
					send( 'getResponse', { value: value }, msg ); };
		var count = function( args, msg ) {
					var value = lru.count(args[0],args[1]);
					send( 'getCount', { value: value }, msg ); };
		var complete = function( args, msg ) {
					var value = lru.complete( args[ 0 ], args[ 1 ], args[ 2 ], args[ 3 ] );
					send( 'getComplete', { value: value }, msg ); };
		var constructor = function( args, msg ) {
					var ns = msg.namespace;
					if ( !( lru = caches[ ns ] ) ) {
						caches[ ns ] = lru = LRUCache(args[0]); } 
					lru.namespace = ns;
					send('constructorResponse', {}, msg); };

		var switcheroo = {
			max: nop,
			lengthCalculator: nop,
			length: nop,
			itemCount: nop,
			forEach: nop,
			keys: nop,
			values: nop,
			reset: nop,
			dump: nop,
			dumpLru: nop,
			set: set, // --
			has: nop,
			get: get, // --
			complete: complete, // -- 
			count: count, // --
			peek: nop,
			pop: nop,
			del: nop,
			constructor: constructor // --
		};
		
		worker.on('message', function(msg) {

			// some basic performace stats
			// if ( !( ts ) ) { ts = ( new Date( ) ).valueOf(); }
			// if ( !( ( ++messages ) % 1000 ) ) console.log( messages, messages / ( ( new Date( ) ).valueOf() - ts ) );
			
			if (msg.source !== 'lru-cache-cluster') return;

			lru = caches[ msg.namespace ];
			( f = msg.cmd ) && ( f = switcheroo[ f ] ) && f( msg.arguments, msg );
			f = undefined;

		});
	});
}

module.exports = require('./LRUCacheProxy');
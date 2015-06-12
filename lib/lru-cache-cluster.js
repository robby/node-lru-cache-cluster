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
					var key = args[ 0 ], inc = args[ 1 ];
					var it = lru.get( key );
					if ( isNaN ( it ) ) { 
						it = 0; }
					it += inc; lru.set( key, it );
					send( 'getCount', { value: it }, msg ); };
		var complete = function( args, msg ) {
					var key = args[ 0 ], seq = args[ 1 ], total = args[ 2 ], partialData = args[ 3 ];
					var set = false, it = lru.get( key ) || ( ( set = true ) && { c: [], w: 0 } );
					++it.w; it.c[ seq ] = partialData;
					// console.log( args, it );
					if ( it.w === total ) {
						if ( !set ) {
							lru.del( key ); }
						send( 'getComplete', { value: it.c.join( "" ) }, msg ); }
					else if ( set ) {
						// console.log( "setting " );
						lru.set( key, it ); 
						send( 'getComplete', { value: "" }, msg ); } };
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
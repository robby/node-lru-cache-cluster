var LRUCache = require('lru-cache');

LRUCache.prototype.count = function(key, inc){
	var lru = this;
	var value = lru.get( key );
	var it = lru.get( key );
	if ( isNaN ( it ) ) { 
		it = 0; 
	}
	it += inc; lru.set( key, it );
	return it;
};

LRUCache.prototype.complete = function( key, seq, total, partialData ) {
	
	var lru = this;
	var set = false;
	var it = lru.get( key ) || ( ( set = true ) && { c: [], w: 0 } );
	
	++it.w; it.c[ seq ] = partialData;
	
	if ( it.w === total ) {
		if ( !set ) {
			lru.del( key ); }
		it = it.c.join( "" ); 
	}
	else if ( set ) {
		lru.set( key, it ); 
		it = ""; 
	}

	return it;
};

module.exports = LRUCache;

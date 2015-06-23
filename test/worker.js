var LRU = require('../');
/*
var profileCache = LRU({ maxAge: 1000 * 60 * 15, namespace: 'profiles' });

function fetchProfile(username, callback) {
  console.log('requesting ' + username);

  setTimeout(function(){
    // simulating network
    callback({ username: username, type: 'user' });
  }, 100);
}

function checkCache(username) {
  profileCache.get(username, function(profile) {
    console.time('checking cache for ' + username, profile);

      if (!profile) {
      fetchProfile(username, function(profile) {
        profileCache.set(username, profile);

        console.timeEnd('checking cache for ' + username, profile);
      });
    }
    else {
      console.timeEnd('checking cache for ' + username, profile);
    }
  });  
}

setTimeout(function(){
  checkCache('robby');
  checkCache('michael');
  checkCache('steve');

  setTimeout(function(){ 
    checkCache('robby'); checkCache('michael'); checkCache('steve');

    setTimeout(function(){ process.exit(); }, 2000);
  }, 250);
}, 1000);
*/

var cluster = require( "cluster" );
var test = require('tap').test;

/*
test("basic", function (t) {
  var cache = LRU( { max: 10, namespace: "basic " + ( ( cluster.worker || { } ).workerID || 0 ) } );
  cache.set("key", "value")

  cache.get('key', function(value) {
    t.equal(value, 'value');
  });

  cache.get('nada', function(value) {
    t.equal(value, undefined);
  });

  setTimeout(function(){ t.end(); }, 1000);
})

test("least recently set", function (t) {
  var cache = LRU( { max: 2, namespace: "least recently set " + ( ( cluster.worker || { } ).workerID || 0 ) } )
  cache.set("a", "A")
  cache.set("b", "B")
  cache.set("c", "C")

  cache.get('c', function(value) {
    t.equal(value, 'C');
  });

  cache.get('b', function(value) {
    t.equal(value, 'B');
  });

  cache.get('a', function(value) {
    t.equal(value, undefined);
  });

  setTimeout(function(){ t.end(); }, 1000);
})

test("lru recently gotten", function (t) {
  var cache = LRU( { max: 2, namespace: "lru recently gotten " + ( ( cluster.worker || { } ).workerID || 0 ) } )
  cache.set("a", "A")
  cache.set("b", "B")
  cache.get("a")
  cache.set("c", "C")

  cache.get('c', function(value) {
    t.equal(value, 'C');
  });

  cache.get('b', function(value) {
    t.equal(value, undefined);
  });

  cache.get('a', function(value) {
    t.equal(value, 'A');
  });

  setTimeout(function(){ t.end(); }, 1000);
})
*/
test("lru complete test", function (t) {

  var dt = (new Date()).valueOf(), dtMax = dt + 1;
  var cache = LRU( { max: 10000000, namespace: "complete" } );

  var pieces = 12, items = 10000, workers = require("os").cpus().length >> 2;
  for( var i = ( cluster.worker || {} ).workerID - 1; i < pieces; i += workers ) {
    for ( var j = 0, l = items; j < l; j++ ) {
      cache.complete( ( "0000" + j.toString( 16 ) ).slice( -4 ), i, pieces, String( i ) + " ", function( data ) {
        dtMax = (new Date()).valueOf();
	if ( !data ) return;
        cache.count( "++++", 1 );
      } );
    }
  }  

  setTimeout( function() {
      cache.count( "++++", 0, function( value ) {
	console.log( ( dtMax - dt ) );
	console.log( Math.floor( pieces /* workers */ ) * items / ( dtMax - dt ) * 1000 );
        t.equal( value, items ); } ); }, 10000 );

  setTimeout(function(){ t.end(); }, 5000);
})

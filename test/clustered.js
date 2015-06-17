var cluster = require('cluster');
var LRUCacheCluster = require('../');

cluster.setupMaster({
		exec : 'worker',
		args : process.argv,
		silent : false
});

for( var i = 0, l = require("os").cpus().length >> 2; i < l; i++ ) {
	cluster.fork(); }

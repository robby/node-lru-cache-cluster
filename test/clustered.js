var cluster = require('cluster');
var LRUCacheCluster = require('../');

cluster.setupMaster({
		exec : 'worker',
		args : process.argv,
		silent : false
});

cluster.fork();
cluster.fork();
// cluster.fork();
// cluster.fork();
// cluster.fork();
// cluster.fork();

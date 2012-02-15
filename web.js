function randomString() {
    var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
    var string_length = 8;
    var rs = '';

    for (var i=0; i<string_length; i++) {
        var rnum = Math.floor(Math.random() * chars.length);
        rs += chars.substring(rnum,rnum+1);
    }

    return rs;
}

var express = require('express');

var app = express.createServer();

app.get('/', function(request, response) {
	data = "converse :: cherry.reflex.so";
	response.send(data);
});

app.get('/messages', function(request, response) {
	var Db = require('mongodb').Db,
    Connection = require('mongodb').Connection,
    Server = require('mongodb').Server;

	var db = new Db('chat', new Server("localhost", 27017, {}), {native_parser:false});
	
	i = 0;
	limit = request.param('limit');	
	messages = new Array();

	if(!limit) {
		limit = 5;
	}
	
	db.open(function(error, db) {
		if (error) throw error;
		db.collection('messages', function(err, collection) {
			collection.find({}, {'limit': limit}, function(err, cursor) {
				cursor.each(function(err, item) {
					if(!item) {
						// Do nothing.
						data = JSON.stringify(messages);
						
						db.close();
						response.send(data);
					} else {
						messages[i] = item;
						i = i + 1;
					}
				});
			});
		});
	});
});

app.get('/register', function(request, response) {
	user = request.param("username");
	token = randomString();
	
	var Db = require('mongodb').Db,
	         Connection = require('mongodb').Connection,
	         Server = require('mongodb').Server;
	
	var db = new Db('chat', new Server("localhost", 27017, {}), {native_parser:false});

	db.open(function(error, db) {
		if (error) throw error;
		db.collection('users', function(err, collection) {
			collection.find({'user':user}, function(err, cursor) {
				cursor.toArray(function(err, docs) {
					if(docs.length > 0) {
						handle = new Object();
						handle.status = "failure";
						handle.reason = "exists";
						
						data = JSON.stringify("0");
					} else {
						collection.insert({'user':user, 'token':token, 'method':"restful"});
						
						handle = new Object();
						handle.status = "success";
						handle.user = user;
						handle.token = token;
						handle.method = "restful";
								
						data = JSON.stringify(handle);
					}
					
					db.close();
					response.send(data);
				});
			});
		});
	});
});

app.get('/send', function(request, response) {
	user = request.param("username");
	token = request.param("token");
	message = request.param("message")
	
	var Db = require('mongodb').Db,
    Connection = require('mongodb').Connection,
    Server = require('mongodb').Server;

	var db = new Db('chat', new Server("localhost", 27017, {}), {native_parser:false});
	
	db.open(function(error, db) {
		if (error) throw error;
		db.collection('users', function(err, collection) {
			collection.find({'user':user}, function(err, cursor) {
				cursor.each(function(err, item) {
					if(!item) {
						// Do nothing.
					} else {
						if(item.token != token) {
							handle = new Object();
							handle.status = "failure";
							handle.reason = "token";
							
							data = JSON.stringify(handle);
							
							db.close();
							response.send(data);
						} else {
							db.collection('messages', function(err, c) {
								c.insert({'user':user, 'message':message, 'method':"restful"});

								handle = new Object();
								handle.status = "success";
								
								data = JSON.stringify(handle);
								
								db.close();
								response.send(data);
							});
						}
					}
					
					handle = new Object();
					handle.status = "failure";
					handle.reason = "user";
					
					data = JSON.stringify(handle);
					
					db.close();
					response.send(data);
				});
			});
		});
	});
});

var port = process.env.PORT || 3000;
app.listen(port, function() {
  //console.log("Web: " + port);
});

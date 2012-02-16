// Function to generate a random string/token.
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

// Include express.
var express = require('express');

// Start server.
var app = express.createServer();

// Default route.
app.get('/', function(request, response) {
	data = "converse :: cherry.reflex.so";
	response.send(data);
});

// Message timeline.
app.get('/messages', function(request, response) {
	// Set access control.
	response.header("Access-Control-Allow-Origin", "*");
	
	// Intialise database class.
	var Db = require('mongodb').Db,
    Connection = require('mongodb').Connection,
    Server = require('mongodb').Server;

	var db = new Db('chat', new Server("localhost", 27017, {}), {native_parser:false});
	
	i = 0;
	limit = request.param('limit');	
	messages = new Array();

	// Set limit if not present.
	if(!limit) {
		limit = 4;
	}
	
	db.open(function(error, db) {
		if (error) throw error;
		db.collection('messages', function(err, collection) {
			collection.find({}, function(err, cursor) {
				// Sort by "when" descending.
				cursor.sort({when: -1}).limit(limit);
				// Iterate over results.
				cursor.each(function(err, item) {
					if(!item) {
						// End of buffer.
						
						// Let's convert this to JSON.
						data = JSON.stringify(messages);
						
						// Close database connection.
						db.close();
						
						// Output response.
						response.send(data);
					} else {
						// Push message to buffer.
						messages[i] = item;
						
						// Increment i
						i = i + 1;
					}
				});
			});
		});
	});
});

app.get('/register', function(request, response) {
	// Set access header.
	response.header("Access-Control-Allow-Origin", "*");
	
	// Retrieve username and set token.
	user = request.param("username");
	token = randomString();
	
	// Intialize database.
	var Db = require('mongodb').Db,
	         Connection = require('mongodb').Connection,
	         Server = require('mongodb').Server;
	
	var db = new Db('chat', new Server("localhost", 27017, {}), {native_parser:false});

	db.open(function(error, db) {
		if (error) throw error;
		db.collection('users', function(err, collection) {
			collection.find({'user':user}, function(err, cursor) {
				cursor.toArray(function(err, docs) {
					// Does this user exist?
					if(docs.length > 0) {
						// Yes! Let's fail this registration attempt.
						// Build return object.
						handle = new Object();
						handle.status = "failure";
						handle.reason = "exists";
						
						// Convert to JSON.
						data = JSON.stringify("0");
					} else {
						// User does not exist, let's register it.
						collection.insert({'user':user, 'token':token, 'method':"restful"});
						
						// Build return object.
						handle = new Object();
						handle.status = "success";
						handle.user = user;
						handle.token = token;
						handle.method = "restful";
								
						// Convert to JSON.
						data = JSON.stringify(handle);
					}
					
					// Close database handle.
					db.close();
					
					// Send response.
					response.send(data);
				});
			});
		});
	});
});

app.get('/send', function(request, response) {
	// Set access header.
	response.header("Access-Control-Allow-Origin", "*");
	
	// Retrieve query variables.
	user = request.param("username");
	token = request.param("token");
	message = request.param("message")
	
	// Get current time.
	time = new Date();
	
	// Initialize database.
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
							// Did this user have the right token?
							
							// Build return object.
							handle = new Object();
							handle.status = "failure";
							handle.reason = "token";
							
							// Convert to JSON.
							data = JSON.stringify(handle);
							
							// Close database handle.
							db.close();
							
							// Send response.
							response.send(data);
						} else {
							db.collection('messages', function(err, c) {
								// Insert message in to data store.
								c.insert({'user':user, 'message':message, 'method':"restful", when: time});

								// Build return object.
								handle = new Object();
								handle.status = "success";
								
								
								// Convert to JSON.
								data = JSON.stringify(handle);
								
								// Close database handle.
								db.close();
								
								// Send response.
								response.send(data);
							});
						}
					}
					
					// Does this user exist? Guess not.
					
					// Build return object.
					handle = new Object();
					handle.status = "failure";
					handle.reason = "user";
					
					// Convert to JSON.
					data = JSON.stringify(handle);
					
					// Close database handle.
					db.close();
					
					// Send response.
					response.send(data);
				});
			});
		});
	});
});

// Let's set the port we want to listen on.
var port = process.env.PORT || 3000;

// Start the server!
app.listen(port, function() {
  //console.log("Web: " + port);
});

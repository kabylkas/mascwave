const express  = require('express');
const app = express();
const http = require('http').Server(app);
const fileUpload = require('express-fileupload');
const fs = require('fs');
const bodyParser = require('body-parser');
const io = require('socket.io')(http,{
	cookie: true
});

var file = {
    name: "",
    mv : "",
    mimetype : "",
    data : "",
    client_id:"",
	eva:null
};

var eva;

// default options
app.use(fileUpload());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Index.html and other js and css files
app.use(express.static(__dirname));
app.get("/",function(req,res){
    res.sendFile(__dirname+"/index.html");
	res.sendFile(__dirname+"/default.js");
	res.sendFile(__dirname+"/index.css");
});


// On Upload
app.post('/upload', function(req, res) {
    if (!req.files){
		if(req.body){
			var t;
			var tighttext = req.body.tight_form_text;
			console.log(tighttext);
			try {t = eval('(function(){'+tighttext+'}())');} catch(err){return res.status(400).send(err);}
			var tight_json = generate_tight(t);
			fs.writeFile("tmp/"+req.body.tight_form_id, tight_json, function(err) {
				if(err) {
					return console.log(err);
				}

				console.log("The file "+req.body.tight_form_id+" was saved!");
			}); 
		} else 
			return res.status(400).send('No files were uploaded nor any input was given.');
	} else {
		// The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
		//console.log(req.body.fileName);
		let sampleFile = req.files.sampleFile;
		//console.log(sampleFile);
		

		console.log("file uploaded: "+ sampleFile);
		// Use the mv() method to place the file somewhere on your server
		var newFileName = 'tmp/'+req.body.fileName;//req.files.sampleFile.name;
		sampleFile.mv(newFileName, function(err) {
			if (err)
				return res.status(500).send(err);
			file.name = req.body.fileName;//req.files.sampleFile.name;
			file.mv = req.files.sampleFile.mv;
			file.mimetype = req.files.sampleFile.mimetype;
			file.data = req.files.sampleFile.data;
			//file.eva = eval('('+file.data+')');
			//console.log(file.eva.signal.length);
			//eva = eval('('+file.data+')');
			//console.log("Signal Length"+eva.signal.length);
			//res.send('File '+newFileName+' uploaded!\n'+file.data);
		});
	}
	res.writeHead(302,{'Location':'index.html'});
	res.end();
});

// On client connect
io.on('connection',function(socket){
	console.log("A User connected " + socket.id);
	socket.emit('initdata', socket.id);
	socket.on('disconnect',function(){
	   console.log('A User disconnected');
        });
	var k;

//On client sent data
	socket.on('clientdata', function(data){
		console.log(data.filename+"\n"+data.socketid+": \n start time:"+data.start_time+"\n window size:"+data.window_size+ "\n element start: "+data.v_start_time+"\n element end:"+data.v_size);
		if(k){ //Makes sure k is defined
			data.server_source.signal = k.signal.slice(data.v_start_time,data.v_size);
			console.log("Source" + data.server_source);
		}
		var a = 0;
		//if(file.eva != null)
		//	a = eva.signal.length;
		socket.emit('serverdata', data);
	});
	
//On client request file
	socket.on('requestfile', function(userdata){
		//console.log("user data prior\n"+ userdata.server_source.signal);
		if(userdata.filename != null){
			fs.readFile("tmp/"+userdata.filename,'utf8',function(err,data){
			if(err) console.log(err);
			else{
				//console.log("Data:\n "+data);
				try {
					k = eval('('+data+')');
				}
				catch(err) {
					
				}
				userdata.source_size = k.signal.length;
				console.log("size: "+ userdata.source_size);
				userdata.server_source.signal = k.signal.slice(userdata.v_start_time,userdata.v_size);
				console.log("Chunk of data \n" + JSON.stringify(userdata.server_source.signal,null,4));
				socket.emit('serverdata', userdata);
			}
		});
		}
		//socket.emit('serverdata', data);
	});
	
});

//On client send file
	

// Start Server
var server = http.listen(5901, function(){
    console.log('Listening on port %d', server.address().port);
});

function generate_tight(array){
	if (array != null || array != '' || !array.includes('\n')){
		var obj = require('csv-string'),
		arr = obj.parse(array);
		console.log(arr);
		//{signal:[{ name: 'I-18', wave: '=...=', node: '\u0012', data: [ 'iAALU' ] }]}
		var result = '{ signal : [{name: "I-1", wave:\'';
		for (p =0 ; p < arr[0].length;p++){
			result += '=';
		}
		result += '\', node: \'\\u0001\', data:[';
		for (p =0 ; p < arr[0].length;p++){
			if(p !=0){
				result += ',';
			}
			result += '\''+arr[0][p]+'\'';
		}
		result += '] }]}';
		console.log(result);
	}
	return result;
}


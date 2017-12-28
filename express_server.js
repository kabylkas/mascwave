const express  = require('express');
const app = express();
const http = require('http').Server(app);
const fileUpload = require('express-fileupload');
const fs = require('fs');
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

// Index.html and other js and css files
app.use(express.static(__dirname));
app.get("/",function(req,res){
    res.sendFile(__dirname+"/index.html");
	res.sendFile(__dirname+"/default.js");
	res.sendFile(__dirname+"/index.css");
});


// On Upload
app.post('/upload', function(req, res) {
    if (!req.files)
        return res.status(400).send('No files were uploaded.');

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
		res.writeHead(302,{'Location':'index.html'});
		res.end();
    });
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
		data.server_source.signal = k.signal.slice(data.v_start_time,data.v_size);
		console.log("Source" + data.server_source);
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
				console.log("Chunk of data \n" + userdata.server_source.signal);
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



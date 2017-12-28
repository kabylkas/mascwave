var http = require('http');
var formidable = require('formidable');
var fs = require('fs');
var parse = require('parse-files');
console.log("Starting");
var data1 = "";
http.createServer(function (req, res) {
    if (req.url == '/fileupload') {
        var form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {
            var oldpath = files.filetoupload.path;
            var newpath = '/tmp/' + files.filetoupload.name;
            fs.rename(oldpath, newpath, function (err) {
                if (err) throw err;
		fs.readFile(newpath,'utf8',function(err,data){
		  if(err) console.log(err);
		  else{
		    data1 = data;
		    console.log(data);
		    var k = eval('('+data+')');
		    console.log(k.signal[1].name);
		  }
		});
		res.writeHead(302,{'Location': 'http://54.219.189.158:5901'});
            });
        });
    } //else {
	const NodeCache = require( "node-cache" );
	const myCache = new NodeCache( { stdTTL: 100, checkperiod: 120 } );
	var value;
	try{
		value = myCache.get( "myKey", true );
	} catch( err ){
		// ENOTFOUND: Key `not-existing-key` not found 
		var obj = { my: "Special", variable: 42 };
		var success = myCache.set( "myKey", obj, 10 );
		console.log("Success: "+success );
	}
	console.log("Value:" + value);
	
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write('<form action="fileupload" method="post" enctype="multipart/form-data">');
        res.write('<input type="file" name="filetoupload"><br>');
        res.write('<input type="submit">');
        res.write('</form>');
        if(data1 != "") res.send(data1);
        return res.end();
//    }
}).listen(5901);

// index.js start of file
var express = require('express');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var multer = require('multer'),
    bodyParser = require('body-parser'),
    path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;
var child;

var https = require('https');
var http = require('http');
var html = require('html');

var mime = require('mime-types');
var auth = require('basic-auth');
var request = require('request');

var rimraf = require('rimraf');
var ejs = require('ejs');

require('log-timestamp');

var server = "localhost";
var thePort = 5023;
var port = ':' + thePort;
var useHttps = false;

var app = new express();
app.use(cookieParser());
var jsonParser = bodyParser.json({limit: '50mb'});
// var rootPath = 'F:/2018-01-11-betrand'; // for suuha
// var rootPath = 'E:/project/7.26'; // for blue
var rootPath = '/home/suuha'; // for sandbox
var authUrl = 'http://localhost:3000/login';
var loginPageUrl = 'http://localhost:3000/#/logins?redirectUrl=';
var uploadPath = '/mounts/share/uploads/';
var outputPath = '/mounts/output/';
var formatPath = '/mounts/format/';
// var uploadPath = 'E://mounts/share/uploads/';
// var outputPath = 'E://mounts/output/';
// var formatPath = 'E://mounts/format/';

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

app.use(session({
    secret: 'beep boop beep, beep boop boop',
    cookie: {
        secure: false,
        // httpOnly: false
    },
    resave: true,
    saveUninitialized: false
}));

function checkSignOn(cookie, cbSucc, cbErr) {
    var options = { method: 'GET',
        url: authUrl,
        headers: {
            // 'Cache-Control': 'no-cache',
            Cookie: 'connect.sid=' + cookie + '; sid=' + cookie
            // Cookie: 'connect.sid=' + cookie
        }
    };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);
        data = JSON.parse(body);
        if (data.anonymous === false) {
            cbSucc();
        } else {
            cbErr();
        }
    });
}




if (useHttps) {
    swaggerDocument['host'] = server;
    swaggerDocument['schemes'] = ['https'];
}

app.use('/review/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(function(req, res, next) {
    // var credentials = auth(req);
    // res.setHeader('Access-Control-Allow-Origin', '*');
    function signOn() {
        res.redirect(loginPageUrl + req.headers.host + req.originalUrl);
    }
    // console.log(req.cookies['sid']);
    checkSignOn(req.cookies['sid'], function() {
        // console.log('------', req.cookies['connect.sid']);
        // console.log('******', req.cookies['sid']);
        // if (req.cookies['connect.sid'] !== req.cookies['sid'])
        //     res.cookie('connect.sid', req.cookies['sid']);
        next();
    }, signOn);
    // var sid = req.session.sid;
    // if (sid) {
    //     checkSignOn(sid, next, signOn);
    // } else {
    //     sid = req.query.sid;
    //     if (!sid) {
    //         signOn();
    //     } else {
    //         req.session.sid = sid;
    //         checkSignOn(sid, next, signOn);
    //     }
    // }
});


app.use(function(req, res, next) {
    // console.log('------', req.cookies['connect.sid']);
    // console.log('******', req.cookies['sid']);
    if (req.cookies['connect.sid'] !== req.cookies['sid'])
        res.cookie('connect.sid', req.cookies['sid']);
    next();
});

app.get('/review/studio-format/:format', function(req, res) {
    try {
        res.setHeader('content-type', 'application/json');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.status(200);
        fs.readFile(path.join(formatPath, req.params.format + '.json'), 'utf8', function(err, data) {
            if (err) return res.status(500).send(err);
            res.end(data);
        });
    } catch (err) {
        console.log("/format.json: something else went wrong " + err);
        res.status(500).send("something went wrong\n");
    }
});

app.get('/review/js/annotorious/annotator.js', function(req, res) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.status(200);
    res.sendFile(path.join(rootPath, '/code/AGInsurance/webserver/companion/review/js/annotorious/annotator.js'));
});
app.get('/review/css/annotator.css', function(req, res) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.status(200);
    res.sendFile(path.join(rootPath, '/code/AGInsurance/webserver/companion/review/css/annotator.css'));
});

app.use(express.static(path.join(rootPath, '/code/AGInsurance/webserver/companion/')));

// view engine setup
app.set('views', path.join(rootPath, '/code/AGInsurance/webserver/companion/'));
app.set('view engine', "ejs");

var upload = multer({
    dest: uploadPath
}).fields([{
    name: 'file',
    maxCount: '1'
}]);

function runUpload(job, done) {
    try {
        documentModel.findOne({
            'id': job.data.filename
        }, function(err, document) {
            if (err || !document) {
                console.log('No document with that id: ' + err);
                return done(new Error('No document with that id'));
            }
            document.timings.start = new Date();
            document.save(function(err) {
                if (err) {
                    return done(new Error('Database error'));
                }
                command = rootPath + '/code/AGInsurance/scripts/api_wrapper.sh "' + job.data.filename + '" "' + job.data.originalname + '" "' + job.data.instance + '"';
                if (useHttps) {
                    command = 'sudo -u azureuser ' + command;
                }

                console.log('/BATCH: ' + command);
                exec(command, function(error, stdout, stderr) {
                    try {
                        if (error) {
                            console.log("/BATCH: command failed for " + job.data.filename + ' using command: ' + command)
                            return done(new Error('Command failed'));
                        }
                        done();
                    } catch (err) {
                        console.log("/BATCH: command failed for " + job.data.filename + ' using command: ' + command)
                        return done(new Error('Command failed'));
                    }
                });
            });
        });
    } catch (err) {
        return done(new Error('Command failed'));
    }
}

app.post('/review/batch/:instance',
    function(req, res) {
        var receivedtime = new Date();
        upload(req, res, function(err) {
            if (err) {
                // An error occurred when uploading
                res.status(408);
                res.end("problem with file upload - should be form-encoded with field name 'file'\n");
                return
            }

            if (req.files['file'] === undefined || req.files['file'][0] === undefined) {
                res.status(409);
                res.end("no file upload\n");
            }

            var instance = req.params.instance;
            console.log(instance);

            var supported = ["SEPA-mandate","Home-invoice","Health-invoice","Contract-mgt","Health-splitter","Placement-mandate"];
            var domainName = ["ag_sepa_mandate","ag_home_invoice","ag_health_invoice","ag_contract_mgt","ag_health_split","ag_placement_mandate"];

            var supportedIndex = supported.indexOf(instance);
            if(instance == undefined || supportedIndex == -1) {
                res.status(422)
                res.end("Please specify which instance of the API you want to use (" + supported.join(", ") + ")\n");
                return
            }

            try {
                extension = path.extname(req.files['file'][0].originalname.toLowerCase()).substr(1);

                fs.renameSync(req.files['file'][0].destination + req.files['file'][0].filename, req.files['file'][0].destination + req.files['file'][0].filename + "." + extension);
                fs.mkdirSync(req.files['file'][0].destination + req.files['file'][0].filename);
                fs.renameSync(req.files['file'][0].destination + req.files['file'][0].filename + "." + extension, req.files['file'][0].destination + req.files['file'][0].filename + "/input." + extension)

                console.log("/BATCH: File received, unique code is: " + req.files['file'][0].filename);

                documentModel.create({
                    id: req.files['file'][0].filename,
                    domain: domainName[supportedIndex],
                    subdomain: 'api',
                    path: uploadPath + req.files['file'][0].filename + '/',
                    timings: {
                        receive: receivedtime,
                    }
                }).then(document => {
                    queue.create('batch', {
                        title: req.files['file'][0].originalname,
                        url: 'http' + (useHttps ? 's' : '') + '://' + server + port + '/review/' + req.files['file'][0].filename,
                        filename: req.files['file'][0].filename,
                        originalname: req.files['file'][0].originalname,
                        instance: instance
                    }).ttl(600000).attempts(1).save(function(err) {
                        if (err) {
                            res.status(422);
                            res.end("something went wrong (004)\n");
                            return;
                        }
                        var reply = JSON.stringify({
                            "unique_code": req.files['file'][0].filename
                        });
                        res.status(200);
                        res.setHeader('Content-Type', 'application/json');
                        console.log('replying with: ' + reply)
                        res.end(reply);
                    });
                });
            } catch (err) {
                res.status(422);
                res.end("something went wrong (002)\n");
            }
        });
    });

app.post('/review',
    function(req, res) {
        upload(req, res, function(err) {
            if (err) {
                // An error occurred when uploading
                res.status(408);
                res.end("problem with file upload - should be form-encoded with field name 'file'\n");
                return
            }

            var instance = req.body.instance;
            console.log(instance);
            var supported = ["SEPA-mandate","Home-invoice","Health-invoice","Contract-mgt","Health-splitter","Placement-mandate"];
            if(instance == undefined || supported.indexOf(instance) == -1)
            {
                res.end("Please specify which instance of the API you want to use (" + supported.join(", ") + ")\n");
                return
            }

            if (req.files['file'] === undefined || req.files['file'][0] === undefined) {
                res.status(409);
                res.end("no file upload\n");
                return
            }
            try {
                extension = path.extname(req.files['file'][0].originalname.toLowerCase()).substr(1);

                console.log(req.files['file'][0].filename)
                fs.renameSync(req.files['file'][0].destination + req.files['file'][0].filename, req.files['file'][0].destination + req.files['file'][0].filename + "." + extension);
                fs.mkdirSync(req.files['file'][0].destination + req.files['file'][0].filename);
                fs.renameSync(req.files['file'][0].destination + req.files['file'][0].filename + "." + extension, req.files['file'][0].destination + req.files['file'][0].filename + "/input." + extension)

                console.log("/UPLOAD: File received, unique code is: " + req.files['file'][0].filename);

                var obj = {
                    "redirect": '/review/' + req.files['file'][0].filename,
                    "instance": instance
                };
                var reply = JSON.stringify(obj);
                console.log(obj);
                console.log("HI");
                res.setHeader('Content-Type', 'application/json');
                res.status(200);
                console.log("ONE");
                res.end(reply);

                console.log("TWO");
                command = code_dir + '/code/AGInsurance/scripts/api_wrapper.sh "' + req.files['file'][0].filename + '" "' + req.files['file'][0].originalname + '" "' + instance + '"';
                console.log(command);
                if (useHttps)
                    command = 'sudo -u azureuser ' + command;

                console.log(command);

                exec(command, function(error, stdout, stderr) {
                    if (error) {
                        console.log("/UPLOAD: command failed for " + req.files['file'][0].filename)
                        console.log(stdout);
                        console.log(stderr);
                    }
                });
            } catch (err) {
                console.log(err);
                console.log("caught error");
                res.status(422);
                res.end("something went wrong (002)\n");
            }
        });
    });

app.post('/review/upload',
    function(req, res) {
        upload(req, res, function(err) {
            var instance = req.body.instance;
            var supported = ["SEPA-mandate","Home-invoice","Health-invoice","Contract-mgt","Health-splitter"];
            if(instance === undefined || supported.indexOf(instance) === -1)
            {
                res.end("Please specify which instance of the API you want to use (SEPA-mandate, Contract-mgt, Home-invoice, Health-invoice)\n");
                return
            }

            console.log(instance);
            if (err) {
                // An error occurred when uploading
                res.status(408);
                res.end("problem with file upload - should be form-encoded with field name 'file'\n");
                return
            }

            if (req.files['file'] === undefined || req.files['file'][0] === undefined) {
                res.status(409);
                res.end("no file upload\n");
                return
            }
            try {
                extension = path.extname(req.files['file'][0].originalname.toLowerCase()).substr(1);

                fs.renameSync(req.files['file'][0].destination + req.files['file'][0].filename, req.files['file'][0].destination + req.files['file'][0].filename + "." + extension);
                fs.mkdirSync(req.files['file'][0].destination + req.files['file'][0].filename);
                fs.renameSync(req.files['file'][0].destination + req.files['file'][0].filename + "." + extension, req.files['file'][0].destination + req.files['file'][0].filename + "/input." + extension);

                console.log("/UPLOAD: File received, unique code is: " + req.files['file'][0].filename);
                command = code_dir + '/code/AGInsurance/scripts/api_wrapper.sh ' + req.files['file'][0].filename + ' ' + req.files['file'][0].originalname + ' ' + instance;
                if (useHttps)
                    command = 'sudo -u azureuser ' + command;

                console.log(command);
                exec(command, function(error, stdout, stderr) {
                    if (error) {
                        console.log("/UPLOAD: command failed for " + req.files['file'][0].filename);
                        console.log(stdout);
                        console.log(stderr);
                        return;
                    }
                    var reply = JSON.parse(fs.readFileSync(outputPath + req.files['file'][0].filename + "/input.json", 'utf8'));
                    console.log("HERE");
                    console.log(reply);
                    res.setHeader('Content-Type', 'application/json');
                    console.log("I");
                    res.status(200);
                    console.log("AM");
                    reply = JSON.stringify(reply);
                    res.end(reply);
                });
            } catch (err) {
                res.status(422);
                res.end("something went wrong (002)\n");
            }
        });
    });

app.get('/review/output/:param/input.json', function(req, res) {
    try {
        res.setHeader('content-type', 'application/json');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.status(200);
        fs.readFile(outputPath + req.params.param + '/input.json', 'utf8', function(err, data) {
            if (err) {
                res.end('{"ready": false}');
                return;
            }
            res.end(data);
        });
    } catch (err) {
        console.log("/input.json: something else went wrong " + err);
        res.status(500);
        res.end("something went wrong\n");
    }
});

app.get('/review/save/:param1', function(req, res) {
    try {
        console.log('GET SAVE: ' + req.params.param1);
        res.setHeader('content-type', 'application/json');
        res.status(200);
        fs.readFile(uploadPath + req.params.param1 + '/save.json', 'utf8', function(err, data) {
            if (err) {
                res.end(JSON.stringify([]));
                return;
            }
            if (data == "undefined")
                data = [];
            res.send(data);
        });
    } catch (err) {
        console.log("/GET SAVE: something else went wrong " + err);
        res.status(500);
        res.send("something went wrong (005)\n");
    }
});

app.post('/review/save/:param1', jsonParser, function(req, res) {
    try {
        fs.writeFile(uploadPath + req.params.param1 + '/save.json', JSON.stringify(req.body.saveData), 'utf-8',
            function(err) {
                if (err) {
                    console.log("/POST SAVE: something went wrong " + err);
                    res.status(422);
                    res.end("something went wrong (005)\n");
                    return;
                }
                if (req.body.formatData) {
                    fs.writeFile(formatPath + req.body.formatData.name + '.json', JSON.stringify(req.body.formatData.data), 'utf-8',
                        function(err) {
                            if (err) {
                                console.log("/POST Format: something went wrong " + err);
                                res.status(422);
                                res.end("something went wrong (005)\n");
                                return;
                            }
                            console.log('POST SAVE: ' + req.params.param1);
                            res.sendStatus(200);
                        });
                } else {
                    res.sendStatus(200);
                }
            });
    } catch (err) {
        console.log("/POST SAVE: something else went wrong " + err);
        res.status(500);
        res.end("something went wrong (005)\n");
    }
});

/*
app.get('/', function(req, res) {
    console.log("/: called");
    res.render("review.ejs", {
        directory: "annotator",
        server: server,
        port: port.substr(1)
    });
});*/

app.get('/review/:param1', function(req, res) {
    console.log("/REVIEW: called");
    res.render("review/review.ejs", {
        directory: req.params.param1,
        server: server,
        port: port.substr(1)
    });
});

app.get('/review', function(req, res) {
    console.log("/review: called");
    res.render("review/review.ejs", {
        directory: "annotator",
        server: server,
        port: port.substr(1)
    });
});

app.post('/review/put', jsonParser, function(req, res) {
    console.log("/PUT: called");
    try {
        fs.writeFile(uploadPath + req.body.id + '/put.json', JSON.stringify(req.body), 'utf-8', function(err) {
            try {
                if (err) {
                    throw err;
                }
                console.log('/PUT: Written file to ' + req.body.id + '/put.json');
                // documentModel.findOne({
                //     'id': req.body.id
                // }, function(err, document) {
                //     if (err) {
                //         res.status(422);
                //         res.end("No document with that id");
                //         return;
                //     }
                //     delete req.body['id'];
                //     document.feedback = req.body;
                //     document.timings.feedback = new Date();
                //     document.save(function(err) {
                //         if (err) {
                //             res.status(500);
                //             res.end("Database error");
                //             return;
                //         }
                //         console.log("/PUT: successful");
                        res.status(200);
                        res.end('Thank you!');
                //     });
                // });
            } catch (err) {
                res.status(500);
                res.end("Database error");
            }
        });

    } catch (err) {
        res.end("something went wrong (005)\n");
    }
});

app.post('/review/ready', jsonParser, function(req, res) {
    try {
        console.log("/READY: called");
        res.setHeader('content-type', 'text/plain');
        res.status(200);
        res.end();
    } catch (err) {
        console.log("/READY: something went wrong");
        res.end("something went wrong (005)\n");
    }
});

app.post('/review/submit', jsonParser, function(req, res) {
    try {
        console.log("/SUBMIT: called");
        res.setHeader('content-type', 'text/plain');
        res.status(200);
        res.end();
    } catch (err) {
        console.log("/SUBMIT: something went wrong");
        res.end("something went wrong (005)\n");
    }
});

app.get('/review/overview', function(req, res) {
    console.log("/OVERVIEW: called");
    res.render("review/overview.ejs", {
    });
});

var actualServer;
//Launch the server
if (useHttps) {
    var credentials = {
        key: fs.readFileSync('/mounts/protected/aginsurance/privkey.pem'),
        cert: fs.readFileSync('/mounts/protected/aginsurance/fullchain.pem'),
        ca: fs.readFileSync('/mounts/protected/aginsurance/chain.pem')
    };
    var httpsServer = https.createServer(credentials, app);
    // var httpsServer = http.createServer(app);
    actualServer = httpsServer.listen(thePort);
} else {
    var httpServer = http.createServer(app);
    actualServer = httpServer.listen(parseInt(port.substr(1)));
}
console.log("NOTE: see http" + (useHttps ? 's' : '') + "://" + server + port + "/api-docs");

function shutdown() {
    actualServer.close();
    // mongoose.disconnect();
    process.exit(0);
}

for (var signal of ['SIGUSR1', 'SIGTERM', 'SIGINT', 'SIGPIPE', 'SIGHUP', 'SIGBREAK']) {
    process.on(signal, shutdown);
}



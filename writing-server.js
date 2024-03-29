// HTTP Portion
var http = require('http');

// Path module
var path = require('path');

// Using the filesystem module
var fs = require('fs');

require('dotenv').config();

// import OpenAI from 'openai';
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // defaults to process.env["OPENAI_API_KEY"]
});

var server = http.createServer(handleRequest);
server.listen(8080);
console.log('--== Server started on port 8080 ==--');

const io = require('socket.io')(server)

console.log('--== socket.io listening on server ==--');

function saveScriptJSON(data) {
  let outfile = "ubik-demo-new.json"
  fs.writeFile(outfile, data, function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("scene was saved as "+outfile+" ("+data.length+" bytes)");
  }); 
}

let scriptJSON = fs.readFileSync("ubik-demo.json", "utf-8");

// console.log(scriptJSON);

function handleRequest(req, res) {
  // What did we request?
  var pathname = req.url;
  
  // If blank let's ask for index.html
  if (pathname == '/') {
    pathname = '/index.html';
  }
  
  // Ok what's our file extension
  var ext = path.extname(pathname);

  // Map extension to file type
  var typeExt = {
    '.html': 'text/html',
    '.js':   'text/javascript',
    '.css':  'text/css'
  };
  // What is it?  Default to plain text

  var contentType = typeExt[ext] || 'text/plain';

  // User file system module
  fs.readFile(__dirname + pathname,
    // Callback function for reading
    function (err, data) {
      // if there is an error
      if (err) {
        res.writeHead(500);
        return res.end('Error loading ' + pathname);
      }
      // Otherwise, send the data, the contents of the file
      res.writeHead(200,{ 'Content-Type': contentType });
      res.end(data);
    }
  );
}

// ======== SOCKET STUFF =========

io.sockets.on('connection', (socket) => {
  
    console.log("We have a new client: " + socket.id);

    socket.on('disconnect', () => console.log("Client has disconnected"));

    socket.on('prompt',(data) => {
      // Data comes in as whatever was sent, including objects
      let prompt = data["prompt"];
      let targetId = data["id"];

      console.log("received prompt: " + prompt + " for " + targetId);

      promptGPT(prompt, targetId, socket)

    });

    socket.on('save',(data) => {
      // Data comes in as whatever was sent, including objects
      console.log("received script as json: " + data.slice(0, 32));
      // save to local filesystem

      let outfile = "ubik-demo-new.json"
      fs.writeFile(outfile, data, function(err) {
          if(err) {
              return console.log(err);
          }
          console.log("scene was saved as "+outfile+" ("+data.length+" bytes)");
      }); 

    });

    socket.on('update',(data) => {
      // Data comes in as whatever was sent, including objects
      console.log("received updates from " + socket.id);
    
      // update script in memory from update
      scriptJSON = data;

      let json = JSON.parse(data);

      // cache script locally
      saveScriptJSON(data);

      // broadcast updated script to all clients
      socket.broadcast.emit('script', data);
      console.log("broadcast updated script to all clients")
    });

    socket.on('script',(data) => {
      // requested script
      console.log(socket.id+" requested script");
      
      // broadcast updated script to requesting client
      // console.log(scriptJSON);
      socket.emit('script', scriptJSON);
      console.log("broadcast updated script requesting client")
    });

  }
);

// ======== OpenAI Stuff =========

let gpt_prefs = {};
let verbose = false;

console.log('--== GPT Bot Ready ==--');

let prompt = ``;

function promptGPT(thisprompt, targetId, socket) {

  console.log(`~ this is a new prompt: ${thisprompt} on ${socket}`);

  let prompt = thisprompt;

  const gpt_args = {
    // model: "text-davinci-002",
    model: "gpt-3.5-turbo",
    // model: "gpt-3.5-turbo-instruct",
    prompt: prompt,
    max_tokens: 256,
    temperature: 0.7,
    top_p: 1.0,
    presence_penalty: 0,
    frequency_penalty: 0,
  };

  // ping open for completion
  (async () => {

    // create completion with given params
    prompt = gpt_args['prompt']

    console.log(`prompt: ${prompt.slice(0, 64)}...`);
    // console.log(`prompt: ${gpt_args['prompt']}`);
    // const gptResponse = await openai.createCompletion(gpt_args);

    // new ChatCompletions https://github.com/openai/openai-node#usage
    const gptResponse = await openai.chat.completions.create({
      messages: [{ role: 'user', content: gpt_args['prompt'] }],
      model: gpt_args['model'],
    });

    console.log(gptResponse);

    completion = gptResponse.choices[0].message.content;
    // console.log(`completion: ${completion.slice(0, 64)}...`);
    console.log(`completion: ${completion.slice(0, 32)}...`);

    let response = prompt + completion;

    // // trim if the response is too long (Discord limits posts to 2000 words)
    // if (response.length >= 2000) {
    //   console.log(`NOTICE: prompt+completion is too long (${response.length}) ,just returning completion (${completion.length})`);
    //   response = thisprompt + " " + completion;
    //   response = response.slice(-2000, -1);
    // }
    //       // console.log(response.length)

    const result = {
      completion: completion,
      id: targetId
    }

    // Send it to all other clients
    socket.emit('completion', result);
    console.log("emitted completion: ", result.toString().slice(0, 32), "on "+  socket);

  })();

}
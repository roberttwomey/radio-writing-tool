// HTTP Portion
var http = require('http');
// Path module
var path = require('path');

// Using the filesystem module
var fs = require('fs');

require('dotenv').config();

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

var server = http.createServer(handleRequest);
server.listen(8080);
console.log('--== Server started on port 8080 ==--');

// var io = require('socket.io').listen(server);

const io = require('socket.io')(server)
console.log('--== socket.io listening on server ==--');



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
      console.log("received prompt: " + prompt);

      promptGPT3(prompt, socket)

    });
  }
);

// ======== OpenAI Stuff =========

const openai = new OpenAIApi(configuration);
let gpt_prefs = {};
let verbose = false;

console.log('--== GPT-3 Bot Ready ==--');

let prompt = ``;


function promptGPT3(thisprompt, socket) {

  console.log(`~ this is a new prompt: ${thisprompt}`);

  let prompt = thisprompt;

  const gpt_args = {
    model: "text-davinci-002",
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
    const gptResponse = await openai.createCompletion(gpt_args);

    completion = gptResponse.data.choices[0].text;
    console.log(`completion: ${completion.slice(0, 64)}...`);

    let response = prompt + completion;

    // // trim if the response is too long (Discord limits posts to 2000 words)
    // if (response.length >= 2000) {
    //   console.log(`NOTICE: prompt+completion is too long (${response.length}) ,just returning completion (${completion.length})`);
    //   response = thisprompt + " " + completion;
    //   response = response.slice(-2000, -1);
    // }
    //       // console.log(response.length)

    const result = {
      completion: completion
    }

    // Send it to all other clients
    socket.emit('completion', result);
    console.log("emitted completion: ", result);

  })();

}

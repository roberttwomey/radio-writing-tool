// HTTP Portion
var http = require('http');

// Path module
var path = require('path');

// Using the filesystem module
var fs = require('fs');

// // file uploads with multer
// const multer = require('multer');

// // Configure multer for file storage
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, 'uploads/') // Destination folder
//     },
//     filename: function (req, file, cb) {
//         cb(null, file.fieldname + '-' + Date.now())
//     }
// });

require('dotenv').config();

// as imports
// import http from 'http';
// import path from 'path';
// import fs from 'fs';
// import dotenv from 'dotenv';
// dotenv.config();

// import OpenAI from 'openai';
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // defaults to process.env["OPENAI_API_KEY"]
});

var server = http.createServer(handleRequest);
server.listen(8080);
console.log('--== Server started on port 8080 ==--');

// var io = require('socket.io').listen(server);

const io = require('socket.io')(server)

// import { Server } from "socket.io";
// const io = new Server(server)

console.log('--== socket.io listening on server ==--');

function handleRequest(req, res) {
  // What did we request?
  var pathname = req.url;
  
  // If blank let's ask for index.html
  if (pathname == '/') {
    pathname = '/index.html';
  } else if (pathname == '/upload') {
    // do upload

    break;
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

    socket.on('save',(data) => {
      // Data comes in as whatever was sent, including objects
      console.log("received script as json: " + data);
      // save to local filesystem

      let outfile = "ubik-demo-new.json"
      fs.writeFile(outfile, data, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("scene was saved as "+outfile+" ("+data.length+" bytes)");
    }); 

    });
  }
);

// ======== OpenAI Stuff =========

// const openai = new OpenAIApi(configuration);
let gpt_prefs = {};
let verbose = false;

console.log('--== GPT-3 Bot Ready ==--');

let prompt = ``;


function promptGPT3(thisprompt, socket) {

  console.log(`~ this is a new prompt: ${thisprompt}`);

  let prompt = thisprompt;

  const gpt_args = {
    // model: "text-davinci-002",
    model: "gpt-3.5-turbo",
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
    console.log(`completion: ${completion}...`);

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

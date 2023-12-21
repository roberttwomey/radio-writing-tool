// AI writing tool for Latent Theater
// radio-play.net
// Robert Twomey - 2023

let socket;

let lastSelected = "";
let lastPrompt = "";
let lastDiv;

let bSpeaking = true;
let bListening = true;
let bNewCompletion = false;
let bBroadcasting = false;

let scriptJSON;
let lastGenId;
let prompts = {};

function preload() {
  scriptJSON = loadJSON("ubik-demo.json");
}

function setup() {
  noCanvas();
  
  // Start the socket connection for gpt3 server completion
  socket = io.connect('http://localhost:8080')
  //socket = io.connect('http://54.219.126.173:8080');
  // socket = io.connect('http://app.radio-play.net:8080');

  socket.on('script', data => {
    var json = JSON.parse(data);
    // json = data;
    console.log('JSON file content:', json);
    scriptJSON = json;
    console.log("received new script from server", data.slice(0, 32));
    // console.log(json.slice(0, 32));
    // console.log(scriptJSON);
    jsonToWebpage(json);
  });

  // Callback function
  socket.on('completion', data => {
    // console.log("received completion: "+data);
    let completion = data["completion"];
    let targetId = data["id"];
    
    // get prompt corresponding to this target
    let lastPrompt = prompts[targetId];

    console.log("received completion: "+completion.slice(0, 32));

    // update completion box
    let targetDiv = select("#completion");
    let thisCompletionHtml = ""
    const lines = completion.split(/\r?\n/);
    lines.forEach((thisline, i) => {   
      if (thisline) thisCompletionHtml += "<p contenteditable='true'>"+thisline+"</p>";
    })
    // console.log(targetDiv);
    // let oldHtml = targetDiv.textContent;
    // targetDiv.html(oldHtml+thishtml);
    targetDiv.html(thisCompletionHtml, true);

    // targetDiv.html("<p contenteditable='true'>"+completion+"</p>", true);
    
    // update this prompterated div in script box
    let scriptTargetDiv = select("#"+targetId);
    // thishtml = "<p contenteditable='true'>"+completion+"</p>";
    
    // store prompt in tooltip again
    // console.log("adding tooltip");
    thisScriptHtml = "<div id='"+targetId+"-completion' class='completion'>";
    thisScriptHtml += thisCompletionHtml + "</div>";
    thisScriptHtml +="<div id='"+targetId+"-prompt' class='prompt hidden'>"+lastPrompt+"</div>";
    scriptTargetDiv.html(thisScriptHtml);

    // console.log(prompts);
    // console.log("removing prompt from prompts... "+targetId)
    // delete prompts.targetId;
    // console.log(prompts)
    if (bBroadcasting) {
      console.log("sending script to server.");
      sendScriptToServer();
    }
  })

  document.addEventListener('selectionchange', () => updateSelection());
  
  speechRec.addEventListener('end', () => startListening());
  speechRec.start(true, true);
  
  // don't listen by default, don't speak by default
  toggleListening();
  toggleSpeaking();

  jsonToWebpage(scriptJSON);    
  requestScriptSocket();
}

function requestScriptSocket() {
  // request script from server over the websocket
  socket.emit('script', 0);
}

function sendScriptToServer() {
  // send script to server
  scriptJSON = scriptToJSON();
  let jsonString = JSON.stringify(scriptJSON, null, 4);
  socket.emit('update', jsonString);
}

function jsonToWebpage(scriptJSON) {
  let data = scriptJSON;
  // console.log("script json", data.paragraphs[0]);

  let targetDiv = select("#script");

  targetDiv.html("");

  // iterate over lines if we are dealing with a multi-line selection
  for (let i=0; i<data.paragraphs.length; i++) {
    // console.log(data.paragraphs[i]);
    thisId = data.paragraphs[i].id;
    thisType = data.paragraphs[i].type;
    thisChunk = data.paragraphs[i].text;
    const textLines = thisChunk.split(/\r?\n/);
    
    // console.log(textLines);
    let thishtml = "";
    if (thisType == "gen") {
      thisPrompt = data.paragraphs[i].prompt;
      const promptLines = thisPrompt.split(/\r?\n/);
      thishtml = "<div id=\""+thisId+"\" class=\""+thisType+"\">";
      
      thishtml += "<div id='"+thisId+"-completion' class='completion'>"
      // add prompt as text, in paragraphs
      textLines.forEach((thisline, i) => {   
        if (thisline) thishtml += "<p>"+thisline+"</p>";
      })
      thishtml += "</div>" // text div

      // add prompt as a hidden div
      thishtml += "<div id='"+thisId+"-prompt' class='prompt hidden'>"
      lastPrompt = ""
      promptLines.forEach((thisline, i) => {   
        // if (thisline) thishtml += thisline+"<br>";
        if (thisline) {
          thishtml += '<p>'+thisline+'</p>';
          lastPrompt += '<p>'+thisline+'</p>';
        }
      })
      thishtml += "</div>"; // prompt div
      thishtml += "</div>"; // main div

      // add html to page
      targetDiv.html(thishtml, true);

      // prompt it
      lastGenId = thisId;
      prompts[lastGenId] = lastPrompt;

       // we are copying this text to the prompt box
      // copyToPromptBox();

      // do the completion
      // doCompletion()
    } else {
      thishtml = "<div id=\""+thisId+"\" class=\""+thisType+"\">"
      textLines.forEach((thisline, i) => { 
        if (thisline) thishtml += "<p>"+thisline+"</p>";
      })
      thishtml += "</div>"
      if (thishtml) targetDiv.html(thishtml, true);
    };
  };

  // addSwapper();
}

function scriptToJSON() {
  let jsonOut = {};
  jsonOut.paragraphs = [];

  var childDivs = document.getElementById('script').getElementsByTagName('div');
  // console.log(childDivs);
  for( i=0; i< childDivs.length; i++ )
  {
    var thisDiv = childDivs[i];    
    
    let thisChunk = {};

    thisChunk.id = thisDiv.id;
    thisChunk.type = "text";
    
    if (thisDiv.classList.contains("gen")) {
      // for generative blocks we have both a prompt and a text
      thisChunk.type = "gen";
    
      // retrieve prompt paragraphs
      let thisPrompt = ""
      // console.log(thisDiv);
      var paragraphs = thisDiv.querySelector('.prompt').children;
      
      // loop over prompt paragraphs
      for (j = 0; j < paragraphs.length; j++) {
        let thisPara = paragraphs[j];
        thisPrompt += thisPara.innerHTML+'\n';
      }
      thisChunk.prompt = thisPrompt;

      // retrieve completion paragraphs
      let thisCompletion = "";
      var paragraphs = thisDiv.querySelector('.completion').children;
      // console.log(paragraphs);
      // loop over paragraphs
      for (j = 0; j < paragraphs.length; j++) {
        let thisPara = paragraphs[j];
        thisCompletion += thisPara.innerHTML+'\n';
      }
      thisChunk.text = thisCompletion;

      // console.log(thisChunk);
      jsonOut.paragraphs.push(thisChunk);

    } else if (thisDiv.classList.contains("text")) {
      // for text blocks, all of the script is in the inner text
      thisChunk.type = "text";
      thisChunk.text = thisDiv.innerText;

      // console.log(thisChunk);
      jsonOut.paragraphs.push(thisChunk);
    }
  }
  
  return jsonOut;
}

function downloadJSON(content) {
  let contentType = "text/plain";
  let fileName = "script.json";
  let a = document.createElement("a");
  let file = new Blob([content], {type: contentType});
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
}

// function hasClass(element, className) {
//   return element.classList.contains(className);
// }

// document.addEventListener('mouseover', function(event) {
//   let targetElement = event.target;
//   if (targetElement) {
//     console.log(targetElement.id);//(targetElement.id));
//     if (document.getElementById(targetElement.id).classList.contains('gen')) {
//       console.log(targetElement);
//       // copy children to prompt box
//       document.getElementById(element.id+'-prompt').style.display = 'block';
//     }
//   }
// });

// document.addEventListener('mouseover', function(event) {
//   let targetElement = event.target;
//   console.log(targetElement);
//   if (targetElement.classList.contains("gen")) {
//     // copy children to prompt box
//     document.getElementById(targetElement.id+'-prompt').style.display = 'none'
//   }
// });

// function addSwapper() {
//   var elements = Array.from(document.getElementsByClassName('prompt'));
//   console.log("addSwapper: "+elements);
//   for (let i=0; i<elements.length; i++) {
//     thisElement = elements[i];
//     thisElement.addEventListener('mousemove', function() {
//       console.log("HI");
//       thisElement.style.display = 'block';
//     });

//     thisElement.addEventListener('mouseleave', function() {
//       thisElement.style.display = 'none';
//     });
//   }
// };


// document.addEventListener('mouseout', function(event) {
//   let targetElement = event.target;
  
//   if (targetElement.classList.contains("gen")) {
//     // copy children to prompt box
//     document.getElementById(targetElement.id+'-prompt').style.display = 'none'
//   }
// });


// document.addEventListener('mouseover', function(event) {
//   let targetElement = event.target;
  
//   if (targetElement.classList.contains('gen')) {
//     // copy children to prompt box
//     lastPrompt = "";
//     document.getElementById(targetElement.id).querySelectorAll('div').forEach(element => {
//       let children = element.children;
//       // console.log(children);
//       for (j = 0; j < children.length; j++) {
//         lastPrompt += '<p>'+children[j].textContent+'</p>';
//       }
//     })
//     copyToPromptBox();
//   }
// });

document.addEventListener('click', function(event) {
    let targetElement = event.target; // Get the clicked element
    parseClick(1, targetElement, event.shiftKey);
});

document.addEventListener('dblclick', function(event) {
  let targetElement = event.target; // Get the clicked element
  parseClick(2, targetElement, event.shiftKey);
});

function parseClick(numclicks, targetElement, shiftKey) {
    // Traverse up the DOM tree until a div is found or the root is reached
    while (targetElement && targetElement.nodeName !== 'DIV') {
        targetElement = targetElement.parentNode;
    }

    if (targetElement) {
        // Do something with the div element
        // console.log('Clicked inside DIV with id:', targetElement.id);

        for(let i = 0; i < scriptJSON.paragraphs.length; i++) {
          thisPara = scriptJSON.paragraphs[i];
          let thisId = targetElement.id.split('-')[0];
          let thisType = targetElement.id.split('-')[1]
          // console.log(thisId, thisPara.id);
          if (thisPara.id == thisId && thisPara.type == "gen") {
            lastPrompt = ""
            // console.log(document.getElementById(targetElement.id).querySelectorAll('p'));

            // if (thisType == 'prompt') {
            //   document.getElementById(targetElement.id).querySelectorAll('p').forEach(element => {
            //     lastPrompt += '<p>'+element.textContent+'</p>';
            //   })
            document.getElementById(thisId+'-prompt').querySelectorAll('p').forEach(element => {
                lastPrompt += '<p>'+element.textContent+'</p>';
            })

            lastGenId = thisPara.id;
            prompts[lastGenId] = lastPrompt;
            // console.log(lastPrompt);

            // we are copying this text to the prompt box
            copyToPromptBox();

            // do the prompting
            if (numclicks == 2) doCompletion();
            if ((shiftKey) && (numclicks == 1)) swapPromptCompletion(thisId);
          }
          
          
        }
        lastDiv = targetElement;
    } else {
        console.log('Clicked outside any DIV');
    }
}

function swapPromptCompletion(thisid) {
  // let targetElement = document.getElementById(thisid);
  // if (targetElement.classList.contains('gen')) {
  let prompt = document.getElementById(thisid+'-prompt');
  let completion = document.getElementById(thisid+'-completion');
  // console.log(prompt, completion);
  prompt.classList.toggle("hidden");
  completion.classList.toggle("hidden");
}

// do completion
function doCompletion() {
  let promptDiv = document.getElementById("promptbox");
  
  // get the list of paragraphs in our prompt window
  let paragraphs = Array.from(promptDiv.getElementsByTagName("p"));

  let promptHtml = "";
  let gptprompt = "";
  for(let i = 0; i < paragraphs.length; i++) {
    // console.log("paragraphs "+i+" "+paragraphs[i].innerText) // Will print the content of each paragraph
    // prompt+=paragraphs[i].innerText+"\n"; // ADDED \n twice
    gptprompt+=paragraphs[i].innerText+"\n";
    promptHtml+="<p>"+paragraphs[i].innerText+"</p>";
  }

  console.log("prompting: "+gptprompt.slice(0, 32)+ " for  " + lastGenId);

  const promptData = {
    prompt: gptprompt,
    id: lastGenId
  }

  prompts[lastGenId] = promptHtml;
  
  // prompt the server with the data over the websocket
  // return will be handled by callback
  socket.emit('prompt', promptData);
}

function copyToPromptBox() {
  target = "#promptbox";  
  console.log("copy \""+lastPrompt+"\" to "+target);
  let targetDiv = select(target);
  targetDiv.html(lastPrompt);
}

function toggleBroadcast(thisClass) {
  // good font-awesome reference https://editor.p5js.org/simon_oakey/sketches/eQg6VvOUf
  let thissymbol = document.getElementsByClassName("broadcast")[0];
  if (bBroadcasting) {
    console.log("broadcast off");
    thissymbol.innerHTML = '<i class="myfa fa fa-toggle-off"></i>';
    bBroadcasting = false;
  } else {
    console.log("broadcast on");
    thissymbol.innerHTML = '<i class="myfa fa fa-toggle-on"></i>';
    bBroadcasting = true;
  }
}


function toggleSpeaking(thisClass) {
  // good font-awesome reference https://editor.p5js.org/simon_oakey/sketches/eQg6VvOUf
  let thissymbol = document.getElementsByClassName("speaking")[0];
  if (bSpeaking) {
    console.log("speaking off");
    thissymbol.innerHTML = '<i class="myfa fa fa-toggle-off"></i>';
    bSpeaking = false;
  } else {
    console.log("speaking on");
    thissymbol.innerHTML = '<i class="myfa fa fa-toggle-on"></i>';
    bSpeaking = true;
  }
}

function toggleListening() {
  if (bListening) {
    stopListening()
  } else {
    bListening = true;
    startListening();
  }
}

function stopListening() {
  console.log("listening off");
  let thissymbol = document.getElementsByClassName("listening")[0];
  thissymbol.innerHTML = '<i class="myfa fa fa-microphone-slash"></i>';
  bListening = false;
  // speechRec.removeEventListener('end', startListening());
  speechRec.stop();
}

function startListening() {
  if(bListening) {
    console.log("listening on");
    let thissymbol = document.getElementsByClassName("listening")[0];
    thissymbol.innerHTML = '<i class="myfa fa fa-microphone"></i>';
    // bListening = true;
    speechRec.start(true, true);
  }
}

function updateSelection() {
  let thisText = document.getSelection().toString()
  // console.log(thisText);
  if (thisText != "") {
    // console.log("last selected: "+thisText);
    lastSelected = thisText;  
  }
}

document.addEventListener('keydown', function(event) {
  if (event.ctrlKey) {
    if (event.key === 'z') {
      alert('Undo!');
    } else if (event.key === 's') {
      thisScript = scriptToJSON();
      downloadJSON(thisScript);
    }
    // } else if (event.key === 'g') {
    //   if (lastDiv) {
    //     if (lastDiv.classList.contains('prompt')) {
    //       console.log("setting "+lastDiv.id+" to be text");
    //       lastDiv.classList.remove("prompt");
    //       lastDiv.classList.add("text");
    //     } else {
    //       console.log("setting "+lastDiv.id+" to be prompterative");
    //       lastDiv.classList.remove("text");
    //       lastDiv.classList.add("prompt");
    //       lastGenId = lastDiv.id;
    //     }
    //   }
    // } else if (event.key === 'e') {
    //   if (lastDiv) {
    //     if (lastDiv.contentEditable) {
    //       console.log("setting "+lastDiv.id+" to not be editable...");
    //       lastDiv.contentEditable = false;
    //     } else {
    //       console.log("setting "+lastDiv.id+" to be editable...");
    //       lastDiv.contentEditable = true;
    //     }
    //   }
    // }
  }
});

// from here https://editor.p5js.org/amcc/sketches/_pnyek8kr

document.getElementById('fileInput').addEventListener('change', function(event) {
  var file = event.target.files[0];
  if (!file) {
      return;
  }

  var reader = new FileReader();
  reader.onload = function(e) {
      var contents = e.target.result;
      try {
          var json = JSON.parse(contents);
          console.log('JSON file content:', json);
          scriptJSON = json;
          jsonToWebpage(scriptJSON);
      } catch (e) {
          console.error('Error parsing JSON:', e);
      }
  };

  reader.onerror = function() {
      console.error('Error reading file:', reader.error);
  };

  reader.readAsText(file);
});

document.getElementById('downloadButton').addEventListener('click', function(event) {
  thisScript = scriptToJSON();
  let jsonString = JSON.stringify(thisScript, null, 4);
  downloadJSON(jsonString);
});
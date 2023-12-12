// WebSpeech rec for radio-play
// radio-play.net
// adapted from https://github.com/shiffman/A2Z-F18

// Speech Object
//let speechRec;

let socket;

let gridState = 1;

let gridSizes = [
  [ "1 / 3", "3 / 5", "5 / 7", "3 / 5"],
  [ "1 / 5", "5 / 6", "6 / 7", "5 / 6"],
  [ "1 / 2", "2 / 6", "6 / 7", "2 / 6"],
  [ "1 / 2", "2 / 3", "3 / 7", "2 / 3"],
  ];

let lastSelected = "";
let lastPrompt = "";
let lastDiv;

let bSpeaking = true;
let bListening = true;
let bNewCompletion = false;

let scriptJSON;
let lastGenId;

function preload() {
  scriptJSON = loadJSON("ubik-demo.json");
}

function setup() {
  noCanvas();
  
  // Start the socket connection for gpt3 server completion
  socket = io.connect('http://localhost:8080')

  // Callback function
  socket.on('completion', data => {
    // console.log("received completion: "+data);
    let completion = data["completion"]
    console.log("received completion: "+completion);

    // update completion box
    let targetDiv = select("#completion");
    targetDiv.html("<p contenteditable='true'>"+completion+"</p>", true);
    
    // update this generated div in script box
    let scriptTargetDiv = select("#"+lastGenId);
    thishtml = "<p contenteditable='true'>"+completion+"</p>";
    
    // store prompt in tooltip again
    let promptDiv = select("#prompt");
    let lastPrompt = promptDiv.elt.innerHTML;
    console.log("adding tooltip");
    thishtml +="<span class='tooltiptext'>";
    const lines = lastPrompt.split(/\r?\n/);
    lines.forEach((thisline, i) => {   
      if (thisline) thishtml += thisline+"<br>";
    });
    thishtml += "</span>"
    scriptTargetDiv.html(thishtml);
  })

  document.addEventListener('selectionchange', () => updateSelection());
  
  speechRec.addEventListener('end', () => startListening());
  speechRec.start(true, true);
  
  // don't listen by default, don't speak by default
  toggleListening();
  toggleSpeaking();

  jsonToScript(scriptJSON);
}

function jsonToScript(scriptJSON) {
  data = scriptJSON;
  console.log(data);

  let targetDiv = select("#script");

  targetDiv.html("");

  // iterate over lines if we are dealing with a multi-line selection
  
  for (let i=0; i<data.paragraphs.length; i++) {
    // console.log(data.paragraphs[i]);
    thisId = data.paragraphs[i].id;
    thisType = data.paragraphs[i].type;
    thisChunk = data.paragraphs[i].text;
    const lines = thisChunk.split(/\r?\n/);
    // console.log(lines);
    let thishtml = "";
    if (thisType == "prompt") {
      // targetDiv.html("<div style='color: green'><p>prompt [</p>", true);
      thishtml = "<div id=\""+thisId+"\" class=\"tooltip "+thisType+"\">";
      // add prompt as text, in paragraphs
      lines.forEach((thisline, i) => {   
        if (thisline) thishtml += "<p>"+thisline+"</p>";
      })
      // add prompt as tooltip, in a tooltip span
      thishtml += "<span class='tooltiptext'>"
      lines.forEach((thisline, i) => {   
        if (thisline) thishtml += thisline+"<br>";
      })
      thishtml += "</span>"
      thishtml += "</div>";
    } else {
      thishtml = "<div id=\""+thisId+"\" class=\""+thisType+"\">"
      lines.forEach((thisline, i) => { 
        if (thisline) thishtml += "<p>"+thisline+"</p>";
      })
      thishtml += "</div>"
    };
    if (thishtml) targetDiv.html(thishtml, true);
  };
}

function scriptToJSON() {
  let jsonOut = {};
  jsonOut.paragraphs = [];

  var childDivs = document.getElementById('script').getElementsByTagName('div');
  for( i=0; i< childDivs.length; i++ )
  {
    var thisDiv = childDivs[i];    
    
    let thisChunk = {};

    thisChunk.id = thisDiv.id;

    thisChunk.type = "text";
    if (thisDiv.classList.contains("prompt")) {
      thisChunk.type = "prompt";
      let thisPrompt = thisDiv.querySelector('.tooltiptext').innerHTML;
      // .getElementsByTagName('p')[0];
      console.log(thisPrompt);
      thisChunk.prompt = thisPrompt;
    } else if (thisDiv.classList.contains("text")) {
      thisChunk.type = "text";
    }

    thisChunk.text = thisDiv.innerText;

    // console.log(thisChunk);
    jsonOut.paragraphs.push(thisChunk);
  }
  console.log("requesting save on server");
  socket.emit('save', JSON.stringify(jsonOut));
}


document.addEventListener('click', function(event) {
    let targetElement = event.target; // Get the clicked element

    // Traverse up the DOM tree until a div is found or the root is reached
    while (targetElement && targetElement.nodeName !== 'DIV') {
        targetElement = targetElement.parentNode;
    }

    if (targetElement) {
        // Do something with the div element
        console.log('Clicked inside DIV with id:', targetElement.id);
        for(let i = 0; i < scriptJSON.paragraphs.length; i++) {
          thisPara = scriptJSON.paragraphs[i];
          if (thisPara.id == targetElement.id && thisPara.type == "prompt") {
            // lastSelected = targetElement.innerHTML;
            lastPrompt = ""
            document.getElementById(targetElement.id).querySelectorAll('span').forEach(element => {
              lastPrompt+=element.innerHTML;
            })
            lastGenId = thisPara.id;
            copyPromptTo("box2"); // we are copying this text to the prompt box

            // do the prompting
            doCompletion();
          }
        }
        lastDiv = targetElement;
    } else {
        console.log('Clicked outside any DIV');
    }
});


// do completion
function doCompletion() {
  let promptDiv = document.getElementById("prompt");
  
  // convert paragraph elements <p> to lines with newlines
  let paragraphs = Array.from(promptDiv.getElementsByTagName("p"));

  let prompt = ""
  for(let i = 0; i < paragraphs.length; i++) {
    // console.log("paragraphs "+i+" "+paragraphs[i].innerText) // Will print the content of each paragraph
    prompt+=paragraphs[i].innerText+"\n";
  }

  console.log("prompting: "+prompt);
  const data = {
    prompt: prompt
  }
  
  // prompt the server with the data over the websocket
  // return will be handled by callback
  socket.emit('prompt', data);
}

function copyTo(thisClass) {
  if(thisClass == "box1") {
    target = "#script";
    if (bSpeaking)
      sayAndListen(lastSelected);
  } else if (thisClass == "box2") {
    target = "#prompt";
  } else if (thisClass == "box3") {
    target = "#speech";
  }
    // } else if (thisClass == "box4") {
  //   target = "#completion";
  // }
  
  console.log("copy \""+lastSelected+"\" to "+target);
  let targetDiv = select(target);

  // iterate over lines if we are dealing with a multi-line selection
  const lines = lastSelected.split(/\r?\n/);
  console.log(lines);
  thishtml = targetDiv.innerHTML;
  if (target == "#prompt") thishtml = "";

  if (target == "#script" && bNewCompletion == true) {
    thishtml +="<span class='tooltiptext>";
    lines.forEach((thisline, i) => {   
      if (thisline) thishtml += thisline+"<br>";
    })
    thishtml += "</span>"
    bNewCompletion = false;
  }

  lines.forEach((thisline, i) => {
    if (thisline) thishtml+="<p>"+thisline+"</p>";
  });

  targetDiv.html(thishtml);
  // targetDiv.html("<p>"+lastSelected+"</p>", true);
  
  lastSelected = "";
}

function copyPromptTo(thisClass) {
  target = "#prompt";
  
  console.log("copy \""+lastPrompt+"\" to "+target);
  let targetDiv = select(target);

  // iterate over lines if we are dealing with a multi-line selection
  const lines = lastPrompt.split(/\r?\n/);
  console.log(lines);
  if (target == "#prompt") targetDiv.html("")
  lines.forEach((thisline, i) => {
    if (thisline) targetDiv.html("<p>"+thisline+"</p>", true)
    // if (thisline) targetDiv.html(thisline, true)
  });
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

// adjusting size of panes

// function toggleState(thisClass) {
//   if (thisClass == "box1") {
//     if (gridState == 1) {
//       gridState = 0;
//     } else {
//       gridState = 1
//     }
//   } else if (thisClass == "box2") {
//     if (gridState == 2) {
//       gridState = 0;
//     } else {
//       gridState = 2;
//     }    
//   } else if (thisClass == "box3") {
//     if (gridState == 3) {
//       gridState = 0;
//     } else {
//       gridState = 3;
//     }    
//   }
//   updateGridState();
// }

// function updateGridState() {

//   thisbox = document.getElementsByClassName("box1")[0];
//   thisbox.style.gridColumn = gridSizes[gridState][0];
  
//   thisbox = document.getElementsByClassName("box2")[0];
//   thisbox.style.gridColumn = gridSizes[gridState][1];
  
//   thisbox = document.getElementsByClassName("box3")[0];
//   thisbox.style.gridColumn = gridSizes[gridState][2];

//   thisbox = document.getElementsByClassName("box4")[0];
//   thisbox.style.gridColumn = gridSizes[gridState][3];
  
// }

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
      scriptToJSON();
    }
    // } else if (event.key === 'g') {
    //   if (lastDiv) {
    //     if (lastDiv.classList.contains('prompt')) {
    //       console.log("setting "+lastDiv.id+" to be text");
    //       lastDiv.classList.remove("prompt");
    //       lastDiv.classList.add("text");
    //     } else {
    //       console.log("setting "+lastDiv.id+" to be generative");
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
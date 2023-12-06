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

let bSpeaking = true;
let bListening = true;
let script;

function preload() {
  script = loadJSON("ubik-demo.json");
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
    let targetDiv = select("#completion");
    targetDiv.html("<p contenteditable='true'>"+completion+"</p>", true);
  })

  document.addEventListener('selectionchange', () => updateSelection());
  
  speechRec.addEventListener('end', () => startListening());
  speechRec.start(true, true);
  
  // don't listen by default
  toggleListening();
  toggleSpeaking();

  parseScript(script);
  // speechRec.start(true, true);

  // // Create a Speech Recognition object with callback
  // speechRec = new p5.SpeechRec("en-US", gotSpeech);
  // // "Continuous recognition" (as opposed to one time only)
  // let continuous = true;
  // // If you want to try partial recognition (faster, less accurate)
  // let interimResults = true;

  // // // This must come after setting the properties
  // speechRec.start(continuous, interimResults);

  // // DOM element to display results
  // let output = select("#speech");

  // let lastHtml = "";
  // let count = 0;

  // console.log("listening...");
  // // Speech recognized event
  // function gotSpeech() {
  //   // Something is there
  //   // Get it as a string, you can also get JSON with more info
  //   console.log(speechRec);

  //   if (speechRec.resultValue) {
  //     let said = speechRec.resultString;
  //     if (speechRec.resultJSON.results[count].isFinal) {
  //       // final, add to html
  //       let newHtml = lastHtml + "<p>" + said + "</p>";
  //       output.html(newHtml);
  //       lastHtml = newHtml;
  //       count += 1;
  //     } else {
  //       // temp, add in light gray
  //       let tempOutput = lastHtml + "<p style='color: gray'>" + said + '</p>';
  //       output.html(tempOutput);
  //     }
  //   }
  // }
}

function parseScript(script) {
  data = script;
  console.log(data);

  let targetDiv = select("#script");

  // iterate over lines if we are dealing with a multi-line selection
  
  for (let i=0; i<data.paragraphs.length; i++) {
    // console.log(data.paragraphs[i]);
    thisType = data.paragraphs[i].type;
    thisChunk = data.paragraphs[i].text;
    const lines = thisChunk.split(/\r?\n/);
    // console.log(lines);
    let thishtml;
    if (thisType == "prompt") {
      // targetDiv.html("<div style='color: green'><p>prompt [</p>", true);
      thishtml = "<div style='color: green'><p>prompt [</p>";
    }
    lines.forEach((thisline, i) => { 
      if (thisType == "prompt") {
        // if (thisline) targetDiv.html("<p>&nbsp&nbsp"+thisline+"</p>", true)
        if (thisline) thishtml += "<p>&nbsp&nbsp"+thisline+"</p>";
      } else {
        // if (thisline) targetDiv.html("<p>"+thisline+"</p>", true)
        if (thisline) thishtml += "<p>"+thisline+"</p>";
      }
    });
    if (thisType == "prompt") {
      // targetDiv.html("<p>prompt ]</p></div>", true);
      thishtml += "<p>prompt ]</p></div>";
    }
    if (thishtml) targetDiv.html(thishtml, true);
  };
}


// do completion

function doCompletion() {
  // let promptDiv = select("#prompt");
  let promptDiv = document.getElementById("prompt");
  
  // let completion = select("#completion");
  // completion.html("<p>"+prompt.html()+"</p>", true);

  // let prompt = promptDiv.html();

  // convert paragraph elements <p> to lines with newlines
  let paragraphs = Array.from(promptDiv.getElementsByTagName("p"));
  // console.log(paragraphs);

  let prompt = ""
  for(let i = 0; i < paragraphs.length; i++) {
    // console.log("paragraphs "+i+" "+paragraphs[i].innerText) // Will print the content of each paragraph
    prompt+=paragraphs[i].innerText+"\n";
  }

  console.log("prompting: "+prompt);
  const data = {
    prompt: prompt
  }
  
  // prompt the server with the data
  socket.emit('prompt', data);

  // promptGPT3(prompt.html().toString());
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
  lines.forEach((thisline, i) => { 
    if (thisline) targetDiv.html("<p>"+thisline+"</p>", true)
  });

  // targetDiv.html("<p>"+lastSelected+"</p>", true);
  
  lastSelected = "";
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


// select and copy text

function updateSelection() {
  // let thisText = document.getSelection().toString();
  let thisText = document.getSelection().toString()
  console.log(thisText);
  if (thisText != "") {
    // console.log("last selected: "+thisText);
    lastSelected = thisText;  
  }
}
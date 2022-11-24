// WebSpeech rec for radio-play
// radio-play.net
// adapted from https://github.com/shiffman/A2Z-F18

// Speech Object
//let speechRec;

let gridState = 0;

let gridSizes = [
  [ "1 / 3", "3 / 5", "5 / 7", "3 / 5"],
  [ "1 / 5", "5 / 6", "6 / 7", "5 / 6"],
  [ "1 / 2", "2 / 6", "6 / 7", "2 / 6"],
  [ "1 / 2", "2 / 3", "3 / 7", "2 / 3"],
];

let lastSelected = "";

function setup() {
  noCanvas();
  
  // addEventListener version
  // document.addEventListener('selectionchange', () => {
  //   console.log(document.getSelection());
  // });

  document.addEventListener('selectionchange', () => updateSelection());
  
  // Create a Speech Recognition object with callback
  speechRec = new p5.SpeechRec("en-US", gotSpeech);
  // "Continuous recognition" (as opposed to one time only)
  let continuous = true;
  // If you want to try partial recognition (faster, less accurate)
  let interimResults = true;
  // This must come after setting the properties
  speechRec.start(continuous, interimResults);

  // DOM element to display results
  let output = select("#speech");

  let lastHtml = "";
  let count = 0;

  console.log("listening...");
  // Speech recognized event
  function gotSpeech() {
    // Something is there
    // Get it as a string, you can also get JSON with more info
    console.log(speechRec);

    if (speechRec.resultValue) {
      let said = speechRec.resultString;
      if (speechRec.resultJSON.results[count].isFinal) {
        // final, add to html
        let newHtml = lastHtml + "<p>" + said + "</p>";
        output.html(newHtml);
        lastHtml = newHtml;
        count += 1;
      } else {
        // temp, add in light gray
        let tempOutput = lastHtml + "<p style='color: gray'>" + said + '</p>';
        output.html(tempOutput);
      }
    }
  }
}

// do completion

function doCompletion() {
  let prompt = select("#prompt");
  let completion = select("#completion");
  completion.html("<p>"+prompt.html()+"</p>", true);
}

function copyTo(thisClass) {
  if(thisClass == "box1") {
    target = "#script";
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
  targetDiv.html("<p contenteditable='true'>"+lastSelected+"</p>", true);
  
  lastSelected = "";
}

// adjusting size of panes

function toggleState(thisClass) {
  if (thisClass == "box1") {
    if (gridState == 1) {
      gridState = 0;
    } else {
      gridState = 1
    }
  } else if (thisClass == "box2") {
    if (gridState == 2) {
      gridState = 0;
    } else {
      gridState = 2;
    }    
  } else if (thisClass == "box3") {
    if (gridState == 3) {
      gridState = 0;
    } else {
      gridState = 3;
    }    
  }
  updateGridState();
}

function updateGridState() {

  thisbox = document.getElementsByClassName("box1")[0];
  thisbox.style.gridColumn = gridSizes[gridState][0];
  
  thisbox = document.getElementsByClassName("box2")[0];
  thisbox.style.gridColumn = gridSizes[gridState][1];
  
  thisbox = document.getElementsByClassName("box3")[0];
  thisbox.style.gridColumn = gridSizes[gridState][2];

  thisbox = document.getElementsByClassName("box4")[0];
  thisbox.style.gridColumn = gridSizes[gridState][3];
  
}


// select and copy text

// function mouseReleased() {
  
//   if (window.getSelection()) {
//     let thisText = window.getSelection().toString();
//     if (thisText != "") {
//       console.log("last selected: "+thisText);
//       lastSelected = thisText;  
//     }
//   }
// }

function updateSelection() {
  let thisText = document.getSelection().toString();
  if (thisText != "") {
    console.log("last selected: "+thisText);
    lastSelected = thisText;  
  }
}

function elementContainsSelection(el) {
    let sel = window.getSelection();
    if (sel.rangeCount > 0) {
        for (let i = 0; i < sel.rangeCount; ++i) {
            if (!el.contains(sel.getRangeAt(i).commonAncestorContainer)) {
                return false;
            }
        }
        return true;
    }
    return false;
}

// function keyPressed() {
  
// }

// function keyPressed() {
//   if (keyCode === DELETE || keyCode == BACKSPACE) {
//     let selection = window.getSelection();
//     selection.deleteFromDocument();
//   }
// }

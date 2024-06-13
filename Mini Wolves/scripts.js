/** 
* TITLE:
*     Hide a row if a value is inputted. 
*/

//**GLOBALS**
// Sheet the data is on.
var SHEET = "Ts";


function onEdit(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var activeSheet = ss.getActiveSheet();
  
  //Ensure on correct sheet.
  if(SHEET == activeSheet.getName()){

    // Get Values
    var cell = ss.getActiveCell()
    var cellValue = cell.getValue();
    var cellRow = cell.getRow();
    var cellColumn = cell.getColumn();
    
    // Hide / Show Role Columns
    if(cellColumn == 5 && cellRow == 22 && gamephaseGet(activeSheet) > 0){
      if(cellValue >= 1 && cellValue <= 7){
        updateRoles(activeSheet, cellValue);
      };
    };
     
     // Setup / Import Game
    if(cellColumn == 2 && cellRow == 28 && cellValue == true) {
      // Setup
      if(gamephaseGet(activeSheet) == 0) {
        cmdSetup(activeSheet);        
        cell.setValue(false);
      } 
      // Import
      else {
        cmdImport(activeSheet);
        cell.setValue(false);
      }
    };
    
    // Reset Game
    if(cellColumn == 2 && cellRow == 22 && cellValue == true) {
      cmdReset(activeSheet);
      cell.setValue(false);
    };
    
    // Start / End Game
    if(cellColumn == 2 && cellRow == 25 && cellValue == true) {
      // Start
      if(gamephaseGet(activeSheet) == 1) {
        cmdStart(activeSheet);        
        cell.setValue(false);
      } 
      // End
      else {
        cmdEnd(activeSheet);
        cell.setValue(false);
      }
    };
    
    // Kill Queue Clear
    if(cellColumn == 15 && cellRow == 25 && cellValue == true) {
      cmdKillqClear(activeSheet);
      cell.setValue(false);
    }

    // Drag
    if(cellColumn == 21 && cellRow == 28 && cellValue == true) {
      cmdDrag();
      cell.setValue(false);
    }
    
    // Elect Mayor
    if(cellColumn == 22 && cellRow >= 2 && cellRow <= 20 && cellValue == true) {
      cmdElect(activeSheet, cell, "mayor"); 
      cell.setValue(false);
    } // Reporter
    if(cellColumn == 23 && cellRow >= 2 && cellRow <= 20 && cellValue == true) {
      cmdElect(activeSheet, cell, "reporter"); 
      cell.setValue(false);
    } // Guardian
    if(cellColumn == 24 && cellRow >= 2 && cellRow <= 20 && cellValue == true) {
      cmdElect(activeSheet, cell, "guardian"); 
      cell.setValue(false);
    }
    
    // Kill Queue Killall
    if(cellColumn == 15 && cellRow == 22 && cellValue == true) {
      cmdKillqKillall(activeSheet);
      cell.setValue(false);
    }
    
    // Kill Queue Add
    if(cellColumn == 1 && cellRow >= 1 && cellRow <= 20 && cellValue == true) {
      cmdKillqAdd(activeSheet, cell);   
      cell.setValue(false);
    };
    
    // Kill Queue Remove
    if(cellColumn == 13 && cellRow >= 22 && cellRow <= 29 && cellValue == true) {
      cmdKillqRemove(activeSheet, cell);  
      cell.setValue(false); 
    }
    
    // Vote Manipulation
    if(cellColumn >= 19 && cellColumn <= 21 && cellRow >= 2 && cellRow <= 20) {
       cmdPlayer(activeSheet, cell);  
    }

    // Role Changes
    if(cellColumn == 5 && cellRow >= 2 && cellRow <= 20 && gamephaseGet(activeSheet) == 3) {
       roleChange(activeSheet, cell);  
    }

    // Polls
    if(cellColumn == 20 && cellRow >= 21 && cellRow <= 28 && gamephaseGet(activeSheet) == 3) {
      createPoll(activeSheet, cell);          
      cell.setValue(false);
    }
    if(cellColumn == 21 && cellRow == 21 && gamephaseGet(activeSheet) == 3) {
      pollsSet(activeSheet, []);     
      cell.setValue(false);
    }
    if(cellColumn == 20 && cellRow == 29 && gamephaseGet(activeSheet) == 3) {
      let val = cell.getValue();
      if(val) {
        openPolls(activeSheet);
      } else {
        closePolls(activeSheet);
      }
    }

    
  };
}

/* Open/Close Polls */
function openPolls(activeSheet) {
  let polls = pollsGet(activeSheet);
  polls.forEach(p => {
    if(p.length < 1) return;
    let msg = "";
    let connection = "voting-booth";
    let type = "public";
    switch(p) {
      case "lynch1": msg = "**Who should be lynched?**"; break;
      case "lynch2": msg = "**Who should be lynched?** (Second Lynch)"; break;
      case "mayor": msg = "**Who should become Mayor?**"; break;
      case "reporter": msg = "**Who should become Reporter?**"; break;
      case "guardian": msg = "**Who should become Guardian?**"; break;
      case "wolfpack": msg = "**Who should be killed?**"; type = "private"; break;
      case "cub": msg = "**A cub has died. You may attack again.**"; type = "private"; break;
      case "cult": msg = "**Who should be killed?**"; type = "private"; break;
    }
    connection = getPollConnection(p);
    runCmd("$sudo connection send " + connection + " \" \" \"" + msg + "\"");
    Utilities.sleep(2000);
    runCmd("$sudo connection send " + connection + " \" \" \"$poll new " + type + " " + p + "\"");
    Utilities.sleep(2000);
  });
  // move to open polls
  pollsSet2(activeSheet, polls);  
  pollsSet(activeSheet, []);
}

function getPollConnection(pollName) {
  switch(pollName) {
    default: return "voting-booth";
    case "": return "";
    case "cub":
    case "wolfpack": return "wolfpack";
    case "cult": return "cult";
  }
}

function closePolls(activeSheet) {
  let polls = pollsGet2(activeSheet);
  let pollChannels = {};
  // sort polls by channel
  polls.forEach(poll => {
    let c = getPollConnection(poll);
    if(!pollChannels[c]) pollChannels[c] = [];
    pollChannels[c].push(poll);
  });
  // close polls by channel
  for(let c in pollChannels) {
    if(c == "") continue;
    runCmd("$sudo connection send " + c + " \" \" \"$poll close " + pollChannels[c].join(" ") + "\"");
  }
  Utilities.sleep(500);
  pollsSet2(activeSheet, []); 
}

/* Creates a Poll */
function createPoll(activeSheet, cell) {
  let index = cell.getRow() - 21;
  let votes = [["lynch1"],["lynch2"],["mayor"],["reporter"],["guardian"],["wolfpack"],["cub"],["cult"]];
  let polls = pollsGet(activeSheet);
  votes[index].forEach(v => polls.push(v));
  polls = [...new Set(polls)];
  pollsSet(activeSheet, polls);
}

/* Updates a players role */
function roleChange(activeSheet, cell) {
  let newRole = cell.getValue();
  let pID = activeSheet.getRange("C" + cell.getRow()).getValue();
  runCmd("$sudo connection send " + pID + " \" \" " + "\"$sc change " + newRole.replace(/ /g,"_") + "\"");
}

/* Updates a player value */
function cmdPlayer(activeSheet, cell) {
  var pvalue = "";
  switch(cell.getColumn()) {
    case 19: pvalue = "public_value"; break;
    case 20: pvalue = "private_value"; break;
    case 21: pvalue = "public_votes"; break;
  }
  // Send command
  runCmd("$sudo players set " + pvalue + " " + activeSheet.getRange("C" + cell.getRow()).getValue() + " " + cell.getValue());
}

/* Imports a game into the bot */
function cmdImport(activeSheet) {
  // Send command
  runCmd("$sudo sheet mimport\n" + activeSheet.getRange("B2:L20").getValues().map(function(el) {
    if(el[2] == "") el[2] = "%";
    return el.join().replace(/,,/g, "").replace(/%/g,"").replace(/,+$/, "");
  }).join("\n"));
}

/* Starts a game */
function cmdStart(activeSheet) {
  // Send command
  runCmd("$sudo gp set 2");
  Utilities.sleep(200);
  runCmd("$sudo confirm start");
  // Set gamephase
  gamephaseSet(activeSheet, 3);
  
}

/* Sets up a game */
function cmdSetup(activeSheet) {
  // Send command
  runCmd("$sudo gp set 1");
  openSignups("A new game is starting! <@&596299927852810250>");
  // Prepare Cleared Killq
  killqClear(activeSheet)
  // Sheet to in game mode
  activeSheet.unhideRow(activeSheet.getRange("A1:A20"));
  activeSheet.unhideColumn(activeSheet.getRange("A1"));
  activeSheet.setActiveRange(activeSheet.getRange("A2"));
  updateRoles(activeSheet, activeSheet.getRange("E22").getValue());
  // Increment game counter
  activeSheet.getRange("E28").setValue(activeSheet.getRange("E28").getValue() + 1);
  // Set gamephase
  gamephaseSet(activeSheet, 1);
}

/* Drag */
function cmdDrag() {
  runCmd("$sudo drag");
}

/* Resets the game */
function cmdReset(activeSheet) {
  // reset stored polls
  pollsSet(activeSheet, []);
  pollsSet2(activeSheet, []);
  activeSheet.getRange("T29").setValue(false);
  // Send command
  runCmd("$sudo confirm reset");
  // Clear player info
  activeSheet.getRange("B2:U20").setValue("");
  // Set roles to default
  activeSheet.getRange("E22").setValue("1");
  updateRoles(activeSheet, 1);
  // Reset Killq
  killqClear(activeSheet);
  // Sheet to out of game mode
  activeSheet.hideRow(activeSheet.getRange("A2:A20"));
  activeSheet.hideColumn(activeSheet.getRange("A1"));
  activeSheet.unhideColumn(activeSheet.getRange("L1"));
  // Set gamephase
  gamephaseSet(activeSheet, 0);
}

/* Ends the game */
function cmdEnd(activeSheet) {
  // Send command
  runCmd("$sudo confirm end");
  runCmd("$sudo drag_dead");
  // Reveal all players
  activeSheet.unhideRow(activeSheet.getRange("A1:A20"));
  // Set gamephase
  gamephaseSet(activeSheet, 4);
  // Hide kill buttons
  activeSheet.hideColumn(activeSheet.getRange("A1"));
  // Hide technical roles
  activeSheet.hideColumn(activeSheet.getRange("L1"));
}

/* Kills all players on the killq and clears it */
function cmdKillqKillall(activeSheet) {
  // Send command
  runCmd("$sudo confirm killq killall");
  // Handle killq
  killqClear(activeSheet)
}

/* Clears the killq */
function cmdKillqClear(activeSheet) {
  // Send command
  runCmd("$sudo killq clear");
  // Unhide players
  var killqIndices = activeSheet.getRange("B46").getValue();
  killqIndices.split(",").forEach(function(el) {
    activeSheet.unhideRow(activeSheet.getRange("A" + el));
  });
  // Handle killq
  killqClear(activeSheet);
}

/* Removes a player from the killq */
function cmdKillqRemove(activeSheet, cell) {
  // Get player info
  var killqPlayer = activeSheet.getRange("P" + cell.getRow()).getValue();
  var killqIndex = activeSheet.getRange("Q" + cell.getRow()).getValue();
  // Send command
  runCmd("$sudo killq remove " + killqPlayer);
  // Unhide player from list
  activeSheet.unhideRow(activeSheet.getRange("A" + killqIndex));
  activeSheet.setActiveRange(activeSheet.getRange("A" + killqIndex));
  // Handle Killq
  killqRemove(activeSheet, killqPlayer);
}

/* Adds a player to the killq */
function cmdKillqAdd(activeSheet, cell) {
  // Get player info
  var killqPlayer = activeSheet.getRange("C" + cell.getRow()).getValue();
  // Send command
  runCmd("$sudo killq add " + killqPlayer);
  // Hide player from list
  activeSheet.hideRow(cell);
  // Handle killq
  killqAdd(activeSheet, killqPlayer);
}

/* Elects a player */
function cmdElect(activeSheet, cell, role) {
  // Get player info
  var electPlayer = activeSheet.getRange("C" + cell.getRow()).getValue();
  // Send command
  runCmd("$sudo elect " + role + " " + electPlayer);
}

/* Sets the gamephase */
function gamephaseSet(activeSheet, value) {
  activeSheet.getRange("E27").setValue(value);
}

/* Returns the gamephase */
function gamephaseGet(activeSheet) {
  return activeSheet.getRange("E27").getValue();
}

/* Sets the polls */
function pollsSet(activeSheet, value) {
  activeSheet.getRange("B47").setValue(value.join(","));
}

/* Returns the polls */
function pollsGet(activeSheet) {
  return activeSheet.getRange("B47").getValue().split(",");
}

/* Sets the polls 2 */
function pollsSet2(activeSheet, value) {
  activeSheet.getRange("B48").setValue(value.join(","));
}

/* Returns the polls 2 */
function pollsGet2(activeSheet) {
  return activeSheet.getRange("B48").getValue().split(",");
}

/* Adds a player to the internal killq */
function killqAdd(activeSheet, player) {
  var killq = killqGet(activeSheet);
  killq.push(player);
  killqSet(activeSheet, killq);
}

/* Removes a player from the internal killq */
function killqRemove(activeSheet, player) {
  var killq = killqGet(activeSheet);
  killqSet(activeSheet, killq.filter(function(el) { 
    return el != player; 
  }));
}

/* Clears the internal killq */
function killqClear(activeSheet) {
  activeSheet.getRange("B45").setValue("");
}

/* Sets the polls */
function killqSet(activeSheet, value) {
  activeSheet.getRange("B45").setValue(value.join(","));
}

/* Returns the polls */
function killqGet(activeSheet) {
  return activeSheet.getRange("B45").getValue().split(",");
}


function updateRoles(activeSheet, cellValue) {
  var char = ["F","G","H","I","J","K"];
  activeSheet.unhideColumn(activeSheet.getRange("E1:K1"));
  activeSheet.hideColumn(activeSheet.getRange(char[cellValue - 1] + "1:K1"));
}

function webhook(url, command) {
  var json = { "content": command, "username": "MWR Sheet" };
  var options = { "method": "post", "payload": json};
  UrlFetchApp.fetch(url, options); 
}

function runCmd(command) {
  webhook("<MWR BOT SPAM WEBHOOK>", command)
}

function openSignups(command) {
  var url = "<MWR SIGNUP CHANNEL WEBHOOK>";
  webhook(url, command)
}


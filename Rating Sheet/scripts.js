function onEdit(event){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var activeSheet = ss.getActiveSheet();
  
  if("Main" == activeSheet.getName()) {
    var sortCell = activeSheet.getRange("N3");
    if(sortCell.getValue() == true) {
      sortCell.setValue(false);
      // Sort by total points
      var columnToSortBy = 4;
      var tableRange = "A2:D1000";
      
      var range = activeSheet.getRange(tableRange);
      range.sort( { column : columnToSortBy, ascending: false } );
    }
    
    // Automatically assign new ID
    var emptyCell = firstEmptyCell(activeSheet, 2);
    var nrCell = activeSheet.getRange("A" + emptyCell);
    if(nrCell.getValue() == "") {
      emptyCell--;
      nrCell.setValue("#" + (emptyCell >= 100 ? "" : (emptyCell >= 10 ? "0" : "00")) + emptyCell);
    }

    // Rank Sync
    var syncCell = activeSheet.getRange("N2");
    if(syncCell.getValue() == true) {
      syncCell.setValue(false);
      rankSync();
    }
  }
}

function rankSync() {
  var basic = true;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  // get the ranks and prepare commands
  var names = ["WW Ranked","WW Bronze","WW Silver","WW Gold","WW Platinum"];
  var roles = ["584773238148562944","584773204409843713","584773177109118988","584773154707079285","584773111359209493"];
  var emptyCell = firstEmptyCell(sheet, 2);
  var commands = [];
  var players = sheet.getRange("B2:" + (emptyCell - 1));
  var maxP = players.getNumRows();
  var noRank = false;
  //maxP = 3;
  for(var i = 1; i <= maxP; i++) {
    var rank = -1;
    var name = players.getCell(i, 2).getValue();
    //var nameText = players.getCell(i, 1).getValue();
    if(!noRank) {
      rank = names.indexOf(players.getCell(i, 12).getValue());
      if(rank == -1) {
        if(basic) break;
        else noRank = true;
      }
      console.log(name + " => " + names[rank] + "(" + rank + ")");
    } else {
      console.log(name + " => skipped");
    }
    if(rank >= 0) commands.push("modrole add " + name + " " + roles[rank]);
    if(rank != 0) commands.push("modrole remove " + name + " " + roles[0]);
    if(rank != 1) commands.push("modrole remove " + name + " " + roles[1]);
    if(rank != 2) commands.push("modrole remove " + name + " " + roles[2]);
    if(rank != 3) commands.push("modrole remove " + name + " " + roles[3]);
    if(rank != 4) commands.push("modrole remove " + name + " " + roles[4]);
  }


  // combine into split commands
  var splits = ["say RANK SYNC"];
  for(var i = 0; i < commands.length; i++) {
    if(splits[splits.length - 1].length + commands[i].length < 1900) {
      splits[splits.length - 1] += ";" + commands[i];
    } else {
      splits.push(commands[i]);
    }
  }

  // send split commands
  for(var i = 0; i < splits.length; i++) {
    runCmd("$sudo split " + splits[i]);
    //console.log(splits[i]);
    Utilities.sleep(1000);
  }
}

// Returns the first empty cell in a column
function firstEmptyCell(sheet, column) {
  var range = sheet.getRange(1, column, sheet.getMaxRows(), column), values = range.getValues(), i = 0;
  while(values[i][0] != "" && i < values.length) i++; 
  return i;
}

function runCmd(command) {
  var json = { "content": command, "username": "Rank Sync" };
  var options = { "method": "post", "payload": json};
  var url = "<WWR BOT SPAM WEBHOOK>";
  UrlFetchApp.fetch(url, options); 
}

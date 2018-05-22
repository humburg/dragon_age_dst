/*
 * This is the javascript specific to the minimal4e DST
 * In this example, we're using some javascript to update the ability modifiers when someone changes their
 * level or their ability score.
 *
 * The key is to use the callback functions to catch the right events.
 * Read the top comments in characters.js to get a better idea of how the callbacks work.
 *
 * Copy and paste this directly into the javascript textarea on obsidianportal.com
 */


function dragonage_dataPreLoad(options) {
  // Called just before the data is loaded.
  // alert("dataPreLoad");
}

function dragonage_dataPostLoad(options) {
  // Called just after the data is loaded.
  if(!jQuery('.dsf_speed').html()){
    jQuery('.dsf_speed').html(dragonage_speed());
    dragonage_speed_update();
  }
}

function dragonage_dataChange(options) {
  // Called immediately after a data value is changed.
  // alert("dataChange. " + options['fieldName'] + " = " + options['fieldValue']);
  
  var field = options['fieldName'];
  var val = options['fieldValue'];
  
  if(field == 'dexterity') {
    dragonage_dexterity_update();
  }
  if(field == 'speed') {
    dragonage_speed_update();
  }
  
}

function minimal4e_dataPreSave(options) {
  // Called just before the data is saved to the server.
  // alert("dataPreSave");
}

function dragonage_dexterity_update() {
  jQuery('.dsf_speed').html(dragonage_speed());
  dragonage_speed_update();
}

function dragonage_speed_update() {
  jQuery('.dsf_move_yrd').html(dragonage_move_distance());
  jQuery('.dsf_charge_yrd').html(dragonage_charge_distance());
  jQuery('.dsf_run_yrd').html(dragonage_run_distance());
  jQuery('.dsf_move_sq').html(dragonage_move_squares());
  jQuery('.dsf_charge_sq').html(dragonage_charge_squares());
  jQuery('.dsf_run_sq').html(dragonage_run_squares());
}



/* Speed and movement distance calculations. */

function dragonage_speed() {
  var base_speed = 10;
  var dex = parseInt(jQuery('.dsf_dexterity').html());
  var penalty = parseInt(jQuery('.dsf_armor_penalty').html());
  
  /* The armor penalty is never positive but this is ambiguous in the book.
     Some people may prefer to specify a positive number so we flip the sign if necessary.
  */
  if(penalty > 0){
    penalty = -1 * penalty;
  }
  var race = jQuery('.dsf_race').html();
  if(race.toLowerCase() == 'dwarf'){
    base_speed = 8;
  } 
  else if(race.toLowerCase() == 'elf') {
    base_speed = 12;
  }
  return base_speed + dex + penalty;
}

function dragonage_move_distance() {
  var speed = parseInt(jQuery('.dsf_speed').html());
  return speed;
}

function dragonage_charge_distance() {
  var speed = parseInt(jQuery('.dsf_speed').html());
  return Math.floor(speed/2.0);
}

function dragonage_run_distance() {
  var speed = parseInt(jQuery('.dsf_speed').html());
  return speed*2;
}

function dragonage_move_squares() {
  var dist = parseInt(jQuery('.dsf_move_yrd').html());
  return Math.floor(dist/2.0);
}

function dragonage_charge_squares() {
  var dist = parseInt(jQuery('.dsf_charge_yrd').html());
  return Math.floor(dist/2.0);
}

function dragonage_run_squares() {
  var dist = parseInt(jQuery('.dsf_run_yrd').html());
  return Math.floor(dist/2.0);
}
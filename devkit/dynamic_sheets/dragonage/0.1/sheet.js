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

var container_id;
var chars = aisleten.characters;

function dragonage_dataPreLoad(options) {
  // Called just before the data is loaded.
   container_id = "#" + options['containerId'];
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

function dragonage_dataPreSave(options) {
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

/* Function to allow adding of new entries to lists.
   Entries will be assigned dsf classes with automatic numbering.
   This function identifies the last ID used and returns the next
   available one.
   The first argument is the DOM element that contains the individual entries.
   It is assumed that the list contains at least one element to start with.
*/
function dragonage_get_entry_counter(container, item_class) {
  var prev_entry = container.find('.' + item_class);
  prev_entry = prev_entry[prev_entry.length - 1];
  var dsf_entry = $(prev_entry).find('.dsf')[0];
  var classes = $(dsf_entry).attr('class').split(' ');
  var dsf_id = '';
  for(i=0; i < classes.length; i++){
    prev_id = classes[i].match(/^dsf_\S+_\d+$/);
    if(prev_id){
      components = prev_id[0].split('_')
      dsf_id = components[components.length -1]
      break;
    }
  }
  if(dsf_id === ''){
    console.error("Failed to identify ID of last entry.");
  }
  return parseInt(dsf_id) + 1;
}

/* Remove an entry from a dynamic list */
function dragonage_remove_entry() {
  event.target.parentNode.parentNode.parentNode.remove();
}

/* Add Melee weapon entry */
function dragonage_add_melee_weapon() {
  var container = $(event.target.parentNode.parentNode.parentNode).siblings('.da_content');
  next_id = dragonage_get_entry_counter(container, 'melee_weapon_values');
  new_entry = "<div class='melee_weapon_values'><span class='dsf dsf_melee_weapon_name_" + next_id +
              " melee_weapon_name'></span><span class='dsf dsf_melee_weapon_attack_" + next_id +
              " melee_weapon_attack'></span><span class='dsf dsf_melee_weapon_damage_" + next_id +
              " melee_weapon_damage'></span><span class='da_remove_button'><button onclick='dragonage_remove_entry()'><img src='https://png.icons8.com/material/20/000000/trash.png'></button></span></div>"
  $(new_entry).insertBefore(container.find('.weapon_groups'));
  chars.bindDynamicAttributes(container_id, 'dragonage');
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

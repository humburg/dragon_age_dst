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
   window.container_id = "#" + options['containerId'];
   window.chars = aisleten.characters;

   // display main tab
   document.getElementsByClassName('da_tab_main')[0].style.display = "block";

   // prepare storage for extensible fields
   var ext, target_name, classes;
   var extensibles = jQuery('.extensible');
   var container = jQuery('div.extension_storage');
   for(i = 0; i < extensibles.length; i++) {
    ext = extensibles[i];
    classes = ext.classList;
    for(j=0; j < classes.length; j++){
      if(classes[j].startsWith('extend_')){
        target_name = classes[j].replace('extend_', '');
        storage = document.createElement('span');
        storage.className = "dsf dsf_" + target_name + "_storage";
        container.append(storage);
      }
    }
  }
}

function dragonage_dataPostLoad(options) {
  // Called just after the data is loaded.

  // Populate extensible fields
  var target_name, classes, ext, dom;
  var storage = jQuery('.extension_storage').children();
  var parser = new DOMParser();
  for(i = 0; i < storage.length; i++){
    classes = storage[i].classList;
    for(j=0; j < classes.length; j++){
      if(classes[j].startsWith('dsf_') && classes[j].endsWith('_storage')){
        target_name = classes[j].replace('dsf_', 'extend_').replace('_storage', '');
        if($(storage[i]).text()){
          dom = parser.parseFromString($(storage[i]).text(), 'application/xml');
          jQuery('.' + target_name).replaceWith(dom.children[0]);
        }
      }
    }
  }

  // Ensure Dex based calculations are up to date
  if(jQuery('.dsf_dexterity').html()){
    dragonage_apply_armor_penalty();
  }

  // Ensure Speed based calculations are up to date
  if(!jQuery('.dsf_speed').html()){
    jQuery('.dsf_speed').html(dragonage_speed());
    dragonage_speed_update();
  }
}

function dragonage_dataPreSave(options) {
  // Called just before the data is saved to the server.
  // Collect data from extensible elements and store it in a single field for saving.
  var ext, target_name, classes;
  var extensibles = jQuery('.extensible');
  var serial = new XMLSerializer();
  for(i = 0; i < extensibles.length; i++) {
    ext = extensibles[i];
    classes = ext.classList;
    for(j=0; j < classes.length; j++){
      if(classes[j].startsWith('extend_')){
        target_name = classes[j].replace('extend_', '');
        jQuery('span.dsf.dsf_'+target_name+'_storage').text(serial.serializeToString(ext))
      }
    }
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

  if(field == 'armor_penalty') {
    dragonage_dexterity_update();
  }

  if(field == 'armor_trained') {
    dragonage_dexterity_update();
  }

  if(field == 'shield_bonus') {
    jQuery('.dsf_defense').html(dragonage_defense())
  }

  if(field == 'shield_trained'){
    jQuery('.dsf_defense').html(dragonage_defense())
  }

}

/* Tabbed navigation */
function openTab(evt, tabName) {
  var i, tabcontent, tablinks;

  // Hide all tabs
  tabcontent = document.getElementsByClassName("da_tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
  }

  // Get all elements with class="da_tablinks" and remove the class "active"
  tablinks = document.getElementsByClassName("da_tablinks");
  for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  // Show the current tab, and add an "active" class to the button that opened the tab
  document.getElementsByClassName('da_tab_' + tabName)[0].style.display = "block";
  evt.currentTarget.className += " active";
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

/* Obtain template for new entry in an extendable list from the first element.
   All user editable data is removed and a dele button added. */
function dragonage_get_template(container){
  var template = $(container.children()[0]).clone();
  var entries = template.children('span.dsf');
  var button = "<span class='da_remove_button'><button onclick='dragonage_remove_entry()'><img src='https://png.icons8.com/material/20/000000/trash.png'></button></span>";
  for(var i = 0; i < entries.length; i++){
    $(entries).text("");
  }
  template.append(button);
  return template;
}

/* Replace name of dsf field with new value.
   entry: A user editable element.
   base: Base of field names for this section. Field names are expected to be of the form
         dsf_<base>_<counter>.
   new_suffix: Value to use as replacement for <counter>.
*/
function dragonage_update_entry_name(entry, base, new_suffix){
  var new_class, old_class;
  var target_class = '^dsf_' + base + '_.+_\\d+$';
  var classes = entry.classList;
  for(var i = 0; i < classes.length; i++){
    if(classes[i].match(target_class)){
      old_class = classes[i];
      new_class = old_class.replace(/_\d+$/, '_' + new_suffix);
      entry = $(entry).toggleClass(old_class);
      entry = entry.toggleClass(new_class);
    }
  }
  return entry;
}

/* Create (and register) new user editable fields on demand.
   Required structure for extensible containers:
   <div.da_content>
     <div.extensible>
      <div.[section_name]_values>          |
        <span.dsf.dsf_[field_name 1]_1>    |  This function will add another div
        <span.dsf.dsf_[field_name 2]_1>    |   of the same shape.
        ...                                |
      </div>                               |
    </div>
  </div>

  target_name is used for [section_name] in the above example.
*/
function dragonage_add_entry(target_name) {
  var container = $(event.target.parentNode.parentNode.parentNode).siblings('.da_content').children('.extensible');
  var next_id = dragonage_get_entry_counter(container, target_name + '_values');
  var template = dragonage_get_template(container);
  var entries = template.children();
  for(var i = 0; i < entries.length; i++){
    entries[i] = dragonage_update_entry_name(entries[i], target_name, next_id);
  }
  container.append(template);
  window.chars.bindDynamicAttributes(window.container_id, 'dragonage');
}

/* Computing derived stats */
function dragonage_dexterity_update() {
  dragonage_apply_armor_penalty();
  jQuery('.dsf_speed').html(dragonage_speed());
  dragonage_speed_update();
  jQuery('.dsf_defense').html(dragonage_defense())
}

function dragonage_speed_update() {
  jQuery('.dsf_move_yrd').html(dragonage_move_distance());
  jQuery('.dsf_charge_yrd').html(dragonage_charge_distance());
  jQuery('.dsf_run_yrd').html(dragonage_run_distance());
  jQuery('.dsf_move_sq').html(dragonage_move_squares());
  jQuery('.dsf_charge_sq').html(dragonage_charge_squares());
  jQuery('.dsf_run_sq').html(dragonage_run_squares());
}

 /* The armor penalty is never positive but this is ambiguous in the book.
     Some people may prefer to specify a positive number so we flip the sign if necessary.
  */
function dragonage_armor_penalty(penalty_type){
  var penalty = 0;

  // Armor penalty applies to Dex if untrained but only speed if trained.
  // Check here to avoid applying the penalty to speed twice in the untrained case.
  if(penalty_type == 'speed' && jQuery('.dsf_armor_trained input').val() == "0" ||
     penalty_type == 'dex' && jQuery('.dsf_armor_trained input').val() == "1"){
    return 0;
  }

  if(jQuery('.dsf_armor_penalty').html()){
    penalty = parseInt(jQuery('.dsf_armor_penalty').html());
  }
  if(penalty > 0){
    penalty = -1 * penalty;
  }
  return penalty;
}

function dragonage_apply_armor_penalty(){
  var dex = jQuery('.dsf_dexterity').html();
    if(dex){
      dex = parseInt(dex);
      var penalty = dragonage_armor_penalty('dex');
      if(penalty != 0 && jQuery('.dsf_armor_trained input').val() == "0"){
        dex = dex + penalty;
      }
      jQuery('span.dexterity_actual').html(dex);
    }
}

/* Compute Defense value */
function dragonage_shield_bonus(){
  var bonus = jQuery('.dsf_shield_bonus').html();
  if(bonus){
    bonus = parseInt(bonus);
    if(bonus > 0 && jQuery('.dsf_shield_trained input').val() == "0"){
      bonus = 1;
    }
  }
  return bonus;
}

function dragonage_defense(){
  var dex = parseInt(jQuery('span.dexterity_actual').html());
  return 10 + dex + dragonage_shield_bonus();
}

/* Speed and movement distance calculations. */
function dragonage_speed() {
  var base_speed = 10;
  var dex = parseInt(jQuery('.dexterity_actual').html());
  var penalty = dragonage_armor_penalty('speed');

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
  return Math.floor(dragonage_move_distance()/2.0);
}

function dragonage_charge_squares() {
  return Math.floor(dragonage_charge_distance()/2.0);
}

function dragonage_run_squares() {
  return Math.floor(dragonage_run_distance()/2.0);
}

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
  options['context'] = '#' + options['containerId'];
  window.chars = aisleten.characters;

   // display main tab
   document.getElementsByClassName('da_tab_main')[0].style.display = "block";

   // prepare storage for extendable fields
   var ext, target_name, classes;
   var extendable = jQuery(options['context'] + ' .extendable');
   var container = jQuery(options['context'] + ' div.extension_storage');
   for(i = 0; i < extendable.length; i++) {
    ext = extendable[i];
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

  // prepare text areas
  var texts = jQuery(options['context'] + '.ds_dragonage .user_text textarea');
  var id, parent_class;
  for(var i=0; i < texts.length; i++){
    id = options['containerId'];
    parent_class = texts[i].parentNode.classList;
    for(var j = 0; j < parent_class.length; j++){
      if(parent_class[j].endsWith('_textarea')){
        id = id + '_' + parent_class[j].replace('_textarea', '');
        break;
      }
    }
    if(id == options['containerId']){
      console.error("Failed to construct text area ID");
    }
    texts[i].id = id;
  }
  nicEditors.allTextAreas();
  if(!options['isEditable']){
    jQuery('.nicEdit-main').attr('contenteditable','false');
    jQuery('.nicEdit-panel').hide();
  }
}

function dragonage_dataPostLoad(options) {
  // Called just after the data is loaded.
  options['context'] = '#' + options['containerId'];

  // Populate extendable fields
  var target_name, classes, ext, dom;
  var storage = jQuery(options['context'] + ' .extension_storage').children();
  var parser = new DOMParser();
  for(var i = 0; i < storage.length; i++){
    classes = storage[i].classList;
    for(var j=0; j < classes.length; j++){
      if(classes[j].startsWith('dsf_') && classes[j].endsWith('_storage')){
        target_name = classes[j].replace('dsf_', 'extend_').replace('_storage', '');
        if($(storage[i]).text()){
          dom = parser.parseFromString($(storage[i]).text(), 'application/xml');
          jQuery(options['context'] + ' .' + target_name).replaceWith(dom.children[0]);
        }
      }
    }
  }

  // Populate text areas
  var text_list = jQuery(options['context'] + '.ds_dragonage .user_text_storage span.dsf');
  text_list.each(function(idx){
    if(this.innerHTML != window.chars.jeditablePlaceholder && this.innerHTML != ''){
      var classes = this.classList;
      var id;
      for(var i = 0; i < classes.length; i++){
        id = options['containerId'];
        if(classes[i].startsWith('dsf_')){
          id = id + '_' + classes[i].replace('dsf_', '');
          break;
        }
      }
      nicEditors.findEditor(id).setContent(this.innerHTML);
    }
  })

  // Ensure Dex based calculations are up to date
  if(jQuery(options['context'] + ' .dsf_dexterity').html()){
    dragonage_apply_armor_penalty(options);
  }

  // Ensure Speed based calculations are up to date
  if(!jQuery(options['context'] + ' .dsf_speed').html()){
    jQuery(options['context'] + ' .dsf_speed').html(dragonage_speed(options));
    dragonage_speed_update(options);
  }

  // Ensure magic calculations are up to date
  if(jQuery(options['context'] + ' .dsf_magic').html()){
    dragonage_update_magic(options);
  }

}

function dragonage_dataPreSave(options) {
  // Called just before the data is saved to the server.
  options['context'] = '#' + options['containerId'];

  // Collect data from extendable elements and store it in a single field for saving.
  var ext, target_name, classes;
  var extendables = jQuery('.extendable');
  var serial = new XMLSerializer();
  for(var i = 0; i < extendables.length; i++) {
    ext = extendables[i];
    classes = ext.classList;
    for(var j=0; j < classes.length; j++){
      if(classes[j].startsWith('extend_')){
        target_name = classes[j].replace('extend_', '');
        jQuery('span.dsf.dsf_'+target_name+'_storage').text(serial.serializeToString(ext))
      }
    }
  }

  // copy text area content
  var text_list = jQuery(options['context'] + '.ds_dragonage .user_text_storage span.dsf');
  text_list.each(function(idx){
    var classes = this.classList;
    var id;
    for(var i = 0; i < classes.length; i++){
      id = options['containerId'];
      if(classes[i].startsWith('dsf_')){
        id = id + '_' + classes[i].replace('dsf_', '');
        break;
      }
    }
    this.innerHTML = nicEditors.findEditor(id).getContent();
  })
}


function dragonage_dataChange(options) {
  // Called immediately after a data value is changed.
  options['context'] = '#' + options['containerId'];

  var field = options['fieldName'];
  var val = options['fieldValue'];

  if(field == 'dexterity') {
    dragonage_dexterity_update(options);
  }

  if(field == 'magic' || field.endsWith('_magic_focus') || field.endsWith('_magic_extra')){
    dragonage_update_magic(options);
  }

  if(field == 'speed') {
    dragonage_speed_update(options);
  }

  if(field == 'armor_penalty') {
    dragonage_dexterity_update(options);
  }

  if(field == 'armor_trained') {
    dragonage_dexterity_update(options);
  }

  if(field == 'shield_bonus') {
    jQuery('.dsf_defense').html(dragonage_defense(options))
  }

  if(field == 'shield_trained'){
    jQuery('.dsf_defense').html(dragonage_defense(options))
  }

}

/* Tabbed navigation */
function openTab(evt, tabName) {
  var i, tabcontent, tablinks;
  var context = $(evt.currentTarget).parents('div.dynamic_sheet.ds_dragonage')[0];
  // Hide all tabs
  tabcontent = context.getElementsByClassName("da_tabcontent");
  for (var i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
  }

  // Get all elements with class="da_tablinks" and remove the class "active"
  tablinks = context.getElementsByClassName("da_tablinks");
  for (var i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  // Show the current tab, and add an "active" class to the button that opened the tab
  context.getElementsByClassName('da_tab_' + tabName)[0].style.display = "block";
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
  for(var i=0; i < classes.length; i++){
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
   Required structure for extendable containers:
   <div.da_content>
     <div.extendable>
      <div.[section_name]_values>          |
        <span.dsf.dsf_[field_name 1]_1>    |  This function will add another div
        <span.dsf.dsf_[field_name 2]_1>    |   of the same shape.
        ...                                |
      </div>                               |
    </div>
  </div>

  target_name is used for [section_name] in the above example.
*/
function dragonage_add_entry(event, target_name) {
  var context = $(event.target).parents('div.dynamic_sheet.ds_dragonage')[0].id;
  var container = $(event.target.parentNode.parentNode.parentNode).siblings('.da_content').children('.extendable');
  var next_id = dragonage_get_entry_counter(container, target_name + '_values');
  var template = dragonage_get_template(container);
  var entries = template.children();
  for(var i = 0; i < entries.length; i++){
    entries[i] = dragonage_update_entry_name(entries[i], target_name, next_id);
  }
  container.append(template);
  window.chars.bindDynamicAttributes(context, 'dragonage');
}

/* Computing derived stats */
function dragonage_dexterity_update(options) {
  dragonage_apply_armor_penalty(options);
  jQuery(options['context'] + ' .dsf_speed').html(dragonage_speed(options));
  dragonage_speed_update(options);
  jQuery(options['context'] + ' .dsf_defense').html(dragonage_defense(options))
}

function dragonage_speed_update(options) {
  var context = options['context'];
  jQuery(context + ' .dsf_move_yrd').html(dragonage_move_distance(context));
  jQuery(context + ' .dsf_charge_yrd').html(dragonage_charge_distance(context));
  jQuery(context + ' .dsf_run_yrd').html(dragonage_run_distance(context));
  jQuery(context + ' .dsf_move_sq').html(dragonage_move_squares(context));
  jQuery(context + ' .dsf_charge_sq').html(dragonage_charge_squares(context));
  jQuery(context + ' .dsf_run_sq').html(dragonage_run_squares(context));
}

function dragonage_update_magic(options){
  var spell_power = jQuery(options['context'] + ' .spell_power_display');
  for(var i = 0; i < spell_power.length; i++){
    dragonage_update_spell_power(spell_power[i], options);
  }
}

function dragonage_update_spell_power(container, options){
  var magic = parseInt(jQuery(options['context'] + ' .dsf_magic').html());
  var focus = parseInt($(container).find('.spell_power_focus input').val()) * 2 +
              parseInt($(container).find('.spell_power_extra input').val());
  $(container).find('span.spell_power_value').html(10 + magic + focus);
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

function dragonage_apply_armor_penalty(options){
  var context = options['context'];
  var dex = jQuery(context + ' .dsf_dexterity').html();
    if(dex){
      dex = parseInt(dex);
      var penalty = dragonage_armor_penalty('dex');
      if(penalty != 0 && jQuery(context + ' .dsf_armor_trained input').val() == "0"){
        dex = dex + penalty;
      }
      jQuery(context + ' span.dexterity_actual').html(dex);
    }
}

/* Compute Defense value */
function dragonage_shield_bonus(options){
  var context = options['context'];
  var bonus = jQuery(context + ' .dsf_shield_bonus').html();
  if(bonus){
    bonus = parseInt(bonus);
    if(bonus > 0 && jQuery(context + ' .dsf_shield_trained input').val() == "0"){
      bonus = 1;
    }
  }
  return bonus;
}

function dragonage_defense(options){
  var context = options['context'];
  var dex = parseInt(jQuery(context + ' span.dexterity_actual').html());
  return 10 + dex + dragonage_shield_bonus(options);
}

/* Speed and movement distance calculations. */
function dragonage_speed(options) {
  var context = options['context'];

  var base_speed = 10;
  var dex = parseInt(jQuery(context + ' .dexterity_actual').html());
  var penalty = dragonage_armor_penalty('speed');

  var race = jQuery(context + ' .dsf_race').html();
  if(race.toLowerCase() == 'dwarf'){
    base_speed = 8;
  }
  else if(race.toLowerCase() == 'elf') {
    base_speed = 12;
  }
  return base_speed + dex + penalty;
}

function dragonage_move_distance(context) {
  var speed = parseInt(jQuery(context + ' .dsf_speed').html());
  return speed;
}

function dragonage_charge_distance(context) {
  var speed = parseInt(jQuery(context + ' .dsf_speed').html());
  return Math.floor(speed/2.0);
}

function dragonage_run_distance(context) {
  var speed = parseInt(jQuery(context + ' .dsf_speed').html());
  return speed*2;
}

function dragonage_move_squares(context) {
  return Math.floor(dragonage_move_distance(context)/2.0);
}

function dragonage_charge_squares(context) {
  return Math.floor(dragonage_charge_distance(context)/2.0);
}

function dragonage_run_squares(context) {
  return Math.floor(dragonage_run_distance(context)/2.0);
}

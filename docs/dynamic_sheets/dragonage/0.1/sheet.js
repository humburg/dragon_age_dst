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

/* Global options for Chainsaw's modules */
csx_opts = {
	'setupCallback': function(context){chainsawxiv_module_setup(context);},
	'defaultFieldValue':'???',
	'defaultContext': '',
	'isEditable': false
};

function chainsawxiv_module_setup(context){
	// Provide default context
	if (context == undefined)
		context = csx_opts.defaultContext;
	// Do setup for interfaces
  csx_edit(context);
  csx_check(context);
  csx_list(context);
}

function csx_callback(which, context){
  // Provide default context
	if (context == undefined)
    context = csx_opts.defaultContext;
  switch(which){
    case 'edit': 
      csx_edit(context);
      // Enable automatic updates
      var edit_fields = csx_opts['defaultContext'].querySelectorAll('.dsf,.edit');
      var classes;
      var container_id;
      for (var i = 0; i < edit_fields.length; i++){
        classes = edit_fields[i].classList;
        for(var j=0; j < classes.length; j++){
          if(classes[j].startsWith('dsf_')){
            edit_fields[i].field_name = classes[j].replace('dsf_', '');
          }
        }
        container_id = $(edit_fields[i]).closest('.ds_dragonage')[0].id;
        edit_fields[i].update = function(){dragonage_dataChange({'fieldValue':this.value(), 
                                                                 'fieldName':this.field_name, 
                                                                 'containerId':container_id});};
      }
      break;
    case 'list': 
      csx_list(context);
      break;
    case 'check': 
      csx_check(context);
      break;
  }
}

function include_script(source, type){
  var includes = document.createElement('script');
  includes.type = 'text/javascript';
  includes.src = source;
  includes.onload = function(){
    // Callback to use what you just loaded
    csx_callback(type, csx_opts.defaultContext);
  };
  document.body.appendChild(includes);
}

function dragonage_dataPreLoad(options) {
  // Called just before the data is loaded.
  options['context'] = '#' + options['containerId'];
  csx_opts['defaultContext'] = document.getElementById(options.containerId);
  csx_opts['isEditable'] = options.isEditable;
  window.chars = aisleten.characters;
  window.chars.jeditablePlaceholder = csx_opts.defaultFieldValue;
  
   // display main tab
  document.getElementsByClassName('da_tab_main')[0].style.display = "block";
}

function dragonage_dataPostLoad(options) {
  // Called just after the data is loaded.
  options['context'] = '#' + options['containerId'];
  csx_opts['defaultContext'] = document.getElementById(options.containerId);
  csx_opts['isEditable'] = options.isEditable;

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

  // Import Chainsaw's javascript
  include_script('https://chainsawxiv.github.io/DST/common/js/csx_list.js', 'list');
  include_script('https://chainsawxiv.github.io/DST/common/js/csx_check.js', 'check');
  include_script('https://humburg.github.io/DST/common/js/csx_edit.js', 'edit');
}

function dragonage_dataPreSave(options) {
  // Called just before the data is saved to the server.
  options['context'] = '#' + options['containerId'];
  csx_opts['defaultContext'] = document.getElementById(options.containerId);
  csx_opts['isEditable'] = options.isEditable;

  // Prepare Chainsaw's modules for saving
  // Default the context if not set
  var context = csx_opts.defaultContext;

  // Bake everything down to its field values
  var edits = context.querySelectorAll('.dsf:not(.readonly),.edit');
  for (var i = 0; i < edits.length; i++){
    edits[i].unrender();
  }

  var lists = context.querySelectorAll('.list');
  for (var i = 0; i < lists.length; i++){
    lists[i].unrender();
  }
}

function dragonage_dataChange(options) {
  // Called immediately after a data value is changed.
  options['context'] = '#' + options['containerId'];
  csx_opts['defaultContext'] = document.getElementById(options.containerId);
  csx_opts['isEditable'] = options.isEditable;

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

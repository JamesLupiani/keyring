/**
 * @author Dirk Bergstrom
 * 
 * Keyring for webOS - Easy password management on your phone.
 * Copyright (C) 2009, Dirk Bergstrom, keyring@otisbean.com
 *     
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

function PreferencesAssistant(ring) {
	this.ring = ring;
	this.fieldsToListen = [];
}

PreferencesAssistant.prototype.setup = function() {
	Mojo.Log.info("setup");
	this.controller.setupWidget("timeout",
		{modelProperty: "timeout",
    	 choices: [{label: "5 seconds", value: 5000},
    	           {label: "15 seconds", value: 15000},
	               {label: "30 seconds", value: 30000}, 
	               {label: "1 minute", value: 60000},
	               {label: "2 minutes", value: 120000},
	               {label: "5 minutes", value: 300000}]},
        this.ring.prefs);
	this.fieldsToListen.push("timeout");

	this.controller.setupWidget("sortBy",
		{modelProperty: "sortBy",
		 choices: [{label: "Title", value: "TITLE"},
		          {label: "Last Viewed", value: "viewed"},
		          {label: "Last Changed", value: "changed"},
		          {label: "Created Date", value: "created"}]},
        this.ring.prefs);
	this.fieldsToListen.push("sortBy");

	// Character types for password generator
    Object.keys(this.ring.prefs.generatorPrefs).each(function(attr) {
    	if (attr == "characters") { return; }
        this.controller.setupWidget(attr+"Field",
            {modelProperty: attr}, this.ring.prefs.generatorPrefs);
        this.fieldsToListen.push(attr+"Field");
    }, this);

    // RadioButton for number of characters in password generator
    this.controller.setupWidget("characters",
    	{modelProperty: "characters",
   	     choices: [{label: 6, value: 6}, {label: 8, value: 8}, 
		          {label: 10, value: 10}, {label: 12, value: 12},
		          {label: 16, value: 16}]},
         this.ring.prefs.generatorPrefs);
    this.fieldsToListen.push("characters");
    
    this.ring.updateTimeout();
};

PreferencesAssistant.prototype.fieldUpdated = function(event) {
	if (event.value != event.oldValue) {
		Mojo.Log.info("field '%s' changed", event.property);
		this.ring.saveData();
		if (event.property == "sortBy") {
			this.ring.buildItemList();
			this.ring.itemsReSorted = true;
		}
	}
	this.ring.updateTimeout();
};

/* Don't leave an item visible when we minimize. */
PreferencesAssistant.prototype.timeoutOrDeactivate = function() {
	Mojo.Log.info("Prefs scene timeoutOrDeactivate");
	this.ring.clearPassword();
	this.controller.stageController.popScene();
};

PreferencesAssistant.prototype.activate = function(event) {
	Mojo.Log.info("activate");
	this.fieldsToListen.each(function(field) {
		Mojo.Event.listen(this.controller.get(field),
				Mojo.Event.propertyChange, this.fieldUpdated.bind(this));
	}, this);

	Mojo.Event.listen(this.controller.stageController.document,
			Mojo.Event.stageDeactivate, this.timeoutOrDeactivate.bind(this));
	
	// Pop the scene if the user is idle too long
	this.cancelIdleTimeout = this.controller.setUserIdleTimeout(this.controller.sceneElement,
			this.timeoutOrDeactivate.bind(this), this.ring.prefs.timeout); 
};

PreferencesAssistant.prototype.deactivate = function(event) {
	// FIXME not sure if this.fieldUpdated.bind(this) is the right thing here
	this.fieldsToListen.each(function(field) {
		Mojo.Event.stopListening(this.controller.get(field),
				Mojo.Event.propertyChange, this.fieldUpdated.bind(this));
	}, this);
	
	Mojo.Event.stopListening(this.controller.stageController.document,
			Mojo.Event.stageDeactivate, this.timeoutOrDeactivate.bind(this));
	this.cancelIdleTimeout();
};

PreferencesAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
};

// Accessory for controlling Pioneer AVR via HomeKit

var request = require("request");
var inherits = require('util').inherits;
var Service, Characteristic;

// need to be global to be used in constructor
var maxVolume;
var minVolume;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;


homebridge.registerAccessory("homebridge-vsx1027", "VSX-1027", PioneerAVR);




  function PioneerAVR(log, config) {
    // configuration
    this.ip = config['ip'];
    this.name = config['name'];
    maxVolume = config['maxVolume'];
    minVolume = config['minVolume'];

    this.log = log;

    this.get_url = "http://" + this.ip + "/StatusHandler.asp";

    this.on_url = "http://" + this.ip + "/EventHandler.asp?WebToHostItem=PO";
    this.off_url = "http://" + this.ip + "/EventHandler.asp?WebToHostItem=PF";

    this.powerstate_url = "http://" + this.ip + "/EventHandler.asp?WebToHostItem=?P";

    this.mute_on = "http://" + this.ip + "/EventHandler.asp?WebToHostItem=MO";
    this.mute_off = "http://" + this.ip + "/EventHandler.asp?WebToHostItem=MF";

    this.volume_url = "http://" + this.ip + "/EventHandler.asp?WebToHostItem=";
    this.volumelevel_url = "http://" + this.ip + "/EventHandler.asp?WebToHostItem=?V";

    this.input_url = "http://" + this.ip + "/EventHandler.asp?WebToHostItem=FU";
  }

  // Custom Characteristics and service...
  PioneerAVR.Brightness = function(level) {
    Characteristic.call(this, 'Volume', '4804a651-2f32-4e1f-ac75-dacf23d9df93');
    console.log("Maximum Volume", maxVolume);
    this.addCharacteristic(PioneerAVR.Brightness());
    this.value = this.getDefaultValue();
  };
  inherits(PioneerAVR.Brightness, Characteristic);


/*  PioneerAVR.Muting = function() {
    Characteristic.call(this, 'Mute', '4804a652-2f32-4e1f-ac75-dacf23d9df93');
    console.log("Mute Characteristic")
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
  };
  inherits(PioneerAVR.Muting, Characteristic);
*/

  PioneerAVR.LightbulbService = function(displayName, subtype) {
    Service.call(this, displayName, '4804a653-2f32-4e1f-ac75-dacf23d9df93', subtype);
    this.addCharacteristic(PioneerAVR.Brightness());
    //this.addCharacteristic(PioneerAVR.Muting);
  };
  inherits(PioneerAVR.LightbulbService, Service);

  PioneerAVR.prototype = {

    httpRequest: function(url, method, callback) {
		  var that = this;

		  request({
        url: url,
        method: method
		  },
		  function (error, response, body) {
        callback(error, response, body)
      })
    },

    getPowerState: function(callback) {
      var url;
      url = this.powerstate_url;
      this.httpRequest(url, "GET", function(error, response, body) {
        if (!error && response.statusCode == 200) {
      		var jsonResponse = JSON.parse(body);
      		powerState = (jsonResponse[' ']);

          if (powerState == 1) {
            callback(null, true);
          }
          else {
            callback(null, false);
          }
          this.log("Power state is:", powerState);
      	}
        else {
          this.log('HTTP getPowerState function failed: %s', error);
          callback(error);
        }
      }.bind(this))
    },

    setPowerState: function(powerOn, callback) {
      var url;

      if (powerOn) {
        url = this.on_url;
      	this.log("Set", this.name, "to on");
    	}
    	else {
      	url = this.off_url;
      	this.log("Set", this.name, "to off");
    	}

    	this.httpRequest(url, "GET", function(error, response, body) {
      	if (!error && response.statusCode == 200) {
        	this.log('HTTP power function succeeded!');
        	callback();
      	}
      	else {
          this.log('HTTP power function failed: %s', error);
        	callback(error);
      		}
    	}.bind(this));
  	},

/*    getMuteState: function(callback) {
      var url;
      url = this.get_url;
      this.httpRequest(url, "GET", function(error, response, body) {
        if (!error && response.statusCode == 200) {
      		var jsonResponse = JSON.parse(body);
		      muteState = jsonResponse['Z'][0]['M'];
          if (muteState == 1) {
            callback(null, true);
          }
          else {
            callback(null, false);
          }
          this.log("Mute state is:", muteState);
      	}
        else {
          this.log('HTTP getMuteState function failed: %s', error);
          callback(error);
        }
      }.bind(this))
    },
    setMuteState: function(muteOn, callback) {
    	var url;
    	if (muteOn) {
      	url = this.mute_on;
      	this.log(this.name, "muted");
    	}
    	else {
      	url = this.mute_off;
      	this.log(this.name, "unmuted");
    	}
    	this.httpRequest(url, "GET", function(error, response, body) {
        if (!error && response.statusCode == 200) {
        	this.log('HTTP mute function succeeded!');
        	callback();
      	}
      	else {
          this.log('HTTP mute function failed: %s', error);
        	callback(error);
      		}
    	}.bind(this));
  	},
*/
    getBrightness: function(level, callback) {
      var url;
      url = this.volumelevel_url;

      this.httpRequest(url, "GET", function(error, response, body) {
        if (!error && response.statusCode == 200) {

          volumeValue = Number;
          volume = (volumeValue - 10) * 2

          level(Number(volume));

          this.log("MasterVolume is:", volume);
        }
        else {
          this.log('HTTP getVolume function failed: %s', error);
          callback(error);
          }

      }.bind(this))

    },

  	setBrightness: function(level, callback) {

        var intValue = Math.round(level * 2 - 61);
        intValue = Math.max(intValue, - 10);
        var valueStr = ("00" + intValue).slice(-3);

        url = this.volume_url + valueStr + "VL";

  		this.httpRequest(url, "GET", function(error, response, body) {
        if (error) {
          this.log('HTTP volume function failed: %s', error);
          callback(error);
        }
        else {
          this.log("Set volume to", level, "db");
          callback();
          }

      }.bind(this));
  	},

/*    setInput: function(callback) {
      url = this.input_url + "FU";
    this.httpRequest(url, "GET", function(error, response, body) {
      if (error) {
        this.log('HTTP input function failed: %s', error);
        callback(error);
      }
      else {
        this.log("Next Input");
        callback();
        }
    }.bind(this));
    },
*/

  getServices: function() {
		var that = this;

		var informationService = new Service.AccessoryInformation();
		informationService
	    		.setCharacteristic(Characteristic.Manufacturer, "Pioneer")
	    		.setCharacteristic(Characteristic.Model, "VSX-1027")
	    		.setCharacteristic(Characteristic.SerialNumber, "74:5E:1C:11:FA:1F");

		var switchService = new Service.Switch(this.name);
		switchService
			.getCharacteristic(Characteristic.On)
				/*.on('get', this.getPowerState.bind(this))*/
				.on('set', this.setPowerState.bind(this));

    var lightbulbService = new Service.Lightbulb(this.name);
    lightbulbService
        .addCharacteristic(new Characteristic.Brightness())
        .on('get', this.getBrightness.bind(this))
        .on('set', this.setBrightness.bind(this));


    /*
		audioDeviceService
			.getCharacteristic(PioneerAVR.Muting)
				.on('get', this.getMuteState.bind(this))
				.on('set', this.setMuteState.bind(this));
    var lightbulbService = new Service.Lightbulb(this.name);
		lightbulbService
			.getCharacteristic(Characteristic.On)
				.on('get', this.getBrightness.bind(this))
				.on('set', this.setBrightness.bind(this));
    lightbulbService
        .addCharacteristic(new Characteristic.Brightness())
        .on('get', this.getBrightness.bind(this))
        .on('set', this.setBrightness.bind(this));*/

    //return [informationService, switchService];

		return [informationService, switchService, lightbulbService];
		}



	}
}


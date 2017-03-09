$(document).ready(function () {
  var $connectButton = $("button.connect"),
    $debugButton = $("button.debug");

  var batteryLevelCharacteristic,
    onewheelService,
    initialBatteryLevel;

  if (Notification.permission !== 'granted') {
    Notification.requestPermission();
  }
  console.log("Document is ready.");

  $connectButton.on("click", function () {
    navigator.bluetooth.requestDevice({ filters: [{ services: ['e659f300-ea98-11e3-ac10-0800200c9a66'] }]})
    .then(device => device.gatt.connect())
    .then(server => {
      // Getting Onewheel Service...
      return server.getPrimaryService('e659f300-ea98-11e3-ac10-0800200c9a66');
    })
    .then(service => {
      // Getting Battery Level...
      onewheelService = service;
      service.getCharacteristic('e659f303-ea98-11e3-ac10-0800200c9a66')
      .then(characteristic => {
        batteryLevelCharacteristic = characteristic;
        batteryLevelCharacteristic.startNotifications().then(_ => {
          batteryLevelCharacteristic.addEventListener(
            'characteristicvaluechanged',
            handleBatteryValueChanged
          );
        });
        return batteryLevelCharacteristic.readValue().then(value => {
          initialBatteryLevel = value.getUint16();
          console.log('Battery percentage is ' + initialBatteryLevel);
          updateBatteryValue(initialBatteryLevel);
        })
        .catch(error => {
          console.log('Argh! ' + error);
        });
      })
      .then(_ => {
        console.log("following battery percentage");
      })

      service.getCharacteristic('e659f319-ea98-11e3-ac10-0800200c9a66')
      .then(characteristic => {
        // Reading Odometer Level
        return characteristic.readValue()
        .then(value => {
          updateOdometerValue(value.getUint16());
        });
      })

      service.getCharacteristic('e659f301-ea98-11e3-ac10-0800200c9a66')
      .then(characteristic => {
        // Reading Serial Number
        return characteristic.readValue()
        .then(value => {
          updateSerialNumberValue(value.getUint16());
        });
      })

      service.getCharacteristic('e659f318-ea98-11e3-ac10-0800200c9a66')
      .then(characteristic => {
        // Reading Hardware Revision #
        return characteristic.readValue()
        .then(value => {
          updateHardwareRevisionValue(value.getUint16());
        });
      })

      service.getCharacteristic('e659f311-ea98-11e3-ac10-0800200c9a66')
      .then(characteristic => {
        // Reading Firmware Revision #
        return characteristic.readValue()
        .then(value => {
          updateFirmwareRevisionValue(value.getUint16());
        });
      })

      service.getCharacteristic('e659f302-ea98-11e3-ac10-0800200c9a66')
      .then(characteristic => {
        // Reading Ride Mode #
        return characteristic.readValue()
        .then(value => {
          updateRideModeValue(value.getUint16());
        });
      })

    })
    .catch(error => { console.log(error); });

    if (getParameterByName("debug") == "true") {
      $debugButton.show();
    }
  });

  $debugButton.on("click", function () {
    readValuesOfServices();
  });

  function handleBatteryValueChanged(event) {
    var value = event.target.value,
      batteryLevel = value.getUint16();
    console.log('Battery updated to: ' + batteryLevel);
    updateBatteryValue(batteryLevel);
  }

  function updateBatteryValue(value) {
    $("#battery-percent").html(value + "%");
    var adjustedValue = value * 0.96;
    $('head').append('<style>.battery:before{width: ' + adjustedValue + '% !important;}</style>');

    if (value == 100) {
      notifyUserOfBatteryCompletion();
    }
  }

  function updateFirmwareRevisionValue(value) {
    $("#firmware-revision").html(value);
  }

  function updateHardwareRevisionValue(value) {
    $("#hardware-revision").html(value);
  }

  function updateOdometerValue(value) {
    $("#odometer-number").html(value + " Miles");
  }

  function updateRideModeValue(value) {
    switch (value) {
      case 1:
        mode = "Classic (1)";
        break;
      case 2:
        mode = "Extreme (2)";
        break;
      case 3:
        mode = "Elevated (3)";
        break;
      case 4:
        mode = "Sequoia (4)";
        break;
      case 5:
        mode = "Cruz (5)";
        break;
      case 6:
        mode = "Mission (6)";
        break;
      default:
        mode = value;
    }
    $("#ride-mode").html(mode);
  }

  function updateSerialNumberValue(value) {
    $("#serial-number").html(value);
  }

  function readValuesOfServices() {
    onewheelService.getCharacteristics().then(characteristics => {
      console.log('> Service: ' + onewheelService.uuid);
      characteristics.forEach(characteristic => {
        var myChar = characteristic;
        myChar.readValue().then(value => {
          console.log(
            '>> Characteristic: ' +
            characteristic.uuid +
            ' value: ' +
            value.getUint16()
          );
        });;
      });
    });
  }

  function toggleLight() {
    onewheelService.getCharacteristic('e659f30d-ea98-11e3-ac10-0800200c9a66')
    .then(characteristic => {
      // Reading Odometer Level
      let lightOn = new Uint16Array([15360]);
      return characteristic.writeValue(lightOn);
    })
  }

  function getParameterByName(name, url) {
    if (!url) {
      url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }

  function notifyUserOfBatteryCompletion() {
    var batteryNotificationMessage = "Your battery is at 100%. Ready to ride!";
    var batteryNotificationOptions = {
      icon: 'https://drewbaumann.github.io/onewheel-web/apple-icon.png',
      body: batteryNotificationMessage,
    };

    if (!("Notification" in window)) {
      alert(batteryNotificationMessage);
    }
    // Otherwise, we need to ask the user for permission
    else if (Notification.permission !== 'denied') {
      var notification = new Notification(
        "Battery Ready",
        batteryNotificationOptions
      );
    }
    else {
      Notification.requestPermission();
    }
  }
});

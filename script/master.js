$(document).ready(function () {
  var $connectButton = $("button.connect"),
    $debugButton = $("button.debug");

  var batteryLevelCharacteristic,
    onewheelService;

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
          console.log('Battery percentage is ' + value.getUint8(1));
          updateBatteryValue(value.getUint8(1));
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
        // Reading Odometer Level...
        return characteristic.readValue()
        .then(value => {
          // console.log('Odometer is ' + value.getUint8(1));
          updateOdometerValue(value.getUint8(1));
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
      batteryLevel = value.getUint8(1);
    console.log('Battery updated to: ' + batteryLevel);
    updateBatteryValue(batteryLevel);
  }

  function updateBatteryValue(value) {
    $("#percent").html(value);
    var adjustedValue = value * 0.96;
    $('head').append('<style>.battery:before{width: ' + adjustedValue + '% !important;}</style>');
  }

  function updateOdometerValue(value) {
    $("#odometer-number").html(value);
  }

  function readValuesOfServices() {
    onewheelService.getCharacteristics().then(characteristics => {
      console.log('> Service: ' + onewheelService.uuid);
      characteristics.forEach(characteristic => {
        var myChar = characteristic;
        myChar.readValue().then(value => {
          console.log('>> Characteristic: ' + characteristic.uuid + ' value: ' + value.getUint8(1));
        });;
      });
    });
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
});

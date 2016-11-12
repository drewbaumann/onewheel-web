$(document).ready(function () {
  var $connectButton = $("button.connect");

  $connectButton.on("click", function () {
    navigator.bluetooth.requestDevice({ filters: [{ services: ['e659f300-ea98-11e3-ac10-0800200c9a66'] }]})
    .then(device => device.gatt.connect())
    .then(server => {
      // Getting Onewheel Service...
      return server.getPrimaryService('e659f300-ea98-11e3-ac10-0800200c9a66');
    })
    .then(service => {
      // Getting Battery Level...
      service.getCharacteristic('e659f303-ea98-11e3-ac10-0800200c9a66')
      .then(characteristic => {
        characteristic.startNotifications()
        .then(_ => {
          characteristic.addEventListener(
            'batteryvaluechanged',
            handleBatteryValueChanged
          );
        });
        return characteristic.readValue()
        .then(value => {
          console.log('Battery percentage is ' + value.getUint8(1));
          updateBatteryValue(value.getUint8(1));
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
          console.log('Odometer is ' + value.getUint8(1));
          updateOdometerValue(value.getUint8(1));
        });
      })
    })
    .catch(error => { console.log(error); });
  });

  function handleBatteryValueChanged(event) {
    var value = event.target.value;
    console.log('Battery ' + value);
  }

  function updateBatteryValue(value) {
    $("#percent").html(value);
    var adjustedValue = value * 0.96;
    $('head').append('<style>.battery:before{width: ' + adjustedValue + '% !important;}</style>');
  }

  function updateOdometerValue(value) {
    $("#odometer-number").html(value);
  }
});

const mqtt = require('mqtt');

// Vehicle positioning for ongoing buses at Lauttasaari bridge
const myTopic = '/hfp/v2/journey/ongoing/vp/bus/+/+/+/+/+/+/+/+/60;24/18/69/27/#';
const hslClient = mqtt.connect('mqtts://mqtt.hsl.fi:8883');
const mosquittoClient = mqtt.connect('mqtt://test.mosquitto.org:1883');

hslClient.on('connect', function () {
   hslClient.subscribe(myTopic, function (err) {
      if (!err) {
         console.log('Connected!');
      } else {
         console.log(err);
      }
   })
});
hslClient.on('message', function (topic, message) {
   let json = JSON.parse(message.toString());
   let speed = json.VP.spd;

   console.log(message.toString());
   console.log('Speed m/s: ' + speed);
   console.log('Speed km/h: ' + (parseInt(parseFloat(speed) * 3600 / 1000)));
   console.log('Speed difference: ' + (parseInt(parseFloat(speed) * 3600 / 1000) - 30));

   let msgObject = {
      "oper": json.VP.oper,
      "veh": json.VP.veh,
      "lat": json.VP.lat,
      "long": json.VP.long,
      "spd": json.VP.spd
   };
   let mqttTopic = '';

   if (speed >= 10) {
      msgObject = {
         ...msgObject,
         "cause": 'Hude speeding'
      }
      mqttTopic = '/swd4tn023/control/traffic/hugespeeding'

   } else if (speed > 8.33 && speed < 10) {
      msgObject = {
         ...msgObject,
         "cause": 'Potential speeding'
      }
      mqttTopic = '/swd4tn023/control/traffic/speeding'

   } else {
      msgObject = {
         ...msgObject,
         "cause": 'Traffic jam'
      }
      mqttTopic = '/swd4tn023/control/traffic/jam'
   }
   mosquittoClient.publish(mqttTopic, JSON.stringify(msgObject));
});
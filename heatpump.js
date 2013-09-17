/*
** Read data from a Thermiq card and publish the data to an MQTT server
*/
var mqtt = require('mqtt')
  , client = mqtt.createClient(1883,"192.168.1.151");
var hp_parameter_texts = ["Outdoor_temp", "Indoor_temp", "Indoor_temp_dec", "Indoor_target_temp"];
var i=0;


/*
** Function to run an external command
*/
function run_cmd(cmd, args, callBack ) {
    var spawn = require('child_process').spawn;
    var child = spawn(cmd, args);
    var resp = "";

    child.stdout.on('data', function (buffer) { resp += buffer.toString() });
    child.stdout.on('end', function() { callBack (resp) });
} // ()

/*
** Interval timer event to ask for heatpump data
*/
setInterval(function() { 
   run_cmd("./hp_mockup.sh",[""], function(text) {
      /*
      ** The output is a long string of param=value separated by &.
      ** Let's first split it into separate param=value fields
      */  
      var params = text.split("&");
     
      /*
      ** Now, let's split param from value
      */
      var split; 
      for(i=0;i<params.length;i++) { //change count to params.length for full list
         split = params[i].split("=");
         client.publish('/hp/raw/'+split[0], split[1]);
         //console.log("Param:%s, Value:%s", split[0], split[1]); 
      }
   });
}, 30000);
 

/*
** Read sensordata from a RFXCOM module and publish the data as a Modbus/TCP server
*/
var FC = require('modbus-stack').FUNCTION_CODES;
var rfxcom = require('rfxcom');
var rfxtrx = new rfxcom.RfxCom("/dev/tty.usbserial-A1WJDDBA", {debug: false});

/*
 * Constants
 */
var MODBUS_PORT = 1502;

/*
 * Variables
 */
var devicelist=[];
var input_register = [];
var i=0;
var nbr_of_sensors=0;
var topic;

/*
** Function to print the list of sensors
*/
function publish_sensorlist() {
   // Dump sensorlist
   for(i=0;i<nbr_of_sensors;i++) {
      console.log("Sensor %d, ID %s", i, devicelist[i]);
   }
//   client.publish('/gw1/topics', devicelist.toString(), {retain:true});
}

/*
** Event: On Oregon Scientific temp and humidity sensor
*/
rfxtrx.on("th1", function (evt) {
   // Oregon Scientific sensors 
   console.log("Event %s, %s", evt.subtype, evt.id); 
   console.log("Temp: %s, Hum:%s", evt.temperature, evt.humidity);

   /*
    * Check which sensor and fill input registers with data
    */
   switch(evt.id) {
   case 0xFB01: console.log("Temp 1 = %s", evt.temperature);
   break;
   case 0x6F02: console.log("Temp 2 = %s", evt.temperature);
   break;
   case 0x7004: console.log("Temp 3 = %s", evt.temperature);
   break;
   case 0x3D01: console.log("Temp 4 = %s", evt.temperature);
   break;
   default:
	   console.log("Unknown sensor (%s) = %s", evt.id, evt.temperature);
   }
   // Loop through list to check if sensor is new or not 
   for(i=0;i<=nbr_of_sensors;i++) {
      if(devicelist[i]== evt.id) {
	// This sensor is already known         
	break;
      }
      else {
         if(nbr_of_sensors<=i)
         {
	    // Aha, a new one!
            console.log("New sensor found, %d, %d", i, nbr_of_sensors);
            devicelist[nbr_of_sensors] = evt.id;
            nbr_of_sensors++;
	    publish_sensorlist();
	    break;
         }
      }
   }
   
 //  client.publish('/gw1/rf/'+evt.id+'/temperature', evt.temperature.toString(), {retain:true});
 //  client.publish('/gw1/rf/'+evt.id+'/humidity', evt.humidity.toString(), {retain:true}); 
});

/*
** Event: On ready
*/
rfxtrx.on("ready", function (evt) {
   console.log("Ready");
});

/*
** Event: On status
*/
rfxtrx.on("status", function (evt) {
   console.log("Status");
});

/*
** Event: initialise
*/
rfxtrx.initialise(function () {
    console.log("Device initialised");
});

/*
 * Handler for input registers
 */ 
handlers[FC.READ_INPUT_REGISTERS] = function(request, response) {
	var start = request.startAddress;
	var length = request.quantity;

	var resp = new Array(length);
	for (var i=0; i<length; i++) {
		resp[i] = input_register[start+i];
	}
	
	response.writeResponse(resp);
}

/*
 * Start modbus server
 */
require('modbus-stack/server').createServer(handlers).listen(MODBUS_PORT);

/*
** Read sensordata from a RFXCOM module and publish the data as a Modbus/TCP server
*/
var FC = require('modbus-stack').FUNCTION_CODES;
var rfxcom = require('rfxcom');
//var rfxtrx = new rfxcom.RfxCom("/dev/tty.usbserial-A1WJDDBA", {debug: false});
var rfxtrx = new rfxcom.RfxCom("/dev/ttyUSB0", {debug: false});

/*
 * Check for debug argument
 */
var arg2 = process.argv[2];

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
var handlers = {};
var nbr_of_sensors=0;
var topic;
var debugflag=0;

/*
** Event: On Oregon Scientific temp and humidity sensor
*/
rfxtrx.on("th1", function (evt) {
   // Oregon Scientific sensors 
   //console.log("Event %s, %s", evt.subtype, evt.id); 
   //console.log("Temp: %s, Hum:%s", evt.temperature, evt.humidity);
   
   // Check arguments if debug
   if(arg2 == 'debug') {
	debugflag = 1;
   }
  
   /*
    * Check which sensor and fill input registers with data
    */
   switch(evt.id) {
   case "0xB301": 
   		input_register[0] = evt.temperature * 10;
   		input_register[1] = evt.humidity * 10;
   		if(debugflag==1) {console.log("Ute: temp = %s, hum = %s", input_register[0], input_register[1]);}
   break;
   case "0x6F02": 
   		input_register[2] = evt.temperature * 10;
		input_register[3] = evt.humidity * 10;
		if(debugflag==1) {console.log("Kaellare: temp = %s, hum = %s", input_register[2], input_register[3]);}
   break;
   case "0x5004": 
   		input_register[4] = evt.temperature * 10;
		input_register[5] = evt.humidity * 10;
		if(debugflag==1) {console.log("Vind: temp = %s, hum = %s", input_register[4], input_register[5]);}
   break;
   case "0x1A04": 
   		input_register[6] = evt.temperature * 10;
		input_register[7] = evt.humidity * 10;
		if(debugflag==1) {console.log("Inne: temp = %s, hum = %s", input_register[6], input_register[7]);}
   break;
   default:
	   if(debugflag==1) {console.log("Unknown sensor (%s) = %s", evt.id, evt.temperature);}
   }
   
});

/*
** Event: On Magnetic sensor (Proove)
*/
rfxtrx.on("lighting2", function (evt) {
   // Proove Magnetic switchs
  
   // Check arguments if debug
   if(arg2 == 'debug') {
        debugflag = 1;
   }
   if(debugflag) {console.log("Magnetic Switch: %s", evt.command);}

   if(evt.command === 'On') {
        input_register[20] = 1;
        input_register[21] = 1;
        
        /*
	** Hold value in this register for 1 minute to give time for a polling
	** modbus master to detect the value
	*/ 
        setTimeout(function () {
           input_register[21] = 0; 
        }, 60000);
   } else {
        input_register[20] = 0;
   }  
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

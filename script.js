
//##############################################################################################################//
//                                                                                                              //
//  created by Alexander Reeves                                                                                 //
//                                                                                                              //
//  free and open-source - licensed under CC Zero                                                               //
//                                                                                                              //
//  https://github.com/a-p-reeves/                                                                              //
//                                                                                                              //
//  method as outlined in:                                                                                      //
//  Chemical Engineering Design (6th Ed, SI Edition); Chapter 6 - Costing and Project Evaluation                //
//                                                                                                              //
//##############################################################################################################//

// currency format
const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: document.getElementById('inputCurrency').value,
  
    // These options are needed to round to whole numbers if that's what you want.
    //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
    //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
  });

//let addBtn = document.getElementById('addBtn');
let removeBtn = document.getElementById('removeBtn');
let table = document.getElementById('maintable');

let r = 0;          //row index
let ISBL = 0;       //isbl default value
let TFCC = 0;       //total fixed capital cost default value

// table data
var tableEquipmentLabel = [];                   // equipment name for each row  !!! Need to add in HTML !!!
var tableEquipmentType = [];                    // equipment type for each row
var tableQuantity = [];                         // quantity for each row
var tableCharacteristicValue = [];              // characteristic costing value for each row
var tableCharacteristicValueDesc = [];          // description and unit of each value
var tableMaterial = [];                         // material for each row
var tableEquipmentCost = [];                    // equipment cost for each row [calculated]
var tableInstalledEquipmentCost = [];           // installed equipment cost for each row [calculated]


function initialize() {
    //runs on page load

    document.getElementById('popup').innerHTML = '<style>.reset-popup{visibility: hidden;}</style>';

    //initializes table
    drawTable();

    //initializes custom equipment selector
    getDisplayCustomEquipment();

    //displays currency in table header
    getDisplayCurrency();
}

function reload() {
    /*var c = confirm("Do you really want to reload? All progress will be lost.");
        if(c === true)
        {
            index = this.parentElement.rowIndex;
            table1.deleteRow(index);
        }
    */
    document.getElementById('popup').innerHTML = '<style>.reset-popup{visibility: visible;}</style>';
    //window.location.reload()
}

function reloadcancel() {
    document.getElementById('popup').innerHTML = '<style>.reset-popup{visibility: hidden;}</style>';
}

function drawTable() {
    
    let i = 0;

    //removes all row elements from HTML
    while (document.getElementById('row') != undefined) {
        document.getElementById('row').remove();
    }

    // draws table new using all available data, calculates costs
    i = 0;
    while (i < tableEquipmentLabel.length) {
        
        //cost calculation for row i
        if(tableCharacteristicValue[i] != '-'){     //if no custom value specified
            tableEquipmentCost[i] = 
            //cost equation
            ( returnEquipmentData(tableEquipmentType[i],'a')+returnEquipmentData(tableEquipmentType[i],'b')*(tableCharacteristicValue[i])**returnEquipmentData(tableEquipmentType[i],'n') )
            //quantity
            *tableQuantity[i]
            //currency exchange
            *document.getElementById('inputExchangeRate').value
            //inflation (CEPCI)
            *(document.getElementById('inputCEPCI').value/509.7) //CEPCI for data is = 509.7 (USGC, 2007)
            //location factor
            *document.getElementById('inputLocFac').value
            ;

            //installed cost
            tableInstalledEquipmentCost[i] = calculateInstalledCost(i);
        }
        else {          //if custom value is specified
            tableEquipmentCost[i] = +(document.getElementById('inputCustomCost').value)*tableQuantity[i];
        }

        //special material cost for plate heat exchanger and reactor (base value as SS 304), as given in Towler & Sinnott table 6.6
        if(tableEquipmentType[i] == 'Plate and frame exchanger' || tableEquipmentType[i] == 'Jacketed, agitated' ){
            tableEquipmentCost[i] = tableEquipmentCost[i]/1.3;  //divide by SS 304 material factor
        }

        //displays row i 
        table.innerHTML += `
        <tr id="row" class="equipmentList">
        <td style="width:25px;">`+(i+1)+`</td>
        <td>`+tableEquipmentLabel[i]+`</td>
        <td>`+tableEquipmentType[i]+`</td>
        <td>`+tableQuantity[i]+`</td>
        <td>`+tableCharacteristicValue[i]+`</td>
        <td>`+tableMaterial[i]+`</td>
        <td>`+formatter.format(tableEquipmentCost[i].toFixed(2))+`</td>
        <td>`+formatter.format(tableInstalledEquipmentCost[i].toFixed(2))+`</td>
        <td><button onclick="deleteRow(`+(i+1)+`)">Delete</button></td>
        </tr>
        `
        i++
    }
    
    i = 0;
    // add empty space in table (10 rows by default)
    document.getElementById('placeholderTable').innerHTML = "";
    while (i < (5-tableEquipmentLabel.length)) {
        document.getElementById('placeholderTable').innerHTML += `<tr><td><div style="width:25px;">&nbsp;</div></td></tr>`;
        i++
    }

    //updates total cost calculator
    calculateTotalCosts()
}

var counter = 1;
function addRow() {
    
    // adds data to arrays
    if (document.getElementById('inputEquipmentName').value != 0) {
        tableEquipmentLabel.push(document.getElementById('inputEquipmentName').value);
    }
    else {
        tableEquipmentLabel.push('Equipment'.concat(counter));
        counter++
    }

    tableEquipmentType.push(document.getElementById('inputEquipmentType').value);

    if (document.getElementById('inputQuantity').value != 0) {
        tableQuantity.push(document.getElementById('inputQuantity').value);
    } 
    else {
        tableQuantity.push(1);
    }

    tableCharacteristicValue.push(document.getElementById('inputCharacteristicValue').value);

    tableMaterial.push(document.getElementById('inputMaterial').value); 

    //add placeholder zero to cost array, gets calculated in drawTable() as to update if other factors are changed
    tableEquipmentCost.push(tableEquipmentCost[0]);

    // warning if no value specified
    if (document.getElementById('inputCharacteristicValue').value == 0 || document.getElementById('inputEquipmentType').value == "select equipment") {
        if (document.getElementById('inputCharacteristicValue').value == 0) {
            //visual feedback;
            document.getElementById('inputCharacteristicValue').style.backgroundColor = "lightpink";
            setTimeout(function(){
                document.getElementById('inputCharacteristicValue').style.backgroundColor = "";
            }, 100);
        }
        if (document.getElementById('inputEquipmentType').value == "select equipment") {
            //visual feedback;
            document.getElementById('inputEquipmentType').style.backgroundColor = "lightpink";
            setTimeout(function(){
                document.getElementById('inputEquipmentType').style.backgroundColor = "";
            }, 100);
        }
        
        //removes last element from each array
        tableEquipmentLabel.pop();
        tableEquipmentType.pop();
        tableQuantity.pop();
        tableCharacteristicValue.pop();
        tableMaterial.pop();
        tableEquipmentCost.pop();
        counter--
    }
    
    //updates visually
    drawTable();
}

function addCustomRow() {
    // for custom input only
    
    // adds data to unused arrays
        if (document.getElementById('inputCustomEquipmentName').value != 0) {
            tableEquipmentLabel.push(document.getElementById('inputCustomEquipmentName').value);
        }
        else {
            tableEquipmentLabel.push('Equipment'.concat(counter));
            counter++
        }

        if (document.getElementById('inputCustomEquipmentType').value != 0) {
            tableEquipmentType.push(document.getElementById('inputCustomEquipmentType').value);
        }
        else {
            tableEquipmentType.push('Custom');
        }

        if (document.getElementById('inputCustomQuantity').value != 0) {
            tableQuantity.push(document.getElementById('inputCustomQuantity').value);
        } 
        else {
            tableQuantity.push(1);
        }

        tableCharacteristicValue.push('-');
    
        tableMaterial.push(document.getElementById('inputCustomMaterial').value);
    
        //add placeholder zero to cost array, gets calculated in drawTable() as to update if other factors are changed
        tableEquipmentCost.push(tableEquipmentCost[0]);
    
        // warning if no value specified
        if (document.getElementById('inputCustomCost').value == 0) {
            //visual feedback;
            document.getElementById('inputCustomCost').style.backgroundColor = "lightpink";
            setTimeout(function(){
                document.getElementById('inputCustomCost').style.backgroundColor = "";
            }, 100);
        
            //removes last element from each array
            tableEquipmentLabel.pop();
            tableEquipmentType.pop();
            tableQuantity.pop();
            tableCharacteristicValue.pop();
            tableMaterial.pop();
            tableEquipmentCost.pop();
            counter--
        };
        
        //updates visually
        drawTable();
}

function deleteRow(r) {

    //pop up; are you sure?
    var c = confirm("Are you sure you want to delete "+tableEquipmentLabel[(r-1)]+"?");
        if(c === true)
        {
            // deletes data from row r from arrays
            tableEquipmentLabel.splice((r-1), 1);
            tableEquipmentType.splice((r-1), 1);
            tableQuantity.splice((r-1), 1);
            tableCharacteristicValue.splice((r-1), 1);
            tableMaterial.splice((r-1), 1);
            tableEquipmentCost.splice((r-1), 1);

            // updates visually
            drawTable();
        }
}

function deleteAll() {
    var c = confirm("Are you sure you want to delete all items?");
        if(c === true)
        {
            //empty all arrays
            tableEquipmentLabel=[];
            tableEquipmentType=[];
            tableQuantity=[];
            tableCharacteristicValue=[];
            tableMaterial=[];
            tableEquipmentCost=[];
            counter = 1;

            // updates visually
            drawTable();
        }
}

function moveRowUp(r) {
    //take all values r out of table arrays
    //add them back at the next position to the left (up)

    // update visually
    drawTable();
}

function moveRowDown(r) {
    //take all values r out of table arrays
    //add them back at the next position to the right (down)

    //update visually
    drawTable();
}

function getDisplayValue() {
    //displays correct units for required input value
    document.getElementById('displayValue').innerHTML = returnEquipmentData(document.getElementById('inputEquipmentType').value,'valueUnit');
}

function getDisplayCurrency() {
    document.getElementById('currencyBox').innerHTML = document.getElementById('inputCurrency').value+", "+document.getElementById('inputCountry').value+" basis, CEPCI="+document.getElementById('inputCEPCI').value+".";
    document.getElementById('currencyBox0').innerHTML = document.getElementById('inputCurrency').value;
    document.getElementById('currencyBox1').innerHTML = document.getElementById('inputCurrency').value;
    document.getElementById('currencyBox2').innerHTML = document.getElementById('inputCurrency').value;
    document.getElementById('currencyBoxCustom').innerHTML = document.getElementById('inputCurrency').value;
}

function getDisplayCustomEquipment() {
    if (document.getElementById('inputCustomEquipment').checked == true){
        document.getElementById('regularEquipmentDiv').style = "display: none;";
        document.getElementById('customEquipmentDiv').style = "display: initial;";
    }
    else {
        document.getElementById('regularEquipmentDiv').style = "display: initial;";
        document.getElementById('customEquipmentDiv').style = "display: none;";
    }
}

function returnEquipmentData(equipmentString,dataString) {
    // equipmentString: value of selected equipment
    // dataString: data to be returned, can be "valueUnit","valueLower","valueUpper","a","b","n"; add "equipmentType" = Propeller, Centrifuge etc output
    
    //return valueUnits
        if (equipmentString == "select equipment"){
            return "Value";
        }
        //Agitators & Mixers
        if (equipmentString == "Propeller"){
            if (dataString == 'valueUnit')      {return "driver power, kW";}
            if (dataString == 'valueLower')     {return 5.0;}
            if (dataString == 'valueUpper')     {return 75;}
            if (dataString == 'a')              {return  15000;}
            if (dataString == 'b')              {return 990;}
            if (dataString == 'n')              {return 1.05;}
        }
        if (equipmentString == "Spiral ribbon mixer"){
            if (dataString == 'valueUnit') {return "driver power, kW";}
            if (dataString == 'valueLower') {return 5.0;}
            if (dataString == 'valueUpper') {return 35;}
            if (dataString == 'a') {return 27000;}
            if (dataString == 'b') {return 110;}
            if (dataString == 'n') {return 2.0;}
        }
        if (equipmentString == "Static mixer"){
            if (dataString == 'valueUnit') {return "Litres/s";}
            if (dataString == 'valueLower') {return 1.0;}
            if (dataString == 'valueUpper') {return 50;}
            if (dataString == 'a') {return 500;}
            if (dataString == 'b') {return 1030;}
            if (dataString == 'n') {return 0.4;}
        }
        if (equipmentString == "Packaged, 15-40 bar"){
            if (dataString == 'valueUnit') {return " kg/h steam";}
            if (dataString == 'valueLower') {return 5000;}
            if (dataString == 'valueUpper') {return 200000;}
            if (dataString == 'a') {return 106000;}
            if (dataString == 'b') {return 8.7;}
            if (dataString == 'n') {return 1.0;}
        }
        //boilers
        if (equipmentString == "Field erected, 10-70 bar"){
            if (dataString == 'valueUnit') {return "kg/h steam";}
            if (dataString == 'valueLower') {return 20000;}
            if (dataString == 'valueUpper') {return  800000;}
            if (dataString == 'a') {return 110000;}
            if (dataString == 'b') {return 45;}
            if (dataString == 'n') {return 0.9;}
        }
        //Centrifuges
        if (equipmentString == "High speed disk"){
            if (dataString == 'valueUnit') {return "diameter, m";}
            if (dataString == 'valueLower') {return 0.26;}
            if (dataString == 'valueUpper') {return  0.49;}
            if (dataString == 'a') {return 50000;}
            if (dataString == 'b') {return 423000;}
            if (dataString == 'n') {return 0.7;}
        }
        if (equipmentString == "Atmospheric suspended basket"){
            if (dataString == 'valueUnit') {return "power, kW";}
            if (dataString == 'valueLower') {return 2.0;}
            if (dataString == 'valueUpper') {return 20;}
            if (dataString == 'a') {return 57000;}
            if (dataString == 'b') {return 660;}
            if (dataString == 'n') {return 1.5;}
        }
        //compressors
        if (equipmentString == "Blower"){
            if (dataString == 'valueUnit') {return "m3/h";}
            if (dataString == 'valueLower') {return 200;}
            if (dataString == 'valueUpper') {return 5000;}
            if (dataString == 'a') {return 3800;}
            if (dataString == 'b') {return 49;}
            if (dataString == 'n') {return 0.8;}
        }
        if (equipmentString == "Centrifugal"){
            if (dataString == 'valueUnit') {return "driver power, kW";}
            if (dataString == 'valueLower') {return 75;}
            if (dataString == 'valueUpper') {return 30000;}
            if (dataString == 'a') {return 490000;}
            if (dataString == 'b') {return 16800;}
            if (dataString == 'n') {return 0.6;}
        }
        if (equipmentString == "Reciprocating"){
            if (dataString == 'valueUnit') {return "driver power, kW";}
            if (dataString == 'valueLower') {return 93;}
            if (dataString == 'valueUpper') {return 16800;}
            if (dataString == 'a') {return 220000;}
            if (dataString == 'b') {return 2300;}
            if (dataString == 'n') {return 0.75;}
        }
        //conveyors
        if (equipmentString == "Belt, 0.5m wide"){
            if (dataString == 'valueUnit') {return "length, m";}
            if (dataString == 'valueLower') {return 10;}
            if (dataString == 'valueUpper') {return 500;}
            if (dataString == 'a') {return 36000;}
            if (dataString == 'b') {return 640;}
            if (dataString == 'n') {return 1.0;}
        }
        if (equipmentString == "Belt, 1m wide"){
            if (dataString == 'valueUnit') {return "length, m";}
            if (dataString == 'valueLower') {return 10;}
            if (dataString == 'valueUpper') {return 500;}
            if (dataString == 'a') {return 40000;}
            if (dataString == 'b') {return 1160;}
            if (dataString == 'n') {return 1.0;}
        }
        if (equipmentString == "Bucket elevator, 0.5m bucket"){
            if (dataString == 'valueUnit') {return "length, m";}
            if (dataString == 'valueLower') {return 10;}
            if (dataString == 'valueUpper') {return 30;}
            if (dataString == 'a') {return 15000;}
            if (dataString == 'b') {return 2300;}
            if (dataString == 'n') {return 1.0;}
        }
        //Crushers
        if (equipmentString == "Reversible hammer mill"){
            if (dataString == 'valueUnit') {return "t/h";}
            if (dataString == 'valueLower') {return 30;}
            if (dataString == 'valueUpper') {return  400;}
            if (dataString == 'a') {return 60000;}
            if (dataString == 'b') {return 640;}
            if (dataString == 'n') {return 1.0;}
        }
        if (equipmentString == "Pulverisers"){
            if (dataString == 'valueUnit') {return "kg/h";}
            if (dataString == 'valueLower') {return 200;}
            if (dataString == 'valueUpper') {return 4000;}
            if (dataString == 'a') {return 14000;}
            if (dataString == 'b') {return 590;}
            if (dataString == 'n') {return 0.5;}
        }
        //Crystiallizer
        if (equipmentString == "Scraped surface crystallizer"){
            if (dataString == 'valueUnit') {return "length, m";}
            if (dataString == 'valueLower') {return 7;}
            if (dataString == 'valueUpper') {return 280;}
            if (dataString == 'a') {return 8400;}
            if (dataString == 'b') {return 11300;}
            if (dataString == 'n') {return 0.8;}
        }
        //Dryers
        if (equipmentString == "Direct contact Rotary"){
            if (dataString == 'valueUnit') {return "area, m2";}
            if (dataString == 'valueLower') {return 11;}
            if (dataString == 'valueUpper') {return 180;}
            if (dataString == 'a') {return 13000;}
            if (dataString == 'b') {return 9100;}
            if (dataString == 'n') {return 0.9;}
        }
        if (equipmentString == "Atmospheric tray batch"){
            if (dataString == 'valueUnit') {return "area, m2";}
            if (dataString == 'valueLower') {return 3.0;}
            if (dataString == 'valueUpper') {return 20;}
            if (dataString == 'a') {return 8700;}
            if (dataString == 'b') {return 6800;}
            if (dataString == 'n') {return 0.5;}
        }
        if (equipmentString == "Spray dryer"){
            if (dataString == 'valueUnit') {return "evap rate kg/h";}
            if (dataString == 'valueLower') {return 400;}
            if (dataString == 'valueUpper') {return 4000;}
            if (dataString == 'a') {return 350000;}
            if (dataString == 'b') {return 1900;}
            if (dataString == 'n') {return 0.7;}
        }
        //evaporators
        if (equipmentString == "Vertical tube"){
            if (dataString == 'valueUnit') {return "area, m2";}
            if (dataString == 'valueLower') {return 11;}
            if (dataString == 'valueUpper') {return 640;}
            if (dataString == 'a') {return 280;}
            if (dataString == 'b') {return 30500;}
            if (dataString == 'n') {return 0.55;}
        }
        if (equipmentString == "Vertical tube"){
            if (dataString == 'valueUnit') {
                return "area, m2";
            }
            if (dataString == 'valueLower') {
                return 0.5;
            }
            if (dataString == 'valueUpper') {
                return 12;
            }
            if (dataString == 'a') {
                return 75000;
            }
            if (dataString == 'b') {
                return 56000;
            }
            if (dataString == 'n') {
                return 0.75;
            }
        }
        if (equipmentString == "Agitated Falling film"){
            if (dataString == 'valueUnit') {
                return "area, m2";
            }
            if (dataString == 'valueLower') {
                return 0.5;
            }
            if (dataString == 'valueUpper') {
                return 12;
            }
            if (dataString == 'a') {
                return 75000;
            }
            if (dataString == 'b') {
                return 56000;
            }
            if (dataString == 'n') {
                return 0.75;
            }
        }
        //Exchangers
        if (equipmentString == "U-tube shell and tube"){
            if (dataString == 'valueUnit') {
                return "area, m2";
            }
            if (dataString == 'valueLower') {
                return 10;
            }
            if (dataString == 'valueUpper') {
                return 1000;
            }
            if (dataString == 'a') {
                return 24000;
            }
            if (dataString == 'b') {
                return 46;
            }
            if (dataString == 'n') {
                return 1.2;
            }
        }
        if (equipmentString == "Double pipe"){
            if (dataString == 'valueUnit') {
                return "area, m2";
            }
            if (dataString == 'valueLower') {
                return 1;
            }
            if (dataString == 'valueUpper') {
                return 80;
            }
            if (dataString == 'a') {
                return 1600;
            }
            if (dataString == 'b') {
                return 2100;
            }
            if (dataString == 'n') {
                return 1;
            }
        }
        if (equipmentString == "Thermosyphon reboiler"){
            if (dataString == 'valueUnit') {
                return "area, m2";
            }
            if (dataString == 'valueLower') {
                return 10;
            }
            if (dataString == 'valueUpper') {
                return  500;
            }
            if (dataString == 'a') {
                return 2600;
            }
            if (dataString == 'b') {
                return 104;
            }
            if (dataString == 'n') {
                return 1.1;
            }
        }
        if (equipmentString == "U-tube Kettle reboiler"){
            if (dataString == 'valueUnit') {
                return "area, m2";
            }
            if (dataString == 'valueLower') {
                return 10;
            }
            if (dataString == 'valueUpper') {
                return 500;
            }
            if (dataString == 'a') {
                return 2500;
            }
            if (dataString == 'b') {
                return 340;
            }
            if (dataString == 'n') {
                return 0.9;
            }
        }
        if (equipmentString == "Plate and frame exchanger"){
            if (dataString == 'valueUnit') {
                return "area, m2";
            }
            if (dataString == 'valueLower') {
                return 1;
            }
            if (dataString == 'valueUpper') {
                return 500;
            }
            if (dataString == 'a') {
                return 1350;
            }
            if (dataString == 'b') {
                return 180;
            }
            if (dataString == 'n') {
                return 0.95;
            }
        }
        //filters
        if (equipmentString == "Plate and frame filter"){
            if (dataString == 'valueUnit') {
                return "capacity, m3";
            }
            if (dataString == 'valueLower') {
                return 0.4;
            }
            if (dataString == 'valueUpper') {
                return 1.4;
            }
            if (dataString == 'a') {
                return 110000;
            }
            if (dataString == 'b') {
                return  77000;
            }
            if (dataString == 'n') {
                return 0.5;
            }
        }
        if (equipmentString == "Vacuum drum"){
            if (dataString == 'valueUnit') {
                return "area, m2";
            }
            if (dataString == 'valueLower') {
                return 10;
            }
            if (dataString == 'valueUpper') {
                return 180;
            }
            if (dataString == 'a') {
                return -63000;
            }
            if (dataString == 'b') {
                return 80000;
            }
            if (dataString == 'n') {
                return 0.3;
            }
        }
        //furnaces
        if (equipmentString == "Cylindrical"){
            if (dataString == 'valueUnit') {
                return "duty, MW";
            }
            if (dataString == 'valueLower') {
                return 0.2;
            }
            if (dataString == 'valueUpper') {
                return 60;
            }
            if (dataString == 'a') {
                return 68500;
            }
            if (dataString == 'b') {
                return 93000;
            }
            if (dataString == 'n') {
                return 0.8;
            }
        }
        if (equipmentString == "Box"){
            if (dataString == 'valueUnit') {
                return "duty, MW";
            }
            if (dataString == 'valueLower') {
                return 30;
            }
            if (dataString == 'valueUpper') {
                return 120;
            }
            if (dataString == 'a') {
                return 37000;
            }
            if (dataString == 'b') {
                return 95000;
            }
            if (dataString == 'n') {
                return 0.8;
            }
        }
        //packing
        if (equipmentString == "304 ss Raschig rings"){
            if (dataString == 'valueUnit') {
                return "m3";
            }
            if (dataString == 'valueLower') {
                return 0;
            }
            if (dataString == 'valueUpper') {
                return Infinity;
            }
            if (dataString == 'a') {
                return 0;
            }
            if (dataString == 'b') {
                return 7300;
            }
            if (dataString == 'n') {
                return 1;
            }
        }
        if (equipmentString == "Ceramic intalox saddles"){
            if (dataString == 'valueUnit') {
                return "m3";
            }
            if (dataString == 'valueLower') {
                return 0;
            }
            if (dataString == 'valueUpper') {
                return Infinity;
            }
            if (dataString == 'a') {
                return 0;
            }
            if (dataString == 'b') {
                return 1800;
            }
            if (dataString == 'n') {
                return 1;
            }
        }
        if (equipmentString == "304 ss Pall rings"){
            if (dataString == 'valueUnit') {
                return "m3";
            }
            if (dataString == 'valueLower') {
                return 0;
            }
            if (dataString == 'valueUpper') {
                return Infinity;
            }
            if (dataString == 'a') {
                return 0;
            }
            if (dataString == 'b') {
                return 7700;
            }
            if (dataString == 'n') {
                return 1;
            }
        }
        if (equipmentString == "PVC structured packing"){
            if (dataString == 'valueUnit') {
                return "m3";
            }
            if (dataString == 'valueLower') {
                return 0;
            }
            if (dataString == 'valueUpper') {
                return Infinity;
            }
            if (dataString == 'a') {
                return 0;
            }
            if (dataString == 'b') {
                return 500;
            }
            if (dataString == 'n') {
                return 1;
            }
        }
        if (equipmentString == "304 ss structured packing"){
            if (dataString == 'valueUnit') {
                return "m3";
            }
            if (dataString == 'valueLower') {
                return 0;
            }
            if (dataString == 'valueUpper') {
                return Infinity;
            }
            if (dataString == 'a') {
                return 0;
            }
            if (dataString == 'b') {
                return 6900;
            }
            if (dataString == 'n') {
                return 1;
            }
        }
        //pressure vessels
        if (equipmentString == "Vertical, cs"){
            if (dataString == 'valueUnit') {
                return "shell mass, kg";
            }
            if (dataString == 'valueLower') {
                return 160;
            }
            if (dataString == 'valueUpper') {
                return 250000;
            }
            if (dataString == 'a') {
                return 10000;
            }
            if (dataString == 'b') {
                return 29;
            }
            if (dataString == 'n') {
                return 0.85;
            }
        }
        if (equipmentString == "Horizontal, cs"){
            if (dataString == 'valueUnit') {
                return "shell mass, kg";
            }
            if (dataString == 'valueLower') {
                return 160;
            }
            if (dataString == 'valueUpper') {
                return 50000;
            }
            if (dataString == 'a') {
                return 8800;
            }
            if (dataString == 'b') {
                return 27;
            }
            if (dataString == 'n') {
                return 0.85;
            }
        }
        if (equipmentString == "Vertical, 304 ss"){
            if (dataString == 'valueUnit') {
                return "shell mass, kg";
            }
            if (dataString == 'valueLower') {
                return 120;
            }
            if (dataString == 'valueUpper') {
                return 250000;
            }
            if (dataString == 'a') {
                return 15000;
            }
            if (dataString == 'b') {
                return 68;
            }
            if (dataString == 'n') {
                return 0.85;
            }
        }
        if (equipmentString == "Horizontal, 304 ss"){
            if (dataString == 'valueUnit') {
                return "shell mass, kg";
            }
            if (dataString == 'valueLower') {
                return 120;
            }
            if (dataString == 'valueUpper') {
                return 50000;
            }
            if (dataString == 'a') {
                return 11000;
            }
            if (dataString == 'b') {
                return 63;
            }
            if (dataString == 'n') {
                return 0.85;
            }
        }
        //pumps and drivers
        if (equipmentString == "Single stage centrifugal"){
            if (dataString == 'valueUnit') {
                return "flow Litres/s";
            }
            if (dataString == 'valueLower') {
                return 0.2;
            }
            if (dataString == 'valueUpper') {
                return 126;
            }
            if (dataString == 'a') {
                return 6900;
            }
            if (dataString == 'b') {
                return 206;
            }
            if (dataString == 'n') {
                return 0.9;
            }
        }
        if (equipmentString == "Explosion proof motor"){
            if (dataString == 'valueUnit') {
                return "power, kW";
            }
            if (dataString == 'valueLower') {
                return 1.0;
            }
            if (dataString == 'valueUpper') {
                return 2500;
            }
            if (dataString == 'a') {
                return -950;
            }
            if (dataString == 'b') {
                return 1770;
            }
            if (dataString == 'n') {
                return 0.6;
            }
        }
        if (equipmentString == "Condensing steam turbine"){
            if (dataString == 'valueUnit') {
                return "power, kW";
            }
            if (dataString == 'valueLower') {
                return 100;
            }
            if (dataString == 'valueUpper') {
                return 20000;
            }
            if (dataString == 'a') {
                return -12000;
            }
            if (dataString == 'b') {
                return 1630;
            }
            if (dataString == 'n') {
                return  0.75;
            }
        }
        //reactors
        if (equipmentString == "Jacketed, agitated"){
            if (dataString == 'valueUnit') {
                return "volume, m3";
            }
            if (dataString == 'valueLower') {
                return 0.5;
            }
            if (dataString == 'valueUpper') {
                return 100;
            }
            if (dataString == 'a') {
                return 53000;
            }
            if (dataString == 'b') {
                return 28000;
            }
            if (dataString == 'n') {
                return 0.8;
            }
        }
        if (equipmentString == "Jacketed, agitated, glass lined"){
            if (dataString == 'valueUnit') {
                return "volume, m3";
            }
            if (dataString == 'valueLower') {
                return 0.5;
            }
            if (dataString == 'valueUpper') {
                return 25;
            }
            if (dataString == 'a') {
                return 11000;
            }
            if (dataString == 'b') {
                return 76000;
            }
            if (dataString == 'n') {
                return 0.4;
            }
        }
        //tanks
        if (equipmentString == "Floating roof"){
            if (dataString == 'valueUnit') {
                return "capacity, m3";
            }
            if (dataString == 'valueLower') {
                return 100;
            }
            if (dataString == 'valueUpper') {
                return 10000;
            }
            if (dataString == 'a') {
                return 97000;
            }
            if (dataString == 'b') {
                return 2800;
            }
            if (dataString == 'n') {
                return 0.65;
            }
        }
        if (equipmentString == "Cone roof"){
            if (dataString == 'valueUnit') {
                return "capacity, m3";
            }
            if (dataString == 'valueLower') {
                return 10;
            }
            if (dataString == 'valueUpper') {
                return 4000;
            }
            if (dataString == 'a') {
                return 5000;
            }
            if (dataString == 'b') {
                return 1400;
            }
            if (dataString == 'n') {
                return 0.7;
            }
        }
        //trays
        if (equipmentString == "Sieve trays"){
            if (dataString == 'valueUnit') {
                return "diameter, m";
            }
            if (dataString == 'valueLower') {
                return 0.5;
            }
            if (dataString == 'valueUpper') {
                return 5.0;
            }
            if (dataString == 'a') {
                return 110;
            }
            if (dataString == 'b') {
                return 380;
            }
            if (dataString == 'n') {
                return 1.8;
            }
        }
        if (equipmentString == "Valve trays"){
            if (dataString == 'valueUnit') {
                return "diameter, m";
            }
            if (dataString == 'valueLower') {
                return 0.5;
            }
            if (dataString == 'valueUpper') {
                return 5.0;
            }
            if (dataString == 'a') {
                return 180;
            }
            if (dataString == 'b') {
                return 340;
            }
            if (dataString == 'n') {
                return 1.9;
            }
        }
        if (equipmentString == "Bubble cap trays"){
            if (dataString == 'valueUnit') {
                return "diameter, m";
            }
            if (dataString == 'valueLower') {
                return 0.5;
            }
            if (dataString == 'valueUpper') {
                return 5.0;
            }
            if (dataString == 'a') {
                return 290;
            }
            if (dataString == 'b') {
                return 550;
            }
            if (dataString == 'n') {
                return 1.9;
            }
        }
        //utilities
        if (equipmentString == "Cooling tower & pumps"){
            if (dataString == 'valueUnit') {
                return "flow Litres/s";
            }
            if (dataString == 'valueLower') {
                return 100;
            }
            if (dataString == 'valueUpper') {
                return 10000;
            }
            if (dataString == 'a') {
                return 150000;
            }
            if (dataString == 'b') {
                return 1300;
            }
            if (dataString == 'n') {
                return 0.9;
            }
        }
        if (equipmentString == "Packaged mechanical refrigerator"){
            if (dataString == 'valueUnit') {
                return "evaporator duty, kW";
            }
            if (dataString == 'valueLower') {
                return 50;
            }
            if (dataString == 'valueUpper') {
                return 1500;
            }
            if (dataString == 'a') {
                return 21000;
            }
            if (dataString == 'b') {
                return 3100;
            }
            if (dataString == 'n') {
                return 0.9;
            }
        }
        if (equipmentString == "Water ion exchange plant"){
            if (dataString == 'valueUnit') {
                return "flow m3/h";
            }
            if (dataString == 'valueLower') {
                return 1;
            }
            if (dataString == 'valueUpper') {
                return 50;
            }
            if (dataString == 'a') {
                return 12000;
            }
            if (dataString == 'b') {
                return 5400;
            }
            if (dataString == 'n') {
                return 0.75;
            }
        }
}

function returnMaterialFactor(materialString) {
    if(materialString == "Carbon Steel")    {return 1;}
    if(materialString == "Aluminium")       {return 1.07;}
    if(materialString == "Bronze")          {return 1.07;}
    if(materialString == "Cast Steel")      {return 1.1;}
    if(materialString == "SS 304")          {return 1.3;}
    if(materialString == "SS 316")          {return 1.3;}
    if(materialString == "SS 321")          {return 1.5;}
    if(materialString == "Hastelloy C")     {return 1.55;}
    if(materialString == "Monel")           {return 1.65;}
    if(materialString == "Nickel")          {return 1.7;}
    if(materialString == "Inconel")         {return 1.7;}
    else {return 1;}
}

function calculateInstalledCost(i) {
    //adding detailed factors for process type (Table 6.4)
    if (document.getElementById('inputProcessType').value == 'fluid'){
        tableInstalledEquipmentCost[i] = tableEquipmentCost[i]*((1+0.8)*returnMaterialFactor(tableMaterial[i])+(2.5)); 
    }
    if (document.getElementById('inputProcessType').value == 'fluidsolid'){
        tableInstalledEquipmentCost[i] = tableEquipmentCost[i]*((1+0.6)*returnMaterialFactor(tableMaterial[i])+(2.6)); 
    }
    if (document.getElementById('inputProcessType').value == 'solid'){
        tableInstalledEquipmentCost[i] = tableEquipmentCost[i]*((1+0.2)*returnMaterialFactor(tableMaterial[i])+(2.3));  
    }
    return tableInstalledEquipmentCost[i];
}

function calculateTotalCosts() {
    i = 0;
    ISBL = 0;
    costOfEquipment = 0;


    //sum table items to get ISBL
    while (i < tableEquipmentLabel.length) {
        costOfEquipment = costOfEquipment + tableInstalledEquipmentCost[i];
        i++
    }

    //output total cost of equipment 
    //document.getElementById('outputCe').innerHTML = '<input value="'+costOfEquipment.toFixed(2)+'" style="padding-left: 3px; width: 150px; color:black; border: 1px;" disabled/>';

    ISBL = costOfEquipment;
    //adding detailed factors for process type (Table 6.4)
    if (document.getElementById('inputProcessType').value == 'fluid'){
        document.getElementById('outputISBLfact').innerHTML = '<input value="'+3.3+'" style="padding-left: 3px; width: 150px; color:black; border: 1px;" disabled/>';
    }
    if (document.getElementById('inputProcessType').value == 'fluidsolid'){
        document.getElementById('outputISBLfact').innerHTML = '<input value="'+3.2+'" style="padding-left: 3px; width: 150px; color:black; border: 1px;" disabled/>';
    }
    if (document.getElementById('inputProcessType').value == 'solid'){
        document.getElementById('outputISBLfact').innerHTML = '<input value="'+2.5+'" style="padding-left: 3px; width: 150px; color:black; border: 1px;" disabled/>';
    }

    document.getElementById('outputISBL').innerHTML = '<input value="'+formatter.format(ISBL.toFixed(2))+'" style="padding-left: 3px; width: 150px; color:black; border: 1px;" disabled/>';

    //Total Fixed Capital Cost = ISBL + OSBL
    TFCC = ISBL*( 1 + (+document.getElementById('inputOS').value) )*( 1 + (+document.getElementById('inputDnE').value) + (+document.getElementById('inputX').value) );
    
    document.getElementById('outputTFCC').innerHTML = '<input value="'+formatter.format(TFCC.toFixed(2))+'" style="padding-left: 3px; width: 150px; color:black; border: 1px; background-color: lightblue;" disabled/>';
}
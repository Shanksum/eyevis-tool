var selectedCsvArray = [];
var gazeArray = [];
var xyDurationArray = [];
var rawMouseArray = [];
var reducedMouseArray = [];
var allUserIds = [];
var colors = [];

let timeStart = 0;
let timeEnd = 100;

//Visualization selection listener

/*$(function() {
    $('#selectVis').change();
});*/

$('#selectVis').on('change', function () {
    window.current.vis = $(this).val();
    $('#visualizationsCanvas').show();
    $('[class$="Options"]').hide();
    let limit = true;
    switch (window.current.vis) {
        case "heatmap":
            $('.heatOptions').show();
            limit = false;
            break;
        case "scanpath":
            $('.scanpathOptions').show();
            limit = false;
            break;
        case "mousedata":
            $('.scanpathOptions').show();
            limit = false;
            break;
        case "harmonicHeatmap":
            $('.heatOptions').show();
            $('.harmonicOptions').show();
            limit = false;
            break;
        case "clusters":
            $('.clusterOptions').show();
            limit = false;
            break;
        case "3d":
            $('#visualizationsCanvas').hide();
            if (window.clientConfigs.limit >= window.current.active_users.length) {
                limit = false;
            }
            break;
        default:
            break;
    }
    if (!limit) {
        applyFilter();
    }
    else {
        alert("Calculation might be very time intensive. The scanpath visualization limit is currently set on " + window.clientConfigs.limit + ". To unlock the limit, please set this value to -1. To start the visualization, please click the Reload button.");
    }
});


/*$('#userTable th').on('click', function () {
    let elem = '#' + $(this).data('filter');
    $(elem).toggle();
});*/

$('.table-filter select').on('change', function () {
    applyFilter();
});

// special case for age
$('.table-filter input').on('change', function () {
    applyFilter();
});

function applyFilter() {
    let filters = [];
    $('.table-filter select').each( function () {
        filters.push([$(this).data('feature'), $(this).val()]);
    });
    let youngest = +$('#selectAgeYoungest').val();
    let oldest = +$('#selectAgeOldest').val();
    $('#userTableBody tr').each( function () {
        let inp = $(this).find('input');
        inp.prop('checked', true);
        for (let f in filters) {
            let feature = filters[f][0];
            let val = filters[f][1];
            if (val !== 'all') {
                if ($(this).find('td[data-feature=' + feature + ']').html() !== val) {
                    inp.prop('checked', false);
                }
            }
        }
        let age = +$(this).find('td[data-feature=age]').html();
        if (age < youngest || age > oldest) {
            inp.prop('checked', false);
        }
    });
    handleSingleSelect(); //takes care of (un)checking the select all button of the User Table
    removeFilteredUsers();
}

function openDownloadForm() {
    $('#downloadForm').show();
    $('#downloadBtn').hide(); //optional
}

function closeDownloadForm() {
  $('#downloadForm').hide();
  $('#downloadBtn').show();
}

function downloadPicture() {
  let downloadCanvas;
  let type = $('#downloadType').val();

  downloadCanvas=document.getElementById('visualizationsCanvas');
  //image = downloadCanvas.toDataURL("image/"+ type).replace("image/"+ type , "image/octet-stream");
  downloadCanvas.toBlob(function(blob) {
    var link = document.createElement('a');
    link.download = $('#downloadName').val()+"."+type;
    link.href = window.URL.createObjectURL(blob);
    link.dispatchEvent(new MouseEvent(`click`, {bubbles: true, cancelable: true, view: window})); } , "image/"+ type);

}

function createNewCanvas() {
    var canvas = document.createElement('canvas');
    canvas.id = "visualizationsCanvas";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    var parent = document.getElementById("visualizationsCanvasDiv");
    parent.appendChild(canvas);
}

function removeFilteredUsers() {
    // TODO: implement checkDataStructure()

    selectedCsvArray = [...window.current.gazeArray];
    rawMouseArray = [...window.current.mouseArray];

    //we need to know our timeInterval before we filter users
    let timeIntervalGaze = calculateTimeInterval(selectedCsvArray);
    let timeIntervalMouse = calculateTimeInterval(rawMouseArray);

    var userIDsStud = [];
    $('#userTableBody input:checked').each(function (index) {
        userIDsStud.push($(this).data('user'));
    });

    selectedCsvArray = selectedCsvArray.filter(d => userIDsStud.includes(parseInt(d.user_id)));
    rawMouseArray = rawMouseArray.filter(d => userIDsStud.includes(parseInt(d.user_id)));

    //Important to switch between 2D/3D canvas before clusterOptics() because it uses 2d cluster
    var existingCanvas = document.getElementById('visualizationsCanvas');
    if (!!existingCanvas){
      existingCanvas.parentNode.removeChild(existingCanvas);
      createNewCanvas();
    } else {
      createNewCanvas();
    }

    createGazeArray(selectedCsvArray, timeIntervalGaze);
    createMouseArray(rawMouseArray, timeIntervalMouse);
    //clusterOPTICS(gazeArray, xyDurationArray);

    //Switch Case to start the selected Visualization:
    //To add your Visualization, simply add the Option to the dropdown in index.html
    //and add a new case to start the function

    switch (window.current.vis) {
        case "scanpath":
            loadScanpath(xyDurationArray, allUserIds);
            break;
        case "mousedata":
            loadScanpath(reducedMouseArray, allUserIds, true);
            break;
        case "heatmap":
            displayClicksHeatmap(xyDurationArray, reducedMouseArray);
            break;
        case "harmonicHeatmap":
            harmonicMapN(xyDurationArray);
            break;
        case "clusters":
//            clusterOPTICS(gazeArray, xyDurationArray);
        	  calculateClusters(gazeArray, xyDurationArray);
            break;
        case "3d":
            load_3d(xyDurationArray, allUserIds);
            break;
        default:
            break;
    }
}

//this function fills the "clusteredArray" with the centers of a cluster and the meanduration, so that it can be forwarded to a visualization
//it shall only be called after "clusterOPTICS(gazeArray, xyDurationArray);"
function fillClusteredArray() {
    let clusteredArray = [];
    let dataLength = clustercenters.length;
    for (i = 0; i < dataLength; i++) {
        currentCluster = clustercenters[i];
        duration = meandurations[i];
        clusteredArray.push([parseInt(currentCluster[0]), parseInt(currentCluster[1]), duration]);
    }
    return clusteredArray;
}

//This function extracts the fixation from all the users that
//remained after the filtering from the selected csv(from the dropdown menu) and puts
//them in a new array, which shall then be given to the clustering or visualization-method.
function createGazeArray(data, timeInterval) {
    gazeArray = [];
    //This array also has a duration column.
    xyDurationArray = [];
    var dataLength = data.length;
    for (i = 0; i < dataLength; i++) {
        currentGazeEntry = data[i];
        if (parseInt(currentGazeEntry.timestamp) >= timeInterval.start &&
            parseInt(currentGazeEntry.timestamp) <= timeInterval.end &&
            parseInt(currentGazeEntry.duration) > 0) {
            gazeArray.push([parseInt(currentGazeEntry.x), parseInt(currentGazeEntry.y)]);
            xyDurationArray.push([parseInt(currentGazeEntry.x), parseInt(currentGazeEntry.y), parseInt(currentGazeEntry.duration), parseInt(currentGazeEntry.user_id), parseInt(currentGazeEntry.timestamp)]);
        }
    }
}

function createMouseArray(data, timeInterval) {
    reducedMouseArray = [];
    var dataLength = data.length;
    for (i = 0; i < dataLength; i++) {
        currentMouse = data[i];
        if (parseInt(currentMouse.timestamp) >= timeInterval.start && parseInt(currentMouse.timestamp) <= timeInterval.end) {
            reducedMouseArray.push([parseInt(currentMouse.x), parseInt(currentMouse.y), currentMouse.type, parseInt(currentMouse.user_id), parseInt(currentMouse.timestamp)]);
        }
    }
}


function getTimestamps(data) {
    return data.map(d => parseInt(d.timestamp))
}

function calculateTimeInterval(data) {
    let maxTimestamp = Math.max(...getTimestamps(data));
    return {start: (timeStart * maxTimestamp / 100), end: (timeEnd * maxTimestamp / 100)};
}

$("#time_slider").slider({
    min: 0,
    max: 100,
    values: [0, 50, 100],

    slide: function (event, ui) {
        let values = $("#time_slider").slider("option", "values");
        // check what handle is used and change other values accordingly or stop it from getting moved if needed
        if (ui.handleIndex === 1) {
            let change = (ui.value - values[1]);
            if ((change + values[0]) >= 0 && (change + values[2]) <= 100) {
                values[0] = change + values[0];
                values[2] = change + values[2];
                values[1] = ui.value;
            } else {
                event.preventDefault();
            }
        } else if (ui.handleIndex === 0 && ui.value < values[2]) {
            values[0] = ui.value;
            values[1] = ((values[0] + values[2]) / 2);
        } else if (ui.handleIndex === 2 && ui.value > values[0]) {
            values[2] = ui.value;
            values[1] = ((values[0] + values[2]) / 2);
        } else {
            event.preventDefault();
        }

        $("#time_slider").slider("option", "values", values);
        $("input#first").val($("#time_slider").slider("values", 0));
        $("input#third").val($("#time_slider").slider("values", 2));
    },

    stop: function (event, ui) {
        timeStart = $("#time_slider").slider("values", 0);
        timeEnd = $("#time_slider").slider("values", 2);
        removeFilteredUsers();
    }
});

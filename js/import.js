// Methods for importing files and displaying their content.

$(document).ready(function () {
    if (isAPIAvailable()) {
        $('#inputGroupFile').bind('change', handleFileSelect);
        $('#inputGroupFile-image').bind('change', handleFileImageSelect);
    }
});

function isAPIAvailable() {
    // Check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        // Great success! All the File APIs are supported.
        return true;
    } else {
        // source: File API availability - http://caniuse.com/#feat=fileapi
        // source: <output> availability - http://html5doctor.com/the-output-element/
        document.writeln('The HTML5 APIs used in this form are only available in the following browsers:<br />');
        // 6.0 File API & 13.0 <output>
        document.writeln(' - Google Chrome: 13.0 or later<br />');
        // 3.6 File API & 6.0 <output>
        document.writeln(' - Mozilla Firefox: 6.0 or later<br />');
        // 10.0 File API & 10.0 <output>
        document.writeln(' - Internet Explorer: Not supported (partial support expected in 10.0)<br />');
        // ? File API & 5.1 <output>
        document.writeln(' - Safari: Not supported<br />');
        // ? File API & 9.2 <output>
        document.writeln(' - Opera: Not supported');
        return false;
    }
}

function loadDemoData(){
  var output = '';
  var files = ["executed_studies.csv", "gaze.csv", "metadata.csv", "mouse.csv"]
  for (var idx = 0; idx < files.length; idx++) {
    var file = files[idx];
    output += '<span style="font-weight:bold;">' + escape(file) + '</span><br />\n';
    output += ' - FileType: ' + 'n/a' + '<br />\n';
    output += ' - FileSize: ' + 'n/a' + ' bytes<br />\n';
    output += ' - LastModified: ' + 'n/a' + '<br />\n';
    $.ajax({
      type: "GET",
      url: "csv/"+file,
      dataType: "text",
      success: function(data) {
        data = $.csv.toArrays(data);
        parsed_data = parseDataStructure(data);
        window.importedFiles[file] = parsed_data;
        if (file.startsWith("gaze")) {
          var $selectCSV = $("#selectCSV");
          $selectCSV.append($("<option />").text(file));
        }
      },
      error: function(data) {
        console.log("Error");
        console.log(data)
      },
      async: false
    });
  }
  $('#file_list').append(output);
  
  makeDataStructure();
  for (let key in window.dataStructure.metadata) {
    for (let lkey in window.dataStructure.metadata[key]) {
      for(let llkey in window.dataStructure.metadata[key][lkey]){
        var label = window.dataStructure.metadata[key][lkey][llkey].label;
        if (label){
      		window.dataStructure.images["img_"+label+".jpg"] = "image/examples/img_"+window.dataStructure.metadata[key][lkey][llkey].label+".jpg"
        }
      }
    }
  }
  fillSelect('study');  
}

function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object
    // read the file metadata
    var output = '';
    for (var index = 0; index < files.length; index++) {
        var file = files[index];
        output += '<span style="font-weight:bold;">' + escape(file.name) + '</span><br />\n';
        output += ' - FileType: ' + (file.type || 'n/a') + '<br />\n';
        output += ' - FileSize: ' + file.size + ' bytes<br />\n';
        output += ' - LastModified: ' + (file.lastModifiedDate ? file.lastModifiedDate.toLocaleDateString() : 'n/a') + '<br />\n';
        proceedData(file);
    }
    $('#file_list').append(output);
}


function handleFileImageSelect(evt) {
    var files = evt.target.files; // FileList object
    // read the file metadata
    var output = '';
    for (var index = 0; index < files.length; index++) {
      (function(file) {
        var imageType = /image.*/;
        if (file.type.match(imageType)) {
          output += '<span style="font-weight:bold;">' + escape(file.name) + '</span><br />\n';
          output += ' - FileType: ' + (file.type || 'n/a') + '<br />\n';
          output += ' - FileSize: ' + file.size + ' bytes<br />\n';
          output += ' - LastModified: ' + (file.lastModifiedDate ? file.lastModifiedDate.toLocaleDateString() : 'n/a') + '<br />\n';
          
          var reader = new FileReader();
          reader.onload = function(e) {
            console.log("onload")
            window.dataStructure.images[file.name] = reader.result;
          }
          reader.readAsDataURL(file);	
        } else {
          console.log("File not supported!")
        }
      })(files[index]);
    }
    $('#file_list').append(output);
}

function parseDataStructure(data) {
    copied_data = [...data];
    header = copied_data.shift()[0].split(";");
    Object.keys(copied_data).map(function (key, index) {
        copied_data[key].map(function (key2, index) {
            key2.split(";").map(function (key3, index) {
                copied_data[key][header[index]] = key3
            })
        })
    });
    return copied_data;
}

function proceedData(file) {
    var reader = new FileReader();
    reader.readAsText(file);
    reader.onload = function (event) {
        var csv = event.target.result;
        var data = $.csv.toArrays(csv);
        //saving as a global variable
        parsed_data = parseDataStructure(data);
        window.importedFiles[file.name] = parsed_data;
        //printTable(file, data);
        if (file.name.startsWith("gaze")) {
            var $selectCSV = $("#selectCSV");
            $selectCSV.append($("<option />").text(file.name));
        }
        makeDataStructure();
        fillSelect('study');
    };
    reader.onerror = function () {
        alert('Unable to read ' + file.fileName);
    };
}

// function to fill window.dataStructure with values
// gaze.csv, mouse.csv, executed_studies.csv, metadata.csv needed to work properly
function makeDataStructure() {
    if (!window.dataStructure.gaze) {
        window.dataStructure.gaze = {};
        window.dataStructure.mouse = {};
        window.dataStructure.user = {};
        window.dataStructure.all_users = [];
        window.dataStructure.metadata = {};
    }
    for (let key in window.importedFiles) {
        for (let lkey in window.importedFiles[key]) {
            let elem = window.importedFiles[key][lkey];
            if (key.startsWith("gaze.csv")) {
                let temp = window.dataStructure.gaze;
                let line = {
                    timestamp: elem["timestamp"],
                    x: elem["x"],
                    y: elem["y"],
                    duration: elem["duration"],
                };
                recInitObj(temp, [elem["study_id"],elem["web_id"],elem["web_group_id"],elem["user_id"]], true);
                temp[elem["study_id"]][elem["web_id"]][elem["web_group_id"]][elem["user_id"]].push(line);
            }
            if (key.startsWith("mouse.csv")) {
                let temp = window.dataStructure.mouse;
                let line = {
                    timestamp: elem["timestamp"],
                    x: elem["x"],
                    y: elem["y"],
                    type: elem["type"],
                };
                recInitObj(temp, [elem["study_id"],elem["web_id"],elem["web_group_id"],elem["user_id"]], true);
                temp[elem["study_id"]][elem["web_id"]][elem["web_group_id"]][elem["user_id"]].push(line);
            }
            if (key.startsWith("executed_studies.csv")) {
                let temp = window.dataStructure.user;
                let line = {
                    id: elem["id"],
                    user_id: elem["user_id"],
                    age: elem["age"],
                    gender: elem["gender"],
                    modified: elem["modified"],
                    created: elem["created"],
                    eye_correction: elem["eye_correction"],
                    educational_level: elem["educational_level"],
                    field_of_occupation: elem["field_of_occupation"],
                    web_browsing_experience: elem["web_browsing_experience"],
                    english_skills: elem["english_skills"],
                };
                recInitObj(temp, [elem["study_id"],elem["user_id"]], false);
                temp[elem["study_id"]][elem["user_id"]] = line;
                window.dataStructure.all_users.push(elem["user_id"]);
            }
            if (key.startsWith("metadata.csv")) {
                let temp = window.dataStructure.metadata;
                let splitTitle = elem["title"].split("_");
                let line = {
                    label: elem["title"],
                    url: elem["url"],
                    screenshot: elem["screenshot"],
                    width: elem["width"],
                    height: elem["height"]
                };
                recInitObj(temp, [elem["study_id"], elem["web_id"], elem["web_group_id"]], false);
                temp[elem["study_id"]][elem["web_id"]][elem["web_group_id"]] = line;
                temp[elem["study_id"]][elem["web_id"]]["label"] = splitTitle[1];
                temp[elem["study_id"]]["label"] = splitTitle[0];
            }
        }
    }
    window.dataStructure.all_colors = assignColors(window.dataStructure.all_users);
}

function checkDataStructure() {
    // TODO: implement some checks for data integrity
    return true;
}

function fillSelect(level) {
    if (checkDataStructure()) {
        let selectBox;
        let selectIterator;
        let selectLabel;
        switch (level) {
            case 'study':
                selectBox = $("#selectStudy");
                selectIterator =  window.dataStructure.gaze;
                selectLabel = window.dataStructure.metadata;
                break;
            case 'web':
                selectBox = $("#selectWeb");
                selectIterator = window.dataStructure.gaze[window.current.study];
                selectLabel = window.dataStructure.metadata[window.current.study];
                break;
            case 'webgroup':
                selectBox = $("#selectWebGroup");
                selectIterator = window.dataStructure.gaze[window.current.study][window.current.web];
                selectLabel = window.dataStructure.metadata[window.current.study][window.current.web];
        }
        selectBox.empty();
        selectBox.append("<option>Select " + level + "</option>");
        console.log(selectLabel);
        for (let elem in selectIterator) {
            selectBox.append("<option value='" + elem + "'>" + selectLabel[elem].label + "</option>");
        }
    }
}


// helper function to avoid errors while inserting values into window.dataStructure
function recInitObj(obj, ks, arr) {
    if (ks.length > 1) {
        if (!obj[ks[0]]) {
            obj[ks[0]] = {};
        }
        recInitObj(obj[ks[0]], ks.slice(1), arr);
    }
    else if (ks.length > 0) {
        if (!obj[ks[0]]) {
            if (arr) {
                obj[ks[0]] = [];
            }
            else {
                obj[ks[0]] = {};
            }
        }
    }
}
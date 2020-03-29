// Functions to visualize data.
const img = new Image();
img.crossOrigin = "Anonymous";
// selection listener
$('#selectStudy').on('change', function () {
    window.current.study = $(this).val();
    fillSelect('web');
});
$('#selectWeb').on('change', function () {
    window.current.web = $(this).val();
    fillSelect('webgroup');
});
$('#selectWebGroup').on('change', function () {
    window.current.webGroup = $(this).val();
    setupCurrent();
});

// setup the window.current
function setupCurrent() {
    window.current.all_users = [];
    for (let user in window.dataStructure.gaze[window.current.study][window.current.web][window.current.webGroup]) {
        window.current.all_users.push(user);
    }
    window.current.active_users = [...window.current.all_users];
    window.current.gaze = window.dataStructure.gaze[window.current.study][window.current.web][window.current.webGroup];
    // convert data from window.current.gaze to older format
    window.current.gazeArray = [];
    for (let u in window.current.gaze) {
        for (let g in window.current.gaze[u]) {
            let line = [];
            for (let elem in window.current.gaze[u][g]) {
                line[elem] = window.current.gaze[u][g][elem];
            }
            line['user_id'] = u;
            window.current.gazeArray.push(line);
        }
    }
    window.current.mouse = window.dataStructure.mouse[window.current.study][window.current.web][window.current.webGroup];
    // convert data from window.dataStructure to older format
    window.current.mouseArray = [];
    for (let u in window.current.mouse) {
        for (let g in window.current.mouse[u]) {
            let line = [];
            for (let elem in window.current.mouse[u][g]) {
                line[elem] = window.current.mouse[u][g][elem];
            }
            line['user_id'] = u;
            window.current.mouseArray.push(line);
        }
    }
    window.current.title = window.dataStructure.metadata[window.current.study][window.current.web][window.current.webGroup].label;
    window.current.width = window.dataStructure.metadata[window.current.study][window.current.web][window.current.webGroup].width;
    window.current.height = window.dataStructure.metadata[window.current.study][window.current.web][window.current.webGroup].height;
    window.current.colors = assignColors([...window.current.all_users]);
    window.current.vis = $('#selectVis').val();
    setupUserTable();
    setupImage('img_' + window.current.title + '.jpg');
    setupCanvasAspectRatio();
    $('#downloadName').val(window.current.title + '_' + window.current.vis);
}

// setup user table
function setupUserTable() {
    let userTable = $('#userTableBody');
    userTable.empty();
    let userTableContent = '';
    for (let key in window.current.all_users) {
        let user = window.dataStructure.user[window.current.study][window.current.all_users[key]];
        userTableContent += '<tr>'
            + '<td style="background-color: ' + window.dataStructure.all_colors[window.current.all_users[key]] + '">'
            + '<input type="checkbox" checked id="select-item" class="select-item checkbox" name="select-item" onchange="handleSingleSelect()" data-user="' + window.current.all_users[key] + '">'
            + '</td>'
            + '<td>' + user.id + '</td>'
            + '<td data-feature="gender">' + user.gender + '</td>'
            + '<td data-feature="age">' + user.age + '</td>'
            + '<td data-feature="eye-correction">' + user.eye_correction + '</td>'
            + '<td data-feature="web-experience">' + user.web_browsing_experience + '</td>'
            + '<td data-feature="eng-experience">' + user.english_skills + '</td>'
            + '</tr>';
    }
    userTable.append(userTableContent);
}

//manage select all button
$("#select-all").click(function () {
    all = $("input.select-all")[0];
    $("input.select-item").each(function (index,item) {
      if(all.checked) {
        item.checked = true;
      } else {
        item.checked = false;
      }
    });
    removeFilteredUsers();
});

 //takes care of (un)checking the select all button of the User Table after a single change
function handleSingleSelect(){
  all = $("input.select-all")[0];
  allSelected = true;
  $("input.select-item").each(function (index,item) {
    if(!item.checked) {
      allSelected = false;
    }
  });
  if(allSelected){
    all.checked = true;
  } else {
    all.checked = false;
  }
  removeFilteredUsers();
}


// setup the background image
function setupImage(imgName) {
    let canvas = document.getElementById("visualizationsCanvas");
    let ctx = canvas.getContext("2d");
    if (!!ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
    img.onload = function () {
        applyFilter();
    };
    img.src = window.dataStructure.images[imgName];
}

function setupCanvasAspectRatio() {
    let wrapper = $('#visualizationsCanvasDiv');
    wrapper.height((window.current.height * (wrapper.width() / window.current.width)));
}


// function clearCanvas() {
//     let canvas = document.getElementById("visualizationsCanvas");
//     let ctx = canvas.getContext("2d");
//     ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
// }


//set color palette for different users
let colorPalette = ["royalblue", "burlywood", "lightgreen", "silver", "gray", "red", "maroon", "yellow", "olive", "lime", "green", "aqua", "teal", "blue", "navy", "fuchsia", "purple", "white", "lightsalmon", "coral", "cyan", "lime"];

// splitting input data according to user_id
function splitUsers(data) {
    return data.reduce(function (acc, d) {
        if (!acc[d[3]]) {
            acc[d[3]] = [];
        }
        acc[d[3]].push(d);
        return acc;
    }, {});
}

// assign colors to users
function assignColors(userIds) {
    // copy colorPalette so we don't modify the original one from here on out
    let colors = [...colorPalette];
    let userColors = [];
    userIds.forEach(function (uId) {
        colors.push(colors.shift());
        userColors[uId] = colors[0];
    });
    return userColors;
}

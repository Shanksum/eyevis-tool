var offscreenCanvas = document.createElement('canvas');
function displayClicksHeatmap(gazedata, clickdata) {
  let mousedata = [];
  let lastGazes = [];
  let scanpathloaded = false;
  mousedata = clickdata;

  //initialize 2d canvas
  const canvas = document.getElementById("visualizationsCanvas");
  let ctx = canvas.getContext("2d");

//  console.log("Entering displayClicksHeatmap with gazedata and clickdata: ");
//  console.log("gazedata: ", gazedata);
//  console.log("clickdata: ", clickdata);

  //preload data
  preloadData();
  function preloadData(){
    if ($('#selectVis').val()=="heatmap")
    loadHeatmap(gazedata,clickdata.filter(mouse => mouse[2] === "click"));
    else if ($('#selectVis').val()=="harmonicHeatmap")
    harmonicMapN(gazedata,true);
    //if (document.querySelector("input[name=toggleClicksHM]").checked)
      //$('.scanpathOptions').show();
    let context = offscreenCanvas.getContext("2d");
    offscreenCanvas.width = canvas.width;
    offscreenCanvas.height = canvas.height;
    context.drawImage(canvas, 0, 0);
    getClicks(mousedata);
  }

  //actionlistener for sliders
  $('#radius').on('change', function () {
  if (document.querySelector("input[name=toggleClicksHM]").checked)
    preloadData();
  });

  $('#blur').on('change', function () {
  if (document.querySelector("input[name=toggleClicksHM]").checked)
    preloadData();
  });

  $('#transparency').on('change', function () {
  if (document.querySelector("input[name=toggleClicksHM]").checked)
    preloadData();
  });

  $('#Fbeta').on('change', function () {
    if (document.querySelector("input[name=toggleClicksHM]").checked)
      preloadData();
    });

  document.querySelector("input[name=toggleClicksHM]").onclick = function (e) {
    if (document.querySelector("input[name=toggleClicksHM]").checked){
      preloadData();
      //$('.scanpathOptions').show();
    }
    //else
      //$('.scanpathOptions').hide();
  };
/*
$('#selectWebGroup').on('change', function () {
  preloadData();
});*/

  ///////////////////////////////////////////////////
  //	From here starts the mouseclick visualization//
  ///////////////////////////////////////////////////

  //Variables for Mouseevents
  var last_mousex = last_mousey = 0;
  var mousex = mousey = 0;
  var mousedown = false;

  //Mousedown

  $(canvas).on('mousedown', function(e) {
    if (document.querySelector("input[name=toggleClicksHM]").checked && ($('#selectVis').val()=="heatmap" || $('#selectVis').val()=="harmonicHeatmap")){
    rect = canvas.getBoundingClientRect();
    last_mousex = parseInt((event.clientX - rect.left) * canvas.width / rect.width);
    last_mousey = parseInt((event.clientY - rect.top) * canvas.height / rect.height);
    mousedown = true;
  }});

  //Mouseup
  $(canvas).on('mouseup', function(e) {
    if (document.querySelector("input[name=toggleClicksHM]").checked && ($('#selectVis').val()=="heatmap" || $('#selectVis').val()=="harmonicHeatmap")){
    mousedown = false;
    rect = canvas.getBoundingClientRect();
    mousex = parseInt((event.clientX - rect.left) * canvas.width / rect.width);
    mousey = parseInt((event.clientY - rect.top) * canvas.height / rect.height);
    if(last_mousex == mousex && last_mousey == mousey)
      lookForHitPoint(mousex, mousey);
    else {
      let halfWidth = (mousex-last_mousex)/2;
      let halfHeight = (mousey-last_mousey)/2;
      let midx = last_mousex + halfWidth;
      let midy = last_mousey + halfHeight;
      lookForHitArea(midx, midy, Math.abs(halfWidth), Math.abs(halfHeight));
    }
  }});

  //Mousemove
  $(canvas).on('mousemove', function(e) {
    if (document.querySelector("input[name=toggleClicksHM]").checked && ($('#selectVis').val()=="heatmap" || $('#selectVis').val()=="harmonicHeatmap")){
    rect = canvas.getBoundingClientRect();
    mousex = parseInt((event.clientX - rect.left) * canvas.width / rect.width);
    mousey = parseInt((event.clientY - rect.top) * canvas.height / rect.height);
    if(mousedown) {
      ctx.clearRect(0,0,canvas.width,canvas.height); //clear canvas
      ctx.drawImage(offscreenCanvas,0,0);
      ctx.beginPath();
      let width = mousex - last_mousex;
      let height = mousey - last_mousey;
      ctx.rect(last_mousex, last_mousey, width, height);
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 5;
      ctx.stroke();
    }
  }});

  function getClicks(clicks){
    clickarray = clickdata.filter(mouse => mouse[2] === "click");
  }

 function lookForHitPoint(x, y){
   const pos = {x,y};
   let userIdsHit =[];
   lastGazes = [];
   clickarray.forEach(function (item) {
     if (isIntersect(pos, item[0], item[1])) {
       filterLastGazes(parseInt(item[3]),parseInt(item[4]))
       userIdsHit.push(parseInt(item[3]));
     }
    });
    if (lastGazes.length > 0 && userIdsHit.length > 0){
      loadScanpath(lastGazes,userIdsHit,false);
      $('.scanpathOptions').show();
      $('.heatOptions').hide();
      $('.harmonicOptions').hide();
      drawClicks(clickdata.filter(mouse => mouse[2] === "click"));
      scanpathloaded = true;
    }
    else if(scanpathloaded==true){ //load Heatmap again
      ctx.drawImage(offscreenCanvas,0,0);
      $('.scanpathOptions').hide();
      if($('#selectVis').val()=="harmonicHeatmap")
        $('.harmonicOptions').show();
      $('.heatOptions').show();
    }
    else if(lastGazes.length == 0 && userIdsHit.length > 0)
      alert("No gazedata in that timespan");
  }

  function lookForHitArea(x, y, xdistance, ydistance){
    let userIdsHit =[];
    lastGazes = [];
    clickarray.forEach(function (item) {
      if(Math.abs(x-parseInt(item[0])) < xdistance){
        if(Math.abs(y-parseInt(item[1])) < ydistance){
          console.log("Hit click of user: ", item[3] , "at time: ",item[4]);
          filterLastGazes(parseInt(item[3]),parseInt(item[4]))
          userIdsHit.push(parseInt(item[3]));
        }
      }
    });
    if (lastGazes.length > 0 && userIdsHit.length > 0){
      loadScanpath(lastGazes,userIdsHit,false);
      $('.scanpathOptions').show();
      $('.heatOptions').hide();
      $('.harmonicOptions').hide();
      drawClicks(clickdata.filter(mouse => mouse[2] === "click"));
      scanpathloaded = true;
    }
    else if(scanpathloaded==true) {//load Heatmap again
      ctx.drawImage(offscreenCanvas,0,0);
      $('.scanpathOptions').hide();
      if($('#selectVis').val()=="harmonicHeatmap")
        $('.harmonicOptions').show();
      $('.heatOptions').show();
    }
    else if(lastGazes.length == 0 && userIdsHit.length > 0)
      alert("No gazedata in that timespan");
  }

  function isIntersect(point, circleX, circleY) {
    return Math.sqrt((point.x-circleX) ** 2 + (point.y - circleY) ** 2) < 10;
  }

  function get(id) {
      return document.getElementById(id);
  }

  function drawClicks(clickData){
	  //console.log(clickData);
	  clickData.forEach(function(click){
		  ctx.beginPath();
		  ctx.arc(click[0], click[1],10,0,2*Math.PI);
		  ctx.fillStyle = window.dataStructure.all_colors[click[3]];
		  ctx.fill();
		  ctx.lineWidth = 2;
		  ctx.strokeStyle = "white";
		  ctx.stroke();
	  });
  }

  function filterLastGazes(userId,timestamp){
    let timespan = get('CHtimespan').value;
    gazedata.forEach(function(item){
      if ((parseInt(item[3]) == userId) && (parseInt(item[4]) >= timestamp-timespan) && (parseInt(item[4]) <= timestamp)){
        lastGazes.push(item);
      }
    });
//    console.log("lastGazes: ", lastGazes); //for testing
  }
}

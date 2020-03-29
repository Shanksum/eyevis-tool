// Methods to cluster data.
var dataset = [];
var clustercenters = [];
var meandurations = [];

//Array that stores each point for each clustered-Area
//so basically the xydata, but sorted into the areas
var xyClusterAreas = [];

//Array that stores the centre of each cluster, which is needed later for the Arrows
var clusterCenters = [];

var clusters;
//This array is going to hold the index of the next cluster, that the most fixations in cluster[i] point to.
var indexOfNextCluster;
//This array will hold the number of Links for each Cluster, that went to the next cluster.
//This will be used later to either color the arrows (like heat) or make them bigger.
var numberOfLinksToNextCluster;

var calculatedNumberOfClusters;

$('#clusterSwitch').change(function(e){
    applyFilter();
});

$('#toggleFlow').click(function() {
   applyFilter();
});

function calculateClusters(xydata, xydurationdata){

	if(($('#optics').is(':checked'))){
    $('[class$="Options"]').hide();
    $('.clusterOptions').show();
    $('.opticsOptions').show();
		//These methods fill "clusters"
		createOpticsCluster(xydata, xydurationdata);
	}else{
    $('[class$="Options"]').hide();
    $('.clusterOptions').show();
    $('.kmeansOptions').show();
		//These methods fill "clusters"
		createKmeansCluster(xydata, parseInt($('#kMeansParameter').val()), xydurationdata)
	}

	//These methods needs "clusters" to be filled
	drawClusters(xydata, calculatedNumberOfClusters, xydurationdata);

	if(($('#toggleFlow').is(':checked'))){
		drawAttentionFlow();
	}
}

function createOpticsCluster(xydata, xydurationdata){
	optics = new OPTICS();
	// parameters: 2 - neighborhood radius, 2 - number of points in neighborhood to form a cluster
	clusters = optics.run(xydata, document.getElementById("pRadius").value, document.getElementById("pPoints").value);
	plot = optics.getReachabilityPlot();
	//console.log(clusters, plot);

	var datalength = clusters.length;
  clusterArray = [];
	for (i = 0; i < datalength; i++) {
		cluster = clusters[i];
//    console.log($('#pPoints').val());
		if(cluster.length >= $('#pPoints').val()){
			clusterlength = cluster.length;
      currentCluster = [];
			for (j = 0; j < clusterlength; j++){
				point = cluster[j];
//        currentCluster.push({x:xydata[point][0],y:xydata[point][1]});
				currentCluster.push(point)
			}
      clusterArray.push(currentCluster);
		}
	}


  calculatedNumberOfClusters = clusterArray.length;
  clusters = clusterArray;

//  convexHull = [];
//  for(i = 0; i<clusterArray.length; i++){
//    convexHull.push(convexhull.makeHull(clusterArray[i]));
//  }
//  drawConvexHull(convexHull,clusterArray);
}



function createKmeansCluster(xydata, k, xydurationdata){

	calculatedNumberOfClusters = k

	if(k < 2){
		alert("Error: K too small. k > 4 is suggested.");
		return;
	}

	if(k > xydata.length){
		alert("Error: K can not exceed the number of fixations that you pass to this method. A much smaller k is suggested.");
		return;
	}

	var kmeans = new KMEANS();
	clusters = kmeans.run(xydata, k);
}


function drawClusters(xydata, numberOfClusters, xydurationdata){
	//Array that stores each point for each clustered-Area
	//so basically the xydata, but sorted into the areas
	var xyClusterAreas = [];

	//Array that stores the centre of each cluster, which is needed later for the Arrows
	clusterCenters = [];
	var clustercenterx, clustercentery;

	//loop over clusters (there should be k clusters)
	for(i = 0; i < clusters.length;i++){
		var currentCluster = clusters[i];
		var xyCluster = []

		clustercenterx = 0;
		clustercentery = 0;

		//loop over cluster, size varies
		for(j = 0; j< currentCluster.length; j ++){
			// currentCluster[j] gives the index of the fixation j in cluster i
			//using that index in xydata gives the fixation itself
			currentfixation = xydata[currentCluster[j]];
			//currentfixation[0] is x coordinate, [1] is y.

			clustercenterx += currentfixation[0];
			clustercentery += currentfixation[1];

			xyCluster.push({x:currentfixation[0], y:currentfixation[1]});
		}

		clusterCenters.push([clustercenterx/currentCluster.length, clustercentery/currentCluster.length]);
		xyClusterAreas.push(xyCluster);
	}

	//uncomment this to see the clusters in the console. Note that they only carry the indices of the fixations, not the coordinates themself
//	console.log("clusters: ", clusters);

	//uncomment this to see the clusters in the console. Note that in this case the fixations are represented by points/coordinates.
//	console.log("xyClusterAreas: ", xyClusterAreas);

	//uncomment this to see the clustercenters in the console
//	console.log("clusterCenters: ", clusterCenters);


  convexHull = [];
  for(i = 0; i<xyClusterAreas.length; i++){
    convexHull.push(convexhull.makeHull(xyClusterAreas[i]));
  }


  //Now: Determine what is the next Area for every Area regarding Attention Flow.

  //This array is going to hold the index of the next cluster, that the most fixations in cluster[i] point to.
  indexOfNextCluster = [numberOfClusters];
  //This array will hold the number of Links for each Cluster, that went to the next cluster.
  //This will be used later to either color the arrows (like heat) or make them bigger.
  numberOfLinksToNextCluster = [numberOfClusters];
  //This array is used to collect the indices of the next cluster.
  var indexArray;
  for  (var i = 0; i < clusters.length; i++){
//  for  (i = 0; i < 1; i++){
	  var currentClusterIndex = i;
	  indexArray = [];
	  cluster = clusters[i];

	  for(j = 0; j<cluster.length;j++){

		  //this catches the very last fixation of the input array, which has no next fixation.
		  if(cluster[j] == xydurationdata.length-1){
//			  console.log("Breaking, last fixation reached. This should occur only once.");
			  break;

		  }

		  //This should catch the fixations which next fixation is of a different user and ignore those
		  if(xydurationdata[cluster[j]][3] != xydurationdata[cluster[j]+1][3]){
//			  console.log("Skipping this fixation, because the next fixation is of a different user." +
//			  		" This can happen multiple times, but no more than n-1 where n is the number of users within the passed data.");
			  continue;
		  }

		  //This only pushes the index of the next cluster to the indexArray if the current and next fixation do not lie in the same cluster/area
		  if(inWhichClusterIsPoint(cluster[j]+1, clusters) != currentClusterIndex){
			  //If the next fixation (cluster[j]+1) is not in a cluster, -1 is returned from "inWhichClusterIsPoint()"
			  //If that is the case, no index is pushed to the indexArray.
			  if(inWhichClusterIsPoint(cluster[j]+1, clusters) != -1){
				  indexArray.push(inWhichClusterIsPoint(cluster[j]+1, clusters));
			  }
		  }
	  }

	  //determine which index occurs the most in indexArray.
	  var counts = {};

	  for (var x = 0; x < indexArray.length; x++) {
	    var num = indexArray[x];
	    counts[num] = counts[num] ? counts[num] + 1 : 1;
	  }

	  var mostOccurences = 0;
	  var indexOfMostOccurences = 0;
	  for(y = 0; y < numberOfClusters;y++){
		  if(counts[y] > mostOccurences){
			  mostOccurences = counts[y];
			  indexOfMostOccurences = y;
		  }
	  }
	  numberOfLinksToNextCluster[currentClusterIndex] = mostOccurences;
	  indexOfNextCluster[currentClusterIndex] = indexOfMostOccurences;
  }

  console.log("Max(numberOfLinksToNextCluster): ", Math.max(...numberOfLinksToNextCluster));
  console.log("numberOfLinksToNextCluster: ", numberOfLinksToNextCluster);
  console.log("indexOfNextCluster", indexOfNextCluster);

//  console.log("convexHull: ", convexHull);
  drawConvexHull(convexHull,xyClusterAreas);
}


function drawAttentionFlow(){
	//Optional :  Draw Circles into the centers
	//	drawCirclesIntoCenterOfAreas(clusterCenters);

	//Draw Arrows Inbetween Areas, indicating the next Area regarding Attention Flow.
	drawArrowsToNextClusters(clusterCenters, indexOfNextCluster, numberOfLinksToNextCluster);
}


function canvas_arrow(context, fromx, fromy, tox, toy){
    var headlen = 70;   // length of head in pixels
    var angle = Math.atan2(toy-fromy,tox-fromx);
    context.moveTo(fromx, fromy);
    context.lineTo(tox, toy);
    context.moveTo(tox, toy);
    context.lineTo(tox-headlen*Math.cos(angle-Math.PI/6),toy-headlen*Math.sin(angle-Math.PI/6));
    context.moveTo(tox, toy);
    context.lineTo(tox-headlen*Math.cos(angle+Math.PI/6),toy-headlen*Math.sin(angle+Math.PI/6));
}


function drawArrowsToNextClusters(centerArray, indexOfNextClusterArray, numberOfLinksToNextCluster){
	if(centerArray.length < 2 || indexOfNextClusterArray.length < 2){
		return;
	}
	if(centerArray.length != indexOfNextClusterArray.length){
		return;
	}
	//initialize 2d canvas
	const canvas = document.getElementById("visualizationsCanvas");
	let ctx = canvas.getContext("2d");

	maxLinks = Math.max(...numberOfLinksToNextCluster);

	ctx.shadowColor = "white";
	ctx.shadowBlur = 2;

	ctx.beginPath();

	for(i = 0; i < centerArray.length;i++){

		
		if(numberOfLinksToNextCluster[i] == 0){
			//from this cluster no links to other clusters were found (probably because not all fixations are in clusters, because OPTICS was used)
			
			//if this is the case, dont draw an arrow
			continue;
		}

		//lineWidth and Color are adjusted, depending on the number of Links to the next area.

		//Value between [0,1]
		widthModifier = numberOfLinksToNextCluster[i]/maxLinks
		ctx.lineWidth = widthModifier * 15;
		ctx.strokeStyle = 'rgb('+widthModifier * 255+','+(255 - widthModifier*255)+','+0+')';
		ctx.beginPath();

		canvas_arrow(ctx,centerArray[i][0],centerArray[i][1]
		,centerArray[indexOfNextClusterArray[i]][0],centerArray[indexOfNextClusterArray[i]][1]);

		ctx.stroke();
	}
}

function drawCirclesIntoCenterOfAreas(centerArray){
	if(centerArray.length < 2){
		return;
	}
	//initialize 2d canvas
	  const canvas = document.getElementById("visualizationsCanvas");
	  let ctx = canvas.getContext("2d");

	for(i = 0; i< centerArray.length;i++){
		ctx.beginPath();
	    ctx.arc(centerArray[i][0],centerArray[i][1], 20, 0, 2 * Math.PI);
	    ctx.fillStyle = "white";
	    ctx.fill();
	    ctx.strokeStyle = "black";
	    ctx.stroke();
		}
}

//returns the index of the cluster in which the point with the index pointNumber lies
function inWhichClusterIsPoint(pointNumber, clusters){
	for  (i = 0; i < clusters.length; i++){
		if (clusters[i].includes(pointNumber))
			return i;
	}
	//if the point is in no cluster (happens with Optics-clustering) return -1
	return -1;
}


//Draws Convex Hulls and the fixations.
function drawConvexHull(convexHullData, fixationData) {
  //initialize 2d canvas
  if(window.current.vis != "3d"){
    const canvas = document.getElementById("visualizationsCanvas");
    let ctx = canvas.getContext("2d");

    //scale canvas to browser size
    ctx.canvas.width = img.naturalWidth;
    ctx.canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);

    //ctx.shadowColor = "black";
    //ctx.shadowBlur = 5;
    ctx.lineWidth = 9;
    ctx.strokeStyle = "white";

    ctx.beginPath();
    for(z = 0; z < convexHullData.length; z++){
      hull = convexHullData[z];
      ctx.moveTo(hull[0].x,hull[0].y);
      for(i = 1; i < hull.length; i++){
        ctx.lineTo(hull[i].x,hull[i].y);
      }
      ctx.lineTo(hull[0].x,hull[0].y);
    }
    ctx.stroke();
    ctx.lineWidth = 7;
    ctx.strokeStyle = "black";
    ctx.stroke();

    ctx.lineWidth = 1;
    //ctx.shadowBlur = 2;
    for(z = 0; z < fixationData.length; z++){
      area = fixationData[z];
      for(i = 0; i < area.length; i++){
        ctx.beginPath();
        ctx.arc(area[i].x,area[i].y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = "white";
        ctx.fill();
        ctx.strokeStyle = "black";
        ctx.stroke();
      }
    }
  }
}

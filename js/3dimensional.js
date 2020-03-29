
/**
 * Original code @author mrdoob / http://mrdoob.com/
 * Modified and updated.
 */

var APP = {

	Player: function () {

		var loader = new THREE.ObjectLoader();
		var camera, scene, renderer;
    //var image;
		var planeGeo, sphereGeo;
		var basicMat, standMat, texture;
		var mesh;
		var light;
		var events = {};

    var dom = document.getElementById('visualizationsCanvas');
    this.dom = dom;
		this.width = 500;
		this.height = 500;
    
		this.load = function ( user_data, user_ids ) {
      renderer = new THREE.WebGLRenderer( { canvas: dom, antialias: true, alpha: true } );
			renderer.setClearColor( 0x000000 );
			renderer.setPixelRatio( window.devicePixelRatio )
			var project = {gammaInput:"false",gammaOutput:"false",shadows:"true",vr:false};
      var object = this;
			if ( project.gammaInput ) renderer.gammaInput = true;
			if ( project.gammaOutput ) renderer.gammaOutput = true;
			if ( project.shadows ) renderer.shadowMap.enabled = true;
			if ( project.vr ) renderer.vr.enabled = true;
			this.setScene();
      const splitData = splitUsers(user_data);
      
      var loader = new THREE.FontLoader();
      loader.load('./lib/helvetiker_regular.typeface.js', function (font) {
        Object.keys(splitData).forEach(function (userId) {
          object.drawUserData(object, splitData[userId], window.current.colors[userId], font);
        })
        stopLoadingAnimation();
      });
      
      this.setCamera( );
      var controls = new THREE.OrbitControls( camera, renderer.domElement );
      controls.target.set(img.width / 2, -img.height/2, 0)
      controls.update();
			events = {
				init: [],
				start: [],
				stop: [],
				keydown: [],
				keyup: [],
				mousedown: [],
				mouseup: [],
				mousemove: [],
				touchstart: [],
				touchend: [],
				touchmove: [],
				update: []
			};
			var scriptWrapParams = 'player,renderer,scene,camera';
			var scriptWrapResultObj = {};
			for ( var eventKey in events ) {
				scriptWrapParams += ',' + eventKey;
				scriptWrapResultObj[ eventKey ] = eventKey;
			}
			var scriptWrapResult = JSON.stringify( scriptWrapResultObj ).replace( /\"/g, '' );
      
			dispatch( events.init, arguments );
		};
    
		this.setCamera = function ( value ) {
			camera = new THREE.PerspectiveCamera( 53.36, img.width / img.height, 1, 10000 );
			camera.aspect = img.width / img.height;
      camera.position.set( img.width / 2, -img.height / 2, 3000 );
			camera.updateProjectionMatrix();
			if ( renderer.vr.enabled ) {
				dom.appendChild( WEBVR.createButton( renderer ) );
			}
		};

    this.setScene = function () {
      // SCENE AND OBJECTS
			scene = new THREE.Scene();
      scene.background = new THREE.Color( 0x808080 );
			//image width and height
			planeGeo = new THREE.PlaneBufferGeometry(img.width,img.height,1,1);
			texture = new THREE.TextureLoader().load(img.src);
			basicMat = new THREE.MeshBasicMaterial(
			{
        color: 16777215,
  			depthFunc: 3,
  			depthTest: true,
  			depthWrite: true,
  		 	map: texture
		  });
		  standMat = new THREE.MeshStandardMaterial(
			 	{
					color: 5400559,
  		 		roughness: 0.5,
  		 		metalness: 0.5,
  		 		emissive: 8161779,
  		 		depthFunc: 3,
  		 		depthTest: true,
  		 		depthWrite: true
			 	});
			 mesh = new THREE.Mesh(planeGeo,basicMat);
			 mesh.position.set(img.width/2,-img.height/2,0);
			 scene.add(mesh);
		};
    
    this.drawUserData = function (object, userData, userColor, font){
      let lastCoords = userData[0];
      object.drawTraceLine(lastCoords, userColor);
      object.drawNumber(lastCoords, userColor, font, 1)
      for (let i = 1; i < userData.length; i++) {
        let coordinateSet = userData[i];    
        object.drawConnectionLine(coordinateSet, lastCoords, userColor);
        object.drawTraceLine(coordinateSet, userColor);         
        object.drawNumber(coordinateSet, userColor, font, i+1);
        lastCoords = coordinateSet;
      }
    };                                                              

    this.drawConnectionLine = function (coordinateSet, lastCoords, userColor) {
      let geometry = new THREE.Geometry();
      geometry.vertices.push(
          new THREE.Vector3(lastCoords[0], -lastCoords[1], lastCoords[2]),
          new THREE.Vector3(coordinateSet[0], -coordinateSet[1], coordinateSet[2])
      );
      let line = new THREE.Line(geometry, new THREE.LineBasicMaterial({
        color: userColor
      }));
      scene.add(line);
    };

    this.drawTraceLine = function (coordinateSet, userColor) {
      let geometry = new THREE.Geometry();
      geometry.vertices.push(
          new THREE.Vector3(coordinateSet[0], -coordinateSet[1], coordinateSet[2]),
          new THREE.Vector3(coordinateSet[0], -coordinateSet[1], 0)
      );
      let line = new THREE.Line(geometry, new THREE.LineDashedMaterial({
          color: 0xff0000,
          linewidth: 1,
          scale: 40,
          dashSize: 40,
          gapSize: 40,
          color: userColor
      }));
      line.computeLineDistances();
      scene.add(line);
    };


    this.drawNumber = function (coordinateSet, userColor, font, num) {
      let textGeo;
			let textString = num.toString();
			textGeo = new THREE.TextGeometry(textString,{
				font: font,
				size: 20,
				height: 5,
				curveSegments: 4,
				bevelEnabled: true,
				bevelThickness: 2,
				bevelSize: 1.5,
				bevelSegments: 4,
			})
      let textMat = new THREE.MeshBasicMaterial({color: userColor});
			let text = new THREE.Mesh(textGeo,textMat);
			text.position.setX(coordinateSet[0]);
			text.position.setY(-coordinateSet[1]);
			text.position.setZ(coordinateSet[2]);
			scene.add(text);
      // wireframe https://stackoverflow.com/questions/41031214/javascript-threejs-3d-draw-solid-cubic-with-border
      var geo = new THREE.EdgesGeometry( text.geometry );
      var mat = new THREE.LineBasicMaterial( { color: 0x000000, linewidth: 0.1 } );
      var wireframe = new THREE.LineSegments( geo, mat );
      wireframe.renderOrder = 1; // make sure wireframes are rendered 2nd
      text.add( wireframe );
		};

		this.setSize = function ( width, height ) {
			this.width = width;
			this.height = height;
			if ( camera ) {
				camera.aspect = this.width / this.height;
				camera.updateProjectionMatrix();
			}
			if ( renderer ) {
				renderer.setSize( width, height );
			}
		};
		function dispatch( array, event ) {
			for ( var i = 0, l = array.length; i < l; i ++ ) {
				array[ i ]( event );
			}
		}
		var time, prevTime;
		function animate() {
			time = performance.now();
			try {
				dispatch( events.update, { time: time, delta: time - prevTime } );
			} catch ( e ) {
				console.error( ( e.message || e ), ( e.stack || "" ) );
			}
			renderer.render( scene, camera );
			prevTime = time;
		}
		this.play = function () {
			prevTime = performance.now();
			document.addEventListener( 'keydown', onDocumentKeyDown );
			document.addEventListener( 'keyup', onDocumentKeyUp );
			document.addEventListener( 'mousedown', onDocumentMouseDown );
			document.addEventListener( 'mouseup', onDocumentMouseUp );
			document.addEventListener( 'mousemove', onDocumentMouseMove );
			document.addEventListener( 'touchstart', onDocumentTouchStart );
			document.addEventListener( 'touchend', onDocumentTouchEnd );
			document.addEventListener( 'touchmove', onDocumentTouchMove );
			dispatch( events.start, arguments );
			renderer.setAnimationLoop( animate );
		};
		this.stop = function () {
			document.removeEventListener( 'keydown', onDocumentKeyDown );
			document.removeEventListener( 'keyup', onDocumentKeyUp );
			document.removeEventListener( 'mousedown', onDocumentMouseDown );
			document.removeEventListener( 'mouseup', onDocumentMouseUp );
			document.removeEventListener( 'mousemove', onDocumentMouseMove );
			document.removeEventListener( 'touchstart', onDocumentTouchStart );
			document.removeEventListener( 'touchend', onDocumentTouchEnd );
			document.removeEventListener( 'touchmove', onDocumentTouchMove );
			dispatch( events.stop, arguments );
			renderer.setAnimationLoop( null );
		};

		this.dispose = function () {
			while ( dom.children.length ) {
				dom.removeChild( dom.firstChild );
			}
			renderer.dispose();
			camera = undefined;
			scene = undefined;
			renderer = undefined;
		};

		function onDocumentKeyDown( event ) {
			dispatch( events.keydown, event );
		}

		function onDocumentKeyUp( event ) {
			dispatch( events.keyup, event );
		}

		function onDocumentMouseDown( event ) {
			dispatch( events.mousedown, event );
		}

		function onDocumentMouseUp( event ) {
			dispatch( events.mouseup, event );
		}

		function onDocumentMouseMove( event ) {
			dispatch( events.mousemove, event );
		}

		function onDocumentTouchStart( event ) {
			dispatch( events.touchstart, event );
		}

		function onDocumentTouchEnd( event ) {
			dispatch( events.touchend, event );
		}

		function onDocumentTouchMove( event ) {
			dispatch( events.touchmove, event );
		}
	}
};



function load_3d(data, user_ids){
  startLoadingAnimation();
  var loader = new THREE.FileLoader();
  var player = new APP.Player();
  player.load( data, user_ids );
  player.setSize(player.dom.offsetWidth, player.dom.offsetHeight);
  player.play();
  window.addEventListener( 'resize', function () {
    player.setSize( window.innerWidth, window.innerHeight );
  });
};

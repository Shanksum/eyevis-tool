function loadScanpath(data, allUserIds, mouse = false) {

    window.requestAnimationFrame = window.requestAnimationFrame ||  window.webkitRequestAnimationFrame;


    //initialize 2d canvas
    const canvas = document.getElementById("visualizationsCanvas");
    let ctx = canvas.getContext("2d");

    //scale canvas to browser size
    ctx.canvas.width = img.naturalWidth;
    ctx.canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
    ctx.lineWidth = 2;

    // drawing scanpath
    function drawScanpath(scaling, transparency) {
        const splitData = splitUsers(data);
        scaling = scaling/3;
        Object.keys(splitData).forEach(function (userId) {
            ctx.globalAlpha = transparency;
            let userData = splitData[userId];
            ctx.fillStyle = window.dataStructure.all_colors[userId];
            ctx.strokeStyle = window.dataStructure.all_colors[userId];


            // draw the connecting lines of a scan path
            ctx.beginPath();
            userData.forEach(function (d) {
                ctx.lineTo(d[0], d[1]);
            });
            ctx.stroke();

            userData.forEach(function (d) {
                ctx.beginPath();
                if (!mouse) {
                    ctx.strokeStyle = 'grey';
                    ctx.arc(d[0], d[1], (scaling * d[2] / 25), 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.stroke();
                    ctx.strokeStyle = window.dataStructure.all_colors[userId];
                } else if (d[2] === "click") {
                    ctx.strokeStyle = 'grey';
                    ctx.fillStyle = "black";
                    // make clicks twice as big
                    ctx.arc(d[0], d[1], scaling * 20, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.stroke();
                    // change back color
                    ctx.fillStyle = window.current.colors[userId];
                    ctx.strokeStyle = window.dataStructure.all_colors[userId];

                } else {
                    ctx.strokeStyle = 'grey';
                    ctx.arc(d[0], d[1], scaling * 10, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.stroke();
                    ctx.strokeStyle = window.dataStructure.all_colors[userId];
                }

            });

            // settings for indicator numbers
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
            ctx.strokeStyle = 'grey';
            ctx.fillStyle = 'white';
            let counter = 1;
            userData.forEach(function (d) {
                if (!mouse) {
                    ctx.font = (scaling * d[2] / 25) + "pt sans-serif";
                } else if (d[2] === "click") {
                    ctx.font = (scaling * 20) + "pt sans-serif";
                } else {
                    ctx.font = (scaling * 10) + "pt sans-serif";
                }
                // draw every second number
                /* if(counter % 2 == 0) {
                    ctx.fillText(String(counter), d[0], d[1]);
                    ctx.strokeText(String(counter), d[0], d[1]);
                } */
                // draw every number
                ctx.fillText(String(counter), d[0], d[1]);
                ctx.strokeText(String(counter), d[0], d[1]);

                counter++;
            });

            ctx.globalAlpha = 1;

        });
    }

    function get(id) {
        return document.getElementById(id);
    }

    let radius = get('radiusSP'), changeType = 'oninput' in radius ? 'oninput' : 'onchange';
    let transparency = get('transparencySP');
    //MOVED TO filtering.js
    //const colors = assignColors(allUserIds);

    function draw() {
        console.time('draw');
        drawScanpath(radius.value, (transparency.value / 100));
        console.timeEnd('draw');
        frame = null;
    }

    draw();

    radius[changeType] = transparency[changeType] = function (e) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage( img, 0, 0);
        frame = frame || window.requestAnimationFrame(draw);
    };


}

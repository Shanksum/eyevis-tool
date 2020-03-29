
function loadHeatmap(data, clickData) {
    window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame;

    let canvas = document.getElementById("visualizationsCanvas");
    let ctx = canvas.getContext("2d");

    ctx.canvas.width = img.naturalWidth;
    ctx.canvas.height = img.naturalHeight;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(img, 0, 0);

    //find the max fixation duration
    let maximum = 0;
    data.forEach(function (item) {
        let dur = parseInt(item[2]);
        if (dur > maximum) {
            maximum = dur;
        }
    });

    //heatmap instance bound to canvas and data with relative fixation maximum
    heatmap_data = [...data];
    heatmap_data.map(function (key, index) {
        heatmap_data[index] = [parseInt(key[0]), parseInt(key[1]), parseInt(key[2])]
    });

    function draw() {
        console.time('draw');
        heat.draw(0.05, alpha);
        if (showClicks) {
            drawClicks();
        }
        console.timeEnd('draw');
        frame = null;
    }

    // draw black circles for clicks
    function drawClicks() {
        clickData.forEach(function (click) {
            ctx.beginPath();
            ctx.arc(click[0], click[1], 10, 0, 2 * Math.PI);
            ctx.fillStyle = window.dataStructure.all_colors[click[3]];
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = "white";
            ctx.stroke();
        });
    }

    function get(id) {
        return document.getElementById(id);
    }

    let radius = get('radius'),
        blur = get('blur'),
        transparency = get('transparency'),
        checkboxClicks = document.querySelector("input[name=toggleClicksHM]"),
        changeType = 'oninput' in radius ? 'oninput' : 'onchange';

    let heat = simpleheat('visualizationsCanvas').data(heatmap_data).max(maximum), frame;
    heat.radius(+radius.value, +blur.value);
    let alpha = transparency.value;
    let showClicks = checkboxClicks.checked;

    //draws heatmap
    draw();

    radius[changeType] = blur[changeType] = transparency[changeType] = checkboxClicks[changeType] = function (e) {
        alpha = transparency.value;
        heat.radius(+radius.value, +blur.value);
        showClicks = checkboxClicks.checked;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        frame = frame || window.requestAnimationFrame(draw);
    };

    function isIntersect(point, circleX, circleY) {
      return Math.sqrt((point.x-circleX) ** 2 + (point.y - circleY) ** 2) < 10;
    }

    canvas.addEventListener('mousemove', (e) => {
      const pos = {
        x: (e.clientX - canvas.getBoundingClientRect().left) * (canvas.width/canvas.getBoundingClientRect().width),
        y: (e.clientY - canvas.getBoundingClientRect().top) * (canvas.height/canvas.getBoundingClientRect().height)
      };
      shouldChange = false;
      clickData.forEach(function(click) {
        if (isIntersect(pos, click[0], click[1])) {
          shouldChange = true;
        }
      });
      if(shouldChange){
        canvas.style.cursor = "pointer";
      } else{
        canvas.style.cursor = "default";
      }
    });
}

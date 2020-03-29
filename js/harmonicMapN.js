function harmonicMapN(dataset,recall=false) {

    window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame;

    let harmonizedArray = [];

    function updateF1Score(alpha) {

        // calculate the number of neighbor fixations per node
        let NeighborArray = [];
        for (let i = 0; i < dataset.length; i++) {
            let absNeighbors = 0;
            for (let j = 0; j < dataset.length; j++) {
                if (Math.pow(dataset[j][0] - dataset[i][0], 2) + Math.pow(dataset[j][1] - dataset[i][0], 2) < Math.pow(200, 2)) {
                    absNeighbors++;
                }
            }
            NeighborArray.push([dataset[i][0], dataset[i][1], dataset[i][2], absNeighbors]);
        }

        // calculate the maximum of durations and neighbors for normalization
        let durationMax = 0;
        let neighborsMax = 0;
        for (let i = 0; i < NeighborArray.length; i++) {
            durationMax = Math.max(durationMax, NeighborArray[i][2]);
            neighborsMax = Math.max(neighborsMax, NeighborArray[i][3]);
        }

        // calculate the f1 Score for all fixations
        harmonizedArray = [];
        for (let i = 0; i < NeighborArray.length; i++) {
            let normalizedNeighbors = NeighborArray[i][3] / neighborsMax;
            let normalizedDuration = NeighborArray[i][2] / durationMax;
            let f1Score = 10 / ((alpha / normalizedDuration) + ((1 - alpha) / normalizedNeighbors));
            harmonizedArray.push([NeighborArray[i][0], NeighborArray[i][1], f1Score]);
        }

        loadHeatmap(harmonizedArray, reducedMouseArray.filter(mouse => mouse[2] === "click"));

    }
    if(!recall)
      displayClicksHeatmap(dataset, reducedMouseArray);

    function get(id) {
        return document.getElementById(id);
    }

    let alpha = get("Fbeta");
    let changeTypes = 'oninput' in alpha ? 'oninput' : 'onchange';

    function draw() {
        console.time('alpha');
        updateF1Score(alpha.value / 100);
        console.log("ALPHA: " + alpha.value / 100);
        console.timeEnd('alpha');
        frame = null;
    }

    draw();

    alpha[changeTypes] = function (e) {
        frame = frame || window.requestAnimationFrame(draw);
    };
}

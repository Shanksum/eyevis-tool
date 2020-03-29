// import images from '../image/examples/*.jpg'

// const _ = require('../lib/lodash.min.js')
// const OPTICS = require('../lib/OPTICS.js')
// const convexhull = require('../lib/convex-hull.js')

var menu5 = new Vue({
  el: '#menu5',
  data: {
    analysis: {
      metadata: [],
      executed_studies: [],
      gaze: null,
      mouse: null
    },
    menu: {
      studies: [],
      selectedStudy: null,
      webs: [],
      selectedWeb: null,
      webGroups: [],
      selectedWebGroup: null,
      views: ['Clusters', 'Levenshtein', 'Generalized Sequential Pattern', 'Transition Probability Matrix'],
      selectedView: 'Clusters'
    },
    draw: {
      img: new Image(),
      ctx: null
    },
    levenshteinResults: [],
    gspResult: null,
    tpmResult: null,
    available_users: [],
    clusters: {
      radius: 75,
      pPoints: 5,
      points: null,
      sequence: null
    },
    gspMinSup: 3
  },
  computed: {
    webGroupOptions() {
      return this.analysis.metadata.map(m => ({
        value: m.web_group_id,
        text: m.web_group_id
      }))
    },
    userSimilarityResults() {
      return _.chain(this.levenshteinResults).map(l => ({
        user1: _.find(this.analysis.executed_studies, e => e.user_id === l.userId1),
        user2: _.find(this.analysis.executed_studies, e => e.user_id === l.userId2),
        distance: l.distance
      })).sortBy('distance');
    },
    isRegionsReady() {
      return _.has(this.analysis.metadata[0], 'regions')
    },
    selectedGaze() {
      return this.analysis.gaze ? this.analysis.gaze
        .filter(g => g.web_group_id == this.menu.selectedWebGroup)
        .reduce((acc, g) => {
          if (g.region !== '@' || g.region !== -1) {
            if (_.has(acc, g.user_id)) {
              acc[g.user_id].push(g.region);
            } else {
              acc[g.user_id] = [g.region];
            }
          }
          return acc;
        }, {}) : []
    },
    availableUsers() {
      return this.analysis.executed_studies.filter(es => Object.keys(this.selectedGaze).includes(es.user_id))
    },
    showLevenshtein() {
      return this.menu.selectedView === 'Levenshtein'
    },
    showClusters() {
      return this.menu.selectedView === 'Clusters'
    },
    showGSP() {
      return this.menu.selectedView === 'Generalized Sequential Pattern'
    },
    showTPM() {
      return this.menu.selectedView === 'Transition Probability Matrix'
    },
    showWarning() {
      return !this.clusters.sequence || (!this.showClusters && (this.showLevenshtein || this.showGSP))
    },
    gspArrays() {
      return _.keys(this.clusters.sequence).map(k => {
        return this.clusters.sequence[k].length > 0 ? {
          sequence: this.clusters.sequence[k].filter(i => i !== -1),
          user: _.find(this.analysis.executed_studies, e => e.user_id === k)
        } : []
      })
    },
    selectedGazeOfWebGroup() {
      // .map(gaze => [parseInt(gaze.x), parseInt(gaze.y)])
      return this.analysis.gaze ?
        this.analysis.gaze.filter(gaze => gaze.web_group_id == this.menu.selectedWebGroup) :
        []
    }
  },
  methods: {
    start() {
      if (_.isEmpty(window.analysis.csv)) {
        bootoast.toast({
          message: `<i class="fas fa-times-circle"></i> Please visit import page to upload data.`,
          type: 'error',
          position: 'right-bottom',
          timeout: false
        })
      } else {
        startLoadingAnimation()
        this.analysis = window.analysis.csv
      }
    },
    calculateLevenshteinDistance() {
      this.levenshteinResults = [];
      const pairs = getCombinations(_.keys(this.clusters.sequence));
      pairs.forEach(p => {
        this.levenshteinResults.push({
          userId1: p[0],
          userId2: p[1],
          distance: getEditDistance(
            this.clusters.sequence[p[0]].join(''),
            this.clusters.sequence[p[1]].join('')
          )
        });
      });
    },
    setupImage() {
      this.draw.ctx = this.$refs.analysisCanvas.getContext("2d")
      const metadata = _.find(this.analysis.metadata, m => m.web_group_id === this.menu.selectedWebGroup)
      this.draw.img.onload = () => {
        const labelHull = (h, num) => {
          if (h.x+20 > 0 && h.y+15 > 0) {
            console.log('labeled', h.x+20, h.y+15);
            this.draw.ctx.font = "30px Arial bold";
            this.draw.ctx.fillStyle = "red";
            this.draw.ctx.fillText(String(num), h.x+20,h.y+15);
            return true
          }
          return false
        }
        this.draw.ctx.canvas.width = this.draw.img.naturalWidth;
        this.draw.ctx.canvas.height = this.draw.img.naturalHeight;
        this.draw.ctx.clearRect(0, 0, this.draw.ctx.canvas.width, this.draw.ctx.canvas.height);
        this.draw.ctx.drawImage(this.draw.img, 0, 0, this.draw.img.width, this.draw.img.height);

        this.draw.ctx.lineWidth = 9;
        this.draw.ctx.strokeStyle = "blue";
        this.draw.ctx.beginPath();
        this.clusters.points.forEach((hull, i) => {
          let isLabeled = false
          // console.log(hull[0].x,hull[0].y);
          this.draw.ctx.moveTo(hull[0].x,hull[0].y);
          for(let j = 1; j < hull.length; j++){
            this.draw.ctx.lineTo(hull[j].x,hull[j].y);
            isLabeled = isLabeled ? isLabeled : labelHull(hull[j], i)
          }
          this.draw.ctx.lineTo(hull[0].x,hull[0].y);
          isLabeled = isLabeled ? isLabeled : labelHull(hull[0], i)
        });
        this.draw.ctx.stroke();
      }
      this.draw.img.src = "image/examples/img_" + metadata.title + '.jpg'
      // this.draw.img.src = images["img_" + metadata.title]
    },
    triggerCalc() {
      startLoadingAnimation()
      this.executeOpticsClustering()
      if (this.menu.selectedView === 'Levenshtein') {
        this.calculateLevenshteinDistance()
      } else if (this.menu.selectedView === 'Clusters') {
        this.setupImage()
      } else if (this.menu.selectedView === 'Generalized Sequential Pattern') {
        this.gspResult = []
        // console.log('GSP', this.gspArrays);
        const totalSeqLength = this.gspArrays.reduce((acc, g) => acc + g.sequence.length, 0)
        // console.log(totalSeqLength);
        if (totalSeqLength > 250) {
          bootoast.toast({
            message: `<i class="fas fa-times-circle"></i> Cannot execute algorithm due to large size(${totalSeqLength}).`,
            type: 'error',
            position: 'right-top',
            timeout: false
          })
        } else {
          this.search()
        }
      } else if (this.menu.selectedView === 'Transition Probability Matrix') {
        const res = calcTransitionProbabilityMatrix(this.gspArrays.map(a => a.sequence))
        this.tpmResult = _.chain(res).keys().filter(k => k.split(',')[0] !== k.split(',')[1]).map(k => ({ init: k.split(',')[0], next: k.split(',')[1], value: 100*res[k].toFixed(2)})).orderBy(['init', 'next'], 'asc').value()
      }
      stopLoadingAnimation()
    },
    search() {
      this.gspResult = search(this.gspArrays.map(a => a.sequence), this.gspMinSup).reduce((acc, o) => ({
        ...acc,
        ...o
      }), {})
    },
    executeOpticsClustering() {
      this.clusters.points = clusterOptics(this.selectedGazeOfWebGroup.map(gaze => [parseInt(gaze.x), parseInt(gaze.y)]), this.clusters.radius, this.clusters.pPoints)
      // console.log('executeOpticsClustering', this.clusters.points);
      if (this.clusters.points.length < 1) {
        bootoast.toast({
          message: `<i class="fas fa-exclamation-triangle"></i> Insufficient data for clusters.`,
          type: 'warning',
          position: 'right-top',
          animationDuration: 5000
        })
      }
    }
  },
  watch: {
    'analysis.gaze' (newValue, oldValue) {
      if (newValue) {
        stopLoadingAnimation()
        bootoast.toast({
          message: `<i class="fas fa-check-circle"></i> Now you can select use the menu.`,
          type: 'success',
          position: 'right-top',
          animationDuration: 1000
        })
      }
    },
    'analysis.metadata'(newValue, oldValue) {
      this.menu.studies = this.analysis.metadata.reduce((acc, m) => ({ ...acc, [m.title.split('_')[0]]: m.study_id }), {})
    },
    'menu.selectedStudy'(newValue, oldValue) {
      if (newValue && newValue !== oldValue) {
        this.menu.webs = this.analysis.metadata.filter(m => m.study_id === newValue).reduce((acc, m) => ({ ...acc, [m.title.split('_')[1]]: m.web_id }), {})
        this.menu.selectedWeb = null
        this.menu.selectedWebGroup = null
      }
    },
    'menu.selectedWeb'(newValue, oldValue) {
      if (newValue && newValue !== oldValue) {
        this.menu.webGroups = this.analysis.metadata.filter(m => m.study_id === this.menu.selectedStudy).filter(m => m.web_id === newValue).reduce((acc, m) => ({ ...acc, [m.title]: m.web_group_id }), {})
        this.menu.selectedWebGroup = null
      }
    },
    'menu.selectedWebGroup'(newValue) {
      if (newValue) {
        this.triggerCalc()
      }
    },
    'menu.selectedView'(newValue, oldValue) {
      if (newValue && newValue !== oldValue) {
        this.triggerCalc()
      }
    },
    'clusters.points'(newValue, oldValue) {
      const res = this.selectedGazeOfWebGroup.map(gaze => ({
        ...gaze,
        region: findRegion(newValue.map(arr => arr.map(a => [a.x, a.y])), gaze.x, gaze.y)
      }))
      this.clusters.sequence = res.reduce((acc, g) => {
          if (g.region !== -1) {
            if (_.has(acc, g.user_id)) {
              acc[g.user_id].push(g.region);
            } else {
              acc[g.user_id] = [g.region];
            }
          }
          return acc;
        }, {})
    },
    'clusters.radius'(newValue, oldValue) {
      this.triggerCalc()
    },
    'clusters.pPoints'(newValue, oldValue) {
      this.triggerCalc()
    },
    gspMinSup(newValue, oldValue) {
      this.triggerCalc()
    }
  }
});

const getPoints = (size, division) => {
  return [
    0,
    ..._.chain(_.range(0, size, size / division))
    .map(x => x + 0.5)
    .tail()
    .value(),
    size
  ];
};

const getRegions = (width, height, xDiv = 16, yDiv = 9) => {
  const xs = getPoints(width, xDiv);
  const ys = getPoints(height, yDiv);
  const coordinates = ys.map(y => xs.map(x => [x, y]));
  let regions = [];
  for (let y = 0; y < yDiv; y++) {
    for (let x = 0; x < xDiv; x++) {
      regions = [
        ...regions,
        [
          coordinates[y][x],
          coordinates[y][x + 1],
          coordinates[y + 1][x],
          coordinates[y + 1][x + 1]
        ]
      ];
    }
  }
  return regions;
};

const isInside = (point, vs) => {
  // ray-casting algorithm based on
  // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

  let x = point[0],
    y = point[1];

  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    let xi = vs[i][0],
      yi = vs[i][1];
    let xj = vs[j][0],
      yj = vs[j][1];

    let intersect =
      yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
};

const findRegion = (regions, x, y) => {
  // return String.fromCharCode(regions.findIndex(r => isInside([x, y], r)) + 65);
  return regions.findIndex(r => isInside([x, y], r))
};

const getCombinations = arr =>
  arr.reduce((acc, v, i) => acc.concat(arr.slice(i + 1).map(w => [v, w])), []);

const getEditDistance = function (a, b) {
  if (a.length == 0) return b.length;
  if (b.length == 0) return a.length;

  var matrix = [];

  // increment along the first column of each row
  var i;
  for (i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  // increment each column in the first row
  var j;
  for (j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (i = 1; i <= b.length; i++) {
    for (j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) == a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1
          )
        ); // deletion
      }
    }
  }

  return matrix[b.length][a.length];
};

function product(iterables, repeat) {
  var argv = Array.prototype.slice.call(arguments),
    argc = argv.length;
  if (argc === 2 && !isNaN(argv[argc - 1])) {
    var copies = [];
    for (var i = 0; i < argv[argc - 1]; i++) {
      copies.push(argv[0].slice()); // Clone
    }
    argv = copies;
  }
  return argv.reduce(function tl(accumulator, value) {
    var tmp = [];
    accumulator.forEach(function (a0) {
      value.forEach(function (a1) {
        tmp.push(a0.concat(a1));
      });
    });
    return tmp;
  }, [
    []
  ]);
}

const countItems = (acc, i) => {
  if (_.has(acc, i)) {
    acc[i] += 1
  } else {
    acc[i] = 1
  }
  return acc
}

const is_slice_in_list = (s, l) => {
  const len_s = s.length
  return _.chain(_.range(l.length - len_s + 1)).some(i => _.isEqual(s, l.slice(i, len_s + i))).value()
}

const calc_frequency = (results, item, min_sup, transactions) => {
  const i = _.isArray(item) ? item.map(_.parseInt) : [_.parseInt(item)]
  const frequency = _.chain(transactions).map(t => is_slice_in_list(i, t) ? 1 : 0).sum().value()
  if (frequency >= min_sup) {
    results[i] = frequency
  }
  return results
}

const support = (items, min_sup, transactions) => items.reduce((acc, i) => {
  return calc_frequency(acc, i, min_sup, transactions)
}, {})

const search = (transactions, min_sup) => {
  // if (min_sup < 0.0 || min_sup > 1.0) {
  //   console.error('Invalid min_sup value');
  //   return;
  // }
  const new_min_sup = min_sup
  const max_size = _.chain(transactions).map(i => i.length).max().value()
  const counts = _.chain(transactions).flatten().reduce(countItems, {}).value()
  let candidates = _.chain(counts).keys().value()
  let freq_patterns = []

  freq_patterns.push(support(candidates, new_min_sup, transactions))

  let k_items = 1
  let items = []
  // _.keys(freq_patterns[k_items - 1]).length &&
  while (k_items + 1 <= max_size) {

    if (_.isEmpty(freq_patterns[k_items - 1])) {
      break
    }

    k_items += 1
    items = _.chain(freq_patterns[0]).keys().uniq().value()

    candidates = product(items, k_items)

    freq_patterns.push(support(candidates, new_min_sup, transactions))
  }

  return freq_patterns.slice(0, -1)
}

const slide = (l) => _.range(l.length - 1).map(i => [l[i], l[i + 1]])

const countItemPairs = (acc, i) => {
  if (_.has(acc, _.join(i, ','))) {
    acc[i] += 1
  } else {
    acc[i] = 1
  }
  return acc
}

const countKeyStartsWith = (o, k) => {
  const n = k.split(',')[0]
  return _.chain(o).keys().map(v => v.startsWith(n) ? o[v] : 0).sum().value()
}

const calcTransitionProbabilityMatrix = (ts) => {
  const res = _.chain(ts).map(slide).flatten().reduce(countItemPairs, {}).value()
  return _.mapValues(res, (v, k) => _.round(v / countKeyStartsWith(res, k), 2))
}

const clusterOptics = (data, radius, points) => {
  const optics = new OPTICS()
  // FIXME: radius
  // FIXME: points
  const clusters = optics.run(data, radius, points)
  let clusterArray = []

  for (let i = 0; i < clusters.length; i++) {
    const cluster = clusters[i];
    // FIXME: points
    if (cluster.length >= points) {
      let currentCluster = []
      for (let j = 0; j < cluster.length; j++) {
        const point = cluster[j];
        currentCluster.push({ x: data[point][0], y: data[point][1] })
      }
      clusterArray.push(currentCluster)
    }
  }

  return clusterArray.map(c => convexhull.makeHull(c))
}
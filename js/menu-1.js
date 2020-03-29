// const _ = require('../lib/lodash.min.js')
// const Papa = require('../lib/papaparse.min.js')

var menu1 = new Vue({
  el: '#menu1',
  methods: {
    uploadCSVFiles() {
      startLoadingAnimation()
      _.forEach(this.$refs.csvFiles.files, f => {
        Papa.parse(f, {
          header: true,
          skipEmptyLines: true,
          complete: res => {
            window.analysis.csv[f.name.split('.')[0]] = res.data;
            if (_.keys(window.analysis.csv).length === this.$refs.csvFiles.files.length) {
              stopLoadingAnimation()
              bootoast.toast({
                message: `<i class="fas fa-check-circle"></i> Files are successfully uploaded.`,
                position: 'right-bottom',
                type: 'success',
                animationDuration: '500'
              })
            }
          }
        });
      });
    },
    uploadImageFiles() {
      _.forEach(this.$refs.imageFiles.files, f => {
      });
    },
    tryDemoData() {
      startLoadingAnimation()
      let csvs = ['executed_studies', 'gaze', 'metadata', 'mouse']
      _.forEach(csvs, f => {
        Papa.parse(`http://eyevis.west.uni-koblenz.de/csv/${f}.csv`, {
          download: true,
          header: true,
          skipEmptyLines: true,
          complete: res => {
            window.analysis.csv[f] = res.data;
            console.log(window.analysis.csv);
            if (_.keys(window.analysis.csv).length === csvs.length) {
              stopLoadingAnimation()
              bootoast.toast({
                message: `<i class="fas fa-check-circle"></i> Demo data was successfully uploaded.`,
                position: 'right-bottom',
                type: 'success',
                animationDuration: '300'
              })
            }
          },
          error: res => {
            stopLoadingAnimation()
            console.log(res);
            bootoast.toast({
                message: `<i class="fas fa-times-circle"></i> Error on upload.`,
                position: 'right-bottom',
                type: 'error',
                timeout: true
              })
          }
      });
      })
    }
  }
});

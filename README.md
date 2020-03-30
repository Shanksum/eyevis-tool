# Eye Tracking Visualization Tool
![Wiener Staatsoper](/image/viennaScan.jpg)

## About the project
This tool was created as part of a research lab project of the [WeST Institute](https://west.uni-koblenz.de/).
Our goal was to develop new means to display eye tracking data. We started gathering our own test data by conducting an eye tracking study via the EYEVIDO Software and then build the tool to visualize our results. In the end we managed to not only implement basic visualizations such as heatmap and scanpath, but also added clustering and attention flow methods to better use the data we gathered. With an additional 3D mode, the user can also experience the time as a new axis.

You can find & test the tool here: https://eyevis.west.uni-koblenz.de/
***

## Structure

`css` - all our CSS files. If you need to add a file, remember to add it to the `index.html` header

`csv` - our eye tracking dataset and Pyhton parser

`image` - images that we use

`js` - JavaScript files that we created or modified

`js/global_vars.js` - here we define global variables to use later in the code and transfer between people

`lib` - libraries that are in use

`index.html` - our single page website. Don't put any _major_ JavaScript here. Only link script and css files.

## Further explanation
- The tool is displayed using one `.html` file and multiple panes to create the feeling of browsing a multi paged website:
  * The `Import data` pane offers the possibility to try the tool with our collected test data or upload specific `.csv` files of eye tracking studies and their corresponding image files. We offer a Python Script to transform EYEVIDO SQL dumps into our required format.
  * The `Tool` pane is the visualization part and lets the user chose which website of the uploaded data should be displayed and which visulization method should be applied. Each method comes with customization settings. We also offer general filter options to filter the displayed user data by metadata such as gender, age etc.
  * The `Help` pane explains all available visualization methods and the conducted eye tracking study.
- Most of the computing happens in the `visualization.js` and `filtering.js`:
   * Upon selecting a website/screenshot which should be displayed, the `visualization.js` script takes care of loading the screenshot, the gaze and mouse data and the table of displayed users, aswell as assigning each user a unique color.
   * `filtering.js` takes care of not only managing the filter options, but also displaying the right visualization options and calling the selected visualization method. The corresponding JavaScript file of the selected method will then take over to calculate and display the visualization on the canvas.
***

## Project Team
Christian Brozmann  
Chuyi Sun  
Daniel Vossen  
Marius Nisslmüller  
Nadja Jelicic  
Niklas Ecker  
Oleksandr Kovtunov  
Orkut Karacalik  
Stefan Hill  
Sophia Kramer

### _Under guidance of:_
Dr. Chandan Kumar  
Raphael Menges
***

## Used libraries
+ [Vue.js](https://vuejs.org)
+ [simpleheat](https://github.com/mourner/simpleheat)
+ [Density Based Clustering for JavaScript](https://github.com/uhho/density-clustering)
+ [Papaparse.js](https://www.papaparse.com/)
+ [Lodash.js](https://lodash.com/)
+ [jQuery](https://jquery.com/)
+ [Convex hull algorithm](https://www.nayuki.io/page/convex-hull-algorithm)
+ [bootoast](https://github.com/odahcam/bootoast)
***

## License
The work is licensed under the MIT license. For more information please check the LICENSE file.


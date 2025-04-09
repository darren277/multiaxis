import { drawChart } from '../drawing/drawChart.js';
//import { drawRobotGuide } from '../drawing/drawRobotGuide.js';
//import { drawBackgroundImage } from '../drawing/drawBackgroundImage.js';

export default [
    {
        name: 'Chart',
        dataSrc: 'data',
        drawFunc: drawChart,
    },
//    {
//        name: 'RobotGuide',
//        dataSrc: 'robotGuideData',
//        drawFunc: drawRobotGuide,
//    },
//    {
//        name: 'Background',
//        dataSrc: 'backgroundConfig',
//        drawFunc: drawBackgroundImage,
//    },
];
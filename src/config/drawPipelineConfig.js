import { drawChart } from '../drawing/drawChart.js';
//import { drawRobotGuide } from '../drawing/drawRobotGuide.js';
//import { drawBackgroundImage } from '../drawing/drawBackgroundImage.js';
import { drawSheetMusic } from '../drawing/drawSheetMusic.js';

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
    {
        name: 'Music',
        dataSrc: 'music',
        drawFunc: (scene, data, state) => {
            state.sheetMusic = drawSheetMusic(scene, data)
        },
    }
];
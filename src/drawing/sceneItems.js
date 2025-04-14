// Example: 10 items placed around the scene
const SCENE_ITEMS_OLD = [
    {
        id: "photo1",
        position: { x: 0, y: 2, z: 0 },
        //image: "step1.jpg",
        image: "textures/Canestra_di_frutta_Caravaggio.jpg",
        caption: "<h2>Photo 1</h2><p>Captivating forest scene!</p>",
    },
    {
        id: "photo2",
        position: { x: 5, y: 3, z: -5 },
        //image: "step2.jpg",
        image: "textures/Canestra_di_frutta_Caravaggio.jpg",
        caption: "<h2>Photo 2</h2><p>A beautiful mountain peak.</p>",
    },
    {
        id: "photo3",
        position: { x: -5, y: 2, z: 10 },
        //image: "step3.jpg",
        image: "textures/Canestra_di_frutta_Caravaggio.jpg",
        caption: "<h2>Photo 3</h2><p>Riverside cottage at sunset.</p>",
    },
    // ... up to photo10 ...
    {
        id: "photo10",
        position: { x: 12, y: 1, z: 8 },
        //image: "step10.jpg",
        image: "textures/Canestra_di_frutta_Caravaggio.jpg",
        caption: "<h2>Photo 10</h2><p>Hidden waterfall in the forest.</p>",
    },
];

const SCENE_ITEMS = [
    // The "center" or "home" slide
    {
        id: "slide1_center",
        position: { x: 0, y: 2, z: -10 },
        image: "textures/slide1_main.jpg",
        caption: "<h2>Welcome</h2><p>This is the central vantage point.</p>",
        customClasses: " bounce pulse",
    },

    // Back arrow pointing toward the user (slightly in front or angled)
    {
        id: "slide1_backArrow",
        position: { x: 0, y: -2, z: -9 },
        image: "textures/arrow_back.jpg",
        caption: "<h1>⬇️</h1><h3>Back Arrow</h3><p>Click me to return.</p>",
        customClasses: " bounce-pulse"
    },

    // Two slides further "left" of center
    {
        id: "slide_left1",
        position: { x: -15, y: 2, z: -10 }, // 15 units left of center
        image: "textures/slide_left1.jpg",
        caption: "<h1>⬅️</h1><h2>Slide Left 1</h2><p>First left step.</p>",
    },
    {
        id: "slide_left2",
        position: { x: -30, y: 2, z: -10 }, // another 15 units left
        image: "textures/slide_left2.jpg",
        caption: "<h1>⬆️</h1><h2>Slide Left 2</h2><p>Second left step.</p>",
    },

    // Two slides further "up" of center
    {
        id: "slide_top1",
        position: { x: 0, y: 12, z: -10 }, // 6 to 10 units up from center
        image: "textures/slide_top1.jpg",
        caption: "<h1>➡️</h2><h2>Slide Top 1</h2><p>First top step.</p>",
    },
    {
        id: "slide_top2",
        position: { x: 0, y: 22, z: -10 }, // another 10 units up
        image: "textures/slide_top2.jpg",
        caption: "<h2>Slide Top 2</h2><p>Second top step.</p>",
    },

    // Two slides further "right" of center
    {
        id: "slide_right1",
        position: { x: 15, y: 2, z: -10 },
        image: "textures/slide_right1.jpg",
        caption: "<h2>Slide Right 1</h2><p>First right step.</p>",
    },
    {
        id: "slide_right2",
        position: { x: 30, y: 2, z: -10 },
        image: "textures/slide_right2.jpg",
        caption: "<h2>Slide Right 2</h2><p>Second right step.</p>",
    },
];

const INTRO_BANNERS = [
    // Three banners around the central slide
    {
        id: "slide1_leftBanner",
        position: { x: -5, y: 2, z: -10 },
        image: "textures/banner_left.jpg",
        caption: "<h3>Left Banner</h3><p>Click me to go left.</p>",
    },
    {
        id: "slide1_topBanner",
        position: { x: 0, y: 6, z: -10 },
        image: "textures/banner_top.jpg",
        caption: "<h3>Top Banner</h3><p>Click me to go up.</p>",
    },
    {
        id: "slide1_rightBanner",
        position: { x: 5, y: 2, z: -10 },
        image: "textures/banner_right.jpg",
        caption: "<h3>Right Banner</h3><p>Click me to go right.</p>",
    },
]


export { SCENE_ITEMS };
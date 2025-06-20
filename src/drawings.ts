const THREEJS_DRAWINGS = {
    room: () =>
        import('./drawing/reusables/drawRoom.js').then((m) => m.roomDrawing),
    adventure: () =>
        import('./drawing/adventure/drawAdventure.js').then(
            (m) => m.adventureDrawing,
        ),
    music: () =>
        import('./drawing/drawSheetMusic.js').then((m) => m.musicDrawing),
    multiaxis: () =>
        import('./drawing/chart/drawChart.js').then((m) => m.multiAxisDrawing),
    cayley: () => import('./drawing/drawGraph.js').then((m) => m.cayleyDrawing),
    force: () => import('./drawing/drawGraph.js').then((m) => m.forceDrawing),
    geo: () => import('./drawing/drawGeo.js').then((m) => m.geoDrawing),
    geo3d: () => import('./drawing/drawGeo.js').then((m) => m.geoDrawing3d),
    quantum: () =>
        import('./drawing/drawQuantum.js').then((m) => m.quantumDrawing),
    svg: () =>
        import('./drawing/reusables/drawSvg.js').then((m) => m.svgDrawing),
    multisvg: () =>
        import('./drawing/reusables/drawSvg.js').then((m) => m.multiSvgDrawing),
    library: () =>
        import('./drawing/library/drawLibrary.js').then(
            (m) => m.libraryDrawing,
        ),
    plot: () =>
        import('./drawing/drawPlotFunction.js').then(
            (m) => m.plotFunctionDrawing,
        ),
    rubiks: () =>
        import('./drawing/drawRubiksCube.js').then((m) => m.rubiksCubeDrawing),
    chess: () => import('./drawing/drawChess.js').then((m) => m.chessDrawing),
    clustering: () =>
        import('./drawing/drawClustering.js').then((m) => m.clusteringDrawing),
    orbits: () =>
        import('./drawing/drawOrbits.js').then((m) => m.orbitsDrawing),
    force3d: () =>
        import('./drawing/drawForce.js').then((m) => m.force3dDrawing),
    cards: () => import('./drawing/drawCards.js').then((m) => m.cardsDrawing),
    gltf: () =>
        import('./drawing/reusables/drawGLTF.js').then((m) => m.gltfDrawing),
    synapse: () =>
        import('./drawing/drawNeuro.js').then((m) => m.synapseDrawing),
    brain: () => import('./drawing/drawBrain.js').then((m) => m.brainDrawing),
    chemistry: () =>
        import('./drawing/drawChemistry.js').then((m) => m.chemistryDrawing),
    game: () => import('./drawing/drawGame.js').then((m) => m.gameDrawing),
    ammo: () => import('./drawing/drawAmmo.js').then((m) => m.ammoDrawing),
    periodic: () =>
        import('./drawing/drawPeriodic.js').then((m) => m.periodicDrawing),
    monitor: () =>
        import('./drawing/reusables/drawMonitor.js').then(
            (m) => m.monitorDrawing,
        ),
    tv: () => import('./drawing/reusables/drawTV.js').then((m) => m.tvDrawing),
    drive: () => import('./drawing/drawDrive.js').then((m) => m.driveDrawing),
    farm: () => import('./drawing/drawFarm.js').then((m) => m.farmDrawing),
    exr: () =>
        import('./drawing/reusables/drawEXR.js').then((m) => m.exrDrawing),
    skibidi: () =>
        import('./drawing/drawSkibidi.js').then((m) => m.skibidiDrawing),
    physics: () =>
        import('./drawing/drawPhysics.js').then((m) => m.physicsDrawing),
    audioviz: () =>
        import('./drawing/drawAudioViz.js').then((m) => m.audioVizDrawing),
    network: () =>
        import('./drawing/drawNetwork.js').then((m) => m.networkDrawing),
    smoke: () => import('./drawing/drawSmoke.js').then((m) => m.smokeDrawing),
    buildings: () =>
        import('./drawing/drawGeo.js').then((m) => m.buildingsDrawing),
    town: () => import('./drawing/drawTown.js').then((m) => m.townDrawing),
    complex: () =>
        import('./drawing/drawComplex.js').then((m) => m.complexDrawing),
    city: () => import('./drawing/drawCity.js').then((m) => m.cityDrawing),
    familytree: () =>
        import('./drawing/drawFamilyTree.js').then((m) => m.familyTreeDrawing),
}

export { THREEJS_DRAWINGS }

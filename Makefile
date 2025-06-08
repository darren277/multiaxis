include .env

INKSCAPE_PATH=C:/Program Files/Inkscape/bin/inkscape.exe

s3:
	aws s3 cp src/main.js s3://$(BUCKET_NAME)/scripts/threejs/main.js

s3-config:
	aws s3 cp src/config/attachUIListeners.js s3://$(BUCKET_NAME)/scripts/threejs/config/attachUIListeners.js
	aws s3 cp src/config/clickControlHelper.js s3://$(BUCKET_NAME)/scripts/threejs/config/clickControlHelper.js
	aws s3 cp src/config/collisionManager.js s3://$(BUCKET_NAME)/scripts/threejs/config/collisionManager.js
	aws s3 cp src/config/dynamicImports.js s3://$(BUCKET_NAME)/scripts/threejs/config/dynamicImports.js
	aws s3 cp src/config/instantiateCollision.js s3://$(BUCKET_NAME)/scripts/threejs/config/instantiateCollision.js
	aws s3 cp src/config/loadThenDraw.js s3://$(BUCKET_NAME)/scripts/threejs/config/loadThenDraw.js
	aws s3 cp src/config/navigation.js s3://$(BUCKET_NAME)/scripts/threejs/config/navigation.js
	aws s3 cp src/config/sceneSetup.js s3://$(BUCKET_NAME)/scripts/threejs/config/sceneSetup.js
	aws s3 cp src/config/uiPanelConfig.js s3://$(BUCKET_NAME)/scripts/threejs/config/uiPanelConfig.js
	aws s3 cp src/config/utils.js s3://$(BUCKET_NAME)/scripts/threejs/config/utils.js
	aws s3 cp src/config/walking.js s3://$(BUCKET_NAME)/scripts/threejs/config/walking.js

s3-drawing:
	aws s3 cp src/drawing/adventure/createItems.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/adventure/createItems.js
	aws s3 cp src/drawing/adventure/drawAdventure.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/adventure/drawAdventure.js
	aws s3 cp src/drawing/adventure/helpers.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/adventure/helpers.js
	aws s3 cp src/drawing/adventure/interactions.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/adventure/interactions.js
	aws s3 cp src/drawing/adventure/styleDefs.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/adventure/styleDefs.js
	aws s3 cp src/drawing/library/calculatePosition.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/library/calculatePosition.js
	aws s3 cp src/drawing/library/drawLibrary.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/library/drawLibrary.js
	aws s3 cp src/drawing/library/sortResources.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/library/sortResources.js
	aws s3 cp src/drawing/chartConfig.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/chartConfig.js
	aws s3 cp src/drawing/drawAmmo.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawAmmo.js
	aws s3 cp src/drawing/drawAudioViz.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawAudioViz.js
	aws s3 cp src/drawing/drawBackground.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawBackground.js
	aws s3 cp src/drawing/drawBrain.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawBrain.js
	aws s3 cp src/drawing/drawBvh.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawBvh.js
	aws s3 cp src/drawing/drawCards.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawCards.js
	aws s3 cp src/drawing/drawChart.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawChart.js
	aws s3 cp src/drawing/drawChemistry.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawChemistry.js
	aws s3 cp src/drawing/drawChess.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawChess.js
	aws s3 cp src/drawing/drawCity.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawCity.js
	aws s3 cp src/drawing/drawClustering.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawClustering.js
	aws s3 cp src/drawing/drawComplex.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawComplex.js
	aws s3 cp src/drawing/drawDrive.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawDrive.js
	aws s3 cp src/drawing/drawEXR.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawEXR.js
	aws s3 cp src/drawing/drawFamilyTree.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawFamilyTree.js
	aws s3 cp src/drawing/drawFarm.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawFarm.js
	aws s3 cp src/drawing/drawFloor.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawFloor.js
	aws s3 cp src/drawing/drawForce.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawForce.js
	aws s3 cp src/drawing/drawGame.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawGame.js
	aws s3 cp src/drawing/drawGeo.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawGeo.js
	aws s3 cp src/drawing/drawGLTF.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawGLTF.js
	aws s3 cp src/drawing/drawGraph.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawGraph.js
	aws s3 cp src/drawing/drawGround.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawGround.js
	aws s3 cp src/drawing/drawHouse.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawHouse.js
	aws s3 cp src/drawing/drawImage.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawImage.js
	aws s3 cp src/drawing/drawLights.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawLights.js
	aws s3 cp src/drawing/drawMonitor.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawMonitor.js
	aws s3 cp src/drawing/drawNetwork.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawNetwork.js
	aws s3 cp src/drawing/drawNeuro.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawNeuro.js
	aws s3 cp src/drawing/drawOrbits.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawOrbits.js
	aws s3 cp src/drawing/drawPeriodic.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawPeriodic.js
	aws s3 cp src/drawing/drawPhysics.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawPhysics.js
	aws s3 cp src/drawing/drawPlotFunction.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawPlotFunction.js
	aws s3 cp src/drawing/drawPresentation.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawPresentation.js
	aws s3 cp src/drawing/drawQuantum.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawQuantum.js
	aws s3 cp src/drawing/drawRoom.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawRoom.js
	aws s3 cp src/drawing/drawRubiksCube.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawRubiksCube.js
	aws s3 cp src/drawing/drawScreen.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawScreen.js
	aws s3 cp src/drawing/drawSheetMusic.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawSheetMusic.js
	aws s3 cp src/drawing/drawSkibidi.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawSkibidi.js
	aws s3 cp src/drawing/drawSmoke.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawSmoke.js
	aws s3 cp src/drawing/drawSvg.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawSvg.js
	aws s3 cp src/drawing/drawTown.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawTown.js
	aws s3 cp src/drawing/drawTV.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawTV.js
	aws s3 cp src/drawing/drawWalls.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawWalls.js
	aws s3 cp src/drawing/neuroGeometries.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/neuroGeometries.js
	aws s3 cp src/drawing/sceneItems.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/sceneItems.js

s3-data:
	aws s3 cp data/adventure1.json s3://$(BUCKET_NAME)/data/adventure1.json
	aws s3 cp data/adventure2.json s3://$(BUCKET_NAME)/data/adventure2.json
	aws s3 cp data/cards.json s3://$(BUCKET_NAME)/data/cards.json
	aws s3 cp data/cayley.json s3://$(BUCKET_NAME)/data/cayley.json
	aws s3 cp data/clustering.json s3://$(BUCKET_NAME)/data/clustering.json
	aws s3 cp data/data.json s3://$(BUCKET_NAME)/data/data.json
	aws s3 cp data/experimental.json s3://$(BUCKET_NAME)/data/experimental.json
	aws s3 cp data/experimental_1.json s3://$(BUCKET_NAME)/data/experimental_1.json
	aws s3 cp data/familytree.json s3://$(BUCKET_NAME)/data/familytree.json
	aws s3 cp data/force.json s3://$(BUCKET_NAME)/data/force.json
	aws s3 cp data/force3d.json s3://$(BUCKET_NAME)/data/force3d.json
	aws s3 cp data/forest.json s3://$(BUCKET_NAME)/data/forest.json
	aws s3 cp data/math.json s3://$(BUCKET_NAME)/data/math.json
	aws s3 cp data/music.json s3://$(BUCKET_NAME)/data/music.json
	aws s3 cp data/network.json s3://$(BUCKET_NAME)/data/network.json
	aws s3 cp data/periodic.json s3://$(BUCKET_NAME)/data/periodic.json
	aws s3 cp data/philpapers.json s3://$(BUCKET_NAME)/data/philpapers.json


s3-all: s3 s3-config s3-drawing s3-data s3-textures


# Sync sparingly

s3-textures:
	aws s3 cp src/textures/2k_neptune.jpg s3://$(BUCKET_NAME)/textures/2k_neptune.jpg
	aws s3 cp src/textures/2k_uranus.jpg s3://$(BUCKET_NAME)/textures/2k_uranus.jpg
	aws s3 cp src/textures/4k_venus_atmosphere.jpg s3://$(BUCKET_NAME)/textures/4k_venus_atmosphere.jpg
	aws s3 cp src/textures/8k_earth_daymap.jpg s3://$(BUCKET_NAME)/textures/8k_earth_daymap.jpg
	aws s3 cp src/textures/8k_jupiter.jpg s3://$(BUCKET_NAME)/textures/8k_jupiter.jpg
	aws s3 cp src/textures/8k_mars.jpg s3://$(BUCKET_NAME)/textures/8k_mars.jpg
	aws s3 cp src/textures/8k_mercury.jpg s3://$(BUCKET_NAME)/textures/8k_mercury.jpg
	aws s3 cp src/textures/8k_saturn.jpg s3://$(BUCKET_NAME)/textures/8k_saturn.jpg
	aws s3 cp src/textures/8k_stars.jpg s3://$(BUCKET_NAME)/textures/8k_stars.jpg
	aws s3 cp src/textures/8k_sun.jpg s3://$(BUCKET_NAME)/textures/8k_sun.jpg
	aws s3 cp src/textures/bookcase1.png s3://$(BUCKET_NAME)/textures/bookcase1.png
	aws s3 cp src/textures/bookcase2.png s3://$(BUCKET_NAME)/textures/bookcase2.png
	aws s3 cp src/textures/bookcase3.png s3://$(BUCKET_NAME)/textures/bookcase3.png
	aws s3 cp src/textures/bookcase4.png s3://$(BUCKET_NAME)/textures/bookcase4.png
	aws s3 cp src/textures/bookcase5.png s3://$(BUCKET_NAME)/textures/bookcase5.png
	aws s3 cp src/textures/bookcase6.png s3://$(BUCKET_NAME)/textures/bookcase6.png
	aws s3 cp src/textures/brick_bump.jpg s3://$(BUCKET_NAME)/textures/brick_bump.jpg
	aws s3 cp src/textures/brick_diffuse.jpg s3://$(BUCKET_NAME)/textures/brick_diffuse.jpg
	aws s3 cp src/textures/brick_roughness.jpg s3://$(BUCKET_NAME)/textures/brick_roughness.jpg
	aws s3 cp src/textures/Canestra_di_frutta_Caravaggio.jpg s3://$(BUCKET_NAME)/textures/Canestra_di_frutta_Caravaggio.jpg
	aws s3 cp src/textures/earth_atmos_2048.jpg s3://$(BUCKET_NAME)/textures/earth_atmos_2048.jpg
	aws s3 cp src/textures/earth_specular_2048.jpg s3://$(BUCKET_NAME)/textures/earth_specular_2048.jpg
	aws s3 cp src/textures/hardwood2_bump.jpg s3://$(BUCKET_NAME)/textures/hardwood2_bump.jpg
	aws s3 cp src/textures/hardwood2_diffuse.jpg s3://$(BUCKET_NAME)/textures/hardwood2_diffuse.jpg
	aws s3 cp src/textures/hardwood2_roughness.jpg s3://$(BUCKET_NAME)/textures/hardwood2_roughness.jpg
	aws s3 cp src/textures/sun_temple_stripe.jpg s3://$(BUCKET_NAME)/textures/sun_temple_stripe.jpg


# Sync sparingly

s3-short-vids:
	aws s3 cp src/textures/seagull.mp4 s3://$(BUCKET_NAME)/textures/seagull.mp4
	aws s3 cp src/textures/seagulls.mp4 s3://$(BUCKET_NAME)/textures/seagulls.mp4
	aws s3 cp src/textures/sunrise.mp4 s3://$(BUCKET_NAME)/textures/sunrise.mp4
	aws s3 cp src/textures/turtle.mp4 s3://$(BUCKET_NAME)/textures/turtle.mp4
	aws s3 cp src/textures/winnie-the-pooh-ariel.mp4 s3://$(BUCKET_NAME)/textures/winnie-the-pooh-ariel.mp4


# These are whole directories and/or larger files so only run them when you need them.

s3-bbb:
	aws s3 cp src/textures/BigBuckBunny.mp4 s3://$(BUCKET_NAME)/textures/BigBuckBunny.mp4

s3-brain:
	aws s3 sync src/imagery/brain/obj/ s3://$(BUCKET_NAME)/imagery/brain/obj/ --exclude "*" --include "*.obj"
	aws s3 sync src/imagery/brain/ply/ s3://$(BUCKET_NAME)/imagery/brain/ply/ --exclude "*" --include "*.ply"

s3-farm:
	aws s3 sync src/imagery/farm/ s3://$(BUCKET_NAME)/imagery/farm/ --exclude "*" --include "*.glb"

s3-pdb:
	aws s3 sync src/imagery/pdb/ s3://$(BUCKET_NAME)/imagery/pdb/ --exclude "*" --include "*.pdb"

s3-piano:
	aws s3 sync src/imagery/piano/ s3://$(BUCKET_NAME)/imagery/piano/

s3-skibidi:
	aws s3 sync src/imagery/skibidi/ s3://$(BUCKET_NAME)/imagery/skibidi/




s3-svg:
	aws s3 cp src/imagery/OpenProject_out_annotated.svg s3://$(BUCKET_NAME)/imagery/OpenProject_out_annotated.svg

s3-cards:
	aws s3 cp src/textures/cards/back_texture.png s3://$(BUCKET_NAME)/textures/cards/back_texture.png
	aws s3 cp src/textures/cards/standard/ s3://$(BUCKET_NAME)/textures/cards/standard/ --recursive

s3-glb:
	aws s3 cp src/imagery/humanoid.glb s3://$(BUCKET_NAME)/imagery/humanoid.glb
	aws s3 cp src/imagery/tv_sony_trinitron.glb s3://$(BUCKET_NAME)/imagery/tv_sony_trinitron.glb



# $env:PATH += ";C:\Program Files\Inkscape\bin"
convert-svg:
	inkscape --actions="file-open:src/imagery/$(SVG_NAME).svg; select-all; object-to-path; text-to-path; stroke-to-path; export-plain-svg:src/imagery/$(SVG_NAME).paths.svg; export-do; file-close"

py-svg:
	source .venv/Scripts/activate && python utils.py $(SVG_NAME)

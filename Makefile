include .env

INKSCAPE_PATH=C:/Program Files/Inkscape/bin/inkscape.exe

s3:
	aws s3 cp src/main.js s3://$(BUCKET_NAME)/scripts/threejs/main.js

s3-config:
	aws s3 cp src/config/sceneSetup.js s3://$(BUCKET_NAME)/scripts/threejs/config/sceneSetup.js
	aws s3 cp src/config/utils.js s3://$(BUCKET_NAME)/scripts/threejs/config/utils.js
	aws s3 cp src/config/uiPanelConfig.js s3://$(BUCKET_NAME)/scripts/threejs/config/uiPanelConfig.js
	aws s3 cp src/config/attachUIListeners.js s3://$(BUCKET_NAME)/scripts/threejs/config/attachUIListeners.js

s3-drawing:
	aws s3 cp src/drawing/chartConfig.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/chartConfig.js
	aws s3 cp src/drawing/adventure/drawAdventure.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/adventure/drawAdventure.js
	aws s3 cp src/drawing/adventure/interactions.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/adventure/interactions.js
	aws s3 cp src/drawing/adventure/helpers.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/adventure/helpers.js
	aws s3 cp src/drawing/adventure/createItems.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/adventure/createItems.js
	aws s3 cp src/drawing/adventure/styleDefs.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/adventure/styleDefs.js
	aws s3 cp src/drawing/library/drawLibrary.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/library/drawLibrary.js
	aws s3 cp src/drawing/library/calculatePosition.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/library/calculatePosition.js
	aws s3 cp src/drawing/library/sortResources.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/library/sortResources.js
	aws s3 cp src/drawing/drawBackground.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawBackground.js
	aws s3 cp src/drawing/drawCards.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawCards.js
	aws s3 cp src/drawing/drawChart.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawChart.js
	aws s3 cp src/drawing/drawChess.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawChess.js
	aws s3 cp src/drawing/drawClustering.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawClustering.js
	aws s3 cp src/drawing/drawFloor.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawFloor.js
	aws s3 cp src/drawing/drawGeo.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawGeo.js
	aws s3 cp src/drawing/drawGraph.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawGraph.js
	aws s3 cp src/drawing/drawImage.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawImage.js
	aws s3 cp src/drawing/drawLights.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawLights.js
	aws s3 cp src/drawing/drawOrbits.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawOrbits.js
	aws s3 cp src/drawing/drawPlotFunction.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawPlotFunction.js
	aws s3 cp src/drawing/drawPresentation.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawPresentation.js
	aws s3 cp src/drawing/drawQuantum.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawQuantum.js
	aws s3 cp src/drawing/drawRoom.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawRoom.js
	aws s3 cp src/drawing/drawRubiksCube.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawRubiksCube.js
	aws s3 cp src/drawing/drawSheetMusic.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawSheetMusic.js
	aws s3 cp src/drawing/drawSvg.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawSvg.js
	aws s3 cp src/drawing/drawWalls.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawWalls.js
	aws s3 cp src/drawing/sceneItems.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/sceneItems.js

s3-data:
	aws s3 cp data/adventure1.json s3://$(BUCKET_NAME)/data/adventure1.json
	aws s3 cp data/adventure2.json s3://$(BUCKET_NAME)/data/adventure2.json
	aws s3 cp data/data.json s3://$(BUCKET_NAME)/data/data.json
	aws s3 cp data/experimental.json s3://$(BUCKET_NAME)/data/experimental.json
	aws s3 cp data/experimental_1.json s3://$(BUCKET_NAME)/data/experimental_1.json
	aws s3 cp data/music.json s3://$(BUCKET_NAME)/data/music.json
	aws s3 cp data/cayley.json s3://$(BUCKET_NAME)/data/cayley.json
	aws s3 cp data/force.json s3://$(BUCKET_NAME)/data/force.json

s3-textures:
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
	aws s3 cp src/textures/8k_earth_daymap.jpg s3://$(BUCKET_NAME)/textures/8k_earth_daymap.jpg
	aws s3 cp src/textures/bookcase1.png s3://$(BUCKET_NAME)/textures/bookcase1.png
	aws s3 cp src/textures/bookcase2.png s3://$(BUCKET_NAME)/textures/bookcase2.png
	aws s3 cp src/textures/bookcase3.png s3://$(BUCKET_NAME)/textures/bookcase3.png
	aws s3 cp src/textures/bookcase4.png s3://$(BUCKET_NAME)/textures/bookcase4.png
	aws s3 cp src/textures/bookcase5.png s3://$(BUCKET_NAME)/textures/bookcase5.png
	aws s3 cp src/textures/bookcase6.png s3://$(BUCKET_NAME)/textures/bookcase6.png

s3-svg:
	aws s3 cp src/imagery/OpenProject_out_annotated.svg s3://$(BUCKET_NAME)/imagery/OpenProject_out_annotated.svg

s3-all: s3 s3-config s3-drawing s3-data s3-textures s3-svg


s3-cards:
	aws s3 cp src/textures/cards/back_texture.png s3://$(BUCKET_NAME)/textures/cards/back_texture.png
	aws s3 cp src/textures/cards/standard/ s3://$(BUCKET_NAME)/textures/cards/standard/ --recursive



#SVG_NAME=OpenProject
SVG_NAME=Knowledge

# $env:PATH += ";C:\Program Files\Inkscape\bin"
convert-svg:
	inkscape --actions="file-open:src/imagery/$(SVG_NAME).svg; select-all; object-to-path; text-to-path; stroke-to-path; export-plain-svg:src/imagery/$(SVG_NAME).paths.svg; export-do; file-close"

py-svg:
	source .venv/Scripts/activate && python utils.py $(SVG_NAME)

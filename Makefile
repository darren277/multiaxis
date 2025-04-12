include .env

s3:
	aws s3 cp src/main.js s3://$(BUCKET_NAME)/scripts/threejs/main.js

s3-config:
	aws s3 cp src/config/sceneSetup.js s3://$(BUCKET_NAME)/scripts/threejs/config/sceneSetup.js
	aws s3 cp src/config/utils.js s3://$(BUCKET_NAME)/scripts/threejs/config/utils.js
	aws s3 cp src/config/uiPanelConfig.js s3://$(BUCKET_NAME)/scripts/threejs/config/uiPanelConfig.js
	aws s3 cp src/config/attachUIListeners.js s3://$(BUCKET_NAME)/scripts/threejs/config/attachUIListeners.js

s3-drawing:
	aws s3 cp src/drawing/chartConfig.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/chartConfig.js
	aws s3 cp src/drawing/drawAdventure.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawAdventure.js
	aws s3 cp src/drawing/drawBackground.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawBackground.js
	aws s3 cp src/drawing/drawChart.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawChart.js
	aws s3 cp src/drawing/drawFloor.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawFloor.js
	aws s3 cp src/drawing/drawGraph.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawGraph.js
	aws s3 cp src/drawing/drawImage.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawImage.js
	aws s3 cp src/drawing/drawLights.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawLights.js
	aws s3 cp src/drawing/drawPlotFunction.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawPlotFunction.js
	aws s3 cp src/drawing/drawPresentation.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawPresentation.js
	aws s3 cp src/drawing/drawSheetMusic.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawSheetMusic.js
	aws s3 cp src/drawing/drawWalls.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawWalls.js
	aws s3 cp src/drawing/sceneItems.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/sceneItems.js

s3-data:
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

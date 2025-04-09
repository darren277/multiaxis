include .env

s3:
	aws s3 cp src/main.js s3://$(BUCKET_NAME)/scripts/threejs/main.js
	aws s3 cp src/config/sceneSetup.js s3://$(BUCKET_NAME)/scripts/threejs/config/sceneSetup.js
	aws s3 cp src/config/utils.js s3://$(BUCKET_NAME)/scripts/threejs/config/utils.js
	aws s3 cp src/config/drawPipelineConfig.js s3://$(BUCKET_NAME)/scripts/threejs/config/drawPipelineConfig.js
	aws s3 cp src/config/uiPanelConfig.js s3://$(BUCKET_NAME)/scripts/threejs/config/uiPanelConfig.js
	aws s3 cp src/config/attachUIListeners.js s3://$(BUCKET_NAME)/scripts/threejs/config/attachUIListeners.js
	aws s3 cp src/drawing/chartConfig.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/chartConfig.js
	aws s3 cp src/drawing/drawChart.js s3://$(BUCKET_NAME)/scripts/threejs/drawing/drawChart.js


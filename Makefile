include .env

INKSCAPE_PATH=C:/Program Files/Inkscape/bin/inkscape.exe

s3:
	aws s3 cp src/main.js s3://$(BUCKET_NAME)/scripts/threejs/main.js
	aws s3 cp src/drawings.js s3://$(BUCKET_NAME)/scripts/threejs/drawings.js


s3-data:
	aws s3 cp data/adventure1.json s3://$(BUCKET_NAME)/scripts/threejs/data/adventure1.json
	aws s3 cp data/adventure2.json s3://$(BUCKET_NAME)/scripts/threejs/data/adventure2.json
	aws s3 cp data/buildings.geojson s3://$(BUCKET_NAME)/scripts/threejs/data/buildings.geojson
	aws s3 cp data/cards.json s3://$(BUCKET_NAME)/scripts/threejs/data/cards.json
	aws s3 cp data/cayley.json s3://$(BUCKET_NAME)/scripts/threejs/data/cayley.json
	aws s3 cp data/clustering.json s3://$(BUCKET_NAME)/scripts/threejs/data/clustering.json
	aws s3 cp data/data.json s3://$(BUCKET_NAME)/scripts/threejs/data/data.json
	aws s3 cp data/experimental.json s3://$(BUCKET_NAME)/scripts/threejs/data/experimental.json
	aws s3 cp data/experimental_1.json s3://$(BUCKET_NAME)/scripts/threejs/data/experimental_1.json
	aws s3 cp data/familytree.json s3://$(BUCKET_NAME)/scripts/threejs/data/familytree.json
	aws s3 cp data/force.json s3://$(BUCKET_NAME)/scripts/threejs/data/force.json
	aws s3 cp data/force3d.json s3://$(BUCKET_NAME)/scripts/threejs/data/force3d.json
	aws s3 cp data/forest.json s3://$(BUCKET_NAME)/scripts/threejs/data/forest.json
	aws s3 cp data/math.json s3://$(BUCKET_NAME)/scripts/threejs/data/math.json
	aws s3 cp data/music.json s3://$(BUCKET_NAME)/scripts/threejs/data/music.json
	aws s3 cp data/network.json s3://$(BUCKET_NAME)/scripts/threejs/data/network.json
	aws s3 cp data/periodic.json s3://$(BUCKET_NAME)/scripts/threejs/data/periodic.json
	aws s3 cp data/philpapers.json s3://$(BUCKET_NAME)/scripts/threejs/data/philpapers.json


s3-all: s3 s3-config s3-drawing s3-data s3-textures


# Sync sparingly

s3-textures:
	aws s3 cp src/textures/2k_neptune.jpg s3://$(BUCKET_NAME)/scripts/threejs/textures/2k_neptune.jpg
	aws s3 cp src/textures/2k_uranus.jpg s3://$(BUCKET_NAME)/scripts/threejs/textures/2k_uranus.jpg
	aws s3 cp src/textures/4k_venus_atmosphere.jpg s3://$(BUCKET_NAME)/scripts/threejs/textures/4k_venus_atmosphere.jpg
	aws s3 cp src/textures/8k_earth_daymap.jpg s3://$(BUCKET_NAME)/scripts/threejs/textures/8k_earth_daymap.jpg
	aws s3 cp src/textures/8k_jupiter.jpg s3://$(BUCKET_NAME)/scripts/threejs/textures/8k_jupiter.jpg
	aws s3 cp src/textures/8k_mars.jpg s3://$(BUCKET_NAME)/scripts/threejs/textures/8k_mars.jpg
	aws s3 cp src/textures/8k_mercury.jpg s3://$(BUCKET_NAME)/scripts/threejs/textures/8k_mercury.jpg
	aws s3 cp src/textures/8k_saturn.jpg s3://$(BUCKET_NAME)/scripts/threejs/textures/8k_saturn.jpg
	aws s3 cp src/textures/8k_stars.jpg s3://$(BUCKET_NAME)/scripts/threejs/textures/8k_stars.jpg
	aws s3 cp src/textures/8k_sun.jpg s3://$(BUCKET_NAME)/scripts/threejs/textures/8k_sun.jpg
	aws s3 cp src/textures/bookcase1.png s3://$(BUCKET_NAME)/scripts/threejs/textures/bookcase1.png
	aws s3 cp src/textures/bookcase2.png s3://$(BUCKET_NAME)/scripts/threejs/textures/bookcase2.png
	aws s3 cp src/textures/bookcase3.png s3://$(BUCKET_NAME)/scripts/threejs/textures/bookcase3.png
	aws s3 cp src/textures/bookcase4.png s3://$(BUCKET_NAME)/scripts/threejs/textures/bookcase4.png
	aws s3 cp src/textures/bookcase5.png s3://$(BUCKET_NAME)/scripts/threejs/textures/bookcase5.png
	aws s3 cp src/textures/bookcase6.png s3://$(BUCKET_NAME)/scripts/threejs/textures/bookcase6.png
	aws s3 cp src/textures/brick_bump.jpg s3://$(BUCKET_NAME)/scripts/threejs/textures/brick_bump.jpg
	aws s3 cp src/textures/brick_diffuse.jpg s3://$(BUCKET_NAME)/scripts/threejs/textures/brick_diffuse.jpg
	aws s3 cp src/textures/brick_roughness.jpg s3://$(BUCKET_NAME)/scripts/threejs/textures/brick_roughness.jpg
	aws s3 cp src/textures/Canestra_di_frutta_Caravaggio.jpg s3://$(BUCKET_NAME)/scripts/threejs/textures/Canestra_di_frutta_Caravaggio.jpg
	aws s3 cp src/textures/earth_atmos_2048.jpg s3://$(BUCKET_NAME)/scripts/threejs/textures/earth_atmos_2048.jpg
	aws s3 cp src/textures/earth_specular_2048.jpg s3://$(BUCKET_NAME)/scripts/threejs/textures/earth_specular_2048.jpg
	aws s3 cp src/textures/hardwood2_bump.jpg s3://$(BUCKET_NAME)/scripts/threejs/textures/hardwood2_bump.jpg
	aws s3 cp src/textures/hardwood2_diffuse.jpg s3://$(BUCKET_NAME)/scripts/threejs/textures/hardwood2_diffuse.jpg
	aws s3 cp src/textures/hardwood2_roughness.jpg s3://$(BUCKET_NAME)/scripts/threejs/textures/hardwood2_roughness.jpg
	aws s3 cp src/textures/neighourhood.png s3://$(BUCKET_NAME)/scripts/threejs/scripts/threejs/textures/neighourhood.png
	aws s3 cp src/textures/sun_temple_stripe.jpg s3://$(BUCKET_NAME)/scripts/threejs/textures/sun_temple_stripe.jpg


# Sync sparingly

s3-short-vids:
	aws s3 cp src/textures/seagull.mp4 s3://$(BUCKET_NAME)/scripts/threejs/textures/seagull.mp4
	aws s3 cp src/textures/seagulls.mp4 s3://$(BUCKET_NAME)/scripts/threejs/textures/seagulls.mp4
	aws s3 cp src/textures/sunrise.mp4 s3://$(BUCKET_NAME)/scripts/threejs/textures/sunrise.mp4
	aws s3 cp src/textures/turtle.mp4 s3://$(BUCKET_NAME)/scripts/threejs/textures/turtle.mp4
	aws s3 cp src/textures/winnie-the-pooh-ariel.mp4 s3://$(BUCKET_NAME)/scripts/threejs/textures/winnie-the-pooh-ariel.mp4


# These are whole directories and/or larger files so only run them when you need them.

s3-bbb:
	aws s3 cp src/textures/BigBuckBunny.mp4 s3://$(BUCKET_NAME)/scripts/threejs/textures/BigBuckBunny.mp4

s3-brain:
	aws s3 sync src/imagery/brain/obj/ s3://$(BUCKET_NAME)/scripts/threejs/imagery/brain/obj/ --exclude "*" --include "*.obj"
	aws s3 sync src/imagery/brain/ply/ s3://$(BUCKET_NAME)/scripts/threejs/imagery/brain/ply/ --exclude "*" --include "*.ply"

s3-farm:
	aws s3 sync src/imagery/farm/ s3://$(BUCKET_NAME)/scripts/threejs/imagery/farm/ --exclude "*" --include "*.glb"

s3-pdb:
	aws s3 sync src/imagery/pdb/ s3://$(BUCKET_NAME)/scripts/threejs/imagery/pdb/ --exclude "*" --include "*.pdb"

s3-piano:
	aws s3 sync src/imagery/piano/ s3://$(BUCKET_NAME)/scripts/threejs/imagery/piano/

s3-skibidi:
	aws s3 sync src/imagery/skibidi/ s3://$(BUCKET_NAME)/scripts/threejs/imagery/skibidi/




s3-svg:
	aws s3 cp src/imagery/OpenProject_out_annotated.svg s3://$(BUCKET_NAME)/scripts/threejs/imagery/OpenProject_out_annotated.svg

s3-cards:
	aws s3 cp src/textures/cards/back_texture.png s3://$(BUCKET_NAME)/scripts/threejs/textures/cards/back_texture.png
	aws s3 cp src/textures/cards/standard/ s3://$(BUCKET_NAME)/scripts/threejs/textures/cards/standard/ --recursive

s3-glb:
	aws s3 cp src/imagery/humanoid.glb s3://$(BUCKET_NAME)/scripts/threejs/imagery/humanoid.glb
	aws s3 cp src/imagery/tv_sony_trinitron.glb s3://$(BUCKET_NAME)/scripts/threejs/imagery/tv_sony_trinitron.glb



# $env:PATH += ";C:\Program Files\Inkscape\bin"
convert-svg:
	inkscape --actions="file-open:src/imagery/$(SVG_NAME).svg; select-all; object-to-path; text-to-path; stroke-to-path; export-plain-svg:src/imagery/$(SVG_NAME).paths.svg; export-do; file-close"

py-svg:
	source .venv/Scripts/activate && python utils.py $(SVG_NAME)

build:
	python manage.py --build
	cp dist/x3dom-full.js ${TSINTERFACE}/static/
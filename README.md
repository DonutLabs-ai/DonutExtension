# Donut Command Bar Extension

## Building

1.  Clone repo
2.  `npm i`
3.  `npm run start` to start a dev server
4.  `npm run build` to build a production (minified) version

## Install into browser

1.  Build production version in step 4 above
2.  unzip produciton build in _zip_ directory `cd ./zip && unzip donut-extension-1.0.0.zip -d dist`
3.  Go to [_chrome://extensions_](chrome://extensions) in Google Chrome
4.  With the developer mode checkbox ticked, click **Load unpacked extension...** and select the _dist_ folder with unzipped contents from step 2

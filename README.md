# stellar-freighter-test

# Pre-requisites
Have installed Freighter Chrome Extension
https://chrome.google.com/webstore/detail/freighter/bcacfldlkkdogcmkkibnjlakofdplcbk

# Start App
Open the index.html in a live server 

# Editing Code
# Pre-requisites
Have Browserify installed globally with: npm i browserify -g


After Editing some code the following line must be runned in the bash: 
browserify ./src/main.js > ./dist/bundle.js -t babelify

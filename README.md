# radio-writing-tool
AI Co-Authoring tool for Radio Play

## Usage

### Basic HTML app

`npm install http-server -g`

`http-server` 

open `localhost:8080` in Safari (speechRec isn't working in edge)

### Node app with pm2

```
npm install pm2 -g
npm install -g express
```

### Setup
You need to create a .env file in the same folder as this code before running it. Should contain your OPENAI_API_KEY

.env

```
OPENAI_API_KEY=XXXXXX
```

### Running with pm2

Start the app:
```
pm2 start writing-tool.js
```

Inspect the log:
```
pm2 log writing-tool.js
```

Stop the writing tool:
```
pm2 stop writing-tool.js
```

## References
- Deploying p5 sketch with node: https://github.com/processing/p5.js/wiki/p5.js,-node.js,-socket.io

- PM2 to deploy a sketch: https://pm2.keymetrics.io/

# radio-writing-tool
AI Co-Authoring tool for live performance

<img src="https://github.com/roberttwomey/radio-writing-tool/assets/1598545/18170df0-b995-4de0-b2aa-fe152d1d0c72" width=800>

## Setup

### Clone the repository

```git clone https://github.com/roberttwomey/radio-writing-tool```

### Create an env file with your openai key

```
touch .env
```

In the file, copy the following text. Replace XXXXXX with your openai api key (copied from your openai account)

```
OPENAI_API_KEY=XXXXXX
```

### Node setup

Install node.js with homebrew
```
brew install node
```

Install node packages:
```
npm install http-server -g
npm install pm2 -g
npm install -g express
```

## Usage
Run it: 
```
node writing-server.js
``` 

*Visit in Browser*

open `localhost:8080` in Safari (speechRec doesn't work in edge)

<img width="800" alt="browser view of app with three columns" src="https://github.com/roberttwomey/radio-writing-tool/assets/1598545/cca785e4-cf63-4efc-a529-e0c34f678498">

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

## read logs

logs are in 
```
~/.pm2/logs
```

## Usage

Open in Browser (on mac, Safari or Chrome best implement webSpeech):


## References
- Deploying p5 sketch with node: https://github.com/processing/p5.js/wiki/p5.js,-node.js,-socket.io
- PM2 to deploy a sketch: https://pm2.keymetrics.io/

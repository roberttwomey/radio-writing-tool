# radio-writing-tool
AI Co-Authoring tool for live performance

## Setup

## Install Node and NPM

update package list:
```
sudo apt update
```

install node and npm: 
```
sudo apt install nodejs npm
```

follow onscreen prompts to restart daemons

**EDIT: that didn't work. do this instead**

remove old install
```
sudo apt purge nodejs npm
```

install nvm
```
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash
```

source nvm bashrc
```
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
```

install new node via nvm
```
nvm install node
```

this gets us a current version (v21.4.0)

reference: from here https://shandou.medium.com/upgrade-nodejs-on-ubuntu-amazon-ec2-e686646e5725


## Install our Code

**clone it**

```
git clone https://github.com/roberttwomey/radio-writing-tool/
```

```
cd radio-writing-tool
```

Checkout demo branch
```
git checkout medialab-demo
```

**Install all our dependencies**

```
npm install
```

## Set up environment

in the `radio-writing-tool/` folder, create `.env` file OpenAI Key info. Copy this from your local.

```
touch .env
```

In the file, copy the following text. Replace XXXXXX with your openai api key (copied from your openai account)

```
OPENAI_API_KEY=XXXXXX
```

```
echo "OPENAI_API_KEY=XXXXXX" > .env
```

# Usage

Run with node (standalone) or with pm2 (kind of as a service)

```
node writing-tool.js
```

or 

```
pm2 start writing-tool.js
```


*Visit in Browser*

Open `localhost:8080` in Browser (on mac, Safari or Chrome best implement webSpeech). (speechRec isn't working in edge)

## Running with pm2

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

Restart (if you made changes):
```
pm2 restart writing-tool.js
```

## read logs

logs are in 
```
~/.pm2/logs
```

## References
- Deploying p5 sketch with node: https://github.com/processing/p5.js/wiki/p5.js,-node.js,-socket.io
- PM2 to deploy a sketch: https://pm2.keymetrics.io/
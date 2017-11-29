# VISIT THE WIKI FOR INFO, AND SCREENSHOTS

Adding them right now, list of commands, functions, etc...


# SimpleDiscordBot

Simple Discord[bot] using JavaScript, for basic fuctions and watching over a discord server, usefull for PokemonGo servers... and others of course, with a little more development....

I wrote this long time ago for **SeattlePokeMaps**, but recently with the release (and success) of **SpoofNinja**, a lot of people have requested for the **HelpBot** release as well, so here it is... people can now stop inviting bots like "Celebi", "Dyno"... to their servers and have their own bot and customize it!

-I am **NO** a ["python","javascript","discord.js"] expert so I bet there are people out there that can make something better.

# REQUIREMENTS:

1) Node.js (https://nodejs.org/en/download/ `ver 8.4+`)

2) Discord.js (`npm install discord.js` « should be `ver 12.2+`) 

3) SQLite (`npm install sql`) 

4) Bot Token: https://discordapp.com/developers/applications/me  

5) And assign bot access to your server: https://discordapp.com/developers/tools/permissions-calculator
-with **Admin** role access, or... permissions to manage roles, channels, and messages... it's your bot, so it is safe!

<hr />

# SETTING IT UP:

1. Download `Node.js` (you probably have it already if running RocketMap/Monocle)

2. Create a folder where you will put the bot
   * Open command prompt in this location and:
   * `npm install discord.js` and then `npm install sql`

3. Create an applicaiton and get the your bot's secret token, and application ID at:
   * https://discordapp.com/developers/applications/me 

4. Get your application/bot to join your server by going here:
   * https://discordapp.com/developers/tools/permissions-calculator
   * Check the boxes for whatever level of power (permissions) you want your bot to have
     * Minimum requirements: manage roles, mannage channels, and manage messages
     * Manage roles, it will only be able to manage roles that are **below** his role/permissions
   * Use the URL that page generates and go to it, and you will be asked to log into your discord, have **Admin** access in order to get the bot to join that server.

<hr />

# LAUNCHING IT:

Using command prompt or bash: `node adminBot.js`
and then: `node userBot.js`

-If you close that window, the bot connection will be terminated!

**Optional**: you can install pm2 to have it run in the background

<hr />

# PM2:

PM2 allows you to run processes in the background, you can access PM2 from anywhere, but for a process to start it needs to come from the folder where the file is located.

`npm install pm2 -g`

`pm2 start adminBot.js`
`pm2 start userBot.js`

To modify the file and keep bot up-to-date (auto reloading):

`pm2 start adminBot.js --watch`

Other Commands:

`pm2 log` (display log)

`pm2 list` (display a list of running processes)

`pm2 stop NAME/ID`

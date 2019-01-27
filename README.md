# DiscordRoleBot

This bot was forked from SimpleDiscordBot that has been discontinued since Jan 29, 2018.

DiscordRoleBot uses JavaScript for automated management of temporary roles on a discord server. This bot is a modified version of SimpleDiscordBot for managing roles that are linked to subscribers.

# REQUIREMENTS:

1) Node.js (https://nodejs.org/en/download/ `ver 8.4+`)

2) Discord.js (`npm install discord.js` « should be `ver 11.3+`) 

3) SQLite (`npm install sqlite`) 

4) Bot Token: https://discordapp.com/developers/applications/me  

5) And assign bot access to your server: https://finitereality.github.io/permissions/?v=0
-with permissions to manage roles and send messages.

<hr />

# SETTING IT UP:

1. Download `Node.js` (you probably have it already if running RocketMap/Monocle).

2. Run `git clone https://github.com/Kneckter/SimpleDiscordBot` to copy the bot.

3. Open terminal and change into the new folder.

4. Run `npm install discord.js && npm install sqlite`.

5. Create an applicaiton and get the your bot's secret token, and application ID at:
   * https://discordapp.com/developers/applications/me 

6. Get your application/bot to join your server by going here:
   * https://discordapp.com/developers/tools/permissions-calculator
   * Check the boxes for the needed permissions
     * Minimum requirements: manage roles and send messages
     * Manage roles, it will only be able to manage roles that are **below** his role/permissions
   * Use the URL that page generates and go to it, and you will be asked to log into your discord. You will need **Admin** access in order to get the bot to join that server.

7. Fill out the information needed in `config.json` (use example or spm as example).
   * The mainChannelID could be a channel that only admin/mod/owner have access to. It reports expired roles. 
     * You can also use this channel to @usernames without them getting notified because people cannot see tags to channels they cannot access.

<hr />

# LAUNCHING IT:

Using terminal, run `node adminBot.js`

-If you close that window, the bot connection will be terminated!

# USAGE:

`!help`<br>
--`!check`   »   to check the time left on your subscription<br>
--`!map`   »   a link to our web map<br>
--`!subscribe`/`!paypal`   »   for a link to our PayPal<br>

`!help mods`<br>
--`!temprole @mention <DAYS> <ROLE-NAME>`   »   to assign a temporary roles<br>
--`!temprole check @mention`   »   to check the time left on a temporary role assignment<br>
--`!temprole remove @mention`   »   to remove a temporary role assignment<br>
--`!temprole add @mention <DAYS>`   »   to add more time to a temporary role assignment<br>

The bot will automatically check for expired roles every minute after startup. If it finds an expired role, it will remove it and notify the admins. If it finds a role that will expire in less than 5 days, it will notify the user through DM and the admins in their channel.

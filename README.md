# DiscordRoleBot

DiscordRoleBot uses JavaScript for automated management of temporary roles on a discord server. Now supporting multiple temp roles per user.
It also provides the ability to mass delete messages (even over the 2 week limit) from channels within a time range. 
There are also options for scheduling auto delete for different channels.

<hr />

# SETTING UP THE BOT:

1. Download `Node.js ver v12.18.3` from https://nodejs.org/en/download/

2. Run `git clone https://github.com/Kneckter/DiscordRoleBot` to copy the bot.

3. Change into the new folder `cd DiscordRoleBot/`.

4. Run `npm install`.

5. Copy the example file `cp config.json.example config.json`.

6. Create an applicaiton and get the your bot's secret token, and application ID at:
   * https://discordapp.com/developers/applications/me 

7. Get your application/bot to join your server by going here:
   * https://discordapp.com/developers/tools/permissions-calculator
   * Check the boxes for the needed permissions
     * Minimum requirements: manage roles, manage messages, send messages, read message history
     * Manage roles, it will only be able to manage roles that are **below** the bot's role/permissions
   * Use the URL that the page generates and go to it, and you will be asked to log into your discord. You will need **Admin** access in order to get the bot to join that server.

8. Fill out the information needed in `nano config.json`.
   * The mainChannelID could be a channel that only admin/mod/owner have access to. It reports expired roles. 
     * You can also use this channel to @usernames without them getting notified because people cannot see tags to channels they cannot access.

<hr />

# LAUNCHING IT:

Using terminal, run `node adminBot.js`

   * If you close that window, the bot connection will be terminated! You can add it to PM2 if you want it to run in the background.

Instead, add it to PM2 with `pm2 start ecosystem.config.js`

# USAGE:

`!help`<br>
--`!check`   »   to check the time left on your subscription<br>
--`!map`   »   a link to our web map<br>
--`!paypal`   »   for a link to our PayPal<br>

`!help mods`<br>
--`!temprole @mention <DAYS> <ROLE-NAME>`   »   to assign a temporary roles<br>
--`!temprole check @mention <ROLE-NAME>`   »   to check the time left on a temporary role assignment<br>
--`!temprole remove @mention <ROLE-NAME>`   »   to remove a temporary role assignment<br>
--`!temprole add @mention <DAYS> <ROLE-NAME>`   »   to add more time to a temporary role assignment<br>
--`!message <min-seconds> <max-seconds>`   »   to bulk delete messages. min and max are optional<br>

The bot will automatically check for expired roles every minute after startup. 
If it finds an expired role, it will remove it and notify the admins. 
If it finds a role that will expire in less than 5 days, it will notify the user through DM and the admins in their channel.

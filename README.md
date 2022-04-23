# DiscordRoleBot

DiscordRoleBot uses JavaScript for automated management of temporary roles on a discord server with the ability to support multiple temp roles per user.
This bot can also handle PayPal webhooks to receive notice of donations and assign a temp role based on the received information.
It also provides the ability to mass delete messages (even over the 2 week limit) from channels within a time range.
There are also options for scheduling auto delete for different channels.

<hr />

# SETTING UP THE BOT:

1. Download `Node.js ver v16.14.2` from https://nodejs.org/en/download/

2. Run `git clone https://github.com/Kneckter/DiscordRoleBot` to copy the bot.

3. Change into the new folder `cd DiscordRoleBot/`.

4. Run `npm install`.

5. Copy the example file `cp config.json.example config.json`.

6. Create an applicaiton and get the your bot's secret token, and application ID at:
   * https://discordapp.com/developers/applications/me

7. On the Bot page, enable `PRESENCE INTENT` and `SERVER MEMBERS INTENT` so the bot can message users and get a list of users on the server.

8. Get your application/bot to join your server by going here:
   * https://discordapp.com/developers/tools/permissions-calculator
   * Check the boxes for the needed permissions
     * Minimum requirements: manage roles, manage messages, send messages, read message history
     * Manage roles, it will only be able to manage roles that are **below** the bot's role/permissions
   * Use the URL that the page generates and go to it, and you will be asked to log into your discord. You will need **Admin** access in order to get the bot to join that server.

9. Fill out the information needed in `nano config.json`.
   * The mainChannelID could be a channel that only admin/mod/owner have access to. It reports expired roles.
     * You can also use this channel to @usernames without them getting notified because people cannot see tags to channels they cannot access.

10. Create a blank database in MariaDB or MySQL for the bot to use.
   * Log into mysql by running a command like `mysql -u root -p`
   * Create the blank DB with `CREATE DATABASE discord_role_bot;`
   * Grant access to the DB account with `GRANT ALL PRIVILEGES ON discord_role_bot.* TO 'username'@'localhost';`

<hr />

# SETTINGS

```
"token" - This is a string for the bot token from the Discord Dev portal.
"botID" - This is a string for the bot ID. Right click the bot to copy its ID.
"ownerID" - This is a string for the user ID of the person managing the bot. Right click their Discord username to copy its ID.
"serverID" - This is a string for the server ID. Right click the Discord server to copy its ID.
"cmdPrefix" - A single character used to identify commands that the bot should react to.
"adminRoleName" - This is a string for the name of the main role that will admin the bot.
"modRoleName" - This is an optional string for the name of any other role that will admin the bot.
"mapMain" - These settings are for enabling the "!map" command and giving people a link to the website.
"paypal" - These settings are for enabling the "!paypal" command and giving people a link to donate.
"donations" - These settings are for enabling the web server to listen for payment processing webhooks.
              Current supporting PayPal webhooks. You should leave the server address set to the local address and proxy pass to it from a reverse proxy.
              The client_ID and client_secret come from the PayPal Dev portal for the app.
              The merchant_id comes from PayPal and is used to ensure funds went to you and not someone else.
              The forcePaymentStatus option is used if your account is still under review and your payments are all going into pending status.
"db" - These settings are required and specify the DB server's settings.
"mainChannelID" - This is a string for the channel the bot will use to post all of its messages to. Right click the Discord channel to copy its ID.
"clearAtMidnight" - This is an array of strings for the channel the bot will clear messages from at midnight local time.
"clearEveryHourButSkip6am" - This is an array of strings for the channel the bot will clear messages from each hour but skip the messages from 6-7a.
"clearEvery5min" - This is an array of strings for the channel the bot will clear messages from every 5 minutes.
"clearWeeklyOnThursday630" - This is an array of strings for the channel the bot will clear messages from at 6:30a on Thursdays only.
"clearMonthlyAtMidnightDay1" - This is an array of strings for the channel the bot will clear messages from at midnight on the first day of the month only.
"restoreRoleOnJoin" - This is a string to enable the feature that restores a user's temp roles if they leave and rejoin the server.
"blockManualRoles" - This is a string to enable the feature that will remove roles that were manually added so only the ones with database records are kept.
"blockTheseRoles" - This is an array of strings for the role IDs that the blockManualRoles feature will check for manual assignments. Leave the array blank to watch all roles.
"daysNotice" - This is an int used to control how many days are left on a temp role before notifying the user that they will lose it.
```

# LAUNCHING IT

Using terminal, run `node adminBot.js`

   * If you close that window, the bot connection will be terminated! You can add it to PM2 if you want it to run in the background.

Instead, add it to PM2 with `pm2 start ecosystem.config.js`

# USAGE

`!help`<br>
--`!check <ROLE-NAME>`   »   to check the time left on your subscription<br>
--`!map`   »   a link to our web map<br>
--`!paypal`   »   for a link to our PayPal<br>

`!help mods`<br>
--`!temprole @mention <DAYS> <ROLE-NAME>`   »   to assign a temporary roles<br>
--`!temprole check @mention <ROLE-NAME>`   »   to check the time left on a temporary role assignment<br>
--`!temprole remove @mention <ROLE-NAME>`   »   to remove a temporary role assignment<br>
--`!temprole add @mention <ROLE-NAME> <DAYS>`   »   to add more time to a temporary role assignment<br>
--`!message <min-seconds> <max-seconds>`   »   to bulk delete messages. min and max are optional<br>

The bot will automatically check for expired roles every 10 minutes after startup.
If it finds an expired role, it will remove it and notify the admins.
If it finds a role that will expire in less than 5 days, it will notify the user through DM and the admins in their channel.
If it cannot find a user in the server that matches the ID in the database, it will notify the admins.

# DONATIONS

The donations feature is for processing webhooks from payment companies. Currently supporting PayPal webhooks. This only supports the `CHECKOUT.ORDER.APPROVED` and `PAYMENT.CAPTURE.COMPLETED` webhooks.
An example PayPal PHP page is included in the `donate.php` file. This PHP page is meant to be used in the root of a PMSF (https://github.com/pmsf/PMSF) folder and its config file copied to the ./config/ folder.
Since PMSF sets up the Discord account info, we use that info and send it to PayPal to be read in the webhook orders. Save the `donate_config_example.php` to `./config/donate_config.php` if you use the example page.

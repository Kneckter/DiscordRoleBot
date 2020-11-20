const Discord = require('discord.js');
const bot = new Discord.Client();
const config = require('./config.json');
const schedule = require('node-schedule');
const sqlite3 = require('sqlite3');
var sql = new sqlite3.Database('./dataBase.sqlite');
const wait = async ms => new Promise(done => setTimeout(done, ms));

// log our bot in
bot.login(config.token);

bot.on('ready', () => {
    console.info(GetTimestamp() + '-- DISCORD ROLE BOT IS READY --');
    // CREATE DATABASE TABLE IF NEEDED
    CreateDB();
});

// ##########################################################################
// ############################# SERVER LISTENER ############################
// ##########################################################################
// DATABASE TIMER FOR TEMPORARY ROLES
setInterval(function() {
    let timeNow = new Date().getTime();
    let dbTime = "";
    let daysLeft = "";
    let notify = "";
    sql.all(`SELECT * FROM temporary_roles`, (err, rows) => {
        if(err) {
            console.error(err.message);
        }
        if(!rows) {
            return console.info("No one is in the DataBase");
        }
        else {
            for(rowNumber = "0"; rowNumber < rows.length; rowNumber++) {
                let member = [];
                dbTime = rows[rowNumber].endDate;
                notify = rows[rowNumber].notified;
                daysLeft = (dbTime * 1) - (timeNow * 1);
                let rName = bot.guilds.cache.get(config.serverID).roles.cache.find(rName => rName.name === rows[rowNumber].temporaryRole);
                member = bot.guilds.cache.get(config.serverID).members.cache.get(rows[rowNumber].userID);
                /*console.log("member.user.username: "+member.user.username);
                console.log("timeNow: "+timeNow);
                console.log("dbTime: "+dbTime);
                console.log("daysLeft: "+daysLeft);*/
                // CHECK IF THEIR ACCESS HAS EXPIRED
                if(daysLeft < 1) {
                    if(!member) {
                        try {
                            member.user.username = "<@" + rows[rowNumber].userID + ">";
                            member.id = rows[rowNumber].userID;
                        }
                        catch (err) {
                            console.error(GetTimestamp() + "Failed to find a user for ID: " + rows[rowNumber].userID + ". They may have left the server.");
                            bot.channels.cache.get(config.mainChannelID).send("**⚠ Could not find a user for ID: " +
                                rows[rowNumber].userID + ". They may have left the server.**").catch(console.error);
                            continue;
                        }
                    }
                    // REMOVE ROLE FROM MEMBER IN GUILD
                    member.roles.remove(rName).then(member => {
                        bot.channels.cache.get(config.mainChannelID).send("⚠ " + member.user.username + " has **lost** their role of: **" +
                            rName.name + "** - their **temporary** access has __EXPIRED__ 😭 ").catch(console.error);
                        // REMOVE DATABASE ENTRY
                        sql.run(`DELETE FROM temporary_roles WHERE userID='${member.id}' AND temporaryRole='${rName.name}'`, (err) => {
                            if(err) {
                                console.error(err.message);
                            }
                        });
                        console.log(GetTimestamp() + "[ADMIN] [TEMPORARY-ROLE] \"" + member.user.username + "\" (" + member.id +
                            ") have lost their role: " + rName.name + "... time EXPIRED");
                    }).catch(error => {
                        console.error(error.message);
                        bot.channels.cache.get(config.mainChannelID).send("**⚠ Could not remove the " +
                            rName.name + " role from " + member.user.username + "!**").catch(console.error);
                    });
                }
                // CHECK IF THERE ARE ONLY HAVE 5 DAYS LEFT
                if(daysLeft < 432000000 && notify == "0") {
                    if(!member) {
                        try {
                            member.user.username = "<@" + rows[rowNumber].userID + ">";
                            member.id = rows[rowNumber].userID;
                        }
                        catch (err) {
                            console.error(GetTimestamp() + "Failed to find a user for ID: " + rows[rowNumber].userID + ". They may have left the server.");
                            bot.channels.cache.get(config.mainChannelID).send("**⚠ Could not find a user for ID: " +
                                rows[rowNumber].userID + ". They may have left the server.**").catch(console.error);
                            continue;
                        }
                    }
                    let endDateVal = new Date();
                    endDateVal.setTime(dbTime);
                    let finalDate = endDateVal.getFullYear() + "-" + (endDateVal.getMonth() + 1) + "-" + endDateVal.getDate() + " @" +
                        endDateVal.getHours() + ":" + endDateVal.getMinutes() + ":" + endDateVal.getSeconds();
                    // NOTIFY THE USER IN DM THAT THEY WILL EXPIRE
                    if(config.paypal.enabled === "yes") {
                        member.send("Hello " + member.user.username + "! Your role of **" + rows[rowNumber].temporaryRole + "** on " +
                            bot.guilds.cache.get(config.serverID).name + " will be removed in less than 5 days on " + finalDate +
                            ". If you would like to keep the role, please send a payment to <" + config.paypal.url +
                            ">. If you need help, please notify an admin. " +
                            "You can use the `!help` command on the server for more information.").catch(error => {
                            console.error(GetTimestamp() + "Failed to send a DM to user: " + member.id);
                        });
                    }
                    else {
                        member.send("Hello " + member.user.username + "! Your role of **" + rows[rowNumber].temporaryRole + "** on " +
                            bot.guilds.cache.get(config.serverID).name + " will be removed in less than 5 days on " + finalDate +
                            ". If you would like to keep the role, please notify an admin. " +
                            "You can use the `!help` command on the server for more information.").catch(error => {
                            console.error(GetTimestamp() + "Failed to send a DM to user: " + member.id);
                        });
                    }
                    // NOTIFY THE ADMINS OF THE PENDING EXPIRY
                    bot.channels.cache.get(config.mainChannelID).send("⚠ " + member.user.username + " will lose their role of: **" +
                        rName.name + "** in less than 5 days").catch(console.error);
                    // UPDATE THE DB TO REMEMBER THAT THEY WERE NOTIFIED
                    sql.run(`UPDATE temporary_roles SET notified=1 WHERE userID="${member.id}" AND temporaryRole="${rName.name}"`, (err) => {
                        if(err) {
                            console.error(err.message);
                        }
                    });
                    console.log(GetTimestamp() + "[ADMIN] [TEMPORARY-ROLE] \"" + member.user.username + "\" (" + member.id +
                        ") has been notified that they will lose their role (" + rName.name + ") in less than 5 days");
                }
            }
        }
    });
}, 600000);
// 86400000 = 1day
// 3600000 = 1hr
// 60000 = 1min

// ##########################################################################
// ############################## TEXT MESSAGE ##############################
// ##########################################################################
bot.on('message', message => {
    // MAKE SURE ITS A COMMAND
    if(!message.content.startsWith(config.cmdPrefix)) {
        return
    }
    //STOP SCRIPT IF DM/PM
    if(message.channel.type == "dm") {
        return
    }
    // GET CHANNEL INFO
    let g = message.guild;
    let c = message.channel;
    let m = message.member;
    let msg = message.content;
    msg = msg.toLowerCase();
    // GET TAGGED USER
    let mentioned = "";
    if(message.mentions.users.first()) {
        mentioned = message.mentions.users.first();
    }
    // REMOVE LETTER CASE (MAKE ALL LOWERCASE)
    let command = msg.toLowerCase();
    command = command.split(" ")[0];
    command = command.slice(config.cmdPrefix.length);
    // GET ARGUMENTS
    let args = msg.split(" ").slice(1);
    skip = "no";
    // GET ROLES FROM CONFIG
    let AdminR = g.roles.cache.find(role => role.name === config.adminRoleName);
    if(!AdminR) {
        AdminR = {
            "id": "111111111111111111"
        };
        console.info(GetTimestamp() + "[ERROR] [CONFIG] I could not find admin role: " + config.adminRoleName);
    }
    let ModR = g.roles.cache.find(role => role.name === config.modRoleName);
    if(!ModR) {
        ModR = {
            "id": "111111111111111111"
        };
        console.info(GetTimestamp() + "[ERROR] [CONFIG] I could not find mod role: " + config.modRoleName);
    }
    // ############################################################################
    // ################################ COMMANDS ##################################
    // ############################################################################
    // ############################# COMMANDS/HELP ################################
    if(command === "commands" || command === "help") {
        message.delete();
        if(args[0] === "mods") {
            if(m.roles.cache.has(ModR.id) || m.roles.cache.has(AdminR.id)) {
                cmds = "`!temprole @mention <DAYS> <ROLE-NAME>`   \\\u00BB   to assign a temporary roles\n" +
                    "`!temprole check @mention <ROLE-NAME>`   \\\u00BB   to check the time left on a temporary role assignment\n" +
                    "`!temprole remove @mention <ROLE-NAME>`   \\\u00BB   to remove a temporary role assignment\n" +
                    "`!temprole add @mention <ROLE-NAME> <DAYS>`   \\\u00BB   to add more time to a temporary role assignment\n" +
                    "`!message <min-seconds> <max-seconds>`   \\\u00BB   to bulk delete messages. min and max are optional\n"
            }
            else {
                message.reply("You are **NOT** allowed to use this command! \ntry using: `!commads`").then((message) => {
                    message.delete({
                        timeout: 10000
                    });
                }).catch(console.error);
                return;
            }
        }
        if(!args[0]) {
            cmds = "`!check`   \\\u00BB   to check the time left on your subscription\n"
            if(config.mapMain.enabled === "yes") {
                cmds += "`!map`   \\\u00BB   a link to our web map\n"
            }
            if(config.paypal.enabled === "yes") {
                cmds += "`!paypal`   \\\u00BB   for a link to our PayPal\n"
            }
        }
        c.send(cmds).then((message) => {
            message.delete({
                timeout: 10000
            });
        }).catch(console.error);
        return;
    }
    // ######################### PAYPAL/SUBSCRIBE ########################
    if(command === "paypal") {
        if(config.paypal.enabled === "yes") {
            let embedMSG = {
                'color': 0xFF0000,
                'title': 'Please visit PayPal to donate',
                'url': config.paypal.url,
                'thumbnail': {
                    'url': config.paypal.img
                },
                'description': 'Thank you! \nYour support is greatly appreciated.'
            };
            message.delete();
            m.send({
                embed: embedMSG
            }).catch(console.error);
            return;
        }
    }
    // ############################## TEMPORARY ROLES ##############################
    if(command === "tr") {
        // ROLES ARE CASE SENSITIVE TO RESET MESSAGE AND ARGUMENTS
        msg = message.content;
        args = msg.split(" ").slice(1);
        if(m.roles.cache.has(ModR.id) || m.roles.cache.has(AdminR.id) || m.id === config.ownerID) {
            if(!args[0]) {
                message.reply("syntax:\n `!temprole @mention <DAYS> <ROLE-NAME>`,\n or `!temprole remove @mention role`\n or `!temprole check @mention role`");
                return;
            }
            else if(!mentioned) {
                message.reply("please `@mention` a person you want me to check/add/remove a role for");
                return;
            }
            else if(!args[2]) {
                message.reply("incomplete data, please try: \n `!temprole @mention <DAYS> <ROLE-NAME>`,\n `!temprole remove @mention role`\n `!temprole check @mention role`\n `!temprole add @mention role 2`");
                return;
            }
            else {
                let dateMultiplier = 86400000;
                // ROLES WITH SPACES
                let daRole = "";
                if(args[0] === "add") {
                    // Count args and the last is the days then 2-x are roles
                    for(var x = 2; x < args.length - 1; x++) {
                        daRole += args[x] + " ";
                    }
                    daRole = daRole.slice(0, -1);
                    days = args[args.length - 1]
                }
                else {
                    for(var x = 2; x < args.length; x++) {
                        daRole += args[x] + " ";
                    }
                    daRole = daRole.slice(0, -1);
                }
                // CHECK ROLE EXIST
                let rName = g.roles.cache.find(rName => rName.name === daRole);
                if(!rName) {
                    message.reply("I couldn't find such role, please check the spelling and try again.");
                    return;
                }
                // CHECK DATABASE FOR ROLES
                if(args[0] === "check") {
                    sql.get(`SELECT * FROM temporary_roles WHERE userID="${mentioned.id}" AND temporaryRole="${daRole}"`, (err, row) => {
                        if(err) {
                            console.error(err.message);
                        }
                        if(!row) {
                            message.reply("⚠ [ERROR] " + mentioned.username + " is __NOT__ in the database for the role " + daRole);
                            return;
                        }
                        else {
                            let startDateVal = new Date();
                            startDateVal.setTime(row.startDate);
                            let startDateTime = startDateVal.getFullYear() + "-" + (startDateVal.getMonth() + 1) + "-" +
                                startDateVal.getDate() + " @" + startDateVal.getHours() + ":" + startDateVal.getMinutes() +
                                ":" + startDateVal.getSeconds();
                            let endDateVal = new Date();
                            endDateVal.setTime(row.endDate);
                            let finalDate = endDateVal.getFullYear() + "-" + (endDateVal.getMonth() + 1) + "-" + endDateVal.getDate() +
                                " @" + endDateVal.getHours() + ":" + endDateVal.getMinutes() + ":" + endDateVal.getSeconds();
                            return c.send("✅ " + mentioned.username + " will lose the role: **" + row.temporaryRole +
                                "** on: `" + finalDate + "`! They were added on: `" + startDateTime + "`");
                        }
                    });
                    return
                }
                // REMOVE MEMBER FROM DATABASE
                else if(args[0] === "remove") {
                    mentioned = message.mentions.members.first();
                    sql.get(`SELECT * FROM temporary_roles WHERE userID="${mentioned.id}" AND temporaryRole="${daRole}"`, (err, row) => {
                        if(err) {
                            console.error(err.message);
                        }
                        if(!row) {
                            return c.send("⚠ [ERROR] " + mentioned.displayName + " is __NOT__ in the database for the role " + daRole);
                        }
                        else {
                            let theirRole = g.roles.cache.find(theirRole => theirRole.name === row.temporaryRole);
                            mentioned.roles.remove(theirRole).catch(console.error);
                            sql.run(`DELETE FROM temporary_roles WHERE userID="${mentioned.id}" AND temporaryRole="${daRole}"`, (err) => {
                                if(err) {
                                    console.error(err.message);
                                }
                                console.log(GetTimestamp() + "[ADMIN] [TEMPORARY-ROLE] " + m.displayName + " (" + m.id + ")" + " removed the \"" + daRole + "\" role from \"" + mentioned.displayName + "\" (" + mentioned.id + ")");
                                c.send("⚠ " + mentioned.displayName + " has **lost** their role of: **" + theirRole.name + "** and has been removed from the database");
                                return;
                            });
                        }
                    });
                    return
                }
                // ADD TIME TO A USER
                else if(args[0] === "add") {
                    if(!daRole) {
                        message.reply("what role do you want to add time to?");
                        return;
                    }
                    if(!parseInt(days)) {
                        message.reply("Error: third value after the command has to be **X** number of days: `!tr add @" + mentioned.username + " Role 30`");
                        return;
                    }
                    else {
                        //mentioned=message.mentions.members.first();
                        sql.get(`SELECT * FROM temporary_roles WHERE userID="${mentioned.id}" AND temporaryRole="${daRole}"`, (err, row) => {
                            if(err) {
                                console.error(err.message);
                            }
                            if(!row) {
                                return c.send("⚠ [ERROR] " + mentioned.username + " is __NOT__ in the database for the role " + daRole);
                            }
                            else {
                                let startDateVal = new Date();
                                startDateVal.setTime(row.startDate);
                                let startDateTime = startDateVal.getFullYear() + "-" + (startDateVal.getMonth() + 1) + "-" +
                                    startDateVal.getDate() + " @" + startDateVal.getHours() + ":" + startDateVal.getMinutes() +
                                    ":" + startDateVal.getSeconds();
                                let endDateVal = new Date();
                                let finalDate = (parseInt(row.endDate) + parseInt((days) * (dateMultiplier)));
                                sql.run(`UPDATE temporary_roles SET endDate="${finalDate}", notified=0 WHERE userID="${mentioned.id}" AND temporaryRole="${daRole}"`, (err) => {
                                    if(err) {
                                        console.error(err.message);
                                    }
                                    endDateVal.setTime(finalDate);
                                    finalDate = endDateVal.getFullYear() + "-" + (endDateVal.getMonth() + 1) + "-" +
                                        endDateVal.getDate() + " @" + endDateVal.getHours() + ":" + endDateVal.getMinutes() +
                                        ":" + endDateVal.getSeconds();
                                    console.log(GetTimestamp() + "[ADMIN] [TEMPORARY-ROLE] \"" + mentioned.username + "\" (" + mentioned.id + ") was given " + days + " days by: " + m.displayName + " (" + m.id + ")");
                                    c.send("✅ " + mentioned.username + " has had time added until: `" + finalDate + "`! They were added on: `" + startDateTime + "`");
                                    return;
                                });
                            }
                        });
                        return;
                    }
                }
                else {
                    if(!parseInt(args[1])) {
                        message.reply("Error: second value after the command has to be **X** number of days, IE:\n`!" + command + " @" + mentioned.displayName + " 90 Role`");
                        return;
                    }
                    // ADD MEMBER TO DATASE, AND ADD THE ROLE TO MEMBER
                    sql.get(`SELECT * FROM temporary_roles WHERE userID="${mentioned.id}" AND temporaryRole="${daRole}"`, (err, row) => {
                        if(err) {
                            console.error(err.message);
                        }
                        mentioned = message.mentions.members.first();
                        if(!row) {
                            let curDate = new Date().getTime();
                            let finalDateDisplay = new Date();
                            let finalDate = ((args[1]) * (dateMultiplier));
                            finalDate = ((curDate) + (finalDate));
                            finalDateDisplay.setTime(finalDate);
                            finalDateDisplay = finalDateDisplay.getFullYear() + "-" + (finalDateDisplay.getMonth() + 1) + "-" +
                                finalDateDisplay.getDate() + " @" + finalDateDisplay.getHours() + ":" + finalDateDisplay.getMinutes() +
                                ":" + finalDateDisplay.getSeconds();
                            sql.run(`INSERT INTO temporary_roles (userID, temporaryRole, startDate, endDate, addedBy, notified) VALUES (?, ?, ?, ?, ?, 0)`,
                                [mentioned.user.id, daRole, curDate, finalDate, m.id], (err) => {
                                    if(err) {
                                        console.error(err.message);
                                    }
                                });
                            let theirRole = g.roles.cache.find(theirRole => theirRole.name === daRole);
                            mentioned.roles.add(theirRole).catch(console.error);
                            console.log(GetTimestamp() + "[ADMIN] [TEMPORARY-ROLE] \"" + mentioned.user.username + "\" (" + mentioned.user.id + ") was given the \"" + daRole + "\" role by " + m.user.username + " (" + m.id + ")");
                            c.send("🎉 " + mentioned.user.username + " has been given a **temporary** role of: **" + daRole + "**, enjoy! They will lose this role on: `" + finalDateDisplay + "`");
                            return;
                        }
                        else {
                            message.reply("this user already has the role **" + daRole + "** try using `!temprole remove @" + mentioned.displayName + "` if you want to change their role.");
                            return;
                        }
                    });
                }
            }
        }
        else {
            message.delete();
            message.reply("You are **NOT** allowed to use this command!").then((message) => {
                message.delete({
                    timeout: 10000
                });
            }).catch(console.error);
            return;
        }
    }
    // ############################## Delete Messages ##############################
    if(command === "message" || command === "messages") {
        msg = message.content;
        args = msg.split(" ").slice(1);
        if(m.roles.cache.has(ModR.id) || m.roles.cache.has(AdminR.id) || m.id === config.ownerID) {
            /*let channels = bot.channels.array();
            for (const channel of channels.values())
            {
                console.log(channel.guild + "," + channel.parent + "," + channel.name + "," + channel.id);
            }*/
            let MinSeconds = 0;
            let MaxSeconds = 999999999;
            if(args[0]) {
                MinSeconds = args[0];
            }
            if(args[1]) {
                MaxSeconds = args[1];
            }
            message.delete();
            DeleteBulkMessages(c, MinSeconds, MaxSeconds);
        }
        else {
            message.delete();
            message.reply("You are **NOT** allowed to use this command!").then((message) => {
                message.delete({
                    timeout: 10000
                });
            }).catch(console.error);
            return;
        }
    }
    // ############################## CHECK ##############################
    if(command === "check") {
        let dateMultiplier = 86400000;
        msg = message.content;
        args = msg.split(" ").slice(1);
        if(!args[0]) {
            message.delete();
            m.send("Please enter the role you want to check like `!check Trainer`");
            return;
        }
        // ROLES WITH SPACES
        let daRole = "";
        for(var x = 0; x < args.length; x++) {
            daRole += args[x] + " ";
        }
        daRole = daRole.slice(0, -1);
        // CHECK ROLE EXIST
        let rName = g.roles.cache.find(rName => rName.name === daRole);
        if(!rName) {
            message.reply("I couldn't find such role, please check the spelling and try again.");
            return;
        }
        // CHECK DATABASE FOR ROLES
        sql.get(`SELECT * FROM temporary_roles WHERE userID="${m.id}" AND temporaryRole="${daRole}"`, (err, row) => {
            if(err) {
                console.error(err.message);
            }
            if(!row) {
                message.delete();
                m.send("⚠ [ERROR] " + m.displayName + " is __NOT__ in the database for the role " + daRole);
                return;
            }
            else {
                let startDateVal = new Date();
                startDateVal.setTime(row.startDate);
                let startDateTime = startDateVal.getFullYear() + "-" + (startDateVal.getMonth() + 1) + "-" + startDateVal.getDate() +
                    " @" + startDateVal.getHours() + ":" + startDateVal.getMinutes() + ":" + startDateVal.getSeconds();
                let endDateVal = new Date();
                endDateVal.setTime(row.endDate);
                let finalDate = endDateVal.getFullYear() + "-" + (endDateVal.getMonth() + 1) + "-" + endDateVal.getDate() + " @" +
                    endDateVal.getHours() + ":" + endDateVal.getMinutes() + ":" + endDateVal.getSeconds();
                message.delete();
                m.send("✅ You will lose the role: **" + row.temporaryRole + "** on: `" + finalDate + "`! The role was added on: `" + startDateTime + "`");
                return;
            }
        });
        return;
    }
    // ######################### MAP ###################################
    if(command === "map") {
        if(config.mapMain.enabled === "yes") {
            message.delete();
            return m.send("Our official webmap: \n<" + config.mapMain.url + ">").catch(console.error);
        }
    }
});

function GetTimestamp() {
    let now = new Date();
    return "[" + now.toLocaleString() + "] ";
}

function RestartBot(type) {
    if(type == 'manual') {
        process.exit(1);
    }
    else {
        console.error(GetTimestamp() + "Unexpected error, bot stopping, likely websocket");
        process.exit(1);
    }
    return;
}

function CreateDB() {
    // CREATE DATABASE TABLE
    sql.run(`CREATE TABLE IF NOT EXISTS temporary_roles (userID TEXT, temporaryRole TEXT, startDate TEXT, endDate TEXT, addedBy TEXT, notified TEXT)`, (err) => {
        if(err) {
            console.error(err.message);
        }
    });
    return;
}

async function DeleteBulkMessages(channel, MinSeconds, MaxSeconds = 999999999) {
    let MinFlake = GetSnowFlake(MinSeconds);
    let MaxFlake = GetSnowFlake(MaxSeconds);
    let TwoWeeks = GetSnowFlake(1209600);
    if(MaxFlake < 0) {
        MaxFlake = 0
    }
    if(!channel) {
        console.error(GetTimestamp() + "Could not find a channel");
        return;
    }
    channel.messages.fetch({
        limit: 99,
        after: MaxFlake,
        before: MinFlake
    }).then(async messages => {
        let filterMessages = []
        //console.log(GetTimestamp() + "MinFlake: " + MinFlake + " MaxFlake: " + MaxFlake);
        for(const message of messages.values()) {
            //console.log(GetTimestamp()+"message.id: " + message.id);
            if(message.id > TwoWeeks && message.id < MinFlake && !message.deleted) {
                filterMessages.push(message)
            }
        }
        //console.log(GetTimestamp()+"filterMessages.length: " + filterMessages.length);
        //console.log(GetTimestamp()+"messages.size: " + messages.size);
        // Check if the messages between the min/max are in the 2-week range
        if(filterMessages.length > 0) {
            channel.bulkDelete(filterMessages).then(async deleted => {
                await wait(4000);
                DeleteBulkMessages(channel, MinSeconds, MaxSeconds);
            }).catch(async error => {
                console.error(GetTimestamp() + "Failed to bulk delete messages in " + channel.name + ". Trying single message delete.");
                await wait(4000);
                DeleteSingleMessages(channel, MinSeconds, MaxSeconds);
                return;
            });
        }
        // Check if there are still messages left in the fetch
        else if(filterMessages.length == 0 && messages.size > 0) {
            //console.log(GetTimestamp()+"There are "+messages.size+" messages in "+channel.name+" that cannot be cleared by bulk delete. Trying single message delete.");
            await wait(4000);
            DeleteSingleMessages(channel, MinSeconds, MaxSeconds);
        }
        else {
            //console.log(GetTimestamp()+"Finshed clearing channel with bulk delete: " + channel.name);
            return;
        }
    }).catch(error => {
        console.error(GetTimestamp() + "Failed to bulk delete messages in " + channel.name + ". Trying single message delete.");
        DeleteSingleMessages(channel, MinSeconds, MaxSeconds);
        return;
    });
}

async function DeleteSingleMessages(channel, MinSeconds, MaxSeconds = 999999999) {
    let MinFlake = GetSnowFlake(MinSeconds);
    let MaxFlake = GetSnowFlake(MaxSeconds);
    if(MaxFlake < 0) {
        MaxFlake = 0
    }
    channel.messages.fetch({
        limit: 99,
        after: MaxFlake,
        before: MinFlake
    }).then(async messages => {
        let filterMessages = []
        for(const message of messages.values()) {
            //console.log(GetTimestamp()+"message.id: " + message.id);
            if(message.id > MaxFlake && message.id < MinFlake && message.deleted == false) {
                filterMessages.push(message)
            }
        }
        if(filterMessages.length > 0) {
            for(const message of filterMessages.values()) {
                if(!message.deleted) {
                    //console.log(GetTimestamp()+"message.id: " + message.id);
                    message.delete().catch();
                    await wait(4000);
                }
            }
            DeleteSingleMessages(channel, MinSeconds, MaxSeconds);
        }
        else {
            //console.log(GetTimestamp()+"Finshed clearing channel with single delete: " + channel.name);
            return;
        }
    }).catch(error => {
        console.error(GetTimestamp() + "Failed to clear channel single messages in " + channel.name);
        return;
    });
}

function GetSnowFlake(seconds) {
    const toSnowflake = (date) => /:/.test(date) ? ((new Date(date).getTime() - 1420070400000) * Math.pow(2, 22)) : date;
    var date = new Date();
    var dateOffset = seconds * 1000;
    date.setTime(date.getTime() - dateOffset);
    //console.log(GetTimestamp()+"date: " + date);
    return toSnowflake(date);
}

// Run message clearing at midnight
schedule.scheduleJob('0 0 * * *', () => {
    if(config.clearAtMidnight.length > 0) {
        //console.log(GetTimestamp()+"Starting the midnight clearing");
        for(var i = 0; i < config.clearAtMidnight.length; i++) {
            let channel = bot.channels.cache.get(config.clearAtMidnight[i])
            DeleteBulkMessages(channel, 0);
        }
    }
});

// Run message clearing for hour-old messages every 5 minutes
schedule.scheduleJob('*/5 * * * *', () => {
    if(config.clearEvery5min.length > 0) {
        //console.log(GetTimestamp()+"Starting the clearEvery5min message clearing");
        for(var i = 0; i < config.clearEvery5min.length; i++) {
            let channel = bot.channels.cache.get(config.clearEvery5min[i])
            DeleteBulkMessages(channel, 3600);
        }
    }
});

// Run message clearing at the hour
// This skips 6am to keep the daily messages sent at that time
schedule.scheduleJob('0 * * * *', () => {
    if(config.clearEveryHourButSkip6am.length > 0) {
        //console.log(GetTimestamp()+"Starting the clearEveryHourButSkip6am message clearing");
        var d = new Date();
        var n = d.getHours();
        if(n >= 9 && n <= 21) {
            // Run message clearing for messages that cannot clear the 6am ones
            // 9am - 9pm (skipping 8am because we want to keep the 6a-7a stuff)
            let ms = 7200 //(n-7) * 3600 // Delete everything back to 7am
            for(var i = 0; i < config.clearEveryHourButSkip6am.length; i++) {
                let channel = bot.channels.cache.get(config.clearEveryHourButSkip6am[i])
                DeleteBulkMessages(channel, 3600, ms);
            }
        }
        else if(n == 22 || n == 23 || (n >= 0 && n <= 7)) {
            // Run message clearing for messages that can clear the 6am ones
            // 10pm - 7am because 7am's clearing will keep the 6am messages.
            for(var i = 0; i < config.clearEveryHourButSkip6am.length; i++) {
                let channel = bot.channels.cache.get(config.clearEveryHourButSkip6am[i])
                DeleteBulkMessages(channel, 3660);
            }
        }
    }
});

// Run message clearing for weekly messages on thursday at 6:30
schedule.scheduleJob('30 6 * * 4', () => {
    if(config.clearWeeklyOnThursday630.length > 0) {
        console.log(GetTimestamp() + "Starting the weekly message clearing");
        for(var i = 0; i < config.clearWeeklyOnThursday630.length; i++) {
            let channel = bot.channels.cache.get(config.clearWeeklyOnThursday630[i])
            DeleteBulkMessages(channel, 3600);
        }
    }
});

// Run message clearing for monthly messages on the 1st at midnight
schedule.scheduleJob('0 0 1 * *', () => {
    if(config.clearMonthlyAtMidnightDay1.length > 0) {
        console.log(GetTimestamp() + "Starting the monthly message clearing");
        for(var i = 0; i < config.clearMonthlyAtMidnightDay1.length; i++) {
            let channel = bot.channels.cache.get(config.clearMonthlyAtMidnightDay1[i])
            DeleteBulkMessages(channel, 3600);
        }
    }
});

bot.on('error', function(err) {
    if(typeof err == 'object') {
        err = JSON.stringify(err);
    }
    console.error(GetTimestamp() + 'Uncaught exception (error): ' + err);
    RestartBot();
    return;
});

process
    .on('unhandledRejection', (reason, p) => {
        console.error(reason, GetTimestamp() + 'Unhandled Rejection at Promise', p);
    })
    .on('uncaughtException', err => {
        if(err.code === "PROTOCOL_CONNECTION_LOST" || err.code === "ECONNRESET") {
            console.log(GetTimestamp() + "Lost connection to the DB server. Waiting for activity before reconnecting...");
            return;
        }
        else {
            console.error(err, GetTimestamp() + 'Uncaught Exception thrown');
            process.exit(1);
        }
    });

bot.on('disconnect', function(closed) {
    console.error(GetTimestamp() + 'Disconnected from Discord');
    return;
});

const { Client, Intents } = require('discord.js');
const myIntents = new Intents();
myIntents.add(Intents.FLAGS.GUILDS,
              Intents.FLAGS.GUILD_MEMBERS,
              Intents.FLAGS.GUILD_MESSAGES,
              Intents.FLAGS.DIRECT_MESSAGES);
const bot = new Client({ intents: myIntents });
const config = require('./config.json');
const schedule = require('node-schedule');
const express = require('express');
const helmet = require('helmet');
const app = express();
//const sqlite3 = require('sqlite3');
//const sql = new sqlite3.Database('./dataBase.sqlite');
const mysql = require('mysql');
const request = require('request');
const wait = async ms => new Promise(done => setTimeout(done, ms));
const dateMultiplier = 86400000;
const daysNotice = config.daysNotice * dateMultiplier;

// log our bot in
bot.login(config.token);

bot.on('ready', () => {
    console.info(GetTimestamp() + '-- DISCORD ROLE BOT IS READY --');
    // Create/Check DB tables
    SQLConnect().then(x => {
        InitDB();
    }).catch(err => {console.error(GetTimestamp()+err);});
});

(async () => {
    if (config.donations.enabled != "yes" ) {
        return;
    }
    // Basic security protection middleware
    app.use(helmet());

    // Body parsing middleware
    app.use(express.json({ limit: '10kb' }));

    // Parsing routes
    app.get('/', (req, res) => res.send('Listening...'));
    app.post('/', (req, res) => {
        const body = req.body;
        console.log(GetTimestamp()+'[Webhook Test] Received webhook payload: ', body);
        res.send('OK');
    });
    app.get('/paypal', (req, res) => {
        if (req.headers['x-forwarded-for'] || req.headers['x-real-ip']){
            var clientip = req.headers['x-forwarded-for'].split(', ')[0] || req.headers['x-real-ip'].split(', ')[0];
        }
        else {
            var clientip = 'unknown'
        }
        console.log(GetTimestamp()+'[PayPalGet] Someone stopped by from: ', clientip);
        res.send('Listening...');
    });
    app.post('/paypal', async (req, res) => {
        if (req.headers['x-forwarded-for'] || req.headers['x-real-ip']){
            var clientip = req.headers['x-forwarded-for'].split(', ')[0] || req.headers['x-real-ip'].split(', ')[0];
        }
        else {
            var clientip = 'unknown'
        }
        console.log(GetTimestamp()+'[PayPalPost] Incoming POST from: '+clientip+'. Body: '+JSON.stringify(req.body));
        await handlePayPalData(req, res);
    });
    app.get('/stripe', (req, res) => {
        if (req.headers['x-forwarded-for'] || req.headers['x-real-ip']){
            var clientip = req.headers['x-forwarded-for'].split(', ')[0] || req.headers['x-real-ip'].split(', ')[0];
        }
        else {
            var clientip = 'unknown'
        }
        console.log(GetTimestamp()+'[StripeGet] Someone stopped by from: ', clientip);
        res.send('Listening...');
    });
    app.post('/stripe', async (req, res) => {
        if (req.headers['x-forwarded-for'] || req.headers['x-real-ip']){
            var clientip = req.headers['x-forwarded-for'].split(', ')[0] || req.headers['x-real-ip'].split(', ')[0];
        }
        else {
            var clientip = 'unknown'
        }
        console.log(GetTimestamp()+'[StripePost] Incoming POST from: ', clientip);
        await handleStripeData(req, res);
    });
    app.listen(config.donations.port, config.donations.server, () => console.log(GetTimestamp()+`Listening on ${config.donations.server}:${config.donations.port}...`));
})();

// ##########################################################################
// ############################# SERVER LISTENER ############################
// ##########################################################################
// DATABASE TIMER FOR TEMPORARY ROLES
setInterval(async function() {
    // Process any outstanding donations before checking roles
    await query(`SELECT * FROM paypal_info WHERE fulfilled=0 AND rejection=0`)
        .then(async rows => {
            if(!rows[0]) {
                return;
            }

            // Get a bearer token so we can pull some data from PayPal
            let bearerToken = await getBearerToken();
            if (!bearerToken) {
                return;
            }

            for(rowNumber = "0"; rowNumber < rows.length; rowNumber++) {
                // Get the JSON and pull out the href to download the order info
                let orderID = rows[rowNumber].order_id;

                // Get the order details directly from PayPal so it is up-to-date
                let orderJSON = await getJSONData(bearerToken, `https://api.paypal.com/v2/checkout/orders/${orderID}`);
                if (!orderJSON) {
                    continue;
                }

                // Save some variables and write to the table
                processPayPalOrder(orderJSON, "RECHECK");
            }
        })
        .catch(err => {
            console.error(GetTimestamp()+`[InitDB] Failed to execute late payment query 1: (${err})`);
            process.exit(-1);
        });

    // Check everyone for expired time
    let timeNow = new Date().getTime();
    let dbTime = 0;
    let daysLeft = 0;
    let notify = 0;
    await query(`SELECT * FROM temporary_roles`)
        .then(async rows => {
            if(!rows[0]) {
                console.info(GetTimestamp() + "No one is in the DataBase");
                return;
            }
            for(rowNumber = "0"; rowNumber < rows.length; rowNumber++) {
                dbTime = parseInt(rows[rowNumber].endDate) * 1000;
                notify = rows[rowNumber].notified;
                daysLeft = dbTime - timeNow;
                let rName = bot.guilds.cache.get(config.serverID).roles.cache.find(rName => rName.name === rows[rowNumber].temporaryRole);
                let leftServer = rows[rowNumber].leftServer;
                if(!leftServer) {
                    // Grab the member info
                    var member = await getMember(rows[rowNumber].userID);
                    if(!rows[rowNumber].username) {
                        // Update usernames for legacy data
                        let name = member.user.username.replace(/[^a-zA-Z0-9]/g, '');
                        await query(`UPDATE temporary_roles SET username="${name}" WHERE userID="${member.id}"`)
                            .catch(err => {
                                console.error(GetTimestamp()+`[InitDB] Failed to execute role check query 4: (${err})`);
                            });
                        console.log(GetTimestamp() + "Updated the username for "+member.id+" to "+name);
                    }
                }
                // CHECK IF THEIR ACCESS HAS EXPIRED
                if(daysLeft < 1) {
                    // If they left the server, remove the entry without attempting the role removal
                    if(leftServer) {
                        await query(`DELETE FROM temporary_roles WHERE userID='${rows[rowNumber].userID}' AND temporaryRole='${rName.name}'`)
                            .catch(err => {
                                console.error(GetTimestamp()+`[InitDB] Failed to execute role check query 5: (${err})`);
                                process.exit(-1);
                            });
                        bot.channels.cache.get(config.mainChannelID).send("⚠ " + rows[rowNumber].username + " has **left** the server and **lost** their role of: **" +
                            rName.name + "** - their **temporary** access has __EXPIRED__ 😭 ").catch(err => {console.error(GetTimestamp()+err);});
                        console.log(GetTimestamp() + "[ADMIN] [TEMPORARY-ROLE] \"" + rows[rowNumber].username + "\" (" + rows[rowNumber].userID +
                            ") has left the server and lost their role: " + rName.name + "... time EXPIRED");
                        continue;
                    }
                    // REMOVE ROLE FROM MEMBER IN GUILD
                    member.roles.remove(rName).then(async member => {
                        bot.channels.cache.get(config.mainChannelID).send("⚠ " + member.user.username + " has **lost** their role of: **" +
                            rName.name + "** - their **temporary** access has __EXPIRED__ 😭 ").catch(err => {console.error(GetTimestamp()+err);});
                        // REMOVE DATABASE ENTRY
                        await query(`DELETE FROM temporary_roles WHERE userID='${member.id}' AND temporaryRole='${rName.name}'`)
                            .catch(err => {
                                console.error(GetTimestamp()+`[InitDB] Failed to execute role check query 2: (${err})`);
                                process.exit(-1);
                            });
                        console.log(GetTimestamp() + "[ADMIN] [TEMPORARY-ROLE] \"" + member.user.username + "\" (" + member.id +
                            ") have lost their role: " + rName.name + "... time EXPIRED");
                    }).catch(error => {
                        console.error(GetTimestamp() + error.message);
                        bot.channels.cache.get(config.mainChannelID).send("**⚠ Could not remove the " +
                            rName.name + " role from " + member.user.username + "!**").catch(err => {console.error(GetTimestamp()+err);});
                    });
                }
                // CHECK IF THERE ARE ONLY HAVE 5 DAYS LEFT
                if(daysLeft < daysNotice && notify == "0" && !leftServer) {
                    let endDateVal = new Date();
                    endDateVal.setTime(dbTime);
                    let finalDate = await formatTimeString(endDateVal);
                    // NOTIFY THE USER IN DM THAT THEY WILL EXPIRE
                    if(config.paypal.enabled == "yes") {
                        member.send("Hello " + member.user.username + "! Your role of **" + rows[rowNumber].temporaryRole + "** on " +
                            bot.guilds.cache.get(config.serverID).name + " will be removed in less than " + config.daysNotice + " days on \`" + finalDate +
                            "\`. If you would like to keep the role, please send a donation to <" + config.paypal.url +
                            ">. If you need help, please notify an admin.")
                        .catch(error => {
                            console.error(GetTimestamp() + "Failed to send a DM to user: " + member.id);
                        });
                    }
                    else {
                        member.send("Hello " + member.user.username + "! Your role of **" + rows[rowNumber].temporaryRole + "** on " +
                            bot.guilds.cache.get(config.serverID).name + " will be removed in less than " + config.daysNotice + " days on \`" + finalDate +
                            "\`. If you would like to keep the role, please notify an admin.")
                        .catch(error => {
                            console.error(GetTimestamp() + "Failed to send a DM to user: " + member.id);
                        });
                    }
                    // NOTIFY THE ADMINS OF THE PENDING EXPIRY
                    bot.channels.cache.get(config.mainChannelID).send("⚠ " + member.user.username + " will lose their role of: **" +
                        rName.name + "** in less than " + config.daysNotice + " days on \`" + finalDate+"\`.").catch(err => {console.error(GetTimestamp()+err);});
                    // UPDATE THE DB TO REMEMBER THAT THEY WERE NOTIFIED
                    let name = member.user.username.replace(/[^a-zA-Z0-9]/g, '');
                    await query(`UPDATE temporary_roles SET notified=1, username="${name}" WHERE userID="${member.id}" AND temporaryRole="${rName.name}"`)
                        .catch(err => {
                            console.error(GetTimestamp()+`[InitDB] Failed to execute role check query 3: (${err})`);
                            process.exit(-1);
                        });
                    console.log(GetTimestamp() + "[ADMIN] [TEMPORARY-ROLE] \"" + member.user.username + "\" (" + member.id +
                        ") has been notified that they will lose their role (" + rName.name + ") in less than " + config.daysNotice + " days on " + finalDate);
                }
            }
        })
        .catch(err => {
            console.error(GetTimestamp()+`[InitDB] Failed to execute role check query 1: (${err})`);
            process.exit(-1);
        });
}, 600000);
// 86400000 = 1day
// 3600000 = 1hr
// 60000 = 1min

// ##########################################################################
// ############################## TEXT MESSAGE ##############################
// ##########################################################################
bot.on('messageCreate', async message => {
    // MAKE SURE ITS A COMMAND
    if(!message.content.startsWith(config.cmdPrefix)) {
        return
    }
    //STOP SCRIPT IF DM/PM
    if(message.channel.type == "DM") {
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
                cmds = "`" + config.cmdPrefix + "temprole @mention <DAYS> <ROLE-NAME>`   \\\u00BB   to assign a temporary roles\n" +
                    "`" + config.cmdPrefix + "temprole check @mention <ROLE-NAME>`   \\\u00BB   to check the time left on a temporary role assignment\n" +
                    "`" + config.cmdPrefix + "temprole remove @mention <ROLE-NAME>`   \\\u00BB   to remove a temporary role assignment\n" +
                    "`" + config.cmdPrefix + "temprole add @mention <ROLE-NAME> <DAYS>`   \\\u00BB   to add more time to a temporary role assignment\n" +
                    "`" + config.cmdPrefix + "message <min-seconds> <max-seconds>`   \\\u00BB   to bulk delete messages. min and max are optional\n" +
                    "`" + config.cmdPrefix + "restart`   \\\u00BB   to manually restart the bot\n"
            }
            else {
                message.reply("You are **NOT** allowed to use this command! \ntry using: `" + config.cmdPrefix + "commands`").then((message) => {
                    setTimeout(() => message.delete(), 10000);
                }).catch(err => {console.error(GetTimestamp()+err);});
                return;
            }
        }
        if(!args[0]) {
            cmds = "`" + config.cmdPrefix + "check`   \\\u00BB   to check the time left on your subscription\n"
            if(config.mapMain.enabled == "yes") {
                cmds += "`" + config.cmdPrefix + "map`   \\\u00BB   a link to our web map\n"
            }
            if(config.paypal.enabled == "yes") {
                cmds += "`" + config.cmdPrefix + "paypal`   \\\u00BB   for a link to our PayPal\n"
            }
        }
        c.send(cmds).then((message) => {
            setTimeout(() => message.delete(), 10000);
        }).catch(err => {console.error(GetTimestamp()+err);});
        return;
    }
    // ######################### PAYPAL/SUBSCRIBE ########################
    if(command === "paypal") {
        if(config.paypal.enabled != "yes") {
            return;
        }
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
        m.send({ embed: embedMSG }).catch(err => {console.error(GetTimestamp()+err);});
        return;
    }
    // ############################## TEMPORARY ROLES ##############################
    if(command === "tr" || command === "temprole") {
        // ROLES ARE CASE SENSITIVE TO RESET MESSAGE AND ARGUMENTS
        msg = message.content;
        args = msg.split(" ").slice(1);
        if(m.roles.cache.has(ModR.id) || m.roles.cache.has(AdminR.id) || m.id === config.ownerID) {
            if(!args[0]) {
                message.reply("syntax:\n `" + config.cmdPrefix + "temprole @mention <DAYS> <ROLE-NAME>`,\n or `" + config.cmdPrefix + "temprole remove @mention role`\n or `" + config.cmdPrefix + "temprole check @mention role`");
                return;
            }
            else if(!mentioned) {
                message.reply("please `@mention` a person you want me to check/add/remove a role for");
                return;
            }
            else if(!args[2]) {
                message.reply("incomplete data, please try: \n `" + config.cmdPrefix + "temprole @mention <DAYS> <ROLE-NAME>`,\n `" + config.cmdPrefix + "temprole remove @mention role`\n `" + config.cmdPrefix + "temprole check @mention role`\n `" + config.cmdPrefix + "temprole add @mention role 2`");
                return;
            }
            else {
                // ROLES WITH SPACES
                let daRole = "";
                let days = 0;
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
                    await query(`SELECT * FROM temporary_roles WHERE userID="${mentioned.id}" AND temporaryRole="${daRole}"`)
                        .then(async row => {
                            if(!row[0]) {
                                message.reply("⚠ [ERROR] " + mentioned.username + " is __NOT__ in the database for the role " + daRole);
                                return;
                            }
                            let startDateVal = new Date();
                            startDateVal.setTime(row[0].startDate * 1000);
                            let startDateTime = await formatTimeString(startDateVal);
                            let endDateVal = new Date();
                            endDateVal.setTime(row[0].endDate * 1000);
                            let finalDate = await formatTimeString(endDateVal);
                            c.send("✅ " + mentioned.username + " will lose the role: **" + row[0].temporaryRole +
                                "** on: `" + finalDate + "`! They were added on: `" + startDateTime + "`");
                        })
                        .catch(err => {
                            console.error(GetTimestamp()+`[InitDB] Failed to execute query 9: (${err})`);
                            return;
                        });
                    return;
                }
                // REMOVE MEMBER FROM DATABASE
                else if(args[0] === "remove") {
                    mentioned = message.mentions.members.first(); // Changed mentioned here because we need the members object
                    await query(`SELECT * FROM temporary_roles WHERE userID="${mentioned.id}" AND temporaryRole="${daRole}"`)
                        .then(async row => {
                            if(!row[0]) {
                                c.send("⚠ [ERROR] " + mentioned.user.username + " is __NOT__ in the database for the role " + daRole);
                                return;
                            }
                            let theirRole = g.roles.cache.find(theirRole => theirRole.name === row[0].temporaryRole);
                            mentioned.roles.remove(theirRole).catch(err => {console.error(GetTimestamp()+err);});
                            await query(`DELETE FROM temporary_roles WHERE userID="${mentioned.id}" AND temporaryRole="${daRole}"`)
                                .then(async result => {
                                    console.log(GetTimestamp() + "[ADMIN] [TEMPORARY-ROLE] " + m.user.username + " (" + m.id + ")" + " removed the \"" + daRole + "\" role from \"" + mentioned.user.username + "\" (" + mentioned.id + ")");
                                    c.send("⚠ " + mentioned.user.username + " has **lost** their role of: **" + theirRole.name + "** and has been removed from the database");
                                })
                                .catch(err => {
                                    console.error(GetTimestamp()+`[InitDB] Failed to execute query 11: (${err})`);
                                    return;
                                });
                        })
                        .catch(err => {
                            console.error(GetTimestamp()+`[InitDB] Failed to execute query 10: (${err})`);
                            return;
                        });
                    return;
                }
                // ADD TIME TO A USER
                else if(args[0] === "add") {
                    if(!daRole) {
                        message.reply("What role do you want to add time to?");
                        return;
                    }
                    if(!Number(days)) {
                        message.reply("Error: The third value after the command has to be **X** number of days: `" + config.cmdPrefix + "tr add @" + mentioned.username + " Role 30`");
                        return;
                    }
                    await query(`SELECT * FROM temporary_roles WHERE userID="${mentioned.id}" AND temporaryRole="${daRole}"`)
                        .then(async row => {
                            if(!row[0]) {
                                c.send("⚠ [ERROR] " + mentioned.username + " is __NOT__ in the database for the role " + daRole);
                                return;
                            }
                            let startDateVal = new Date();
                            startDateVal.setTime(row[0].startDate * 1000);
                            let startDateTime = await formatTimeString(startDateVal);
                            let finalDate = Number(row[0].endDate * 1000) + Number(days * dateMultiplier);
                            let name = mentioned.username.replace(/[^a-zA-Z0-9]/g, '');
                            await query(`UPDATE temporary_roles SET endDate="${Math.round(finalDate / 1000)}", notified=0, username="${name}" WHERE userID="${mentioned.id}" AND temporaryRole="${daRole}"`)
                                .then(async result => {
                                    let endDateVal = new Date();
                                    endDateVal.setTime(finalDate);
                                    finalDate = await formatTimeString(endDateVal);
                                    console.log(GetTimestamp() + "[ADMIN] [TEMPORARY-ROLE] \"" + mentioned.username + "\" (" + mentioned.id + ") was given " + days + " days by: " + m.user.username + " (" + m.id + ") for the role: "+daRole);
                                    c.send("✅ " + mentioned.username + " has had time added until: `" + finalDate + "`! They were added on: `" + startDateTime + "`");
                                })
                                .catch(err => {
                                    console.error(GetTimestamp()+`[InitDB] Failed to execute query 14: (${err})`);
                                    return;
                                });
                        })
                        .catch(err => {
                            console.error(GetTimestamp()+`[InitDB] Failed to execute query 13: (${err})`);
                            return;
                        });
                    return;
                }
                else {
                    if(!Number(args[1])) {
                        message.reply("Error: Second value after the command has to be **X** number of days, IE:\n`" + config.cmdPrefix + command + " @" + mentioned.username + " 90 Role`");
                        return;
                    }
                    // ADD MEMBER TO DATASE, AND ADD THE ROLE TO MEMBER
                    await query(`SELECT * FROM temporary_roles WHERE userID="${mentioned.id}" AND temporaryRole="${daRole}"`)
                        .then(async row => {
                            mentioned = message.mentions.members.first();
                            if(!row[0]) {
                                let curDate = new Date().getTime();
                                let finalDateDisplay = new Date();
                                let finalDate = curDate + (Number(args[1]) * dateMultiplier);
                                finalDateDisplay.setTime(finalDate);
                                finalDateDisplay = await formatTimeString(finalDateDisplay);
                                let name = mentioned.user.username.replace(/[^a-zA-Z0-9]/g, '');
                                let values = mentioned.user.id+',\''
                                            +daRole+'\','
                                            +Math.round(curDate/1000)+','
                                            +Math.round(finalDate/1000)+','
                                            +m.id
                                            +', 0'+',\''
                                            +name+'\', 0';
                                await query(`INSERT INTO temporary_roles VALUES(${values});`)
                                    .then(async result => {
                                        let theirRole = g.roles.cache.find(theirRole => theirRole.name === daRole);
                                        mentioned.roles.add(theirRole).catch(err => {console.error(GetTimestamp()+err);});
                                        console.log(GetTimestamp() + "[ADMIN] [TEMPORARY-ROLE] \"" + mentioned.user.username + "\" (" +
                                                    mentioned.user.id + ") was given the \"" + daRole + "\" role by " + m.user.username + " (" + m.id + ")");
                                        c.send("🎉 " + mentioned.user.username + " has been given a **temporary** role of: **" + daRole +
                                               "**, enjoy! They will lose this role on: `" + finalDateDisplay + "`");
                                    })
                                    .catch(err => {
                                        console.error(GetTimestamp()+`[InitDB] Failed to execute query 16: (${err})`);
                                        return;
                                    });
                            }
                            else {
                                message.reply("This user already has the role **" + daRole + "** try using `" + config.cmdPrefix + "temprole remove @" + mentioned.user.username + " " + daRole + "` if you want to reset their role.");
                            }
                        })
                        .catch(err => {
                            console.error(GetTimestamp()+`[InitDB] Failed to execute query 15: (${err})`);
                            return;
                        });
                }
            }
        }
        else {
            message.delete();
            message.reply("You are **NOT** allowed to use this command!").then((message) => {
                setTimeout(() => message.delete(), 10000);
            }).catch(err => {console.error(GetTimestamp()+err);});
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
                setTimeout(() => message.delete(), 10000);
            }).catch(err => {console.error(GetTimestamp()+err);});
            return;
        }
    }
    // ############################## Restart Bot ##############################
    if(command === "restart") {
        if(m.roles.cache.has(ModR.id) || m.roles.cache.has(AdminR.id) || m.id === config.ownerID) {
            RestartBot("manual");
        }
        else {
            message.delete();
            message.reply("You are **NOT** allowed to use this command!").then((message) => {
                setTimeout(() => message.delete(), 10000);
            }).catch(err => {console.error(GetTimestamp()+err);});
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
            m.send("Please enter the role you want to check like `" + config.cmdPrefix + "check Trainer`");
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
        await query(`SELECT * FROM temporary_roles WHERE userID="${m.id}" AND temporaryRole="${daRole}"`)
            .then(async row => {
                if(!row[0]) {
                    message.delete();
                    m.send("⚠ [ERROR] " + m.user.username + " is __NOT__ in the database for the role " + daRole);
                    return;
                }
                let startDateVal = new Date();
                startDateVal.setTime(row[0].startDate*1000);
                let startDateTime = await formatTimeString(startDateVal);
                let endDateVal = new Date();
                endDateVal.setTime(row[0].endDate*1000);
                let finalDate = await formatTimeString(endDateVal);
                message.delete();
                m.send("✅ You will lose the role: **" + row[0].temporaryRole + "** on: `" + finalDate + "`! The role was added on: `" + startDateTime + "`");
            })
            .catch(err => {
                console.error(GetTimestamp()+`[InitDB] Failed to execute query 8: (${err})`);
                return;
            });
        return;
    }
    // ######################### MAP ###################################
    if(command === "map") {
        if(config.mapMain.enabled != "yes") {
            return;
        }
        message.delete();
        m.send("Our official webmap: \n<" + config.mapMain.url + ">").catch(err => {console.error(GetTimestamp()+err);});
        return;
    }
});

// Check for bot events other than messages
bot.on('guildMemberRemove', async member => {
    await guildMemberRemove(member);
});

bot.on('guildMemberAdd', async member => {
    // Add the role from the DB if they rejoin the server
    if (config.restoreRoleOnJoin != "yes") {
        return;
    }
    let guild = member.guild.id;
    if(guild != config.serverID) {
        return;
    }
    // Check the DB is the user has any entries
    await query(`SELECT * FROM temporary_roles WHERE userID="${member.id}"`)
        .then(async rows => {
            if(!rows[0]) {
                // No entries found so no temp roles to assign
                return;
            }
            // Iterate the rows and add the appropriate role to the user
            for(let rowNumber = "0"; rowNumber < rows.length; rowNumber++) {
                let rName = bot.guilds.cache.get(config.serverID).roles.cache.find(rName => rName.name === rows[rowNumber].temporaryRole);
                member.roles.add(rName).then(async member => {
                    let name = member.user.username.replace(/[^a-zA-Z0-9]/g, '');
                    console.log(GetTimestamp() + "[ADMIN] [TEMPORARY-ROLE] \"" + name + "\" (" + member.id + ") has rejoined the server. The " + rName.name + " temp role has been readded.");
                    bot.channels.cache.get(config.mainChannelID).send(":white_check_mark: " + name + " has rejoined the server. The " + rName.name + " temp role has been readded.");
                    // Update the database in case they were marked as leftServer
                    await query(`UPDATE temporary_roles SET leftServer = 0 WHERE userID='${member.id}' AND temporaryRole='${rName.name}'`)
                        .catch(err => {
                            console.error(GetTimestamp()+`[InitDB] Failed to execute query in guildMemberAdd 2: (${err})`);
                            process.exit(-1);
                        });
                }).catch(error => {
                    console.error(GetTimestamp() + error.message);
                    bot.channels.cache.get(config.mainChannelID).send("**⚠ Could not add the " + rName.name + " role to " + member.user.username + "!**")
                        .catch(err => {console.error(GetTimestamp()+err);});
                });
            }
        })
        .catch(err => {
            console.error(GetTimestamp()+`[InitDB] Failed to execute query in guildMemberAdd 1: (${err})`);
            return;
        });
});

bot.on('guildMemberUpdate', async (oldMember, newMember) => {
    // Used to stop users from adding roles without a database entry
    if (config.blockManualRoles != "yes") {
        return;
    }
    let guild = newMember.guild.id;
    if(guild != config.serverID) {
        return;
    }
    if(JSON.stringify(oldMember._roles) != JSON.stringify(newMember._roles)) {
        // If the arrays are different, check what role was added
        for(let num = "0"; num < newMember._roles.length; num++) {
            if (!oldMember._roles.includes(newMember._roles[num])) {
                if (config.blockTheseRoles[0]) {
                    if (!config.blockTheseRoles.includes(newMember._roles[num])) {
                        continue;
                    }
                }
                // If the role is not on the block list or there isn't a block list, check the database
                let rName = bot.guilds.cache.get(config.serverID).roles.cache.find(rName => rName.id === newMember._roles[num]);
                await wait(1 * 1000);
                await query(`SELECT * FROM temporary_roles WHERE userID="${newMember.user.id}" and temporaryRole="${rName.name}" LIMIT 1`)
                    .then(async rows => {
                        if(!rows[0]) {
                            // No entry so remove the role from the user
                            newMember.roles.remove(rName).then(async member => {
                                bot.channels.cache.get(config.mainChannelID).send("⚠ " + member.user.username + " has **lost** their role of: **" +
                                    rName.name + "** - it was manually added when that wasn't allowed").catch(err => {console.error(GetTimestamp()+err);});
                                console.log(GetTimestamp() + "[ADMIN] [TEMPORARY-ROLE] \"" + member.user.username + "\" (" + member.id +
                                    ") have lost their role: " + rName.name + "... it was manually added when that wasn't allowed");
                            }).catch(error => {
                                console.error(GetTimestamp() + error.message);
                                bot.channels.cache.get(config.mainChannelID).send("**⚠ Could not remove the " +
                                    rName.name + " role from " + newMember.user.username + "!**").catch(err => {console.error(GetTimestamp()+err);});
                            });
                        }
                    })
                    .catch(err => {
                        console.error(GetTimestamp()+`[InitDB] Failed to execute query in guildMemberUpdate 1: (${err})`);
                        return;
                    });
            }
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

bot.on('disconnect', function(closed) {
    console.error(GetTimestamp() + 'Disconnected from Discord');
    return;
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

async function InitDB() {
    // Create MySQL tabels
    let currVersion = 5;
    let dbVersion = 0;
    await query(`CREATE TABLE IF NOT EXISTS metadata (
                        \`key\` VARCHAR(50) PRIMARY KEY NOT NULL,
                        \`value\` VARCHAR(50) DEFAULT NULL);`)
        .then(async x => {
            await query(`SELECT \`value\` FROM metadata WHERE \`key\` = "DB_VERSION" LIMIT 1;`)
                .then(async result => {
                    //Save the DB version if one is returned
                    if (result.length > 0) {
                        dbVersion = parseInt(result[0].value);
                    }
                    console.log(GetTimestamp()+`[InitDB] DB version: ${dbVersion}, Latest: ${currVersion}`);
                    if (dbVersion < currVersion) {
                        for (dbVersion; dbVersion < currVersion; dbVersion++) {
                            if (dbVersion == 0) {
                                // Setup the temp roles table
                                console.log(GetTimestamp()+'[InitDB] Creating the initial tables');
                                await query(`CREATE TABLE IF NOT EXISTS temporary_roles (
                                        userID bigint(19) unsigned NOT NULL,
                                        temporaryRole varchar(35) NOT NULL,
                                        startDate int(11) unsigned NOT NULL,
                                        endDate int(11) unsigned NOT NULL,
                                        addedBy bigint(19) unsigned NOT NULL,
                                        notified tinyint(1) unsigned DEFAULT 0)`)
                                    .catch(err => {
                                        console.error(GetTimestamp()+`[InitDB] Failed to execute migration query ${dbVersion}b: (${err})`);
                                        process.exit(-1);
                                    });

                                // Migrate the old sqlite entries into the table
                                /*sql.all(`SELECT * FROM temporary_roles`, (err, rows) => {
                                    if (err) {
                                        console.error(GetTimestamp() + err.message);
                                    }
                                    else if (rows) {
                                        for(rowNumber = 0; rowNumber < rows.length; rowNumber++) {
                                            let values = rows[rowNumber].userID+',\''
                                                        +rows[rowNumber].temporaryRole+'\','
                                                        +Math.round(rows[rowNumber].startDate/1000)+','
                                                        +Math.round(rows[rowNumber].endDate/1000)+','
                                                        +rows[rowNumber].addedBy+','
                                                        +rows[rowNumber].notified;
                                            query(`INSERT INTO temporary_roles VALUES(${values});`)
                                                .catch(err => {
                                                    console.error(GetTimestamp()+`[InitDB] Failed to execute migration query ${dbVersion}c: (${err})`);
                                                    process.exit(-1);
                                                });
                                        }
                                    }
                                });*/
                                await query(`INSERT INTO metadata (\`key\`, \`value\`) VALUES("DB_VERSION", ${dbVersion+1}) ON DUPLICATE KEY UPDATE \`value\` = ${dbVersion+1};`)
                                    .catch(err => {
                                        console.error(GetTimestamp()+`[InitDB] Failed to execute migration query ${dbVersion}a: (${err})`);
                                        process.exit(-1);
                                    });
                                console.log(GetTimestamp()+'[InitDB] Migration #1 complete.');
                            }
                            else if (dbVersion == 1) {
                                // Wait 30 seconds and let user know we are about to migrate the database and for them to make a backup until we handle backups and rollbacks.
                                console.log(GetTimestamp()+'[InitDB] MIGRATION IS ABOUT TO START IN 30 SECONDS, PLEASE MAKE SURE YOU HAVE A BACKUP!!!');
                                await wait(30 * 1000);
                                await query(`ALTER TABLE temporary_roles
                                            ADD COLUMN username varchar(35) DEFAULT NULL;`)
                                    .catch(err => {
                                        console.error(GetTimestamp()+`[InitDB] Failed to execute migration query ${dbVersion}b: (${err})`);
                                        process.exit(-1);
                                    });
                                await query(`ALTER TABLE \`temporary_roles\` COLLATE='utf8mb4_general_ci', CONVERT TO CHARSET utf8mb4;`)
                                    .catch(err => {
                                        console.error(GetTimestamp()+`[InitDB] Failed to execute migration query ${dbVersion}c: (${err})`);
                                        process.exit(-1);
                                    });
                                await query(`ALTER TABLE \`metadata\` COLLATE='utf8mb4_general_ci', CONVERT TO CHARSET utf8mb4;`)
                                    .catch(err => {
                                        console.error(GetTimestamp()+`[InitDB] Failed to execute migration query ${dbVersion}d: (${err})`);
                                        process.exit(-1);
                                    });
                                await query(`INSERT INTO metadata (\`key\`, \`value\`) VALUES("DB_VERSION", ${dbVersion+1}) ON DUPLICATE KEY UPDATE \`value\` = ${dbVersion+1};`)
                                    .catch(err => {
                                        console.error(GetTimestamp()+`[InitDB] Failed to execute migration query ${dbVersion}a: (${err})`);
                                        process.exit(-1);
                                    });
                                console.log(GetTimestamp()+'[InitDB] Migration #2 complete.');
                            }
                            else if (dbVersion == 2) {
                                // Wait 30 seconds and let user know we are about to migrate the database and for them to make a backup until we handle backups and rollbacks.
                                console.log(GetTimestamp()+'[InitDB] MIGRATION IS ABOUT TO START IN 30 SECONDS, PLEASE MAKE SURE YOU HAVE A BACKUP!!!');
                                await wait(30 * 1000);
                                await query(`CREATE TABLE IF NOT EXISTS paypal_info (
                                        invoice varchar(32) NOT NULL,
                                        userID bigint(19) unsigned NOT NULL,
                                        orderDate int(11) unsigned NOT NULL,
                                        temporaryRole varchar(35) DEFAULT NULL,
                                        days tinyint(3) unsigned DEFAULT NULL,
                                        order_id varchar(20) NOT NULL,
                                        order_json longtext DEFAULT NULL,
                                        order_verified tinyint(1) unsigned NOT NULL DEFAULT 0,
                                        payment_verified tinyint(1) unsigned NOT NULL DEFAULT 0,
                                        fulfilled tinyint(1) unsigned NOT NULL DEFAULT 0,
                                        PRIMARY KEY (\`invoice\`))`)
                                    .catch(err => {
                                        console.error(GetTimestamp()+`[InitDB] Failed to execute migration query ${dbVersion}b: (${err})`);
                                        process.exit(-1);
                                    });
                                await query(`ALTER TABLE \`temporary_roles\` ADD PRIMARY KEY (\`userID\`, \`temporaryRole\`);`)
                                    .catch(err => {
                                        console.error(GetTimestamp()+`[InitDB] Failed to execute migration query ${dbVersion}c: (${err})`);
                                        process.exit(-1);
                                    });
                                await query(`ALTER TABLE \`metadata\` COLLATE='utf8mb4_general_ci', CONVERT TO CHARSET utf8mb4;`)
                                    .catch(err => {
                                        console.error(GetTimestamp()+`[InitDB] Failed to execute migration query ${dbVersion}d: (${err})`);
                                        process.exit(-1);
                                    });
                                await query(`INSERT INTO metadata (\`key\`, \`value\`) VALUES("DB_VERSION", ${dbVersion+1}) ON DUPLICATE KEY UPDATE \`value\` = ${dbVersion+1};`)
                                    .catch(err => {
                                        console.error(GetTimestamp()+`[InitDB] Failed to execute migration query ${dbVersion}a: (${err})`);
                                        process.exit(-1);
                                    });
                                console.log(GetTimestamp()+'[InitDB] Migration #3 complete.');
                            }
                            else if (dbVersion == 3) {
                                // Wait 30 seconds and let user know we are about to migrate the database and for them to make a backup until we handle backups and rollbacks.
                                console.log(GetTimestamp()+'[InitDB] MIGRATION IS ABOUT TO START IN 30 SECONDS, PLEASE MAKE SURE YOU HAVE A BACKUP!!!');
                                await wait(30 * 1000);
                                await query(`ALTER TABLE \`temporary_roles\` ADD COLUMN leftServer tinyint(1) unsigned DEFAULT 0;`)
                                    .catch(err => {
                                        console.error(GetTimestamp()+`[InitDB] Failed to execute migration query ${dbVersion}b: (${err})`);
                                        process.exit(-1);
                                    });
                                await query(`INSERT INTO metadata (\`key\`, \`value\`) VALUES("DB_VERSION", ${dbVersion+1}) ON DUPLICATE KEY UPDATE \`value\` = ${dbVersion+1};`)
                                    .catch(err => {
                                        console.error(GetTimestamp()+`[InitDB] Failed to execute migration query ${dbVersion}a: (${err})`);
                                        process.exit(-1);
                                    });
                                console.log(GetTimestamp()+'[InitDB] Migration #4 complete.');
                            }
                            else if (dbVersion == 4) {
                                // Wait 30 seconds and let user know we are about to migrate the database and for them to make a backup until we handle backups and rollbacks.
                                console.log(GetTimestamp()+'[InitDB] MIGRATION IS ABOUT TO START IN 30 SECONDS, PLEASE MAKE SURE YOU HAVE A BACKUP!!!');
                                await wait(30 * 1000);
                                await query(`ALTER TABLE \`paypal_info\` ADD COLUMN rejection tinyint(1) unsigned DEFAULT 0;`)
                                    .catch(err => {
                                        console.error(GetTimestamp()+`[InitDB] Failed to execute migration query ${dbVersion}b: (${err})`);
                                        process.exit(-1);
                                    });
                                await query(`INSERT INTO metadata (\`key\`, \`value\`) VALUES("DB_VERSION", ${dbVersion+1}) ON DUPLICATE KEY UPDATE \`value\` = ${dbVersion+1};`)
                                    .catch(err => {
                                        console.error(GetTimestamp()+`[InitDB] Failed to execute migration query ${dbVersion}a: (${err})`);
                                        process.exit(-1);
                                    });
                                console.log(GetTimestamp()+'[InitDB] Migration #5 complete.');
                            }
                        }
                        console.log(GetTimestamp()+'[InitDB] Migration process done.');
                    }
                })
            .catch(err => {
                console.error(GetTimestamp()+`[InitDB] Failed to get version info: (${err})`);
                process.exit(-1);
            });
         })
        .catch(err => {
            console.error(GetTimestamp()+`[InitDB] Failed to create metadata table: (${err})`);
            process.exit(-1);
        });
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
        for(const message of messages.values()) {
            if(message.id > TwoWeeks && message.id < MinFlake && message.deletable) {
                filterMessages.push(message)
            }
        }
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
            await wait(4000);
            DeleteSingleMessages(channel, MinSeconds, MaxSeconds);
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
            if(message.id > MaxFlake && message.id < MinFlake && message.deletable) {
                filterMessages.push(message)
            }
        }
        if(filterMessages.length > 0) {
            for(const message of filterMessages.values()) {
                if(message.deletable) {
                    message.delete().catch();
                    await wait(4000);
                }
            }
            DeleteSingleMessages(channel, MinSeconds, MaxSeconds);
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
    return toSnowflake(date);
}

async function handleStripeData(req, res) {
    let json = req.body;
    if (!json) {
        res.sendStatus(400);
        console.error(GetTimestamp()+'[handlePayPalData] Bad data without a body.');
        bot.channels.cache.get(config.mainChannelID).send(":x: Received an **bad** request in the PayPal handler. It had no data in the body.").catch(err => {console.error(GetTimestamp()+err);});
        return;
    }
}

async function handlePayPalData(req, res) {
    let json = req.body;
    if (!json) {
        res.sendStatus(400);
        console.error(GetTimestamp()+'[handlePayPalData] Bad data without a body.');
        bot.channels.cache.get(config.mainChannelID).send(":x: Received an **bad** request in the PayPal handler. It had no data in the body.").catch(err => {console.error(GetTimestamp()+err);});
        return;
    }

    let eventtype = json.event_type || '';
    if (eventtype == 'CHECKOUT.ORDER.APPROVED') {
        // Process the order and check PayPal if it exists to confirm someone isn't faking it
        res.send('OK');
        console.log(GetTimestamp()+'[handlePayPalData] Received webhook payload for:', eventtype);

        // Get a bearer token so we can pull some data from PayPal
        let bearerToken = await getBearerToken();
        if (!bearerToken) {
            return;
        }

        // Get the order details directly from PayPal in case someone fakes a POST message to this bot
        let orderJSON = await getJSONData(bearerToken, `https://api.paypal.com/v2/checkout/orders/${json.resource.id}`);
        if (!orderJSON) {
            return;
        }

        // Save some variables and write to the table
        processPayPalOrder(orderJSON, "ORDER");
    }
    else if (eventtype == 'PAYMENT.CAPTURE.COMPLETED') {
        //Process the donation and check PayPal if it exists to confirm someone isn't faking it
        res.send('OK');
        console.log(GetTimestamp()+'[handlePayPalData] Received webhook payload for:', eventtype);

        // Get a bearer token so we can pull some data from PayPal
        let bearerToken = await getBearerToken();
        if (!bearerToken) {
            return;
        }

        // Get the payment details from PayPal
        let payJSON = await getJSONData(bearerToken, `https://api.paypal.com/v2/payments/captures/${json.resource.id}`);
        if (!payJSON) {
            return;
        }

        // Get the order link so we can process the data
        let links = payJSON.links;
        let link = "";
        for (i=0; i<links.length; i++) {
            if (links[i].href.includes("orders")) {
                link = links[i].href;
                break;
            }
        }
        // Get the order details from PayPal
        let orderJSON = await getJSONData(bearerToken, `${link}`);
        if (!orderJSON) {
            return;
        }

        // Save some variables and write to the table
        processPayPalOrder(orderJSON, "PAYMENT");
    }
    else if (eventtype != '') {
        //Log and send msg if there's an event type that isn't supported
        res.send('OK');
        console.warn(GetTimestamp()+'[handlePayPalData] Received an unsupported event type:', eventtype);
        bot.channels.cache.get(config.mainChannelID).send(":exclamation: Received a PayPal webhook with an unsupported event type of: **" + eventtype + "**. See the console log for details.")
           .catch(err => {console.error(GetTimestamp()+err);});
    }
    else {
        //If there's no event type, it probably isn't from PayPal
        res.sendStatus(400);
        console.error(GetTimestamp()+'[handlePayPalData] Received an unknown request.');
        bot.channels.cache.get(config.mainChannelID).send(":x: Received an **unknown** request in the PayPal handler. See the console log for details.")
           .catch(err => {console.error(GetTimestamp()+err);});
    }
    //console.log(GetTimestamp()+'[handlePayPalData] Received webhook payload for:', JSON.stringify(json));
}

async function getBearerToken() {
    return new Promise((resolve, reject) => {
        // Get a bearer token so we can pull some data from PayPal
        request.post({
            uri: "https://api.paypal.com/v1/oauth2/token",
            headers: {
                "Accept": "application/json",
                "Accept-Language": "en_US",
                "content-type": "application/x-www-form-urlencoded"
            },
            auth: {
                'user': config.donations.client_ID,
                'pass': config.donations.client_secret
            },
            form: {
                "grant_type": "client_credentials"
            }
        }, async function(err, response, body) {
            if(err) {
                console.error(GetTimestamp() + "Failed to send bearer token request");
                bot.channels.cache.get(config.mainChannelID).send(":x: Failed to send bearer token request.").catch(err => {console.error(GetTimestamp()+err);});
                return reject(err);
            }
            let bearerJSON = JSON.parse(body);
            return resolve(bearerJSON.access_token);
        })
    });
}

async function getJSONData(bearerToken, uri) {
    return new Promise((resolve, reject) => {
        // Get the URI details directly from PayPal in case someone fakes a POST message to this bot
        request.get({
            uri: `${uri}`,
            headers: {
                "Accept": "application/json",
                "Accept-Language": "en_US",
                "Authorization": `Bearer ${bearerToken}`
            }
        }, async function(err, response, body) {
            if(err) {
                console.error(GetTimestamp() + "Failed to get order request");
                bot.channels.cache.get(config.mainChannelID).send(":x: Failed to get order request.").catch(err => {console.error(GetTimestamp()+err);});
                return reject(err);
            }
            // Save some variables and write to the table
            return resolve(JSON.parse(body));
        })
    });
}

async function processPayPalOrder(orderJSON, source) {
    // Save some variables and write to the table
    let invoice = orderJSON.purchase_units[0].invoice_id;
    if (invoice.length < 27 && invoice.length > 31) {
        console.error(GetTimestamp()+"Invalid invoice length for invoice: "+invoice);
        bot.channels.cache.get(config.mainChannelID).send(":x: Invalid invoice length for invoice: "+invoice).catch(err => {console.error(GetTimestamp()+err);});
        return;
    }
    let merchant_id = orderJSON.purchase_units[0].payee.merchant_id;
    if (merchant_id != config.donations.merchant_id) {
        console.error(GetTimestamp()+"The order's merchant ID does not match the one in the config file. Merchant ID: "+merchant_id);
        bot.channels.cache.get(config.mainChannelID).send(":x: The order's merchant ID does not match the one in the config file. Merchant ID: "+merchant_id)
           .catch(err => {console.error(GetTimestamp()+err);});
        return;
    }
    let userID = invoice.split("-")[0];

    // Check if the invoice is already in the DB and fulfilled
    await query(`SELECT * FROM paypal_info WHERE invoice = "${invoice}" LIMIT 1;`)
        .then(async rows => {
            let order_id = orderJSON.id;
            let orderDate = invoice.split("-")[1];
            let tempRole = orderJSON.purchase_units[0].items[0].name;
            let days = orderJSON.purchase_units[0].items[0].description;
            // If payment status doesn't exist, the customer may have an issue with their payment method
            let paymentStatus = '';
            if (orderJSON.purchase_units[0].payments && orderJSON.purchase_units[0].payments.captures) {
                paymentStatus = orderJSON.purchase_units[0].payments.captures[0].status;
            }
            let paymentVerified = 0;
            let fulfilled = 0;
            let orderVerified = 0;
            if (rows[0]) {
                paymentVerified = rows[0].payment_verified;
                fulfilled = rows[0].fulfilled;
                orderVerified = rows[0].order_verified;
                if (fulfilled && orderVerified && paymentVerified) {
                    console.log(GetTimestamp()+"This donation has already been fulfilled for invoice: "+invoice);
                    return;
                }
                else if (fulfilled && !paymentVerified) {
                    console.log(GetTimestamp()+"This donation has already been fulfilled but the payment was not verified yet. This is for invoice: "+invoice);
                }
            }
            // Scrub the personal names of quotes
            orderJSON.payer.name.given_name = orderJSON.payer.name.given_name.replace(/[^a-zA-Z0-9]/g, '');
            orderJSON.payer.name.surname = orderJSON.payer.name.surname.replace(/[^a-zA-Z0-9]/g, '');
            // Write to the DB if there isn't a row and if there is but unfulfilled
            let sql_query = ``;
            if (paymentStatus == "COMPLETED") {
                // Set the payment verification to true if the order already shows the payment as complete. This is true for instant payments
                sql_query = `INSERT INTO paypal_info (invoice, userID, orderDate, temporaryRole, days, order_verified, order_json, order_id, payment_verified)
                        VALUES("${invoice}", ${userID}, ${orderDate}, "${tempRole}", ${days}, 1, '''${JSON.stringify(orderJSON)}''', "${order_id}", 1)
                        ON DUPLICATE KEY UPDATE
                            userID=${userID},
                            orderDate=${orderDate},
                            temporaryRole="${tempRole}",
                            days=${days},
                            order_verified=1,
                            order_json='''${JSON.stringify(orderJSON)}''',
                            order_id="${order_id}",
                            payment_verified=1;`
            }
            else {
                sql_query = `INSERT INTO paypal_info (invoice, userID, orderDate, temporaryRole, days, order_verified, order_json, order_id)
                        VALUES("${invoice}", ${userID}, ${orderDate}, "${tempRole}", ${days}, 1, '''${JSON.stringify(orderJSON)}''', "${order_id}")
                        ON DUPLICATE KEY UPDATE
                            userID=${userID},
                            orderDate=${orderDate},
                            temporaryRole="${tempRole}",
                            days=${days},
                            order_verified=1,
                            order_json='''${JSON.stringify(orderJSON)}''',
                            order_id="${order_id}";`
            }
            await query(sql_query)
                .then(async results => {
                    // If the order has a payment status of complete, assign the time. else, drop out to wait for the payment webhook
                    if (!fulfilled && paymentStatus != '' && paymentStatus != 'DECLINED' && (paymentStatus == "COMPLETED" || config.donations.forcePaymentStatus == "yes")) {
                        // Check if the person already has the requested role
                        await query(`SELECT * FROM temporary_roles WHERE userID = "${userID}" AND temporaryRole = "${tempRole}" LIMIT 1;`)
                            .then(async row => {
                                let username = orderJSON.purchase_units[0].custom_id.replace(/[^a-zA-Z0-9]/g, '');
                                let member = await getMember(userID);
                                if(!member) {
                                    return;
                                }
                                if (row[0]) {
                                    // They have the role so add time to their account. Update the info to the temp_role table
                                    let startDateVal = new Date();
                                    startDateVal.setTime(row[0].startDate * 1000);
                                    let startDateTime = await formatTimeString(startDateVal);
                                    let finalDate = Number(row[0].endDate * 1000) + Number(days * dateMultiplier);
                                    await query(`UPDATE temporary_roles SET endDate="${Math.round(finalDate / 1000)}", notified=0, username="${username}" WHERE userID="${userID}" AND temporaryRole="${tempRole}"`)
                                        .then(async result => {
                                            let endDateVal = new Date();
                                            endDateVal.setTime(finalDate);
                                            finalDate = await formatTimeString(endDateVal);
                                            console.log(GetTimestamp() + "[ADMIN] [TEMPORARY-ROLE] \"" + username + "\" (" + userID + ") was given " + days + " days by: PayPal donation (" + invoice + ") for the role: "+tempRole);
                                            // Update the fulfilled column if both of the above are successful
                                            await query(`UPDATE paypal_info SET fulfilled=1 WHERE invoice="${invoice}"`)
                                                .then(async result => {
                                                    // Messaage the user too, so they know when it has been processed.
                                                    member.send("Hello " + username + "! Thank you for your donation! Your role of **" + tempRole + "** on " +
                                                        bot.guilds.cache.get(config.serverID).name + " has been assigned until \`" + finalDate + "\`.")
                                                    .catch(error => {
                                                        console.error(GetTimestamp() + "Failed to send a DM to user: " + userID);
                                                    });
                                                    let grossValue = "N/A";
                                                    let netValue = "N/A";
                                                    if (paymentStatus == "COMPLETED") {
                                                        grossValue = orderJSON.purchase_units[0].payments.captures[0].seller_receivable_breakdown.gross_amount.value;
                                                        netValue = orderJSON.purchase_units[0].payments.captures[0].seller_receivable_breakdown.net_amount.value;
                                                    }
                                                    if (source == "RECHECK") {
                                                        bot.channels.cache.get(config.mainChannelID).send("✅ **LATE** PayPal donation for **addition** time on the **"+tempRole+"** role was processed for "+username+
                                                                                                          ". It was for "+days+" days at $"+grossValue+" (net=$"+netValue+"). Time was added until: \`"+
                                                                                                          finalDate+"\`! They were added on: \`"+startDateTime+"\`.");
                                                    }
                                                    else {
                                                        bot.channels.cache.get(config.mainChannelID).send("✅ PayPal donation for **addition** time on the **"+tempRole+"** role was processed for "+username+
                                                                                                          ". It was for "+days+" days at $"+grossValue+" (net=$"+netValue+"). Time was added until: \`"+
                                                                                                          finalDate+"\`! They were added on: \`"+startDateTime+"\`.");
                                                    }
                                                })
                                                .catch(err => {
                                                    console.error(GetTimestamp()+`[processPayPalOrder] Failed to execute order query 5: (${err})`);
                                                    bot.channels.cache.get(config.mainChannelID).send(`:x: [processPayPalOrder] Failed to execute order query 5: (\`${err}\`)`).catch(err => {console.error(GetTimestamp()+err);});
                                                    return;
                                                });
                                        })
                                        .catch(err => {
                                            console.error(GetTimestamp()+`[processPayPalOrder] Failed to execute order query 4: (${err})`);
                                            bot.channels.cache.get(config.mainChannelID).send(`:x: [processPayPalOrder] Failed to execute order query 4: (\`${err}\`)`).catch(err => {console.error(GetTimestamp()+err);});
                                            return;
                                        });
                                    return;
                                }
                                let curDate = new Date().getTime();
                                let finalDate = curDate + (Number(days) * dateMultiplier);
                                let values = userID+',\''
                                            +tempRole+'\','
                                            +Math.round(curDate/1000)+','
                                            +Math.round(finalDate/1000)+','
                                            +config.ownerID
                                            +', 0'+',\''
                                            +username+'\',0';
                                await query(`INSERT INTO temporary_roles VALUES(${values});`)
                                    .then(async result => {
                                        let finalDateDisplay = new Date();
                                        finalDateDisplay.setTime(finalDate);
                                        finalDateDisplay = await formatTimeString(finalDateDisplay);
                                        console.log(GetTimestamp() + "[ADMIN] [TEMPORARY-ROLE] \"" + username + "\" (" +
                                                    userID + ") was given the \"" + tempRole + "\" role by : PayPal donation (" + invoice + ")");
                                        // Update the fulfilled column if both of the above are successful
                                        await query(`UPDATE paypal_info SET fulfilled=1 WHERE invoice="${invoice}"`)
                                            .then(async result => {
                                                // Assign the role to the user and send messages
                                                let theirRole = bot.guilds.cache.get(config.serverID).roles.cache.find(theirRole => theirRole.name === tempRole);
                                                member.roles.add(theirRole).catch(err => {
                                                    console.error(GetTimestamp()+err);
                                                    bot.channels.cache.get(config.mainChannelID).send(`:x: [processPayPalOrder] Failed to assign the role to: (\`${userID}\`)`).catch(err => {console.error(GetTimestamp()+err);});
                                                    return;
                                                });
                                                member.send("Hello " + member.user.username + "! Thank you for your donation! Your role of **" + tempRole + "** on " +
                                                    bot.guilds.cache.get(config.serverID).name + " has been assigned until \`" + finalDateDisplay + "\`.")
                                                .catch(error => {
                                                    console.error(GetTimestamp() + "Failed to send a DM to user: " + userID);
                                                });
                                                let grossValue = "N/A";
                                                let netValue = "N/A";
                                                if (paymentStatus == "COMPLETED") {
                                                    grossValue = orderJSON.purchase_units[0].payments.captures[0].seller_receivable_breakdown.gross_amount.value;
                                                    netValue = orderJSON.purchase_units[0].payments.captures[0].seller_receivable_breakdown.net_amount.value;
                                                }
                                                if (source == "RECHECK") {
                                                    bot.channels.cache.get(config.mainChannelID).send("✅ **LATE** PayPal donation for **new** time for the **"+tempRole+"** role was processed for "+username+
                                                                                                      ". It was for "+days+" days at $"+grossValue+" (net=$"+netValue+"). They will lose the role on: \`"+
                                                                                                      finalDateDisplay+"\`.");
                                                }
                                                else {
                                                    bot.channels.cache.get(config.mainChannelID).send("✅ PayPal donation for **new** time for the **"+tempRole+"** role was processed for "+username+
                                                                                                      ". It was for "+days+" days at $"+grossValue+" (net=$"+netValue+"). They will lose the role on: \`"+
                                                                                                      finalDateDisplay+"\`.");
                                                }
                                            })
                                            .catch(err => {
                                                console.error(GetTimestamp()+`[processPayPalOrder] Failed to execute order query 7: (${err})`);
                                                bot.channels.cache.get(config.mainChannelID).send(`:x: [processPayPalOrder] Failed to execute order query 7: (\`${err}\`)`).catch(err => {console.error(GetTimestamp()+err);});
                                                return;
                                            });
                                    })
                                    .catch(err => {
                                        console.error(GetTimestamp()+`[processPayPalOrder] Failed to execute order query 6: (${err})`);
                                        bot.channels.cache.get(config.mainChannelID).send(`:x: [processPayPalOrder] Failed to execute order query 6: (\`${err}\`)`).catch(err => {console.error(GetTimestamp()+err);});
                                        return;
                                    });
                            })
                            .catch(err => {
                                console.error(GetTimestamp()+`[processPayPalOrder] Failed to execute order query 3: (${err})`);
                                bot.channels.cache.get(config.mainChannelID).send(`:x: [processPayPalOrder] Failed to execute order query 3: (\`${err}\`)`).catch(err => {console.error(GetTimestamp()+err);});
                                return;
                            });
                    }
                    else if (fulfilled && paymentStatus == "COMPLETED" && !paymentVerified) {
                        // This would be when a payment is completed after an order has been fulfilled
                        bot.channels.cache.get(config.mainChannelID).send(`:white_check_mark: [processPayPalOrder] A payment has been marked \`COMPLETE\` for invoice \`${invoice}\`, which was already fulfilled.`)
                               .catch(err => {console.error(GetTimestamp()+err);});
                    }
                    else if (paymentStatus == '' || paymentStatus == 'DECLINED') {
                        // Payment was declined or something went wrong with their payment.
                        if (source != "RECHECK" && paymentStatus == '') {
                            console.warn(GetTimestamp()+`:x: [processPayPalOrder] Failed to find a payment method. Information for \`${invoice}\` has been saved for later.`);
                            bot.channels.cache.get(config.mainChannelID).send(`:x: [processPayPalOrder] Failed to find a payment method. Information for \`${invoice}\` has been saved for later.`)
                               .catch(err => {console.error(GetTimestamp()+err);});
                        }
                        if (paymentStatus == 'DECLINED') {
                            let username = orderJSON.purchase_units[0].custom_id.replace(/[^a-zA-Z0-9]/g, '');
                            let member = await getMember(userID);
                            if(!member) {
                                return;
                            }
                            // Update the rejection column if the payment is declined
                            await query(`UPDATE paypal_info SET rejection=1 WHERE invoice="${invoice}"`)
                                .then(async result => {
                                    member.send("Hello " + member.user.username + "! The payment method for your order has been declined. Please check your PayPal account to resolve the issue. No charge was incurred for this order.")
                                    .catch(error => {
                                        console.error(GetTimestamp() + "Failed to send a DM to user: " + userID);
                                    });
                                    console.warn(GetTimestamp()+`:x: [processPayPalOrder] Failed to process payment, the status is \`DECLINED\`. Information for \`${invoice}\` has been saved for later reference.`);
                                    bot.channels.cache.get(config.mainChannelID).send(`:x: [processPayPalOrder] Failed to process payment, the status is \`DECLINED\`. Information for \`${invoice}\` has been saved for later reference.`)
                                       .catch(err => {console.error(GetTimestamp()+err);});
                                })
                                .catch(err => {
                                    console.error(GetTimestamp()+`[processPayPalOrder] Failed to execute order query 8: (${err})`);
                                    bot.channels.cache.get(config.mainChannelID).send(`:x: [processPayPalOrder] Failed to execute order query 8: (\`${err}\`)`).catch(err => {console.error(GetTimestamp()+err);});
                                    return;
                                });
                        }
                    }
                    else {
                        // Payment is not complete so we will not assign the role. Everything was saved above for rechecking later
                        if (source != "RECHECK") {
                            console.warn(GetTimestamp()+`:exclamation: [processPayPalOrder] A new donation has come in but the payment is not \`COMPLETE\`. Information for \`${invoice}\` has been saved for later.`);
                            bot.channels.cache.get(config.mainChannelID).send(`:exclamation: [processPayPalOrder] A new donation has come in but the payment is not \`COMPLETE\`. Information for \`${invoice}\` has been saved for later.`)
                               .catch(err => {console.error(GetTimestamp()+err);});
                        }
                    }
                })
                .catch(err => {
                    console.error(GetTimestamp()+`[processPayPalOrder] Failed to execute order query 2: (${err})`);
                    bot.channels.cache.get(config.mainChannelID).send(`:x: [processPayPalOrder] Failed to execute order query 2: (\`${err}\`)`).catch(err => {console.error(GetTimestamp()+err);});
                    return;
                });
        })
        .catch(err => {
            console.error(GetTimestamp()+`[processPayPalOrder] Failed to execute order query 1: (${err})`);
            bot.channels.cache.get(config.mainChannelID).send(`:x: [processPayPalOrder] Failed to execute order query 1: (\`${err}\`)`).catch(err => {console.error(GetTimestamp()+err);});
            return;
        });
}

function SQLConnect() {
    return new Promise(function(resolve, reject) {
        sqlConnection = mysql.createConnection({
            host: config.db.host,
            port: config.db.port,
            user: config.db.username,
            password: config.db.password,
            database: config.db.database,
            supportBigNumbers: true
        });
        sqlConnection.connect(function(err) {
            if(err) {
                //throw err;
                //process.exit(1);
                return reject;
            }
            console.log(GetTimestamp()+"Connected to SQL!");
            resolve(true);
        });
    });
}

async function query(sql, args) {
    return new Promise((resolve, reject) => {
        sqlConnection.query(sql, args, (error, results, fields) => {
            if (error) {
                if(error.code==="PROTOCOL_CONNECTION_LOST" || error.code==="PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR") {
                    console.log(GetTimestamp()+"Reconnecting to DB server...");
                    SQLConnect().then( result => query(sql, args) );
                }
                else {
                    return reject(error);
                }
            }
            return resolve(results);
        });
    });
}

async function formatTimeString(date) {
    return new Promise((resolve) => {
        let year = date.getFullYear();
        let month = date.getMonth() + 1;
        let day = date.getDate();
        let hour = date.getHours();
        let minute = date.getMinutes();
        let second = date.getSeconds();

        if (month < 10) { month = "0" + month.toString(); }
        if (day < 10) { day = "0" + day.toString(); }
        if (hour < 10) { hour = "0" + hour.toString(); }
        if (minute < 10) { minute = "0" + minute.toString(); }
        if (second < 10) { second = "0" + second.toString(); }

        let results = year + "-" + month + "-" + day + " @" + hour + ":" + minute + ":" + second;
        return resolve(results);
    });
}

async function getMember(userID) {
    return new Promise(async (resolve) => {
        var member = {};
        await bot.guilds.cache.get(config.serverID).members.fetch();
        member = bot.guilds.cache.get(config.serverID).members.cache.get(userID);
        // Check if we pulled the member's information correctly or if they left the server.
        if(!member) {
            bot.channels.cache.get(config.mainChannelID).send(":exclamation: Failed to get user ID: " +
                userID + " <@" + userID + "> from the cache. Tagging them to force the cache update.")
                .catch(err => {console.error(GetTimestamp()+err);});
            await bot.guilds.cache.get(config.serverID).members.fetch();
            await wait(1 * 1000); // 1 second
            member = bot.guilds.cache.get(config.serverID).members.cache.get(userID);
            // If it still doesn't exist, return an error
            if(!member) {
                console.error(GetTimestamp() + "Failed to find a user for ID: " + userID + ". They may have left the server.");
                bot.channels.cache.get(config.mainChannelID).send("**:x: Could not find a user for ID: " +
                    userID + " <@" + userID + ">. They may have left the server.**")
                    .catch(err => {console.error(GetTimestamp()+err);});
                member = {"guild":{"id": config.serverID}, "id": userID}
                await guildMemberRemove(member)
                return resolve(false);
            }
        }
        return resolve(member);
    });
}

async function guildMemberRemove(member) {
    // Used to note database entries when users leave the server.
    let guild = member.guild.id;
    if(guild != config.serverID) {
        return;
    }
    // Check if the user had any temp roles
    await query(`SELECT * FROM temporary_roles WHERE userID="${member.id}"`)
        .then(async rows => {
            // Update all entries from the database
            if (rows[0]) {
                await query(`UPDATE temporary_roles SET leftServer = 1 WHERE userID="${member.id}"`)
                    .then(async result => {
                        var name = "Unknown";
                        name = rows[0].username;
                        console.log(GetTimestamp() + "[ADMIN] [TEMPORARY-ROLE] \"" + name + "\" (" + member.id + ") has left the server. All temp role assignments have been marked in the database.");
                        bot.channels.cache.get(config.mainChannelID).send(":exclamation: " + name + " has left the server. All temp role assignments have been marked in the database.");
                    })
                    .catch(err => {
                        console.error(GetTimestamp()+`[InitDB] Failed to execute query in guildMemberRemove 2: (${err})`);
                        return;
                    });
            }
        })
        .catch(err => {
            console.error(GetTimestamp()+`[InitDB] Failed to execute query in guildMemberRemove 1: (${err})`);
            return;
        });
}

// Run message clearing at midnight
schedule.scheduleJob('0 0 * * *', () => {
    if(config.clearAtMidnight.length > 0) {
        for(var i = 0; i < config.clearAtMidnight.length; i++) {
            let channel = bot.channels.cache.get(config.clearAtMidnight[i])
            DeleteBulkMessages(channel, 0);
        }
    }
});

// Run message clearing for hour-old messages every 5 minutes
schedule.scheduleJob('*/5 * * * *', () => {
    if(config.clearEvery5min.length > 0) {
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

process.on('unhandledRejection', (reason, p) => {
    console.error(GetTimestamp() + 'Unhandled Rejection at Promise: ', p);
    //if(!reason.includes("Unknown Message")) {
        // Only show if this isn't related to deleting a message
        //console.error(GetTimestamp() + 'Unhandled Rejection at Promise: ', p);
        //console.error(GetTimestamp() + reason);
    //}
});

process.on('uncaughtException', err => {
    if(err.code === "PROTOCOL_CONNECTION_LOST" || err.code === "ECONNRESET") {
        console.log(GetTimestamp() + "Lost connection to the DB server. Waiting for activity before reconnecting...");
        return;
    }
    else {
        console.error(GetTimestamp() + 'Uncaught Exception thrown');
        console.error(GetTimestamp() + err);
        process.exit(1);
    }
});

const Discord=require('discord.js');
const bot=new Discord.Client();
const config=require('./config.json');
const sql = require("sqlite");
sql.open("./dataBase.sqlite");

// COMMON VARIABLES
var embedMSG="";

bot.on('ready', () => {
	let CurrTime=new Date();
	let mo=CurrTime.getMonth()+1;
		if(mo<10){mo="0"+mo;}
	let da=CurrTime.getDate();
		if(da<10){da="0"+da;}
	let yr=CurrTime.getFullYear();
	let hr=CurrTime.getHours();
		if(hr<10){hr="0"+hr;}
	let min=CurrTime.getMinutes();
		if(min<10){min="0"+min;}
	let sec=CurrTime.getSeconds();
		if(sec<10){sec="0"+sec;}
	let timeStamp="`"+yr+"/"+mo+"/"+da+"` **@** `"+hr+":"+min+":"+sec+"`";
	let timeStampSys="["+yr+"/"+mo+"/"+da+" @ "+hr+":"+min+":"+sec+"] ";
	console.info(timeStampSys+'-- DISCORD HELPBOT IS READY --');
});

// ##########################################################################
// ############################# SERVER LISTENER ############################
// ##########################################################################

// DATABASE TIMER FOR TEMPORARY ROLES
setInterval(function(){
	let CurrTime=new Date();
	let mo=CurrTime.getMonth()+1;
		if(mo<10){mo="0"+mo;}
	let da=CurrTime.getDate();
		if(da<10){da="0"+da;}
	let yr=CurrTime.getFullYear();
	let hr=CurrTime.getHours();
		if(hr<10){hr="0"+hr;}
	let min=CurrTime.getMinutes();
		if(min<10){min="0"+min;}
	let sec=CurrTime.getSeconds();
		if(sec<10){sec="0"+sec;}
	let timeStamp="`"+yr+"/"+mo+"/"+da+"` **@** `"+hr+":"+min+":"+sec+"`";
	let timeStampSys="["+yr+"/"+mo+"/"+da+" @ "+hr+":"+min+":"+sec+"] ";
	
	let timeNow=new Date().getTime();
	let dbTime="";
	let daysLeft="";
	sql.all(`SELECT * FROM temporary_roles`).then(rows => {
		if (!rows) {
			return console.info("No one is in the DataBase");
		}
		else {
			for(rowNumber="0"; rowNumber<rows.length; rowNumber++){
				dbTime=rows[rowNumber].endDate;
				daysLeft=(dbTime*1)-(timeNow*1);
				if(daysLeft<1){
					member=bot.guilds.get(config.serverID).members.get(rows[rowNumber].userID); 
						if(!member){ 
							member.user.username="<@"+rows[rowNumber].userID+">"; member.id=""; 
						}
					console.log(timeStampSys+"[ADMIN] [TEMPORARY-ROLE] \""+member.user.username+"\" ("+member.id+") have lost their role: "+rows[rowNumber].temporaryRole+"... time EXPIRED");
					bot.channels.get(config.mainChannelID).send("⚠ <@"+rows[rowNumber].userID+"> have **lost** their role of: **"
						+rows[rowNumber].temporaryRole+"** - their **temporary** access has __EXPIRED__ 😭 ").catch(console.error);
					
					// REMOVE ROLE FROM MEMBER IN GUILD
					let rName=bot.guilds.get(config.serverID).roles.find(rName => rName.name === rows[rowNumber].temporaryRole); 
					bot.guilds.get(config.serverID).members.get(rows[rowNumber].userID).removeRole(rName).catch(console.error);
					
					// REMOVE DATABASE ENTRY
					sql.get(`DELETE FROM temporary_roles WHERE userID="${rows[rowNumber].userID}"`).catch(console.error);
				}
			}
		}
	}).catch(console.error);
},3600000);
// 86400000 = 24hrs
// 43200000 = 12hrs
// 21600000 = 6hrs
// 10800000 = 3hrs 
// 3600000 = 1hr

// ##########################################################################
// ############################## TEXT MESSAGE ##############################
// ##########################################################################
bot.on('message', message => {
	
	let CurrTime=new Date();
	let mo=CurrTime.getMonth()+1;
		if(mo<10){mo="0"+mo;}
	let da=CurrTime.getDate();
		if(da<10){da="0"+da;}
	let yr=CurrTime.getFullYear();
	let hr=CurrTime.getHours();
		if(hr<10){hr="0"+hr;}
	let min=CurrTime.getMinutes();
		if(min<10){min="0"+min;}
	let sec=CurrTime.getSeconds();
		if(sec<10){sec="0"+sec;}
	let timeStamp="`"+yr+"/"+mo+"/"+da+"` **@** `"+hr+":"+min+":"+sec+"`";
	let timeStampSys="["+yr+"/"+mo+"/"+da+" @ "+hr+":"+min+":"+sec+"] ";
	
// ############################## COMMANDS BEGIN ##############################

	// MAKE SURE ITS A COMMAND
	if(!message.content.startsWith(config.cmdPrefix)){ 
		return 
	}

	//STOP SCRIPT IF DM/PM
	if(message.channel.type=="dm"){ 
		return 
	}
	
	// GET CHANNEL INFO
	let g=message.guild; 
	let c=message.channel; 
	let m=message.member; 
	let msg=message.content; 
	msg=msg.toLowerCase();
	
	// GET TAGGED USER
	let mentioned=""; 
		if(message.mentions.users.first()){
			mentioned=message.mentions.users.first();
		}
	
	// REMOVE LETTER CASE (MAKE ALL LOWERCASE)
	let command=msg.toLowerCase(); 
	command=command.split(" ")[0]; 
	command=command.slice(config.cmdPrefix.length);
	
	// GET ARGUMENTS
	let args=msg.split(" ").slice(1); 
	skip="no";
	
	// GET ROLES FROM CONFIG
	let AdminR=g.roles.find(role => role.name === config.adminRoleName); 
		if(!AdminR){ 
			AdminR={"id":"111111111111111111"}; 
			console.info("[ERROR] [CONFIG] I could not find admin role: "+config.adminRoleName); 
		}
	let ModR=g.roles.find(role => role.name === config.modRoleName); 
		if(!ModR){ 
			ModR={"id":"111111111111111111"}; 
			console.info("[ERROR] [CONFIG] I could not find mod role: "+config.modRoleName); 
		}

// ############################################################################
// ################################ COMMANDS ##################################
// ############################################################################

	
// ######################### COMMANDS/HELP ###########################
	if(command==="commands" || command==="help") {
		if(args[0]==="mods") {
			if(m.roles.has(ModR.id) || m.roles.has(AdminR.id)) {
				cmds="`!temprole @mention <DAYS> <ROLE-NAME>`   \\\u00BB   to assign a temporary roles\n"
					+"`!temprole check @mention`   \\\u00BB   to check the time left on a temporary role assignment\n"
					+"`!temprole remove @mention`   \\\u00BB   to remove a temporary role assignment\n"
					+"`!temprole add @mention <DAYS>`   \\\u00BB   to add more time to a temporary role assignment\n";
				return c.send(cmds).catch(console.error);
			}
			else {
				return message.reply("you are **NOT** allowed to use this command! \ntry using: `!commads`").catch(console.error); 
			}
		}
		if(!args[0]) { 
			cmds="`!check`   \\\u00BB   to check the time left on your subscription\n";
			if(config.mapMain.enabled==="yes"){ 
				cmds+="`!map`   \\\u00BB   a link to our web map\n" 
			}
			if(config.paypal.enabled==="yes"){ 
				cmds+="`!subscribe`/`!paypal`   \\\u00BB   for a link to our PayPal\n" 
			}
		}
		return c.send(cmds).catch(console.error);
	}

// ######################### PAYPAL/SUBSCRIBE ########################
	if(command==="paypal" || command==="subscribe") {
		if(config.paypal.enabled==="yes"){
			let embedMSG={
				'color': 0xFF0000,
				'title': 'Click HERE to Subscribe',
				'url': config.paypal.url,
				'thumbnail': {'url': config.paypal.img},
				'description': 'Thank you! \nYour support is greatly appreciated.'
			};
			return c.send({embed: embedMSG}).catch(console.error);
		}
	}
	
// ############################## TEMPORARY ROLES ##############################
	if(command.startsWith("temprole") || command==="tr" || command==="trole"){
		
		// ROLES ARE CASE SENSITIVE TO RESET MESSAGE AND ARGUMENTS
		msg=message.content; 
		args=msg.split(" ").slice(1);
		
		if(m.roles.has(ModR.id) || m.roles.has(AdminR.id) || m.id===config.ownerID){
			if(!args[0]){
				return message.reply("syntax:\n `!temprole @mention <DAYS> <ROLE-NAME>`,\n or `!temprole remove @mention`\n or `!temprole check @mention`");
			}
			if(args[0] && !mentioned){
				return message.reply("please `@mention` a person you want me to give/remove `!temprole` to...");
			}
			if(!args[1] && mentioned){
				return message.reply("imcomplete data, please try: \n `!temprole @mention <DAYS> <ROLE-NAME>`,\n or `!temprole remove @mention`\n or `!temprole check @mention`");
			}
			else {
				let dateMultiplier=86400000; 
				mentioned=message.mentions.members.first(); 
				
				// CREATE DATABASE TABLE 
				sql.run("CREATE TABLE IF NOT EXISTS temporary_roles (userID TEXT, temporaryRole TEXT, startDate TEXT, endDate TEXT, addedBy TEXT)").catch(console.error);
				
				// CHECK DATABASE FOR ROLES
				if(args[0]==="check"){
					mentioned=message.mentions.members.first(); 
					sql.get(`SELECT * FROM temporary_roles WHERE userID="${mentioned.id}"`).then(row => {
						if(!row){
							return message.reply("⚠ [ERROR] "+mentioned.user.username+" is __NOT__ in the `DataBase`");
						}
						else {
							let startDateVal=new Date(); 
							startDateVal.setTime(row.startDate); 
							startDateVal=(startDateVal.getMonth()+1)+"/"+startDateVal.getDate()+"/"+startDateVal.getFullYear();
							
							let endDateVal=new Date(); 
							endDateVal.setTime(row.endDate); 
							
							finalDate=(endDateVal.getMonth()+1)+"/"+endDateVal.getDate()+"/"+endDateVal.getFullYear();
							return c.send("✅ "+mentioned.user.username+" will lose the role: **"+row.temporaryRole+"** on: `"+finalDate+"`! They were added on: `"+startDateVal+"`");
						}
					}).catch(console.error); return
				}
				
				// REMOVE MEMBER FROM DATABASE
				if(args[0]==="remove"){
					mentioned=message.mentions.members.first(); 
					sql.get(`SELECT * FROM temporary_roles WHERE userID="${mentioned.id}"`).then(row => {
						if(!row){
							return c.send("⚠ [ERROR] "+mentioned.user.username+" is __NOT__ in the `DataBase`");
						}
						else {
							let theirRole=g.roles.find(theirRole => theirRole.name === row.temporaryRole);
							mentioned.removeRole(theirRole).catch(console.error);
							sql.get(`DELETE FROM temporary_roles WHERE userID="${mentioned.id}"`).then(row => {
								return c.send("⚠ "+mentioned.user.username+" has **lost** their role of: **"+theirRole.name+"** and has been removed from the `DataBase`");
							});
						}
					}).catch(console.error); return
				}
				
				// ADD TIME TO A USER
				if(args[0]==="add"){
					if(args[1] && !mentioned){
						return message.reply("please `@mention` a person you want me to add time to...");
					}
					if(!args[2]){
						return message.reply("for how **many** days do you want "+mentioned.user.username+" to have to have this role?");
					}
					else {
						mentioned=message.mentions.members.first(); 
						sql.get(`SELECT * FROM temporary_roles WHERE userID="${mentioned.id}"`).then(row => {
							if(!row){
								return c.send("⚠ [ERROR] "+mentioned.user.username+" is __NOT__ in the `DataBase`");
							}
							else {
								let startDateVal=new Date(); 
								startDateVal.setTime(row.startDate); 
								startDateVal=(startDateVal.getMonth()+1)+"/"+startDateVal.getDate()+"/"+startDateVal.getFullYear();

								let endDateVal=new Date(); 
								let finalDate=(parseInt(row.endDate)+parseInt((args[2])*(dateMultiplier))); 

								sql.get(`UPDATE temporary_roles SET endDate="${finalDate}" WHERE userID="${mentioned.id}"`).then(row => {
									endDateVal.setTime(finalDate);						
									finalDate=(endDateVal.getMonth()+1)+"/"+endDateVal.getDate()+"/"+endDateVal.getFullYear();
									return c.send("✅ "+mentioned.user.username+" has had time added until: `"+finalDate+"`! They were added on: `"+startDateVal+"`");
								});
							}
						}).catch(console.error); return
					}
				}
				

				// CHECK AMOUNT OF DAYS WERE ADDED
				if(!args[1]){
					return message.reply("for how **many** days do you want "+mentioned.user.username+" to have to have this role?");
				}
				
				if(!args[2]){
					return message.reply("what role do you want to assign to "+mentioned.user.username+"?");
				}
				
				// ROLES WITH SPACES - NEW
				let daRoles="";
					if(!args[3]){
						daRoles=args[2]
					}else{
						daRoles="";
						for(var x=2;x<args.length;x++){
							daRoles+=args[x]+" ";
						}
						daRoles=daRoles.slice(0,-1);
					}
				
				if(!parseInt(args[1])){
					return message.reply("Error: second value has to be **X** number of days, IE:\n`!"+command+" @"+mentioned.user.username+" 90 "+daRoles+"`");
				}
				
				// CHECK ROLE EXIST
				let rName=g.roles.find(rName => rName.name === daRoles);
				if(!rName){
					return message.reply("I couldn't find such role, please check the spelling and try again.");
				}
				
				// ADD MEMBER TO DATASE, AND ADD THE ROLE TO MEMBER
				sql.get(`SELECT * FROM temporary_roles WHERE userID="${mentioned.id}"`).then(row => {
					mentioned=message.mentions.members.first(); 
					if (!row) {
						let curDate=new Date().getTime(); 
						let finalDateDisplay=new Date(); 
						let finalDate=((args[1])*(dateMultiplier)); 
						finalDate=((curDate)+(finalDate));
						finalDateDisplay.setTime(finalDate); 
						finalDateDisplay=(finalDateDisplay.getMonth()+1)+"/"+finalDateDisplay.getDate()+"/"+finalDateDisplay.getFullYear();
						
						sql.run("INSERT INTO temporary_roles (userID, temporaryRole, startDate, endDate, addedBy) VALUES (?, ?, ?, ?, ?)", 
							[mentioned.id, daRoles, curDate, finalDate, m.id]);
						let theirRole=g.roles.find(theirRole => theirRole.name === daRoles);
						mentioned.addRole(theirRole).catch(console.error);
						console.log(timeStampSys+"[ADMIN] [TEMPORARY-ROLE] \""+mentioned.user.username+"\" ("+mentioned.id+") was given role: "+daRoles+" by: "+m.user.username+" ("+m.id+")");
						return c.send("🎉 "+mentioned.user.username+" has been given a **temporary** role of: **"+daRoles+"**, enjoy! They will lose this role on: `"+finalDateDisplay+"`");
					}
					else {
						return message.reply("this user already has a **temporary** role... try using `!temprole remove @"+mentioned.user.username+"` if you want to **change** their role.");
					}
				}).catch(console.error);
			}
		}
		else {
			message.delete();
			return message.reply("you are **NOT** allowed to use this command!").catch(console.error); 
		}
	}

// ############################## CHECK ##############################
	if(command==="check"){
		
		let dateMultiplier=86400000; 

		// CHECK DATABASE FOR ROLES
		mentioned=m; 
		sql.get(`SELECT * FROM temporary_roles WHERE userID="${mentioned.id}"`).then(row => {
			if(!row){
				return message.reply("⚠ [ERROR] "+mentioned+" is __NOT__ in my `DataBase`");
			}
			else {
				let startDateVal=new Date(); 
				startDateVal.setTime(row.startDate); 
				startDateVal=(startDateVal.getMonth()+1)+"/"+startDateVal.getDate()+"/"+startDateVal.getFullYear();

				let endDateVal=new Date(); 
				endDateVal.setTime(row.endDate); 

				finalDate=(endDateVal.getMonth()+1)+"/"+endDateVal.getDate()+"/"+endDateVal.getFullYear();
				return c.send("✅ You will lose the role: **"+row.temporaryRole+"** on: `"+finalDate+"`! The role was added on: `"+startDateVal+"`");
			}
		}).catch(console.error); return
	}
// ######################### MAP ###################################
	if(command==="map") {
		if(config.mapMain.enabled==="yes"){
			return c.send("Our official webmap: \n<"+config.mapMain.url+">").catch(console.error);
		}
	}
});



// log our bot in
bot.login(config.token);

bot.on('disconnected', function (){
	let CurrTime=new Date();
	let mo=CurrTime.getMonth()+1;
		if(mo<10){mo="0"+mo;}
	let da=CurrTime.getDate();
		if(da<10){da="0"+da;}
	let yr=CurrTime.getFullYear();
	let hr=CurrTime.getHours();
		if(hr<10){hr="0"+hr;}
	let min=CurrTime.getMinutes();
		if(min<10){min="0"+min;}
	let sec=CurrTime.getSeconds();
		if(sec<10){sec="0"+sec;}
	let timeStamp="`"+yr+"/"+mo+"/"+da+"` **@** `"+hr+":"+min+":"+sec+"`";
	let timeStampSys="["+yr+"/"+mo+"/"+da+" @ "+hr+":"+min+":"+sec+"] ";
	console.info(timeStampSys+'-- Disconnected --');
	process.exit(1);
});

const Discord=require('discord.js');
const sql = require("sqlite");
sql.open("./files/dataBase.sqlite");
const config=require('./files/config.json');
const bot=new Discord.Client();

// COMMON VARIABLES
var embedMSG=""; var skip=""; var msg1=""; var msg2="";



bot.on('ready', () => {
	let CurrTime=new Date();
	let mo=CurrTime.getMonth()+1;if(mo<10){mo="0"+mo;}let da=CurrTime.getDate();if(da<10){da="0"+da;}let yr=CurrTime.getFullYear();
	let hr=CurrTime.getHours();if(hr<10){hr="0"+hr;}let min=CurrTime.getMinutes();if(min<10){min="0"+min;}let sec=CurrTime.getSeconds();if(sec<10){sec="0"+sec;}
	let timeStamp="`"+yr+"/"+mo+"/"+da+"` **@** `"+hr+":"+min+":"+sec+"`";let timeStampSys="["+yr+"/"+mo+"/"+da+" @ "+hr+":"+min+":"+sec+"] ";
	console.info(timeStampSys+'-- DISCORD HELPBOT [ADMIN] IS READY --');console.log(console.error);
});



// ##########################################################################
// ############################# SERVER LISTNER #############################
// ##########################################################################
bot.on("guildBanAdd", (guild,user) => {
	
	// POST BAN EVENTS TO MODLOG; WHEN USER BANS MANUALLY INSTEAD OF THROUGH COMMANDS
	if(config.banEvents==="yes") {
		let CurrTime=new Date();
		let mo=CurrTime.getMonth()+1;if(mo<10){mo="0"+mo;}let da=CurrTime.getDate();if(da<10){da="0"+da;}let yr=CurrTime.getFullYear();
		let hr=CurrTime.getHours();if(hr<10){hr="0"+hr;}let min=CurrTime.getMinutes();if(min<10){min="0"+min;}let sec=CurrTime.getSeconds();if(sec<10){sec="0"+sec;}
		let timeStamp="`"+yr+"/"+mo+"/"+da+"` **@** `"+hr+":"+min+":"+sec+"`";let timeStampSys="["+yr+"/"+mo+"/"+da+" @ "+hr+":"+min+":"+sec+"] ";

		guild.fetchAuditLogs({limit: 1,type: 22})
		.then(auditLog => {
			let masterName=auditLog.entries.map(u=>u.executor.username),masterID=auditLog.entries.map(u=>u.executor.id),
				minionName=auditLog.entries.map(u=>u.target.username),minionID=auditLog.entries.map(u=>u.target.id),
				reason=auditLog.entries.map(u=>u.reason);reason="."+String(reason)+".";
				if(reason===".."){reason="It was **not** __defined__"}else{reason=reason.slice(1,-1)}
			embedMSG={
				'color': 0xFF0000,
				'title': '🔨 "'+minionName+'" HAS BEEN BANNED 🔨',
				'thumbnail': {'url': config.bannedImg},
				'description': '**UserID**: `'+minionID+'`\n**UserTag**: <@'+minionID+'>\n'
					+'**Reason**: '+reason+'\n**By**: <@'+masterID+'>\n\n**On**: '+timeStamp
			};
			console.log(timeStampSys+"[ADMIN] [BANNED] \""+minionName+"\" ("+minionID+") was banned from "+guild.name);
			return bot.channels.get(config.modlogChannelID).send({embed: embedMSG}).catch(console.error);
		})
		.catch(console.error)
	}
});

bot.on("guildMemberAdd", member => {
	let CurrTime=new Date();
	let mo=CurrTime.getMonth()+1;if(mo<10){mo="0"+mo;}let da=CurrTime.getDate();if(da<10){da="0"+da;}let yr=CurrTime.getFullYear();
	let hr=CurrTime.getHours();if(hr<10){hr="0"+hr;}let min=CurrTime.getMinutes();if(min<10){min="0"+min;}let sec=CurrTime.getSeconds();if(sec<10){sec="0"+sec;}
	let timeStamp="`"+yr+"/"+mo+"/"+da+"` **@** `"+hr+":"+min+":"+sec+"`";let timeStampSys="["+yr+"/"+mo+"/"+da+" @ "+hr+":"+min+":"+sec+"] ";

	let guild=member.guild; let user=member.user;
	console.log(timeStampSys+"[ADMIN] [JOIN] \""+user.username+"\" ("+user.id+") has joined server: "+guild.name);
});

bot.on("guildMemberRemove", member => {
	let CurrTime=new Date();
	let mo=CurrTime.getMonth()+1;if(mo<10){mo="0"+mo;}let da=CurrTime.getDate();if(da<10){da="0"+da;}let yr=CurrTime.getFullYear();
	let hr=CurrTime.getHours();if(hr<10){hr="0"+hr;}let min=CurrTime.getMinutes();if(min<10){min="0"+min;}let sec=CurrTime.getSeconds();if(sec<10){sec="0"+sec;}
	let timeStamp="`"+yr+"/"+mo+"/"+da+"` **@** `"+hr+":"+min+":"+sec+"`";let timeStampSys="["+yr+"/"+mo+"/"+da+" @ "+hr+":"+min+":"+sec+"] ";

	let g=member.guild; let u=member.user;
	console.log(timeStampSys+"[ADMIN] [QUIT] \""+u.username+"\" ("+u.id+") has left server: "+g.name);
});


//
// DATABASE TIMER FOR TEMPORARY ROLES
//
setInterval(function(){
	let CurrTime=new Date();
	let mo=CurrTime.getMonth()+1;if(mo<10){mo="0"+mo;}let da=CurrTime.getDate();if(da<10){da="0"+da;}let yr=CurrTime.getFullYear();
	let hr=CurrTime.getHours();if(hr<10){hr="0"+hr;}let min=CurrTime.getMinutes();if(min<10){min="0"+min;}let sec=CurrTime.getSeconds();if(sec<10){sec="0"+sec;}
	let timeStamp="`"+yr+"/"+mo+"/"+da+"` **@** `"+hr+":"+min+":"+sec+"`";let timeStampSys="["+yr+"/"+mo+"/"+da+" @ "+hr+":"+min+":"+sec+"] ";
	
	let timeNow=new Date().getTime(); let dbTime=""; let daysLeft="";
	sql.all(`SELECT * FROM temporary_roles`).then(rows => {
		if (!rows) {
			return console.info("No one is in the DataBase");
		}
		else {
			for(rowNumber="0"; rowNumber<rows.length; rowNumber++){
				dbTime=rows[rowNumber].endDate; daysLeft=(dbTime*1)-(timeNow*1);
				if(daysLeft<1){
					member=bot.guilds.get(config.serverID).members.get(rows[rowNumber].userID); if(!member){ member.user.username="<@"+rows[rowNumber].userID+">"; member.id=""; }
					console.log(timeStampSys+"[ADMIN] [TEMPORARY-ROLE] \""+member.user.username+"\" ("+member.id+") have lost their role: "+rows[rowNumber].temporaryRole+"... time EXPIRED");
					bot.channels.get(config.mainChannelID).send("⚠ <@"+rows[rowNumber].userID+"> have **lost** their role of: **"
						+rows[rowNumber].temporaryRole+"** - their **temporary** access has __EXPIRED__ 😭 ").catch(console.error);
					
					// REMOVE ROLE FROM MEMBER IN GUILD
					let rName=bot.guilds.get(config.serverID).roles.find('name', rows[rowNumber].temporaryRole); 
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


//
// END
//


// ##########################################################################
// ############################## TEXT MESSAGE ##############################
// ##########################################################################
bot.on('message', message => {
	
	let CurrTime=new Date();
	let mo=CurrTime.getMonth()+1;if(mo<10){mo="0"+mo;}let da=CurrTime.getDate();if(da<10){da="0"+da;}let yr=CurrTime.getFullYear();
	let hr=CurrTime.getHours();if(hr<10){hr="0"+hr;}let min=CurrTime.getMinutes();if(min<10){min="0"+min;}let sec=CurrTime.getSeconds();if(sec<10){sec="0"+sec;}
	let timeStamp="`"+yr+"/"+mo+"/"+da+"` **@** `"+hr+":"+min+":"+sec+"`";let timeStampSys="["+yr+"/"+mo+"/"+da+" @ "+hr+":"+min+":"+sec+"] ";
	
	//STOP SCRIPT IF DM/PM
	if(message.channel.type=="dm"){ return }
	
	// GET CHANNEL INFO
	let g=message.guild; let c=message.channel; let m=message.member; let msg=message.content; msg=msg.toLowerCase();
	
	// GET TAGGED USER
	let mentioned=""; if(message.mentions.users.first()){mentioned=message.mentions.users.first();}
	
	// REMOVE LETTER CASE (MAKE ALL LOWERCASE)
	let command=msg.toLowerCase(); command=command.split(" ")[0]; command=command.slice(config.cmdPrefix.length);
	
	// GET ARGUMENTS
	let args=msg.split(" ").slice(1); skip="no";
	
	// GET ROLES FROM CONFIG
	let AdminR=g.roles.find("name", config.adminRoleName); if(!AdminR){ AdminR.id=111111111111111111; console.info("[ERROR] [CONFIG] I could not find role: "+config.adminRoleName); }
	let ModR=g.roles.find("name", config.modRoleName); if(!ModR){ ModR.id=111111111111111111; console.info("[ERROR] [CONFIG] I could not find role: "+config.modRoleName); }
	


// ##########################################################################
// ############################## SPAM CONTROL ##############################
// ##########################################################################
	// AVOID ADVERTISEMENT | OTHER SERVER NAMES
	const advTxt=["seapokemap","sea-pokemap","pokehuntr","gymhuntr","pokefetch","pokehuntr.com","gymhuntr.com","pokefetch.com",
				"http://pokehuntr.com","http://gymhuntr.com","http://pokefetch.com","http://www.pokehuntr.com","http://www.gymhuntr.com","http://www.pokefetch.com"];
	
	// AVOID SPOOFTALKS
	const spoofTxt=["spoof","spooof","spooph","spoooph","sp00f","sp000f","spo0f","sp0of","s.p.o.o.f","s.p.o.0.f","s.p.0.o.f","s-p-o-o-f","joystick"];
	
	// FRIENDLY CHAT
	const censorTxt=["fuck","bastard","pussy","dick","cock","dildo","ballsack","boner","shit"," anal"," ass","buttplug","bitch","twat","whore","cunt","biatch","fag","queer","nigga","jizz"];
	
	// DATE&TIME VALUES
	const DTdays=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
	const DTmonths=["January","February","March","April","May","June","July","August","September","October","November","December"];
	
	
// ############################## NO OTHER INVITES EXCEPT ONES POSTED BY BOT OR STAFF ##############################
	let invLinks=msg.match(/discord.gg/g);
	if(invLinks){
		if(m.id===config.botID || m.roles.has(ModR.id) || m.roles.has(AdminR.id) || m.id===config.ownerID){skip="yes"}
		
		if(skip==="no"){
			message.delete();
			embedMSG={
				'color': 0xFF0000,
				'title': '⚠ WARNING: No Invites ⚠',
				'thumbnail': {'url': config.warningImg},
				'description': 'You are being **WARNED** about an __invite__ code or link... '
					+'Advertising of other servers is **NOT** allowed in our server.\n**OffenseDate**: '+timeStamp
			};
			console.log(timeStampSys+"[ADMIN] [INVITE-TXT] \""+m.user.username+"\" ("+m.id+") said: "+message.content);
			m.send({embed: embedMSG}).catch(console.error);
			return m.send("Please **Read/Review Our Rules** at: <#"+config.rulesChannelID+"> ... in order to avoid Mute/Kick/Ban");
		}
	}
	
	
	
// ############################## ADVERTISEMENT CHECKER ##############################
	if(advTxt.some(word => msg.includes(word))){
		
		// STOP SCRIPT IF USER IS ADMIN|OWNER|MOD|STAFF
		if(m.id===config.botID || m.roles.has(ModR.id) || m.roles.has(AdminR.id) || m.id===config.ownerID){skip="yes"}
		
		if(skip==="no"){
			message.delete();
			embedMSG={
				'color': 0xFF0000,
				'title': '⚠ WARNING: No Advertising ⚠',
				'thumbnail': {'url': config.warningImg},
				'description': 'You are being **WARNED** about a word/link... '
					+'Advertising is **NOT** allowed in our server.\n**OffenseDate**: '+timeStamp
			};
			console.log(timeStampSys+"[ADMIN] [ADV-TEXT] \""+m.user.username+"\" ("+m.id+") said: "+message.content);
			m.send({embed: embedMSG}).catch(console.error);
			return m.send("Please **Read/Review Our Rules** at: <#"+config.rulesChannelID+"> ... in order to avoid Mute/Kick/Ban");
		}
	}
	
	
	
// ############################## SPOOF-TALK CHECKER ##############################
	if(spoofTxt.some(word => msg.includes(word))){
		if(m){
			// STOP SCRIPT IF USER IS ADMIN|OWNER|MOD|STAFF
			if(message.author.id===config.botID || 
				m.roles.has(ModR.id) || 
					m.roles.has(AdminR.id) || 
						m.id===config.ownerID){skip="yes"}
			
			if(skip==="no"){
				message.delete();
				embedMSG={
					'color': 0xFF0000,
					'title': '⚠ WARNING: No SpoOf Talks ⚠',
					'thumbnail': {'url': config.warningImg},
					'description': 'You are being **WARNED** about a word... '
						+'**Spoof**-talk is **NOT** allowed in our server.\n**OffenseDate**: '+timeStamp
				};
				console.log(timeStampSys+"[ADMIN] [SPOOF-TEXT] \""+m.user.username+"\" ("+m.id+") said: "+message.content);
				m.send({embed: embedMSG}).catch(console.error);
				return m.send("Please **Read/Review Our Rules** at: <#"+config.rulesChannelID+"> ... in order to avoid Mute/Kick/Ban");
			}
		}
	}
	
	
	
// ############################## CENSORSHIP | FRIENDLY CHAT ##############################
	if(censorTxt.some(word => msg.includes(word))){
		
		// STOP SCRIPT IF USER IS ADMIN|OWNER|MOD|STAFF
		if(m.id===config.botID || m.roles.has(ModR.id) || m.roles.has(AdminR.id) || m.id===config.ownerID){skip="yes"}
		
		if(skip==="no"){
			message.delete();
			embedMSG={
				'color': 0xFF0000,
				'title': '⚠ WARNING: Watch Your Language ⚠',
				'thumbnail': {'url': config.warningImg},
				'description': 'You are being **WARNED** about a **inappropriate** word... '
					+'Please watch your language; kids play this game too, you know\n**OffenseDate**: '+timeStamp
			};
			console.log(timeStampSys+"[ADMIN] [CENSOR-TXT] \""+m.user.username+"\" ("+m.id+") said: "+message.content);
			m.send({embed: embedMSG}).catch(console.error);
			return m.send("Please **Read/Review Our Rules** at: <#"+config.rulesChannelID+"> ... in order to avoid Mute/Kick/Ban");
		}
	}


// ############################################################################
// ############################## COMMANDS BEGIN ##############################
// ############################################################################

	// MAKE SURE ITS A COMMAND
	if(!message.content.startsWith(config.cmdPrefix)){ return }
	
// ############################################################################
// ########################## COMMANDS SPAM CONTROL ###########################
// ############################################################################

	// SPAM CONTROL FOR COMMANDS
	if(message.content.startsWith(config.cmdPrefix) && command){
		
		// CONSOLE ALL COMMANDS TYPED
		// console.info(timeStampSys+"[ADMIN] \""+m.user.username+"\" ("+m.id+") used command: [!"+command+" "+args+"] in server: \""+g.name+"\", channel: #"+c.name);
		
		// STOP SCRIPT IF USER IS ADMIN|OWNER|MOD|STAFF
		if(m.id===config.botID || m.roles.has(ModR.id) || m.roles.has(AdminR.id) || m.id===config.ownerID){ 
			skip="yes"; 
			// console.info(timeStampSys+"[ADMIN] [SPAM CONTROL] COMMANDS-SPAM-CONTROL Stopped for ADMIN|OWNER|MOD|STAFF"); 
		}
		
		if(skip==="no"){
			// CHECK DATABASE IF USER EXIST AND/OR TYPED A COMMAND
			sql.get(`SELECT * FROM cmd_spamCTRL WHERE userID="${m.id}"`).then(row => {
				
				// USER NOT FOUND IN DATABASE
				if (!row) {
					sql.run("INSERT INTO cmd_spamCTRL (userID, cmdCount) VALUES (?, ?)", [m.id, 1]);
					return console.info(timeStampSys+"[ADMIN] [SPAM CONTROL] I've added \""+m.user.username+"\" ("+m.id+") to my `DataBase`, they were not in it!");
				}
				
				// USER FOUND IN DATABASE
				else {
					sql.get(`SELECT * FROM cmd_spamCTRL WHERE userID="${m.id}"`).then(row => {
						
						// GET CMD COUNT, AND ADD 1
						let cmdCurCount=row.cmdCount; cmdCurCount++;
						sql.run("UPDATE cmd_spamCTRL SET cmdCount="+cmdCurCount+" WHERE userID="+m.id).catch(console.error);
						// console.info(timeStampSys+"[ADMIN] [SPAM CONTROL] Added +1 to user: "+m.user.username+" ("+m.id+")'s cmdCount");
						
						// GET CMD COUNT AGAIN FOR FEEDBACK AND TIMER
						sql.get(`SELECT * FROM cmd_spamCTRL WHERE userID="${m.id}"`).then(row => {
							
							// IF TYPED 4 COMMANDS, KICK FOR SPAM
							if(row.cmdCount==="4"){
								m.send("⚠ **NOTICE:** you have been **KICKED** due to: **command SPAM/ABUSE**, next time it will be a **BAN**");
								c.send("⚠ **NOTICE:** "+m.user+" has been **KICKED** due to: **command SPAM/ABUSE**, next time it will be a **BAN**");
								embedMSG={
									'color': 0xFF0000,
									'title': '"'+m.user.username+'" HAS BEEN KICKED',
									'thumbnail': {'url': config.kickedImg},
									'description': '**UserID**: '+m.user.id+'\n**UserTag**: '+m.user.username+'\n'
										+'**Reason**: Command Spamming\n**Command**: !'+message.content+'\n\n**By**: AutoDetect \n**On**: '+timeStamp
								};
								bot.channels.get(config.modlogChannelID).send({embed: embedMSG}).catch(console.error);
								g.member(m.user.id).kick();
							}
							
							// IF TYPED 3 COMMANDS WARN THEM
							if(row.cmdCount==="3"){
								console.info(timeStampSys+"[ADMIN] [SPAM CONTROL] WARNING: "+m.user.username+" ("+m.id+") have used 3 consecutive commands, they could be KICKED...");
								m.send("⚠ **WARNING:** you have used 3 consecutive commands, please allow **15 seconds** between each command! **1 more and you will be __KICKED__**");
								c.send("⚠ **WARNING:** "+m.user+", you have used 3 consecutive commands, please allow **15 seconds** between each command! **1 more and you will be __KICKED__**");
							}
							
							// RESET COUNT AFTER 15000 MILISECONDS (15 SECS DUH!)
							setTimeout(function(){sql.run("UPDATE cmd_spamCTRL SET cmdCount=0 WHERE userID="+m.id).catch(console.error);},15000);
						});
					});
				}
			}).catch(() => {
				console.error;
				sql.run("CREATE TABLE IF NOT EXISTS cmd_spamCTRL (userID TEXT, cmdCount TEXT)").then(() => {
					sql.run("INSERT INTO cmd_spamCTRL (userID, cmdCount) VALUES (?, ?)", [m.id, 1]);
					console.info(timeStampSys+"[ADMIN] [SPAM CONTROL] Table was not found in DataBased, I've created it.");
					console.info(timeStampSys+"[ADMIN] [SPAM CONTROL] I've added \""+m.user.username+"\" ("+m.id+") to my `DataBase`, they were not in it!");
				});
			});
		}
	}

	
	
// ############################## STATS ##############################
	if(command==="stats"){
		if(m.roles.has(ModR.id) || m.roles.has(AdminR.id) || m.id===config.ownerID){
			let onlineM=g.members.filter(m=>m.presence.status==="online").size;
			let idleM=g.members.filter(m=>m.presence.status==="idle").size;
			let busyM=g.members.filter(m=>m.presence.status==="dnd").size;
			let totalM=onlineM+idleM+busyM;
			
			embedMSG={
				'color': 0x00FF00,
				'title': '📊 SERVER STATS 📈',
				'description': ''
					+'🗨 **Online** members: **'+onlineM+'**\n'
					+'📵 **Idle** members: **'+idleM+'**\n'
					+'🔴 **Busy** members: **'+busyM+'**\n'
					+'🚫 **Invisible** members: **'+g.members.filter(m=>m.presence.status==="offline").size+'**\n'
					+'💚 **Total Online** members: **'+totalM+'**\n'
					+'📋 **Total** members __Today__: **'+g.members.size+'**\n'
					+'📜 **Registered** members: **'+g.memberCount+'**'
			};
			return c.send({embed: embedMSG}).catch(console.error);
		}
		else {
			message.delete();
			return message.reply("you are **NOT** allowed to use this command!").catch(console.error); 
		}
	}
	

	
	
// ############################## INFO ##############################
	if(command==="info"){
		if(m.roles.has(ModR.id) || m.roles.has(AdminR.id) || m.id===config.ownerID){
			if(args[0]==="server"){
				let gDate=g.createdAt; let gCreatedDate=DTdays[gDate.getDay()].slice(0,3)+" "+DTmonths[gDate.getMonth()]+" "+gDate.getDate()+", "+gDate.getFullYear();
				let userBots=message.guild.members.filter(b => b.user.bot);
				embedMSG={
					'color': 0x00FF00,
					'title': '📊 '+g.name+' » ServerInfo 📈',
					'thumbnail': {'url': g.iconURL},
					'fields': [
						{'name': '👤 ServerOwner:', 'value': '<@'+g.owner.id+'>', 'inline': true},
						{'name': '📆 DateCreated:','value': gCreatedDate,'inline': true},
						{'name': '📝 RolesCount:','value': g.roles.size,'inline': true},
						{'name': '👥 MemberCount:','value': g.memberCount,'inline': true},
						{'name': '🤖 UserBots:','value': userBots.size,'inline': true},
						{'name': '🗒 Channels:','value': g.channels.size,'inline': true}
					]
				};
				return c.send({embed: embedMSG}).catch(console.error);
			}
			if(mentioned){
				let gMember=g.members.get(mentioned.id);
				
				let joinedAt=""; let joinedDT=""; let joinedDate=""; let mRolesName=""; let userRoleCount=""; let roleNames="";
				
				// MEMBER NICKNAME
				if(!gMember.nickname){gMember.nickname="No \"/Nick\" yet"}
				
				// JOINED DATE()
				joinedAt=gMember.joinedTimestamp; joinedDT=new Date(); joinedDT.setTime(joinedAt);
				joinedDate=DTdays[joinedDT.getDay()].slice(0,3)+" "+DTmonths[joinedDT.getMonth()]+" "+joinedDT.getDate()+", "+joinedDT.getFullYear();
				
				// MEMBER ROLES
				mRolesName=gMember.roles.map(r => r.name); mRolesName=mRolesName.slice(1); userRoleCount=mRolesName.length; if(!mRolesName){userRoleCount=0} roleNames="NONE "; 
				if(userRoleCount!==0){ roleNames=mRolesName }
				
				embedMSG={
					'color': 0x00FF00,
					'title': '👤 '+mentioned.username+'\'s UserInfo',
					'thumbnail': {'url': 'https://cdn.discordapp.com/avatars/'+mentioned.id+'/'+mentioned.avatar+'.png'},
					'fields': [
						{'name': '⚠ Warning:', 'value': 'The member is inactive! The info I found is limited!', 'inline': false},
						{'name': '👥 Nick/AKA', 'value': '`'+gMember.nickname+'`', 'inline': true},
						{'name': '🕵 UserID', 'value': '`'+mentioned.id+'`', 'inline': true},
						{'name': '📝 Roles ('+userRoleCount+')', 'value': '`'+roleNames+'`', 'inline': true},
						{'name': '📆 JoinedDate', 'value': '`'+joinedDate+'`', 'inline': true}
					]
				};
				
				// LAST SEEN INFO - ONLY AVAILABLE IF MEMBER TYPED SOMETHING IN THE LAST 60 SECONDS - PER DISCORD DEFAULTS
				if(mentioned.lastMessage!==null){
					// LAST SEEN DATE
					let seenDT=new Date(); seenDT.setTime(mentioned.lastMessage.createdTimestamp); 
					let seenHr=seenDT.getHours(); if(seenHr<10){seenHr="0"+seenHr} let seenMin=seenDT.getMinutes(); if(seenMin<10){seenMin="0"+seenMin}
					let seenDate=seenDT.getDate()+"/"+DTmonths[seenDT.getMonth()].slice(0,3)+"/"+seenDT.getFullYear()+" @ "+seenHr+":"+seenMin+"hrs";
					
					embedMSG={
						'color': 0x00FF00,
						'title': '👤 '+mentioned.username+'\'s UserInfo',
						'thumbnail': {'url': 'https://cdn.discordapp.com/avatars/'+mentioned.id+'/'+mentioned.avatar+'.png'},
						'fields': [
							{'name': '👥 Nick/AKA', 'value': '`'+gMember.nickname+'`', 'inline': true},
							{'name': '🕵 UserID', 'value': '`'+mentioned.id+'`', 'inline': true},
							{'name': '📝 Roles ('+userRoleCount+'):', 'value': '`'+roleNames+'`', 'inline': true},
							{'name': '📆 JoinedDate:', 'value': '`'+joinedDate+'`', 'inline': true},
							{'name': '👁‍ LastSeenChannel:', 'value': '`#'+mentioned.lastMessage.channel.name+'`', 'inline': true},
							{'name': '⏲ LastSeenDate:', 'value': '`'+seenDate+'`', 'inline': true},
							{'name': '🗨 LastMessageSent:', 'value': '`'+mentioned.lastMessage.content+'`', 'inline': true}
						]
					};
				}
				return c.send({embed: embedMSG}).catch(console.error);
			}
		}
		else {
			message.delete();
			return message.reply("you are **NOT** allowed to use this command!").catch(console.error); 
		}
	}
	
	
	
// ############################## DELETE ##############################
	if(command==="del"){ 
		if(m.roles.has(ModR.id) || m.roles.has(AdminR.id) || m.id===config.ownerID){
			let amt=parseInt(msg.split(" ").slice(1))+1;
			c.fetchMessages({ limit: amt })
			.then(messages => c.bulkDelete(amt), console.log(timeStampSys+"[ADMIN] [DELETE] \""+m.user.username+"\" deleted: "+amt+" messages from: "+g.name+" in: #"+c.name)).catch(console.error);
			return;
		}
		else {
			message.delete();
			return message.reply("you are **NOT** allowed to use this command!").catch(console.error); 
		}
	}
	
	
	
// ############################## OFFLINE ##############################
	if(command==="offline"){
		let damsg; if(!args[0]){damsg="UnKnown";}
		else {damsg="";} for (var x=1; x<args.length; x++){ damsg += " "+args[x]; }
		if(m.roles.has(AdminR.id) || m.id===config.ownerID){
			message.delete();
			c.send("⚠ @everyone ⚠\nWe're going **Offline** for: __"+args[0]+"__; "+damsg);

			embedMSG={
				'color': 0xFF0000,
				'title': 'WE ARE GOING OFFLINE',
				'thumbnail': {'url': config.offlineImg},
				'description': '\n__Reason__: **'+damsg
					+'**\n__Estimated Time__: **'+args[0]+'**\n\nSorry for the inconvenience'
			};
			return bot.channels.get(config.announcementChannelID).send({embed: embedMSG}).catch(console.error);
		}
		else {
			message.delete();
			return message.reply("you are **NOT** allowed to use this command!").catch(console.error); 
		}
	}
	
	
	
// ############################## ROLES ##############################
	if(command.startsWith("role")){
		
		// ROLES ARE CASE SENSITIVE TO RESET MESSAGE AND ARGUMENTS
		msg=message.content; args=msg.split(" ").slice(1);
		
		if(m.roles.has(ModR.id) || m.roles.has(AdminR.id) || m.id===config.ownerID){
			message.delete();
			if(!args[0]){
				return message.reply("usage: `!roles count`,\n or `!roles find <ROLE-NAME>`,\n or `!role @mention <ROLE-NAME>`,\n or `!role remove @mention <ROLE-NAME>`");
			}
			if(args[0]==="count"){
				return c.send("There are **"+g.roles.size+"** roles on this server");
			}
			if(args[0]==="find"){
				let daRolesN=g.roles.map(r => r.name); let meantThis="";
				
				// ROLES WITH SPACES - NEW
				let daRoles="";if(!args[2]){daRoles=args[1]}else{daRoles="";for(var x=1;x<args.length;x++){daRoles+=args[x]+" ";}daRoles=daRoles.slice(0,-1);}
				
				let rName=g.roles.find('name', daRoles); 
				if(!rName){
					let startWord=args[1].slice(0,3);
					for (var i=0;i<daRolesN.length;i++){
						if(daRolesN[i].startsWith(startWord)){
							meantThis += daRolesN[i] +", ";
						}
					}
					if(!meantThis){
						startWord=args[1].slice(0,2); meantThis="";
						for (var i=0;i<daRolesN.length;i++){
							if(daRolesN[i].startsWith(startWord)){
								meantThis += daRolesN[i] +", ";
							}
						}
					}
					if(!meantThis){
						startWord=args[1].slice(0,1); meantThis="";
						for (var i=0;i<daRolesN.length;i++){
							if(daRolesN[i].startsWith(startWord)){
								meantThis += daRolesN[i] +", ";
							}
						}
					}
					if(meantThis){
						return message.reply("I couldn't find such role, but I found these **roles**: "+meantThis.slice(0,-2));
					}
					return message.reply("I couldn't find such role, please try again! syntax: `!roles find <ROLE-NAME>`");
				}
				else {
					return message.reply("found it! who would you like to assign this role to? IE: `!role @mention "+daRoles+"`");
				}
			}
			if(args[0]==="remove"){
				let daRolesN=g.roles.map(r => r.name); let meantThis="";
				
				// ROLES WITH SPACES - NEW
				let daRoles="";if(!args[3]){daRoles=args[2]}else{daRoles="";for(var x=2;x<args.length;x++){daRoles+=args[x]+" ";}daRoles=daRoles.slice(0,-1);}
				
				if(!mentioned){
					return message.reply("please `@mention` a person you want me to remove `!role` from...");
				}
				if(!args[2]){
					return message.reply("what role do you want me to remove from "+mentioned+" 🤔 ?");
				}
				
				// CHECK ROLE EXIST
				let rName=g.roles.find('name', daRoles); 
				if(!rName){
					return message.reply("I couldn't find such role, please try searching for it first: `!roles find <ROLE-NAME>`");
				}
				
				// CHECK MEMBER HAS ROLE
				if(!g.members.get(mentioned.id).roles.has(rName.id)){
					return c.send("Member doesnt have this role");
				}
				else {
					mentioned=message.mentions.members.first();
					mentioned.removeRole(rName).catch(console.error);
					return c.send("⚠ "+mentioned+" have **lost** their role of: **"+daRoles+"** 😅 ");
				}
			}
			if(args[0] && !mentioned){
				return message.reply("please `@mention` a person you want me to give/remove `!role` to...");
			}
			else {
				let daRoles="";if(!args[2]){daRoles=args[1]}else{daRoles="";for(var x=1;x<args.length;x++){daRoles+=args[x]+" ";}daRoles=daRoles.slice(0,-1);}
				mentioned=message.mentions.members.first();
				
				let rName=g.roles.find('name', daRoles); 
				if(!rName){
					return message.reply("I couldn't find such role, please try searching for it first: `!roles find <ROLE-NAME>`");
				}
				mentioned.addRole(rName).catch(console.error);
				return c.send("👍 "+mentioned+", has been given the role of: **"+daRoles+"**, enjoy! 🎉");
			}
		}
		else {
			message.delete();
			return message.reply("you are **NOT** allowed to use this command!").catch(console.error); 
		}
	}
	
	
	
// ############################## ROLES ##############################
	if(command.startsWith("temprole") || command==="tr" || command==="trole"){
		
		// ROLES ARE CASE SENSITIVE TO RESET MESSAGE AND ARGUMENTS
		msg=message.content; args=msg.split(" ").slice(1);
		
		if(m.roles.has(ModR.id) || m.roles.has(AdminR.id) || m.id===config.ownerID){
			message.delete();
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
				let beginningOfTime=1511753994999; let dateMultiplier=86400000; mentioned=message.mentions.members.first(); 
				
				// CREATE DATABASE TABLE 
				sql.run("CREATE TABLE IF NOT EXISTS temporary_roles (userID TEXT, temporaryRole TEXT, startDate TEXT, endDate TEXT, addedBy TEXT)").catch(console.error);
				
				// CHECK DATABASE FOR ROLES
				if(args[0]==="check"){
					mentioned=message.mentions.members.first(); 
					sql.get(`SELECT * FROM temporary_roles WHERE userID="${mentioned.id}"`).then(row => {
						if(!row){
							return message.reply("⚠ [ERROR] "+mentioned+" is __NOT__ in my `DataBase`");
						}
						else {
							let startDateVal=new Date(); startDateVal.setTime(row.startDate); 
							startDateVal=(startDateVal.getMonth()+1)+"/"+startDateVal.getDate()+"/"+startDateVal.getFullYear();
							let endDateVal=new Date(); endDateVal.setTime(row.endDate); 
							finalDate=(endDateVal.getMonth()+1)+"/"+endDateVal.getDate()+"/"+endDateVal.getFullYear();
							return c.send("✅ "+mentioned+" will lose the role: **"+row.temporaryRole+"** on: `"+finalDate+"`! They were added by: <@"+row.addedBy+"> on: `"+startDateVal+"`");
						}
					}).catch(console.error); return
				}
				
				// REMOVE MEMBER FROM DATABASE
				if(args[0]==="remove"){
					mentioned=message.mentions.members.first(); 
					sql.get(`SELECT * FROM temporary_roles WHERE userID="${mentioned.id}"`).then(row => {
						if(!row){
							return message.reply("⚠ [ERROR] "+mentioned+" is __NOT__ in my `DataBase`");
						}
						else {
							let theirRole=g.roles.find('name', row.temporaryRole);
							mentioned.removeRole(theirRole).catch(console.error);
							sql.get(`DELETE FROM temporary_roles WHERE userID="${mentioned.id}"`).then(row => {
								return c.send("⚠ "+mentioned+" have **lost** their role of: **"+theirRole.name+"** and has been removed from my `DataBase`");
							});
						}
					}).catch(console.error); return
				}
				
				// CHECK AMOUNT OF DAYS WERE ADDED
				if(!args[1]){
					return message.reply("for how **many** days do you want "+mentioned+" to have this role?");
				}
				
				if(!args[2]){
					return message.reply("what role do you want to assign to "+mentioned+"?");
				}
				
				// ROLES WITH SPACES - NEW
				let daRoles="";if(!args[3]){daRoles=args[2]}else{daRoles="";for(var x=2;x<args.length;x++){daRoles+=args[x]+" ";}daRoles=daRoles.slice(0,-1);}
				
				if(!parseInt(args[1])){
					return message.reply("Error: second value has to be **X** number of days, IE:\n`!"+command+" @"+mentioned.user.username+" 90 "+daRoles+"`");
				}
				
				// CHECK ROLE EXIST
				let rName=g.roles.find('name', daRoles);
				if(!rName){
					return message.reply("I couldn't find such role, please try searching for it first: `!roles find <ROLE-NAME>`");
				}
				
				// ADD MEMBER TO DATASE, AND ADD THE ROLE TO MEMBER
				sql.get(`SELECT * FROM temporary_roles WHERE userID="${mentioned.id}"`).then(row => {
					mentioned=message.mentions.members.first(); 
					if (!row) {
						let curDate=new Date(); let endDateVal=new Date(); let finalDateDisplay=new Date(); 
						let finalDate=((args[1])*(dateMultiplier)); finalDate=((beginningOfTime)+(finalDate));
						finalDateDisplay.setTime(finalDate); finalDateDisplay=(finalDateDisplay.getMonth()+1)+"/"+finalDateDisplay.getDate()+"/"+finalDateDisplay.getFullYear();
						
						sql.run("INSERT INTO temporary_roles (userID, temporaryRole, startDate, endDate, addedBy) VALUES (?, ?, ?, ?, ?)", 
							[mentioned.id, daRoles, curDate, finalDate, m.id]);
						let theirRole=g.roles.find('name', daRoles);
						mentioned.addRole(theirRole).catch(console.error);
						console.log(timeStampSys+"[ADMIN] [TEMPORARY-ROLE] \""+mentioned.user.username+"\" ("+mentioned.id+") was given role: "+daRoles+" by: "+m.user.username+" ("+m.id+")");
						return c.send("🎉 "+mentioned+" has been given a **temporary** role of: **"+daRoles+"**, enjoy! They will lose this role on: `"+finalDateDisplay+"`");
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
	
	
	
// ############################## WARNING ##############################
	if(command==="warn"){ 
		let damsg; if(!args[1]){damsg="No-Reason-Given... but watch your recent actions or chat";}
		else {damsg="";} for (var x=1; x<args.length; x++){ damsg += " "+args[x]; }
		
		if(m.roles.has(ModR.id) || m.roles.has(AdminR.id) || m.id===config.ownerID){
			if(!mentioned){
				message.delete();
				return message.reply("please `@mention` a person you want me to `!warn`");
			}
			else {
				message.delete();
				let customed="no";
				if(args[1]==="spam"){
					customed="yes"; args[1]="SPAM:\n";
					c.send("⚠ "+mentioned+", you are being **WARNED** about: **SPAM**, please read our \\\u00BB <#"+config.rulesChannelID+"> \\\u00AB to avoid a **MUTE**").catch(console.error);
				}
				if(args[1]==="foul"){
					customed="yes"; args[1]="Foul Language!:\n";
					c.send("⚠ "+mentioned+", you are being **WARNED** about your **foul language**, please read our \\\u00BB <#"+config.rulesChannelID+"> \\\u00AB to avoid a **MUTE**").catch(console.error);
				}
				if(args[1]==="pics"){ 
					customed="yes"; args[1]="Too many images:\n";
					c.send("⚠ "+mentioned+", you are being **WARNED** about your **images**, please read our \\\u00BB <#"+config.rulesChannelID+"> \\\u00AB to avoid a **MUTE**").catch(console.error);
				}
				if(args[1]==="troll" || args[1]==="trolling"){
					customed="yes"; args[1]="Trolling:\n";
					c.send("⚠ "+mentioned+", you are being **WARNED** about your **TROLLS**, please turn it down and read our \\\u00BB <#"+config.rulesChannelID+"> \\\u00AB to avoid a **MUTE**").catch(console.error);
				}
				if(args[1]==="adv"){
					customed="yes"; args[1]="Advertising:\n";
					c.send("⚠ "+mentioned+", you are being **WARNED** about your **Advertising**, No Advertising is allowed! read our \\\u00BB <#"+config.rulesChannelID+"> \\\u00AB to avoid a **MUTE**").catch(console.error);
				}
				if(customed==="no"){
					c.send("⚠ "+mentioned+", you are being **WARNED** about: **"+damsg+'**');
				}
				embedMSG={
					'color': 0xFF0000,
					'title': '⚠ THIS IS A WARNING ⚠',
					'thumbnail': {'url': config.warningImg},
					'description': '**From Server**: '+config.serverName+'\n**Reason**: '+damsg+'\n\n**By**: '+m.user+'\n**On**: '+timeStamp
				};
				bot.users.get(mentioned.id).send({embed: embedMSG}).catch(console.error);
				embedMSG={
					'color': 0xFF0000,
					'title': '"'+mentioned.username+'" HAS BEEN WARNED',
					'thumbnail': {'url': config.warningImg},
					'description': '**UserID**: '+mentioned.id+'\n**UserTag**: '+mentioned+'\n'
						+'**Reason**: '+damsg+'\n\n**By**: '+m.user+'\n**On**: '+timeStamp
				};
				return bot.channels.get(config.modlogChannelID).send({embed: embedMSG}).catch(console.error);
			}
		}
		else {
			message.delete();
			return message.reply("you are **NOT** allowed to use this command!").catch(console.error); 
		}
	}
	
	
	
// ############################## MUTE ##############################
	if(command==="mute"){
		let damsg; if(!args[1]){damsg="No-Reason-Given";}
		else {damsg="";} for (var x=1; x<args.length; x++){ damsg += " "+args[x]; }
		
		if(m.roles.has(ModR.id) || m.roles.has(AdminR.id) || m.id===config.ownerID){

			if(!mentioned){
				message.delete();
				return message.reply("please `@mention` a person you want me to `!mute`");
			}
			else {
				message.delete();
				c.overwritePermissions(mentioned, {SEND_MESSAGES: false})
				.then(() => {
					embedMSG={
						'color': 0xFF0000,
						'title': '"'+mentioned.username+'" HAS BEEN MUTED',
						'thumbnail': {'url': config.mutedImg},
						'description': '**UserID**: '+mentioned.id+'\n**UserTag**: '+mentioned+'\n'
							+'**Channel**: <#'+c.id+'>\n**Reason**: '+damsg+'\n\n**By**: '+m.user+'\n**On**: '+timeStamp
					};
					bot.channels.get(config.modlogChannelID).send({embed: embedMSG}).catch(console.error);
					console.log(timeStampSys+"[ADMIN] [MUTE] \""+mentioned.username+"\" ("+mentioned.id+") was MUTED in guild: "+g.name+", channel: #"+c.name+" due to: "+damsg);
					return c.send("⚠ "+mentioned+" has been 🤐 **MUTED** 🤐 for: **"+damsg+'**');
				}).catch(console.error);
			}
		}
		else {
			message.delete();
			return message.reply("you are **NOT** allowed to use this command!").catch(console.error); 
		}
	}
	
	
	
// ############################## UNMUTE ##############################
	if(command==="unmute"){
		let damsg; if(!args[1]){damsg="No-Reason-Given";}
		else {damsg="";} for (var x=1; x<args.length; x++){ damsg += " "+args[x]; }
		
		if(m.roles.has(ModR.id) || m.roles.has(AdminR.id) || m.id===config.ownerID){

			if(!mentioned){
				message.delete();
				return message.reply("please `@mention` a person you want me to `!unmute`");
			}
			else {
				message.delete();
				c.permissionOverwrites.get(mentioned.id).delete();
				c.send(mentioned+" can now **type/send** messages again 👍 ... but **don't** abuse it!");
			}
		}
		else {
			message.delete();
			return message.reply("you are **NOT** allowed to use this command!").catch(console.error); 
		}
	}
	
	
	
// ############################## KICK ##############################
	if(command==="kick"){
		let damsg; if(!args[1]){damsg="No-Reason-Given";}
		else {damsg="";} for (var x=1; x<args.length; x++){ damsg += " "+args[x]; }
		
		if(m.roles.has(ModR.id) || m.roles.has(AdminR.id) || m.id===config.ownerID){

			if(!mentioned){
				message.delete();
				return message.reply("please `@mention` a person you want me to `!kick`");
			}
			else {
				console.log(timeStampSys+"[ADMIN] [KICK] \""+mentioned.username+"\" ("+mentioned.id+") was KICKED from guild: "+g.name+", channel: #"+c.name+" due to: "+damsg);
				mentioned=message.mentions.users.first();
				g.member(mentioned.id).kick().then(member=>{ 
					c.send("⚠ "+mentioned+" has been __**kicked**__ from server for: "+damsg).catch(console.error);
				}).catch(console.error);
				embedMSG={
					'color': 0xFF0000,
					'title': 'YOU HAVE BEEN KICKED',
					'thumbnail': {'url': config.kickedImg},
					'description': '**From Server**: '+config.serverName+'\n**Reason**: '+damsg+'\n\n**By**: '+m.user+'\n**On**: '+timeStamp
				};
				bot.users.get(mentioned.id).send({embed: embedMSG}).catch(console.error);
				embedMSG={
					'color': 0xFF0000,
					'title': '"'+mentioned.username+'" HAS BEEN KICKED',
					'thumbnail': {'url': config.kickedImg},
					'description': '**UserID**: '+mentioned.id+'\n**UserTag**: '+mentioned+'\n'
						+'**Reason**: '+damsg+'\n\n**By**: '+m.user+'\n**On**: '+timeStamp
				};
				return bot.channels.get(config.modlogChannelID).send({embed: embedMSG}).catch(console.error);
			}
		}
		else {
			message.delete();
			return message.reply("you are **NOT** allowed to use this command!").catch(console.error); 
		}
	}
	
	
	
// ############################## BAN ##############################
	if(command==="ban"){
		let damsg; if(!args[1]){damsg="No-Reason-Given";}
		else {damsg="";} for (var x=1; x<args.length; x++){ damsg += " "+args[x]; }
		
		if(m.roles.has(ModR.id) || m.roles.has(AdminR.id) || m.id===config.ownerID){

			if(!mentioned){
				message.delete();
				return message.reply("please `@mention` a person you want me to `!kick`");
			}
			else {
				console.log(timeStampSys+"[ADMIN] [BAN] \""+mentioned.username+"\" ("+mentioned.id+") was BANNED from guild: "+g.name+", channel: #"+c.name+" due to: "+damsg);
				mentioned=message.mentions.users.first();
				g.member(mentioned.id).ban({days: 7, reason: damsg}).then(member=>{ 
					c.send("⚠ "+mentioned+" has been __**banned**__ from server for: "+damsg).catch(console.error);
				}).catch(console.error);
				embedMSG={
					'color': 0xFF0000,
					'title': 'YOU HAVE BEEN BANNED',
					'thumbnail': {'url': config.bannedImg},
					'description': '**From Server**: '+config.serverName+'\n**Reason**: '+damsg+'\n\n**By**: '+m.user+'\n**On**: '+timeStamp
				};
				return bot.users.get(mentioned.id).send({embed: embedMSG}).catch(console.error);
			}
		}
		else {
			message.delete();
			return message.reply("you are **NOT** allowed to use this command!").catch(console.error); 
		}
	}	
	
	
	
	if(command==="restart"){
		if(m.id===config.ownerID){
			if(args[0]==="admin"){
				message.reply("Restarting **Admin** (`adminBot.js`) module... please wait `5` to `10` seconds").then(()=>{ process.exit(1) }).catch(console.error);
			}
		}
	}	
});



// log our bot in
bot.login(config.token);



bot.on('disconnected', function (){
	let CurrTime=new Date();
	let mo=CurrTime.getMonth()+1;if(mo<10){mo="0"+mo;}let da=CurrTime.getDate();if(da<10){da="0"+da;}let yr=CurrTime.getFullYear();
	let hr=CurrTime.getHours();if(hr<10){hr="0"+hr;}let min=CurrTime.getMinutes();if(min<10){min="0"+min;}let sec=CurrTime.getSeconds();if(sec<10){sec="0"+sec;}
	let timeStamp="`"+yr+"/"+mo+"/"+da+"` **@** `"+hr+":"+min+":"+sec+"`";let timeStampSys="["+yr+"/"+mo+"/"+da+" @ "+hr+":"+min+":"+sec+"] ";
	console.info(timeStampSys+'-- Disconnected --');console.log(console.error);
	process.exit(1);
});

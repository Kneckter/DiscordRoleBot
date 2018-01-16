const Discord=require('discord.js');
const config=require('./files/config.json');
const bot=new Discord.Client();



bot.on('ready', () => {
	let CurrTime=new Date();
	let mo=CurrTime.getMonth()+1;if(mo<10){mo="0"+mo;}let da=CurrTime.getDate();if(da<10){da="0"+da;}let yr=CurrTime.getFullYear();
	let hr=CurrTime.getHours();if(hr<10){hr="0"+hr;}let min=CurrTime.getMinutes();if(min<10){min="0"+min;}let sec=CurrTime.getSeconds();if(sec<10){sec="0"+sec;}
	let timeStamp="`"+yr+"/"+mo+"/"+da+"` **@** `"+hr+":"+min+":"+sec+"`";let timeStampSys="["+yr+"/"+mo+"/"+da+" @ "+hr+":"+min+":"+sec+"] ";
	console.info(timeStampSys+'-- DISCORD HELPBOT [ROLES] IS READY --');console.log(console.error);
});



//
// SETTINGS
//

const freeServer="266787569419812864";
const vipServer="348653565721444352";

const rolesChan="402055424771358720";


//
// END OF: SETTINGS
//



bot.on("guildMemberAdd", member => {
	let CurrTime=new Date();
	let mo=CurrTime.getMonth()+1;if(mo<10){mo="0"+mo;}let da=CurrTime.getDate();if(da<10){da="0"+da;}let yr=CurrTime.getFullYear();
	let hr=CurrTime.getHours();if(hr<10){hr="0"+hr;}let min=CurrTime.getMinutes();if(min<10){min="0"+min;}let sec=CurrTime.getSeconds();if(sec<10){sec="0"+sec;}
	let timeStamp="`"+yr+"/"+mo+"/"+da+"` **@** `"+hr+":"+min+":"+sec+"`";let timeStampSys="["+yr+"/"+mo+"/"+da+" @ "+hr+":"+min+":"+sec+"] ";

	let guild=member.guild; let user=member.user;
	
	if(guild.id===freeServer){
		// bot.channels.get(rolesChan).send(timeStamp+" "+user+"/"+user.username+" (`"+user.id+"`) has **joined** » [`"+guild.name+"`]");
		
		let sdhUser=bot.guilds.get(vipServer).members.get(user.id);
		if(!sdhUser){
			// console.info(timeStampSys+"[AUTO-ROLES] User: \""+user.username+"\" ("+user.id+") not found in SDH-VIP");
			return // bot.channels.get(rolesChan).send(timeStamp+"[AUTO-ROLES] User: \"**"+user.username+"**\" (`"+user.id+"`) was **not** found in » [`"+bot.guilds.get(vipServer).name+"`]");
		}
		
		// MEMBER ROLES
		mRolesName=sdhUser.roles.map(r => r.name);mRolesName=mRolesName.slice(1);userRoleCount=mRolesName.length;
		if(!mRolesName){userRoleCount=0}roleNames="NONE";
		if(userRoleCount!==0){
			roleNames=mRolesName
			for(var r="0";r<userRoleCount;r++){
				let rName=guild.roles.find('name', mRolesName[r]);
				if(!rName){
					bot.channels.get(rolesChan).send("I couldn't find role: **"+mRolesName[r]+"** over at `"+guild.name+"`, please make sure it exist, exact name!");
				}
				if(rName){
					guild.members.get(user.id).addRole(rName).catch(console.error);
					// bot.channels.get(rolesChan).send("👍 "+user+" has been given the role of: **"+mRolesName[r]+"**, over at: `"+guild.name+"`! 🎉");
				}
			}
		}
		return // bot.channels.get(rolesChan).send(timeStamp+"[AUTO-ROLES] User: \"**"+user.username+"**\" (`"+user.id+"`) has roles: `"+roleNames+"`");
		
	}
	if(guild.id===vipServer){
		// bot.channels.get(rolesChan).send(timeStamp+" "+user+"/"+user.username+" (`"+user.id+"`) has **joined** » [`"+guild.name+"`]");
		
		let sdhUser=bot.guilds.get(freeServer).members.get(user.id);
		if(!sdhUser){
			// console.info(timeStampSys+"[AUTO-ROLES] User: \""+user.username+"\" ("+user.id+") not found in SDH-VIP");
			return // bot.channels.get(rolesChan).send(timeStamp+"[AUTO-ROLES] User: \"**"+user.username+"**\" (`"+user.id+"`) was **not** found in » [`"+bot.guilds.get(freeServer).name+"`]");
		}
		
		// MEMBER ROLES
		mRolesName=sdhUser.roles.map(r => r.name);mRolesName=mRolesName.slice(1);userRoleCount=mRolesName.length;
		if(!mRolesName){userRoleCount=0}roleNames="NONE";
		if(userRoleCount!==0){
			roleNames=mRolesName
			for(var r="0";r<userRoleCount;r++){
				let rName=guild.roles.find('name', mRolesName[r]);
				if(!rName){
					bot.channels.get(rolesChan).send("⚠ I couldn't find role: **"+mRolesName[r]+"** over at `"+guild.name+"`, please make sure it exist, it must have **exact name**!");
				}
				if(rName){
					guild.members.get(user.id).addRole(rName).catch(console.error);
					// bot.channels.get(rolesChan).send("👍 "+user+" has been given the role of: **"+mRolesName[r]+"**, over at: `"+guild.name+"`! 🎉");
				}
			}
		}
		return // bot.channels.get(rolesChan).send(timeStamp+"[AUTO-ROLES] User: \"**"+user.username+"**\" (`"+user.id+"`) has roles: `"+roleNames+"`");
		
	}
});



bot.on("guildMemberUpdate", (oldMember,newMember) => {
	g=oldMember.guild;
	g.fetchAuditLogs({limit: 1,type: 25})
		.then(auditLog => {
			let masterName=auditLog.entries.map(u=>u.executor.username);let masterID=auditLog.entries.map(u=>u.executor.id);
			let minionName=auditLog.entries.map(u=>u.target.username);let minionID=auditLog.entries.map(u=>u.target.id);
			let action=auditLog.entries.map(u=>u.changes),roleName=auditLog.entries.map(u=>u.changes);
				action=action[0][0].key;action=action.slice(1);let action2="";roleName=roleName[0][0].new[0].name;
				if(action==="add"){action="added"; action2="to"}if(action==="remove"){action="removed"; action2="from"}

			bot.channels.get(rolesChan).send("**"+masterName+"**(`"+masterID+"`) has **"+action+"** role: "
				+"`"+roleName+"` "+action2+" **"+minionName+"**(`"+minionID+"`) over at `"+g.name+"`");
			
			
			if(g.id===freeServer){
				let sdhUser=bot.guilds.get(vipServer).members.get(""+minionID+"");
				if(!sdhUser){
					// console.info(timeStampSys+"[AUTO-ROLES] User: \""+user.username+"\" ("+user.id+") not found in SDH-VIP");
					return // bot.channels.get(rolesChan).send(timeStamp+"[AUTO-ROLES] User: \"**"+user.username+"**\" (`"+user.id+"`) was **not** found in » [`"+bot.guilds.get(freeServer).name+"`]");
				}
				let rName=bot.guilds.get(vipServer).roles.find('name', roleName);
				if(!rName){
					return bot.channels.get(rolesChan).send("⚠ I couldn't find role: **"+roleName+"** over at `"+bot.guilds.get(vipServer).name+"`, please make sure it exist, it must have **exact name**!");
				}
				if(action==="added"){
					bot.guilds.get(vipServer).members.get(""+minionID+"").addRole(rName).catch(console.error);
					return // bot.channels.get(rolesChan).send("👍 <@"+minionID+"> has been given the role of: **"+roleName+"**! 🎉");
				}
				bot.guilds.get(vipServer).members.get(""+minionID+"").removeRole(rName).catch(console.error);
				return // bot.channels.get(rolesChan).send("⚠ <@"+minionID+"> have **lost** their role of: **"+roleName+"**! 😅");
			}
			if(g.id===vipServer){
				let sdhUser=bot.guilds.get(freeServer).members.get(""+minionID+"");
				if(!sdhUser){
					// console.info(timeStampSys+"[AUTO-ROLES] User: \""+user.username+"\" ("+user.id+") not found in SDH-VIP");
					return // bot.channels.get(rolesChan).send(timeStamp+"[AUTO-ROLES] User: \"**"+user.username+"**\" (`"+user.id+"`) was **not** found in » [`"+bot.guilds.get(freeServer).name+"`]");
				}
				let rName=bot.guilds.get(freeServer).roles.find('name', roleName);
				if(!rName){
					return bot.channels.get(rolesChan).send("⚠ I couldn't find role: **"+roleName+"** over at `"+bot.guilds.get(freeServer).name+"`, please make sure it exist, it must have **exact name**!");
				}
				if(action==="added"){
					bot.guilds.get(freeServer).members.get(""+minionID+"").addRole(rName).catch(console.error);
					return // bot.channels.get(rolesChan).send("👍 <@"+minionID+"> has been given the role of: **"+roleName+"**! 🎉");
				}
				bot.guilds.get(freeServer).members.get(""+minionID+"").removeRole(rName).catch(console.error);
				return // bot.channels.get(rolesChan).send("⚠ <@"+minionID+"> have **lost** their role of: **"+roleName+"**! 😅");
			}
		});
});



bot.on('message', message => {
	
	let CurrTime=new Date();
	let mo=CurrTime.getMonth()+1;if(mo<10){mo="0"+mo;}let da=CurrTime.getDate();if(da<10){da="0"+da;}let yr=CurrTime.getFullYear();
	let hr=CurrTime.getHours();if(hr<10){hr="0"+hr;}let min=CurrTime.getMinutes();if(min<10){min="0"+min;}let sec=CurrTime.getSeconds();if(sec<10){sec="0"+sec;}
	let timeStamp="`"+yr+"/"+mo+"/"+da+"` **@** `"+hr+":"+min+":"+sec+"`";let timeStampSys="["+yr+"/"+mo+"/"+da+" @ "+hr+":"+min+":"+sec+"] ";
	
	//STOP SCRIPT IF DM/PM
	if(message.channel.type=="dm"){ return }
	
	// GET CHANNEL INFO
	let g=message.guild; let c=message.channel; let m=message.member; let msg=message.content.toLowerCase();
	
	// GET TAGGED USER
	let mentioned=""; if(message.mentions.users.first()){mentioned=message.mentions.users.first();}
	
	// REMOVE LETTER CASE (MAKE ALL LOWERCASE)
	let command=msg.toLowerCase(); command=command.split(" ")[0]; command=command.slice(config.cmdPrefix.length);
	
	// GET ARGUMENTS
	let args=msg.split(" ").slice(1);
	
	// DATE&TIME VALUES
	const DTdays=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
	const DTmonths=["January","February","March","April","May","June","July","August","September","October","November","December"];
	
	
// ############################################################################
// ############################## COMMANDS BEGIN ##############################
// ############################################################################
	
	if(command==="restart"){
		if(m.id===config.ownerID || m.id==="295245211007844352" || m.id==="237260406144499712"){
			if(args[0]==="roles"){
				message.reply("Restarting **RolesChecker** (`rolesBot.js`) module... please wait `3` to `5` seconds").then(()=>{ process.exit(1) }).catch(console.error);
			}
		}
	}
	
});



//
// CONNECT BOT TO DISCORD
//
bot.login(config.token);



bot.on('disconnected', function (){
	let CurrTime=new Date();
	let mo=CurrTime.getMonth()+1;if(mo<10){mo="0"+mo;}let da=CurrTime.getDate();if(da<10){da="0"+da;}let yr=CurrTime.getFullYear();
	let hr=CurrTime.getHours();if(hr<10){hr="0"+hr;}let min=CurrTime.getMinutes();if(min<10){min="0"+min;}let sec=CurrTime.getSeconds();if(sec<10){sec="0"+sec;}
	let timeStamp="`"+yr+"/"+mo+"/"+da+"` **@** `"+hr+":"+min+":"+sec+"`";let timeStampSys="["+yr+"/"+mo+"/"+da+" @ "+hr+":"+min+":"+sec+"] ";
	console.info(timeStampSys+'-- Disconnected --');console.log(console.error);
	process.exit(1);
});
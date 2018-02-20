const Discord=require('discord.js');
const bot=new Discord.Client();
const config=require('./files/config.json');
const sql = require("sqlite");
sql.open("./files/dataBase.sqlite");

bot.on('ready', () => {
	let CurrTime=new Date();
	let mo=CurrTime.getMonth()+1;if(mo<10){mo="0"+mo;}let da=CurrTime.getDate();if(da<10){da="0"+da;}let yr=CurrTime.getFullYear();
	let hr=CurrTime.getHours();if(hr<10){hr="0"+hr;}let min=CurrTime.getMinutes();if(min<10){min="0"+min;}let sec=CurrTime.getSeconds();if(sec<10){sec="0"+sec;}
	let timeStamp="`"+yr+"/"+mo+"/"+da+"` **@** `"+hr+":"+min+":"+sec+"`";let timeStampSys="["+yr+"/"+mo+"/"+da+" @ "+hr+":"+min+":"+sec+"] ";
	console.info(timeStampSys+'-- DISCORD HELPBOT [USERS] IS READY --');console.log(console.error);
});



// ##########################################################################
// ############################## TEXT MESSAGE ##############################
// ##########################################################################
bot.on('message', message => {
	
	// STOP SCRIPT IF TEXT IS PRIVATE MESSAGE
	if(message.channel.type=="dm"){ return }
	
	// 
	// UNOWN DETECTION
	//
	if(message.channel.id=="CHANNEL-TO-SCAN") { // Unown
		
		let etitle = message.embeds[0].title;
			etitle = etitle.split(" ");
		let eurl = message.embeds[0].url;
		let edescription = message.embeds[0].description; edescription=edescription.slice(0, -27);
		let eimg = message.embeds[0].thumbnail.url;
		
		let txt="Hey @everyone quick! \nA wild **Unown** has just __spawned__! <(^.^<)\n"
			+"**Letter**: "+ etitle[2] +"\n" + edescription + "\n**GoogleMaps**: " + eurl;
		bot.channels.get(config.mainChannelID).send(txt).catch(console.error); // SPM+
	}
	
	
	
// ############################## AUTO LEVEL ROLES ##############################
	if(message.channel.id===config.levelRolesChannelID){
		// LEVEL ROLE NAME PREFIX (INCLUDE SPACE OR ":" OR "-")
		let lvlRolesPrefix="Level ";
		
		// AVAILABLE LEVEL ROLES
		let lvlRoles=["25-29","30","31","32","33","34","35","36","37","38","39","40"];
		
		// VARIABLES
		let newRole=""; let oldRole="";
		
		// ERROR MESSAGE
		let levelNotFound="\n⚠ Level **NOT** found! Please make sure you type **ONLY** your level, and nothing else, along with your screenshot.\n"
				+" » Exact levels on file: `"+lvlRoles+"`\n**[WARNING]**: __DO NOT__ abuse this function (assigning your own **Level**-role)... "
				+"screenshots and levels **are still** being __verified__ by staff and moderators; abusers will **lose** their rights to this function, the channel, and level assignment";
		
		// IGNORE PICTURES, MESSAGES FROM BOT, AND COMMAND MESSAGES
		if(message.content && message.member.id!==config.botID && !message.content.startsWith(config.cmdPrefix)){
			
			// REMOVE ANY PREVIOUS LEVEL ROLE
			for(var availbleRole=0;availbleRole<lvlRoles.length;availbleRole++){
				oldRole=message.guild.roles.find("name", lvlRolesPrefix+lvlRoles[availbleRole]);
				if(oldRole && message.member.roles.has(oldRole.id)){
					// message.reply("you had previous role... attempting to removed your **Level "+lvlRoles[availbleRole]+"** role");
					message.member.removeRole(oldRole).then(()=>{
						newRole=message.guild.roles.find("name", lvlRolesPrefix+message.content);
						if(newRole){message.member.addRole(newRole)}
					}).catch(console.error);
				}
			}
			// CHECK IF LEVEL ROLE EXIST WHILE MAKING SURE USER'S INPUT IS JUST DIGIT/NUMBER
			for(var userInput=0;userInput<lvlRoles.length;userInput++){
				if(message.content===lvlRoles[userInput]){
					newRole=message.guild.roles.find("name", lvlRolesPrefix+message.content);
				}
			}
			
			// NEW ROLE IS VALID, ATTEMPT TO ADD IT
			if(newRole){
				message.member.addRole(newRole).catch(console.error);
				return message.channel.send("🎉 Congratulations to: "+message.member+"! They are now **Level: "+message.content+"** 🎉 ")
			}
			
			// PICTURE IS FINE, BUT TEXT MESSAGE IS NOT A NUMBER - COULD BE CHAT - OR ISNOT ONE OF THE VALID NUMBERS... WARN THEM!
			return message.reply(levelNotFound)
		}
	}
	
	
	
	// MAKE SURE ITS A COMMAND
	if(!message.content.startsWith(config.cmdPrefix)) { return }
	
	// COMMON VARIABLES
	let g=message.guild; let c=message.channel; let m=message.member; let msg=message.content; let cmds="";
	let mentioned=""; if(message.mentions.users.first()){mentioned=message.mentions.users.first();}
	
	// GET ROLES FROM CONFIG
	let AdminR=g.roles.find("name", config.adminRoleName);
	let ModR=g.roles.find("name", config.modRoleName);
	
	// REMOVE LETTER CASE (MAKE ALL LOWERCASE)
	let command=msg.toLowerCase(); command=command.split(" ")[0]; command=command.slice(config.cmdPrefix.length);
	
	// GET ARGUMENTS
	let args=msg.split(" ").slice(1);
	
	
	
// ######################### COMMANDS #############################
	if(command==="commands" || command==="help") {
		if(args[0]==="mods") {
			if(m.roles.has(ModR.id) || m.roles.has(AdminR.id)) {
				cmds="--- ** COMMANDS FOR MODS ** ---\n"
					+"`!info server`   \\\u00BB   to display server's info\n"
					+"`!info @mention`   \\\u00BB   to display user's info\n"
					+"`!roles`   \\\u00BB   ROLES multiple options\n"
					+"`!role @mention <ROLE-NAME>`   \\\u00BB   to assign roles\n"
					+"`!temprole`   \\\u00BB   ROLES multiple options\n"
					+"`!temprole <ROLE-NAME> @mention <DAYS>`   \\\u00BB   to assign temporary roles\n"
					+"`!warn @mention REASON`   \\\u00BB   for custom reasons\n"
					+"`!mute @mention REASON`   \\\u00BB   to mute an user\n"
					+"`!unmute @mention`   \\\u00BB   to unmute an user\n"
					+"`!kick @mention REASON`   \\\u00BB   to kick an user\n"
					+"`!ban @mention REASON`   \\\u00BB   to ban an user";
				return c.send(cmds).catch(console.error);
			}
			else {
				return message.reply("you are **NOT** allowed to use this command! \ntry using: `!commads` or `!commands devs`").catch(console.error); 
			}
		}
		if(c.id!==config.botsupportChannelID){
			return message.reply("this command can only be used at: <#"+config.botsupportChannelID+">");
		}
		if(!args[0]) { 
			cmds="";
			if(config.mapMain.enabled==="yes"){ cmds+="`!map`   \\\u00BB   a link to our **Live Web Map** [much cooler]\n" }
			if(config.mapRaids.enabled==="yes"){ cmds+="`!raids`   \\\u00BB   a link to our **Raids Web Map** [with RSVP]\n" }
			cmds+="`!invite`   \\\u00BB   for our **invite** link and code\n";
			if(config.patreon.enabled==="yes"){ cmds+="`!subscribe`/`!patreon`   \\\u00BB   for a link to our **Patreon** [to subscribe]\n" }
			if(config.paypal.enabled==="yes"){ cmds+="`!donate`/`!paypal`   \\\u00BB   for a link to our **PayPal** [to show extra support]\n" }
			if(config.mapHoods.enabled==="yes"){ cmds+="`!hoods`   \\\u00BB   for a map with **Neighborhoods**\n" }
			if(config.mapCoverage.enabled==="yes"){ cmds+="`!coverage`/`!zones`   \\\u00BB   for a map of our **coverage/zones**\n.\n" }
			cmds+="... for more commands, type:\n"
				+"`!commands devs`, `!commands mods`";
		}
		if(args[0]==="devs") {
			cmds="--- ** COMMANDS FOR DEVs ** ---\n"
			if(config.mapZones.enabled==="yes"){ cmds+="`!coverage`/`!zones`   \\\u00BB   for a map of our **scanned area**\n"}
				cmds+="`!hash`   \\\u00BB   for **hashing** server status link\n"
				+"`!ptc`   \\\u00BB   for **PokemonTrainersClub** server status link\n"
				+"`!geofence`   \\\u00BB   for __Jenner__'s **GeoFence Generator**\n"
				+"`!geojson`   \\\u00BB   Geofence generator - load/save/modify geofence `.json`\n"
				+"`!json2editor`   \\\u00BB   for __Jenner__'s GeoFence **Formatter**: `.geojson`2`gMap/Editor`\n"
				+"`!json2pa`   \\\u00BB   for __Jenner__'s GeoFence **Formatter**: `.geojson`2`PokeAlarm`\n"
				+"`!filtergen`   \\\u00BB   for __Jenner__'s `PA/RM/Monocle` **filter generator**\n"
				+"`!simplebot`   \\\u00BB   for __Jenner__'s `RM/WebHook` **simple** discord **bot** - in `JavaScript`";
		}
		return c.send(cmds).catch(console.error);
	}
	
	
	
// ######################### RULES #############################
	if(command==="rules") {
		message.delete();
		if(!mentioned) {
			return c.send("Please __READ__ our **RULES** at \\\u00BB <#"+config.rulesChannelID+">").catch(console.error);
		} 
		else {
			return c.send("Hey "+mentioned+", Please __READ__ the **RULES** at \\\u00BB <#"+config.rulesChannelID+"> in order to avoid **MUTE** <(^.^<)").catch(console.error);
		}
	}
	
	
	
// ######################### SUBSCRIPTION #############################
	if(command==="patreon" || command==="subscribe") {
		if(config.patreon.enabled==="yes"){
			let embedMSG={
				'color': 0xFF0000,
				'title': '\u00BB\u00BB Click HERE to Subscribe \u00AB\u00AB',
				'url': config.patreon.url,
				'thumbnail': {'url': config.patreon.img},
				'description': '(>^.^)> .! Thank you !. <(^.^<)\nYour support is greatly appreciated'
			};
			return c.send({embed: embedMSG}).catch(console.error);
		}
	}
	
	
	
// ######################### DONATE #############################
	if(command==="paypal" || command==="donate") {
		if(config.paypal.enabled==="yes"){
			let embedMSG={
				'color': 0xFF0000,
				'title': '\u00BB\u00BB Click HERE to Donate \u00AB \u00AB',
				'url': config.paypal.url,
				'thumbnail': {'url': config.paypal.img},
				'description': '(>^.^)> .! Thank you !. <(^.^<)\nYour support is greatly appreciated'
			};
			return c.send({embed: embedMSG}).catch(console.error);
		}
	}
	
	
	
// ######################### SERVER STATUS #############################
	if(command==="hash") {
		return c.send("Hashing Server Status: https://status.buddyauth.com/ ").catch(console.error);
	}
	if(command==="ptc") {
		return c.send("PokemonTrainerClub Server Status: http://cmmcd.com/PokemonTrainerClub/ ").catch(console.error);
	}
	
// ######################### OTHER LINKS #############################
	if(command==="map") {
		if(config.mapMain.enabled==="yes"){
			return c.send("Our official **webmap**: \n"+config.mapMain.url).catch(console.error);
		}
	}
	if(command==="raids" || command==="raidmap" || command==="raid") {
		if(config.mapRaids.enabled==="yes"){
			return c.send("Our official **raids webmap**: \n"+config.mapRaids.url).catch(console.error);
		}
	}
	if(command==="coverage") {
		if(config.mapCoverage.enabled==="yes"){
			return c.send("Map of **coverage** area: \n"+config.mapCoverage.url+"\n"
				+"...and for Zones/Systems map: `!zones`").catch(console.error);
		}
	}
	if(command==="zones") {
		if(config.mapZones.enabled==="yes"){
			return c.send("Map of the **Zones** and Servers: \n "+config.mapZones.url+" \n"
				+"...and for Coverage map: `!coverage`").catch(console.error);
		}
	}
	if(command==="hoods" || command==="neighborhoods") {
		if(config.mapHoods.enabled==="yes"){
			return c.send("Our **Neighborhoods**:\n"+config.mapHoods.url).catch(console.error);
		}
	}
	if(command==="invite") {
		return c.send("``` "+config.inviteUrl+" ```").catch(console.error);
	}
	
	
	
	if(command==="geofence") {
		return c.send("__Jenner__'s **Geofence Generator**: \n https://jennerpalacios.github.io/geofenceFormatter/GeofenceGen ").catch(console.error);
	}
	if(command==="geoformat") {
		return c.send("__Jenner__'s  Geofence **Formatter**: \n https://jennerpalacios.github.io/geofenceFormatter/geoFormatter ").catch(console.error);
	}
	if(command==="json2editor") {
		return c.send("__Jenner__'s  **GeoJsOn** to **gMap**`editor` Formatter: \n https://jennerpalacios.github.io/geofenceFormatter/GeoJson2GMapEditor ").catch(console.error);
	}
	if(command==="json2pa") {
		return c.send("__Jenner__'s  **GeoJsOn** to **PokeAlarm** Formatter: \n https://jennerpalacios.github.io/geofenceFormatter/GeoJson2PokeAlarm ").catch(console.error);
	}
	if(command==="geojson") {
		return c.send("Load/Save/Modify **GeoJsOn**, Geofence: \n http://geojson.io/#map=14/47.6089/-122.3393 ").catch(console.error);
	}
	if(command==="filtergen") {
		return c.send("__Jenner__'s **IvFilter Generator:** \n https://jennerpalacios.github.io/Poke-IV-Filter/SPM-IvFilter ").catch(console.error);
	}
	if(command==="rm") {
		return c.send("Scanning Software: **RocketMaps**: \n https://rocketmap.readthedocs.io/en/develop/index.html ").catch(console.error);
	}
	if(command==="monocle") {
		return c.send("Scanning Software: **Monocle**: \n https://github.com/Noctem/Monocle/wiki ").catch(console.error);
	}
	if(command==="pa") {
		return c.send("Webhooks for RocketMaps **PokeAlarm**: \n https://github.com/RocketMap/PokeAlarm ").catch(console.error);
	}
	if(command==="simplebot") {
		return c.send("RocketMaps **SimpleBot** (by me): https://github.com/JennerPalacios/RocketMaps-Simple-Bot ").catch(console.error);
	}
	/*
	https://jennerpalacios.github.io/geofenceFormatter/geoFormatter
	*/
	
	
	
	if(command==="restart"){
		if(m.id===config.ownerID){
			if(args[0]==="user"){
				message.reply("Restarting **User** (`userBot.js`) branch... please wait `5` to `10` seconds").then(()=>{ process.exit(1) }).catch(console.error);
			}
		}
	}
});

// log our bot in
bot.login(config.token);

bot.on('disconnected', function () {
	let CurrTime=new Date();
	let mo=CurrTime.getMonth()+1;if(mo<10){mo="0"+mo;}let da=CurrTime.getDate();if(da<10){da="0"+da;}let yr=CurrTime.getFullYear();
	let hr=CurrTime.getHours();if(hr<10){hr="0"+hr;}let min=CurrTime.getMinutes();if(min<10){min="0"+min;}let sec=CurrTime.getSeconds();if(sec<10){sec="0"+sec;}
	let timeStamp="`"+yr+"/"+mo+"/"+da+"` **@** `"+hr+":"+min+":"+sec+"`";let timeStampSys="["+yr+"/"+mo+"/"+da+" @ "+hr+":"+min+":"+sec+"] ";
	console.info(timeStampSys+'-- Disconnected --');console.log(console.error);
	process.exit(1);
});

require("./all/global")
const func = require("./all/place")
const readline = require("readline")
const fs = require("fs")
const chalk = require("chalk")
const pino = require("pino")
const { Boom } = require("@hapi/boom")
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeInMemoryStore } = require("@seaavey/baileys")

// Anti-spam variables
let lastNotificationTime = 0
const NOTIFICATION_COOLDOWN = 300000 // 5 minutes in milliseconds

let welcome = []
try {
    welcome = JSON.parse(fs.readFileSync("./all/database/welcome.json"))
} catch (e) {
    console.log(chalk.yellow("⚠️ Welcome.json not found, creating new one..."))
    if (!fs.existsSync("./all/database")) {
        fs.mkdirSync("./all/database", { recursive: true })
    }
    fs.writeFileSync("./all/database/welcome.json", JSON.stringify([]))
    welcome = []
}

const { sleep } = require("./all/myfunc.js")  
const usePairingCode = true

const question = (text) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })
    return new Promise((resolve) => {
        rl.question(text, (answer) => {
            rl.close()
            resolve(answer)
        })
    })
}

async function startSesi() {
    const store = makeInMemoryStore({ 
        logger: pino().child({ level: 'silent', stream: 'store' }) 
    })
    
    const { state, saveCreds } = await useMultiFileAuthState(`./session`)
    const { version, isLatest } = await fetchLatestBaileysVersion()
    
    console.log(chalk.cyan(`🐞 Using WhatsApp v${version.join('.')}, isLatest: ${isLatest}`))

    const connectionOptions = {
        printQRInTerminal: !usePairingCode,
        version,    
        logger: pino({ level: "silent" }),
        auth: state,
        browser: ["Ladybug Bot", "Chrome", "1.0.0"],
        getMessage: async (key) => {
            if (store) {
                const msg = await store.loadMessage(key.remoteJid, key.id, undefined)
                return msg?.message || undefined
            }
            return {
                conversation: 'Ladybug Bot - Your Reliable WhatsApp Assistant'
            }
        },
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        syncFullHistory: false,
        defaultQueryTimeoutMs: undefined,
    }

    const Tkm = func.makeWASocket(connectionOptions)
    
    if (usePairingCode && !Tkm.authState.creds.registered) {
        console.log(chalk.cyan.bold('\n╭━━━━━━━━━━━━━━━━━━━━━━━━━╮'))
        console.log(chalk.cyan.bold('│   🐞 LADYBUG BOT SETUP   │'))
        console.log(chalk.cyan.bold('╰━━━━━━━━━━━━━━━━━━━━━━━━━╯\n'))
        
        const phoneNumber = await question(chalk.cyan.bold('Enter your WhatsApp number\nExample: 263777123456\n\n📱 Number: '))
        
        if (!phoneNumber) {
            console.log(chalk.red('❌ Phone number is required!'))
            process.exit(1)
        }
        
        const code = await Tkm.requestPairingCode(phoneNumber.trim())
        console.log(chalk.green.bold('\n✓ Your Pairing Code: ') + chalk.redBright.bold(code.split("").join(" ")))
        console.log(chalk.yellow('\n⚠️ Enter this code in your WhatsApp:\nLinked Devices > Link a Device > Link with phone number\n'))
    }
    
    store?.bind(Tkm.ev)

    Tkm.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        
        if (connection === 'close') {
            let reason = new Boom(lastDisconnect?.error)?.output.statusCode
            
            console.log(chalk.red('Connection closed due to:', lastDisconnect.error))
            
            if (reason === DisconnectReason.badSession) {
                console.log(chalk.red(`🐞 Bad Session File, Please Delete Session folder and restart`))
                process.exit(1)
            } else if (reason === DisconnectReason.connectionClosed) {
                console.log(chalk.yellow('[LADYBUG] Connection closed, reconnecting...'))
                await sleep(3000)
                startSesi()
            } else if (reason === DisconnectReason.connectionLost) {
                console.log(chalk.yellow('[LADYBUG] Connection lost, trying to reconnect...'))
                await sleep(3000)
                startSesi()
            } else if (reason === DisconnectReason.connectionReplaced) {
                console.log(chalk.red('🐞 Connection Replaced, Another Session Opened, Please Close Other Session First'))
                process.exit(1)
            } else if (reason === DisconnectReason.loggedOut) {
                console.log(chalk.red(`🐞 Device Logged Out, Please Delete Session folder and restart`))
                process.exit(1)
            } else if (reason === DisconnectReason.restartRequired) {
                console.log(chalk.yellow('🐞 Restart Required, restarting...'))
                await sleep(2000)
                startSesi()
            } else if (reason === DisconnectReason.timedOut) {
                console.log(chalk.yellow('🐞 Connection TimedOut, Reconnecting...'))
                await sleep(3000)
                startSesi()
            } else {
                console.log(chalk.red(`🐞 Unknown DisconnectReason: ${reason}`))
                await sleep(3000)
                startSesi()
            }
        } else if (connection === "connecting") {
            console.log(chalk.cyan.bold('🐞 Ladybug Bot Connecting . . . '))
        } else if (connection === "open") {
            console.log(chalk.green.bold('\n✓✓✓ LADYBUG BOT SUCCESSFULLY CONNECTED ✓✓✓\n'))
            console.log(chalk.yellow.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
            console.log(chalk.cyan.bold('🐞 Bot Name: Ladybug MD'))
            console.log(chalk.cyan.bold('📱 Number: ' + Tkm.user.id.split(":")[0]))
            console.log(chalk.cyan.bold('🚀 Status: Active'))
            console.log(chalk.yellow.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))
            
            // Anti-spam notification system
            const currentTime = Date.now()
            const timeSinceLastNotification = currentTime - lastNotificationTime
            const minutesRemaining = Math.ceil((NOTIFICATION_COOLDOWN - timeSinceLastNotification) / 60000)
            
            if (timeSinceLastNotification > NOTIFICATION_COOLDOWN) {
                let teksnotif = `╭━━━━『 *LADYBUG BOT* 』━━━━╮
│ 
│ ✓ Successfully Connected
│ 📱 Number: ${Tkm.user.id.split(":")[0]}
│ 🤖 Bot: Ladybug MD
│ 🚀 Status: Online
│ 📅 Date: ${new Date().toLocaleDateString()}
│ ⏰ Time: ${new Date().toLocaleTimeString()}
│
╰━━━━━━━━━━━━━━━━━━━╯

🐞 Ladybug Bot is now ready to assist you!`
                
                try {
                    await Tkm.sendMessage("263718456744@s.whatsapp.net", { text: teksnotif })
                    lastNotificationTime = currentTime
                    console.log(chalk.green('✓ Startup notification sent successfully'))
                } catch (e) {
                    console.log(chalk.yellow('⚠️ Could not send startup notification:', e.message))
                }
            } else {
                console.log(chalk.yellow(`⚠️ Notification skipped (cooldown active - ${minutesRemaining} minutes remaining)`))
            }

            // Auto join channels (only attempt once per session)
            const linksal = ["0029Vb5lvXDCMY0EyIW8Yf19"]
            const folldate = async functions => {
                for (const newslletterss of functions) {
                    try {
                        await sleep(3000)
                        const saluranWa = await Tkm.newsletterMetadata("invite", newslletterss)
                        await sleep(3000)
                        await Tkm.newsletterFollow(saluranWa.id)
                        console.log(chalk.green("✓ Successfully joined channel: " + newslletterss))
                    } catch (error) {
                        console.log(chalk.red("✗ Failed to join channel ID: " + newslletterss))
                    }
                }
            }
            
            // Only run channel join if this is a fresh connection (not a quick reconnect)
            if (timeSinceLastNotification > NOTIFICATION_COOLDOWN) {
                folldate(linksal).catch(e => console.log(chalk.yellow('⚠️ Channel auto-join failed:', e.message)))
            }
        }
    })

    Tkm.ev.on('call', async (user) => {
        if (!global.anticall) return
        for (let ff of user) {
            if (ff.isGroup == false) {
                if (ff.status == "offer") {
                    try {
                        let sendcall = await Tkm.sendMessage(ff.from, {
                            text: `╭━━━『 *⚠️ CALL DETECTED* 』━━━╮
│
│ Hello @${ff.from.split("@")[0]}
│ 
│ Sorry, you will be blocked because
│ the bot owner has activated 
│ *Anti-Call Protection*
│ 
│ If this was unintentional, please
│ contact the owner to unblock you.
│ 
╰━━━━━━━━━━━━━━━━━━━╯

🐞 *Ladybug Bot Security System*`, 
                            contextInfo: {
                                mentionedJid: [ff.from], 
                                externalAdReply: {
                                    showAdAttribution: true, 
                                    title: "🐞 LADYBUG - CALL DETECTED", 
                                    body: "Anti-Call Protection Active",
                                    previewType: "PHOTO"
                                }
                            }
                        }, { quoted: null })
                        
                        await Tkm.sendContact(ff.from, [global.owner], "🐞 Ladybug Bot Developer", sendcall)
                        await sleep(10000)
                        await Tkm.updateBlockStatus(ff.from, "block")
                        console.log(chalk.yellow(`⚠️ Blocked user ${ff.from.split("@")[0]} for calling`))
                    } catch (e) {
                        console.log(chalk.red('Error in anti-call:', e))
                    }
                }
            }
        }
    })

    Tkm.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0]
            if (!m.message) return
            m.message = (Object.keys(m.message)[0] === 'ephemeralMessage') ? m.message.ephemeralMessage.message : m.message
            if (m.isBaileys) return
            
            if (m.key && m.key.remoteJid === 'status@broadcast') {
                if (global.autoreadsw) await Tkm.readMessages([m.key])
                return
            }
            
            let fill = [global.owner, "263777124998"]
            if (!Tkm.public && !fill.includes(m.key.remoteJid.split("@")[0]) && !m.key.fromMe && chatUpdate.type === 'notify') return
            
            if (global.autoread) await Tkm.readMessages([m.key])
            
            const smsg = func.smsg(Tkm, m, store)
            require("./Ladybug")(Tkm, smsg, store)
        } catch (err) {
            console.log(chalk.red('Error in message handler:'), err)
        }
    })

    Tkm.ev.on('group-participants.update', async (anu) => {
        if (!welcome.includes(anu.id)) return
        
        let botNumber = await Tkm.decodeJid(Tkm.user.id)
        if (anu.participants.includes(botNumber)) return
        
        try {
            let metadata = await Tkm.groupMetadata(anu.id)
            let namagc = metadata.subject
            let participants = anu.participants
            
            for (let num of participants) {
                let check = anu.author !== num && anu.author.length > 1
                let tag = check ? [anu.author, num] : [num]
                let ppuser = 'https://i.ibb.co/r2HHgh3Q/subzero-bot.jpg'
                
                try {
                    ppuser = await Tkm.profilePictureUrl(num, 'image')
                } catch {}
                
                if (anu.action == 'add') {
                    await Tkm.sendMessage(anu.id, {
                        text: check ? `╭━━━『 *🐞 WELCOME* 』━━━╮
│
│ @${anu.author.split("@")[0]} has added
│ @${num.split("@")[0]} to this group
│
│ 🎉 Welcome to *${namagc}*!
│ 
╰━━━━━━━━━━━━━━━━━╯` : `╭━━━『 *🐞 WELCOME* 』━━━╮
│
│ Hello @${num.split("@")[0]}!
│ 
│ Welcome to *${namagc}*
│ 
│ 🎉 Enjoy your stay!
│ 📜 Please read the group rules
│ 
╰━━━━━━━━━━━━━━━━━╯`, 
                        contextInfo: {
                            mentionedJid: [...tag], 
                            externalAdReply: { 
                                thumbnailUrl: ppuser, 
                                title: '🐞 Ladybug - Welcome Message', 
                                body: 'Powered by Ladybug Bot', 
                                renderLargerThumbnail: true, 
                                sourceUrl: global.linkgc || '', 
                                mediaType: 1
                            }
                        }
                    })
                } else if (anu.action == 'remove') { 
                    await Tkm.sendMessage(anu.id, {
                        text: check ? `╭━━━『 *🐞 GOODBYE* 』━━━╮
│
│ @${anu.author.split("@")[0]} has removed
│ @${num.split("@")[0]} from this group
│
╰━━━━━━━━━━━━━━━━━╯` : `╭━━━『 *🐞 GOODBYE* 』━━━╮
│
│ @${num.split("@")[0]} has left
│ 
│ 👋 Goodbye!
│ 
╰━━━━━━━━━━━━━━━━━╯`, 
                        contextInfo: {
                            mentionedJid: [...tag], 
                            externalAdReply: { 
                                thumbnailUrl: ppuser, 
                                title: '🐞 Ladybug - Leaving Message', 
                                body: 'Powered by Ladybug Bot', 
                                renderLargerThumbnail: true, 
                                sourceUrl: global.linkgc || '', 
                                mediaType: 1
                            }
                        }
                    })
                } else if (anu.action == "promote") {
                    await Tkm.sendMessage(anu.id, {
                        text: `╭━━━『 *🐞 PROMOTION* 』━━━╮
│
│ @${anu.author.split("@")[0]} has promoted
│ @${num.split("@")[0]} to Admin
│
│ ⭐ Congratulations!
│ 
╰━━━━━━━━━━━━━━━━━╯`, 
                        contextInfo: {
                            mentionedJid: [...tag], 
                            externalAdReply: { 
                                thumbnailUrl: ppuser, 
                                title: '🐞 Ladybug - Promote Message', 
                                body: 'Powered by Ladybug Bot', 
                                renderLargerThumbnail: true, 
                                sourceUrl: global.linkgc || '', 
                                mediaType: 1
                            }
                        }
                    })
                } else if (anu.action == "demote") {
                    await Tkm.sendMessage(anu.id, {
                        text: `╭━━━『 *🐞 DEMOTION* 』━━━╮
│
│ @${anu.author.split("@")[0]} has demoted
│ @${num.split("@")[0]} from Admin
│
╰━━━━━━━━━━━━━━━━━╯`, 
                        contextInfo: {
                            mentionedJid: [...tag], 
                            externalAdReply: { 
                                thumbnailUrl: ppuser, 
                                title: '🐞 Ladybug - Demote Message', 
                                body: 'Powered by Ladybug Bot', 
                                renderLargerThumbnail: true, 
                                sourceUrl: global.linkgc || '', 
                                mediaType: 1
                            }
                        }
                    })
                }
            }
        } catch (err) {
            console.log(chalk.red('Error in group-participants.update:'), err)
        }
    })

    Tkm.public = true

    Tkm.ev.on('creds.update', saveCreds)
    
    return Tkm
}

startSesi().catch(err => {
    console.log(chalk.red('Fatal error in startSesi:'), err)
    process.exit(1)
})

process.on('uncaughtException', function (err) {
    console.log(chalk.red('🐞 Ladybug - Caught exception: '), err)
})

process.on('unhandledRejection', function (err) {
    console.log(chalk.red('🐞 Ladybug - Unhandled rejection: '), err)
})

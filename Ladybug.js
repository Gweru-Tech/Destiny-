require('./all/global')
const fs = require('fs')
const chalk = require('chalk')
const moment = require('moment-timezone')
const { smsg, getGroupAdmins, formatp, tanggal, formatDate, getTime, isUrl, sleep, clockString, runtime, fetchJson, getBuffer, jsonformat, delay, format, logic, generateProfilePicture, parseMention, getRandom } = require('./all/myfunc')

module.exports = async (Tkm, m, store) => {
    try {
        const body = (m.mtype === 'conversation') ? m.message.conversation : 
                     (m.mtype == 'imageMessage') ? m.message.imageMessage.caption : 
                     (m.mtype == 'videoMessage') ? m.message.videoMessage.caption : 
                     (m.mtype == 'extendedTextMessage') ? m.message.extendedTextMessage.text : 
                     (m.mtype == 'buttonsResponseMessage') ? m.message.buttonsResponseMessage.selectedButtonId : 
                     (m.mtype == 'listResponseMessage') ? m.message.listResponseMessage.singleSelectReply.selectedRowId : 
                     (m.mtype == 'templateButtonReplyMessage') ? m.message.templateButtonReplyMessage.selectedId : 
                     (m.mtype === 'messageContextInfo') ? (m.message.buttonsResponseMessage?.selectedButtonId || m.message.listResponseMessage?.singleSelectReply.selectedRowId || m.text) : ''
        
        const budy = (typeof m.text == 'string' ? m.text : '')
        const prefix = /^[°•π÷×¶∆£¢€¥®™✓_=|~!?#$%^&.+-,\/\\©^]/.test(body) ? body.match(/^[°•π÷×¶∆£¢€¥®™✓_=|~!?#$%^&.+-,\/\\©^]/gi) : '.'
        const isCmd = body.startsWith(prefix)
        const command = body.slice(1).trim().split(/ +/).shift().toLowerCase()
        const args = body.trim().split(/ +/).slice(1)
        const text = q = args.join(" ")
        const sender = m.key.fromMe ? (Tkm.user.id.split(':')[0]+'@s.whatsapp.net' || Tkm.user.id) : (m.key.participant || m.key.remoteJid)
        const botNumber = await Tkm.decodeJid(Tkm.user.id)
        const senderNumber = sender.split('@')[0]
        const pushname = m.pushName || "No Name"
        const isBot = botNumber.includes(senderNumber)
        
        // Group Info
        const isGroup = m.key.remoteJid.endsWith('@g.us')
        const groupMetadata = isGroup ? await Tkm.groupMetadata(m.chat).catch(e => {}) : ''
        const groupName = isGroup ? groupMetadata.subject : ''
        const participants = isGroup ? await groupMetadata.participants : ''
        const groupAdmins = isGroup ? await getGroupAdmins(participants) : ''
        const isBotAdmins = isGroup ? groupAdmins.includes(botNumber) : false
        const isAdmins = isGroup ? groupAdmins.includes(sender) : false
        const groupOwner = isGroup ? groupMetadata.owner : ''
        const isGroupOwner = isGroup ? (groupOwner ? groupOwner : groupAdmins).includes(sender) : false
        
        // Owner & Premium
        const isOwner = [botNumber, ...global.owner].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(sender)
        
        // Response shortcuts
        const reply = (teks) => {
            Tkm.sendMessage(m.chat, { text: teks, contextInfo: {
                mentionedJid: [sender],
                externalAdReply: {
                    showAdAttribution: true,
                    title: "🐞 Ladybug Bot",
                    body: "Your Reliable WhatsApp Assistant",
                    thumbnailUrl: "https://i.ibb.co/r2HHgh3Q/ladybug.jpg",
                    sourceUrl: global.linkgc || "",
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }}, { quoted: m })
        }
        
        // Console log
        if (isCmd) {
            console.log(chalk.cyan.bold('╭━━━━━━━━━━━━━━━━━━━━╮'))
            console.log(chalk.cyan.bold('│ 🐞 LADYBUG COMMAND LOG'))
            console.log(chalk.cyan.bold('╰━━━━━━━━━━━━━━━━━━━━╯'))
            console.log(chalk.yellow('📅 Date:'), chalk.white(moment.tz('Africa/Harare').format('DD/MM/YYYY')))
            console.log(chalk.yellow('⏰ Time:'), chalk.white(moment.tz('Africa/Harare').format('HH:mm:ss')))
            console.log(chalk.yellow('💬 Command:'), chalk.white(command))
            console.log(chalk.yellow('👤 From:'), chalk.white(pushname))
            console.log(chalk.yellow('📱 Number:'), chalk.white(senderNumber))
            console.log(chalk.yellow('📍 Chat:'), chalk.white(isGroup ? `${groupName} (Group)` : 'Private Chat'))
            console.log(chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━\n'))
        }

        // ========== COMMANDS START HERE ==========

        switch(command) {
            case 'menu':
            case 'help':
            case 'ladybug': {
                let menuText = `╭━━━『 *🐞 LADYBUG BOT* 』━━━╮
│
│ 👋 Hello, ${pushname}!
│
│ 📅 Date: ${moment.tz('Africa/Harare').format('DD/MM/YYYY')}
│ ⏰ Time: ${moment.tz('Africa/Harare').format('HH:mm:ss')}
│ 🤖 Bot: Ladybug MD
│ 📱 Number: ${botNumber.split('@')[0]}
│ 🚀 Runtime: ${runtime(process.uptime())}
│
╰━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━『 *📋 MAIN MENU* 』━━━╮
│
│ .menu - Show this menu
│ .ping - Check bot speed
│ .runtime - Bot uptime
│ .owner - Contact owner
│ .info - Bot information
│
╰━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━『 *👥 GROUP MENU* 』━━━╮
│
│ .welcome - Toggle welcome
│ .tagall - Tag all members
│ .hidetag - Hide tag all
│ .totag - Reply to tag
│ .kick - Kick member
│ .add - Add member
│ .promote - Promote to admin
│ .demote - Demote from admin
│ .group [open/close] - Group settings
│ .linkgc - Get group link
│ .revoke - Reset group link
│ .setppgc - Change group icon
│ .setnamegc - Change group name
│ .setdescgc - Change group desc
│
╰━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━『 *🎨 FUN MENU* 』━━━╮
│
│ .joke - Random joke
│ .fact - Random fact
│ .quote - Inspirational quote
│ .truth - Truth game
│ .dare - Dare game
│
╰━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━『 *🔧 OWNER MENU* 』━━━╮
│
│ .public - Public mode
│ .self - Self mode
│ .join - Join group
│ .leave - Leave group
│ .block - Block user
│ .unblock - Unblock user
│ .broadcast - Broadcast msg
│ .setpp - Set bot PP
│ .setname - Set bot name
│ .setbio - Set bot bio
│
╰━━━━━━━━━━━━━━━━━━━━━━╯

🐞 *Ladybug Bot* - Powered by Baileys`
                
                reply(menuText)
            }
            break

            case 'ping': {
                const startTime = Date.now()
                const endTime = Date.now()
                const ping = endTime - startTime
                reply(`🐞 *Ladybug Bot Speed*\n\n⚡ Response Time: ${ping}ms\n🚀 Runtime: ${runtime(process.uptime())}`)
            }
            break

            case 'runtime': {
                reply(`🐞 *Ladybug Bot Runtime*\n\n⏱️ ${runtime(process.uptime())}`)
            }
            break

            case 'owner': {
                const vcard = 'BEGIN:VCARD\n' +
                    'VERSION:3.0\n' +
                    'FN:Ladybug Owner\n' +
                    `TEL;type=CELL;type=VOICE;waid=${global.owner}:+${global.owner}\n` +
                    'END:VCARD'
                await Tkm.sendMessage(m.chat, { 
                    contacts: { 
                        displayName: 'Ladybug Owner', 
                        contacts: [{ vcard }] 
                    }
                }, { quoted: m })
            }
            break

            case 'info': {
                let infoText = `╭━━━『 *🐞 BOT INFO* 』━━━╮
│
│ 🤖 Name: Ladybug Bot
│ 👨‍💻 Owner: ${global.owner}
│ 📱 Number: ${botNumber.split('@')[0]}
│ 🚀 Runtime: ${runtime(process.uptime())}
│ 💻 Platform: Baileys
│ 📦 Version: 1.0.0
│ 🌐 Deployed: Vercel
│
╰━━━━━━━━━━━━━━━━━━━━━━╯`
                reply(infoText)
            }
            break

            // ===== GROUP COMMANDS =====
            
            case 'welcome': {
                if (!isGroup) return reply('❌ This command is for groups only!')
                if (!isAdmins && !isOwner) return reply('❌ Admin only!')
                
                let welcome = JSON.parse(fs.readFileSync('./all/database/welcome.json'))
                
                if (welcome.includes(m.chat)) {
                    let index = welcome.indexOf(m.chat)
                    welcome.splice(index, 1)
                    fs.writeFileSync('./all/database/welcome.json', JSON.stringify(welcome, null, 2))
                    reply('✅ Welcome message has been *disabled* for this group')
                } else {
                    welcome.push(m.chat)
                    fs.writeFileSync('./all/database/welcome.json', JSON.stringify(welcome, null, 2))
                    reply('✅ Welcome message has been *enabled* for this group')
                }
            }
            break

            case 'tagall': {
                if (!isGroup) return reply('❌ This command is for groups only!')
                if (!isAdmins && !isOwner) return reply('❌ Admin only!')
                
                let teks = `╭━━━『 *TAG ALL* 』━━━╮
│
│ 📢 Message: ${text || 'No message'}
│
╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n`
                
                for (let mem of participants) {
                    teks += `│ @${mem.id.split('@')[0]}\n`
                }
                teks += `╰━━━━━━━━━━━━━━━━━━━━━━╯`
                
                Tkm.sendMessage(m.chat, { text: teks, mentions: participants.map(a => a.id) }, { quoted: m })
            }
            break

            case 'hidetag': {
                if (!isGroup) return reply('❌ This command is for groups only!')
                if (!isAdmins && !isOwner) return reply('❌ Admin only!')
                
                Tkm.sendMessage(m.chat, { text: text || '', mentions: participants.map(a => a.id) }, { quoted: m })
            }
            break

            case 'kick': {
                if (!isGroup) return reply('❌ This command is for groups only!')
                if (!isAdmins && !isOwner) return reply('❌ Admin only!')
                if (!isBotAdmins) return reply('❌ Bot must be admin!')
                
                let users = m.mentionedJid[0] ? m.mentionedJid : m.quoted ? [m.quoted.sender] : [text.replace(/[^0-9]/g, '')+'@s.whatsapp.net']
                await Tkm.groupParticipantsUpdate(m.chat, users, 'remove')
                reply('✅ Successfully kicked user(s)')
            }
            break

            case 'add': {
                if (!isGroup) return reply('❌ This command is for groups only!')
                if (!isAdmins && !isOwner) return reply('❌ Admin only!')
                if (!isBotAdmins) return reply('❌ Bot must be admin!')
                
                let users = m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '')+'@s.whatsapp.net'
                await Tkm.groupParticipantsUpdate(m.chat, [users], 'add')
                reply('✅ Successfully added user')
            }
            break

            case 'promote': {
                if (!isGroup) return reply('❌ This command is for groups only!')
                if (!isAdmins && !isOwner) return reply('❌ Admin only!')
                if (!isBotAdmins) return reply('❌ Bot must be admin!')
                
                let users = m.mentionedJid[0] ? m.mentionedJid : m.quoted ? [m.quoted.sender] : [text.replace(/[^0-9]/g, '')+'@s.whatsapp.net']
                await Tkm.groupParticipantsUpdate(m.chat, users, 'promote')
                reply('✅ Successfully promoted user to admin')
            }
            break

            case 'demote': {
                if (!isGroup) return reply('❌ This command is for groups only!')
                if (!isAdmins && !isOwner) return reply('❌ Admin only!')
                if (!isBotAdmins) return reply('❌ Bot must be admin!')
                
                let users = m.mentionedJid[0] ? m.mentionedJid : m.quoted ? [m.quoted.sender] : [text.replace(/[^0-9]/g, '')+'@s.whatsapp.net']
                await Tkm.groupParticipantsUpdate(m.chat, users, 'demote')
                reply('✅ Successfully demoted user from admin')
            }
            break

            case 'group': {
                if (!isGroup) return reply('❌ This command is for groups only!')
                if (!isAdmins && !isOwner) return reply('❌ Admin only!')
                if (!isBotAdmins) return reply('❌ Bot must be admin!')
                
                if (args[0] === 'close') {
                    await Tkm.groupSettingUpdate(m.chat, 'announcement')
                    reply('✅ Group has been closed')
                } else if (args[0] === 'open') {
                    await Tkm.groupSettingUpdate(m.chat, 'not_announcement')
                    reply('✅ Group has been opened')
                } else {
                    reply('Usage: .group open/close')
                }
            }
            break

            case 'linkgc':
            case 'linkgroup': {
                if (!isGroup) return reply('❌ This command is for groups only!')
                if (!isBotAdmins) return reply('❌ Bot must be admin!')
                
                let linkgc = await Tkm.groupInviteCode(m.chat)
                reply(`🔗 *Group Link*\n\nhttps://chat.whatsapp.com/${linkgc}`)
            }
            break

            case 'revoke': {
                if (!isGroup) return reply('❌ This command is for groups only!')
                if (!isAdmins && !isOwner) return reply('❌ Admin only!')
                if (!isBotAdmins) return reply('❌ Bot must be admin!')
                
                await Tkm.groupRevokeInvite(m.chat)
                reply('✅ Group link has been reset')
            }
            break

            // ===== FUN COMMANDS =====
            
            case 'joke': {
                const jokes = [
                    "Why don't scientists trust atoms? Because they make up everything!",
                    "Why did the scarecrow win an award? He was outstanding in his field!",
                    "Why don't eggs tell jokes? They'd crack each other up!",
                    "What do you call a fake noodle? An impasta!",
                    "Why did the bicycle fall over? It was two tired!",
                    "What do you call a bear with no teeth? A gummy bear!",
                    "Why don't skeletons fight each other? They don't have the guts!",
                    "What's orange and sounds like a parrot? A carrot!"
                ]
                reply(`😄 ${jokes[Math.floor(Math.random() * jokes.length)]}`)
            }
            break

            case 'fact': {
                const facts = [
                    "Honey never spoils. Archaeologists have found 3000-year-old honey that's still edible!",
                    "A single cloud can weigh more than 1 million pounds!",
                    "Octopuses have three hearts!",
                    "Bananas are berries, but strawberries aren't!",
                    "The Eiffel Tower can be 15 cm taller during the summer due to thermal expansion!",
                    "A day on Venus is longer than a year on Venus!",
                    "Sharks have been around longer than trees!",
                    "Your nose can remember 50,000 different scents!"
                ]
                reply(`🤓 ${facts[Math.floor(Math.random() * facts.length)]}`)
            }
            break

            case 'quote': {
                const quotes = [
                    "The only way to do great work is to love what you do. - Steve Jobs",
                    "Innovation distinguishes between a leader and a follower. - Steve Jobs",
                    "Life is what happens when you're busy making other plans. - John Lennon",
                    "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
                    "It is during our darkest moments that we must focus to see the light. - Aristotle",
                    "Believe you can and you're halfway there. - Theodore Roosevelt",
                    "The only impossible journey is the one you never begin. - Tony Robbins"
                ]
                reply(`💭 ${quotes[Math.floor(Math.random() * quotes.length)]}`)
            }
            break

            case 'truth': {
                const truths = [
                    "What was your most embarrassing moment?",
                    "Have you ever lied to your best friend?",
                    "What's your biggest secret?",
                    "Who was your first crush?",
                    "What's the worst thing you've ever done?",
                    "Have you ever cheated on a test?",
                    "What's your biggest fear?",
                    "What's something you've never told anyone?"
                ]
                reply(`🎯 *Truth Question:*\n\n${truths[Math.floor(Math.random() * truths.length)]}`)
            }
            break

            case 'dare': {
                const dares = [
                    "Send a funny selfie to the group",
                    "Do 20 push-ups and send a video",
                    "Change your profile picture to something funny for 24 hours",
                    "Send a voice note singing your favorite song",
                    "Text your crush and tell them a joke",
                    "Post an embarrassing photo on your status",
                    "Call a random contact and sing happy birthday",
                    "Do a silly dance and send a video"
                ]
                reply(`🎯 *Dare Challenge:*\n\n${dares[Math.floor(Math.random() * dares.length)]}`)
            }
            break

            // ===== OWNER COMMANDS =====
            
            case 'public': {
                if (!isOwner) return reply('❌ Owner only!')
                Tkm.public = true
                reply('✅ Bot is now in *PUBLIC* mode')
            }
            break

            case 'self': {
                if (!isOwner) return reply('❌ Owner only!')
                Tkm.public = false
                reply('✅ Bot is now in *SELF* mode')
            }
            break

            case 'join': {
                if (!isOwner) return reply('❌ Owner only!')
                if (!text) return reply('❌ Please provide group link!')
                if (!isUrl(args[0]) && !args[0].includes('whatsapp.com')) return reply('❌ Invalid link!')
                
                let result = args[0].split('https://chat.whatsapp.com/')[1]
                await Tkm.groupAcceptInvite(result)
                reply('✅ Successfully joined the group')
            }
            break

            case 'leave': {
                if (!isOwner) return reply('❌ Owner only!')
                if (!isGroup) return reply('❌ This command is for groups only!')
                
                await Tkm.groupLeave(m.chat)
            }
            break

            case 'block': {
                if (!isOwner) return reply('❌ Owner only!')
                let users = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '')+'@s.whatsapp.net'
                await Tkm.updateBlockStatus(users, 'block')
                reply('✅ Successfully blocked user')
            }
            break

            case 'unblock': {
                if (!isOwner) return reply('❌ Owner only!')
                let users = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '')+'@s.whatsapp.net'
                await Tkm.updateBlockStatus(users, 'unblock')
                reply('✅ Successfully unblocked user')
            }
            break

            case 'broadcast':
            case 'bc': {
                if (!isOwner) return reply('❌ Owner only!')
                if (!text) return reply('❌ Please provide broadcast message!')
                
                let getGroups = await Tkm.groupFetchAllParticipating()
                let groups = Object.entries(getGroups).slice(0).map(entry => entry[1])
                let anu = groups.map(v => v.id)
                
                reply(`📢 Broadcasting to ${anu.length} groups...`)
                
                for (let i of anu) {
                    await sleep(1500)
                    let txt = `╭━━━『 *📢 BROADCAST* 』━━━╮\n│\n│ ${text}\n│\n╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n🐞 *Ladybug Bot Official Broadcast*`
                    Tkm.sendMessage(i, { text: txt })
                }
                reply('✅ Broadcast completed!')
            }
            break

            default: {
                // No default response to avoid spam
            }
        }

    } catch (err) {
        console.log(chalk.red('Error in Ladybug.js:'), err)
        m.reply('❌ An error occurred while processing your command')
    }
}

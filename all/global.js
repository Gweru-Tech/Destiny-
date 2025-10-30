global.owner = '263718456744' // Your number
global.botname = 'Ladybug Bot'
global.ownername = 'Ladybug Owner'
global.packname = '🐞 Ladybug Bot'
global.author = 'Created by Ladybug'
global.sessionName = 'session'
global.linkgc = 'https://chat.whatsapp.com/yourlink'
global.anticall = true
global.autoread = true
global.autoreadsw = true

// Timezone
global.timezone = 'Africa/Harare'

// Mess
global.mess = {
    success: '✅ Success!',
    admin: '❌ This command is for admins only!',
    botAdmin: '❌ Bot must be admin!',
    owner: '❌ This command is for owner only!',
    group: '❌ This command is for groups only!',
    private: '❌ This command is for private chat only!',
    bot: '❌ This command is for bot only!',
    wait: '⏳ Please wait...',
    error: '❌ Error! Please try again',
    endLimit: '❌ Your daily limit has expired!',
}

// Limit
global.limitawal = {
    premium: "Infinity",
    free: 100,
    monayawal: 1000
}

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright(`Update ${__filename}`))
    delete require.cache[file]
    require(file)
})

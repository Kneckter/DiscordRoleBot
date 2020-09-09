module.exports = {
  apps : [
    {
      name: 'DiscordRoleBot',
      script: 'adminBot.js',
      cwd: '/home/admin/DiscordRoleBot/',
      instances: 1,
      autorestart: true,
      watch: false,
      cron_restart: '10 */2 * * *',
      max_memory_restart: '1G'
    }
  ]
};

const { Command } = require('@oclif/command')
const { blue, green, red, yellow } = require('kleur')
const Conf = require('conf')

const config = new Conf({ projectName: 'qrl-cli' })

class ConfigCommand extends Command {
  async run() {
    const { args } = this.parse(ConfigCommand)
    const { action, key, value } = args

    if (!action) {
      this.log('Usage: qrl-cli config [get|set|list|delete] [key] [value]')
      this.log('\nAvailable keys:')
      this.log('  default-network  (mainnet, testnet)')
      this.log('  grpc-endpoint    (e.g. 127.0.0.1:19009)')
      this.exit(0)
    }

    if (action === 'list') {
      const all = config.store
      if (Object.keys(all).length === 0) {
        this.log('No configuration values set.')
      } else {
        Object.entries(all).forEach(([k, v]) => {
          this.log(`${blue(k)}: ${v}`)
        })
      }
      this.exit(0)
    }

    if (action === 'get') {
      if (!key) {
        this.log(`${red('⨉')} Missing key. Usage: qrl-cli config get <key>`)
        this.exit(1)
      }
      const val = config.get(key)
      if (val === undefined) {
        this.log(`${yellow('!')} Key ${blue(key)} is not set.`)
      } else {
        this.log(val)
      }
      this.exit(0)
    }

    if (action === 'set') {
      if (!key || value === undefined) {
        this.log(`${red('⨉')} Missing key or value. Usage: qrl-cli config set <key> <value>`)
        this.exit(1)
      }
      if (key === 'default-network') {
        if (value !== 'mainnet' && value !== 'testnet') {
          this.log(`${red('⨉')} Invalid value for default-network. Must be 'mainnet' or 'testnet'.`)
          this.exit(1)
        }
      }
      config.set(key, value)
      this.log(`${green('✓')} Configuration ${blue(key)} set to ${value}`)
      this.exit(0)
    }

    if (action === 'delete' || action === 'remove') {
      if (!key) {
        this.log(`${red('⨉')} Missing key. Usage: qrl-cli config delete <key>`)
        this.exit(1)
      }
      config.delete(key)
      this.log(`${green('✓')} Configuration ${blue(key)} deleted.`)
      this.exit(0)
    }

    this.log(`${red('⨉')} Unknown action: ${action}`)
    this.exit(1)
  }
}

ConfigCommand.description = `Get, set, delete, or list CLI configurations

Allows you to persist settings like default-network and grpc-endpoint across CLI runs.
`

ConfigCommand.args = [
  { name: 'action', required: false, description: 'Action to perform: get, set, list, delete' },
  { name: 'key', required: false, description: 'Configuration key' },
  { name: 'value', required: false, description: 'Configuration value' },
]

module.exports = ConfigCommand

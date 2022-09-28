import prompts from "prompts"
import fs from 'fs/promises'
import yaml from 'yaml'
import scheduleWatchDomain from "./daemon"

const importConfig = async () => {
  try {
    const config = yaml.parse((await fs.readFile('./config.yml')).toString("utf-8"))
    if (!config)
      throw new Error('[!] no data in config file')
    if (config[0] === null)
      throw new Error('[!] no entries in config file')
    if (config.some((c: any) => !c.domain))
      throw new Error('[!] no domain for some entries')
    if (config.some((c: any) => !c.apiKey))
      throw new Error('[!] no apiKey for some domains')
    if (config.some((c: any) => !c.records))
      throw new Error('[!] no records for some domains')
    return config
  } catch (error) {
    console.warn('[!] no config available')
    console.log("[*] let's setup some entries")
  }
}

const addDomains = async () => {
  const questions = await prompts([
    {
      type: 'text',
      name: 'domain',
      message: 'Please enter your domain'
    },
    {
      type: 'password',
      name: 'apiKey',
      message: 'Please enter the api key'
    },
    {
      type: 'number',
      name: 'numRecords',
      message: 'How many records do you want to watch?',
      min: 1
    }
  ])
  const { domain, apiKey, numRecords } = questions
  const records = await prompts(new Array(numRecords).fill(0).map((_: any, i) => ({
    type: 'text',
    name: 'record_' + i,
    message: 'Please enter record ' + i
  })))

  const config = await importConfig()
  const oldConfig = config ? config : []
  const newConfig = [...oldConfig, {
    domain,
    apiKey,
    checkInterval: "* * * * *",
    records: new Array(numRecords).fill(0).map((_: any, i: number) => records['record_' + i])
  }]
  await fs.writeFile('./config.yml', yaml.stringify(newConfig))
  const addMore = await prompts({ type: 'select', name: 'addMore', message: 'add more domains?', choices: [{ title: 'yes', value: 'yes' }, { title: 'no', value: 'no' }] })
  if (addMore.addMore === 'yes')
    await addDomains()
}
const setup = async (addDomainsFlag: string) => {
  console.log('[*] Vultr ddns')
  if (addDomainsFlag) await addDomains()
  const config = await importConfig()
  config.map((c: any) => scheduleWatchDomain(c))
}

setup(process.argv[2])
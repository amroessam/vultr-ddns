import { CronJob } from 'cron'
import cronstrue from 'cronstrue';
import axios, { AxiosError } from 'axios'
const getAllRecordsForDomain = async (domain: string, apiKey: string) => {
  try {

    const req = await axios({
      method: 'get',
      url: `https://api.vultr.com/v2/domains/${domain}/records`,
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    })
    const records: {
      data: string,
      id: string,
      name: string,
      priority: number,
      ttl: string,
      type: string
    }[] = req.data.records
    if (records.length < 1)
      console.log('[*] No records found for ' + domain)
    return records.filter(r => r.type === 'A')
  } catch (error) {
    const err = error as AxiosError
    if (err.isAxiosError) {
      // @ts-ignore
      console.log('[!] failed to get records for ' + domain + '. ' + err.response?.data?.error)
    }
  }
}
const createRemoteRecordForDomain = async (domain: string, apiKey: string, record: string, ip: string) => {
  try {
    const req = await axios({
      method: 'post',
      url: `https://api.vultr.com/v2/domains/${domain}/records`,
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      data: {
        name: record,
        "type": "A",
        "data": ip,
        "ttl": 300,
        "priority": 0
      }
    })
    const recordData: {
      data: string,
      id: string,
      name: string,
      priority: number,
      ttl: string,
      type: string
    } = req.data.record
    console.log(`[*] Record ${record} created successfully with ID ${recordData.id}`)
    return record
  } catch (error) {
    const err = error as AxiosError
    if (err.isAxiosError) {
      // @ts-ignore
      console.log('[!] failed to create record ' + record + ' for ' + domain + '. ' + err.response?.data?.error)
    }
  }
}

const updateRemoteRecordForDomain = async (domain: string, apiKey: string, record: string, recordId: string, ip: string) => {
  try {
    const req = await axios({
      method: 'patch',
      url: `https://api.vultr.com/v2/domains/${domain}/records/${recordId}`,
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      data: {
        "data": ip
      }
    })

    console.log(`[*] Record ${record} updated successfully with ID ${recordId}`)
    return record
  } catch (error) {
    const err = error as AxiosError
    if (err.isAxiosError) {
      // @ts-ignore
      console.log('[!] failed to create record ' + record + ' for ' + domain + '. ' + err.response?.data?.error)
    }
  }
}
const getIPv4 = async () => {
  try {
    const req = await axios.get('https://ip4.seeip.org')
    return req.data
  } catch (error) {
    console.log('[!] could not get current ip')
    return ''
  }
}

const watchDomain = async (domainEntry: {
  domain: string,
  apiKey: string,
  checkInterval: string,
  records: string[],
  excludeList: string[]
}) => {
  const currentIPv4 = await getIPv4()
  console.log('[*] Current public IPv4: ' + currentIPv4)
  const remoteRecords = await getAllRecordsForDomain(domainEntry.domain, domainEntry.apiKey) || []
  const localRecords = domainEntry.records
  const outOfSyncRecords = remoteRecords.filter(r => !domainEntry.excludeList.find(lr => lr === r.name) && r.data !== currentIPv4)

  if (outOfSyncRecords.length > 0) {
    console.log('[*] Found ' + outOfSyncRecords.length + ' out of sync record(s): ' + outOfSyncRecords.map(r => r.name).join(', '))
    console.log('[*] Updating out of sync records with current ip: ' + currentIPv4)
    outOfSyncRecords.map(r => updateRemoteRecordForDomain(domainEntry.domain, domainEntry.apiKey, r.name, r.id, currentIPv4))
  }

  const nonExistingRemoteRecords = localRecords.filter(item => !remoteRecords.find(r => r.name === item))
  if (nonExistingRemoteRecords.length > 0) {
    console.log('[*] Found ' + nonExistingRemoteRecords.length + ' new record(s): ' + nonExistingRemoteRecords.join(', '))
    console.log('[*] Creating records with current ip: ' + currentIPv4)
    nonExistingRemoteRecords.map(r => createRemoteRecordForDomain(domainEntry.domain, domainEntry.apiKey, r, currentIPv4))
  }
}

const scheduleWatchDomain = async (domainEntry: {
  domain: string,
  apiKey: string,
  checkInterval: string,
  records: string[],
  excludeList: string[]
}) => {
  console.log('[*] Starting to watch ' + domainEntry.domain + ' ' + cronstrue.toString(domainEntry.checkInterval))
  console.log('[*] Records: ' + domainEntry.records.join(', '))
  new CronJob(domainEntry.checkInterval, () => watchDomain(domainEntry), null).start()
}

export default scheduleWatchDomain
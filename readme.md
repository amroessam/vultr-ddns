# vultr-ddns

### This package was created out of the need to add multiple subdomains and update my dynamic public ip address to point to my home server
### Heavily inspired by [andyjsmith/Vultr-Dynamic-DNS](github.com/andyjsmith/Vultr-Dynamic-DNS), I basically rewrote it node and created a service around it

## Features
* Can monitor a list of domains to be updated
* Can monitor multiple subdomains
* You can exclude a list of sub domains to be updated per domain
* It only works on A records – only IPv4

## Configuration
The cli helps you setup the config if you don't have one, it generates a `config.yml` file in the same directory as the service, you can find an example config in `config.example.yml`

```yaml
- domain: corona.me
  apiKey: XXXXXXXXXXXXXXXXXXXXXXXXXX
  checkInterval: "* * * * *"
  records:
    - france
    - paris.france
    - lyon.france
  excludeList:
    - london
    - amsterdam
```
The above config will monitor the domain `corona.me` once every minute for the subdomains `france`, `paris.france` and `lyon.france`. It will exclude `london` and `amsterdam`

## Setup
1. Install dependecies `npm install`
2. Run the cli to help you configure it or create a configuration file in the same directory named `config.yml`
```bash
$ npm run config
```
3. Answer the questions
4. Profit 🚀

## Vultr config
You need to setup API access for this to work and get an API key. Login and go to https://my.vultr.com/settings/#settingsapi
This also requires you to have setup your dns with vultr
SMPP Client
===========

> SMPP Client (or ***smpp-cli***) is a simply command line that helps you to send SMS from a terminal or your applications and processes through the [***DNode protocol***](https://github.com/substack/dnode).
It helps you to handle a typical issues when you are working with SMPP protocol.

## Getting Started

### Install

Install the package globally in your machine:
```bash
npm install -g smpp-cli
```

## Usage

### Send SMS from ```Command Line Interface (CLI)```

You can send one SMS from CLI using the next command:

```bash
smpp-cli send MySender +34000000000 "Hello World!" -h smpp.example.com -p 2675 -L loginUser -P myPassword
```

### Mounting a ```Dnode``` server

You can mount a [DNode server](https://github.com/substack/dnode) to send SMS from other processes or applications and keep a permanent connection to SMPP. **This is specially recommened for applications that handle a high volume of SMS**:

```bash
smpp-cli listen 7070 -h smpp.example.com -p 2675 -L loginUser -P myPassword
```
If you want receive the ***DLRs (Delivery Reports)*** from SMPP you should add de ```-C``` (callback) option. It will request for DLR for each SMS. If you ommit this option, the DLR will not requested:
```
smpp-cli listen 7070 -h smpp.example.com -p 2675 -L loginUser -P myPassword` -C /usr/bin/processingBin
```

#### What parameters expect the ```Dnode``` server:

Depending on your programming language where you are implementing the ***Dnode protocol*** the implementation it's different, but paramaters are finally the same. These are the parameters that you can use:

```json
{
  "sourceAddress": "mySender",
  "destinationAddress": "+34000000000",
  "message": "Hello World!"
}
```

## Libraries using ```smpp-cli```:

* [SmsCampaignBundle](https://github.com/terox/SmsCampaignBundle) (PHP Synmfony Bundle to manage high volume of SMS)

## License

MIT © David Pérez Terol

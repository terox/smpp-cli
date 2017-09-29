#!/usr/bin/env node

var log     = console.log;
var program = require('commander');
var chalk   = require('chalk');
var dnode   = require('dnode');
var moment  = require('moment');
var exec    = require('child_process').exec;
var pkg     = require('../package.json');
var connect = require('../lib/connection');

program
  .version(pkg.version)
  .option('-h, --host <host>', 'SMPP server host')
  .option('-p, --port <port>', 'SMPP server port')
  .option('-L, --login <login>', 'SMPP login user')
  .option('-P, --password <pass>', 'SMPP login password');

program
  .command('listen <port>')
  .option('-e, --enquire-timeout <timeout>', 'Enquire link timeout in milliseconds (default: 20s)', 20000)
  .option('-C, --dlr-callback <path>', 'Script to call with a DLR confirmation', false)
  .action(function(port, options) {

    connect({
      host: program.host,
      port: program.port,
      login: program.login,
      password: program.password,
      enquireTimeout: options.enquireTimeout,
      dlrCallback: options.dlrCallback
    })

      // Open DNode server
      .then(function(smpp) {
        dnode({
          send: function(payload, callback) {

            log(chalk.blue('Sending SMS from "' + payload.sourceAddress +  '" to "' + payload.destinationAddress + '"'));

            smpp.sendSMS(payload.sourceAddress, payload.destinationAddress, payload.message).then(function(messageId) {
              callback(messageId);
              log(chalk.green('Sent successfully: ', pdu.message_id));
            });

          }
        }).listen(port);

        log(chalk.bgMagenta('Started DNode server at', port));
        log(chalk.bgMagenta('Waiting for SMS...'));
        return smpp;
      })

      // Listen the DLRs
      .then(function(smpp) {

        if(false === program.dlrCallback) {
          return log(chalk.blue("DLRs are not requested to SMPP"));
        }

        smpp.onDeliveryReport(function(dlr) {

          log(
            chalk.green(
              'Received DLR',
              chalk.yellow(
                'Stat:', chalk.blue(dlr.getStat()),
                'Submit:', chalk.blue(moment(dlr.getSubmitDate()).format('YY-MM-DD HH:mm')),
                'Done:', chalk.blue(moment(dlr.getDoneDate()).format('YY-MM-DD HH:mm'))
              )
            )
          );

          // Execute the callback
          exec(options.dlrCallback + " '" + dlr.toJson() + "'", function(err, stdout, stderr) {
              if(err) {
                return log(chalk.bgRed('Something went wrong executing the DRL callback'));
              }

              log(chalk.green('Executed callback successfully'));
          });

        });

        log(chalk.bgMagenta('Started DLRs listener'));
        log(chalk.bgMagenta('Waiting for delivery reports...'));

      })

    .catch(function(err) {
        log(chalk.red('Something went wrong: ', err));
        process.exit(1);
    });

  });

program
  .command('send <source> <destination> <message>')
  .option('-d, --delay <delay>', 'Add a delay to SMS in milliseconds (default: 0s)', 0)
  .action(function(source, destination, message, options) {

    connect({
      host: program.host,
      port: program.port,
      login: program.login,
      password: program.password
    })
      .delay(options.delay)
      .then(function(smpp) {
        return smpp.sendSMS(source, destination, message);
      })
      .then(function() {
        log(chalk.green('Sent successfully!'));
      })
      .catch(function(message) {
        log(chalk.bgRed('Something was wrogn:', message));
      })
    ;

  });

program.parse(process.argv);

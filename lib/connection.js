var log             = console.log;
var chalk           = require('chalk');
var moment          = require('moment');
var smppTransceiver = require('../lib');

/**
 * Creates a complete managed transceiver connection.
 *
 * Note:
 * Some parts of this code are based on @Sukhrob GitHub comment:
 * https://github.com/farhadi/node-smpp/issues/57#issuecomment-274481683
 *
 * @param {Object} config
 *
 * @return {Promise}
 */
module.exports = function(config) {

  var counter  = 0; // Missed enquire links counter
  var maxCount = 3; // Total missed enquire links allowed

  var smpp = smppTransceiver.create({
    host: config.host,
    port: config.port,
    login: config.login,
    password: config.password,
    deliveryReport: !!config.dlrCallback
  });

  var connection = smpp.connect()
    .then(function(smpp) {
      log(chalk.green('Connected to SMPP @', moment().format('MMMM Do YYYY, h:mm:ss a')));
      enquireLink();
      return smpp;
    })
    .catch(function(message) {
      log(chalk.bgRed('Error:', message));
    })
  ;

  // Respond to an enquire link
  smpp.on('enquire_link', function (pdu) {
       smpp.send(pdu.response());
       log(chalk.blue('Responded an enquire link'));
  });

  // Response to an enquire link
  smpp.on('enquire_link_resp', function (pdu) {
       counter = 0;
       log(chalk.blue('Received a response to an enquire link'));
  });

  // Listen to the unbind event and kill the process
  smpp.on('unbind', function(pdu) {
       smpp.send(pdu.response());
       log(chalk.blue('SMPP unbind'));
       smpp.close();
       process.exit();
  });

  // Kill the process on an SMPP connection error
  smpp.on('error', function (error) {
       log(chalk.bgRed('SMPP connection error: ' + error));
       smpp.close();
       process.exit(1);
  });

  // Kill the process when an SMPP connection is closed
  smpp.on('close', function () {
       log(chalk.blue('SMPP connection is closed'));
       process.exit();
  });

  function enquireLink() {
      if (counter < maxCount) {
          smpp.enquireLink();
          counter++;

          setTimeout(function () {
              enquireLink();
          }, config.enquireTimeout);

      } else {
          log(chalk.bgRed('The SMPP connection is dead.'));
          smpp.close();
          process.exit();
      }
  }

  return connection;
}

var smpp           = require('smpp');
var q              = require('q');
var DeliveryReport = require('./DeliveryReport');

/**
 * Create new SMPP transceiver instance.
 *
 * @param {Object}   options
 * @param {Function} callback
 */
var Transceiver = function(options)
{
	this._options = options;
	this._session = null;
	this._bound   = false;
}

/**
 * Connect to SMPP server.
 *
 * @return {Promise}
 */
Transceiver.prototype.connect = function()
{
	var self = this;

	return q.Promise(function(resolve, reject, notify) {
		self._session = smpp.connect('smpp://' + self._options.host + ':' + self._options.port);

		self._session.bind_transceiver({
			system_id: self._options.login,
			password: self._options.password
		}, function(pdu) {
			if (pdu.command_status == 0) {
				self._bound = true
				return resolve(self);
			}

			reject('Something went wrong connecting to SMPP server.');
		});

	});
};

/**
 * Close SMPP socket.
 *
 * @return void
 */
Transceiver.prototype.close = function()
{
	this._session.close();
}

/**
 * Listen SMPP session events
 *
 * @return {Object}
 */
Transceiver.prototype.on = function(eventName, callback)
{
	return this._session.on(eventName, callback);
}

/**
 * Listen for delivery reports.
 *
 * @param {Function} callback
 */
Transceiver.prototype.onDeliveryReport = function(callback)
{
	if(null === this._session) {
		throw new Error('Not bound to SMPP server');
	}

	if(false === this._options.deliveryReport) {
		throw new Error('Delivery Report is disabled for the current session');
	}

	this._session.on('deliver_sm', function(pdu) {
		if(pdu.esm_class === 4) {
			callback(new DeliveryReport(pdu));
		}
	});
};

/**
 * Send an equire link package
 *
 * @return void
 */
Transceiver.prototype.enquireLink = function()
{
	this._session.enquire_link();
}

/**
 * Send a package to SMPP
 *
 * @return {Object}
 */
Transceiver.prototype.send = function(object)
{
	return this._session.send(object);
}

/**
 * Send a one SMS.
 *
 * @param {String} sourceAddress
 * @param {String} destinationAddress
 * @param {String} message
 *
 * @return {Promise}
 */
Transceiver.prototype.sendSMS = function(sourceAddress, destinationAddress, message)
{
	var self = this;
	return q.Promise(function(resolve, reject, notify) {
		if(!self._bound) {
			return reject('Not bound to SMPP server');
		}

		self._session.submit_sm({
			registered_delivery: true === self._options.deliveryReport ? 1 : 0,

			source_addr: sourceAddress,
			destination_addr: destinationAddress,
			short_message: message
		}, function(pdu) {
			if (pdu.command_status !== 0) {
				return reject('Something was wrong sending the SMS');
			}

			resolve(pdu.message_id);
		});
	});
};

/**
 * Create new SMPP transceiver instance.
 *
 * @param {Object}   options
 */
exports.create = function(options)
{
	return new Transceiver(options);
};

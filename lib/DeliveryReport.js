var moment = require('moment');

var DeliveryReport = function(pdu)
{
  this._pdu        = pdu;

  this._messageId  = null;
  this._sub        = null;
  this._dlvrd      = null;
  this._submitDate = null;
  this._doneDate   = null;
  this._stat       = null;
  this._err        = null;

  this._parseDeliveryReport(pdu);
};

/**
 * Parse DeliveryReport PDU.
 *
 * @return void
 */
DeliveryReport.prototype._parseDeliveryReport = function(pdu)
{
  var regex  = /^id:([^ ]+) sub:(\d{1,3}) dlvrd:(\d{3}) submit date:(\d{10,12}) done date:(\d{10,12}) stat:([A-Z ]{7}) err:(\d{2,3}) text:(.*)$/i;
  var result = pdu.short_message.message.match(regex);

  this._messageId  = result[1];
  this._sub        = result[2];
  this._dlvrd      = result[3];
  this._submitDate = moment(result[4], 'YYMMDDHHmm').toDate();
  this._doneDate   = moment(result[5], 'YYMMDDHHmm').toDate();
  this._stat       = result[6];
  this._err        = result[7];
}

/**
 * Get receipt message ID.
 *
 * @return {String}
 */
DeliveryReport.prototype.getReceiptMessageId = function()
{
  return this._messageId;
}

/**
 * Get message state.
 *
 * @return {Integer}
 */
DeliveryReport.prototype.getMessageState = function()
{
  return this._pdu.message_state;
}

/**
 * Get submit date.
 *
 * @return {Date}
 */
DeliveryReport.prototype.getSubmitDate = function()
{
  return this._submitDate;
}

/**
 * Get done date.
 *
 * @return {Date}
 */
DeliveryReport.prototype.getDoneDate = function()
{
  return this._doneDate;
}

/**
 * Get stat.
 *
 * @return {String}
 */
DeliveryReport.prototype.getStat = function()
{
  return this._stat;
}

/**
 * To JSON.
 *
 * @return {String}
 */
DeliveryReport.prototype.toJson = function()
{
  return JSON.stringify({
    id: this.getReceiptMessageId(),
    submitDate: this.getSubmitDate(),
    doneDate: this.getDoneDate(),
    stat: this.getStat()
  });
}

module.exports = DeliveryReport;

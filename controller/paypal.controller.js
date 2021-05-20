const PaypalServices = require('../services/paypal.services');

class PaypalController {

    services = PaypalServices;

}

module.exports = new PaypalController();
const StripeServices = require('../services/stripe.services');

class StripeController {

    services = StripeServices;

}

module.exports = new StripeController();
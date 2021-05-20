const express = require("express");
const bodyParser = require("body-parser");
const paypal = require("paypal-rest-sdk");
const PaypalRouter = require('./routes/paypal.routes');
const StripeRouter = require('./routes/stripe.routes');

if(process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'AWmjcv8vv1Ly8YqDiI5LfhD7ZmA9A3gnuVC4RsLGDF66BSND1xJZ1jq4dhpm7O_H7UgTN9xnDE97eF2-',
    'client_secret': 'EF0E8ji9iALd2dUrfPq7cU_r9duGBDJ4htz2WU8LtePvxNkHYdU_cFsHRDv_ohd4DE458Dam-qlugi1k'
  });

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY;

const app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const stripe = require("stripe")(stripeSecretKey)


app.set("view engine", "ejs");

app.use('/', PaypalRouter);
app.use('/stripe', StripeRouter);

app.get("/stripe", (req, res) => {
    res.render('Home'), {
        key: stripePublicKey
    }
})

app.post("/payment", function(req, res) {
    stripe.customers.create({
        email: req.body.stripeEmail,
        source: req.body.stripeToken,
        name: "Kirill Gavrilchik",
        address: {
            line1: "Lenina 17",
            postal_code:'222160',
            city: 'Zhodino',
            state: 'Minsk region',
            country: "Republic of Belarus"
        }
    }).then((customer) => {
        return stripe.charges.create({
            amount: 7000,
            description: "Web Development Product",
            currency: 'USD',
            customer: customer.id
        })
    }).then((charge) => {
        console.log(charge)
        res.send("Success")
    }).catch((err) => {
        res.send(err)
    })
})

app.get("/", (req, res) => {
    res.render('PayPal');
})

app.post('/pay', (req, res) => {
    const create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": "http://localhost:3000/success",
            "cancel_url": "http://localhost:3000/cancel"
        },
        "transactions": [{
            "item_list": {
                "items": [{
                    "name": "Red Sox Hat",
                    "sku": "001",
                    "price": "25.00",
                    "currency": "USD",
                    "quantity": 1
                }]
            },
            "amount": {
                "currency": "USD",
                "total": "25.00"
            },
            "description": "Hat for the best team ever."
        }]
    };

    paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
            throw error;
        } else {
            for( let i = 0; i < payment.links.length; i++) {
                if(payment.links[i].rel === 'approval_url') {
                    res.redirect(payment.links[i].href);
                }
            }
        }
    });
} )

app.get('/success', (req, res) => {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;

    const execute_payment_json = {
        "payer_id": payerId,
        "transactions": [{
            "amount": {
                "currency": "USD",
                "total": "25.00"
            }
        }]
    };

    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
        if (error) {
            throw error;
        } else {
            console.log(JSON.stringify(payment));
            res.send('Success');
        }
    });
})

app.get('/cancel', (req, res) => res.send('Cancelled'));

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}...`);
})
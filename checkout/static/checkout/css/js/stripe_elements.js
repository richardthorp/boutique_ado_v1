var stripePublicKey = $("#id_stripe_public_key").text().slice(1, -1);
var clientSecret = $("#id_client_secret").text().slice(1, -1);
var stripe = Stripe(stripePublicKey);
var elements = stripe.elements();

var style = {
    base: {
        color: '#000',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
            color: '#aab7c4'
        }
    },
    invalid: {
        color: '#dc3545',
        iconColor: '#dc3545'
    }
};

var card = elements.create('card', {style:style});
card.mount('#card-element')

/* ADD VALIDATION TO CARD ELEMENT */
card.addEventListener('change', function (event) {
    var errorDiv = document.getElementById('card-errors');
    if (event.error) {
        var html = `
            <span class="icon" role="alert">
                <i class="fas fa-times"></i>
            </span>
            <span>${event.error.message}</span>`
        $(errorDiv).html(html);
    } else {
        $(errorDiv).textContent = "";
    }
})

// Handle form submit (payment)

var form = document.getElementById('payment-form');

form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    // Block user from clicking submit multiple times or using card element after a submit
    card.update({'disabled': true });
    $("#submit-button").attr('disabled', true);
    $("#payment-form").fadeToggle(100)
    $("#loading-overlay").fadeToggle(100)
    // If the client secret was rendered server-side as a data-secret attribute
    // on the <form> element, you can retrieve it here by calling `form.dataset.secret`
    stripe.confirmCardPayment(clientSecret, {
        payment_method: {
            card: card,
        }
    }).then(function (result) {
        if (result.error) {
            console.log(result.error)
            // Show error to your customer (e.g., insufficient funds)
            var html = `
            <span class="icon" role="alert">
                <i class="fas fa-times"></i>
            </span>
            <span>${result.error.message}</span>`

            $("#payment-form").fadeToggle(100)
            $("#loading-overlay").fadeToggle(100)
            var errorDiv = document.getElementById('card-errors');
            $(errorDiv).html(html);

            // Allow user to use card element and submit button again
            card.update({
                'disabled': false
            });
            $("#submit-button").attr('disabled', false);
        } else {
            // The payment has been processed!
            if (result.paymentIntent.status === 'succeeded') {
                form.submit()
            }
        }
    });
});
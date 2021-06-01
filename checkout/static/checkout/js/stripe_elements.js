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

var card = elements.create('card', {
    style: style
});
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
    card.update({
        'disabled': true
    });
    $("#submit-button").attr('disabled', true);
    $("#payment-form").fadeToggle(100)
    $("#loading-overlay").fadeToggle(100)

    // Gather data for cache_checkout_data view and send before submitting
    // confirmCardPayment() to stripe
    var saveInfo = Boolean($("#id-save-info").attr('checked'));
    var csrfToken = $("input[name='csrfmiddlewaretoken']").val();
    var postData = {
        'csrfmiddlewaretoken': csrfToken,
        'client_secret': clientSecret,
        'save_info': saveInfo,
    };
    var url = '/checkout/cache_checkout_data/'

    $.post(url, postData).done(function () {
        stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: card,
                billing_details: {
                    name: $.trim(form.full_name.value),
                    phone: $.trim(form.phone_number.value),
                    email: $.trim(form.email.value),
                    address: {
                        line1: $.trim(form.street_address1.value),
                        line2: $.trim(form.street_address2.value),
                        city: $.trim(form.town_or_city.value),
                        country: $.trim(form.country.value),
                        state: $.trim(form.county.value),
                    }
                }
            },
            shipping: {
                name: $.trim(form.full_name.value),
                phone: $.trim(form.phone_number.value),
                address: {
                    line1: $.trim(form.street_address1.value),
                    line2: $.trim(form.street_address2.value),
                    city: $.trim(form.town_or_city.value),
                    postal_code: $.trim(form.postcode.value),
                    state: $.trim(form.county.value),
                    country: $.trim(form.country.value),
                }
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
    // If the cache_checkout_data view fails, reload the page. The view contains
    // an error message to update the user
    }).fail(function(){
        location.reload()
    })
});
from django.shortcuts import render, redirect, reverse
from django.contrib import messages

from .forms import OrderForm


def checkout(request):
    bag = request.session.get('bag', {})
    if not bag:
        messages.error(request, 'There is nothing in your bag!')
        redirect(reverse('products'))

    order_form = OrderForm()
    template = 'checkout/checkout.html'
    context = {
        'order_form': order_form,
        'stripe_public_key': 'pk_test_51It6swGAzDhDskfJeHjH6eSWgzO8Ifm8FD8P3EFrjtIjrHUyqZ1klLuUSKM3tUOmR43Hcp9AStgQPyMs9zLaZuCq00ST1UhCyE',
        'client_secret': 'test client secret'
    }

    return render(request, template, context)
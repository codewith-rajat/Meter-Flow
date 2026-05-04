import Stripe from 'stripe';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('StripeService');

class StripeService {
  constructor() {
    if (!process.env.STRIPE_SECRET_KEY) {
      logger.warn('Stripe API key not configured');
      this.stripe = null;
    } else {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    }
  }

  /**
   * Create a Stripe customer for a user
   */
  async createCustomer(user) {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user._id.toString()
        }
      });

      logger.success(`Stripe customer created for user ${user._id}: ${customer.id}`);
      return customer;
    } catch (error) {
      logger.error('Failed to create Stripe customer', error);
      throw error;
    }
  }

  /**
   * Create a payment intent for an invoice
   */
  async createPaymentIntent(amount, currency, metadata) {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata
      });

      logger.success(`Payment intent created: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error) {
      logger.error('Failed to create payment intent', error);
      throw error;
    }
  }

  /**
   * Confirm payment intent
   */
  async confirmPaymentIntent(paymentIntentId, paymentMethodId) {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId
      });

      logger.success(`Payment intent confirmed: ${paymentIntentId}`);
      return paymentIntent;
    } catch (error) {
      logger.error('Failed to confirm payment intent', error);
      throw error;
    }
  }

  /**
   * Retrieve payment intent status
   */
  async getPaymentIntent(paymentIntentId) {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      logger.error('Failed to retrieve payment intent', error);
      throw error;
    }
  }

  /**
   * Create a subscription for a customer
   */
  async createSubscription(customerId, priceId) {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent']
      });

      logger.success(`Subscription created for customer ${customerId}: ${subscription.id}`);
      return subscription;
    } catch (error) {
      logger.error('Failed to create subscription', error);
      throw error;
    }
  }

  /**
   * Update subscription
   */
  async updateSubscription(subscriptionId, updates) {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, updates);
      logger.success(`Subscription updated: ${subscriptionId}`);
      return subscription;
    } catch (error) {
      logger.error('Failed to update subscription', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId) {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      const subscription = await this.stripe.subscriptions.del(subscriptionId);
      logger.success(`Subscription cancelled: ${subscriptionId}`);
      return subscription;
    } catch (error) {
      logger.error('Failed to cancel subscription', error);
      throw error;
    }
  }

  /**
   * Retrieve subscription
   */
  async getSubscription(subscriptionId) {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      logger.error('Failed to retrieve subscription', error);
      throw error;
    }
  }

  /**
   * Create invoice for a customer
   */
  async createInvoice(customerId, metadata) {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      const invoice = await this.stripe.invoices.create({
        customer: customerId,
        metadata
      });

      logger.success(`Invoice created for customer ${customerId}: ${invoice.id}`);
      return invoice;
    } catch (error) {
      logger.error('Failed to create invoice', error);
      throw error;
    }
  }

  /**
   * Finalize invoice (makes it ready for payment)
   */
  async finalizeInvoice(invoiceId) {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      const invoice = await this.stripe.invoices.finalizeInvoice(invoiceId);
      logger.success(`Invoice finalized: ${invoiceId}`);
      return invoice;
    } catch (error) {
      logger.error('Failed to finalize invoice', error);
      throw error;
    }
  }

  /**
   * Send invoice to customer
   */
  async sendInvoice(invoiceId) {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      const invoice = await this.stripe.invoices.sendInvoice(invoiceId);
      logger.success(`Invoice sent: ${invoiceId}`);
      return invoice;
    } catch (error) {
      logger.error('Failed to send invoice', error);
      throw error;
    }
  }

  /**
   * Get payment methods for customer
   */
  async getPaymentMethods(customerId) {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });

      return paymentMethods.data;
    } catch (error) {
      logger.error('Failed to retrieve payment methods', error);
      throw error;
    }
  }

  /**
   * Detach payment method from customer
   */
  async detachPaymentMethod(paymentMethodId) {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      const paymentMethod = await this.stripe.paymentMethods.detach(paymentMethodId);
      logger.success(`Payment method detached: ${paymentMethodId}`);
      return paymentMethod;
    } catch (error) {
      logger.error('Failed to detach payment method', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(body, signature) {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('Stripe webhook secret not configured');
    }

    try {
      const event = this.stripe.webhooks.constructEvent(body, signature, webhookSecret);
      return event;
    } catch (error) {
      logger.error('Webhook signature verification failed', error);
      throw error;
    }
  }
}

export default new StripeService();

import { Request, Response } from 'express';
import Stripe from 'stripe';
import { AuthRequest } from '../middlewares/auth';
import User from '../models/User';
import Subscription from '../models/Subscription';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  // @ts-ignore
  apiVersion: '2025-01-27.acacia',
});

export const createCheckoutSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        customer_email: user.email,
        client_reference_id: user._id.toString(),
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'HabitPilot Pro',
                description: 'Unlock AI Replanning and Unlimited Habit Plans',
              },
              recurring: {
                interval: 'month',
              },
              unit_amount: 999, // $9.99
            },
            quantity: 1,
          },
        ],
        success_url: `${req.headers.origin || process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard?success=true`,
        cancel_url: `${req.headers.origin || process.env.CLIENT_URL || 'http://localhost:3000'}/pricing?canceled=true`,
      });

      res.status(200).json({ url: session.url });
    } catch (stripeError) {
      console.error('Stripe error:', stripeError);
      res.status(500).json({ message: 'Error initiating Stripe checkout', error: (stripeError as Error).message });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error in checkout process', error: (error as Error).message });
  }
};

export const handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err) {
    res.status(400).send(`Webhook Error: ${(err as Error).message}`);
    return;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (userId) {
          const user = await User.findById(userId);
          if (user) {
            user.plan = 'pro';
            user.stripeCustomerId = customerId;
            await user.save();

            const subscription: any = await stripe.subscriptions.retrieve(subscriptionId);
            await Subscription.create({
              userId,
              stripeSubscriptionId: subscriptionId,
              status: subscription.status,
              currentPeriodEnd: new Date(subscription.current_period_end * 1000)
            });
          }
        }
        break;

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const sub: any = event.data.object as Stripe.Subscription;
        const dbSub = await Subscription.findOne({ stripeSubscriptionId: sub.id });
        if (dbSub) {
          dbSub.status = sub.status;
          dbSub.currentPeriodEnd = new Date(sub.current_period_end * 1000);
          await dbSub.save();

          if (sub.status !== 'active' && sub.status !== 'trialing') {
            await User.findByIdAndUpdate(dbSub.userId, { plan: 'free' });
          } else {
            await User.findByIdAndUpdate(dbSub.userId, { plan: 'pro' });
          }
        }
        break;
      
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.status(200).send('Received');
  } catch (error) {
    res.status(500).send('Webhook handler failed');
  }
};

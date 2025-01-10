'use client'

import { Button } from '@/components/ui/button';
import { createBillingPortalSession, createCheckoutSession, getSubscriptionStatus } from '@/lib/stripe-action';
import React from 'react';

const StripeButton = () => {
  const [isSubscribed, setIsSubscribed] = React.useState<boolean>(false);
  
    React.useEffect(() => {
      void (async () => {
        const subscriptionStatus = await getSubscriptionStatus();
  
        setIsSubscribed(subscriptionStatus);
      })();
    }, []);
  

  const handleClick = async () => {
    if (isSubscribed) {
      await createBillingPortalSession()
    } else {
      await createCheckoutSession()
    }
  }

  return (
    <Button variant={ "outline" } size={ "default" } onClick={ handleClick }>
      {isSubscribed ? "Manage Subscription" : "Upgrade Plan"}
    </Button>
  )
}

export default StripeButton
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { calculateBonus } from "@/utils/CreditBonusCalculator";

export const dynamic = "force-dynamic";

export async function POST(request) {
	const supabase = createRouteHandlerClient({ cookies });

	const body = await request.json();

	/**
    
   {
      stripe_account_id: "acct_",
      price_id: "price_",
      return_url: ""
      credit_amount: 1000
   }

    */

	try {
		const {
			data: { user },
		} = await supabase.auth.getUser();

		const bonus = calculateBonus(body.credit_amount);
		const total_credits = body.credit_amount + bonus;

		const session = await stripe.checkout.sessions.create({
			success_url: body.success_url,
			cancel_url: body.cancel_url,
			customer: user.user_metadata.stripe_customer_id,
			payment_intent_data: {
				metadata: {
					user_id: user.id,
					price_id: body.price_id,
					credit_amount: body.credit_amount,
					bonus_amount: bonus,
					total_credits: total_credits,
				},
			},
			line_items: [
				{
					price: body.price_id,
					quantity: body.quantity,
				},
			],

			mode: "payment",
		});

		return new Response(JSON.stringify({ status: 200, body: session }));
	} catch (error) {
		console.log(error);
		return new Response(JSON.stringify({ status: 400, error: error }));
	}
}

// This is your Stripe CLI webhook secret for testing your endpoint locally.
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

import { headers } from "next/headers";

import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(request) {
	const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

	const body = await request.text();

	const sig = headers().get("stripe-signature");

	let event;

	try {
		event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
	} catch (err) {
		//console.log("event error", err);
		return new Response(JSON.stringify({ status: 400 }));
	}

	switch (event.type) {
		case "payment_intent.succeeded":
			const payment_intent_succeeded = event.data.object;

			const charge = await stripe.charges.retrieve(payment_intent_succeeded.latest_charge);

			// Get the account from supabase
			const { data: profile, error: profile_error } = await supabase
				.from("profiles")
				.select()
				.eq("user_id", payment_intent_succeeded.metadata.user_id)
				.maybeSingle();

			const new_balance = parseFloat(profile.balance) + parseFloat(payment_intent_succeeded.metadata.total_credits);

			/*
			const payment_intent_payload = {
				type: "purchase",
				stripe_payment_intent_id: payment_intent_succeeded.id,
				account_id: null,
				user_id: payment_intent_succeeded.metadata.user_id,
				credits_before: account.credit_balance,
				credit_amount: payment_intent_succeeded.metadata.credit_amount,
				payment_amount: payment_intent_succeeded.amount,
				receipt_link: charge.receipt_url,
			};
         */
			//Update the account balance
			const { data: update_profile, error: update_profile_error } = await supabase
				.from("profiles")
				.update({ balance: new_balance })
				.eq("id", profile.id)
				.select();

		default:
			console.log(`Unhandled event type ${event.type}`);
	}

	return new Response(JSON.stringify({ status: 200 }));
}

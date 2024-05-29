import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const transactionServiceClient = {
	async transcription({ profileId, userId, fileId, transcriptionLength }) {
		// Required Data
		/**
		 * {
		 *
		 * }
		 */

		const costPerSecond = 0.025; // Represents cost in CENTS
		const cost = costPerSecond * transcriptionLength;

		// Create transaction record
		const transaction_payload = {
			type: "transcription",
			user_id: userId,
			file_id: fileId,
			rate: costPerSecond,
			units: transcriptionLength,
			total: cost,
		};

		const { data: event, error: eventError } = await supabase.from("transactions").insert(transaction_payload).select();

		// Deduct from profile balance
		const { data: profile, error: profile_error } = await supabase
			.from("profiles")
			.select("balance")
			.eq("id", profileId)
			.select()
			.maybeSingle();

		const { data: profile_update, error: profile_update_error } = await supabase
			.from("profiles")
			.update({ balance: profile.balance - cost })
			.eq("id", profileId)
			.select()
			.maybeSingle();
	},

	async generation({ profileId, userId, fileId, inputTokens, outputTokens }) {
		// Required Data
		/**
		 * {
		 *
		 * }
		 */

		const costPerInput = 0.005; // Represents cost in CENTS
		const inputCost = costPerInput * inputTokens;

		const costPerOutput = 0.015; // Represents cost in CENTS
		const outputCost = costPerOutput * outputTokens;

		const totalCost = inputCost + outputCost;

		// Create transaction record
		const transaction_payload = {
			type: "generation",
			user_id: userId,
			file_id: fileId,
			rate: null,
			units: null,
			total: totalCost,
		};

		const { data: event, error: eventError } = await supabase.from("transactions").insert(transaction_payload).select();

		// Deduct from profile balance
		const { data: profile, error: profile_error } = await supabase
			.from("profiles")
			.select("balance")
			.eq("id", profileId)
			.select()
			.maybeSingle();

		const { data: profile_update, error: profile_update_error } = await supabase
			.from("profiles")
			.update({ balance: profile.balance - totalCost })
			.eq("id", profileId)
			.select()
			.maybeSingle();
	},
};

export default transactionServiceClient;

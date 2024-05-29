import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const balanceServiceClient = {
	async checkForPositiveBalance({ profileId, userId }) {
		// Required Data
		/**
		 * {
		 *
		 * }
		 */

		// Deduct from profile balance
		const { data: profile, error: profile_error } = await supabase
			.from("profiles")
			.select("balance")
			.eq("id", profileId)
			.select()
			.maybeSingle();

		if (profile.balance > 0) {
			return true;
		} else {
			return false;
		}
	},
};

export default balanceServiceClient;

import { OpenAI } from "openai";
import { getEncoding, encodingForModel } from "js-tiktoken";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import transactionServiceClient from "services/TransactionService";

const openai = new OpenAI({
	apiKey: process.env.OPENAI_KEY,
});

export async function POST(request) {
	const body = await request.json();
	const { transcription, fileId, summaryInstructions } = body;

	const supabase = createServerComponentClient({ cookies });

	try {
		console.log("Sending transcription to OpenAI for summarization...");

		const model = "gpt-4o";

		const messages = [
			{
				role: "system",
				content: `You are an AI expert in analyzing conversations and extracting action items. Please review the text and identify any tasks, assignments, or actions that were agreed upon or mentioned as needing to be done. These could be tasks assigned to specific individuals, or general actions that the group has decided to take. Please list these action items clearly and concisely. Always format your summary in Markdown.${
					summaryInstructions.length > 0 && "Also consider the following instruction: " + summaryInstructions
				}`,
			},
			{
				role: "user",
				content: transcription,
			},
		];

		// Send the transcription to OpenAI for summarization
		const chatCompletion = await openai.chat.completions.create({
			model: model,
			messages: messages,
		});
		console.log("Summarization completed successfully.");

		const summary = chatCompletion.choices[0].message.content;

		console.log(`Updating summary in database with id ${fileId}...`);

		const { data: existing_summary, error: existing_summary_error } = await supabase
			.from("files")
			.select("summary")
			.eq("id", fileId)
			.maybeSingle();

		existing_summary["action_items"] = summary;

		const update_payload = {
			summary: existing_summary,
		};

		const { data, error } = await supabase.from("files").update(update_payload).eq("id", fileId);

		if (error) {
			throw new Error(`Failed to update summary in database: ${error.message}`);
		}
		console.log(`Summary updated in database for file ID: ${fileId}`);

		const response_payload = {
			status: 200,
			body: { summary: summary },
		};

		const {
			data: { user },
		} = await supabase.auth.getUser();

		const { data: user_profile, error: user_profile_error } = await supabase
			.from("profiles")
			.select("*")
			.eq("user_id", user.id)
			.maybeSingle();

		const enc = getEncoding("cl100k_base"); // js-tiktoken

		let inputString = messages.map((m) => m.content).join(" ");
		const inputTokenList = enc.encode(inputString);
		const inputTokens = inputTokenList.length;

		let outputString = chatCompletion.choices[0].message.content;
		const outputTokenList = enc.encode(outputString);
		const outputTokens = outputTokenList.length;

		transactionServiceClient.generation({
			profileId: user_profile.id,
			userId: user.id,
			fileId: fileId,
			inputTokens: inputTokens,
			outputTokens: outputTokens,
		});

		return new Response(JSON.stringify(response_payload), { status: 200 });
	} catch (error) {
		console.error("Error during processing:", error);
		return new Response(JSON.stringify({ status: 500, error: error.message }), { status: 500 });
	}
}

import { OpenAI } from "openai";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const openai = new OpenAI({
	apiKey: process.env.OPENAI_KEY,
});

export async function POST(request) {
	const body = await request.json();
	const { transcription, fileId } = body;

	const supabase = createServerComponentClient({ cookies });

	try {
		console.log("Sending transcription to OpenAI for formatting...");
		// Send the transcription to OpenAI for formatting
		const chatCompletion = await openai.chat.completions.create({
			model: "gpt-4o",
			messages: [
				{
					role: "system",
					content:
						"You are a highly skilled AI trained in language comprehension and formatting. I would like you to read the following text and format it into a more readable structure using sections and markdown. Aim to create a coherent and readable format that helps a person understand the main points of the discussion easily. Use headings and basic markdown elements as necessary.",
				},
				{
					role: "user",
					content: transcription,
				},
			],
		});
		console.log("Formatting completed successfully.");

		const formattedTranscript = chatCompletion.choices[0].message.content;

		console.log(`Updating formatted transcript in database with id ${fileId}...`);
		const { data, error } = await supabase
			.from("files")
			.update({ formatted_transcript: formattedTranscript })
			.eq("id", fileId);
		if (error) {
			throw new Error(`Failed to update formatted transcript in database: ${error.message}`);
		}
		console.log(`Formatted transcript updated in database for file ID: ${fileId}`);
		const response_payload = {
			status: 200,
			body: { formattedTranscript },
		};

		return new Response(JSON.stringify(response_payload), { status: 200 });
	} catch (error) {
		console.error("Error during processing:", error);
		return new Response(JSON.stringify({ status: 500, error: error.message }), { status: 500 });
	}
}

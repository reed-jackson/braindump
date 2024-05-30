import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { getEncoding } from "js-tiktoken";

import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import transactionServiceClient from "services/TransactionService";

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
	const supabase = createRouteHandlerClient({ cookies });

	const { messages, fileId } = await req.json();

	const {
		data: { user },
	} = await supabase.auth.getUser();

	const model = "gpt-4o";
	const enc = getEncoding("cl100k_base"); // js-tiktoken

	// Ask OpenAI for a streaming chat completion given the prompt
	const response = await openai.chat.completions.create({
		model: model,
		stream: true,
		messages,
	});

	let completionTokens = 0;

	const streamCallbacks = {
		onToken: (content) => {
			// We call encode for every message as some experienced
			// regression when tiktoken called with the full completion
			const tokenList = enc.encode(content);
			completionTokens += tokenList.length;
		},
		onFinal: async (completion) => {
			// Log Usage
			let inputString = messages.map((m) => m.content).join(" ");

			const inputTokenList = enc.encode(inputString);
			const inputTokens = inputTokenList.length;

			const { data: user_profile, error: user_profile_error } = await supabase
				.from("profiles")
				.select("id")
				.eq("user_id", user.id)
				.maybeSingle();

			transactionServiceClient.generation({
				profileId: user_profile.id,
				userId: user.id,
				fileId: fileId,
				inputTokens: inputTokens,
				outputTokens: completionTokens,
			});

			// Clone the messages array and push the new message
			const fullMessages = [...messages];
			fullMessages.push({
				role: "assistant",
				content: completion,
			});

			const history_payload = {
				chat_messages: fullMessages,
				updated_at: new Date().toISOString(),
			};

			const { data, error } = await supabase.from("files").update(history_payload).eq("id", fileId);

			if (error) {
				console.log(error);
				let response_payload = {
					status: 400,
					body: {
						message: error,
					},
				};

				return new Response(JSON.stringify(response_payload));
			}
		},
	};

	// Convert the response into a friendly text-stream
	const stream = OpenAIStream(response, streamCallbacks);

	// Respond with the processed HTML stream
	return new StreamingTextResponse(stream);
}

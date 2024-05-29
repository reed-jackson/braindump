import { OpenAI } from "openai";
import fs from "fs";
import path from "path";
import axios from "axios";
import mime from "mime-types"; // Add this package to check MIME types
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import transactionServiceClient from "services/TransactionService";

const openai = new OpenAI({
	apiKey: process.env.OPENAI_KEY,
});

export async function POST(request) {
	const body = await request.json();
	const { filePublicUrl, fileId, fileLengthInSeconds } = body;

	const supabase = createServerComponentClient({ cookies });

	try {
		console.log("Starting file download...");

		// Download the file
		const response = await axios({
			url: filePublicUrl,
			method: "GET",
			responseType: "arraybuffer",
		});

		// Determine the MIME type of the downloaded file
		const mimeType = mime.lookup(filePublicUrl);
		console.log(`Downloaded file MIME type: ${mimeType}`);

		// Ensure the file is in a supported format
		const supportedFormats = [
			"audio/flac",
			"audio/x-m4a",
			"audio/mp3",
			"audio/mp4",
			"audio/mpeg",
			"audio/mpga",
			"audio/ogg",
			"audio/wav",
			"audio/webm",
		];
		if (!supportedFormats.includes(mimeType)) {
			throw new Error(`Unsupported file format: ${mimeType}`);
		}

		// Get the file extension from the MIME type
		const fileExtension = mime.extension(mimeType);
		const localFilePath = path.join("/tmp", `downloaded_audio_file.${fileExtension}`);

		// Save the file locally with the correct extension
		fs.writeFileSync(localFilePath, response.data);
		console.log(`File downloaded and saved locally as ${localFilePath}.`);

		console.log("Transcribing the audio...");
		// Transcribe the audio
		const transcription = await openai.audio.transcriptions.create({
			file: fs.createReadStream(localFilePath),
			model: "whisper-1",
		});
		console.log("Audio transcribed successfully.");

		// Clean up the local file
		fs.unlinkSync(localFilePath);
		console.log("Local file cleaned up.");

		console.log(`Updating transcription in database with id ${fileId}...`);
		const { data, error } = await supabase.from("files").update({ transcription: transcription.text }).eq("id", fileId);
		if (error) {
			throw new Error(`Failed to update transcription in database: ${error.message}`);
		}
		console.log(`Transcription updated in database for file ID: ${fileId}`);

		const response_payload = {
			status: 200,
			body: { transcription: transcription },
		};

		const {
			data: { user },
		} = await supabase.auth.getUser();

		const { data: user_profile, error: user_profile_error } = await supabase
			.from("profiles")
			.select("*")
			.eq("user_id", user.id)
			.maybeSingle();

		transactionServiceClient.transcription({
			profileId: user_profile.id,
			userId: user.id,
			fileId: fileId,
			transcriptionLength: fileLengthInSeconds,
		});

		return new Response(JSON.stringify(response_payload), { status: 200 });
	} catch (error) {
		console.error("Error during processing:", error);
		return new Response(JSON.stringify({ status: 500, error: error.message }), { status: 500 });
	}
}

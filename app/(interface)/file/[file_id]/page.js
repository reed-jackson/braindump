"use client";
import { useEffect, useState } from "react";
import {
	Flex,
	Card,
	Avatar,
	Text,
	Skeleton,
	Button,
	Tabs,
	Box,
	ScrollArea,
	Spinner,
	Tooltip,
	TextArea,
	Callout,
	Link,
	TextField,
	IconButton,
} from "@radix-ui/themes";
import {
	IconArrowDown,
	IconArrowUp,
	IconCircleCheck,
	IconClockPause,
	IconCopy,
	IconEye,
	IconNote,
	IconSend,
	IconSortDescending,
	IconSparkles,
	IconTransform,
	IconWaveSine,
} from "@tabler/icons-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import ReactMarkdown from "react-markdown";
import { useChat } from "ai/react";
import Markdown from "react-markdown";

export default function FilePage({ params }) {
	const [user, setUser] = useState(null);

	const [file, setFile] = useState(null);
	const [filePublicUrl, setFilePublicUrl] = useState(null);
	const [transcript, setTranscript] = useState(null);
	const [formattedTranscript, setFormattedTranscript] = useState(null);
	const [summary, setSummary] = useState(null);

	const [summaryInstructions, setSummaryInstructions] = useState("");
	const [transcriptRolledUp, setTranscriptRolledUp] = useState(true);

	const [creatingChat, setCreatingChat] = useState(false);

	const [status, setStatus] = useState({
		uploaded: "complete",
		transcribed: "not_started",
		transcript_formatted: "not_started",
		summarized: "not_started",
		chat_ready: "not_started",
	});

	const file_id = params.file_id;
	const supabase = createClientComponentClient();

	useEffect(() => {
		const fetchUser = async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();

			console.log(user);
			setUser(user);
		};

		fetchUser();
	}, []);

	useEffect(() => {
		const getFile = async () => {
			const { data, error } = await supabase.from("files").select("*").eq("id", file_id).maybeSingle();
			const { data: filePublicUrl } = supabase.storage.from("uploads").getPublicUrl(data.file_path);

			setFile(data);
			setTranscript(data.transcription);

			let newStatus = { ...status };

			if (data.transcription) {
				newStatus.transcribed = "complete";
			}

			setFormattedTranscript(data.formatted_transcript);
			if (data.formatted_transcript) {
				newStatus.transcript_formatted = "complete";
			}

			setSummary(data.summary);
			if (data.summary) {
				newStatus.summarized = "complete";
				newStatus.chat_ready = "complete";
			}

			setMessages(data.chat_messages);

			setFilePublicUrl(filePublicUrl.publicUrl);
			setStatus(newStatus);
		};

		getFile();
	}, [file_id]);

	// Generation Functions

	const transcribeAudio = async () => {
		setStatus({ ...status, transcribed: "in_progress" });

		let fileLengthInSeconds = 0;
		try {
			const audio = new Audio(filePublicUrl);
			audio.addEventListener("loadedmetadata", async () => {
				fileLengthInSeconds = Math.floor(audio.duration);

				try {
					const response = await fetch("/api/transcribe", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({ filePublicUrl, fileId: file_id, fileLengthInSeconds: fileLengthInSeconds }),
					});

					const result = await response.json();
					setTranscript(result.body.transcription.text);
					setStatus({ ...status, transcribed: "complete" });
				} catch (error) {
					console.log(error);
				}
			});
		} catch (error) {
			console.error("Failed to fetch file metadata:", error);
		}
	};

	const summarizeTranscript = async () => {
		setStatus({ ...status, summarized: "in_progress" });
		try {
			const response = await fetch("/api/summarize", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ transcription: transcript, fileId: file_id, summaryInstructions: summaryInstructions }),
			});

			const result = await response.json();
			setSummary(result.body.summary);
			setStatus({ ...status, summarized: "complete", chat_ready: "complete" });

			await setMessages([
				{
					role: "system",
					content:
						"You are a highly skilled AI trained in language comprehension and summarization. I would like you to read the following text and summarize it into a concise abstract paragraph. Then, we can discuss your sumamry together Aim to retain the most important points, providing a coherent and readable summary that could help a person understand the main points of the discussion without needing to read the entire text. Please avoid unnecessary details or tangential points. Always format your summary in Markdown.",
				},
				{
					role: "user",
					content: "Here is the transcript: " + transcript,
				},
				{
					role: "assistant",
					content: result.body.summary,
				},
			]);

			append({
				role: "user",
				content:
					"Thank you. Now, I'm going to hand you off to my client who requested this chat session. Please say hello and let them know you're ready to discuss the transcript with them.",
			});
		} catch (error) {
		} finally {
		}
	};

	const formatTranscript = async () => {
		console.log("formatting transcript");
		setStatus({ ...status, transcript_formatted: "in_progress" });
		const response = await fetch("/api/format-transcript", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ transcription: transcript, fileId: file_id }),
		});

		const result = await response.json();
		setFormattedTranscript(result.body.formattedTranscript);
		setStatus({ ...status, transcript_formatted: "complete" });
		console.log(result);
	};

	// Chat Functions
	const { messages, input, isLoading, handleInputChange, handleSubmit, stop, setMessages, append } = useChat({
		onFinish: async (message) => {
			setCreatingChat(false);
		},
		sendExtraMessageFields: false,
		body: {
			fileId: file_id,
		},
	});

	// Utility Functions

	const copyToClipboard = (content) => {
		navigator.clipboard.writeText(content);
	};

	return (
		<>
			{user && file && user.id === file.user_id && (
				<Callout.Root color="indigo" size={"1"} mb={"3"}>
					<Callout.Icon>
						<IconEye />
					</Callout.Icon>
					<Callout.Text>
						<Flex gap={"1"}>
							{user.is_anonymous ? (
								<Text>
									This file is public. <u>Confirm your account to save privately.</u>
								</Text>
							) : (
								<Text>
									This file is public. <u>Make it private</u>
								</Text>
							)}
						</Flex>
					</Callout.Text>
				</Callout.Root>
			)}

			<Flex width={"100%"} gap={"3"} overflow={"scroll"}>
				<ScrollArea style={{ width: "100%" }}>
					<Flex direction={"column"} gap={"3"} pr={"3"} pb={"9"} width={"100%"}>
						<Card variant={"classic"}>{params.file_id}</Card>

						<Card variant="classic" style={{ position: "relative" }}>
							<Flex align={"center"} gap={"3"}>
								<Avatar fallback={<IconWaveSine size={"2rem"} />} size={"8"} radius={"medium"} />

								<Flex direction={"column"} gap={"1"} flexGrow={"1"} align={"start"}>
									<Text size={"4"}>Name</Text>

									<Skeleton loading={!filePublicUrl}>
										<audio id="audioPlayer" src={filePublicUrl} controls>
											Your browser does not support the audio element.
										</audio>
									</Skeleton>
								</Flex>
							</Flex>
						</Card>

						<Card variant={"classic"}>
							<Flex direction={"column"} gap={"2"}>
								<Text size={"5"} weight={"bold"}>
									Transcript
								</Text>

								{status.transcribed === "not_started" && (
									<Flex className="update-card" direction={"column"} align={"center"} gap={"2"} p={"4"}>
										<Text weight={"medium"}>Convert Audio to Text</Text>
										<Button onClick={transcribeAudio}>
											<IconTransform size={"1rem"} />
											Transcribe
										</Button>
									</Flex>
								)}

								{status.transcribed === "in_progress" && (
									<Flex className="update-card" direction={"column"} align={"center"} gap={"2"} p={"4"}>
										<Text weight={"medium"}>Convert Audio to Text</Text>

										<Button disabled>
											<Spinner loading>
												<IconTransform size={"1rem"} />
											</Spinner>
											Transcribing...
										</Button>
									</Flex>
								)}

								{status.transcribed === "complete" && (
									<Tabs.Root defaultValue="raw">
										<Tabs.List>
											<Tabs.Trigger value="raw">Raw</Tabs.Trigger>
											<Tabs.Trigger value="formatted">
												<Flex gap={"1"} align={"center"}>
													Formatted <Spinner size={"1"} loading={status.transcript_formatted === "in_progress"} />
												</Flex>
											</Tabs.Trigger>
										</Tabs.List>

										<Box pt="3">
											<Tabs.Content value="raw">
												<Flex direction={"column"} gap={"2"} position={"relative"}>
													<Flex gap={"2"}>
														<Button variant="soft" onClick={() => copyToClipboard(transcript)}>
															<IconCopy size={"1rem"} />
															Copy to Clipboard
														</Button>
													</Flex>
													{status.transcribed === "complete" && (
														<Text size={"4"} style={{ maxHeight: transcriptRolledUp ? "400px" : "none" }}>
															{transcript}
														</Text>
													)}

													<Flex position={"absolute"} bottom={"2"} left={"0"} right={"0"} align={"center"} direction={"column"}>
														<Button onClick={() => setTranscriptRolledUp(!transcriptRolledUp)} variant="solid">
															{transcriptRolledUp ? <IconArrowDown size={"1rem"} /> : <IconArrowUp size={"1rem"} />}
															{transcriptRolledUp ? "Show Full Transcript" : "Hide Transcript"}
														</Button>
													</Flex>
												</Flex>
											</Tabs.Content>

											<Tabs.Content value="formatted">
												<Flex direction={"column"} gap={"2"}>
													{status.transcript_formatted === "not_started" && (
														<Flex className="update-card" direction={"column"} align={"center"} gap={"2"} p={"4"}>
															<Text weight={"medium"}>Format Transcript</Text>
															<Text weight={"medium"} align={"center"} size={"2"}>
																Turn the raw transcript into a more readable, shareable format
															</Text>
															<Button onClick={formatTranscript} disabled={!transcript}>
																<IconSortDescending size={"1rem"} />
																Format
															</Button>
														</Flex>
													)}

													{status.transcript_formatted === "in_progress" && (
														<Flex className="update-card" direction={"column"} align={"center"} gap={"2"} p={"4"}>
															<Text weight={"medium"}>Formatting transcript</Text>

															<Button disabled>
																<Spinner loading>
																	<IconSortDescending size={"1rem"} />
																</Spinner>
																Formatting
															</Button>
														</Flex>
													)}

													<Text size="2">
														<ReactMarkdown>{formattedTranscript}</ReactMarkdown>
													</Text>
												</Flex>
											</Tabs.Content>
										</Box>
									</Tabs.Root>
								)}
							</Flex>
						</Card>

						<Card variant={"classic"}>
							<Flex direction={"column"} gap={"2"}>
								<Text size={"5"} weight={"bold"}>
									Summary
								</Text>

								{status.summarized === "not_started" && (
									<Flex className="update-card" direction={"column"} align={"center"} gap={"2"} p={"4"}>
										<Text weight={"medium"}>Summarize</Text>
										<Text weight={"medium"} align={"center"} size={"2"}>
											Extract a concise summary of the main points of the conversation
										</Text>

										<TextArea
											style={{ width: "100%", height: "100px" }}
											placeholder="Enter any specific instructions for your summary (optional)..."
											value={summaryInstructions}
											onChange={(e) => setSummaryInstructions(e.target.value)}
										/>

										<Tooltip content={transcript ? "Summarize Transcript" : "Create a Transcipt first"}>
											<Button onClick={summarizeTranscript} disabled={!transcript}>
												<IconSparkles size={"1rem"} />
												Summarize
											</Button>
										</Tooltip>
									</Flex>
								)}

								{status.summarized === "in_progress" && (
									<Flex className="update-card" direction={"column"} align={"center"} gap={"2"} p={"4"}>
										<Text weight={"medium"}>Summarize</Text>
										<Text weight={"medium"} align={"center"} size={"2"}>
											Extract a concise summary of the main points of the conversation
										</Text>
										<Button disabled={true}>
											<Spinner loading>
												<IconSparkles size={"1rem"} />
											</Spinner>
											Summarize
										</Button>
									</Flex>
								)}

								{status.summarized === "complete" && (
									<Text size={"4"}>
										<ReactMarkdown>{summary}</ReactMarkdown>
									</Text>
								)}
							</Flex>
						</Card>
					</Flex>
				</ScrollArea>

				<ScrollArea style={{ maxWidth: "440px", minWidth: "320px", width: "100%" }}>
					<Flex direction={"column"} gap={"3"}>
						{status.uploaded != "complete" ||
						status.transcribed != "complete" ||
						status.summarized != "complete" ||
						status.chat_ready != "complete" ? (
							<Flex direction={"column"} gap={"3"} align={"center"} py={"9"}>
								{status.uploaded === "complete" && (
									<Flex gap={"1"} align={"center"}>
										<IconCircleCheck color="var(--grass-9)" />
										Audio Uploaded
									</Flex>
								)}

								<>
									{status.transcribed === "not_started" && (
										<Flex gap={"1"} align={"center"}>
											<IconClockPause color="var(--gray-9)" />
											Awaiting Transcription
										</Flex>
									)}

									{status.transcribed === "in_progress" && (
										<Flex gap={"1"} align={"center"}>
											<Spinner size={"3"} />
											Transcribing...
										</Flex>
									)}

									{status.transcribed === "complete" && (
										<Flex gap={"1"} align={"center"}>
											<IconCircleCheck color="var(--grass-9)" />
											Transcribed
										</Flex>
									)}
								</>

								<>
									{status.summarized === "not_started" && (
										<Flex gap={"1"} align={"center"}>
											<IconClockPause color="var(--gray-9)" />
											Awaiting Summary
										</Flex>
									)}

									{status.summarized === "in_progress" && (
										<Flex gap={"1"} align={"center"}>
											<Spinner size={"3"} />
											Summarizing...
										</Flex>
									)}

									{status.summarized === "complete" && (
										<Flex gap={"1"} align={"center"}>
											<IconCircleCheck color="var(--grass-9)" />
											Summary Complete
										</Flex>
									)}
								</>

								<>
									{status.chat_ready === "not_started" && (
										<Flex gap={"1"} align={"center"}>
											<IconClockPause color="var(--gray-9)" />
											Waiting for Chat
										</Flex>
									)}

									{status.chat_ready === "in_progress" && (
										<Flex gap={"1"} align={"center"}>
											<Spinner size={"3"} />
											Creating Chat...
										</Flex>
									)}

									{status.chat_ready === "complete" && (
										<Flex gap={"1"} align={"center"}>
											<IconCircleCheck color="var(--grass-9)" />
											Chat Ready
										</Flex>
									)}
								</>
							</Flex>
						) : (
							<Card variant={"classic"}>
								<Flex direction={"column"} gap={"2"}>
									<Text size={"5"} weight={"bold"}>
										Chat
									</Text>
									<Flex direction={"column"} gap={"2"}>
										{messages.map((m, index) => {
											if (index < 4) {
												return;
											}

											if (m.role === "user") {
												return (
													<Flex direction={"column"} gap={"1"} className="user-message" key={m.id}>
														<Text>{m.content}</Text>
														<Flex justify={"end"} gap={"1"}>
															<IconButton size={"2"} variant="ghost" onClick={() => copyToClipboard(m.content)}>
																<IconCopy size={"1rem"} />
															</IconButton>
														</Flex>
													</Flex>
												);
											}

											if (m.role === "assistant") {
												return (
													<Flex direction={"column"} gap={"1"} className="assistant-message" key={m.id}>
														<Text>
															<Markdown>{m.content}</Markdown>
														</Text>

														<Flex justify={"start"} gap={"1"} mb={"3"}>
															<IconButton size={"2"} variant="ghost" onClick={() => copyToClipboard(m.content)} color="gray">
																<IconCopy size={"1rem"} />
															</IconButton>
														</Flex>
													</Flex>
												);
											}
										})}

										<form onSubmit={handleSubmit}>
											<Flex gap={"2"} align={"center"}>
												<TextField.Root
													size={"3"}
													value={input}
													placeholder="Say something..."
													onChange={handleInputChange}
													style={{ flexGrow: "1" }}
												/>

												<IconButton size={"2"}>
													<IconSend size={"1rem"} />
												</IconButton>
											</Flex>
										</form>
									</Flex>
								</Flex>
							</Card>
						)}
					</Flex>
				</ScrollArea>
			</Flex>
		</>
	);
}

"use client";

import { useEffect, useState } from "react";
import { Button, Flex, TextField, Card, Avatar, Text, Skeleton, Box, Kbd, Spinner } from "@radix-ui/themes";
import { IconFolder, IconUpload, IconWaveSine, IconX } from "@tabler/icons-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";

export default function HomeUpload() {
	const [file, setFile] = useState(null);
	const [audioMetadata, setAudioMetadata] = useState(null);
	const [isDragging, setIsDragging] = useState(false);

	const [isUploading, setIsUploading] = useState(false);

	const [user, setUser] = useState(null);

	const supabase = createClientComponentClient();
	const router = useRouter();

	useEffect(() => {
		const fetchUser = async () => {
			const {
				data: { user },
				error,
			} = await supabase.auth.getUser();

			if (error) {
				console.error("Error fetching user:", error);
			} else {
				setUser(user);
			}
		};

		fetchUser();
	}, []);

	const handleFileChange = (event) => {
		const selectedFile = event.target.files[0];
		setFile(selectedFile);
		extractAudioMetadata(selectedFile);
	};

	const handleButtonClick = () => {
		document.getElementById("file-input").click();
	};

	const handleDrop = (event) => {
		event.preventDefault();
		const droppedFile = event.dataTransfer.files[0];
		setFile(droppedFile);
		extractAudioMetadata(droppedFile);
		setIsDragging(false);
	};

	const handleDragOver = (event) => {
		event.preventDefault();
		setIsDragging(true);
	};

	const handleDragEnter = () => {
		setIsDragging(true);
	};

	const handleDragLeave = () => {
		setIsDragging(false);
	};

	const handleClear = () => {
		setFile(null);
		setAudioMetadata(null);
	};

	const extractAudioMetadata = (file) => {
		const audio = new Audio(URL.createObjectURL(file));
		audio.addEventListener("loadedmetadata", () => {
			if (audio.duration) {
				setAudioMetadata({
					duration: audio.duration,
				});
			} else {
				console.error("Unable to extract metadata. Unsupported file type or corrupted file.");
			}
		});
		audio.addEventListener("error", (e) => {
			console.error("Error loading audio file:", e);
		});
	};

	const handleUpload = async () => {
		if (file) {
			setIsUploading(true);

			const uuid = uuidv4();
			const fileExtension = file.name.split(".").pop();
			const fileName = `${uuid}.${fileExtension}`;

			try {
				const { data, error } = await supabase.storage.from("uploads").upload(`public/${fileName}`, file);

				let user_id;

				if (!user) {
					console.log("no user, creating one");
					const { data: anon_user, error: anon_user_error } = await supabase.auth.signInAnonymously();

					const { data: profile, error: profile_error } = await supabase
						.from("profiles")
						.insert([
							{
								is_anon: true,
								user_id: anon_user.user.id,
								balance: 100,
							},
						])
						.select()
						.maybeSingle();

					setUser(anon_user.user);
					user_id = anon_user.user.id;

					console.log("user created:", user_id);
				} else {
					user_id = user.id;
				}

				const file_payload = {
					file_id: data.id,
					file_path: data.path,
					user_id: user_id,
					is_public: true,
				};

				console.log("uploading file");

				const { data: file_record, error: file_record_error } = await supabase
					.from("files")
					.insert([file_payload])
					.select()
					.maybeSingle();

				console.log(file_record);
				console.log(file_record_error);

				router.push(`/file/${file_record.id}`);
			} catch (error) {
				console.error("Error uploading file:", error);
			} finally {
				setIsUploading(false);
			}
		}
	};

	return (
		<Flex width={"100%"} maxWidth={"500px"} direction="column" gap="2">
			<input
				id="file-input"
				type="file"
				accept=".mp3,.mp4,.m4a,.wav,.webm,.mpeg,.mpga"
				style={{ display: "none" }}
				onChange={handleFileChange}
			/>

			{!file && (
				<>
					<Flex
						className={`${isDragging ? "upload-dropper hovered" : "upload-dropper"}`}
						align={"center"}
						direction={"column"}
						justify={"center"}
						gap={"2"}
						height={"calc(var(--space-9)*2)"}
						p={"2"}
						onDrop={handleDrop}
						onDragOver={handleDragOver}
						onDragEnter={handleDragEnter}
						onDragLeave={handleDragLeave}
						onClick={handleButtonClick}
					>
						{isDragging ? (
							<Text color={"orange"}>Drop your file!</Text>
						) : (
							<>
								<Button size={"3"}>
									Select File <IconFolder size={"1rem"} />
								</Button>

								<Text color="gray">Drag and drop a file (max. 25mb)</Text>
							</>
						)}
					</Flex>

					<Flex gap={"1"} pl={"4"}>
						<Text size={"1"} color="gray">
							Supports:
						</Text>

						<Kbd size={"1"}>mp3</Kbd>
						<Kbd size={"1"}>mp4</Kbd>
						<Kbd size={"1"}>m4a</Kbd>
						<Kbd size={"1"}>mpeg</Kbd>
						<Kbd size={"1"}>mpga</Kbd>
						<Kbd size={"1"}>wav</Kbd>
						<Kbd size={"1"}>webm</Kbd>
					</Flex>
				</>
			)}
			{file && (
				<Card variant="classic" style={{ position: "relative" }}>
					<Box position={"absolute"} top={"3"} right={"3"}>
						<Button variant="soft" size={"1"} onClick={handleClear} disabled={isUploading}>
							<IconX size={"0.8rem"} />
							Clear
						</Button>
					</Box>

					<Flex align={"center"} gap={"3"}>
						<Avatar src={file.preview} fallback={<IconWaveSine />} size={"6"} radius={"medium"} />

						<Flex direction={"column"} gap={"1"} flexGrow={"1"}>
							<Text size={"4"}>{file.name}</Text>

							<Flex justify={"between"} gap={"3"} align={"center"}>
								<Flex gap={"5"}>
									<Flex direction={"column"}>
										<Text size={"1"} color="gray">
											Size
										</Text>

										<Skeleton loading={!file.size}>
											<Text size={"3"}>{(file.size / 1024 / 1024).toFixed(2)} MB</Text>
										</Skeleton>
									</Flex>

									<Flex direction={"column"}>
										<Text size={"1"} color="gray">
											Duration
										</Text>

										{audioMetadata && (
											<Skeleton loading={!audioMetadata || !audioMetadata.duration}>
												<Text size={"3"}>
													{Math.floor(audioMetadata.duration / 60)}m {Math.floor(audioMetadata.duration % 60)}s
												</Text>
											</Skeleton>
										)}
									</Flex>
								</Flex>

								<Button onClick={handleUpload} disabled={!file} mt="2">
									Upload File
									<Spinner loading={isUploading}>
										<IconUpload size={"1rem"} />
									</Spinner>
								</Button>
							</Flex>
						</Flex>
					</Flex>
				</Card>
			)}
		</Flex>
	);
}

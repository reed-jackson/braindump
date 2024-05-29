"use client";

import { centsToDollars } from "@/utils/CentsToDollars";
import {
	Badge,
	Button,
	Card,
	Dialog,
	Flex,
	IconButton,
	Popover,
	Progress,
	ScrollArea,
	Separator,
	Text,
	TextField,
} from "@radix-ui/themes";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
	IconArrowRight,
	IconBrain,
	IconBubble,
	IconBusinessplan,
	IconCircleCheck,
	IconDownload,
	IconFile,
	IconHandFinger,
	IconLifebuoy,
	IconRefresh,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import SignupDialog from "./SignupDialog";
import { useSearchParams } from "next/navigation";

export default function AppNav() {
	const [user, setUser] = useState(null);
	const [userProfile, setUserProfile] = useState(null);
	const [userConfirm, setUserConfirm] = useState(null);
	const [userDialog, setUserDialog] = useState(false);
	const [email, setEmail] = useState(null);
	const [password, setPassword] = useState(null);
	const [userConfirmSuccess, setUserConfirmSuccess] = useState(false);
	const [userConfirmError, setUserConfirmError] = useState(false);

	const [userFiles, setUserFiles] = useState([]);

	const supabase = createClientComponentClient();
	const searchParams = useSearchParams();

	useEffect(() => {
		const signup = searchParams.get("signup");
		const email = searchParams.get("email");
		const next = searchParams.get("next");

		if (signup == "true") {
			setUserConfirm(true);
			setUserDialog(true);
		}

		if (email) {
			setEmail(email);
		}
	}, [searchParams]);

	const updatePassword = async () => {
		try {
			const { data, error } = await supabase.auth.updateUser({ password: password });
			if (data) {
				const { data: profile, error: profile_error } = await supabase
					.from("profiles")
					.update({ is_anonymous: false })
					.eq("user_id", user.id)
					.maybeSingle();

				setUserConfirmSuccess(true);
				// Clear all search params
				const clearSearchParams = () => {
					const url = new URL(window.location);
					url.search = "";
					window.history.replaceState({}, "", url);
				};

				clearSearchParams();
			}
		} catch (error) {
			console.log(error);
			setUserConfirmError(error);
		}
	};

	useEffect(() => {
		const fetchUser = async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();

			setUser(user);

			if (user) {
				const { data: user_profile, error: user_profile_error } = await supabase
					.from("profiles")
					.select("*")
					.eq("user_id", user.id)
					.maybeSingle();

				setUserProfile(user_profile);
			}
		};

		fetchUser();
	}, []);

	const refreshBalance = async () => {
		const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
		setUserProfile(data);
	};

	const fetchFiles = async () => {
		const { data, error } = await supabase.from("files").select("*").eq("user_id", user.id);

		console.log(data);

		setUserFiles(data);
	};

	return (
		<Flex direction="column" justify={"between"} align={"stretch"}>
			<Flex direction={"column"} gap={"4"}>
				<Flex gap={"1"} align={"center"}>
					<IconBrain color="orange" />
					<Text weight={"medium"} size={"5"}>
						BrainDump
					</Text>

					<IconDownload />
				</Flex>

				<Popover.Root onOpenChange={() => fetchFiles()}>
					<Popover.Trigger>
						<Button variant="ghost">
							<Flex mr={"auto"} gap={"2"} align={"center"}>
								<IconFile size={"1rem"} />
								<Text size={"3"}>My Files</Text>
							</Flex>
						</Button>
					</Popover.Trigger>

					<Popover.Content side="right" minWidth={"320px"} maxHeight={"500px"}>
						<ScrollArea>
							<Flex direction={"column"} gap={"1"}>
								{userFiles &&
									userFiles.map((file) => {
										return (
											<Card key={file.id} asChild>
												<a href={`/file/${file.id}`}>{file.id}</a>
											</Card>
										);
									})}
							</Flex>
						</ScrollArea>
					</Popover.Content>
				</Popover.Root>

				<Button variant="ghost">
					<Flex mr={"auto"} gap={"2"} align={"center"}>
						<IconBusinessplan size={"1rem"} />
						<Text size={"3"}>Add Credits</Text>
						<Badge color="green">Bonus</Badge>
					</Flex>
				</Button>

				<Button variant="ghost">
					<Flex mr={"auto"} gap={"2"} align={"center"}>
						<IconLifebuoy size={"1rem"} />
						<Text size={"3"}>Help</Text>
					</Flex>
				</Button>

				<Button variant="ghost">
					<Flex mr={"auto"} gap={"2"} align={"center"}>
						<IconBubble size={"1rem"} />
						<Text size={"3"}>Give Feedback</Text>
					</Flex>
				</Button>
			</Flex>

			{user && (
				<Flex direction={"column"} width={"100%"}>
					{user.is_anonymous && (
						<Flex direction={"column"} gap={"1"}>
							<Text size={"5"} weight={"bold"} color="orange">
								Get $5
							</Text>
							<Text>In free credits when you create an account</Text>

							<SignupDialog trigger={<Button>Sign Up</Button>} />

							<Separator size={"4"} my={"4"} />
						</Flex>
					)}

					{userConfirm && !userConfirmSuccess && (
						<Dialog.Root open={userDialog} onOpenChange={setUserDialog}>
							<Dialog.Trigger>
								<Button>Confirm Your Account</Button>
							</Dialog.Trigger>

							<Dialog.Content maxWidth={"400px"}>
								<Dialog.Title align={"center"}>
									<Flex gap={"1"} align={"center"}>
										<IconBrain color="orange" />
										<Text weight={"medium"} size={"5"}>
											BrainDump
										</Text>

										<IconDownload />
									</Flex>
								</Dialog.Title>
								<Dialog.Description color="gray">Complete account setup by entering your password</Dialog.Description>

								<Flex direction={"column"} gap={"3"} my={"4"}>
									<TextField.Root size={"3"} placeholder="Enter email" type="email" value={email} disabled />

									<TextField.Root
										size={"3"}
										placeholder="Enter password"
										type="password"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
									/>

									<Button onClick={updatePassword}>
										Finish <IconCircleCheck size={"1rem"} />
									</Button>

									{userConfirmError && <Text color="red">{userConfirmError.message}</Text>}
								</Flex>
							</Dialog.Content>
						</Dialog.Root>
					)}

					<Text size={"2"} color="gray">
						Balance
					</Text>
					<Flex gap={"1"} align={"center"} onClick={() => refreshBalance()}>
						<Text size={"4"}>{centsToDollars(userProfile?.balance)}</Text>
						<IconButton variant="ghost" size={"1"}>
							<IconRefresh size={"1rem"} />
						</IconButton>
					</Flex>
				</Flex>
			)}
		</Flex>
	);
}

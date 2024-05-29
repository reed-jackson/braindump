"use client";

import { useState } from "react";
import { Box, Dialog, Flex, Grid, Text, TextField, Button, Callout } from "@radix-ui/themes";
import {
	IconArrowRight,
	IconBrain,
	IconCircleCheck,
	IconDeviceFloppy,
	IconDownload,
	IconEyeCancel,
	IconSparkles,
} from "@tabler/icons-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function SignupDialog({ trigger }) {
	const [dialogOpen, setDialogOpen] = useState(false);

	const [email, setEmail] = useState("");
	const [isValidEmail, setIsValidEmail] = useState(true);

	const [emailSuccess, setEmailSuccess] = useState(true);

	const supabase = createClientComponentClient();

	const handleEmailChange = (e) => {
		const value = e.target.value;
		setEmail(value);
		setIsValidEmail(validateEmail(value));
	};

	const validateEmail = (email) => {
		const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return re.test(String(email).toLowerCase());
	};

	const updateAnonUser = async () => {
		const currentUrl = window.location.href;

		try {
			const { data, error } = await supabase.auth.updateUser(
				{ email: email },
				{ emailRedirectTo: currentUrl + "?signup=true&email=" + email + "&next=password" }
			);

			setEmailSuccess(true);

			console.log(data);
		} catch (error) {
			console.log(error);
		}
	};

	return (
		<Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
			<Dialog.Trigger>{trigger}</Dialog.Trigger>

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
				<Dialog.Description color="gray">Create a free account, get access to more features. </Dialog.Description>

				<Flex direction={"column"} gap={"3"} my={"4"}>
					<Flex gap={"2"}>
						<IconSparkles />
						More summary options
					</Flex>
					<Flex gap={"2"}>
						<IconDeviceFloppy />
						Save multiple files and summaries
					</Flex>
					<Flex gap={"2"}>
						<IconEyeCancel />
						Set your files to private
					</Flex>

					{emailSuccess ? (
						<>
							<Callout.Root color="green">
								<Callout.Icon>
									<IconCircleCheck />
								</Callout.Icon>
								<Callout.Text>
									Email sent to <Text>{email}</Text>
								</Callout.Text>
							</Callout.Root>
						</>
					) : (
						<>
							<TextField.Root size={"3"} placeholder="Enter email" type="email" value={email} onChange={handleEmailChange} />

							<Button disabled={!isValidEmail} onClick={updateAnonUser}>
								Next <IconArrowRight size={"1rem"} />
							</Button>
						</>
					)}
				</Flex>
			</Dialog.Content>
		</Dialog.Root>
	);
}

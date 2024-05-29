import HomeUpload from "@/components/HomeUpload";
import { Card, Container, Flex, Grid, Heading, Table, Text } from "@radix-ui/themes";
import { IconBrain, IconDownload } from "@tabler/icons-react";

export default function Home() {
	return (
		<main>
			<Container size={"3"}>
				<Flex align={"center"} justify={"center"} direction={"column"} gap={"4"} pt={"9"} mb={"9"}>
					<Flex gap={"1"} align={"center"} mb={"9"}>
						<IconBrain color="orange" />
						<Text weight={"medium"} size={"5"}>
							BrainDump
						</Text>

						<IconDownload />
					</Flex>

					<Heading size={"9"} align={"center"}>
						Record. Transcribe. Summarize.
					</Heading>

					<Text color="gray" size={"5"} align={"center"}>
						Turn recordings into text, and work with an AI to summarize your thoughts. No subscription required.
					</Text>

					<HomeUpload />
				</Flex>

				<Grid columns={{ initial: "1", xs: "3" }} py={"4"} gap={"4"} mb={"9"}>
					<Card>
						<Flex direction={"column"} gap={"1"}>
							<Text size={"5"} weight={"medium"}>
								Trasncribe Audio files
							</Text>

							<Text size={"3"}>Dictate your thoughts or upload a meeting recording, and get a formatted text transcript.</Text>
						</Flex>
					</Card>

					<Card>
						<Flex direction={"column"} gap={"1"}>
							<Text size={"5"} weight={"medium"}>
								Summarize Transcriptions
							</Text>

							<Text size={"3"}>Turn messy transcriptions into actionable summaries.</Text>
						</Flex>
					</Card>

					<Card>
						<Flex direction={"column"} gap={"1"}>
							<Text size={"5"} weight={"medium"}>
								Chat with your transcript
							</Text>

							<Text size={"3"}>Go a step further with contextual chat to clarify any areas of interest.</Text>
						</Flex>
					</Card>
				</Grid>

				<Flex direction={"column"} width={"100%"} align={"center"} gap={"4"}>
					<Heading size={"7"} as="h2">
						Usage-Based Pricing
					</Heading>

					<Text size={"4"} color="gray">
						Only pay for what you use, no subscription commitment
					</Text>

					<Table.Root variant={"surface"} style={{ width: "100%", maxWidth: "500px" }} size={"3"}>
						<Table.Header>
							<Table.Row>
								<Table.ColumnHeaderCell>Action</Table.ColumnHeaderCell>
								<Table.ColumnHeaderCell align="right">Cost</Table.ColumnHeaderCell>
							</Table.Row>
						</Table.Header>

						<Table.Body>
							<Table.Row>
								<Table.RowHeaderCell>Transcriptions</Table.RowHeaderCell>
								<Table.Cell align="right">$0.015 / min</Table.Cell>
							</Table.Row>

							<Table.Row>
								<Table.RowHeaderCell>Summarization</Table.RowHeaderCell>
								<Table.Cell align="right">$0.005 / 1000 chars</Table.Cell>
							</Table.Row>

							<Table.Row>
								<Table.RowHeaderCell>Chat</Table.RowHeaderCell>
								<Table.Cell align="right">$0.015 / 1000 tokens</Table.Cell>
							</Table.Row>
						</Table.Body>
					</Table.Root>
				</Flex>
			</Container>
		</main>
	);
}

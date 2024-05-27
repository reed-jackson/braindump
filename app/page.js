import { Container, Flex, Heading } from "@radix-ui/themes";
import Image from "next/image";

export default function Home() {
	return (
		<main>
			<Container>
				<Flex align={"center"} justify={"center"} direction={"column"} gap={"3"} style={{ height: "100vh" }}>
					<Heading size={"9"}>Brain dump</Heading>
				</Flex>
			</Container>
		</main>
	);
}

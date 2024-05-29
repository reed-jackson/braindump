import AppNav from "@/components/AppNav";
import { Flex } from "@radix-ui/themes";

export default function InterfaceLayout({ children }) {
	return (
		<Flex gap={"3"} position={"fixed"} top={"0"} left={"0"} right={"0"} bottom={"0"} p={"3"}>
			<Flex style={{ width: "100%", maxWidth: "220px" }}>
				<AppNav />
			</Flex>
			<Flex style={{ width: "100%" }} direction={"column"} flexGrow={"1"}>
				{children}
			</Flex>
		</Flex>
	);
}

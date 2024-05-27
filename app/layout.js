import "./globals.css";
import "@radix-ui/themes/styles.css";
import "./theme-config.css";

import { Inter } from "next/font/google";

import { Theme, ThemePanel } from "@radix-ui/themes";

const inter = Inter({ subsets: ["latin"] });

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Braindump",
	description: "Braindump",
};

export default function RootLayout({ children }) {
	return (
		<html lang="en">
			<body>
				<Theme accentColor="orange" grayColor="sand" appearance="dark" panelBackground="transluscent">
					{children}
				</Theme>
			</body>
		</html>
	);
}

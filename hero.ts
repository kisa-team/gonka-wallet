import { heroui } from "@heroui/react";

export default heroui({
    themes: {
        light: {
            colors: {
                background: "#ffffff",
                foreground: "#14151A",
                primary: {
                    DEFAULT: "#01a1ff",
                    foreground: "#000000",
                },
                content1: {
                    DEFAULT: "#F8FAFB",
                },
                content2: {
                    DEFAULT: "#F1F5F7",
                },
            },
        },
        dark: {
            colors: {
                background: "#14151a",
                foreground: "#fefefe",
                primary: {
                    DEFAULT: "#01a1ff",
                    foreground: "#000000",
                },
                secondary: {
                    DEFAULT: "#5eff45",
                    foreground: "#000000",
                },
                danger: {
                    DEFAULT: "#ff4545",
                    foreground: "#000000",
                },
            },
        },
    },
});

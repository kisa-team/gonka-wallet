import { Button, Skeleton } from "@heroui/react";
import type { FC } from "react";
import { FaRegClock, FaRegCompass } from "react-icons/fa6";
import { LogoSvg } from "@/components/svg/LogoSvg";
import { useWebApp } from "@/hooks/wallet/apps/useWebApp";
import { useWalletStore, WalletScreen } from "@/hooks/wallet/useWalletStore";

export const Menu: FC = () => {
    const { data: webApp } = useWebApp("miner");
    const seedPhrase = useWalletStore((state) => state.seedPhrase);
    const screen = useWalletStore((state) => state.screen);
    if (!seedPhrase) {
        return null;
    }

    const isMainScreen = screen === WalletScreen.MAIN;
    const isHistoryScreen = screen === WalletScreen.HISTORY;
    const isAppsScreen = screen === WalletScreen.APPS;

    return (
        <div className="grid grid-cols-4 bg-zinc-900 border-t border-x border-zinc-800 rounded-t-2xl z-[40] p-2">
            <Button
                className="h-full"
                variant="light"
                onPress={() => useWalletStore.setState({ screen: WalletScreen.MAIN })}
            >
                <div
                    className={`flex flex-col items-center justify-center gap-1 ${isMainScreen ? "text-zinc-100" : "text-zinc-400"}`}
                >
                    <LogoSvg className="w-6 h-6" />
                    <div className="font-medium">Wallet</div>
                </div>
            </Button>
            <Button
                className="h-full"
                variant="light"
                onPress={() => useWalletStore.setState({ screen: WalletScreen.HISTORY })}
            >
                <div
                    className={`flex flex-col items-center justify-center gap-1 ${isHistoryScreen ? "text-zinc-100" : "text-zinc-400"}`}
                >
                    <FaRegClock className="w-6 h-6" />
                    <div className="font-medium">History</div>
                </div>
            </Button>
            <Button
                className="h-full"
                variant="light"
                onPress={() => useWalletStore.setState({ screen: WalletScreen.APPS })}
            >
                <div
                    className={`flex flex-col items-center justify-center gap-1 ${isAppsScreen ? "text-zinc-100" : "text-zinc-400"}`}
                >
                    <FaRegCompass className="w-6 h-6" />
                    <div className="font-medium">Browser</div>
                </div>
            </Button>
            {!webApp && (
                <div className="flex flex-col items-center justify-center gap-1">
                    <Skeleton className="mx-auto rounded-full aspect-square w-6" />
                    <Skeleton className="mx-auto rounded-md w-20 h-5" />
                </div>
            )}
            {webApp && (
                <Button
                    className="h-full"
                    variant="light"
                    onPress={() => useWalletStore.getState().setSelectedAppId(webApp.id)}
                >
                    <div className="flex flex-col items-center justify-center gap-1 text-zinc-400">
                        {/* <AppIcon webApp={webApp} className="!w-6 !h-6 !text-sm !rounded-full" /> */}
                        <div className="w-6 h-6">
                            <svg
                                width="100%"
                                height="100%"
                                viewBox="0 0 212 213"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <title>Miner</title>
                                <path
                                    d="M198.978 106C198.978 54.6497 157.35 13.0221 106 13.0221C54.6497 13.0221 13.0221 54.6497 13.0221 106C13.0221 157.35 54.6497 198.978 106 198.978V212C47.4578 212 0 164.542 0 106C0 47.4578 47.4578 0 106 0C164.542 0 212 47.4578 212 106C212 164.542 164.542 212 106 212V198.978C157.35 198.978 198.978 157.35 198.978 106Z"
                                    fill="#95969B"
                                />
                                <path
                                    d="M138.675 50.6886C139.736 50.7007 140.749 51.1333 141.492 51.8913L161.141 71.9217C161.849 72.6477 162.256 73.6155 162.279 74.6298C162.302 75.6441 161.94 76.6294 161.265 77.3868C172.775 94.8652 177.151 114.697 173.254 131.612C173.052 132.485 172.564 133.265 171.866 133.828C171.169 134.391 170.303 134.704 169.407 134.717C168.511 134.73 167.637 134.442 166.924 133.9C166.21 133.357 165.699 132.591 165.473 131.725C162.073 118.728 155.494 105.18 145.938 92.4379L145.348 93.016C144.59 93.7597 143.567 94.1716 142.504 94.1612C141.442 94.1509 140.427 93.7191 139.683 92.9607L136.874 90.1073L115.423 111.15C116.167 111.909 116.579 112.932 116.568 113.995C116.558 115.057 116.126 116.072 115.368 116.816L61.0163 170.136C60.2576 170.88 59.2346 171.292 58.1722 171.281C57.1099 171.271 56.0951 170.839 55.351 170.081L41.319 155.775C40.5754 155.016 40.1634 153.993 40.1738 152.931C40.1842 151.869 40.616 150.854 41.3743 150.11L95.7256 96.7896C96.4844 96.0459 97.5074 95.634 98.5697 95.6443C99.6321 95.6547 100.647 96.0865 101.391 96.8448L122.842 75.8016L120.037 72.9413C119.668 72.5652 119.377 72.1201 119.18 71.6313C118.983 71.1425 118.885 70.6198 118.89 70.0929C118.896 69.5661 119.005 69.0455 119.212 68.5609C119.419 68.0764 119.719 67.6374 120.096 67.2692L120.686 66.691C108.135 56.8967 94.7183 50.0597 81.7895 46.4099C80.9273 46.1664 80.1715 45.641 79.6429 44.9176C79.1143 44.1941 78.8434 43.3144 78.8735 42.419C78.9035 41.5235 79.2328 40.6639 79.8087 39.9776C80.3846 39.2912 81.174 38.8177 82.0506 38.6326C99.0271 35.0622 118.775 39.8142 136.033 51.6525C136.768 51.026 137.709 50.6792 138.675 50.6886Z"
                                    fill="#95969B"
                                />
                            </svg>
                        </div>
                        <div className="font-medium">{webApp.name}</div>
                    </div>
                </Button>
            )}
        </div>
    );
};

import Link from "next/link";
import { LogoBgSvg } from "@/components/svg/LogoBgSvg";

export default function Home() {
    return (
        <div className="flex flex-col items-center justify-center gap-6 h-screen">
            <div className="w-60 h-60 rounded-4xl overflow-hidden">
                <LogoBgSvg />
            </div>
            <div className="text-4xl font-bold">Gonka Wallet</div>
            <Link
                href="/wallet"
                color="primary"
                className="bg-primary py-4 px-6 rounded-2xl text-black"
            >
                Open
            </Link>
        </div>
    );
}

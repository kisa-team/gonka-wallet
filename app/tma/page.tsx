"use client";
import dynamic from "next/dynamic";
import { SPARoot } from "@/components/wallet/SPARoot";

const TMARoot = dynamic(() => import("../../components/tma/TMARoot"), {
    ssr: false,
});

export default function Home() {
    return (
        <TMARoot>
            <SPARoot />
        </TMARoot>
    );
}

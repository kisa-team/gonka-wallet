import type { FC, SVGProps } from "react";

export const LogoBgSvg: FC<SVGProps<SVGSVGElement>> = ({ ...props }) => {
    return (
        <svg
            width="100%"
            height="100%"
            viewBox="0 0 1080 1080"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <title>Gonka Wallet Logo</title>
            <rect width="1080" height="1080" fill="url(#paint0_linear_1_5)" />
            <path
                d="M168 467.822C518.01 410.177 690.266 588.145 726 875"
                stroke="url(#paint1_linear_1_5)"
                strokeWidth="40"
            />
            <path
                d="M177.864 635.927C518.297 567.076 662.388 490.482 781.595 241.948"
                stroke="url(#paint2_linear_1_5)"
                strokeWidth="40"
            />
            <path
                d="M217.338 735.874C533.856 746.856 700.846 698.694 900.25 450.167"
                stroke="url(#paint3_linear_1_5)"
                strokeWidth="40"
            />
            <circle cx="540" cy="540" r="382" stroke="url(#paint4_linear_1_5)" strokeWidth="50" />
            <defs>
                <linearGradient
                    id="paint0_linear_1_5"
                    x1="540"
                    y1="0"
                    x2="540"
                    y2="1080"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#014984" />
                    <stop offset="1" stopColor="#002957" />
                </linearGradient>
                <linearGradient
                    id="paint1_linear_1_5"
                    x1="327.429"
                    y1="477.43"
                    x2="1120.2"
                    y2="1028.36"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#63D3FB" />
                    <stop offset="0.490385" stopColor="#73D7FA" />
                    <stop offset="1" stopColor="#009EFD" />
                </linearGradient>
                <linearGradient
                    id="paint2_linear_1_5"
                    x1="783.812"
                    y1="281.761"
                    x2="-35.63"
                    y2="562.508"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#63D3FB" />
                    <stop offset="0.427885" stopColor="#6BD5FB" />
                    <stop offset="1" stopColor="#009EFD" />
                </linearGradient>
                <linearGradient
                    id="paint3_linear_1_5"
                    x1="900.25"
                    y1="436.875"
                    x2="146.341"
                    y2="475.8"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#01B0FE" />
                    <stop offset="0.315121" stopColor="#7CDBFA" />
                    <stop offset="0.548077" stopColor="#3EBFFB" />
                    <stop offset="1" stopColor="#009EFD" />
                </linearGradient>
                <linearGradient
                    id="paint4_linear_1_5"
                    x1="540"
                    y1="133"
                    x2="540"
                    y2="947"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#02CCFE" />
                    <stop offset="1" stopColor="#0091FE" />
                </linearGradient>
            </defs>
        </svg>
    );
};

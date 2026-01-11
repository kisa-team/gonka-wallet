import "server-only";
import type { NextRequest } from "next/server";
import { fnDecorator } from "pure-function-decorator";
import { apiResponse, getChainApiUrl } from "@/app/api/api-helpers";
import type { ApiFunc } from "@/app/api/api-types";
import { apiRequestWrapper } from "@/decorators/apiRequestWrapper";
import type { VoteCounts, VotesResponse } from "../../types";

export const GET = fnDecorator(
    [apiRequestWrapper],
    async (_request: NextRequest, context: { params: Promise<{ id: string }> }) => {
        const { id } = await context.params;
        const url = `${getChainApiUrl()}/cosmos/gov/v1/proposals/${id}/votes?pagination.limit=10000000&pagination.offset=0&pagination.count_total=true&pagination.reverse=true`;

        const response = await fetch(url, { method: "GET" });
        if (!response.ok) {
            return apiResponse(undefined, "Failed to fetch votes", {
                status: response.status,
            });
        }

        const data: VotesResponse = await response.json();
        const votes = data.votes || [];

        const counts: VoteCounts = {
            yes: 0,
            no: 0,
            abstain: 0,
            no_with_veto: 0,
            total: votes.length,
        };

        for (const vote of votes) {
            if (!vote.options || vote.options.length === 0) continue;

            const primaryOption = vote.options[0].option;
            if (primaryOption === "VOTE_OPTION_YES" || primaryOption === "1") {
                counts.yes++;
            } else if (primaryOption === "VOTE_OPTION_NO" || primaryOption === "3") {
                counts.no++;
            } else if (primaryOption === "VOTE_OPTION_ABSTAIN" || primaryOption === "2") {
                counts.abstain++;
            } else if (primaryOption === "VOTE_OPTION_NO_WITH_VETO" || primaryOption === "4") {
                counts.no_with_veto++;
            }
        }

        return apiResponse(counts);
    }
) as ApiFunc;

import "server-only";
import type { NextRequest } from "next/server";
import { fnDecorator } from "pure-function-decorator";
import { apiResponse, getChainApiUrl } from "@/app/api/api-helpers";
import type { ApiFunc } from "@/app/api/api-types";
import type {
    ChainApiParticipantsStatsResponse,
    ChainApiValidatorsResponse,
    ValidatorsWithStatsResponse,
    ValidatorWithStats,
} from "@/app/api/validators/types";
import { apiRequestWrapper } from "@/decorators/apiRequestWrapper";
import { getJson } from "@/src/utils/fetch-helpers";

export const GET = fnDecorator([apiRequestWrapper], async (_: NextRequest) => {
    const validatorsUrl = `${getChainApiUrl()}/cosmos/staking/v1beta1/validators?pagination.limit=10000&status=&pagination.count_total=true`;
    const { validators } = await getJson<ChainApiValidatorsResponse>(validatorsUrl);

    const participantsStatsUrl = `${getChainApiUrl()}/productscience/inference/inference/participants_stats?pagination.limit=10000`;
    const { participants_stats: participantsStats } =
        await getJson<ChainApiParticipantsStatsResponse>(participantsStatsUrl);

    const validatorsWithStats =
        validators
            ?.map((validator) => {
                return {
                    ...validator,
                    stats: participantsStats?.find(
                        (participant) => participant.operator_address === validator.operator_address
                    ),
                };
            })
            .filter((validator) => validator.stats !== undefined) || [];

    validatorsWithStats.sort(
        (a, b) =>
            Number(b.stats!.rewarded_coins_latest_epoch) -
            Number(a.stats!.rewarded_coins_latest_epoch)
    );

    return apiResponse<ValidatorsWithStatsResponse>({
        validators: validatorsWithStats.splice(0, 20) as any as ValidatorWithStats[],
    });
}) as ApiFunc;

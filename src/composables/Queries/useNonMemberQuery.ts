import { useQuery } from "@tanstack/react-query"
import { getNonGroupMembers } from "../../http/api/groupChat/get-non-groupMembers";

export const useNonMemberQuery = (chatroomdId : string) => {
    const nonMemberListData = useQuery({ 
        queryKey: ['nonMemberList', chatroomdId],
        queryFn: async () => {
            const response = await getNonGroupMembers(chatroomdId);
            return response;
        },
        enabled: !!chatroomdId
    })

    return {
        nonMemberListData: nonMemberListData.data,
        isLoading: nonMemberListData.isLoading,
        isError: nonMemberListData.isError,
        error: nonMemberListData.error
    }
}
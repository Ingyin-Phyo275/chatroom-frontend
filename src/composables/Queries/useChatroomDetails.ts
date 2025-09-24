import { useQuery } from "@tanstack/react-query";
import { getChatroomDetails } from "../../http/api/getChatroomDetails";

export const useChatroomDetails = (id: string) => {
    const chatroomDetailsQuery = useQuery({
        queryKey: ['chatroomDetails', id],
        queryFn: async () => {
            const response = await getChatroomDetails(id);
            return response;
        }
    });
    return  {
        chatroomMembers: chatroomDetailsQuery.data.members,
        messages: chatroomDetailsQuery.data.message,
        isLoading: chatroomDetailsQuery.isLoading,
        isError: chatroomDetailsQuery.isError,
        error: chatroomDetailsQuery.error
    }
}
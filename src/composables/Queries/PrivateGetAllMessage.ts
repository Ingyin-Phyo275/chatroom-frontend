import { useQuery } from "@tanstack/react-query";
import { GetAllMessage } from "../../http/api/privateChat/getAllMessage";

interface GetAllMessageProps {
    receiverId: number;
    page: number;
    pageSize: number;
}

export const usePrivateFetchAllMessage = ({ receiverId, page, pageSize }: GetAllMessageProps) => {
    return useQuery({
        queryKey: ['GetAllMessage', receiverId, page, pageSize], // include params to refetch properly
        queryFn: async () => {
            const response = await GetAllMessage({ receiverId, page, pageSize });
            return response?.data;
        },
        staleTime: 1000 * 60,  // optional: 1 minute cache
    });
};

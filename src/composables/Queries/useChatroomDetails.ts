import { useQuery } from "@tanstack/react-query";
import { getChatroomDetails } from "../../http/api/getChatroomDetails";

// export const useChatroomDetails = (id: string) => {
//     const chatroomDetailsQuery = useQuery({
//         queryKey: ['chatroomDetails', id],
//         queryFn: async () => {
//             const response = await getChatroomDetails(id);
//             return response;
//         }
//     });
//     return  {
//         chatroomMembers: chatroomDetailsQuery?.data?.members,
//         messages: chatroomDetailsQuery?.data?.messages,
//         isLoading: chatroomDetailsQuery.isLoading,
//         isError: chatroomDetailsQuery.isError,
//         error: chatroomDetailsQuery.error
//     }
// }


// useChatroomDetails.ts
export const useChatroomDetails = (id?: string | number) =>
  useQuery({
    queryKey: ['chatroomDetails', String(id)], // force string
    queryFn: async () => {
      const response = await getChatroomDetails(String(id));
      return response;
    },
    enabled: !!id
  });

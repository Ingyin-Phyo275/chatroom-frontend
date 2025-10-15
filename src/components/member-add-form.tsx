import React, { useState } from "react";
import { SearchIcon, X } from "lucide-react";
import type { UserListResponse } from "../dto/response/UserListResponse";
import { Input } from "./ui/input";
import { toast } from "sonner";
import * as Avatar from "@radix-ui/react-avatar";
import { useQueryClient } from "@tanstack/react-query";
import { addMembers } from "../http/api/groupChat/addMember";
import { createChatroom } from "../http/api/groupChat/createChatroom";
import { useNonMemberQuery } from "../composables/Queries/useNonMemberQuery";
import { userListQuery } from "@/composables/Queries/userListQuery";

interface MemberAddFormProps {
  action?: "add" | "create";
  chatroomId?: string;
  onClose?: () => void;
}

export default function MemberAddForm({ action = "create", chatroomId, onClose }: MemberAddFormProps) {
  const [groupName, setGroupName] = useState(""); 
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<UserListResponse[]>([]);
  const queryClient = useQueryClient();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value);

  // retrieve contacts
  const { userListData: contacts = [] } = userListQuery();

  // retrieve non-group members
  const { nonMemberListData: nonGroupMembers = [] } = useNonMemberQuery(chatroomId!);

  // determine source list based on action
  const sourceList = action === "create" ? contacts : nonGroupMembers;

  // filter source list based on search term
  const filteredContacts = sourceList.filter((user: UserListResponse) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleContact = (contact: UserListResponse) => {
    setSelectedContacts(prev =>
      prev.find(c => c.id === contact.id)
        ? prev.filter(c => c.id !== contact.id)
        : [...prev, contact]
    );
  };

  const removeContact = (id: string) => setSelectedContacts(prev => prev.filter(c => c.id !== id));

  const handleSubmit = async () => {
    if (action === "create" && !groupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }
    if (selectedContacts.length === 0) {
      toast.error("Please select at least one member");
      return;
    }
    try {
      if (action === "add") {
        await addMembers({
          chatroomId: Number(chatroomId!),
          userIds: selectedContacts.map(c => c.id),
        });
        toast.success(`Added ${selectedContacts.length} member(s)`);
        await queryClient.invalidateQueries({ queryKey: ["chatroomDetails", String(chatroomId)] });
        await queryClient.invalidateQueries({ queryKey: ["nonMemberList", String(chatroomId)] });
      } else {
        const response = await createChatroom({
          name: groupName,
          memberIds: selectedContacts.map(c => c.id),
        });
        queryClient.invalidateQueries({ queryKey: ["groupChatList"] });
        toast.success(response.message || response.data?.message || "Group created");
      }

      queryClient.invalidateQueries({ queryKey: ["chatroomDetails", chatroomId] });
      queryClient.invalidateQueries({ queryKey: ["userList"] });
      
      // Reset form
      setGroupName("");
      setSelectedContacts([]);
      setSearchTerm("");
      if(onClose) onClose();
    } catch (error) {
      console.error(error);
      toast.error("Operation failed");
    }
  };

  return (
    <div className="flex flex-col h-full w-full space-y-4">
      {/* Group Name Input (only for 'create') */}
      {action === "create" && (
        <div className="w-full">
          <Input
            type="text"
            placeholder="Enter group name..."
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            className="w-full"
          />
        </div>
      )}

      {/* Search Bar */}
      <div className="relative w-full">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="pl-9 pr-3 w-full"
        />
      </div>

      {/* Selected Users */}
      {selectedContacts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedContacts.map(contact => (
            <div
              key={contact.id}
              className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm"
            >
              <span>{contact.username}</span>
              <button onClick={() => removeContact(contact.id)} className="hover:text-red-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Contact List */}
      <div className="flex flex-col space-y-2 overflow-y-auto max-h-64 border border-gray-200 rounded p-2">
        {filteredContacts.length > 0 ? (
          filteredContacts.map((contact: UserListResponse) => {
            const isSelected = selectedContacts.some(c => c.id === contact.id);
            return (
              <label
                key={contact.id}
                className="flex items-center justify-between p-2 rounded hover:bg-gray-100 cursor-pointer"
              >
                <div className="flex flex-row gap-4 items-center">
                  <Avatar.Root className="w-10 h-10 rounded-full overflow-hidden">
                    <Avatar.Image
                      src={contact.avatar_url}
                      alt={contact.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                    <Avatar.Fallback className="w-full h-full rounded-full flex items-center justify-center bg-gray-500 text-white font-semibold">
                      {contact.username.slice(0, 2).toUpperCase()}
                    </Avatar.Fallback>
                  </Avatar.Root>
                  <span>{contact.username}</span>
                </div>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleContact(contact)}
                  className="w-4 h-4 accent-blue-500"
                />
              </label>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground">No contacts found</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={selectedContacts.length === 0 || (action === "create" && !groupName.trim())}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition disabled:opacity-50"
      >
        {action === "create" ? `Create Group (${selectedContacts.length})` : `Add Members (${selectedContacts.length})`}
      </button>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Search, Crown, Lock, UserPlus, Check, X, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { PremiumGuard } from "@/components/PremiumGuard";
import { useTranslation } from "react-i18next";
import { usePremium } from "@/hooks/usePremium";

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  unique_id: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  request_message: string | null;
  requested_at: string;
  profiles: Profile;
}

export default function Friends() {
  return (
    <PremiumGuard>
      <FriendsContent />
    </PremiumGuard>
  );
}

function FriendsContent() {
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<Friend[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [requestMessage, setRequestMessage] = useState("");

  useEffect(() => {
    if (user) {
      fetchFriends();
      fetchRequests();
    }
  }, [user]);

  const fetchFriends = async () => {
    try {
      // Get friends where current user is user_id
      const { data: data1, error: error1 } = await supabase
        .from("friends")
        .select(`
          id,
          user_id,
          friend_id,
          status,
          request_message,
          requested_at,
          profiles!friends_friend_id_fkey (
            id,
            username,
            display_name,
            unique_id,
            avatar_url,
            bio,
            quit_date
          )
        `)
        .eq("user_id", user?.id)
        .eq("status", "accepted");

      // Get friends where current user is friend_id
      const { data: data2, error: error2 } = await supabase
        .from("friends")
        .select(`
          id,
          user_id,
          friend_id,
          status,
          request_message,
          requested_at,
          profiles!friends_user_id_fkey (
            id,
            username,
            display_name,
            unique_id,
            avatar_url,
            bio,
            quit_date
          )
        `)
        .eq("friend_id", user?.id)
        .eq("status", "accepted");

      if (error1) throw error1;
      if (error2) throw error2;

      // Combine both arrays and normalize data structure
      const combined = [
        ...(data1 || []).map(f => ({ ...f, friendProfile: f.profiles })),
        ...(data2 || []).map(f => ({ ...f, friendProfile: f.profiles, friend_id: f.user_id }))
      ];

      setFriends(combined as any);
    } catch (error) {
      console.error("Error fetching friends:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      // Incoming requests
      const { data: incoming, error: incomingError } = await supabase
        .from("friends")
        .select(`
          id,
          user_id,
          friend_id,
          status,
          request_message,
          requested_at,
          profiles!friends_user_id_fkey (
            id,
            username,
            display_name,
            unique_id,
            avatar_url,
            bio
          )
        `)
        .eq("friend_id", user?.id)
        .eq("status", "pending");

      if (incomingError) throw incomingError;
      setIncomingRequests(incoming || []);

      // Outgoing requests
      const { data: outgoing, error: outgoingError } = await supabase
        .from("friends")
        .select(`
          id,
          user_id,
          friend_id,
          status,
          request_message,
          requested_at,
          profiles!friends_friend_id_fkey (
            id,
            username,
            display_name,
            unique_id,
            avatar_url,
            bio
          )
        `)
        .eq("user_id", user?.id)
        .eq("status", "pending");

      if (outgoingError) throw outgoingError;
      setOutgoingRequests(outgoing || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error(t('friends.enterUsername'));
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, unique_id, avatar_url, bio")
        .neq("id", user?.id)
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%,unique_id.eq.${searchQuery}`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
      
      if (data && data.length > 0) {
        toast.success(t('friends.foundUsers', { count: data.length }));
      } else {
        toast.error(t('friends.noUsers'));
      }
    } catch (error) {
      console.error("Error searching:", error);
      toast.error(t('friends.errorSearch'));
    }
  };

  const sendFriendRequest = async () => {
    if (!selectedUser || !user) return;

    try {
      const { error } = await supabase.from("friends").insert({
        user_id: user.id,
        friend_id: selectedUser.id,
        status: "pending",
        request_message: requestMessage.trim() || null,
      });

      if (error) throw error;
      
      toast.success(t('friends.requestSent'));
      setSelectedUser(null);
      setRequestMessage("");
      fetchRequests();
    } catch (error) {
      console.error("Error sending request:", error);
      toast.error(t('friends.errorSendRequest'));
    }
  };

  const acceptRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("friends")
        .update({ status: "accepted", accepted_at: new Date().toISOString() })
        .eq("id", requestId);

      if (error) throw error;
      
      toast.success(`🎉 ${t('friends.requestAccepted')}`);
      fetchFriends();
      fetchRequests();
    } catch (error) {
      console.error("Error accepting request:", error);
      toast.error(t('friends.errorGeneral'));
    }
  };

  const removeFriend = async (friendId: string) => {
    try {
      const { error } = await supabase
        .from("friends")
        .update({ status: "rejected" })
        .eq("id", friendId);

      if (error) throw error;
      
      toast.success(t('friends.friendRemoved'));
      fetchFriends();
    } catch (error) {
      console.error("Error removing friend:", error);
      toast.error(t('friends.errorGeneral'));
    }
  };

  const rejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("friends")
        .update({ status: "rejected" })
        .eq("id", requestId);

      if (error) throw error;
      
      toast.success(t('friends.requestRejected'));
      fetchRequests();
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast.error(t('friends.errorGeneral'));
    }
  };

  return (
    <div className="min-h-screen bg-background p-2 sm:p-4">
      <div className="max-w-5xl mx-auto pt-4 sm:pt-8">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-4 sm:mb-6 text-sm">
          <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
          {t('friends.back')}
        </Button>

        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <Users className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
          <h1 className="text-xl sm:text-3xl font-bold">{t('friends.title')}</h1>
        </div>

        {/* Search */}
        <Card className="p-3 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-base sm:text-xl font-semibold mb-3 sm:mb-4">🔍 {t('friends.searchTitle')}</h2>
          <div className="flex flex-col sm:flex-row gap-2 mb-3 sm:mb-4">
            <Input
              placeholder={t('friends.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="text-sm"
            />
            <Button onClick={handleSearch} className="w-full sm:w-auto text-sm">
              <Search className="w-4 h-4 mr-1 sm:mr-2" />
              {t('friends.findButton')}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2 sm:space-y-3">
              {searchResults.map((profile) => (
                <div key={profile.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback className="text-sm">{(profile.display_name || profile.username).charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm sm:text-base">{profile.display_name || profile.username}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">ID: {profile.unique_id}</p>
                    </div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button onClick={() => setSelectedUser(profile)} size="sm" className="w-full sm:w-auto text-sm">
                        <UserPlus className="w-4 h-4 mr-1 sm:mr-2" />
                        {t('friends.addButton')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[95vw] sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle className="text-base sm:text-lg">{t('friends.sendRequest')}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                            <AvatarImage src={selectedUser?.avatar_url || undefined} />
                            <AvatarFallback>{(selectedUser?.display_name || selectedUser?.username || "U").charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-sm sm:text-base">{selectedUser?.display_name || selectedUser?.username}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground">{selectedUser?.bio}</p>
                          </div>
                        </div>
                        <Textarea
                          placeholder={t('friends.addMessage')}
                          value={requestMessage}
                          onChange={(e) => setRequestMessage(e.target.value)}
                          rows={3}
                          className="text-sm"
                        />
                        <Button onClick={sendFriendRequest} className="w-full text-sm">{t('friends.sendRequestButton')}</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="friends" className="mb-4 sm:mb-6">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="friends" className="text-xs sm:text-sm py-2 px-1 sm:px-3">{t('friends.myFriendsTab')} ({friends.length})</TabsTrigger>
            <TabsTrigger value="incoming" className="text-xs sm:text-sm py-2 px-1 sm:px-3">{t('friends.incomingTab')} ({incomingRequests.length})</TabsTrigger>
            <TabsTrigger value="outgoing" className="text-xs sm:text-sm py-2 px-1 sm:px-3">{t('friends.outgoingTab')} ({outgoingRequests.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="friends">
            <Card className="p-3 sm:p-6">
              {loading ? (
                <div className="text-center py-6 sm:py-8 text-sm">{t('common.loading')}</div>
              ) : friends.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <Users className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                  <p className="text-muted-foreground text-sm">{t('friends.noFriends')}</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {friends.map((friend) => {
                    const friendProfile = (friend as any).friendProfile || friend.profiles;
                    const quitDate = friendProfile?.quit_date;
                    const daysWithoutSmoking = quitDate ? Math.floor((Date.now() - new Date(quitDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
                    
                    return (
                      <div key={friend.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                            <AvatarImage src={friendProfile?.avatar_url || undefined} />
                            <AvatarFallback className="text-sm">{(friendProfile?.display_name || friendProfile?.username || "U").charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-sm sm:text-base">{friendProfile?.display_name || friendProfile?.username}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground">ID: {friendProfile?.unique_id}</p>
                            {quitDate && (
                              <p className="text-[10px] sm:text-xs text-success font-medium">🌟 {daysWithoutSmoking} {t('friends.daysSmokeFree')}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 sm:gap-2 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => navigate(`/profile/${friend.friend_id}`)} className="text-xs sm:text-sm px-2 sm:px-3 h-8">
                            {t('friends.profileButton')}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => navigate(`/chat/${friend.friend_id}`)} disabled={!isPremium} className="text-xs sm:text-sm px-2 sm:px-3 h-8">
                            {isPremium ? t('friends.chatButton') : <Lock className="h-3 w-3 sm:h-4 sm:w-4" />}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => removeFriend(friend.id)} className="h-8 w-8 p-0">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="incoming">
            <Card className="p-6">
              {incomingRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">{t('friends.noIncoming')}</div>
              ) : (
                <div className="space-y-3">
                  {incomingRequests.map((request) => (
                    <div key={request.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={request.profiles.avatar_url || undefined} />
                            <AvatarFallback>{(request.profiles.display_name || request.profiles.username).charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{request.profiles.display_name || request.profiles.username}</p>
                            <p className="text-xs text-muted-foreground">{new Date(request.requested_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => acceptRequest(request.id)}>
                            <Check className="w-4 h-4 mr-1" />
                            {t('friends.acceptButton')}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => rejectRequest(request.id)}>
                            <X className="w-4 h-4 mr-1" />
                            {t('friends.rejectButton')}
                          </Button>
                        </div>
                      </div>
                      {request.request_message && (
                        <p className="text-sm text-muted-foreground italic">"{request.request_message}"</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="outgoing">
            <Card className="p-6">
              {outgoingRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">{t('friends.noOutgoing')}</div>
              ) : (
                <div className="space-y-3">
                  {outgoingRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={request.profiles.avatar_url || undefined} />
                          <AvatarFallback>{(request.profiles.display_name || request.profiles.username).charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{request.profiles.display_name || request.profiles.username}</p>
                          <p className="text-xs text-muted-foreground">{new Date(request.requested_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">В ожидании</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Removed duplicate export - already exported at the top

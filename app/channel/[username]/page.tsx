/** @format */

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UserPlus,
  UserMinus,
  Eye,
  Clock,
  Users,
  Video,
  MessageSquare,
  Heart,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "../../contexts/auth-context";
import {
  authService,
  subscriptionService,
  videoService,
  tweetService,
  likeService,
} from "../../services/api";
import { Header } from "@/components/header";

interface ChannelData {
  _id: string;
  username: string;
  email: string;
  avatar: string;
  coverimage: string;
  subscribersCount: number;
  channelsSubscribedToCount: number;
  isSubscribed: boolean;
}

interface VideoType {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  views: number;
  duration: number;
  createdAt: string;
  isPublished: boolean;
}

interface Tweet {
  _id: string;
  content: string;
  createdAt: string;
  likesCount: number;
  isLiked?: boolean;
  owner: {
    _id: string;
    username: string;
    avatar: string;
  };
}

export default function ChannelPage() {
  const params = useParams();
  const { user } = useAuth();
  const [channel, setChannel] = useState<ChannelData | null>(null);
  const [videos, setVideos] = useState<VideoType[]>([]);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  useEffect(() => {
    if (params.username) {
      fetchChannelData();
    }
  }, [params.username]);

  // Refresh subscription status whenever user changes
  useEffect(() => {
    if (channel && user) {
      checkSubscriptionStatus();
    }
  }, [user, channel]);

  // Check like status for tweets when user changes
  useEffect(() => {
    if (tweets.length > 0 && user) {
      checkTweetLikeStatuses();
    }
  }, [tweets.length, user]);

  const checkSubscriptionStatus = async () => {
    if (!channel || !user) return;

    try {
      const response = await subscriptionService.checkIfSubscribed(channel._id);
      setChannel((prev) =>
        prev ? { ...prev, isSubscribed: response.data.isSubscribed } : null
      );
    } catch (error) {
      console.error("Error checking subscription status:", error);
    }
  };

  const checkTweetLikeStatuses = async () => {
    if (!user) return;

    try {
      const updatedTweets = await Promise.all(
        tweets.map(async (tweet) => {
          try {
            const [likeStatusResponse, likesCountResponse] = await Promise.all([
              likeService.checkIfTweetLiked(tweet._id),
              likeService.getTweetLikesCount(tweet._id),
            ]);

            return {
              ...tweet,
              isLiked: likeStatusResponse.data?.isLiked || false,
              likesCount: likesCountResponse.data?.likesCount || 0,
            };
          } catch (error) {
            console.error(
              `Error checking like status for tweet ${tweet._id}:`,
              error
            );
            return tweet;
          }
        })
      );

      setTweets(updatedTweets);
    } catch (error) {
      console.error("Error checking tweet like statuses:", error);
    }
  };

  const fetchChannelData = async () => {
    try {
      setLoading(true);
      const channelResponse = await authService.getUserChannel(
        params.username as string
      );
      const channelData = channelResponse.data;
      setChannel(channelData);

      // Fetch videos for this specific channel using username filter
      if (channelData) {
        try {
          const videosResponse = await videoService.getVideos({
            page: 1,
            limit: 50,
            sortBy: "createdAt",
            sortType: "desc",
            username: params.username as string,
            published: true,
          });

          let channelVideos = [];
          if (videosResponse.data.docs) {
            channelVideos = videosResponse.data.docs;
          } else if (Array.isArray(videosResponse.data)) {
            channelVideos = videosResponse.data;
          }

          const filteredVideos = channelVideos.filter(
            (video: any) =>
              video.ownerDetails?.username === params.username ||
              video.owner?.username === params.username
          );

          setVideos(filteredVideos);
        } catch (error) {
          console.error("Error fetching channel videos:", error);
          setVideos([]);
        }

        // Fetch tweets
        try {
          const tweetsResponse = await tweetService.getUserTweets(
            channelData._id
          );
          setTweets(tweetsResponse.data || []);
        } catch (error) {
          console.log("No tweets found for this channel");
          setTweets([]);
        }
      }
    } catch (error) {
      console.error("Error fetching channel data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!channel || !user || subscriptionLoading) return;

    setSubscriptionLoading(true);
    try {
      await subscriptionService.toggleSubscription(channel._id);
      setChannel({
        ...channel,
        isSubscribed: !channel.isSubscribed,
        subscribersCount: channel.isSubscribed
          ? Math.max(0, channel.subscribersCount - 1)
          : channel.subscribersCount + 1,
      });
    } catch (error) {
      console.error("Error toggling subscription:", error);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const handleTweetLike = async (tweetId: string) => {
    if (!user) return;

    try {
      await likeService.toggleTweetLike(tweetId);
      setTweets(
        tweets.map((tweet) =>
          tweet._id === tweetId
            ? {
                ...tweet,
                isLiked: !tweet.isLiked,
                likesCount: tweet.isLiked
                  ? Math.max(0, tweet.likesCount - 1)
                  : tweet.likesCount + 1,
              }
            : tweet
        )
      );
    } catch (error) {
      console.error("Error toggling tweet like:", error);
    }
  };

  const formatViews = (views: number | undefined | null) => {
    if (!views || views === 0) return "0";
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto max-w-6xl p-4">
          <div className="animate-pulse">
            <div className="h-48 bg-muted rounded-lg mb-4" />
            <div className="h-8 bg-muted rounded mb-2" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Channel not found</h2>
            <p className="text-muted-foreground">
              The channel you're looking for doesn't exist.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto max-w-6xl p-6">
        {/* Channel Header */}
        <div className="mb-8">
          {/* Cover Image */}
          <div className="relative h-48 bg-gradient-to-r from-primary/20 to-primary/5 rounded-lg mb-6 overflow-hidden">
            {channel.coverimage && (
              <img
                src={channel.coverimage || "/placeholder.svg"}
                alt="Channel cover"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            )}
          </div>

          {/* Channel Info - Avatar and details below cover */}
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-6">
              <Avatar className="w-24 h-24 border-4 border-background">
                <AvatarImage src={channel.avatar || "/placeholder.svg"} />
                <AvatarFallback className="text-2xl">
                  {channel.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div>
                <h1 className="text-3xl font-bold mb-2">{channel.username}</h1>
                <div className="flex items-center space-x-4 text-muted-foreground mb-4">
                  <span className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {formatViews(channel.subscribersCount)} subscribers
                  </span>
                  <span className="flex items-center">
                    <Video className="w-4 h-4 mr-1" />
                    {videos.length} videos
                  </span>
                </div>
                <p className="text-muted-foreground">{channel.email}</p>
              </div>
            </div>

            {user && user._id !== channel._id && (
              <Button
                variant={channel.isSubscribed ? "outline" : "default"}
                onClick={handleSubscribe}
                disabled={subscriptionLoading}
                className="min-w-[120px]"
              >
                {subscriptionLoading ? (
                  "Loading..."
                ) : channel.isSubscribed ? (
                  <>
                    <UserMinus className="w-4 h-4 mr-2" />
                    Unsubscribe
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Subscribe
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="videos" className="space-y-6">
          <TabsList>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="tweets">Tweets</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="videos" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Videos</h2>
              <Badge variant="secondary">{videos.length} videos</Badge>
            </div>

            {videos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {videos.map((video) => (
                  <Link key={video._id} href={`/video/${video._id}`}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <div className="relative aspect-video">
                        <img
                          src={video.thumbnail || "/placeholder.svg"}
                          alt={video.title}
                          className="w-full h-full object-cover rounded-t-lg"
                        />
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                          {formatDuration(video.duration)}
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-medium text-sm line-clamp-2 mb-2">
                          {video.title}
                        </h3>
                        <div className="flex items-center text-xs text-muted-foreground space-x-2">
                          <span className="flex items-center">
                            <Eye className="w-3 h-3 mr-1" />
                            {formatViews(video.views)}
                          </span>
                          <span>•</span>
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(video.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No videos yet</h3>
                <p className="text-muted-foreground">
                  This channel hasn't uploaded any videos.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="tweets" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Tweets</h2>
              <Badge variant="secondary">{tweets.length} tweets</Badge>
            </div>

            {tweets.length > 0 ? (
              <div className="space-y-4">
                {tweets.map((tweet) => (
                  <Card key={tweet._id}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage
                            src={tweet.owner?.avatar || channel.avatar}
                          />
                          <AvatarFallback>
                            {(tweet.owner?.username ||
                              channel.username)?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-medium">
                              {tweet.owner?.username || channel.username}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {new Date(tweet.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap mb-3">
                            {tweet.content}
                          </p>
                          <div className="flex items-center space-x-4 text-muted-foreground">
                            {user && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleTweetLike(tweet._id)}
                                className="h-auto p-0 hover:text-red-500"
                              >
                                <Heart
                                  className={`w-4 h-4 mr-1 ${
                                    tweet.isLiked
                                      ? "fill-red-500 text-red-500"
                                      : ""
                                  }`}
                                />
                                <span className="text-xs">
                                  {tweet.likesCount || 0}
                                </span>
                              </Button>
                            )}
                            {!user && (
                              <span className="flex items-center text-xs text-muted-foreground">
                                <Heart className="w-4 h-4 mr-1" />
                                {tweet.likesCount || 0}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No tweets yet</h3>
                <p className="text-muted-foreground">
                  This channel hasn't posted any tweets.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="about" className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4">
                  About {channel.username}
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Channel Stats</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold">
                          {formatViews(channel.subscribersCount)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Subscribers
                        </div>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold">
                          {videos.length}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Videos
                        </div>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold">
                          {tweets.length}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Tweets
                        </div>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold">
                          {formatViews(
                            videos.reduce((sum, video) => sum + video.views, 0)
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total Views
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Contact</h3>
                    <p className="text-muted-foreground">{channel.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

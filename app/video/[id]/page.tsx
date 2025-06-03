/** @format */

"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ThumbsUp,
  Share2,
  Download,
  Eye,
  Calendar,
  MessageCircle,
  Send,
  Plus,
  UserPlus,
  UserMinus,
  MoreVertical,
  Heart,
} from "lucide-react";
import {
  videoService,
  commentService,
  likeService,
  subscriptionService,
  playlistService,
  authService,
} from "../../services/api";
import { useAuth } from "../../contexts/auth-context";
import { Header } from "@/components/header";

interface Video {
  _id: string;
  title: string;
  description: string;
  videoFile: string;
  thumbnail: string;
  views: number;
  duration: number;
  createdAt: string;
  owner: {
    _id: string;
    username: string;
    avatar: string;
  };
}

interface Comment {
  _id: string;
  content: string;
  createdAt: string;
  isLiked?: boolean;
  likesCount?: number;
  ownerDetails: Array<{
    _id: string;
    username: string;
    avatar: string;
  }>;
}

interface playlist {
  _id: string;
  name: string;
  description: string;
}

export default function VideoPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [playlists, setplaylists] = useState<playlist[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchVideo();
      fetchComments();
      if (user) {
        fetchUserplaylists();
        addToWatchHistory();
      }
    }
  }, [params.id, user]);

  useEffect(() => {
    if (video && user && user._id !== video.owner._id) {
      checkSubscriptionStatus();
      checkLikeStatus();
      fetchLikesCount();
    }
  }, [video, user]);

  useEffect(() => {
    if (comments.length > 0 && user) {
      checkCommentLikeStatuses();
    }
  }, [comments.length, user]);

  const addToWatchHistory = async () => {
    if (!user || !params.id) return;
    try {
      await authService.addToWatchHistory(params.id as string);
    } catch (error) {
      console.error("Error adding to watch history:", error);
    }
  };

  const fetchVideo = async () => {
    try {
      const response = await videoService.getVideo(params.id as string);
      setVideo(response.data);
      await videoService.incrementViews(params.id as string);
    } catch (error) {
      console.error("Error fetching video:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await commentService.getVideoComments(
        params.id as string,
        {
          page: 1,
          limit: 50,
          sortBy: "createdAt",
          sortType: "desc",
        }
      );
      setComments(response.data.comments || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const checkCommentLikeStatuses = async () => {
    if (!user) return;

    try {
      const updatedComments = await Promise.all(
        comments.map(async (comment) => {
          try {
            const [likeStatusResponse, likesCountResponse] = await Promise.all([
              likeService.checkIfCommentLiked(comment._id),
              likeService.getCommentLikesCount(comment._id),
            ]);

            return {
              ...comment,
              isLiked: likeStatusResponse.data?.isLiked || false,
              likesCount: likesCountResponse.data?.likesCount || 0,
            };
          } catch (error) {
            console.error(
              `Error checking like status for comment ${comment._id}:`,
              error
            );
            return comment;
          }
        })
      );

      setComments(updatedComments);
    } catch (error) {
      console.error("Error checking comment like statuses:", error);
    }
  };

  const fetchUserplaylists = async () => {
    if (!user) return;
    try {
      const response = await playlistService.getUserplaylists(user._id);
      setplaylists(response.data || []);
    } catch (error) {
      console.error("Error fetching playlists:", error);
    }
  };

  const checkSubscriptionStatus = async () => {
    if (!video || !user) return;
    try {
      const response = await subscriptionService.checkIfSubscribed(
        video.owner._id
      );
      setIsSubscribed(response.data.isSubscribed);
    } catch (error) {
      console.error("Error checking subscription status:", error);
    }
  };

  const checkLikeStatus = async () => {
    if (!video || !user) return;
    try {
      const response = await likeService.checkIfVideoLiked(video._id);
      setIsLiked(response.data.isLiked);
    } catch (error) {
      console.error("Error checking like status:", error);
    }
  };

  const fetchLikesCount = async () => {
    if (!video) return;
    try {
      const response = await likeService.getVideoLikesCount(video._id);
      setLikesCount(response.data.likesCount || 0);
    } catch (error) {
      console.error("Error fetching likes count:", error);
    }
  };

  const handleSubscribe = async () => {
    if (!video || !user || subscriptionLoading) return;

    setSubscriptionLoading(true);
    try {
      await subscriptionService.toggleSubscription(video.owner._id);
      setIsSubscribed(!isSubscribed);
    } catch (error) {
      console.error("Error toggling subscription:", error);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const handleLike = async () => {
    if (!video || !user || likeLoading) return;

    setLikeLoading(true);
    try {
      await likeService.toggleVideoLike(video._id);
      const wasLiked = isLiked;
      setIsLiked(!wasLiked);
      setLikesCount((prev) => (wasLiked ? Math.max(0, prev - 1) : prev + 1));
    } catch (error) {
      console.error("Error toggling like:", error);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleCommentLike = async (commentId: string) => {
    if (!user) return;

    try {
      await likeService.toggleCommentLike(commentId);
      setComments(
        comments.map((comment) =>
          comment._id === commentId
            ? {
                ...comment,
                isLiked: !comment.isLiked,
                likesCount: comment.isLiked
                  ? Math.max(0, (comment.likesCount || 0) - 1)
                  : (comment.likesCount || 0) + 1,
              }
            : comment
        )
      );
    } catch (error) {
      console.error("Error toggling comment like:", error);
    }
  };

  const handleAddToplaylist = async (playlistId: string) => {
    if (!video) return;
    try {
      await playlistService.addVideoToplaylist(video._id, playlistId);
      alert("Video added to playlist successfully!");
    } catch (error) {
      console.error("Error adding video to playlist:", error);
      alert("Failed to add video to playlist");
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    try {
      const response = await commentService.addComment(
        params.id as string,
        newComment
      );
      setComments([response.data, ...comments]);
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleCreatorClick = () => {
    if (video) {
      router.push(`/channel/${video.owner.username}`);
    }
  };

  const formatViews = (views: number | undefined | null) => {
    if (!views || views === 0) return "0";
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto max-w-6xl p-4">
          <div className="animate-pulse">
            <div className="aspect-video bg-muted rounded-lg mb-4" />
            <div className="h-8 bg-muted rounded mb-2" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Video not found</h2>
            <p className="text-muted-foreground">
              The video you're looking for doesn't exist.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto max-w-6xl p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Video Section */}
          <div className="lg:col-span-2">
            {/* Video Player */}
            <div className="aspect-video bg-black rounded-lg mb-4 relative">
              <video
                src={video.videoFile}
                poster={video.thumbnail}
                controls
                className="w-full h-full rounded-lg"
              />
            </div>

            {/* Video Info */}
            <div className="space-y-4">
              <h1 className="text-2xl font-bold">{video.title}</h1>

              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span className="flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    {formatViews(video.views)} views
                  </span>
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(video.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant={isLiked ? "default" : "outline"}
                    size="sm"
                    onClick={handleLike}
                    disabled={!user || likeLoading}
                  >
                    <ThumbsUp
                      className={`w-4 h-4 mr-1 ${
                        isLiked ? "fill-current" : ""
                      }`}
                    />
                    {likesCount > 0 ? `${likesCount}` : "Like"}
                  </Button>

                  {user && playlists.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {playlists.map((playlist) => (
                          <DropdownMenuItem
                            key={playlist._id}
                            onClick={() => handleAddToplaylist(playlist._id)}
                          >
                            {playlist.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}

                  <Button variant="outline" size="sm">
                    <Share2 className="w-4 h-4 mr-1" />
                    Share
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem>Report</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <Separator />

              {/* Channel Info */}
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center space-x-3 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
                  onClick={handleCreatorClick}
                >
                  <Avatar className="w-12 h-12">
                    <AvatarImage
                      src={video.owner.avatar || "/placeholder.svg"}
                    />
                    <AvatarFallback>
                      {video.owner.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium hover:text-primary transition-colors">
                      {video.owner.username}
                    </h3>
                    <p className="text-sm text-muted-foreground">Creator</p>
                  </div>
                </div>

                {user && user._id !== video.owner._id && (
                  <Button
                    variant={isSubscribed ? "outline" : "default"}
                    onClick={handleSubscribe}
                    disabled={subscriptionLoading}
                    className="min-w-[100px]"
                  >
                    {subscriptionLoading ? (
                      "Loading..."
                    ) : isSubscribed ? (
                      <>
                        <UserMinus className="w-4 h-4 mr-1" />
                        Subscribed
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-1" />
                        Subscribe
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Description */}
              <Card>
                <CardContent className="pt-6">
                  <p className="whitespace-pre-wrap">{video.description}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Comments Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center">
              <MessageCircle className="w-5 h-5 mr-2" />
              Comments ({comments.length})
            </h2>

            {/* Add Comment */}
            {user ? (
              <form onSubmit={handleAddComment} className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} />
                    <AvatarFallback>
                      {user.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" size="sm" disabled={!newComment.trim()}>
                    <Send className="w-4 h-4 mr-1" />
                    Comment
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-center py-4 border rounded-lg">
                <p className="text-muted-foreground mb-2">
                  Sign in to leave a comment
                </p>
                <Button variant="outline" onClick={() => router.push("/login")}>
                  Sign In
                </Button>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment._id} className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage
                      src={
                        comment?.ownerDetails?.[0]?.avatar ?? "/placeholder.svg"
                      }
                    />

                    <AvatarFallback>
                      {comment?.ownerDetails?.[0]?.username
                        ? comment.ownerDetails?.[0].username[0].toUpperCase()
                        : "Undefined User"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm">
                        {comment?.ownerDetails?.[0]?.username}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm mb-2">{comment.content}</p>
                    {user && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCommentLike(comment._id)}
                        className="h-auto p-0 hover:text-red-500"
                      >
                        <Heart
                          className={`w-3 h-3 mr-1 ${
                            comment.isLiked ? "fill-red-500 text-red-500" : ""
                          }`}
                        />
                        <span className="text-xs">
                          {comment.likesCount || 0}
                        </span>
                      </Button>
                    )}
                    {!user && comment.likesCount && comment.likesCount > 0 && (
                      <span className="flex items-center text-xs text-muted-foreground">
                        <Heart className="w-3 h-3 mr-1" />
                        {comment.likesCount}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {comments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No comments yet</p>
                  <p className="text-sm">Be the first to comment!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** @format */

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Play, Eye, Clock, Trash2, PlayCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "../../contexts/auth-context";
import { playlistService } from "../../services/api";
import { Header } from "@/components/header";

interface playlistVideo {
  _id: string;
  title: string;
  description: string;
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

interface playlistData {
  _id: string;
  name: string;
  description: string;
  videos: playlistVideo[];
  owner: {
    _id: string;
    username: string;
    avatar: string;
  };
  totalViews?: number;
  totalVideos?: number;
  createdAt: string;
}

export default function playlistDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const [playlist, setplaylist] = useState<playlistData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchplaylist();
    }
  }, [params.id]);

  const fetchplaylist = async () => {
    try {
      setLoading(true);
      const response = await playlistService.getplaylist(params.id as string);
      setplaylist(response.data);
    } catch (error) {
      console.error("Error fetching playlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveVideo = async (videoId: string) => {
    if (!playlist || !confirm("Remove this video from the playlist?")) return;

    try {
      await playlistService.removeVideoFromplaylist(videoId, playlist._id);
      setplaylist({
        ...playlist,
        videos: playlist.videos.filter((video) => video._id !== videoId),
        totalVideos: (playlist.totalVideos || 0) - 1,
      });
    } catch (error) {
      console.error("Error removing video from playlist:", error);
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
            <div className="h-8 bg-muted rounded mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-video bg-muted rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">playlist not found</h2>
            <p className="text-muted-foreground">
              The playlist you're looking for doesn't exist.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto p-6">
        {/* playlist Header */}
        <div className="mb-8">
          <div className="flex items-start space-x-6">
            <div className="w-48 h-32 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center">
              <PlayCircle className="w-16 h-16 text-primary/60" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{playlist.name}</h1>
              {playlist.description && (
                <p className="text-muted-foreground mb-4">
                  {playlist.description}
                </p>
              )}
              <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
                <span>{playlist.totalVideos || 0} videos</span>
                <span>•</span>
                <span>{formatViews(playlist.totalViews || 0)} total views</span>
                <span>•</span>
                <span>
                  Created {new Date(playlist.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage
                    src={playlist.owner.avatar || "/placeholder.svg"}
                  />
                  <AvatarFallback>
                    {playlist.owner.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{playlist.owner.username}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Videos */}
        {playlist.videos.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">
              Videos ({playlist.totalVideos})
            </h2>
            <div className="space-y-3">
              {playlist.videos.map((video, index) => (
                <Card
                  key={video._id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 text-muted-foreground font-medium text-sm w-8">
                        {index + 1}
                      </div>
                      <div className="relative w-40 aspect-video flex-shrink-0">
                        <img
                          src={video.thumbnail || "/placeholder.svg"}
                          alt={video.title}
                          className="w-full h-full object-cover rounded"
                        />
                        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 py-0.5 rounded">
                          {formatDuration(video.duration)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/video/${video._id}`}>
                          <h3 className="font-medium line-clamp-2 hover:text-primary cursor-pointer mb-1">
                            {video.title}
                          </h3>
                        </Link>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                          <Avatar className="w-5 h-5">
                            <AvatarImage
                              src={video.owner.avatar || "/placeholder.svg"}
                            />
                            <AvatarFallback>
                              {video.owner.username?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>{video.owner.username}</span>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground space-x-2">
                          <span className="flex items-center">
                            <Eye className="w-3 h-3 mr-1" />
                            {formatViews(video.views)} views
                          </span>
                          <span>•</span>
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(video.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link href={`/video/${video._id}`}>
                          <Button size="sm" variant="outline">
                            <Play className="w-4 h-4 mr-1" />
                            Play
                          </Button>
                        </Link>
                        {user && user._id === playlist.owner._id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveVideo(video._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <PlayCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              No videos in this playlist
            </h3>
            <p className="text-muted-foreground">This playlist is empty.</p>
          </div>
        )}
      </div>
    </div>
  );
}

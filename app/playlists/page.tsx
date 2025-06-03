/** @format */

"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Play,
  Eye,
  Clock,
  Edit,
  Trash2,
  PlayCircle,
  List,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "../contexts/auth-context";
import { playlistService } from "../services/api";
import { Header } from "@/components/header";

interface playlist {
  _id: string;
  name: string;
  description: string;
  videos: any[];
  owner: {
    _id: string;
    username: string;
    avatar: string;
  };
  totalViews?: number;
  totalVideos?: number;
  createdAt: string;
}

export default function playlistsPage() {
  const { user } = useAuth();
  const [playlists, setplaylists] = useState<playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingplaylist, setEditingplaylist] = useState<playlist | null>(null);
  const [newplaylist, setNewplaylist] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchplaylists();
    }
  }, [user]);

  const fetchplaylists = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await playlistService.getUserplaylists(user._id);
      setplaylists(response.data || []);
    } catch (error) {
      console.error("Error fetching playlists:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateplaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newplaylist.name.trim()) return;

    setCreating(true);
    try {
      const response = await playlistService.createplaylist(newplaylist);
      setplaylists([response.data, ...playlists]);
      setNewplaylist({ name: "", description: "" });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Error creating playlist:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleEditplaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingplaylist || !newplaylist.name.trim()) return;

    setUpdating(true);
    try {
      const response = await playlistService.updateplaylist(
        editingplaylist._id,
        newplaylist
      );
      setplaylists(
        playlists.map((p) =>
          p._id === editingplaylist._id ? response.data : p
        )
      );
      setNewplaylist({ name: "", description: "" });
      setEditingplaylist(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating playlist:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteplaylist = async (playlistId: string) => {
    if (!confirm("Are you sure you want to delete this playlist?")) return;

    try {
      await playlistService.deleteplaylist(playlistId);
      setplaylists(playlists.filter((playlist) => playlist._id !== playlistId));
    } catch (error) {
      console.error("Error deleting playlist:", error);
    }
  };

  const openEditDialog = (playlist: playlist) => {
    setEditingplaylist(playlist);
    setNewplaylist({ name: playlist.name, description: playlist.description });
    setIsEditDialogOpen(true);
  };

  const formatViews = (views: number | undefined | null) => {
    if (!views || views === 0) return "0";
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              Please log in to view your playlists.
            </p>
            <Link href="/login">
              <Button>Login</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your playlists</h1>
            <p className="text-muted-foreground">
              You have {playlists.length} playlist
              {playlists.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create playlist
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New playlist</DialogTitle>
                <DialogDescription>
                  Create a new playlist to organize your favorite videos.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateplaylist} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">playlist Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter playlist name"
                    value={newplaylist.name}
                    onChange={(e) =>
                      setNewplaylist((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your playlist"
                    value={newplaylist.description}
                    onChange={(e) =>
                      setNewplaylist((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={creating || !newplaylist.name.trim()}
                  >
                    {creating ? "Creating..." : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit playlist</DialogTitle>
              <DialogDescription>
                Update your playlist information.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditplaylist} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">playlist Name</Label>
                <Input
                  id="edit-name"
                  placeholder="Enter playlist name"
                  value={newplaylist.name}
                  onChange={(e) =>
                    setNewplaylist((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description (Optional)</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Describe your playlist"
                  value={newplaylist.description}
                  onChange={(e) =>
                    setNewplaylist((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingplaylist(null);
                    setNewplaylist({ name: "", description: "" });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updating || !newplaylist.name.trim()}
                >
                  {updating ? "Updating..." : "Update"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* playlists Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-video bg-muted rounded-t-lg" />
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded mb-2" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : playlists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlists.map((playlist) => (
              <Card
                key={playlist._id}
                className="group hover:shadow-lg transition-shadow"
              >
                <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-primary/5 rounded-t-lg flex items-center justify-center">
                  <div className="text-center">
                    <PlayCircle className="w-16 h-16 text-primary/60 mx-auto mb-2" />
                    <Badge variant="secondary">
                      {playlist.totalVideos || 0} video
                      {(playlist.totalVideos || 0) !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                    <Link href={`/playlist/${playlist._id}`}>
                      <Button size="sm" variant="secondary">
                        <Play className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openEditDialog(playlist)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteplaylist(playlist._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium text-sm line-clamp-2 mb-2">
                    {playlist.name}
                  </h3>
                  {playlist.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {playlist.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center">
                      <Eye className="w-3 h-3 mr-1" />
                      {formatViews(playlist.totalViews || 0)} views
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(playlist.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <List className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No playlists yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first playlist to organize your favorite videos
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First playlist
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

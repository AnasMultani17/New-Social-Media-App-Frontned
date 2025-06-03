"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Clock, Eye, Play, Trash2, Calendar } from "lucide-react"
import Link from "next/link"
import { useAuth } from "../contexts/auth-context"
import { authService } from "../services/api"
import { Header } from "@/components/header"

interface HistoryVideo {
  _id: string
  title: string
  description: string
  thumbnail: string
  views: number
  duration: number
  createdAt: string
  owner: {
    _id: string
    username: string
    avatar: string
  }
  watchedAt?: string
}

export default function WatchHistoryPage() {
  const { user } = useAuth()
  const [history, setHistory] = useState<HistoryVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (user) {
      fetchWatchHistory()
    }
  }, [user])

  const fetchWatchHistory = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError("")
      const response = await authService.getWatchHistory()
      console.log("Watch history response:", response) // Debug log

      // Your backend returns the watch history directly as an array
      let historyData = []
      if (response && Array.isArray(response)) {
        historyData = response
      } else if (response.data && Array.isArray(response.data)) {
        historyData = response.data
      } else if (response.watchhistory && Array.isArray(response.watchhistory)) {
        historyData = response.watchhistory
      }

      setHistory(historyData)
    } catch (error) {
      console.error("Error fetching watch history:", error)
      setError("Failed to load watch history")
    } finally {
      setLoading(false)
    }
  }

  const clearHistory = async () => {
    if (!confirm("Are you sure you want to clear your entire watch history?")) return

    try {
      await authService.clearWatchHistory()
      setHistory([])
    } catch (error) {
      console.error("Error clearing watch history:", error)
      setError("Failed to clear watch history")
    }
  }

  const removeFromHistory = async (videoId: string) => {
    try {
      await authService.removeFromWatchHistory(videoId)
      setHistory(history.filter((video) => video._id !== videoId))
    } catch (error) {
      console.error("Error removing from watch history:", error)
      setError("Failed to remove video from history")
    }
  }

  const formatViews = (views: number | undefined | null) => {
    if (!views || views === 0) return "0"
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`
    return views.toString()
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">Please log in to view your watch history.</p>
            <Link href="/login">
              <Button>Login</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Watch History</h1>
            <p className="text-muted-foreground">
              You have watched {history.length} video{history.length !== 1 ? "s" : ""}
            </p>
          </div>
          {history.length > 0 && (
            <Button variant="outline" onClick={clearHistory}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All History
            </Button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <p className="text-red-600">{error}</p>
              <Button variant="outline" onClick={fetchWatchHistory} className="mt-2">
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Watch History */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-40 aspect-video bg-muted rounded" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                      <div className="h-3 bg-muted rounded w-1/4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : history.length > 0 ? (
          <div className="space-y-4">
            {history.map((video) => (
              <Card key={video._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className="relative w-40 aspect-video flex-shrink-0">
                      <Link href={`/video/${video._id}`}>
                        <img
                          src={video.thumbnail || "/placeholder.svg"}
                          alt={video.title}
                          className="w-full h-full object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                        />
                        <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 py-0.5 rounded">
                          {formatDuration(video.duration)}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Play className="w-8 h-8 text-white" />
                        </div>
                      </Link>
                    </div>

                    <div className="flex-1 min-w-0">
                      <Link href={`/video/${video._id}`}>
                        <h3 className="font-medium line-clamp-2 hover:text-primary cursor-pointer mb-2">
                          {video.title}
                        </h3>
                      </Link>

                      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={video.owner.avatar || "/placeholder.svg"} />
                          <AvatarFallback>{video.owner.username?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <Link href={`/channel/${video.owner.username}`}>
                          <span className="hover:text-primary cursor-pointer">{video.owner.username}</span>
                        </Link>
                      </div>

                      <div className="flex items-center text-xs text-muted-foreground space-x-2 mb-2">
                        <span className="flex items-center">
                          <Eye className="w-3 h-3 mr-1" />
                          {formatViews(video.views)} views
                        </span>
                        <span>•</span>
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(video.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {video.watchedAt && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="w-3 h-3 mr-1" />
                          Watched {new Date(video.watchedAt).toLocaleDateString()}
                        </div>
                      )}

                      <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{video.description}</p>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <Link href={`/video/${video._id}`}>
                        <Button size="sm" variant="outline">
                          <Play className="w-4 h-4 mr-1" />
                          Watch
                        </Button>
                      </Link>
                      <Button size="sm" variant="outline" onClick={() => removeFromHistory(video._id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No watch history</h3>
            <p className="text-muted-foreground mb-4">Videos you watch will appear here</p>
            <Link href="/">
              <Button>
                <Play className="w-4 h-4 mr-2" />
                Start Watching
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

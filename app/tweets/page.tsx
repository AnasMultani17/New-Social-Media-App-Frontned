"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Heart, Share, MoreHorizontal, Edit, Trash2, Send, Twitter } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useAuth } from "../contexts/auth-context"
import { tweetService, likeService } from "../services/api"
import { Header } from "@/components/header"

interface Tweet {
  _id: string
  content: string
  createdAt: string
  updatedAt: string
  owner: {
    _id: string
    username: string
    avatar: string
  }
  isLiked?: boolean
  likesCount?: number
}

export default function TweetsPage() {
  const { user } = useAuth()
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [newTweet, setNewTweet] = useState("")
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState("")
  const [editingTweet, setEditingTweet] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")

  useEffect(() => {
    if (user) {
      fetchUserTweets()
    }
  }, [user])

  const fetchUserTweets = async () => {
    if (!user) return

    try {
      setLoading(true)
      const response = await tweetService.getUserTweets(user._id)
      setTweets(response.data || [])
    } catch (error) {
      console.error("Error fetching tweets:", error)
      setError("Failed to load tweets")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTweet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTweet.trim() || !user) return

    setPosting(true)
    setError("")

    try {
      const response = await tweetService.createTweet(newTweet)
      setTweets([response.data, ...tweets])
      setNewTweet("")
    } catch (error) {
      setError("Failed to post tweet")
    } finally {
      setPosting(false)
    }
  }

  const handleLikeTweet = async (tweetId: string) => {
    if (!user) return

    try {
      await likeService.toggleTweetLike(tweetId)
      setTweets(
        tweets.map((tweet) =>
          tweet._id === tweetId
            ? {
                ...tweet,
                isLiked: !tweet.isLiked,
                likesCount: tweet.isLiked ? (tweet.likesCount || 0) - 1 : (tweet.likesCount || 0) + 1,
              }
            : tweet,
        ),
      )
    } catch (error) {
      console.error("Error toggling tweet like:", error)
    }
  }

  const handleEditTweet = async (tweetId: string) => {
    if (!editContent.trim()) return

    try {
      const response = await tweetService.updateTweet(tweetId, editContent)
      setTweets(tweets.map((tweet) => (tweet._id === tweetId ? response.data : tweet)))
      setEditingTweet(null)
      setEditContent("")
    } catch (error) {
      console.error("Error updating tweet:", error)
    }
  }

  const handleDeleteTweet = async (tweetId: string) => {
    if (!confirm("Are you sure you want to delete this tweet?")) return

    try {
      await tweetService.deleteTweet(tweetId)
      setTweets(tweets.filter((tweet) => tweet._id !== tweetId))
    } catch (error) {
      console.error("Error deleting tweet:", error)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return `${diffInSeconds}s`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
    return `${Math.floor(diffInSeconds / 86400)}d`
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">Please log in to view tweets.</p>
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

      <div className="container mx-auto max-w-2xl p-4">
        {/* Create Tweet */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Twitter className="w-5 h-5 mr-2" />
              What's happening?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTweet} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex items-start space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{user.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="What's on your mind?"
                    value={newTweet}
                    onChange={(e) => setNewTweet(e.target.value)}
                    rows={3}
                    maxLength={280}
                    className="resize-none"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-muted-foreground">{280 - newTweet.length} characters remaining</span>
                    <Button type="submit" disabled={!newTweet.trim() || posting} size="sm">
                      <Send className="w-4 h-4 mr-1" />
                      {posting ? "Posting..." : "Tweet"}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Tweets Feed */}
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-muted rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-1/4" />
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : tweets.length > 0 ? (
            tweets.map((tweet) => (
              <Card key={tweet._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={tweet.owner.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{tweet.owner.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{tweet.owner.username}</span>
                          <span className="text-sm text-muted-foreground">{formatTimeAgo(tweet.createdAt)}</span>
                          {tweet.createdAt !== tweet.updatedAt && (
                            <Badge variant="secondary" className="text-xs">
                              edited
                            </Badge>
                          )}
                        </div>

                        {user._id === tweet.owner._id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingTweet(tweet._id)
                                  setEditContent(tweet.content)
                                }}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteTweet(tweet._id)} className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>

                      {editingTweet === tweet._id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={3}
                            maxLength={280}
                          />
                          <div className="flex space-x-2">
                            <Button size="sm" onClick={() => handleEditTweet(tweet._id)} disabled={!editContent.trim()}>
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingTweet(null)
                                setEditContent("")
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm whitespace-pre-wrap mb-3">{tweet.content}</p>

                          <div className="flex items-center space-x-6 text-muted-foreground">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLikeTweet(tweet._id)}
                              className="h-auto p-0 hover:text-red-500"
                            >
                              <Heart className={`w-4 h-4 mr-1 ${tweet.isLiked ? "fill-red-500 text-red-500" : ""}`} />
                              <span className="text-xs">{tweet.likesCount || 0}</span>
                            </Button>

                            <Button variant="ghost" size="sm" className="h-auto p-0 hover:text-blue-500">
                              <MessageCircle className="w-4 h-4 mr-1" />
                              <span className="text-xs">0</span>
                            </Button>

                            <Button variant="ghost" size="sm" className="h-auto p-0 hover:text-green-500">
                              <Share className="w-4 h-4 mr-1" />
                              <span className="text-xs">Share</span>
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <Twitter className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No tweets yet</h3>
              <p className="text-muted-foreground">Share your thoughts with your first tweet!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

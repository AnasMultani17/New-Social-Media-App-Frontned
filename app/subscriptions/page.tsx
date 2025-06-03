"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Users, UserMinus, Eye } from "lucide-react"
import Link from "next/link"
import { useAuth } from "../contexts/auth-context"
import { subscriptionService } from "../services/api"
import { Header } from "@/components/header"

interface Subscription {
  _id: string
  subscriber: string
  channel: {
    _id: string
    username: string
    avatar: string
    email: string
  }
  createdAt: string
  views?: number
}

const formatViews = (views: number | undefined | null) => {
  if (!views || views === 0) return "0"
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`
  return views.toString()
}

export default function SubscriptionsPage() {
  const { user } = useAuth()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchSubscriptions()
    }
  }, [user])

  const fetchSubscriptions = async () => {
    if (!user) return

    try {
      setLoading(true)
      const response = await subscriptionService.getSubscribedChannels(user._id)
      setSubscriptions(response.data || [])
    } catch (error) {
      console.error("Error fetching subscriptions:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUnsubscribe = async (channelId: string) => {
    if (!confirm("Are you sure you want to unsubscribe from this channel?")) return

    try {
      await subscriptionService.toggleSubscription(channelId)
      setSubscriptions(subscriptions.filter((sub) => sub.channel._id !== channelId))
    } catch (error) {
      console.error("Error unsubscribing:", error)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">Please log in to view your subscriptions.</p>
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
        {/* Stats */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Subscriptions</h1>
          <p className="text-muted-foreground">
            You're subscribed to {subscriptions.length} channel{subscriptions.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Subscriptions Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6 text-center">
                  <div className="w-20 h-20 bg-muted rounded-full mx-auto mb-4" />
                  <div className="h-4 bg-muted rounded mb-2" />
                  <div className="h-3 bg-muted rounded w-2/3 mx-auto" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : subscriptions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {subscriptions.map((subscription) => (
              <Card key={subscription._id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <Avatar className="w-20 h-20 mx-auto mb-4">
                    <AvatarImage src={subscription.channel.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="text-lg">
                      {subscription.channel.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <h3 className="font-medium text-lg mb-2">{subscription.channel.username}</h3>
                  <p className="text-sm text-muted-foreground mb-4 truncate">{subscription.channel.email}</p>

                  <Badge variant="secondary" className="mb-4">
                    Subscribed {new Date(subscription.createdAt).toLocaleDateString()}
                  </Badge>
                  {subscription.channel.views !== undefined && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {formatViews(subscription.channel.views)} views
                    </p>
                  )}

                  <div className="flex flex-col space-y-2">
                    <Link href={`/channel/${subscription.channel.username}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="w-4 h-4 mr-2" />
                        View Channel
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleUnsubscribe(subscription.channel._id)}
                      className="w-full"
                    >
                      <UserMinus className="w-4 h-4 mr-2" />
                      Unsubscribe
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No subscriptions yet</h3>
            <p className="text-muted-foreground mb-4">Start following creators to see their content here</p>
            <Link href="/">
              <Button>Discover Channels</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Upload, Video, ImageIcon, CheckCircle } from "lucide-react"
import { videoService } from "../services/api"
import { useAuth } from "../contexts/auth-context"

export default function UploadPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [thumbnail, setThumbnail] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const { user } = useAuth()
  const router = useRouter()

  if (!user) {
    router.push("/login")
    return null
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "video" | "thumbnail") => {
    const file = e.target.files?.[0]
    if (file) {
      if (type === "video") {
        setVideoFile(file)
      } else {
        setThumbnail(file)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setUploadProgress(0)

    if (!videoFile || !thumbnail) {
      setError("Both video file and thumbnail are required")
      setLoading(false)
      return
    }

    try {
      const formData = new FormData()
      formData.append("title", title)
      formData.append("description", description)
      formData.append("videoFile", videoFile)
      formData.append("thumbnail", thumbnail)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 500)

      await videoService.uploadVideo(formData)

      setUploadProgress(100)
      setSuccess(true)

      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } catch (error) {
      setError("Upload failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Upload Successful!</h2>
            <p className="text-muted-foreground mb-4">Your video has been uploaded successfully.</p>
            <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="w-6 h-6 mr-2" />
              Upload Video
            </CardTitle>
            <CardDescription>Share your content with the world</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {loading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter video title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your video"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="videoFile">Video File *</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="videoFile"
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleFileChange(e, "video")}
                    className="hidden"
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("videoFile")?.click()}
                    className="w-full"
                    disabled={loading}
                  >
                    <Video className="w-4 h-4 mr-2" />
                    {videoFile ? videoFile.name : "Choose Video File"}
                  </Button>
                </div>
                {videoFile && (
                  <p className="text-sm text-muted-foreground">
                    Size: {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="thumbnail">Thumbnail *</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="thumbnail"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "thumbnail")}
                    className="hidden"
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("thumbnail")?.click()}
                    className="w-full"
                    disabled={loading}
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    {thumbnail ? thumbnail.name : "Choose Thumbnail"}
                  </Button>
                </div>
                {thumbnail && (
                  <div className="mt-2">
                    <img
                      src={URL.createObjectURL(thumbnail) || "/placeholder.svg"}
                      alt="Thumbnail preview"
                      className="w-32 h-20 object-cover rounded border"
                    />
                  </div>
                )}
              </div>

              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !videoFile || !thumbnail || !title || !description}
                  className="flex-1"
                >
                  {loading ? "Uploading..." : "Upload Video"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

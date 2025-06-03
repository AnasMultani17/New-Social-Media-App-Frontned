/** @format */

"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Lock, ImageIcon, Save } from "lucide-react";
import Link from "next/link";
import { useAuth } from "../contexts/auth-context";
import { authService } from "../services/api";
import { Header } from "@/components/header";

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Account details state
  const [accountData, setAccountData] = useState({
    username: "",
    email: "",
    fullname: "",
    bio: "",
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // File states
  const [newAvatar, setNewAvatar] = useState<File | null>(null);
  const [newcoverimage, setNewcoverimage] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setAccountData({
        username: user.username || "",
        email: user.email || "",
        fullname: user.fullname || "",
        bio: user.bio || "",
      });
    }
  }, [user]);

  const handleAccountUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await authService.updateAccount(accountData);
      setSuccess("Account updated successfully!");
    } catch (error) {
      setError("Failed to update account");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await authService.changePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });
      setSuccess("Password changed successfully!");
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setError("Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handlecoverimageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewcoverimage(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleAvatarUpdate = async () => {
    if (!newAvatar) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("avatar", newAvatar);
      await authService.updateAvatar(formData);
      setSuccess("Avatar updated successfully!");
      setNewAvatar(null);
      setAvatarPreview(null);
      // Refresh the page to show updated avatar
      window.location.reload();
    } catch (error) {
      setError("Failed to update avatar");
    } finally {
      setLoading(false);
    }
  };

  const handlecoverimageUpdate = async () => {
    if (!newcoverimage) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("coverimage", newcoverimage);
      await authService.updatecoverimage(formData);
      setSuccess("Cover image updated successfully!");
      setNewcoverimage(null);
      setCoverPreview(null);
      // Refresh the page to show updated cover image
      window.location.reload();
    } catch (error) {
      setError("Failed to update cover image");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              Please log in to access your profile.
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

      <div className="container mx-auto max-w-4xl p-6">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="relative h-48 bg-gradient-to-r from-primary/20 to-primary/5 rounded-lg overflow-hidden">
            {coverPreview || user.coverimage ? (
              <img
                src={coverPreview || user.coverimage}
                alt="Cover"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-16 h-16 text-muted-foreground/30" />
              </div>
            )}
          </div>

          {/* User info positioned below cover image with avatar */}
          <div className="flex items-start space-x-6 mt-6">
            <Avatar className="w-24 h-24 border-4 border-background">
              <AvatarImage src={avatarPreview || user.avatar} />
              <AvatarFallback className="text-2xl">
                {user.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold">{user.username}</h1>
              <p className="text-muted-foreground">{user.email}</p>
              {user.fullname && (
                <p className="text-muted-foreground">{user.fullname}</p>
              )}
            </div>
          </div>
        </div>

        {/* Alerts */}
        {success && (
          <Alert className="mb-6">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Settings Tabs */}
        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="account">Account Details</TabsTrigger>
            <TabsTrigger value="images">Profile Images</TabsTrigger>
            <TabsTrigger value="password">Change Password</TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  Update your account details and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAccountUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={accountData.username}
                        onChange={(e) =>
                          setAccountData((prev) => ({
                            ...prev,
                            username: e.target.value,
                          }))
                        }
                        placeholder="Enter username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={accountData.email}
                        onChange={(e) =>
                          setAccountData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        placeholder="Enter email"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fullname">Full Name</Label>
                    <Input
                      id="fullname"
                      value={accountData.fullname}
                      onChange={(e) =>
                        setAccountData((prev) => ({
                          ...prev,
                          fullname: e.target.value,
                        }))
                      }
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={accountData.bio}
                      onChange={(e) =>
                        setAccountData((prev) => ({
                          ...prev,
                          bio: e.target.value,
                        }))
                      }
                      placeholder="Tell us about yourself"
                      rows={4}
                    />
                  </div>
                  <Button type="submit" disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="images">
            <div className="space-y-6">
              {/* Avatar Update */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Avatar</CardTitle>
                  <CardDescription>Update your profile picture</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={avatarPreview || user.avatar} />
                      <AvatarFallback>
                        {user.username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                        id="avatar-upload"
                      />
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            document.getElementById("avatar-upload")?.click()
                          }
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Choose Avatar
                        </Button>
                        {newAvatar && (
                          <Button
                            onClick={handleAvatarUpdate}
                            disabled={loading}
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Update Avatar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cover Image Update */}
              <Card>
                <CardHeader>
                  <CardTitle>Cover Image</CardTitle>
                  <CardDescription>
                    Update your profile cover image
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="aspect-video w-full max-w-md bg-muted rounded-lg overflow-hidden">
                      {coverPreview || user.coverimage ? (
                        <img
                          src={coverPreview || user.coverimage}
                          alt="Cover preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handlecoverimageChange}
                        className="hidden"
                        id="cover-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          document.getElementById("cover-upload")?.click()
                        }
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Choose Cover Image
                      </Button>
                      {newcoverimage && (
                        <Button
                          onClick={handlecoverimageUpdate}
                          disabled={loading}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Update Cover
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="oldPassword">Current Password</Label>
                    <Input
                      id="oldPassword"
                      type="password"
                      value={passwordData.oldPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          oldPassword: e.target.value,
                        }))
                      }
                      placeholder="Enter current password"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                        }))
                      }
                      placeholder="Enter new password"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      placeholder="Confirm new password"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={loading}>
                    <Lock className="w-4 h-4 mr-2" />
                    {loading ? "Changing..." : "Change Password"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
